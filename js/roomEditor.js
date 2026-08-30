// ============================================================
// IMPORTS
// ============================================================

// Room rendering and room deletion.
// CURRENT: renderRooms(), deleteRoom()
// If changing how editor actions affect the room map, inspect:
//   ./roomRenderer.js
import {
    deleteRoom
} from "./roomRenderer.js";

import {
    deleteGroup
} from "./group.js";

// Map rendering.
// CURRENT: initializeMapRenderer()
// If working on the complete visual redraw of the map, inspect:
//   ./mapRenderer.js
import {
    renderMap
} from "./mapRenderer.js";

// Connection creation and editing.
// CURRENT: openConnectionEditor()
import {
    openConnectionEditor
} from "./connectionEditor.js";

import {
    createWindow
} from "./window.js";


// ============================================================
// ROOM EDITOR STATE
// ============================================================

// The room or group currently selected by the user.
let selectedRoom = null;

// The single room editor instance currently displayed, if any.
let windowShell = null;

// Container holding the fields inside the room editor.
let editorContent = null;
let editorButtons = null;

// Map/rendering information needed by the editor when it needs to modify the
// selected room or redraw the map.
let editorContext = null;

// Last saved screen position of the room editor.
let editorPosition = null;

// Visual indicator showing whether the current editor has unsaved changes.
let editorChangedIndicator = null;
let editorShapeSelect = null;

// Tracks which individual editor fields were actually changed.
// The generic editorChanged state remains responsible for the visual
// "Changed" indicator, while these flags determine what Save persists.
let editorFieldChanged = {
    floor: false,
    name: false,
    shape: false,
    color: false,
    notes: false,
    editorSize: false
};


// ============================================================
// ROOM SELECTION
// ============================================================

// Returns the room or group currently selected by the user, or null when no
// room or group is selected.
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

// Returns whether the currently selected object is a group.
function isSelectedGroup() {
    return Boolean(
        selectedRoom &&
        selectedRoom.groupID
    );
}

// Converts a data property name into a user-visible field label.
function getFieldLabel(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
}

// Opens the room editor for a specific room or group.
//
// Groups use the same editor as rooms. Fields that do not apply to groups are
// handled specially by updateRoomEditor() and saveRoomEditor().
export function openRoomEditor(
    room,
    map,
    mapElement,
    connectionLayer,
    currentFloor
) {
    console.log(
        "openRoomEditor called:",
        room
    );

    selectedRoom = room;

    // Store the map/rendering context so editor actions can modify the selected
    // room or group and redraw the map.
    editorContext = {
        map,
        mapElement,
        connectionLayer,
        currentFloor
    };

    // Create the editor the first time a room is opened.
    if (!windowShell) {
        windowShell =
            createWindow(
                "Room Editor",
                cancelRoomEditor
            );

        windowShell.setSize(
            map.editorSize.width,
            map.editorSize.height
        );

        // --------------------------------------------------------
        // Editor header
        // --------------------------------------------------------

        const editorTitleGroup =
            document.createElement("div");

        const editorChanged =
            document.createElement("span");

        editorChanged.textContent =
            "Changed";

        editorChanged.hidden = true;

        editorChangedIndicator =
            editorChanged;

        // The generic window shell owns the title and close button.
        // The room editor only adds its changed indicator.
        editorTitleGroup.appendChild(
            windowShell.title
        );

        editorTitleGroup.appendChild(
            editorChanged
        );

        windowShell.addHeaderElement(
            editorTitleGroup
        );

        // --------------------------------------------------------
        // Editor content
        // --------------------------------------------------------

        const editorFields =
            document.createElement("div");

        editorFields.classList.add(
            "room-editor-fields"
        );

        windowShell.content.appendChild(
            editorFields
        );

        editorContent =
            editorFields;

        // --------------------------------------------------------
        // Editor buttons
        // --------------------------------------------------------

        editorButtons = document.createElement("div");
        editorButtons.classList.add(
            "room-editor-buttons"
        );

        const saveButton =
            document.createElement("button");

        const editConnectionsButton =
            document.createElement("button");

        const deleteButton =
            document.createElement("button");

        deleteButton.classList.add(
            "delete-button"
        );

        const cancelButton =
            document.createElement("button");

        saveButton.textContent =
            "Save";

        editConnectionsButton.textContent =
            "Edit Connections";

        deleteButton.textContent =
            "Delete";

        cancelButton.textContent =
            "Cancel";

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
                if (!selectedRoom) {
                    return;
                }

                if (isSelectedGroup()) {
                    const deleted =
                        deleteGroup(
                            editorContext.map,
                            selectedRoom
                        );

                    if (!deleted) {
                        closeRoomEditor();
                        return;
                    }

                    closeRoomEditor();
                    return;
                }

                const deleted =
                    deleteRoom(
                        editorContext.map,
                        selectedRoom.roomID
                    );

                if (!deleted) {
                    return;
                }

                closeRoomEditor();
            }
        );

        cancelButton.addEventListener(
            "click",
            cancelRoomEditor
        );

        editorButtons.appendChild(
            saveButton
        );

        editorButtons.appendChild(
            editConnectionsButton
        );

        editorButtons.appendChild(
            deleteButton
        );

        editorButtons.appendChild(
            cancelButton
        );

        windowShell.content.appendChild(
            editorButtons
        );

        // Restore the editor's last saved screen position when possible.
        if (editorPosition) {
            windowShell.setPosition(
                editorPosition.x,
                editorPosition.y
            );
        }
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

        editorContent.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Enter" ||
                    event.target.tagName === "TEXTAREA"
                ) {
                    return;
                }

                event.preventDefault();
                saveRoomEditor();
                closeRoomEditor();
            }
        );

        windowShell.onResize(
            () => {
                editorFieldChanged.editorSize = true;
                setEditorChanged(true);
            }
        );
    }

    // Every room can remember its preferred editor dimensions.
    windowShell.setSize(
        map.editorSize.width,
        map.editorSize.height
    );

    // Opening an object starts a fresh editing session. No field is considered
    // changed until the user actually modifies it.
    editorFieldChanged = {
        floor: false,
        name: false,
        shape: false,
        color: false,
        notes: false,
        editorSize: false
    };

    setEditorChanged(false);
    updateRoomEditor();
}


// ============================================================
// ROOM EDITOR
// ============================================================

// Updates the editor's visual changed indicator.
function setEditorChanged(changed) {
    if (!editorChangedIndicator) {
        return;
    }

    editorChangedIndicator.style.display =
        changed ? "inline" : "none";
}


// Saves the current contents of the room editor back into the selected room
// or group.
//
// Only fields that were actually changed during the editing session are
// written back to the selected object. This prevents unrelated saves from
// overwriting existing data such as a group's color.
function saveRoomEditor() {
    const inputs =
        editorContent.querySelectorAll("input");

    const textarea =
        editorContent.querySelector("textarea");

    let colorText;
    let colorValue;

    if (editorFieldChanged.floor) {
        const floorInput =
            [...inputs].find(
                (input) =>
                    input.previousElementSibling?.textContent
                        .replace(": ", "") === "floor"
            );

        if (floorInput) {
            const floor =
                Number(floorInput.value);

            if (isSelectedGroup()) {
                applyGroupFloor(floor);
            } else {
                selectedRoom.floor = floor;
            }
        }
    }

    if (editorFieldChanged.name) {
        const nameInput =
            [...inputs].find(
                (input) =>
                    input.previousElementSibling?.textContent
                        .replace(": ", "") === "name"
            );

        if (nameInput) {
            selectedRoom.name = nameInput.value;
        }
    }

    if (
        editorFieldChanged.shape &&
        editorShapeSelect &&
        !isSelectedGroup()
    ) {
        selectedRoom.shape = editorShapeSelect.value;
    }

    if (editorFieldChanged.color) {
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

            if (isSelectedGroup()) {
                applyGroupColor(colorValue);
            } else {
                applyRoomColor(
                    selectedRoom,
                    colorValue
                );
            }
        }
    }

    if (editorFieldChanged.notes && textarea) {
        selectedRoom.notes = textarea.value;
    }

    // Recalculate the displayed-name font size using the newly saved object.
    //
    // Rooms and groups both store their own size, so the same calculation
    // applies to either object.
    if (
        editorFieldChanged.name ||
        editorFieldChanged.shape ||
        editorFieldChanged.floor
    ) {
        selectedRoom.textSize =
            calculateRoomTextSize(selectedRoom);
    }

if (editorFieldChanged.editorSize) {
    editorContext.map.editorSize =
        windowShell.getSize();
}

editorPosition = windowShell.getPosition();

    // Re-apply floor filter so an object moved to another floor disappears.
    renderMap();

    setEditorChanged(false);
}


// Applies a group's selected floor to every room belonging to the group.
//
// The group and all of its member rooms must remain on the same floor so the
// group continues to behave as a single room-like object when floors change.
function applyGroupFloor(floor) {
    selectedRoom.floor = floor;

    for (const room of getGroupRooms(selectedRoom)) {
        room.floor = floor;
    }
}


// Applies a color directly to a room.
function applyRoomColor(room, colorValue) {
    if (colorValue === "") {
        delete room.color;
        return;
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(colorValue)) {
        return;
    }

    room.color = colorValue;
}


// Applies a color to a group and every room belonging to that group.
function applyGroupColor(colorValue) {
    if (
        colorValue !== "" &&
        !/^#[0-9a-fA-F]{6}$/.test(colorValue)
    ) {
        return;
    }

    if (colorValue === "") {
        delete selectedRoom.color;
    } else {
        selectedRoom.color = colorValue;
    }

    for (const room of getGroupRooms(selectedRoom)) {
        applyRoomColor(room, colorValue);
    }
}


// Returns the actual room objects belonging to a group.
function getGroupRooms(group) {
    if (
        !group ||
        !Array.isArray(group.roomIDs) ||
        !editorContext?.map
    ) {
        return [];
    }

    const rooms = [];

    for (const roomID of group.roomIDs) {
        const room =
            editorContext.map.rooms.find(
                (mapRoom) => mapRoom.roomID === roomID
            );

        if (room) {
            rooms.push(room);
        }
    }

    return rooms;
}


// Cancels the current room editing session.
function cancelRoomEditor() {
    closeRoomEditor();
}


// Removes the current room editor and clears its associated state.
export function closeRoomEditor() {
    if (!windowShell) {
        return;
    }

    windowShell.remove();

    windowShell = null;
    editorContent = null;
    selectedRoom = null;
    editorChangedIndicator = null;
    editorShapeSelect = null;

    renderMap();
}


// Rebuilds the contents of the room editor from the currently selected room
// or group.
//
// Groups expose the same user-facing fields as rooms where applicable.
// Structural group properties remain hidden, and shape remains visible but
// disabled because groups always render as rectangles.
function updateRoomEditor() {
    const hoverExceptions = [
        "roomID",
        "groupID",
        "roomIDs",
        "connections",
        "position",
        "size",
        "editorSize",
        "textSize",
        "color"
    ];

    const isGroup =
        isSelectedGroup();

    editorContent.innerHTML = "";

    for (const [key, value] of Object.entries(selectedRoom)) {
        if (hoverExceptions.includes(key)) {
            continue;
        }

        // Standard editable single-value fields.
        if (key === "name" || key === "floor") {
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

            input.type =
                key === "floor"
                    ? "number"
                    : "text";

            input.value = value;

            input.addEventListener(
                "input",
                () => {
                    editorFieldChanged[key] = true;
                }
            );

            input.addEventListener(
                "change",
                () => {
                    editorFieldChanged[key] = true;
                }
            );

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);
            editorContent.appendChild(fieldContainer);

            if (key === "name") {
                input.focus();
                input.select();
            }
            
            continue;
        }

        // Notes use a textarea so multiple lines can be entered.
        if (key === "notes") {
            continue;
        }

        // Remaining non-editable properties are displayed as plain text.
        const field =
            document.createElement("div");

        field.textContent =
            `${key}: ${value}`;

        editorContent.appendChild(field);


    }



    // --------------------------------------------------------
    // Shape
    // --------------------------------------------------------

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

    for (const [value, label] of shapes) {
        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = label;

        shapeSelect.appendChild(option);
    }

    shapeSelect.value =
        selectedRoom.shape || "rectangle";

    editorShapeSelect =
        shapeSelect;

    if (isGroup) {
        shapeSelect.disabled = true;
        shapeSelect.title =
            "Groups always use a rectangle based on their member rooms.";
    }

    shapeSelect.addEventListener(
        "change",
        () => {
            editorFieldChanged.shape = true;
        }
    );

    shapeFieldContainer.appendChild(
        shapeLabel
    );

    shapeFieldContainer.appendChild(
        shapeSelect
    );

    editorContent.appendChild(
        shapeFieldContainer
    );

    // --------------------------------------------------------
    // Color
    // --------------------------------------------------------

    const colorFieldContainer =
        document.createElement("div");

    const colorLabel =
        document.createElement("label");

    const colorInput =
        document.createElement("input");

    const colorText =
        document.createElement("input");

    colorFieldContainer.classList.add(
        "room-editor-field"
    );

    colorLabel.textContent =
        "color: ";

    colorText.type = "text";

    colorText.value =
        isGroup
            ? getGroupColor(selectedRoom)
            : selectedRoom.color || "";

    colorInput.type = "color";

    colorInput.value =
        isGroup
            ? getGroupColor(selectedRoom) || "#333333"
            : selectedRoom.color || "#333333";

    colorText.addEventListener(
        "input",
        () => {
            editorFieldChanged.color = true;

            if (
                /^#[0-9a-fA-F]{6}$/.test(
                    colorText.value
                )
            ) {
                colorInput.value =
                    colorText.value;
            }
        }
    );

    colorText.addEventListener(
        "change",
        () => {
            editorFieldChanged.color = true;
        }
    );

    colorInput.addEventListener(
        "input",
        () => {
            editorFieldChanged.color = true;
            colorText.value =
                colorInput.value;
        }
    );

    colorInput.addEventListener(
        "change",
        () => {
            editorFieldChanged.color = true;
        }
    );

    colorFieldContainer.appendChild(colorLabel);
    colorFieldContainer.appendChild(colorText);
    colorFieldContainer.appendChild(colorInput);

    // --------------------------------------------------------
    // Notes
    // --------------------------------------------------------

    const notesFieldContainer =
        document.createElement("div");

    const notesLabel =
        document.createElement("label");

    const notesTextarea =
        document.createElement("textarea");

    notesFieldContainer.classList.add(
        "room-editor-notes"
    );

    notesLabel.textContent =
        "notes: ";

    notesTextarea.value =
        selectedRoom.notes || "";

    notesTextarea.addEventListener(
        "input",
        () => {
            editorFieldChanged.notes = true;
        }
    );

    notesTextarea.addEventListener(
        "change",
        () => {
            editorFieldChanged.notes = true;
        }
    );

    notesFieldContainer.appendChild(
        notesLabel
    );

    notesFieldContainer.appendChild(
        notesTextarea
    );

    editorContent.appendChild(
        colorFieldContainer
    );

    editorContent.appendChild(
        notesFieldContainer
    );
}


// Returns the color shared by all rooms in a group.
//
// When the rooms do not share one color, the group's own color is used as the
// starting value. If neither provides a color, the normal default is used.
function getGroupColor(group) {
    const rooms =
        getGroupRooms(group);

    if (
        group.color &&
        rooms.every(
            (room) =>
                room.color === group.color
        )
    ) {
        return group.color;
    }

    if (rooms.length === 0) {
        return group.color || "";
    }

    const firstColor =
        rooms[0].color;

    if (
        firstColor &&
        rooms.every(
            (room) =>
                room.color === firstColor
        )
    ) {
        return firstColor;
    }

    return group.color || "";
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

    fieldContainer.classList.add("room-editor-field");

    label.textContent =
        `${key}: `;

    input.type = "text";
    input.value = value;

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);

    editorContent.appendChild(fieldContainer);
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
            'input[type="color"]'
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

    colorInput.addEventListener(
        "input",
        () => {
            colorText.value =
                colorInput.value;

            editorFieldChanged.color = true;
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

                editorFieldChanged.color = true;
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

// Determines the largest font size that allows a room or group name to fit
// inside its stored bounds without overflowing.
//
// Rooms and groups both provide their own size, so the same calculation can
// be used for either object.
function calculateRoomTextSize(room) {
    const roomElement =
        document.createElement("div");

    let textSize;
    let roomWidth;
    let roomHeight;
    let fits;
    let fitsAtDefaultSize;

    roomWidth = room.size.width * 15;
    roomHeight = room.size.height * 15;

    roomElement.classList.add("room");

    roomElement.textContent =
        room.name;

    roomElement.style.width =
        `${roomWidth}px`;

    roomElement.style.height =
        `${roomHeight}px`;

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
        roomElement.style.fontSize =
            `${textSize}px`;

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