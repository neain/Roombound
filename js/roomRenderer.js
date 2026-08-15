// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, gridToPixels, pixelsToGrid } from "./mapUtils.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";

export function renderRooms(map, mapElement, connectionLayer) {

    for (const room of map.rooms) {

        const roomElement = document.createElement("div");

        roomElement.classList.add("room");
        roomElement.dataset.roomId = room.roomID;

        roomElement.textContent = room.name;

        roomElement.style.left =
            `${gridToPixels(room.position.x)}px`;

        roomElement.style.top =
            `${gridToPixels(room.position.y)}px`;

        roomElement.style.width =
            `${gridToPixels(room.size.width)}px`;

        roomElement.style.height =
            `${gridToPixels(room.size.height)}px`;


        roomElement.addEventListener(
            "mousedown",
            (event) => {
                startDragging(
                    event,
                    room,
                    roomElement,
                    map,
                    connectionLayer
                );
            }
        );

        mapElement.appendChild(roomElement);
    }
}

export function startDragging(event, room, roomElement, map, connectionLayer) {

    event.preventDefault();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const startRoomX = room.position.x;
    const startRoomY = room.position.y;


    function drag(event) {

        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;


        const deltaGridX =
            pixelsToGrid(mouseDeltaX);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY);


        room.position.x =
            startRoomX + deltaGridX;

        room.position.y =
            startRoomY + deltaGridY;


        roomElement.style.left =
            `${gridToPixels(room.position.x)}px`;

        roomElement.style.top =
            `${gridToPixels(room.position.y)}px`;


        renderConnections(map, connectionLayer);
    }


    function stopDragging() {

        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDragging
        );


        console.log(
            `Moved ${room.name} to`,
            room.position
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