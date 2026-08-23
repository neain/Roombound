// ============================================================
// ROOM SELECTION
// ============================================================

// Shared map/grid utilities used by box selection.
import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";


// ============================================================
// SELECTION STATE
// ============================================================

// The rooms currently selected by the user.
let selectedRooms = [];


// ============================================================
// SELECTION OPERATIONS
// ============================================================

// Returns every room currently selected.
export function getSelectedRooms() {
    return selectedRooms;
}

// Returns the first selected room, or null when nothing is selected.
//
// This preserves the existing single-room selection interface while the
// multi-selection system is being introduced.
export function getSelectedRoom() {
    return selectedRooms.length > 0
        ? selectedRooms[0]
        : null;
}

// Selects exactly one room and clears any previous selection.
export function selectRoom(room) {
    selectedRooms = [room];
}

// Adds a room to the current selection if it is not already selected.
export function addRoomToSelection(room) {
    if (selectedRooms.includes(room)) {
        return;
    }

    selectedRooms.push(room);
}

// Removes a room from the current selection.
export function removeRoomFromSelection(room) {
    selectedRooms =
        selectedRooms.filter(
            (selectedRoom) =>
                selectedRoom !== room
        );
}

// Clears the current selection.
export function clearRoomSelection() {
    selectedRooms = [];
}

// Returns whether a room is currently selected.
export function isRoomSelected(room) {
    return selectedRooms.includes(room);
}


// ============================================================
// BOX SELECTION
// ============================================================

// Begins a potential box selection over empty map space.
//
// The supplied interactionState object communicates whether the pointer
// movement became an actual drag. This allows the map click handler to ignore
// the click event generated after a completed box selection.
export function startBoxSelection(
    event,
    map,
    mapElement,
    zoom,
    currentFloor,
    interactionState
) {
    let startX;
    let startY;
    let currentX;
    let currentY;
    let isDragging = false;
    let shiftHeld = event.shiftKey;

    const selectionRectangle =
        document.createElement("div");

    const mapRect =
        mapElement.getBoundingClientRect();

    startX =
        event.clientX -
        mapRect.left +
        mapElement.scrollLeft;

    startY =
        event.clientY -
        mapRect.top +
        mapElement.scrollTop;

    currentX = startX;
    currentY = startY;

    selectionRectangle.classList.add(
        "room-selection-rectangle"
    );

    // Updates the temporary rectangle to match the current pointer position.
    function updateRectangle() {
        const left =
            Math.min(startX, currentX);

        const top =
            Math.min(startY, currentY);

        const width =
            Math.abs(currentX - startX);

        const height =
            Math.abs(currentY - startY);

        selectionRectangle.style.left =
            `${left}px`;

        selectionRectangle.style.top =
            `${top}px`;

        selectionRectangle.style.width =
            `${width}px`;

        selectionRectangle.style.height =
            `${height}px`;
    }

    // Tracks the pointer while the potential box selection is active.
    function move(event) {
        currentX =
            event.clientX -
            mapRect.left +
            mapElement.scrollLeft;

        currentY =
            event.clientY -
            mapRect.top +
            mapElement.scrollTop;

        if (
            !isDragging &&
            Math.abs(currentX - startX) <= 3 &&
            Math.abs(currentY - startY) <= 3
        ) {
            return;
        }

        if (!isDragging) {
            isDragging = true;
            interactionState.dragged = true;

            mapElement.classList.add(
                "room-box-selecting"
            );

            mapElement.appendChild(
                selectionRectangle
            );
        }

        updateRectangle();
    }

    // Finishes the box selection and applies the resulting room selection.
    function stop(event) {
        document.removeEventListener(
            "mousemove",
            move
        );

        document.removeEventListener(
            "mouseup",
            stop
        );

        mapElement.classList.remove(
            "room-box-selecting"
        );

        if (!isDragging) {
            return;
        }

        currentX =
            event.clientX -
            mapRect.left +
            mapElement.scrollLeft;

        currentY =
            event.clientY -
            mapRect.top +
            mapElement.scrollTop;

        updateRectangle();

        selectIntersectingRooms(
            map,
            mapElement,
            zoom,
            currentFloor,
            startX,
            startY,
            currentX,
            currentY,
            shiftHeld
        );

        selectionRectangle.remove();
    }

    document.addEventListener(
        "mousemove",
        move
    );

    document.addEventListener(
        "mouseup",
        stop
    );
}


// Selects every visible room whose map-space rectangle intersects the
// temporary selection rectangle.
function selectIntersectingRooms(
    map,
    mapElement,
    zoom,
    currentFloor,
    startX,
    startY,
    endX,
    endY,
    shiftHeld
) {
    const selectionLeft =
        Math.min(startX, endX);

    const selectionRight =
        Math.max(startX, endX);

    const selectionTop =
        Math.min(startY, endY);

    const selectionBottom =
        Math.max(startY, endY);

    // Normal box selection replaces the existing selection. Shift-box
    // selection leaves the existing selection intact.
    if (!shiftHeld) {
        clearRoomSelection();

        mapElement
            .querySelectorAll(".room-selected")
            .forEach(
                (element) => {
                    element.classList.remove(
                        "room-selected"
                    );
                }
            );
    }

    for (const room of map.rooms) {
        if (room.floor !== currentFloor) {
            continue;
        }

        const roomLeft =
            gridToWorldPixels(
                room.position.x,
                zoom
            );

        const roomTop =
            gridToWorldPixels(
                room.position.y,
                zoom
            );

        const roomRight =
            roomLeft +
            gridToPixels(
                room.size.width,
                zoom
            );

        const roomBottom =
            roomTop +
            gridToPixels(
                room.size.height,
                zoom
            );

        const intersects =
            roomLeft <= selectionRight &&
            roomRight >= selectionLeft &&
            roomTop <= selectionBottom &&
            roomBottom >= selectionTop;

        if (!intersects) {
            continue;
        }

        addRoomToSelection(room);
    }

    // Apply the resulting selection state to the visible room elements.
    mapElement
        .querySelectorAll(".room")
        .forEach(
            (element) => {
                const room =
                    map.rooms.find(
                        (candidate) =>
                            candidate.roomID ===
                            element.dataset.roomId
                    );

                if (!room) {
                    return;
                }

                element.classList.toggle(
                    "room-selected",
                    isRoomSelected(room)
                );
            }
        );
}