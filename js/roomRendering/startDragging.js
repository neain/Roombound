// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: gridToWorldPixels(), pixelsToGrid()
// If working on room coordinates or grid conversion, inspect:
//   ../mapUtils.js
import {
    gridToWorldPixels,
    pixelsToGrid
} from "../mapUtils.js";

// Connection rendering.
// CURRENT: renderConnections()
// If changing how room movement affects connection geometry, inspect:
//   ../connectionRenderer.js
import {
    renderConnections
} from "../connectionRenderer.js";

// Shared room-rendering helpers.
// CURRENT: roomTooltip
// If changing shared room rendering state or tooltip behavior, inspect:
//   ./rendererHelper.js
import {
    roomTooltip
} from "../roomRenderer.js";

// Room selection state.
// The dragging system uses the current selection to determine whether the
// room being dragged should move by itself or with the entire selection.
import {
    getSelectedRooms
} from "../roomRenderer.js";


// ============================================================
// ROOM DRAGGING
// ============================================================

// Moves a room, or the current room selection, while the left mouse button
// is held down.
//
// Mouse movement is converted into one grid-space delta. That same delta is
// applied to every selected room so their relative positions remain intact.
export function startDragging(
    event,
    room,
    roomElement,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    let draggedRooms;
    let startPositions;
    let roomElements;
    let hasDragged = false;

    if (event.button !== 0) {
        return;
    }

    event.preventDefault();

    roomTooltip.style.display = "none";

    // BEGIN EDIT — MULTI-ROOM DRAGGING

    // Only drag the entire selection when the room being grabbed is already
    // selected. Otherwise the room behaves as a normal single-room drag.
    draggedRooms =
        getSelectedRooms().includes(room)
            ? [...getSelectedRooms()]
            : [room];

    // Store every room's original position before movement begins. The mouse
    // delta is calculated once and applied against these original positions.
    startPositions =
        draggedRooms.map(
            (draggedRoom) => ({
                room: draggedRoom,
                x: draggedRoom.position.x,
                y: draggedRoom.position.y
            })
        );

    // Store the visible element for every dragged room so their positions can
    // be updated without repeatedly searching the DOM during mouse movement.
    roomElements = new Map();

    for (const draggedRoom of draggedRooms) {
        if (draggedRoom === room) {
            roomElements.set(
                draggedRoom,
                roomElement
            );

            continue;
        }

        const draggedRoomElement =
            mapElement.querySelector(
                `.room[data-room-id="${draggedRoom.roomID}"]`
            );

        if (draggedRoomElement) {
            roomElements.set(
                draggedRoom,
                draggedRoomElement
            );
        }
    }

    // Updates every dragged room using the same grid-space delta.
    function drag(event) {
        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        if (mouseDeltaX !== 0 || mouseDeltaY !== 0) {
            hasDragged = true;
        }

        const deltaGridX =
            pixelsToGrid(mouseDeltaX, zoom);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY, zoom);

        // Apply the exact same grid delta to every room in the selection.
        for (const startPosition of startPositions) {
            startPosition.room.position.x =
                startPosition.x + deltaGridX;

            startPosition.room.position.y =
                startPosition.y + deltaGridY;
        }

        // Update the visible position of every dragged room.
        for (const startPosition of startPositions) {
            const draggedRoom =
                startPosition.room;

            const draggedRoomElement =
                roomElements.get(draggedRoom);

            if (!draggedRoomElement) {
                continue;
            }

            draggedRoomElement.style.left =
                `${gridToWorldPixels(
                    draggedRoom.position.x,
                    zoom
                )}px`;

            draggedRoomElement.style.top =
                `${gridToWorldPixels(
                    draggedRoom.position.y,
                    zoom
                )}px`;
        }

        // Connections depend on room positions, so they need to be redrawn
        // while the selection is being moved.
        renderConnections({
            map,
            connectionLayer,
            zoom,
            currentFloor
        });
    }

    // END EDIT — MULTI-ROOM DRAGGING

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

        if (hasDragged) {
            roomElement.dataset.dragged = "true";
        }

        if (draggedRooms.length === 1) {
            console.log(
                `Moved ${room.name} to`,
                room.position
            );

            return;
        }

        console.log(
            `Moved ${draggedRooms.length} rooms`
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