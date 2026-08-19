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

// Connection creation and editing.
// CURRENT: openConnectionEditor()
// FUTURE: Connection editing UI and connection property editing.
// If working on connection editing, inspect:
//   ./connectionEditor.js
import { openConnectionEditor } from "./connectionEditor.js";


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

// Default room-name font size before any room-specific adjustment.
const DEFAULT_ROOM_TEXT_SIZE = 16;

// The room currently selected by the user.
let selectedRoom = null;

// The single room editor instance currently displayed, if any.
let roomEditor = null;

// Container holding the fields inside the room editor.
let editorContent = null;

// Last saved screen position of the room editor.
let editorPosition = null;

// Tracks whether the selected room was created specifically for the current
// editor session. This allows Cancel to remove a newly created room.
let isNewRoom = false;

// Map/rendering information needed by the editor when it needs to modify the
// selected room or redraw the map.
let editorContext = null;




// ============================================================
// ROOM RENDERING
// ============================================================

// Determines the largest font size that allows a room's name to fit inside
// the room without overflowing. The browser's normal word wrapping is used,
// so individual words are never manually split.
function calculateRoomTextSize(room) {
    const roomElement = document.createElement("div");
    let textSize;
    let roomWidth;
    let roomHeight;
    let fits;
    let fitsAtDefaultSize;

    roomWidth = gridToPixels(room.size.width);
    roomHeight = gridToPixels(room.size.height);

    roomElement.classList.add("room");

    roomElement.textContent = room.name;

    roomElement.style.width = `${roomWidth}px`;
    roomElement.style.height = `${roomHeight}px`;
    roomElement.style.position = "absolute";
    roomElement.style.visibility = "hidden";
    roomElement.style.pointerEvents = "none";
    roomElement.style.left = "-10000px";
    roomElement.style.top = "0";

    document.body.appendChild(roomElement);

    roomElement.style.fontSize =
        `${DEFAULT_ROOM_TEXT_SIZE}px`;

    fitsAtDefaultSize =
        roomElement.scrollWidth <= roomElement.clientWidth &&
        roomElement.scrollHeight <= roomElement.clientHeight;

    if (fitsAtDefaultSize) {
        document.body.removeChild(roomElement);
        return DEFAULT_ROOM_TEXT_SIZE;
    }

    for (
        textSize = DEFAULT_ROOM_TEXT_SIZE;
        textSize > 1;
        textSize--
    ) {
        roomElement.style.fontSize = `${textSize}px`;

        fits =
            roomElement.scrollWidth <= roomElement.clientWidth &&
            roomElement.scrollHeight <= roomElement.clientHeight;

        if (fits) {
            break;
        }
    }

    document.body.removeChild(roomElement);

    return Math.max(1, textSize - 1);
}

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

        roomElement.textContent = room.name;

        roomElement.addEventListener(
            "mouseenter",
            (event) => {
                roomTooltip.textContent = getRoomHoverInfo(room);

                roomTooltip.style.left = `${event.clientX + 10}px`;
                roomTooltip.style.top = `${event.clientY + 10}px`;
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
            `${(room.textSize ?? DEFAULT_ROOM_TEXT_SIZE) * zoom}px`;

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
        textSize: DEFAULT_ROOM_TEXT_SIZE
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

    // Mark this as a newly created room so Cancel can remove it.
    isNewRoom = true;

    selectRoom(
        room,
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
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

    // Remove the room
    map.rooms.splice(roomIndex, 1);

    // Remove every connection that points to this room
    // (either as roomA or roomB)
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
// ROOM SELECTION
// ============================================================

// Returns the room currently selected by the user, or null when no room is
// selected.
export function getSelectedRoom() {
    return selectedRoom;
}

// Selects a room and opens or updates the room editor for it.
//
// The editor keeps a reference to the selected room rather than creating a
// separate copy. Save/Cancel behavior is therefore handled by the editor's
// existing state and lifecycle.
function selectRoom(
    room,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    selectedRoom = room;

    // Store the map/rendering context so editor actions such as Cancel can
    // delete a newly created room and redraw the map.
    editorContext = {
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    };

    // Create the editor the first time a room is selected.
    if (!roomEditor) {
        const editorHeader = document.createElement("div");
        const editorTitle = document.createElement("span");
        const closeButton = document.createElement("button");
        const editorButtons = document.createElement("div");
        const saveButton = document.createElement("button");
        const editConnectionsButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const cancelButton = document.createElement("button");

        roomEditor = document.createElement("div");
        roomEditor.classList.add("room-editor");

        roomEditor.style.width =
            `${map.editorSize.width}px`;

        roomEditor.style.height =
            `${map.editorSize.height}px`;

        // --------------------------------------------------------
        // Editor header
        // --------------------------------------------------------

        editorHeader.classList.add("room-editor-header");

        editorTitle.textContent = "Room Editor";

        closeButton.textContent = "×";
        closeButton.classList.add("room-editor-close");

        closeButton.addEventListener(
            "click",
            cancelRoomEditor
        );

        editorHeader.appendChild(editorTitle);
        editorHeader.appendChild(closeButton);

        // --------------------------------------------------------
        // Editor content
        // --------------------------------------------------------

        editorContent = document.createElement("div");
        editorContent.classList.add("room-editor-content");

        roomEditor.appendChild(editorHeader);
        roomEditor.appendChild(editorContent);

        // --------------------------------------------------------
        // Editor buttons
        // --------------------------------------------------------

        editorButtons.classList.add("room-editor-buttons");

        saveButton.textContent = "Save";
        saveButton.classList.add("room-editor-save");

        editConnectionsButton.textContent = "Edit Connections";
        editConnectionsButton.classList.add(
            "room-editor-edit-connections"
        );

        deleteButton.textContent = "Delete";
        deleteButton.classList.add("room-editor-delete");

        cancelButton.textContent = "Cancel";
        cancelButton.classList.add("room-editor-cancel");

        saveButton.addEventListener("click", saveRoomEditor);

        editConnectionsButton.addEventListener("click", () => {
            openConnectionEditor(
                editorContext.map,
                selectedRoom,
                editorContext.mapElement,
                editorContext.connectionLayer,
                editorContext.zoom,
                editorContext.currentFloor
            );
        });

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete room "${selectedRoom.name}"?\n\nThis will also remove any connections attached to it.`
            );

            if (!selectedRoom) {
                return;
            }

            if (!confirmed) {
                return;
            }

            deleteRoom(
                editorContext.map,
                selectedRoom.roomID,
                editorContext.mapElement,
                editorContext.connectionLayer,
                editorContext.zoom,
                editorContext.currentFloor
            );

            isNewRoom = false;
            closeRoomEditor();
        });

        cancelButton.addEventListener("click", cancelRoomEditor);

        editorButtons.appendChild(saveButton);
        editorButtons.appendChild(editConnectionsButton);
        editorButtons.appendChild(deleteButton);
        editorButtons.appendChild(cancelButton);

        roomEditor.appendChild(editorButtons);

        document.body.appendChild(roomEditor);

        // Restore the editor's last saved screen position when possible.
        if (editorPosition) {
            roomEditor.style.left =
                `${editorPosition.x}px`;

            roomEditor.style.top =
                `${editorPosition.y}px`;

            roomEditor.style.right = "auto";
        }

        // Allow the editor to be repositioned by dragging its header.
        startEditorDragging(editorHeader);

        // Provide keyboard shortcuts for saving/canceling the editor.
        editorContent.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRoomEditor();
                    return;
                }

                if (event.key !== "Enter") {
                    return;
                }

                // Enter should still create a newline inside the notes field.
                if (event.target.tagName === "TEXTAREA") {
                    return;
                }

                event.preventDefault();
                saveRoomEditor();
            }
        );
    }

    // Every room can remember its preferred editor dimensions.
    roomEditor.style.width =
        `${map.editorSize.width}px`;

    roomEditor.style.height =
        `${map.editorSize.height}px`;

    updateRoomEditor();
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
// ROOM EDITOR
// ============================================================

// Saves the current contents of the room editor back into the selected room.
//
// The room name's font size is recalculated from the room's current name and
// dimensions so the saved value always reflects the latest room state.
function saveRoomEditor() {
    const inputs = editorContent.querySelectorAll("input");
    const textarea = editorContent.querySelector("textarea");

    for (const input of inputs) {
        const key =
            input.previousElementSibling.textContent
                .replace(": ", "");

        if (key === "floor") {
            selectedRoom.floor = Number(input.value) || 1;
        } else {
            selectedRoom[key] = input.value;
        }
    }

    selectedRoom.notes = textarea.value;

    // Recalculate the room-name font size using the newly saved room data.
    selectedRoom.textSize =
        calculateRoomTextSize(selectedRoom);

    editorContext.map.editorSize = {
        width: roomEditor.offsetWidth,
        height: roomEditor.offsetHeight
    };
    
    isNewRoom = false;

    editorPosition = {
        x: roomEditor.offsetLeft,
        y: roomEditor.offsetTop
    };

    // Re-apply floor filter so a room moved to another floor disappears
    renderRooms(
        editorContext.map,
        editorContext.mapElement,
        editorContext.connectionLayer,
        editorContext.zoom,
        editorContext.currentFloor
    );

    renderConnections({
        map: editorContext.map,
        connectionLayer: editorContext.connectionLayer,
        zoom: editorContext.zoom,
        currentFloor: editorContext.currentFloor
    });

    closeRoomEditor();
}

// Cancels the current room editing session.
//
// Newly created rooms are removed entirely when their initial editor session
// is canceled. Existing rooms are simply left unchanged.
function cancelRoomEditor() {
    if (isNewRoom) {
        deleteRoom(
            editorContext.map,
            selectedRoom.roomID,
            editorContext.mapElement,
            editorContext.connectionLayer,
            editorContext.zoom,
            editorContext.currentFloor
        );
    }

    isNewRoom = false;

    closeRoomEditor();
}

// Removes the current room editor and clears its associated state.
function closeRoomEditor() {
    roomEditor.remove();

    roomEditor = null;
    editorContent = null;
    selectedRoom = null;
}

// Rebuilds the contents of the room editor from the currently selected room.
//
// Editable fields such as name, floor, and notes receive form controls.
// Structural properties remain visible as read-only information when they
// are not listed in hoverExceptions.
function updateRoomEditor() {
    editorContent.innerHTML = "";

    for (const [key, value] of Object.entries(selectedRoom)) {
        if (hoverExceptions.includes(key)) {
            continue;
        }

        // Standard editable single-value fields.
        if (key === "name" || key === "floor") {
            const fieldContainer = document.createElement("div");
            const label = document.createElement("label");
            const input = document.createElement("input");

            fieldContainer.classList.add("room-editor-field");

            label.textContent = `${key}: `;

            input.type = "text";
            input.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            editorContent.appendChild(fieldContainer);

            continue;
        }

        // Notes use a textarea so multiple lines can be entered.
        if (key === "notes") {
            const fieldContainer = document.createElement("div");
            const label = document.createElement("label");
            const textarea = document.createElement("textarea");

            fieldContainer.classList.add("room-editor-notes");

            label.textContent = "notes: ";

            textarea.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(textarea);
            editorContent.appendChild(fieldContainer);

            continue;
        }

        // Remaining non-editable room properties are displayed as plain text.
        const field = document.createElement("div");

        field.textContent = `${key}: ${value}`;

        editorContent.appendChild(field);
    }
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


// ============================================================
// EDITOR DRAGGING
// ============================================================

// Adds dragging behavior to the room editor's header.
//
// This is separate from room dragging because the editor is a screen-space
// UI element rather than a map-space object.
function startEditorDragging(editorHeader) {
    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    // Records the mouse/editor positions when the header is grabbed.
    function startDrag(event) {
        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startEditorX = roomEditor.offsetLeft;
        startEditorY = roomEditor.offsetTop;

        document.addEventListener(
            "mousemove",
            drag
        );

        document.addEventListener(
            "mouseup",
            stopDrag
        );
    }

    // Moves the editor to follow the mouse.
    function drag(event) {
        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        roomEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        roomEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        roomEditor.style.right = "auto";
    }

    // Removes the temporary drag listeners when the editor is released.
    function stopDrag() {
        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDrag
        );
    }

    editorHeader.addEventListener(
        "mousedown",
        startDrag
    );
}