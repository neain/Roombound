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
// object being dragged should move by itself or with the entire selection.
import {
    getSelectedRooms
} from "../roomRenderer.js";


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
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    let draggedRooms;
    let startPositions;
    let roomElements;
    let groupElements;
    let startGroupPositions;
    let hasDragged = false;

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

    // Updates every dragged room and group using the same grid-space delta.
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

        // Apply the exact same grid delta to every room represented by the
        // dragged room/group selection.
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

        // Move each selected group's stored position by the same delta as its
        // member rooms. The group's stored size never changes while dragging.
        for (const [group, groupElement] of groupElements) {
            const startGroupPosition =
                startGroupPositions.get(group);

            group.position.x =
                startGroupPosition.x + deltaGridX;

            group.position.y =
                startGroupPosition.y + deltaGridY;

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