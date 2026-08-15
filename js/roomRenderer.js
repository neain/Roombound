// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, gridToPixels, pixelsToGrid } from "./mapUtils.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";

const hoverExceptions = ["roomID", "connections", "position", "size"];
const readOnlyRoomProperties = ["name", "floor"];
const roomTooltip = document.createElement("div");

let selectedRoom = null;
let roomEditor = null;
let editorContent = null;

export function renderRooms(map, mapElement, connectionLayer) {
    roomTooltip.classList.add("room-tooltip");
    mapElement.appendChild(roomTooltip);

    for (const room of map.rooms) {

        const roomElement = document.createElement("div");

        roomElement.classList.add("room");
        roomElement.dataset.roomId = room.roomID;

        roomElement.textContent = room.name;
        roomElement.addEventListener(
            "mouseenter",
            (event) => {
                roomTooltip.textContent = getRoomHoverInfo(room);

                roomTooltip.style.left = `${event.clientX + 10}px`;
                roomTooltip.style.top = `${event.clientY + 10}px`;
                roomTooltip.style.display = "block";
            }
        );

        roomElement.addEventListener(
            "mouseleave",
            () => {
                roomTooltip.style.display = "none";
            }
        );
//        roomElement.title = getRoomHoverInfo(room);


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

        roomElement.addEventListener(
            "click",
            () => {
                selectRoom(room);
            }
        );

        mapElement.appendChild(roomElement);
    }
}

export function startDragging(event, room, roomElement, map, connectionLayer) {

    event.preventDefault();
    roomTooltip.style.display = "none";

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

function getRoomHoverInfo(room) {
    return Object.entries(room)
        .filter(([key]) => !hoverExceptions.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
}

function selectRoom(room) {
    
    selectedRoom = room;

    if (!roomEditor) {
        roomEditor = document.createElement("div");
        roomEditor.classList.add("room-editor");

        const editorHeader = document.createElement("div");
        editorHeader.classList.add("room-editor-header");
        editorHeader.textContent = "Room Editor";

        editorContent = document.createElement("div");
        editorContent.classList.add("room-editor-content");

        roomEditor.appendChild(editorHeader);
        roomEditor.appendChild(editorContent);

        document.body.appendChild(roomEditor);

        startEditorDragging(editorHeader);    }

    updateRoomEditor();
}

function updateRoomEditor() {
    editorContent.innerHTML = "";

    for (const [key, value] of Object.entries(selectedRoom)) {

        if (hoverExceptions.includes(key)) {
            continue;
        }

        const field = document.createElement("div");

        field.textContent = `${key}: ${value}`;

        editorContent.appendChild(field);
    }
}

function startEditorDragging(editorHeader) {

    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    function startDrag(event) {

        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startEditorX = roomEditor.offsetLeft;
        startEditorY = roomEditor.offsetTop;

        document.addEventListener(
            "mousemove",
            drag
        );

        document.addEventListener(
            "mouseup",
            stopDrag
        );
    }

    function drag(event) {

        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        roomEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        roomEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        roomEditor.style.right = "auto";
    }

    function stopDrag() {

        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDrag
        );
    }

    editorHeader.addEventListener(
        "mousedown",
        startDrag
    );
}