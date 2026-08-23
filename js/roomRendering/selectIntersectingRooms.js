import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

import {
    clearRoomSelection,
    addRoomToSelection,
    isRoomSelected
} from "../roomRenderer.js";

// Selects every visible room whose map-space rectangle intersects the
// temporary selection rectangle.
export function selectIntersectingRooms(
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