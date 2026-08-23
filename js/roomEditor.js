// ============================================================
// IMPORTS
// ============================================================

// Room rendering and room deletion.
// CURRENT: renderRooms(), deleteRoom()
// If changing how editor actions affect the room map, inspect:
//   ./roomRenderer.js
import {
    renderRooms,
    deleteRoom
} from "./roomRenderer.js";

// Connection rendering.
// CURRENT: renderConnections()
// If changing how room editor actions affect connections, inspect:
//   ./connectionRenderer.js
import { renderConnections } from "./connectionRenderer.js";

// Connection creation and editing.
// CURRENT: openConnectionEditor()
import { openConnectionEditor } from "./connectionEditor.js";


// ============================================================
// ROOM EDITOR STATE
// ============================================================

// The room currently selected by the user.
let selectedRoom = null;

// The single room editor instance currently displayed, if any.
let roomEditor = null;

// Container holding the fields inside the room editor.
let editorContent = null;

// Map/rendering information needed by the editor when it needs to modify the
// selected room or redraw the map.
let editorContext = null;

// Last saved screen position of the room editor.
let editorPosition = null;

// Visual indicator showing whether the current editor has unsaved changes.
let editorChangedIndicator = null;

// Tracks whether the room editor has unsaved changes.
let editorHasChanges = false;

// Tracks whether the selected room was created specifically for the current
// editor session. This allows Cancel to remove a newly created room.
let isNewRoom = false;


// ============================================================
// ROOM SELECTION
// ============================================================

// Returns the room currently selected by the user, or null when no room is
// selected.
export function getSelectedRoom() {
    return selectedRoom;
}

// Selects a room without opening the room editor.
//
// This is used by map interactions such as the right-click context menu,
// where the room needs to become the active source room without starting
// an editing session.
export function selectRoomWithoutEditor(room) {
    selectedRoom = room;
}

// Opens the room editor for a specific room.
//
// This is intentionally separate from room selection so selecting a room does
// not implicitly open its editor.
export function openRoomEditor(
    room,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor,
    newRoom = false
) {
    selectedRoom = room;
    isNewRoom = newRoom;

    // Store the map/rendering context so editor actions such as Cancel can
    // delete a newly created room and redraw the map.
    editorContext = {
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    };

    // Create the editor the first time a room is opened.
    if (!roomEditor) {
        const editorHeader = document.createElement("div");
        const editorTitleGroup = document.createElement("div");
        const editorTitle = document.createElement("span");
        const editorChanged = document.createElement("span");
        const closeButton = document.createElement("button");
        const editorButtons = document.createElement("div");
        const saveButton = document.createElement("button");
        const editConnectionsButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        const cancelButton = document.createElement("button");

        roomEditor = document.createElement("div");
        roomEditor.classList.add("room-editor");

        roomEditor.style.width =
            `${map.editorSize.width}px`;

        roomEditor.style.height =
            `${map.editorSize.height}px`;

        // --------------------------------------------------------
        // Editor header
        // --------------------------------------------------------

        editorHeader.classList.add("room-editor-header");

        editorTitleGroup.classList.add("room-editor-title-group");

        editorTitle.textContent = "Room Editor";

        editorChanged.textContent = "Changed";
        editorChanged.classList.add("room-editor-changed");
        editorChanged.style.display = "none";

        editorChangedIndicator = editorChanged;

        editorTitleGroup.appendChild(editorTitle);
        editorTitleGroup.appendChild(editorChanged);

        editorHeader.appendChild(editorTitleGroup);
        editorHeader.appendChild(closeButton);

        closeButton.textContent = "×";
        closeButton.classList.add("room-editor-close");

        closeButton.addEventListener(
            "click",
            cancelRoomEditor
        );

        // --------------------------------------------------------
        // Editor content
        // --------------------------------------------------------

        editorContent = document.createElement("div");
        editorContent.classList.add("room-editor-content");

        roomEditor.appendChild(editorHeader);
        roomEditor.appendChild(editorContent);

        // --------------------------------------------------------
        // Editor buttons
        // --------------------------------------------------------

        editorButtons.classList.add("room-editor-buttons");

        saveButton.textContent = "Save";
        saveButton.classList.add("room-editor-save");

        editConnectionsButton.textContent = "Edit Connections";
        editConnectionsButton.classList.add(
            "room-editor-edit-connections"
        );

        deleteButton.textContent = "Delete";
        deleteButton.classList.add("room-editor-delete");

        cancelButton.textContent = "Cancel";
        cancelButton.classList.add("room-editor-cancel");

        saveButton.addEventListener(
            "click",
            saveRoomEditor
        );

        editConnectionsButton.addEventListener(
            "click",
            () => {
                openConnectionEditor(
                    editorContext.map,
                    selectedRoom,
                    editorContext.mapElement,
                    editorContext.connectionLayer,
                    editorContext.zoom,
                    editorContext.currentFloor
                );

                closeRoomEditor();
            }
        );

        deleteButton.addEventListener(
            "click",
            () => {
                const confirmed = confirm(
                    `Delete room "${selectedRoom.name}"?\n\nThis will also remove any connections attached to it.`
                );

                if (!selectedRoom) {
                    return;
                }

                if (!confirmed) {
                    return;
                }

                deleteRoom(
                    editorContext.map,
                    selectedRoom.roomID,
                    editorContext.mapElement,
                    editorContext.connectionLayer,
                    editorContext.zoom,
                    editorContext.currentFloor
                );

                isNewRoom = false;
                closeRoomEditor();
            }
        );

        cancelButton.addEventListener(
            "click",
            cancelRoomEditor
        );

        editorButtons.appendChild(saveButton);
        editorButtons.appendChild(editConnectionsButton);
        editorButtons.appendChild(deleteButton);
        editorButtons.appendChild(cancelButton);

        roomEditor.appendChild(editorButtons);

        document.body.appendChild(roomEditor);

        // Restore the editor's last saved screen position when possible.
        if (editorPosition) {
            roomEditor.style.left =
                `${editorPosition.x}px`;

            roomEditor.style.top =
                `${editorPosition.y}px`;

            roomEditor.style.right = "auto";
        }

        // Allow the editor to be repositioned by dragging its header.
        startEditorDragging(editorHeader);

        editorContent.addEventListener(
            "input",
            () => {
                setEditorChanged(true);
            }
        );

        editorContent.addEventListener(
            "change",
            () => {
                setEditorChanged(true);
            }
        );

        // Provide keyboard shortcuts for saving/canceling the editor.
        editorContent.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRoomEditor();
                    return;
                }

                if (event.key !== "Enter") {
                    return;
                }

                // Enter should still create a newline inside the notes field.
                if (event.target.tagName === "TEXTAREA") {
                    return;
                }

                event.preventDefault();
                saveRoomEditor();
            }
        );

        roomEditor.addEventListener(
            "mouseup",
            () => {
                if (
                    roomEditor.offsetWidth !== map.editorSize.width ||
                    roomEditor.offsetHeight !== map.editorSize.height
                ) {
                    setEditorChanged(true);
                }
            }
        );
    }

    // Every room can remember its preferred editor dimensions.
    roomEditor.style.width =
        `${map.editorSize.width}px`;

    roomEditor.style.height =
        `${map.editorSize.height}px`;

    setEditorChanged(false);
    updateRoomEditor();
}

// Selects a room and opens or updates the room editor for it.
//
// This remains as a compatibility wrapper for existing room-creation code.
// Normal room selection remains separate from opening the editor.
export function selectRoom(
    room,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor,
    newRoom = false
) {
    openRoomEditor(
        room,
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor,
        newRoom
    );
}


// ============================================================
// ROOM EDITOR
// ============================================================

// Updates the editor's visual changed indicator.
function setEditorChanged(changed) {
    editorHasChanges = changed;

    if (!editorChangedIndicator) {
        return;
    }

    editorChangedIndicator.style.display =
        changed ? "inline" : "none";
}

// Saves the current contents of the room editor back into the selected room.
//
// The room name's font size is recalculated from the room's current name and
// dimensions so the saved value always reflects the latest room state.
function saveRoomEditor() {
    const shapeSelect = editorContent.querySelector(".room-editor-shape");
    const inputs = editorContent.querySelectorAll("input");
    const textarea = editorContent.querySelector("textarea");
    let colorText;
    let colorValue;

    for (const input of inputs) {
        const key =
            input.previousElementSibling?.textContent
                .replace(": ", "");

        if (key === "floor") {
            selectedRoom.floor = Number(input.value);
        } else if (key === "name") {
            selectedRoom.name = input.value;
        }
    }

    if (shapeSelect) {
        selectedRoom.shape = shapeSelect.value;
    }

    colorText =
        [...inputs].find(
            (input) =>
                input.type === "text" &&
                input.parentElement?.querySelector(
                    'input[type="color"]'
                )
        );

    if (colorText) {
        colorValue = colorText.value.trim();

        if (colorValue === "") {
            delete selectedRoom.color;
        } else if (/^#[0-9a-fA-F]{6}$/.test(colorValue)) {
            selectedRoom.color = colorValue;
        }
    }

    selectedRoom.notes = textarea.value;

    // Recalculate the room-name font size using the newly saved room data.
    selectedRoom.textSize =
        calculateRoomTextSize(selectedRoom);

    editorContext.map.editorSize = {
        width: roomEditor.offsetWidth,
        height: roomEditor.offsetHeight
    };

    isNewRoom = false;

    editorPosition = {
        x: roomEditor.offsetLeft,
        y: roomEditor.offsetTop
    };

    // Re-apply floor filter so a room moved to another floor disappears.
    renderRooms(
        editorContext.map,
        editorContext.mapElement,
        editorContext.connectionLayer,
        editorContext.zoom,
        editorContext.currentFloor
    );

    renderConnections({
        map: editorContext.map,
        connectionLayer: editorContext.connectionLayer,
        zoom: editorContext.zoom,
        currentFloor: editorContext.currentFloor
    });

    setEditorChanged(false);
}

// Cancels the current room editing session.
//
// Newly created rooms are removed entirely when their initial editor session
// is canceled. Existing rooms are simply left unchanged.
function cancelRoomEditor() {
    if (isNewRoom) {
        deleteRoom(
            editorContext.map,
            selectedRoom.roomID,
            editorContext.mapElement,
            editorContext.connectionLayer,
            editorContext.zoom,
            editorContext.currentFloor
        );
    }

    isNewRoom = false;

    closeRoomEditor();
}

// Removes the current room editor and clears its associated state.
function closeRoomEditor() {
    roomEditor.remove();

    roomEditor = null;
    editorContent = null;
    selectedRoom = null;

    renderRooms(
        editorContext.map,
        editorContext.mapElement,
        editorContext.connectionLayer,
        editorContext.zoom,
        editorContext.currentFloor
    );
}

// Rebuilds the contents of the room editor from the currently selected room.
//
// Editable fields such as name, floor, color, and notes receive form controls.
// Structural properties remain visible as read-only information when they
// are not listed in hoverExceptions.
function updateRoomEditor() {
    const hoverExceptions = [
        "roomID",
        "connections",
        "position",
        "size",
        "editorSize",
        "textSize",
        "color"
    ];

    editorContent.innerHTML = "";

    for (const [key, value] of Object.entries(selectedRoom)) {
        if (hoverExceptions.includes(key)) {
            continue;
        }

    // Standard editable single-value fields.
    if (key === "name" || key === "floor") {
        const fieldContainer = document.createElement("div");
        const label = document.createElement("label");
        const input = document.createElement("input");

        fieldContainer.classList.add("room-editor-field");

        label.textContent = `${key}: `;

        input.type =
            key === "floor"
                ? "number"
                : "text";

        input.value = value;

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        editorContent.appendChild(fieldContainer);

        continue;
    }

        // Notes use a textarea so multiple lines can be entered.
        if (key === "notes") {
            continue;
        }

        // Remaining non-editable room properties are displayed as plain text.
        const field = document.createElement("div");

        field.textContent = `${key}: ${value}`;

        editorContent.appendChild(field);
    }

    const shapeFieldContainer =
        document.createElement("div");

    const shapeLabel =
        document.createElement("label");

    const shapeSelect =
        document.createElement("select");

    const shapes = [
        ["rectangle", "Rectangle"],
        ["circle", "Circle"],
        ["triangle", "Triangle"],
        ["diamond", "Diamond"],
        ["hexagon", "Hexagon"],
        ["octagon", "Octagon"],
        ["star", "Star"]
    ];

    shapeFieldContainer.classList.add(
        "room-editor-field"
    );

    shapeLabel.textContent =
        "shape: ";

    shapeSelect.classList.add(
        "room-editor-shape"
    );

    for (const [value, label] of shapes) {
        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = label;

        shapeSelect.appendChild(option);
    }

    shapeSelect.value =
        selectedRoom.shape || "rectangle";

    shapeFieldContainer.appendChild(
        shapeLabel
    );

    shapeFieldContainer.appendChild(
        shapeSelect
    );

    editorContent.appendChild(
        shapeFieldContainer
    );

    // Color is always displayed between floor and notes, regardless of whether
    // the room currently has a custom color.
    const colorFieldContainer = document.createElement("div");
    const colorLabel = document.createElement("label");
    const colorInput = document.createElement("input");
    const colorText = document.createElement("input");

    colorFieldContainer.classList.add("room-editor-field");

    colorLabel.textContent = "color: ";

    colorText.type = "text";
    colorText.value = selectedRoom.color || "";

    colorInput.type = "color";
    colorInput.value = selectedRoom.color || "#333333";

    colorText.addEventListener(
        "input",
        () => {
            if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) {
                colorInput.value = colorText.value;
            }
        }
    );

    colorInput.addEventListener(
        "input",
        () => {
            colorText.value = colorInput.value;
        }
    );

    colorFieldContainer.appendChild(colorLabel);
    colorFieldContainer.appendChild(colorText);
    colorFieldContainer.appendChild(colorInput);

    const notesFieldContainer = document.createElement("div");
    const notesLabel = document.createElement("label");
    const notesTextarea = document.createElement("textarea");

    notesFieldContainer.classList.add("room-editor-notes");

    notesLabel.textContent = "notes: ";

    notesTextarea.value = selectedRoom.notes;

    notesFieldContainer.appendChild(notesLabel);
    notesFieldContainer.appendChild(notesTextarea);

    editorContent.appendChild(shapeFieldContainer);
    editorContent.appendChild(colorFieldContainer);
    editorContent.appendChild(notesFieldContainer);
}


// Adds a standard editable room field.
function addRoomEditorTextField(
    key,
    value
) {
    const fieldContainer =
        document.createElement("div");

    const label =
        document.createElement("label");

    const input =
        document.createElement("input");

    fieldContainer.classList.add(
        "room-editor-field"
    );

    label.textContent =
        `${key}: `;

    input.type = "text";
    input.value = value;

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);

    editorContent.appendChild(
        fieldContainer
    );
}


// Adds the room color control. Rooms without a color property use the
// default CSS color until the user explicitly chooses a custom color.
function addRoomEditorColorField() {
    const fieldContainer =
        document.createElement("div");

    const label =
        document.createElement("label");

    const colorButton =
        document.createElement("button");

    fieldContainer.classList.add(
        "room-editor-field"
    );

    label.textContent =
        "color: ";

    colorButton.type = "button";
    colorButton.textContent =
        selectedRoom.color || "Default";

    colorButton.classList.add(
        "room-editor-color"
    );

    if (selectedRoom.color) {
        colorButton.style.backgroundColor =
            selectedRoom.color;

        colorButton.style.color =
            getContrastColor(selectedRoom.color);
    }

    colorButton.addEventListener(
        "click",
        () => {
            openRoomColorEditor(
                fieldContainer,
                colorButton
            );
        }
    );

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(colorButton);

    editorContent.appendChild(fieldContainer);
}


// Replaces the default color button with a color picker and editable color
// value once the user chooses to customize the room color.
function openRoomColorEditor(
    fieldContainer,
    colorButton
) {
    if (
        fieldContainer.querySelector(
            ".room-editor-color-picker"
        )
    ) {
        return;
    }

    const currentColor =
        selectedRoom.color || "#333333";

    colorButton.remove();

    const colorInput =
        document.createElement("input");

    const colorText =
        document.createElement("input");

    colorInput.type = "color";
    colorInput.value = currentColor;

    colorText.type = "text";
    colorText.value = currentColor;

    colorInput.classList.add(
        "room-editor-color-picker"
    );

    colorText.classList.add(
        "room-editor-color-text"
    );

    colorInput.addEventListener(
        "input",
        () => {
            colorText.value =
                colorInput.value;

            setEditorChanged(true);
        }
    );

    colorText.addEventListener(
        "input",
        () => {
            if (
                /^#[0-9a-fA-F]{6}$/.test(
                    colorText.value
                )
            ) {
                colorInput.value =
                    colorText.value;

                setEditorChanged(true);
            }
        }
    );

    fieldContainer.appendChild(
        colorInput
    );

    fieldContainer.appendChild(
        colorText
    );
}


// Determines whether black or white text has better contrast against the
// selected room color.
function getContrastColor(color) {
    const red =
        parseInt(color.slice(1, 3), 16);

    const green =
        parseInt(color.slice(3, 5), 16);

    const blue =
        parseInt(color.slice(5, 7), 16);

    const brightness =
        (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 128
        ? "#000000"
        : "#ffffff";
}


// ============================================================
// ROOM TEXT SIZE
// ============================================================

// Default room-name font size before any room-specific adjustment.
const DEFAULT_ROOM_TEXT_SIZE = 16;

// Determines the largest font size that allows a room's name to fit inside
// the room without overflowing. The browser's normal word wrapping is used,
// so individual words are never manually split.
function calculateRoomTextSize(room) {
    const roomElement = document.createElement("div");
    let textSize;
    let roomWidth;
    let roomHeight;
    let fits;
    let fitsAtDefaultSize;

    roomWidth = room.size.width * 15;
    roomHeight = room.size.height * 15;

    roomElement.classList.add("room");

    roomElement.textContent = room.name;

    roomElement.style.width = `${roomWidth}px`;
    roomElement.style.height = `${roomHeight}px`;
    roomElement.style.position = "absolute";
    roomElement.style.visibility = "hidden";
    roomElement.style.pointerEvents = "none";
    roomElement.style.left = "-10000px";
    roomElement.style.top = "0";

    document.body.appendChild(roomElement);

    roomElement.style.fontSize =
        `${DEFAULT_ROOM_TEXT_SIZE}px`;

    fitsAtDefaultSize =
        roomElement.scrollWidth <= roomElement.clientWidth &&
        roomElement.scrollHeight <= roomElement.clientHeight;

    if (fitsAtDefaultSize) {
        document.body.removeChild(roomElement);
        return DEFAULT_ROOM_TEXT_SIZE;
    }

    for (
        textSize = DEFAULT_ROOM_TEXT_SIZE;
        textSize > 1;
        textSize--
    ) {
        roomElement.style.fontSize = `${textSize}px`;

        fits =
            roomElement.scrollWidth <= roomElement.clientWidth &&
            roomElement.scrollHeight <= roomElement.clientHeight;

        if (fits) {
            break;
        }
    }

    document.body.removeChild(roomElement);

    return Math.max(1, textSize - 1);
}


// ============================================================
// EDITOR DRAGGING
// ============================================================

// Adds dragging behavior to the room editor's header.
//
// This is separate from room dragging because the editor is a screen-space
// UI element rather than a map-space object.
function startEditorDragging(editorHeader) {
    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    // Records the mouse/editor positions when the header is grabbed.
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

    // Moves the editor to follow the mouse.
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

    // Removes the temporary drag listeners when the editor is released.
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