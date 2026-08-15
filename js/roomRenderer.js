// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, gridToPixels, gridToWorldPixels, pixelsToGrid } from "./mapUtils.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";

const hoverExceptions = ["roomID", "connections", "position", "size", "editorSize"];
const readOnlyRoomProperties = ["name", "floor"];
const roomTooltip = document.createElement("div");

let selectedRoom = null;
let roomEditor = null;
let editorContent = null;
let editorPosition = null;

export function renderRooms(map, mapElement, connectionLayer, zoom = 1) {
    if (!roomTooltip.parentElement) {
        roomTooltip.classList.add("room-tooltip");
        mapElement.appendChild(roomTooltip);
    }

    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

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
            `${gridToWorldPixels(room.position.x, zoom)}px`;

        roomElement.style.top =
            `${gridToWorldPixels(room.position.y, zoom)}px`;
            
        roomElement.style.width =
            `${gridToPixels(room.size.width, zoom)}px`;

        roomElement.style.height =
            `${gridToPixels(room.size.height, zoom)}px`;

        roomElement.style.fontSize =
            `${16 * zoom}px`;

        roomElement.addEventListener(
            "mousedown",
            (event) => {
                startDragging(
                    event,
                    room,
                    roomElement,
                    map,
                    connectionLayer,
                    zoom
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

export function startDragging(event, room, roomElement, map, connectionLayer, zoom = 1) {

    event.preventDefault();

    if (event.button !== 0) {
        return;
    }

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
            pixelsToGrid(mouseDeltaX, zoom);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY, zoom);


        room.position.x =
            startRoomX + deltaGridX;

        room.position.y =
            startRoomY + deltaGridY;


        roomElement.style.left =
            `${gridToWorldPixels(room.position.x, zoom)}px`;

        roomElement.style.top =
            `${gridToWorldPixels(room.position.y, zoom)}px`;


        renderConnections(map, connectionLayer, zoom);
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

function saveRoomEditor() {

    const inputs =
        editorContent.querySelectorAll("input");

    const textarea =
        editorContent.querySelector("textarea");

    for (const input of inputs) {

        const key =
            input.previousElementSibling.textContent
                .replace(": ", "");

        selectedRoom[key] = input.value;
    }

    selectedRoom.notes = textarea.value;

    selectedRoom.editorSize = {
        width: roomEditor.offsetWidth,
        height: roomEditor.offsetHeight
    };

    editorPosition = {
        x: roomEditor.offsetLeft,
        y: roomEditor.offsetTop
    };


    const roomElement =
        document.querySelector(
            `.room[data-room-id="${selectedRoom.roomID}"]`
        );

    if (roomElement) {
        roomElement.textContent = selectedRoom.name;
    }


    closeRoomEditor();
}

function closeRoomEditor() {
    roomEditor.remove();

    roomEditor = null;
    editorContent = null;
    selectedRoom = null;
}

function selectRoom(room) {
    
    selectedRoom = room;

    if (!roomEditor) {
        roomEditor = document.createElement("div");
        roomEditor.classList.add("room-editor");

        roomEditor.style.width =
            `${room.editorSize.width}px`;

        roomEditor.style.height =
            `${room.editorSize.height}px`;

        const editorHeader = document.createElement("div");
        editorHeader.classList.add("room-editor-header");

        const editorTitle = document.createElement("span");
        editorHeader.textContent = "Room Editor";

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.classList.add("room-editor-close");

        closeButton.addEventListener("click", closeRoomEditor);

        editorHeader.appendChild(editorTitle);
        editorHeader.appendChild(closeButton);

        editorContent = document.createElement("div");
        editorContent.classList.add("room-editor-content");

        roomEditor.appendChild(editorHeader);
        roomEditor.appendChild(editorContent);

        const editorButtons = document.createElement("div");
        editorButtons.classList.add("room-editor-buttons");

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.classList.add("room-editor-save");

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.classList.add("room-editor-cancel");

        saveButton.addEventListener(
            "click",
            saveRoomEditor
        );

        cancelButton.addEventListener(
            "click",
            closeRoomEditor
        );

        editorButtons.appendChild(saveButton);
        editorButtons.appendChild(cancelButton);

        roomEditor.appendChild(editorButtons);

        document.body.appendChild(roomEditor);

        if (editorPosition) {
            roomEditor.style.left =
                `${editorPosition.x}px`;

            roomEditor.style.top =
                `${editorPosition.y}px`;

            roomEditor.style.right = "auto";
        }

        startEditorDragging(editorHeader);  
        
        editorContent.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeRoomEditor();
                    return;
                }

                if (event.key !== "Enter") {
                    return;
                }

                if (event.target.tagName === "TEXTAREA") {
                    return;
                }

                event.preventDefault();
                saveRoomEditor();
            }
        );
    }

    roomEditor.style.width =
        `${room.editorSize.width}px`;

    roomEditor.style.height =
        `${room.editorSize.height}px`;


    updateRoomEditor();
}

function updateRoomEditor() {
    editorContent.innerHTML = "";

    for (const [key, value] of Object.entries(selectedRoom)) {

        if (hoverExceptions.includes(key)) {
            continue;
        }

        if (key === "name" || key === "floor") {
            const fieldContainer = document.createElement("div");
            fieldContainer.classList.add("room-editor-field");

            const label = document.createElement("label");
            label.textContent = `${key}: `;

            const input = document.createElement("input");
            input.type = "text";
            input.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            editorContent.appendChild(fieldContainer);

            continue;
        }
        

        if (key === "notes") {
            const fieldContainer = document.createElement("div");
            fieldContainer.classList.add("room-editor-notes");

            const label = document.createElement("label");
            label.textContent = "notes: ";

            const textarea = document.createElement("textarea");
            textarea.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(textarea);
            editorContent.appendChild(fieldContainer);

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