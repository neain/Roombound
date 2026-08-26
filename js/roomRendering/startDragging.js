// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: gridToWorldPixels(), gridToPixels(), pixelsToGrid()
// If working on room coordinates or grid conversion, inspect:
//   ../mapUtils.js
import {
    gridToWorldPixels,
    gridToPixels,
    pixelsToGrid,
    GRID_SIZE
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
// object being dragged should move by itself or with the entire selection.
import {
    getSelectedRooms
} from "../roomRenderer.js";

import {
    getDefaultSnapToGrid
} from "../options.js";


// ============================================================
// ROOM / GROUP DRAGGING
// ============================================================

// Moves a room, group, or the current selection while the left mouse button
// is held down.
//
// Groups store their own position and size. Dragging a group moves its member
// rooms and its stored position by the same grid-space delta. Group size does
// not change during movement.
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
    let startMouseX = event.clientX;
    let startMouseY = event.clientY;
    let draggedRooms;
    let startPositions;
    let roomElements;
    let groupElements;
    let startGroupPositions;
    let hasDragged = false;
    let snapToGrid =
        getDefaultSnapToGrid() !== event.shiftKey;

    if (event.button !== 0) {
        return;
    }

    event.preventDefault();

    roomTooltip.style.display = "none";

    // A group is represented visually by its member rooms. Convert a group
    // into those rooms before building the actual movement list.
    function getObjectRooms(object) {
        if (map.rooms.includes(object)) {
            return [object];
        }

        if (map.groups.includes(object)) {
            return map.rooms.filter(
                (mapRoom) =>
                    object.roomIDs.includes(
                        mapRoom.roomID
                    )
            );
        }

        return [];
    }

    // Expand the selected room-like objects into the actual rooms that must
    // move. A Set prevents rooms shared by multiple selected groups from being
    // moved more than once.
    const selectedObjects =
        getSelectedRooms().includes(room)
            ? [...getSelectedRooms()]
            : [room];

    const draggedRoomSet =
        new Set();

    for (const selectedObject of selectedObjects) {
        for (const draggedRoom of getObjectRooms(selectedObject)) {
            draggedRoomSet.add(draggedRoom);
        }
    }

    draggedRooms =
        [...draggedRoomSet];

    // Store every room's original position before movement begins. These
    // positions are also updated if the snapping mode changes during a drag.
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

    // Store the visible element and original position for every selected
    // group. The group's stored position moves with its member rooms while
    // its stored size remains unchanged.
    groupElements = new Map();
    startGroupPositions = new Map();

    for (const selectedObject of selectedObjects) {
        if (!map.groups.includes(selectedObject)) {
            continue;
        }

        const groupElement =
            mapElement.querySelector(
                `.group[data-group-id="${selectedObject.groupID}"]`
            );

        if (groupElement) {
            groupElements.set(
                selectedObject,
                groupElement
            );

            startGroupPositions.set(
                selectedObject,
                {
                    x: selectedObject.position.x,
                    y: selectedObject.position.y
                }
            );
        }
    }

    // Updates the drag baseline so changing the snapping mode does not cause
    // the objects to jump to a new position.
    function resetDragBaseline(
        mouseX,
        mouseY
    ) {
        startMouseX = mouseX;
        startMouseY = mouseY;

        for (const startPosition of startPositions) {
            startPosition.x =
                startPosition.room.position.x;

            startPosition.y =
                startPosition.room.position.y;
        }

        for (const [group] of groupElements) {
            startGroupPositions.set(
                group,
                {
                    x: group.position.x,
                    y: group.position.y
                }
            );
        }
    }

    // Updates every dragged room and group using the same grid-space delta.
    function drag(event) {
        const currentSnapToGrid =
            getDefaultSnapToGrid() !== event.shiftKey;

        // Shift changed the snapping mode during the drag. Start a new
        // movement segment from the objects' current positions.
        if (currentSnapToGrid !== snapToGrid) {
            snapToGrid = currentSnapToGrid;

            resetDragBaseline(
                event.clientX,
                event.clientY
            );

            return;
        }

        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        if (mouseDeltaX !== 0 || mouseDeltaY !== 0) {
            hasDragged = true;
        }

        const deltaGridX =
            mouseDeltaX / (GRID_SIZE * zoom);

        const deltaGridY =
            mouseDeltaY / (GRID_SIZE * zoom);

        // Apply the same movement to every dragged room. When snapping is
        // enabled, snap the resulting position rather than the movement delta
        // so rooms always return to actual integer grid coordinates.
        for (const startPosition of startPositions) {
            const newX =
                startPosition.x + deltaGridX;

            const newY =
                startPosition.y + deltaGridY;

            startPosition.room.position.x =
                snapToGrid
                    ? Math.round(newX)
                    : newX;

            startPosition.room.position.y =
                snapToGrid
                    ? Math.round(newY)
                    : newY;
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

        // Move each selected group's stored position by the same movement as
        // its member rooms. The group's stored size never changes while
        // dragging.
        for (const [group, groupElement] of groupElements) {
            const startGroupPosition =
                startGroupPositions.get(group);

            const newX =
                startGroupPosition.x + deltaGridX;

            const newY =
                startGroupPosition.y + deltaGridY;

            group.position.x =
                snapToGrid
                    ? Math.round(newX)
                    : newX;

            group.position.y =
                snapToGrid
                    ? Math.round(newY)
                    : newY;

            groupElement.style.left =
                `${gridToWorldPixels(
                    group.position.x,
                    zoom
                )}px`;

            groupElement.style.top =
                `${gridToWorldPixels(
                    group.position.y,
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

        if (selectedObjects.length === 1) {
            if (map.groups.includes(selectedObjects[0])) {
                console.log(
                    `Moved group ${selectedObjects[0].groupID}`
                );
            } else {
                console.log(
                    `Moved ${selectedObjects[0].name} to`,
                    selectedObjects[0].position
                );
            }

            return;
        }

        console.log(
            `Moved ${selectedObjects.length} selected objects`
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