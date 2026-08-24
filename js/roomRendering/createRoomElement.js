// Room-rendering router. Room-rendering functions, helpers, and semi-global
// rendering state are accessed through the router rather than directly from
// their implementation files.
import {
    startResizing,
    startDragging,
    getRoomHoverInfo,
    roomTooltip,
    isRoomSelected,
    selectRoom,
    addRoomToSelection,
    removeRoomFromSelection,
    getSelectedRooms
} from "../roomRenderer.js";

// Shared map/grid utilities used to convert stored room coordinates and sizes 
// // into the pixel values used by the visible room element. 
import { gridToPixels, gridToWorldPixels } from "../mapUtils.js";

// Creates the visible map element for a room.
//
// The same room construction is used for normal rooms and ghost rooms so
// both representations remain visually and behaviorally consistent.
export function createRoomElement(
    room,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const roomElement = document.createElement("div");
    const roomShape = document.createElement("div");
    const resizeHandle = document.createElement("div");

    // BEGIN EDIT: AUTO-CONTRAST ROOM TEXT
    //
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
    // END EDIT: AUTO-CONTRAST ROOM TEXT

    roomElement.classList.add("room");
    roomElement.dataset.roomId = room.roomID;

    roomShape.classList.add(
        "room-shape",
        `room-shape-${room.shape || "rectangle"}`
    );

    if (room.color) {
        roomShape.style.backgroundColor =
            room.color;

        // BEGIN EDIT: APPLY AUTO-CONTRAST
        const textColor =
            getContrastingTextColor(room.color);

        if (textColor) {
            roomShape.style.color =
                textColor;
        }
        // END EDIT: APPLY AUTO-CONTRAST
    }

    if (isRoomSelected(room)) {
        roomElement.classList.add("room-selected");
    }

    roomShape.textContent = room.name;

    roomElement.appendChild(roomShape);

    resizeHandle.classList.add(
        "room-resize-handle"
    );

    resizeHandle.addEventListener(
        "mousedown",
        (event) => {
            event.stopPropagation();

            startResizing(
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

    roomElement.appendChild(resizeHandle);

    roomElement.addEventListener(
        "mouseenter",
        (event) => {
            roomTooltip.textContent =
                getRoomHoverInfo(room);

            roomTooltip.style.left =
                `${event.clientX + 10}px`;

            roomTooltip.style.top =
                `${event.clientY + 10}px`;

            roomTooltip.style.display = "block";
        }
    );

    roomElement.addEventListener(
        "mouseleave",
        () => {
            roomTooltip.style.display = "none";
        }
    );

    roomElement.style.left =
        `${gridToWorldPixels(room.position.x, zoom)}px`;

    roomElement.style.top =
        `${gridToWorldPixels(room.position.y, zoom)}px`;

    roomElement.style.width =
        `${gridToPixels(room.size.width, zoom)}px`;

    roomElement.style.height =
        `${gridToPixels(room.size.height, zoom)}px`;

    roomShape.style.fontSize =
        `${(room.textSize ?? 16) * zoom}px`;

    roomElement.addEventListener(
        "mousedown",
        (event) => {
            startDragging(
                event,
                room,
                roomElement,
                map,
                mapElement,
                connectionLayer,
                zoom,
                currentFloor
            );
        }
    );

    roomElement.addEventListener(
        "click",
        (event) => {
            let previousSelection;

            if (roomElement.dataset.dragged === "true") {
                delete roomElement.dataset.dragged;
                return;
            }

            if (event.shiftKey) {
                if (isRoomSelected(room)) {
                    removeRoomFromSelection(room);
                } else {
                    addRoomToSelection(room);
                }

                roomElement.classList.toggle(
                    "room-selected",
                    isRoomSelected(room)
                );

                return;
            }

            previousSelection = getSelectedRooms();

            selectRoom(room);

            for (const selectedRoom of previousSelection) {
                if (selectedRoom === room) {
                    continue;
                }

                mapElement.querySelectorAll(".room").forEach(
                    (element) => {
                        if (
                            element.dataset.roomId ===
                            selectedRoom.roomID
                        ) {
                            element.classList.remove(
                                "room-selected"
                            );
                        }
                    }
                );
            }

            roomElement.classList.add(
                "room-selected"
            );
        }
    );

    roomElement.addEventListener(
        "dblclick",
        (event) => {
            event.preventDefault();

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

    return roomElement;
}