// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: CONNECTION_ROOM_RANGE, CONNECTION_SIDES, gridToPixels(), getRoom()
// If working on connection search ranges, connection side definitions,
// coordinate conversion, or map lookups, inspect:
//   ./mapUtils.js
import {
    CONNECTION_ROOM_RANGE,
    CONNECTION_SIDES,
    gridToPixels,
    getRoom
} from "./mapUtils.js";

// Connection rendering and connection geometry.
// CURRENT: renderConnections(), setSelectedConnectionEndpoint(),
//          clearSelectedConnectionEndpoint()
// If working on how connections are drawn, positioned, spaced along room
// sides, or represented as SVG, inspect:
//   ./connectionRenderer.js
import {
    renderConnections,
    setSelectedConnectionEndpoint,
    clearSelectedConnectionEndpoint
} from "./connectionRenderer.js";


// ============================================================
// CONNECTION EDITOR STATE
// ============================================================

// The connection editor currently being displayed, if any.
let connectionEditor = null;

// Map/rendering information needed when a connection is modified.
let connectionEditorContext = null;

// The room whose connections are currently being edited.
let editedRoom = null;

// The connection currently selected in the connection editor.
let selectedConnection = null;

// The endpoint currently selected within the selected connection.
let selectedEndpoint = null;

// The container holding the currently displayed endpoint options.
let connectionOptions = null;


// ============================================================
// CONNECTION EDITOR
// ============================================================

// Opens the connection editor for the supplied room.
//
// Every connection involving the selected room is included, regardless of
// whether the room is endpoint A or endpoint B.
export function openConnectionEditor(
    map,
    room,
    mapElement,
    connectionLayer,
    zoom = 1
) {
    connectionEditorContext = {
        map,
        connectionLayer,
        zoom
    };

    const connections = [];

    for (const connection of map.connections) {
        const roomA =
            getRoom(
                map,
                connection.roomA
            );

        const roomB =
            getRoom(
                map,
                connection.roomB
            );

        if (
            connection.roomA !== room.roomID &&
            connection.roomB !== room.roomID
        ) {
            continue;
        }

        connections.push({
            connection,
            roomA,
            roomB
        });
    }

    editedRoom = room;

    if (connectionEditor) {
        connectionEditor.remove();
    }

    connectionEditor = document.createElement("div");
    connectionEditor.classList.add("connection-editor");

    // --------------------------------------------------------
    // Editor header
    // --------------------------------------------------------

    const editorHeader = document.createElement("div");
    editorHeader.classList.add("connection-editor-header");

    const editorTitle = document.createElement("span");
    editorTitle.textContent = "Connection Editor";

    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.classList.add("connection-editor-close");

    closeButton.addEventListener(
        "click",
        closeConnectionEditor
    );

    editorHeader.appendChild(editorTitle);
    editorHeader.appendChild(closeButton);

    connectionEditor.appendChild(editorHeader);

    // --------------------------------------------------------
    // Editor content
    // --------------------------------------------------------

    const editorContent = document.createElement("div");
    editorContent.classList.add("connection-editor-content");

    const roomLabel = document.createElement("div");
    roomLabel.textContent = `Room: ${room.name}`;

    editorContent.appendChild(roomLabel);

    if (connections.length === 0) {
        const emptyMessage = document.createElement("div");
        emptyMessage.textContent =
            "This room has no connections.";

        editorContent.appendChild(emptyMessage);
    }

    for (const entry of connections) {
        const connectionElement =
            document.createElement("div");

        connectionElement.classList.add(
            "connection-editor-connection"
        );

        updateConnectionElement(
            entry,
            connectionElement
        );

        connectionElement.addEventListener(
            "click",
            () => {
                selectConnection(
                    entry,
                    connectionElement
                );
            }
        );

        editorContent.appendChild(connectionElement);
    }

    connectionEditor.appendChild(editorContent);

    document.body.appendChild(connectionEditor);

    startConnectionEditorDragging(editorHeader);

    console.log(
        `Opened connection editor for ${room.name}`,
        connections
    );
}


// ============================================================
// CONNECTION SELECTION
// ============================================================

// Selects a connection in the connection editor.
//
// The selected connection receives a containing group so that the connection
// and all of its editing options remain visually associated while the user
// moves through the editing hierarchy.
function selectConnection(
    entry,
    connectionElement
) {
    if (selectedConnection) {
        selectedConnection.element.classList.remove(
            "selected"
        );
    }

    selectedConnection = {
        entry,
        element: connectionElement
    };

    selectedEndpoint = null;

    clearSelectedConnectionEndpoint();

    connectionElement.classList.add("selected");

    removeConnectionContextOptions();

    // --------------------------------------------------------
    // Restore the connection element to the editor before
    // creating its new selection group.
    // --------------------------------------------------------

    const previousGroup =
        connectionElement.parentElement;

    if (
        previousGroup &&
        previousGroup.classList.contains(
            "connection-editor-connection-group"
        )
    ) {
        const groupParent =
            previousGroup.parentElement;

        if (groupParent) {
            groupParent.insertBefore(
                connectionElement,
                previousGroup
            );
        }

        previousGroup.remove();
    }

    // --------------------------------------------------------
    // Create a containing group for the selected connection and
    // all of its future editing options.
    // --------------------------------------------------------

    const connectionGroup =
        document.createElement("div");

    connectionGroup.classList.add(
        "connection-editor-connection-group"
    );

    connectionElement.parentElement?.insertBefore(
        connectionGroup,
        connectionElement
    );

    connectionGroup.appendChild(
        connectionElement
    );

    // --------------------------------------------------------
    // Create the endpoint and direction selection row.
    // --------------------------------------------------------

    connectionOptions =
        document.createElement("div");

    connectionOptions.classList.add(
        "connection-editor-options"
    );

    const roomA =
        entry.roomA?.name || "Unconnected";

    const roomB =
        entry.roomB?.name || "Unconnected";

    const roomAButton =
        document.createElement("button");

    roomAButton.textContent =
        roomA;

    roomAButton.classList.add(
        "connection-editor-endpoint"
    );

    const directionButton =
        document.createElement("button");

    directionButton.textContent =
        getDirectionSymbol(
            entry.connection.directionTo
        );

    directionButton.classList.add(
        "connection-editor-direction"
    );

    const roomBButton =
        document.createElement("button");

    roomBButton.textContent =
        roomB;

    roomBButton.classList.add(
        "connection-editor-endpoint"
    );

    roomAButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            selectConnectionEndpoint("A");
        }
    );

    directionButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            selectConnectionDirection();
        }
    );

    roomBButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            selectConnectionEndpoint("B");
        }
    );

    connectionOptions.appendChild(
        roomAButton
    );

    connectionOptions.appendChild(
        directionButton
    );

    connectionOptions.appendChild(
        roomBButton
    );

    connectionGroup.appendChild(
        connectionOptions
    );

    console.log(
        "Selected connection:",
        entry
    );
}


// ============================================================
// CONNECTION DIRECTION
// ============================================================

// Opens the direction choices for the selected connection.
//
// A means the arrow points toward room A.
// Both means the connection points in both directions.
// B means the arrow points toward room B.
function selectConnectionDirection() {
    if (!selectedConnection || !connectionOptions) {
        return;
    }

    selectedEndpoint = null;

    clearSelectedConnectionEndpoint();

    connectionOptions
        .querySelectorAll(
            ".connection-editor-endpoint"
        )
        .forEach(
            (button) => {
                button.classList.remove("selected");
            }
        );

    const existingDirectionOptions =
        connectionOptions.nextElementSibling;

    if (
        existingDirectionOptions &&
        existingDirectionOptions.classList.contains(
            "connection-editor-direction-options"
        )
    ) {
        existingDirectionOptions.remove();
        return;
    }

    removeConnectionContextOptions();

    const directionOptions =
        document.createElement("div");

    directionOptions.classList.add(
        "connection-editor-direction-options"
    );

    const leftButton =
        document.createElement("button");

    leftButton.textContent = "←";

    const bothButton =
        document.createElement("button");

    bothButton.textContent = "↔";

    const rightButton =
        document.createElement("button");

    rightButton.textContent = "→";

    leftButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            setConnectionDirection("A");
        }
    );

    bothButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            setConnectionDirection("both");
        }
    );

    rightButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            setConnectionDirection("B");
        }
    );

    directionOptions.appendChild(
        leftButton
    );

    directionOptions.appendChild(
        bothButton
    );

    directionOptions.appendChild(
        rightButton
    );

    connectionOptions.after(
        directionOptions
    );
}


// Changes the direction of the selected connection.
//
// Direction is represented entirely by directionTo. Changing direction does
// not change either endpoint or move the connection between room objects.
function setConnectionDirection(
    direction
) {
    if (!selectedConnection) {
        return;
    }

    const connection =
        selectedConnection.entry.connection;

    connection.directionTo =
        direction;

    refreshSelectedConnection();
}


// ============================================================
// CONNECTION DISPLAY
// ============================================================

// Updates the visible connection description from the current connection
// data.
function updateConnectionElement(
    entry,
    connectionElement
) {
    const connection =
        entry.connection;

    const roomAName =
        entry.roomA?.name || "Unconnected";

    const roomBName =
        entry.roomB?.name || "Unconnected";

    const roomASide =
        connection.roomAConnectionSide &&
        connection.roomAConnectionSide !== "NONE"
            ? ` (${connection.roomAConnectionSide})`
            : "";

    const roomBSide =
        connection.roomBConnectionSide &&
        connection.roomBConnectionSide !== "NONE"
            ? ` (${connection.roomBConnectionSide})`
            : "";

    const direction =
        getDirectionSymbol(
            connection.directionTo
        );

    connectionElement.textContent =
        `${roomAName}${roomASide} ${direction} ${roomBSide}${roomBName}`;
}


// Returns the visual direction symbol for a directionTo value.
function getDirectionSymbol(directionTo) {
    if (directionTo === "A") {
        return "←";
    }

    if (directionTo === "both") {
        return "↔";
    }

    return "→";
}


// Refreshes the selected connection's visible text and redraws the map after
// a connection property changes.
function refreshSelectedConnection() {
    if (!selectedConnection) {
        return;
    }

    const entry =
        selectedConnection.entry;

    const connection =
        entry.connection;

    entry.roomA =
        getRoom(
            connectionEditorContext.map,
            connection.roomA
        );

    entry.roomB =
        getRoom(
            connectionEditorContext.map,
            connection.roomB
        );

    updateConnectionElement(
        entry,
        selectedConnection.element
    );

    const directionButton =
        connectionOptions.querySelector(
            ".connection-editor-direction"
        );

    directionButton.textContent =
        getDirectionSymbol(
            connection.directionTo
        );

    const endpointButtons =
        connectionOptions.querySelectorAll(
            ".connection-editor-endpoint"
        );

    endpointButtons[0].textContent =
        entry.roomA?.name || "Unconnected";

    endpointButtons[1].textContent =
        entry.roomB?.name || "Unconnected";

    // BEGIN EDIT
    // Keep the side selector synchronized with the currently selected
    // endpoint after the connection data changes.
    const endpointOptions =
        connectionOptions.querySelector(
            ".connection-editor-endpoint-options"
        );

    if (endpointOptions) {
        const currentRoom =
            getSelectedEndpointRoom();

        if (currentRoom) {
            createEndpointSideOptions(
                endpointOptions
            );
        } else {
            endpointOptions
                .querySelectorAll(
                    ".connection-editor-side-options"
                )
                .forEach(
                    (element) => {
                        element.remove();
                    }
                );
        }
    }
    // END EDIT

    renderConnections(
        connectionEditorContext.map,
        connectionEditorContext.connectionLayer,
        connectionEditorContext.zoom
    );
}


// ============================================================
// CONNECTION ENDPOINT SELECTION
// ============================================================

// Selects either endpoint A or endpoint B of the active connection.
//
// Selecting an endpoint displays nearby room choices and highlights the
// physical endpoint on the map.
function selectConnectionEndpoint(endpoint) {
    if (!selectedConnection || !connectionOptions) {
        return;
    }

    if (
        selectedEndpoint === endpoint &&
        connectionOptions.parentElement?.querySelector(
            ".connection-editor-endpoint-options"
        )
    ) {
        selectedEndpoint = null;

        clearSelectedConnectionEndpoint();

        connectionOptions
            .querySelectorAll(
                ".connection-editor-endpoint"
            )
            .forEach(
                (button) => {
                    button.classList.remove("selected");
                }
            );

        removeConnectionContextOptions();

        return;
    }

    selectedEndpoint = endpoint;

    connectionOptions
        .querySelectorAll(
            ".connection-editor-endpoint"
        )
        .forEach(
            (button) => {
                button.classList.remove("selected");
            }
        );

    const buttons =
        connectionOptions.querySelectorAll(
            ".connection-editor-endpoint"
        );

    const selectedButton =
        endpoint === "A"
            ? buttons[0]
            : buttons[1];

    selectedButton.classList.add("selected");

    // --------------------------------------------------------
    // Remove every previous context level before creating the
    // context for the newly selected endpoint.
    // --------------------------------------------------------

    removeConnectionContextOptions();

    const connection =
        selectedConnection.entry.connection;

    setSelectedConnectionEndpoint(
        connection,
        endpoint
    );

    createEndpointOptions();

    renderConnections(
        connectionEditorContext.map,
        connectionEditorContext.connectionLayer,
        connectionEditorContext.zoom
    );
}


// Creates the room-selection dropdown and side controls for the
// currently selected endpoint.
function createEndpointOptions() {
    if (
        !selectedConnection ||
        !connectionOptions ||
        !selectedEndpoint
    ) {
        return;
    }

    const endpointOptions =
        document.createElement("div");

    endpointOptions.classList.add(
        "connection-editor-endpoint-options"
    );

    const roomSelect =
        document.createElement("select");

    roomSelect.classList.add(
        "connection-editor-room-select"
    );

    roomSelect.addEventListener(
        "mousedown",
        () => {
            populateRoomSelect(
                roomSelect
            );
        }
    );

    roomSelect.addEventListener(
        "change",
        () => {
            setConnectionEndpointRoom(
                roomSelect.value
            );
        }
    );

    endpointOptions.appendChild(
        roomSelect
    );

    connectionOptions.after(
        endpointOptions
    );

    const currentRoom =
        getSelectedEndpointRoom();

    // BEGIN EDIT
    // A connected endpoint should always expose its side selector,
    // including when its current side is NONE.
    if (currentRoom) {
        createEndpointSideOptions(
            endpointOptions
        );
    }
    // END EDIT
}


// Populates the room dropdown with the current room, nearby rooms, and None.
function populateRoomSelect(roomSelect) {
    roomSelect.innerHTML = "";

    const currentRoom =
        getSelectedEndpointRoom();

    const candidateRooms =
        getRoomsInEndpointRange();

    if (currentRoom) {
        const currentOption =
            document.createElement("option");

        currentOption.value =
            currentRoom.roomID;

        currentOption.textContent =
            `✓ ${currentRoom.name}`;

        roomSelect.appendChild(
            currentOption
        );
    }

    for (const room of candidateRooms) {
        if (
            currentRoom &&
            room.roomID === currentRoom.roomID
        ) {
            continue;
        }

        const option =
            document.createElement("option");

        option.value =
            room.roomID;

        option.textContent =
            room.name;

        roomSelect.appendChild(
            option
        );
    }

    const noneOption =
        document.createElement("option");

    noneOption.value = "";

    noneOption.textContent =
        "🗑 None";

    roomSelect.appendChild(
        noneOption
    );

    if (currentRoom) {
        roomSelect.value =
            currentRoom.roomID;
    } else {
        roomSelect.value = "";
    }
}


// Finds rooms whose grid-space bounds overlap the configured endpoint range.
function getRoomsInEndpointRange() {
    const map =
        connectionEditorContext.map;

    const endpoint =
        getSelectedEndpointPoint();

    if (!endpoint) {
        return [];
    }

    const rooms = [];

    for (const room of map.rooms) {
        const currentRoom =
            getSelectedEndpointRoom();

        if (
            currentRoom &&
            room.roomID === currentRoom.roomID
        ) {
            continue;
        }

        const roomLeft =
            room.position.x;

        const roomTop =
            room.position.y;

        const roomRight =
            roomLeft + room.size.width;

        const roomBottom =
            roomTop + room.size.height;

        const rangeLeft =
            endpoint.x - CONNECTION_ROOM_RANGE;

        const rangeTop =
            endpoint.y - CONNECTION_ROOM_RANGE;

        const rangeRight =
            endpoint.x + CONNECTION_ROOM_RANGE;

        const rangeBottom =
            endpoint.y + CONNECTION_ROOM_RANGE;

        if (
            roomRight >= rangeLeft &&
            roomLeft <= rangeRight &&
            roomBottom >= rangeTop &&
            roomTop <= rangeBottom
        ) {
            rooms.push(room);
        }
    }

    rooms.sort(
        (roomA, roomB) =>
            roomA.name.localeCompare(
                roomB.name
            )
    );

    return rooms;
}


// Returns the room currently assigned to the selected endpoint.
function getSelectedEndpointRoom() {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return null;
    }

    const connection =
        selectedConnection.entry.connection;

    const roomID =
        selectedEndpoint === "A"
            ? connection.roomA
            : connection.roomB;

    return getRoom(
        connectionEditorContext.map,
        roomID
    );
}


// Returns the map/grid position of the currently selected physical endpoint.
function getSelectedEndpointPoint() {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return null;
    }

    const connection =
        selectedConnection.entry.connection;

    const roomID =
        selectedEndpoint === "A"
            ? connection.roomA
            : connection.roomB;

    const side =
        selectedEndpoint === "A"
            ? connection.roomAConnectionSide
            : connection.roomBConnectionSide;

    const room =
        getRoom(
            connectionEditorContext.map,
            roomID
        );

    if (!room) {
        return getFreeEndpointPoint(
            connection
        );
    }

    return getRoomEndpointPoint(
        room,
        side
    );
}


// Returns an approximate physical point for a connected room endpoint.
function getRoomEndpointPoint(
    room,
    side
) {
    const left =
        room.position.x;

    const top =
        room.position.y;

    const width =
        room.size.width;

    const height =
        room.size.height;

    switch (side) {
        case "N":
            return {
                x: left + width / 2,
                y: top
            };

        case "E":
            return {
                x: left + width,
                y: top + height / 2
            };

        case "S":
            return {
                x: left + width / 2,
                y: top + height
            };

        case "W":
            return {
                x: left,
                y: top + height / 2
            };

        default:
            return {
                x: left + width / 2,
                y: top + height / 2
            };
    }
}


// Returns the grid-space point used for an unresolved endpoint.
//
// The current renderer represents an unresolved endpoint outward from room A,
// so use that endpoint when selecting an unconnected B endpoint.
function getFreeEndpointPoint(
    connection
) {
    const roomA =
        getRoom(
            connectionEditorContext.map,
            connection.roomA
        );

    if (!roomA) {
        return null;
    }

    const side =
        connection.roomAConnectionSide;

    const endpoint =
        getRoomEndpointPoint(
            roomA,
            side
        );

    switch (side) {
        case "N":
            endpoint.y -= 3;
            break;

        case "E":
            endpoint.x += 3;
            break;

        case "S":
            endpoint.y += 3;
            break;

        case "W":
            endpoint.x -= 3;
            break;
    }

    return endpoint;
}


// Assigns a room to the selected endpoint.
//
// Selecting a room resets its side to NONE. Selecting None clears both the
// room and its side because an unconnected endpoint has no room attachment.
function setConnectionEndpointRoom(roomID) {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return;
    }

    const connection =
        selectedConnection.entry.connection;

    if (!roomID) {
        if (selectedEndpoint === "A") {
            connection.roomA = null;
            connection.roomAConnectionSide = null;
        } else {
            connection.roomB = null;
            connection.roomBConnectionSide = null;
        }

        refreshSelectedConnection();

        return;
    }

    const room =
        getRoom(
            connectionEditorContext.map,
            roomID
        );

    if (!room) {
        return;
    }

    if (selectedEndpoint === "A") {
        connection.roomA =
            room.roomID;

        connection.roomAConnectionSide =
            "NONE";
    } else {
        connection.roomB =
            room.roomID;

        connection.roomBConnectionSide =
            "NONE";
    }

    refreshSelectedConnection();
}


// Creates the side-selection row for the currently selected endpoint.
function createEndpointSideOptions(
    endpointOptions
) {
    endpointOptions
        .querySelectorAll(
            ".connection-editor-side-options"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );

    const sideOptions =
        document.createElement("div");

    sideOptions.classList.add(
        "connection-editor-side-options"
    );

    const sideLabel =
        document.createElement("span");

    sideLabel.textContent =
        "Side:";

    const sideSelect =
        document.createElement("select");

    sideSelect.classList.add(
        "connection-editor-side-select"
    );

    const connection =
        selectedConnection.entry.connection;

    const currentSide =
        selectedEndpoint === "A"
            ? connection.roomAConnectionSide
            : connection.roomBConnectionSide;

    for (const side of CONNECTION_SIDES) {
        const option =
            document.createElement("option");

        option.value =
            side.value;

        option.textContent =
            side.label;

        sideSelect.appendChild(
            option
        );
    }

    sideSelect.value =
        currentSide || "NONE";

    sideSelect.addEventListener(
        "change",
        () => {
            setConnectionEndpointSide(
                sideSelect.value
            );
        }
    );

    sideOptions.appendChild(
        sideLabel
    );

    sideOptions.appendChild(
        sideSelect
    );

    endpointOptions.appendChild(
        sideOptions
    );
}


// Changes the attachment side of the selected endpoint.
function setConnectionEndpointSide(side) {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return;
    }

    const connection =
        selectedConnection.entry.connection;

    if (selectedEndpoint === "A") {
        connection.roomAConnectionSide =
            side;
    } else {
        connection.roomBConnectionSide =
            side;
    }

    refreshSelectedConnection();
}


// Removes every temporary context menu currently displayed for the selected
// connection.
function removeConnectionContextOptions() {
    if (!connectionOptions) {
        return;
    }

    connectionOptions.parentElement
        ?.querySelectorAll(
            ".connection-editor-direction-options, " +
            ".connection-editor-endpoint-options"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );
}


// ============================================================
// CONNECTION EDITOR DRAGGING
// ============================================================

// Adds dragging behavior to the connection editor's header.
function startConnectionEditorDragging(editorHeader) {
    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    // Records the mouse/editor positions when the header is grabbed.
    function startDrag(event) {
        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startEditorX = connectionEditor.offsetLeft;
        startEditorY = connectionEditor.offsetTop;

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

        connectionEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        connectionEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        connectionEditor.style.right = "auto";
        connectionEditor.style.bottom = "auto";
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


// ============================================================
// CONNECTION EDITOR HELPERS
// ============================================================

// Closes the current connection editor and clears its state.
function closeConnectionEditor() {
    if (!connectionEditor) {
        return;
    }

    connectionEditor.remove();

    clearSelectedConnectionEndpoint();

    connectionEditor = null;
    editedRoom = null;
    selectedConnection = null;
    selectedEndpoint = null;
    connectionOptions = null;
    connectionEditorContext = null;
}


// ============================================================
// CONNECTION CREATION
// ============================================================

// Creates a new connection using the new map-level connection model.
//
// The connection is initially attached to room A and has no room B yet.
export function createConnection(
    map,
    room,
    connectionLayer,
    zoom = 1
) {
    const connection = {
        roomA: room.roomID,
        roomB: null,
        roomAConnectionSide: "NONE",
        roomBConnectionSide: null,
        directionTo: "A",
        name: "New Connection"
    };

    map.connections.push(
        connection
    );

    renderConnections(
        map,
        connectionLayer,
        zoom
    );

    console.log(
        `Created connection from ${room.name}`,
        connection
    );
}