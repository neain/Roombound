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

// Selects a room and opens or updates the room editor for it.
//
// The editor keeps a reference to the selected room rather than creating a
// separate copy. Save/Cancel behavior is therefore handled by the editor's
// existing state and lifecycle.
export function selectRoom(
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

    // Create the editor the first time a room is selected.
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
    const inputs = editorContent.querySelectorAll("input");
    const textarea = editorContent.querySelector("textarea");

    for (const input of inputs) {
        const key =
            input.previousElementSibling.textContent
                .replace(": ", "");

        if (key === "floor") {
            selectedRoom.floor = Number(input.value) || 1;
        } else {
            selectedRoom[key] = input.value;
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
// Editable fields such as name, floor, and notes receive form controls.
// Structural properties remain visible as read-only information when they
// are not listed in hoverExceptions.
function updateRoomEditor() {
    const hoverExceptions = [
        "roomID",
        "connections",
        "position",
        "size",
        "editorSize",
        "textSize"
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

            input.type = "text";
            input.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            editorContent.appendChild(fieldContainer);

            continue;
        }

        // Notes use a textarea so multiple lines can be entered.
        if (key === "notes") {
            const fieldContainer = document.createElement("div");
            const label = document.createElement("label");
            const textarea = document.createElement("textarea");

            fieldContainer.classList.add("room-editor-notes");

            label.textContent = "notes: ";

            textarea.value = value;

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(textarea);
            editorContent.appendChild(fieldContainer);

            continue;
        }

        // Remaining non-editable room properties are displayed as plain text.
        const field = document.createElement("div");

        field.textContent = `${key}: ${value}`;

        editorContent.appendChild(field);
    }
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