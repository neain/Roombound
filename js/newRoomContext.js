// ============================================================
// ROOMBOUND NEW ROOM CONTEXT
// ============================================================
//
// Temporary room creation UI.
//
// The room is not added to the map until Create is pressed. Cancel simply
// discards the temporary room data.
//


// ============================================================
// IMPORTS
// ============================================================

import {
    GRID_SIZE,
    MAP_ORIGIN
} from "./mapUtils.js";

import {
    createWindow
} from "./window.js";


// ============================================================
// CONTEXT STATE
// ============================================================

// The currently displayed new-room context, if any.
let newRoomContext = null;

// Temporary room being configured.
let newRoom = null;

// Map/rendering information needed when the room is created.
let creationContext = null;


// ============================================================
// PUBLIC ENTRY POINT
// ============================================================

// Opens the new-room context and creates temporary room data centered on the
// currently visible portion of the map.
export function openNewRoomContext(
    mapView,
    mapElement,
    renderMap,
    mapPosition = null
) {
    closeNewRoomContext();

    creationContext = {
        mapView,
        mapElement,
        renderMap
    };

    newRoom =
        createTemporaryRoom(
            mapView.map,
            mapElement,
            mapView.zoom,
            mapView.currentFloor,
            mapPosition
        );

    const windowShell =
        createWindow(
            "New Room",
            closeNewRoomContext
        );

    newRoomContext =
        windowShell.element;

    newRoomContext.classList.add(
        "new-room-context"
    );

    windowShell.header.classList.add(
        "new-room-context-header"
    );

    // --------------------------------------------------------
    // Context header / preview
    // --------------------------------------------------------

    const preview =
        document.createElement("div");

    preview.classList.add(
        "new-room-context-preview"
    );

    windowShell.addHeaderElement(
        preview
    );

    // --------------------------------------------------------
    // Context content
    // --------------------------------------------------------

    const contextContent =
        document.createElement("div");

    contextContent.classList.add(
        "new-room-context-content"
    );

    // --------------------------------------------------------
    // Name
    // --------------------------------------------------------

    const nameSection =
        document.createElement("div");

    nameSection.classList.add(
        "new-room-context-section"
    );

    const nameLabel =
        document.createElement("label");

    nameLabel.textContent = "Name";

    const nameInput =
        document.createElement("input");

    nameInput.type = "text";
    nameInput.value = newRoom.name;

    nameInput.addEventListener(
        "input",
        () => {
            newRoom.name = nameInput.value;
            updateContext();
        }
    );

    nameSection.appendChild(nameLabel);
    nameSection.appendChild(nameInput);

    // --------------------------------------------------------
    // Floor
    // --------------------------------------------------------

    const floorSection =
        document.createElement("div");

    floorSection.classList.add(
        "new-room-context-section"
    );

    const floorLabel =
        document.createElement("label");

    floorLabel.textContent = "Floor";

    const floorInput =
        document.createElement("input");

    floorInput.type = "number";
    floorInput.value = newRoom.floor;

    floorInput.addEventListener(
        "input",
        () => {
            const floor =
                Number(floorInput.value);

            if (Number.isNaN(floor)) {
                return;
            }

            newRoom.floor = floor;

            updateContext();
        }
    );

    floorSection.appendChild(floorLabel);
    floorSection.appendChild(floorInput);

    // --------------------------------------------------------
    // Notes
    // --------------------------------------------------------

    const notesSection =
        document.createElement("div");

    notesSection.classList.add(
        "new-room-context-section"
    );

    const notesLabel =
        document.createElement("label");

    notesLabel.textContent = "Notes";

    const notesInput =
        document.createElement("textarea");

    notesInput.value = newRoom.notes;

    notesInput.addEventListener(
        "input",
        () => {
            newRoom.notes = notesInput.value;
        }
    );

    notesSection.appendChild(notesLabel);
    notesSection.appendChild(notesInput);

    // --------------------------------------------------------
    // Color
    // --------------------------------------------------------

    const colorSection =
        document.createElement("div");

    colorSection.classList.add(
        "new-room-context-section"
    );

    const colorLabel =
        document.createElement("label");

    colorLabel.textContent = "Color";

    const colorControls =
        document.createElement("div");

    colorControls.classList.add(
        "new-room-context-color"
    );

    const colorValue =
        document.createElement("input");

    colorValue.type = "text";
    colorValue.value = "Default";
    colorValue.readOnly = true;
    colorValue.title =
        "Using the default room color. Click to choose a custom color.";

    const colorInput =
        document.createElement("input");

    colorInput.type = "color";
    colorInput.value =
        newRoom.color || "#333333";

    colorInput.title =
        "Choose a custom room color.";

    colorValue.addEventListener(
        "click",
        () => {
            if (newRoom.color) {
                return;
            }

            newRoom.color =
                colorInput.value;

            colorValue.readOnly = false;
            colorValue.value =
                newRoom.color;

            colorValue.title =
                "Enter a color such as #333333.";

            colorValue.select();

            updateContext();
        }
    );

    colorValue.addEventListener(
        "input",
        () => {
            const value =
                colorValue.value.trim();

            if (
                /^#[0-9a-fA-F]{6}$/.test(value)
            ) {
                newRoom.color = value;
                colorInput.value = value;
                updateContext();
            }
        }
    );

    colorInput.addEventListener(
        "input",
        () => {
            newRoom.color =
                colorInput.value;

            colorValue.readOnly = false;
            colorValue.value =
                newRoom.color;

            colorValue.title =
                "Enter a color such as #333333.";

            updateContext();
        }
    );

    colorValue.addEventListener(
        "change",
        () => {
            const value =
                colorValue.value.trim();

            if (!value) {
                delete newRoom.color;

                colorValue.value = "Default";
                colorValue.readOnly = true;

                updateContext();
                return;
            }

            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                newRoom.color = value;
                colorInput.value = value;
                colorValue.value = value;
                updateContext();
            } else {
                colorValue.value =
                    newRoom.color || "Default";
            }
        }
    );

    colorControls.appendChild(colorValue);
    colorControls.appendChild(colorInput);

    colorSection.appendChild(colorLabel);
    colorSection.appendChild(colorControls);

    // --------------------------------------------------------
    // Context buttons
    // --------------------------------------------------------

    const contextButtons =
        document.createElement("div");

    contextButtons.classList.add(
        "new-room-context-buttons"
    );

    const cancelButton =
        document.createElement("button");

    const createButton =
        document.createElement("button");

    cancelButton.textContent = "Cancel";
    createButton.textContent = "Create";

    cancelButton.addEventListener(
        "click",
        closeNewRoomContext
    );

    createButton.addEventListener(
        "click",
        createRoomFromContext
    );

    contextButtons.appendChild(
        cancelButton
    );

    contextButtons.appendChild(
        createButton
    );

    // --------------------------------------------------------
    // Assemble context
    // --------------------------------------------------------

    contextContent.appendChild(
        nameSection
    );

    contextContent.appendChild(
        floorSection
    );

    contextContent.appendChild(
        notesSection
    );

    contextContent.appendChild(
        colorSection
    );

    contextContent.appendChild(
        contextButtons
    );

    windowShell.content.appendChild(
        contextContent
    );

    document.addEventListener(
        "keydown",
        handleNewRoomContextKeydown
    );

    document.addEventListener(
        "mousedown",
        handleNewRoomContextOutsideClick
    );

    updateContext();

    nameInput.focus();
    nameInput.select();
}


// ============================================================
// TEMPORARY ROOM CREATION
// ============================================================

// Creates room data without adding the room to the map.
function createTemporaryRoom(
    map,
    mapElement,
    zoom,
    currentFloor,
    mapPosition = null
) {
    let highestRoomNumber = 0;
    let roomNumber;
    let centerX;
    let centerY;
    let worldX;
    let worldY;

    for (const room of map.rooms) {
        const match =
            room.roomID.match(/^room_(\d+)$/);

        if (!match) {
            continue;
        }

        highestRoomNumber =
            Math.max(
                highestRoomNumber,
                Number(match[1])
            );
    }

    roomNumber =
        String(highestRoomNumber + 1).padStart(3, "0");

    if (mapPosition) {
        worldX =
            (mapPosition.x - MAP_ORIGIN * zoom) /
            (GRID_SIZE * zoom);

        worldY =
            (mapPosition.y - MAP_ORIGIN * zoom) /
            (GRID_SIZE * zoom);
    } else {
        centerX =
            mapElement.scrollLeft +
            mapElement.clientWidth / 2;

        centerY =
            mapElement.scrollTop +
            mapElement.clientHeight / 2;

        worldX =
            (centerX - MAP_ORIGIN * zoom) /
            (GRID_SIZE * zoom);

        worldY =
            (centerY - MAP_ORIGIN * zoom) /
            (GRID_SIZE * zoom);
    }

    return {
        roomID: `room_${roomNumber}`,
        name: "",
        floor: currentFloor,
        notes: "",
        connections: [],
        position: {
            x: Math.round(worldX - 2.5),
            y: Math.round(worldY - 2.5)
        },
        size: {
            width: 5,
            height: 5
        },
        textSize: 16
    };
}


// ============================================================
// CONTEXT UPDATE
// ============================================================

// Updates the preview and applies the current room color to it.
function updateContext() {
    if (!newRoomContext || !newRoom) {
        return;
    }

    const preview =
        newRoomContext.querySelector(
            ".new-room-context-preview"
        );

    preview.textContent =
        newRoom.name || "New Room";

    if (newRoom.color) {
        preview.style.backgroundColor =
            newRoom.color;
    } else {
        preview.style.backgroundColor =
            "";
    }

    updateContextMinimumWidth(
        preview
    );
}


// ============================================================
// CONTEXT SIZING
// ============================================================

// Keeps the preview readable by setting the window's minimum width to the
// current natural width of the room name.
function updateContextMinimumWidth(
    preview
) {
    if (!newRoomContext) {
        return;
    }

    newRoomContext.style.minWidth =
        "200px";

    const previewWidth =
        preview.scrollWidth;

    const minimumWidth =
        Math.max(
            200,
            previewWidth + 40
        );

    newRoomContext.style.minWidth =
        `${minimumWidth}px`;
}


// ============================================================
// ROOM CREATION
// ============================================================

// Commits the temporary room to the map.
function createRoomFromContext() {
    if (!newRoom || !creationContext) {
        return;
    }

    const room =
        newRoom;

    const {
        mapView,
        renderMap
    } = creationContext;

    mapView.map.rooms.push(room);

    renderMap();
    closeNewRoomContext();
}


// ============================================================
// CONTEXT INPUT
// ============================================================

// Handles keyboard shortcuts for the new-room context.
function handleNewRoomContextKeydown(event) {
    if (!newRoomContext) {
        return;
    }

    // Escape is handled by createWindow().
    // Enter remains specific to room creation.
    if (
        event.key === "Enter" &&
        !(event.target instanceof HTMLTextAreaElement)
    ) {
        event.preventDefault();
        createRoomFromContext();
    }
}


// Cancels the context when the user clicks outside its window.
function handleNewRoomContextOutsideClick(event) {
    if (
        newRoomContext &&
        !newRoomContext.contains(event.target)
    ) {
        closeNewRoomContext();
    }
}


// ============================================================
// CONTEXT CLOSING
// ============================================================

// Closes the new-room context without modifying the map.
function closeNewRoomContext() {
    if (!newRoomContext) {
        return;
    }

    document.removeEventListener(
        "keydown",
        handleNewRoomContextKeydown
    );

    document.removeEventListener(
        "mousedown",
        handleNewRoomContextOutsideClick
    );

    newRoomContext.remove();

    newRoomContext = null;
    newRoom = null;
    creationContext = null;
}