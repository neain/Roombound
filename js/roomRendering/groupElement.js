// ============================================================
// GROUP ELEMENT
// ============================================================

// Creates the visible DOM element representing a group.
//
// A group's position and size are stored directly on the group object. They
// are established when the group is created and remain unchanged until the
// group's membership changes.
import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

import {
    isRoomSelected,
    addRoomToSelection,
    selectRoom,
    removeRoomFromSelection,
    startDragging
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
    connectionLayer,
    zoom,
    currentFloor
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

    // Hide controls that no longer apply to rooms represented by this group.
    // Room data remains unchanged so the original room representation can be
    // restored automatically if the group is later removed.
    for (const room of groupRooms) {
        const roomElement =
            mapElement.querySelector(
                `.room[data-room-id="${room.roomID}"]`
            );

        if (!roomElement) {
            continue;
        }

        roomElement.querySelector(
            ".room-resize-handle"
        )?.remove();

        if (group.clearLabels) {
            const roomShape =
                roomElement.querySelector(".room-shape");

            if (roomShape) {
                roomShape.textContent = "";
            }
        }
    }

    groupElement.classList.add("group");
    groupElement.dataset.groupId = group.groupID;

    if (isRoomSelected(group)) {
        groupElement.classList.add("room-selected");
    }

    groupElement.style.position = "absolute";

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

    groupElement.style.width =
        `${gridToPixels(
            group.size.width,
            zoom
        )}px`;

    groupElement.style.height =
        `${gridToPixels(
            group.size.height,
            zoom
        )}px`;

    // --------------------------------------------------------
    // Map interaction
    // --------------------------------------------------------

    groupElement.addEventListener(
        "mousedown",
        (event) => {
            startDragging(
                event,
                group,
                groupElement,
                map,
                mapElement,
                connectionLayer,
                zoom,
                currentFloor
            );
        }
    );

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