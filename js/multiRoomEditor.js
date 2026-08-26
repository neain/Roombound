// ============================================================
// IMPORTS
// ============================================================

// Room rendering and room operations.
// CURRENT: deleteRoom(), duplicateRooms(), getSelectedRooms()
// If changing how multi-room actions affect rooms, inspect:
//   ./roomRenderer.js
import {
    deleteRoom,
    duplicateRooms,
    getSelectedRooms
} from "./roomRenderer.js";

import {
    renderMap
} from "./mapRenderer.js";

import {
    createGroup,
    isGroup,
    deleteGroup
} from "./group.js";

import {
    createWindow
} from "./window.js";


// ============================================================
// MULTI-ROOM EDITOR STATE
// ============================================================

// The single multi-room editor window currently displayed, if any.
let multiRoomEditorWindow = null;

// Map/rendering information used by the multi-room editor.
let editorContext = null;

// Last saved screen position of the multi-room editor.
let editorPosition = null;


// ============================================================
// MULTI-ROOM EDITOR
// ============================================================

// Opens the multi-room editor for the current room selection.
//
// The editor does not own a room list. All operations query the current
// room selection so rooms can be added or removed while the editor is open.
export function openMultiRoomEditor(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    if (getSelectedRooms().length < 2) {
        return;
    }

    editorContext = {
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    };

    if (multiRoomEditorWindow) {
        multiRoomEditorWindow.remove();
        multiRoomEditorWindow = null;
    }

    multiRoomEditorWindow =
        createWindow(
            "Edit Selected Rooms",
            closeMultiRoomEditor
        );

    const multiRoomEditor =
        multiRoomEditorWindow.element;

    multiRoomEditor.classList.add(
        "room-editor",
        "multi-room-editor"
    );

    multiRoomEditorWindow.setSize(
        map.editorSize.width,
        map.editorSize.height
    );

    // --------------------------------------------------------
    // Editor content
    // --------------------------------------------------------

    const editorContent =
        document.createElement("div");

    editorContent.classList.add(
        "room-editor-content"
    );

    addColorControls(
        editorContent
    );

    addAlignmentControls(
        editorContent
    );

    addActionControls(
        editorContent
    );

    multiRoomEditorWindow.content.appendChild(
        editorContent
    );

    // Restore the editor's previous screen position when possible.
    if (editorPosition) {
        multiRoomEditorWindow.setPosition(
            editorPosition.x,
            editorPosition.y
        );
    }
}


// ============================================================
// COLOR
// ============================================================

// Adds the color controls used to change every selected room.
function addColorControls(
    editorContent
) {
    const fieldContainer = document.createElement("div");
    const label = document.createElement("label");
    const colorText = document.createElement("input");
    const colorInput = document.createElement("input");
    const applyButton = document.createElement("button");
    const defaultButton = document.createElement("button");

    fieldContainer.classList.add(
        "room-editor-field"
    );

    label.textContent = "color: ";

    colorText.type = "text";
    colorText.placeholder = "Color";

    colorInput.type = "color";
    colorInput.value = getCommonColor();

    applyButton.type = "button";
    applyButton.textContent = "Apply";

    defaultButton.type = "button";
    defaultButton.textContent = "Default";

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
            }
        }
    );

    colorInput.addEventListener(
        "input",
        () => {
            colorText.value =
                colorInput.value;
        }
    );

    applyButton.addEventListener(
        "click",
        () => {
            if (
                !/^#[0-9a-fA-F]{6}$/.test(
                    colorText.value
                )
            ) {
                return;
            }

            for (const room of getSelectedRooms()) {
                room.color =
                    colorText.value;
            }

            refreshMultiRoomMap();
        }
    );

    defaultButton.addEventListener(
        "click",
        () => {
            for (const room of getSelectedRooms()) {
                delete room.color;
            }

            refreshMultiRoomMap();
        }
    );

    fieldContainer.appendChild(
        label
    );

    fieldContainer.appendChild(
        colorText
    );

    fieldContainer.appendChild(
        colorInput
    );

    fieldContainer.appendChild(
        applyButton
    );

    fieldContainer.appendChild(
        defaultButton
    );

    editorContent.appendChild(
        fieldContainer
    );
}


// Returns the common color of the currently selected rooms.
//
// When the rooms do not share a color, the standard room color is used as the
// color-picker starting value.
function getCommonColor() {
    const selectedRooms =
        getSelectedRooms();

    if (selectedRooms.length === 0) {
        return "#333333";
    }

    const firstColor =
        selectedRooms[0].color;

    if (
        firstColor &&
        selectedRooms.every(
            (room) =>
                room.color === firstColor
        )
    ) {
        return firstColor;
    }

    return "#333333";
}


// ============================================================
// ALIGNMENT
// ============================================================

// Adds the alignment controls in a visual directional layout.
function addAlignmentControls(
    editorContent
) {
    const section = document.createElement("div");
    const title = document.createElement("div");

    const alignmentGrid = document.createElement("div");

    const leftButton = document.createElement("button");
    const centerHorizontalButton =
        document.createElement("button");
    const rightButton = document.createElement("button");

    const topButton = document.createElement("button");
    const centerVerticalButton =
        document.createElement("button");
    const bottomButton = document.createElement("button");

    section.classList.add(
        "room-editor-alignment"
    );

    title.textContent = "Alignment";

    alignmentGrid.classList.add(
        "multi-room-alignment-grid"
    );

    leftButton.textContent =
        "← Left";

    centerHorizontalButton.textContent =
        "↔ H-Center";

    rightButton.textContent =
        "Right →";

    topButton.textContent =
        "↑ Top";

    centerVerticalButton.textContent =
        "↕ V-Center";

    bottomButton.textContent =
        "↓ Bottom";

    leftButton.classList.add(
        "multi-room-align-left"
    );

    centerHorizontalButton.classList.add(
        "multi-room-align-horizontal-center"
    );

    rightButton.classList.add(
        "multi-room-align-right"
    );

    topButton.classList.add(
        "multi-room-align-top"
    );

    centerVerticalButton.classList.add(
        "multi-room-align-vertical-center"
    );

    bottomButton.classList.add(
        "multi-room-align-bottom"
    );

    leftButton.addEventListener(
        "click",
        alignLeft
    );

    centerHorizontalButton.addEventListener(
        "click",
        alignHorizontalCenter
    );

    rightButton.addEventListener(
        "click",
        alignRight
    );

    topButton.addEventListener(
        "click",
        alignTop
    );

    centerVerticalButton.addEventListener(
        "click",
        alignVerticalCenter
    );

    bottomButton.addEventListener(
        "click",
        alignBottom
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    alignmentGrid.appendChild(
        topButton
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    alignmentGrid.appendChild(
        leftButton
    );

    alignmentGrid.appendChild(
        centerHorizontalButton
    );

    alignmentGrid.appendChild(
        rightButton
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    alignmentGrid.appendChild(
        centerVerticalButton
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    alignmentGrid.appendChild(
        bottomButton
    );

    alignmentGrid.appendChild(
        document.createElement("div")
    );

    section.appendChild(
        title
    );

    section.appendChild(
        alignmentGrid
    );

    editorContent.appendChild(
        section
    );
}


// Aligns every selected room to the left edge of the selection.
function alignLeft() {
    let minX = Infinity;

    for (const room of getSelectedRooms()) {
        minX = Math.min(
            minX,
            room.position.x
        );
    }

    for (const room of getSelectedRooms()) {
        room.position.x = minX;
    }

    refreshMultiRoomMap();
}


// Aligns every selected room to the right edge of the selection.
function alignRight() {
    let maxRight = -Infinity;

    for (const room of getSelectedRooms()) {
        maxRight = Math.max(
            maxRight,
            room.position.x + room.size.width
        );
    }

    for (const room of getSelectedRooms()) {
        room.position.x =
            maxRight - room.size.width;
    }

    refreshMultiRoomMap();
}


// Aligns every selected room's horizontal center.
function alignHorizontalCenter() {
    let minX = Infinity;
    let maxRight = -Infinity;

    for (const room of getSelectedRooms()) {
        minX = Math.min(
            minX,
            room.position.x
        );

        maxRight = Math.max(
            maxRight,
            room.position.x + room.size.width
        );
    }

    const centerX =
        (minX + maxRight) / 2;

    for (const room of getSelectedRooms()) {
        room.position.x =
            Math.round(
                centerX -
                room.size.width / 2
            );
    }

    refreshMultiRoomMap();
}


// Aligns every selected room to the top edge of the selection.
function alignTop() {
    let minY = Infinity;

    for (const room of getSelectedRooms()) {
        minY = Math.min(
            minY,
            room.position.y
        );
    }

    for (const room of getSelectedRooms()) {
        room.position.y = minY;
    }

    refreshMultiRoomMap();
}


// Aligns every selected room to the bottom edge of the selection.
function alignBottom() {
    let maxBottom = -Infinity;

    for (const room of getSelectedRooms()) {
        maxBottom = Math.max(
            maxBottom,
            room.position.y + room.size.height
        );
    }

    for (const room of getSelectedRooms()) {
        room.position.y =
            maxBottom - room.size.height;
    }

    refreshMultiRoomMap();
}


// Aligns every selected room's vertical center.
function alignVerticalCenter() {
    let minY = Infinity;
    let maxBottom = -Infinity;

    for (const room of getSelectedRooms()) {
        minY = Math.min(
            minY,
            room.position.y
        );

        maxBottom = Math.max(
            maxBottom,
            room.position.y + room.size.height
        );
    }

    const centerY =
        (minY + maxBottom) / 2;

    for (const room of getSelectedRooms()) {
        room.position.y =
            Math.round(
                centerY -
                room.size.height / 2
            );
    }

    refreshMultiRoomMap();
}


// ============================================================
// ACTIONS
// ============================================================

// Adds the multi-room actions.
function addActionControls(
    editorContent
) {
    const section = document.createElement("div");

    const deleteButton =
        document.createElement("button");

    const groupButton =
        document.createElement("button");

    const duplicateButton =
        document.createElement("button");

    deleteButton.textContent =
        "Delete All";

    groupButton.textContent =
        "Combine";

    groupButton.title =
        "Combine selected rooms into a single room";

    duplicateButton.textContent =
        "Duplicate";

    deleteButton.classList.add(
        "delete-button"
    );

    deleteButton.addEventListener(
        "click",
        deleteSelectedRooms
    );

    duplicateButton.addEventListener(
        "click",
        duplicateSelectedRooms
    );

    groupButton.addEventListener(
        "click",
        groupSelectedRooms
    );

    section.classList.add(
        "room-editor-buttons"
    );

    section.appendChild(
        deleteButton
    );

    section.appendChild(
        groupButton
    );

    section.appendChild(
        duplicateButton
    );

    editorContent.appendChild(
        section
    );
}


// Deletes every room or group currently in the selection.
//
// Groups are passed through the standard group deletion path. Normal rooms
// continue through the standard room deletion path so their connections are
// cleaned up.
function deleteSelectedRooms() {
    const selectedRooms =
        getSelectedRooms();

    const roomsToDelete =
        [...selectedRooms];

    for (const room of roomsToDelete) {
        if (isGroup(room)) {
            deleteGroup(
                editorContext.map,
                room
            );

            continue;
        }

        deleteRoom(
            editorContext.map,
            room.roomID
        );
    }

    closeMultiRoomEditor();
}


// Combines every selected room or group on the current floor.
//
// All selected objects are combined into a new group. Existing groups are
// absorbed into the new group rather than being modified in place.
function groupSelectedRooms() {
    const selectedRooms =
        getSelectedRooms();

    const objectsOnCurrentFloor =
        selectedRooms.filter(
            (object) =>
                object.floor === editorContext.currentFloor
        );

    if (objectsOnCurrentFloor.length < 2) {
        return;
    }

    createGroup(
        editorContext.map,
        objectsOnCurrentFloor,
        editorContext.currentFloor
    );

    refreshMultiRoomMap();
}


// Duplicates every room currently in the selection.
//
// The duplicate operation creates new room data, offsets the duplicated
// rooms, selects them, and refreshes the visible map.
function duplicateSelectedRooms() {
    duplicateRooms(
        getSelectedRooms(),
        editorContext.map
    );
}


// ============================================================
// RENDERING
// ============================================================

// Refreshes the visible map after a multi-room operation.
function refreshMultiRoomMap() {
    renderMap();
}


// ============================================================
// CLOSE
// ============================================================

// Closes the multi-room editor without changing room selection.
export function closeMultiRoomEditor() {
    if (!multiRoomEditorWindow) {
        return;
    }

    editorPosition =
        multiRoomEditorWindow.getPosition();

    multiRoomEditorWindow.remove();

    multiRoomEditorWindow = null;
    editorContext = null;
}


// ============================================================
// GROUP POSITION
// ============================================================

// Returns the top-left position that contains every supplied room.
export function getGroupPosition(
    rooms
) {
    let minX = Infinity;
    let minY = Infinity;

    for (const room of rooms) {
        minX =
            Math.min(
                minX,
                room.position.x
            );

        minY =
            Math.min(
                minY,
                room.position.y
            );
    }

    return {
        x: minX,
        y: minY
    };
}