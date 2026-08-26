// ============================================================
// GROUP ELEMENT
// ============================================================

// Creates the visible DOM element representing a group.
//
// A group's position and size are stored directly on the group object.
// Position represents the top-left corner of the group's bounding rectangle,
// while size represents that rectangle's dimensions. Both are updated when
// the group's membership changes.
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
    let nameBackgroundColor = "#ffffff";
    let roomFoundAtNamePosition = false;

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

    // Determine which room is visually behind the center of the group name.
    //
    // Rooms are checked through their rendered DOM elements so the result
    // respects the current visual stacking order. The last matching room in
    // DOM order is the room currently appearing on top.
    const nameX =
        group.position.x +
        group.size.width / 2;

    const nameY =
        group.position.y +
        group.size.height / 2;

    const roomElements =
        mapElement.querySelectorAll(".room");

    for (const roomElement of roomElements) {
        const roomID =
            roomElement.dataset.roomId;

        const room =
            map.rooms.find(
                (mapRoom) => mapRoom.roomID === roomID
            );

        if (!room) {
            continue;
        }

        const roomRight =
            room.position.x +
            room.size.width;

        const roomBottom =
            room.position.y +
            room.size.height;

        if (
            nameX >= room.position.x &&
            nameX <= roomRight &&
            nameY >= room.position.y &&
            nameY <= roomBottom
        ) {
            roomFoundAtNamePosition = true;
            nameBackgroundColor =
                room.color || null;
        }
    }

    // Determines whether black or white text provides better contrast against
    // the supplied six-digit hexadecimal room color.
    const getContrastingTextColor = (color) => {
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return null;
        }

        const red =
            parseInt(color.slice(1, 3), 16) / 255;

        const green =
            parseInt(color.slice(3, 5), 16) / 255;

        const blue =
            parseInt(color.slice(5, 7), 16) / 255;

        const redLinear =
            red <= 0.03928
                ? red / 12.92
                : ((red + 0.055) / 1.055) ** 2.4;

        const greenLinear =
            green <= 0.03928
                ? green / 12.92
                : ((green + 0.055) / 1.055) ** 2.4;

        const blueLinear =
            blue <= 0.03928
                ? blue / 12.92
                : ((blue + 0.055) / 1.055) ** 2.4;

        const luminance =
            0.2126 * redLinear +
            0.7152 * greenLinear +
            0.0722 * blueLinear;

        return luminance > 0.179
            ? "#000000"
            : "#ffffff";
    };

    const groupName =
        document.createElement("div");

    groupName.classList.add("group-name");
    groupName.textContent =
        group.name;

    groupName.style.position =
        "absolute";

    groupName.style.left =
        "0";

    groupName.style.top =
        "0";

    groupName.style.width =
        "100%";

    groupName.style.height =
        "100%";

    groupName.style.display =
        "flex";

    groupName.style.alignItems =
        "center";

    groupName.style.justifyContent =
        "center";

    const textColor =
        roomFoundAtNamePosition &&
        !nameBackgroundColor
            ? "#ffffff"
            : getContrastingTextColor(
                nameBackgroundColor
            );

    if (textColor) {
        groupName.style.color =
            textColor;
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

    groupName.style.fontSize =
        `${16 * zoom}px`;

    groupElement.appendChild(
        groupName
    );

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

            // Keep the group and its member rooms above unrelated rooms in the
            // DOM so the selected group remains the visible interaction surface.
            for (const room of groupRooms) {
                const roomElement =
                    mapElement.querySelector(
                        `.room[data-room-id="${room.roomID}"]`
                    );

                if (roomElement) {
                    mapElement.appendChild(roomElement);
                }
            }

            mapElement.appendChild(
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