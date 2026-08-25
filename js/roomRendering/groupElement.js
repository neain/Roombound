// ============================================================
// GROUP ELEMENT
// ============================================================

// Creates the visible DOM element representing a group.
//
// The group's position and size are derived from the bounding rectangle of
// its member rooms. Group data stores only the information that cannot be
// derived from those rooms.
import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

import {
    isRoomSelected,
    addRoomToSelection,
    selectRoom,
    removeRoomFromSelection
} from "../roomRenderer.js";


// Creates the visible map element for a group.
//
// Groups intentionally behave like rooms for map interaction. The group
// element is rendered after its member rooms so it becomes the interaction
// surface for the entire group.
export function createGroupElement(
    group,
    map,
    mapElement,
    zoom
) {
    const groupElement = document.createElement("div");
    const groupRooms = [];

    for (const roomID of group.roomIDs) {
        const room = map.rooms.find(
            (mapRoom) => mapRoom.roomID === roomID
        );

        if (room) {
            groupRooms.push(room);
        }
    }

    if (groupRooms.length === 0) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const room of groupRooms) {
        const roomRight =
            room.position.x + room.size.width;

        const roomBottom =
            room.position.y + room.size.height;

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
            roomRight
        );

        maxY = Math.max(
            maxY,
            roomBottom
        );
    }

    groupElement.classList.add("group");
    groupElement.dataset.groupId = group.groupID;

    if (isRoomSelected(group)) {
        groupElement.classList.add("room-selected");
    }

    groupElement.style.position = "absolute";

    groupElement.style.left =
        `${gridToWorldPixels(minX, zoom)}px`;

    groupElement.style.top =
        `${gridToWorldPixels(minY, zoom)}px`;

    groupElement.style.width =
        `${gridToPixels(maxX - minX, zoom)}px`;

    groupElement.style.height =
        `${gridToPixels(maxY - minY, zoom)}px`;

    // --------------------------------------------------------
    // Map interaction
    // --------------------------------------------------------



    groupElement.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            // Keep the group above its member rooms in the DOM so it remains
            // the interaction surface after selection or other map updates.
            groupElement.parentElement.appendChild(
                groupElement
            );

            if (event.shiftKey) {
                if (isRoomSelected(group)) {
                    removeRoomFromSelection(group);
                } else {
                    addRoomToSelection(group);
                }

                groupElement.classList.toggle(
                    "room-selected",
                    isRoomSelected(group)
                );

                return;
            }

            selectRoom(group);

            mapElement.querySelectorAll(
                ".room, .group"
            ).forEach(
                (element) => {
                    if (
                        element.dataset.groupId !==
                        group.groupID
                    ) {
                        element.classList.remove(
                            "room-selected"
                        );
                    }
                }
            );

            groupElement.classList.add(
                "room-selected"
            );
        }
    );

    return groupElement;
}