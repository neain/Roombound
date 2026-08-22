// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: GRID_SIZE, MAP_ORIGIN, gridToPixels(), gridToWorldPixels(),
//          pixelsToGrid()
// FUTURE: Additional room-position/grid utilities should come from here
//         rather than being duplicated in this file.
// If working on room coordinates, dimensions, or grid conversion, inspect:
//   ./mapUtils.js
import {
    GRID_SIZE,
    MAP_ORIGIN,
    gridToPixels,
    gridToWorldPixels,
    pixelsToGrid
} from "./mapUtils.js";

// Connection rendering and connection geometry.
// CURRENT: renderConnections()
// If changing how room movement/creation/deletion affects connections, inspect:
//   ./connectionRenderer.js
import { renderConnections } from "./connectionRenderer.js";

// Room editor.
// CURRENT: selectRoom()
// If changing room editor behavior, inspect:
//   ./roomEditor.js
import { getSelectedRoom, selectRoom } from "./roomEditor.js";


// ============================================================
// ROOM STATE
// ============================================================

// Room properties that should not be displayed in the room tooltip or editor.
// These are structural/internal properties rather than normal room details.
const hoverExceptions = [
    "roomID",
    "connections",
    "position",
    "size",
    "editorSize",
    "textSize"
];

// Shared tooltip used when hovering over rooms.
const roomTooltip = document.createElement("div");


// ============================================================
// ROOM RENDERING
// ============================================================

// Removes the current room elements and redraws every room in the map.
//
// The room data itself is not modified here. This function only converts the
// current map data into visible room elements.
export function renderRooms(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    if (!roomTooltip.parentElement) {
        roomTooltip.classList.add("room-tooltip");
        mapElement.appendChild(roomTooltip);
    }

    // Rendering is currently done by rebuilding the room elements from the
    // map data. This keeps the displayed rooms synchronized with the data.
    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

    for (const room of map.rooms) {
        const roomElement = document.createElement("div");

        if (room.floor !== currentFloor) {
            continue;
        }

        roomElement.classList.add("room");
        roomElement.dataset.roomId = room.roomID;

        if (room === getSelectedRoom()) {
           roomElement.classList.add("room-selected");
        }

        roomElement.textContent = room.name;

        roomElement.addEventListener(
            "mouseenter",
            (event) => {
                roomTooltip.textContent = getRoomHoverInfo(room);

                roomTooltip.style.left =
                    `${event.clientX + 10}px`;

                roomTooltip.style.top =
                    `${event.clientY + 10}px`;

                roomTooltip.style.display = "block";
            }
        );

        roomElement.addEventListener(
            "mouseleave",
            () => {
                roomTooltip.style.display = "none";
            }
        );

        // Position and size are stored in grid coordinates but displayed in
        // world pixels, with the current zoom applied.
        roomElement.style.left =
            `${gridToWorldPixels(room.position.x, zoom)}px`;

        roomElement.style.top =
            `${gridToWorldPixels(room.position.y, zoom)}px`;

        roomElement.style.width =
            `${gridToPixels(room.size.width, zoom)}px`;

        roomElement.style.height =
            `${gridToPixels(room.size.height, zoom)}px`;

        // Older maps may not have a stored text size yet. Those rooms use the
        // default size until they are saved again.
        roomElement.style.fontSize =
            `${(room.textSize ?? 16) * zoom}px`;

        roomElement.addEventListener(
            "mousedown",
            (event) => {
                startDragging(
                    event,
                    room,
                    roomElement,
                    map,
                    connectionLayer,
                    zoom,
                    currentFloor
                );
            }
        );

        roomElement.addEventListener(
            "click",
            () => {
                selectRoom(
                    room,
                    map,
                    mapElement,
                    connectionLayer,
                    zoom,
                    currentFloor
                );

                mapElement
                    .querySelectorAll(".room")
                    .forEach(
                        (element) => {
                            element.classList.remove(
                                "room-selected"
                            );
                        }
                    );

                roomElement.classList.add(
                    "room-selected"
                );
            }
        );

        mapElement.appendChild(roomElement);
    }
}


// ============================================================
// ROOM CREATION / DELETION
// ============================================================

// Creates a new room centered on the currently visible portion of the map.
//
// The new room is added to the map immediately, then selected so the room
// editor can be used to finish configuring it.
export function createRoom(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    let highestRoomNumber = 0;
    let roomNumber;
    let centerX;
    let centerY;
    let worldX;
    let worldY;
    let room;

    for (const room of map.rooms) {
        const match = room.roomID.match(/^room_(\d+)$/);

        if (!match) {
            continue;
        }

        highestRoomNumber =
            Math.max(
                highestRoomNumber,
                Number(match[1])
            );
    }

    roomNumber =
        String(highestRoomNumber + 1).padStart(3, "0");

    // Determine the center of the currently visible map area.
    centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;

    centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;

    // Convert that screen position back into map grid coordinates.
    worldX =
        (centerX - MAP_ORIGIN * zoom) /
        (GRID_SIZE * zoom);

    worldY =
        (centerY - MAP_ORIGIN * zoom) /
        (GRID_SIZE * zoom);

    // Rooms are currently created at a fixed 5x5 grid size and positioned so
    // their center is approximately at the center of the visible map.
    room = {
        roomID: `room_${roomNumber}`,
        name: "New Room",
        floor: currentFloor,
        notes: "",
        connections: [],
        position: {
            x: Math.round(worldX - 2.5),
            y: Math.round(worldY - 2.5)
        },
        size: {
            width: 5,
            height: 5
        },
        textSize: 16
    };

    map.rooms.push(room);

    // Redraw both rooms and connections so the new room appears immediately.
    renderRooms(
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    );

    renderConnections({
        map,
        connectionLayer,
        zoom,
        currentFloor
    });

    // Select the new room and tell the editor that it is a new-room session.
    selectRoom(
        room,
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor,
        true
    );
}

// Deletes a room from the map by ID and removes any connections that
// reference it. Then redraws the affected map elements.
//
// If the requested room does not exist, nothing happens.
export function deleteRoom(
    map,
    roomID,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const roomIndex = map.rooms.findIndex(
        (room) => room.roomID === roomID
    );

    if (roomIndex === -1) {
        return;
    }

    // Remove the room.
    map.rooms.splice(roomIndex, 1);

    // Remove every connection that points to this room
    // (either as roomA or roomB).
    map.connections = map.connections.filter(
        (conn) => conn.roomA !== roomID && conn.roomB !== roomID
    );

    renderRooms(
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    );

    renderConnections({
        map,
        connectionLayer,
        zoom,
        currentFloor
    });
}


// ============================================================
// ROOM TOOLTIP
// ============================================================

// Builds the information shown when the mouse hovers over a room.
//
// Internal/structural room properties listed in hoverExceptions are omitted.
function getRoomHoverInfo(room) {
    return Object.entries(room)
        .filter(([key]) => !hoverExceptions.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
}


// ============================================================
// ROOM DRAGGING
// ============================================================

// Moves a room while the left mouse button is held down.
//
// The room's position remains stored in grid coordinates. Mouse movement is
// converted into grid movement so rooms continue to snap to the grid.
export function startDragging(
    event,
    room,
    roomElement,
    map,
    connectionLayer,
    zoom,
    currentFloor
) {
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startRoomX = room.position.x;
    const startRoomY = room.position.y;

    event.preventDefault();

    if (event.button !== 0) {
        return;
    }

    roomTooltip.style.display = "none";

    // Updates the room position while the mouse is moving.
    function drag(event) {
        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        const deltaGridX =
            pixelsToGrid(mouseDeltaX, zoom);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY, zoom);

        room.position.x =
            startRoomX + deltaGridX;

        room.position.y =
            startRoomY + deltaGridY;

        roomElement.style.left =
            `${gridToWorldPixels(room.position.x, zoom)}px`;

        roomElement.style.top =
            `${gridToWorldPixels(room.position.y, zoom)}px`;

        // Connections depend on room positions, so they need to be redrawn
        // while the room is being moved.
        renderConnections({
            map,
            connectionLayer,
            zoom,
            currentFloor
        });
    }

    // Removes the temporary mouse listeners when dragging ends.
    function stopDragging() {
        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDragging
        );

        console.log(
            `Moved ${room.name} to`,
            room.position
        );
    }

    document.addEventListener(
        "mousemove",
        drag
    );

    document.addEventListener(
        "mouseup",
        stopDragging
    );
}