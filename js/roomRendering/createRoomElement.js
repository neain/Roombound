// Shared map/grid utilities used to convert stored room coordinates and sizes
// into the pixel values used by the visible room element.
import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

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

    roomElement.classList.add("room");
    roomElement.dataset.roomId = room.roomID;

    roomShape.classList.add(
        "room-shape",
        `room-shape-${room.shape || "rectangle"}`
    );

    if (room.color) {
        roomShape.style.backgroundColor =
            room.color;
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