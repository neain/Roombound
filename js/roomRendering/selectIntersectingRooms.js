import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

import {
    clearRoomSelection,
    addRoomToSelection,
    removeRoomFromSelection,
    isRoomSelected
} from "../roomRenderer.js";

// Selects every visible room or group whose map-space rectangle intersects the
// temporary selection rectangle. When a group is selected, its member rooms
// are removed from the selection so the group represents them.
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

    // Select every intersecting room.
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

    // Select every intersecting group.
    for (const group of map.groups) {
        if (group.floor !== currentFloor) {
            continue;
        }

        const groupRooms =
            group.roomIDs
                .map(
                    (roomID) =>
                        map.rooms.find(
                            (room) =>
                                room.roomID === roomID
                        )
                )
                .filter(
                    (room) => room
                );

        if (groupRooms.length === 0) {
            continue;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const room of groupRooms) {
            minX = Math.min(
                minX,
                room.position.x
            );

            minY = Math.min(
                minY,
                room.position.y
            );

            maxX = Math.max(
                maxX,
                room.position.x +
                room.size.width
            );

            maxY = Math.max(
                maxY,
                room.position.y +
                room.size.height
            );
        }

        const groupLeft =
            gridToWorldPixels(
                minX,
                zoom
            );

        const groupTop =
            gridToWorldPixels(
                minY,
                zoom
            );

        const groupRight =
            gridToWorldPixels(
                maxX,
                zoom
            );

        const groupBottom =
            gridToWorldPixels(
                maxY,
                zoom
            );

        const intersects =
            groupLeft <= selectionRight &&
            groupRight >= selectionLeft &&
            groupTop <= selectionBottom &&
            groupBottom >= selectionTop;

        if (!intersects) {
            continue;
        }

        addRoomToSelection(group);
    }

    // BEGIN EDIT
    // Groups take precedence over their member rooms. Any room belonging to a
    // selected group is removed from the selection after all room-like objects
    // have been evaluated.
    const selectedGroups =
        map.groups.filter(
            (group) =>
                isRoomSelected(group)
        );

    for (const group of selectedGroups) {
        for (const roomID of group.roomIDs) {
            const room =
                map.rooms.find(
                    (candidate) =>
                        candidate.roomID === roomID
                );

            if (!room) {
                continue;
            }

            if (isRoomSelected(room)) {
                removeRoomFromSelection(room);
            }
        }
    }
    // END EDIT

    // Apply the resulting selection state to the visible room and group
    // elements.
    mapElement
        .querySelectorAll(".room, .group")
        .forEach(
            (element) => {
                let roomLikeObject = null;

                if (
                    element.classList.contains(
                        "room"
                    )
                ) {
                    roomLikeObject =
                        map.rooms.find(
                            (room) =>
                                room.roomID ===
                                element.dataset.roomId
                        );
                } else if (
                    element.classList.contains(
                        "group"
                    )
                ) {
                    roomLikeObject =
                        map.groups.find(
                            (group) =>
                                group.groupID ===
                                element.dataset.groupId
                        );
                }

                if (!roomLikeObject) {
                    return;
                }

                element.classList.toggle(
                    "room-selected",
                    isRoomSelected(
                        roomLikeObject
                    )
                );
            }
        );
}