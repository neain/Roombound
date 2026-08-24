// ============================================================
// IMPORTS
// ============================================================

// Room rendering router.
// CURRENT: renderRooms(), deleteRoom()
// If changing how multi-room actions redraw the map, inspect:
//   ../roomRenderer.js
import {
    renderRooms,
    deleteRoom,
    duplicateRooms,
    getSelectedRooms
} from "./roomRenderer.js";

// Connection rendering router.
// CURRENT: renderConnections()
// If changing how room changes affect connections, inspect:
//   ../connectionRenderer.js
import {
    renderConnections
} from "./connectionRenderer.js";


// ============================================================
// MULTI-ROOM EDITOR STATE
// ============================================================

// The single multi-room editor instance currently displayed, if any.
let multiRoomEditor = null;

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

    if (multiRoomEditor) {
        multiRoomEditor.remove();
        multiRoomEditor = null;
    }

    const editorHeader = document.createElement("div");
    const editorTitleGroup = document.createElement("div");
    const editorTitle = document.createElement("span");
    const closeButton = document.createElement("button");
    const editorContent = document.createElement("div");

    multiRoomEditor = document.createElement("div");

    multiRoomEditor.classList.add(
        "room-editor",
        "multi-room-editor"
    );

    multiRoomEditor.style.width =
        `${map.editorSize.width}px`;

    multiRoomEditor.style.height =
        `${map.editorSize.height}px`;

    // --------------------------------------------------------
    // Editor header
    // --------------------------------------------------------

    editorHeader.classList.add(
        "room-editor-header"
    );

    editorTitleGroup.classList.add(
        "room-editor-title-group"
    );

    editorTitle.textContent =
        "Edit Selected Rooms";

    closeButton.textContent = "×";
    closeButton.classList.add(
        "room-editor-close"
    );

    closeButton.addEventListener(
        "click",
        closeMultiRoomEditor
    );

    editorTitleGroup.appendChild(
        editorTitle
    );

    editorHeader.appendChild(
        editorTitleGroup
    );

    editorHeader.appendChild(
        closeButton
    );

    // --------------------------------------------------------
    // Editor content
    // --------------------------------------------------------

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

    multiRoomEditor.appendChild(
        editorHeader
    );

    multiRoomEditor.appendChild(
        editorContent
    );

    document.body.appendChild(
        multiRoomEditor
    );

    document.addEventListener(
        "keydown",
        handleMultiRoomEditorKeydown
    );

    // Restore the editor's previous screen position when possible.
    if (editorPosition) {
        multiRoomEditor.style.left =
            `${editorPosition.x}px`;

        multiRoomEditor.style.top =
            `${editorPosition.y}px`;

        multiRoomEditor.style.right = "auto";
    }

    startMultiRoomEditorDragging(
        editorHeader
    );
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

    const cancelButton =
        document.createElement("button");

    cancelButton.classList.add(
        "multi-room-editor-cancel"
    );

    cancelButton.addEventListener(
        "click",
        closeMultiRoomEditor
    );

    section.classList.add(
        "room-editor-buttons"
    );

    cancelButton.style.display = "none";
    multiRoomEditor.appendChild(cancelButton);

    deleteButton.textContent =
        "Delete All";

    groupButton.textContent =
        "Group";

    duplicateButton.textContent =
        "Duplicate";

    groupButton.disabled = true;

    deleteButton.classList.add(
        "room-editor-delete"
    );

    deleteButton.addEventListener(
        "click",
        deleteSelectedRooms
    );

duplicateButton.addEventListener(
    "click",
    duplicateSelectedRooms
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


// Deletes every room currently in the selection.
//
// The current selection is captured before deletion because deleting rooms
// changes the selection itself.
function deleteSelectedRooms() {
    const selectedRooms =
        getSelectedRooms();

    const confirmed = confirm(
        `Delete ${selectedRooms.length} selected rooms?\n\nThis will also remove any connections attached to them.`
    );

    if (!confirmed) {
        return;
    }

    const roomsToDelete =
        [...selectedRooms];

    for (const room of roomsToDelete) {
        deleteRoom(
            editorContext.map,
            room.roomID,
            editorContext.mapElement,
            editorContext.connectionLayer,
            editorContext.zoom,
            editorContext.currentFloor
        );
    }

    closeMultiRoomEditor();
}

// Duplicates every room currently in the selection.
//
// The duplicate operation creates new room data, offsets the duplicated
// rooms, selects them, and refreshes the visible map.
function duplicateSelectedRooms() {
    duplicateRooms(
        getSelectedRooms(),
        editorContext.map,
        editorContext.mapElement,
        editorContext.connectionLayer,
        editorContext.zoom,
        editorContext.currentFloor
    );
}


// ============================================================
// RENDERING
// ============================================================

// Refreshes the visible rooms and connections after a multi-room operation.
function refreshMultiRoomMap() {
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
}


// ============================================================
// CLOSE
// ============================================================

// Closes the multi-room editor when Escape is pressed anywhere in the document.
function handleMultiRoomEditorKeydown(event) {
    if (
        event.key !== "Escape" ||
        !multiRoomEditor
    ) {
        return;
    }

    event.preventDefault();

    closeMultiRoomEditor();
}

// Closes the multi-room editor without changing room selection.
export function closeMultiRoomEditor() {
    if (!multiRoomEditor) {
        return;
    }

    editorPosition = {
        x: multiRoomEditor.offsetLeft,
        y: multiRoomEditor.offsetTop
    };

    document.removeEventListener(
        "keydown",
        handleMultiRoomEditorKeydown
    );

    multiRoomEditor.remove();

    multiRoomEditor = null;
    editorContext = null;
}


// ============================================================
// EDITOR DRAGGING
// ============================================================

// Adds dragging behavior to the multi-room editor header.
function startMultiRoomEditorDragging(
    editorHeader
) {
    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    function startDrag(event) {
        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startEditorX =
            multiRoomEditor.offsetLeft;

        startEditorY =
            multiRoomEditor.offsetTop;

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

        multiRoomEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        multiRoomEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        multiRoomEditor.style.right = "auto";
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