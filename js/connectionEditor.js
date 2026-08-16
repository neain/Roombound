// ============================================================
// IMPORTS
// ============================================================

// Connection rendering and connection geometry.
// CURRENT: renderConnections()
// If working on how connections are created, modified, or initialized,
// and especially if changes need to be reflected visually on the map,
// inspect:
//   ./connectionRenderer.js
import { renderConnections } from "./connectionRenderer.js";


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
            getRoomByID(
                map,
                connection.roomA
            );

        const roomB =
            getRoomByID(
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

    connectionElement.classList.add("selected");

    if (connectionOptions) {
        connectionOptions.remove();
        connectionOptions = null;
    }

    const previousGroup =
        connectionElement.parentElement;

    if (
        previousGroup &&
        previousGroup.classList.contains(
            "connection-editor-connection-group"
        )
    ) {
        previousGroup.remove();
    }

    // Create a containing group for the selected connection and all of its
    // future editing options.
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

    // Create the endpoint and direction selection row.
    connectionOptions =
        document.createElement("div");

    connectionOptions.classList.add(
        "connection-editor-options"
    );

    const roomA =
        entry.roomA?.name || "Unknown Room";

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
        () => {
            selectConnectionEndpoint("A");
        }
    );

    directionButton.addEventListener(
        "click",
        () => {
            selectConnectionDirection();
        }
    );

    roomBButton.addEventListener(
        "click",
        () => {
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
        () => {
            setConnectionDirection("A");
        }
    );

    bothButton.addEventListener(
        "click",
        () => {
            setConnectionDirection("both");
        }
    );

    rightButton.addEventListener(
        "click",
        () => {
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
        entry.roomA?.name || "Unknown Room";

    const roomBName =
        entry.roomB?.name || "Unconnected";

    const roomASide =
        connection.roomAConnectionSide
            ? ` (${connection.roomAConnectionSide})`
            : "";

    const roomBSide =
        connection.roomBConnectionSide
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
        entry.roomA?.name || "Unknown Room";

    endpointButtons[1].textContent =
        entry.roomB?.name || "Unconnected";

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
// Selecting an endpoint replaces any deeper options that were previously
// displayed for the connection.
function selectConnectionEndpoint(endpoint) {
    selectedEndpoint = endpoint;

    if (connectionOptions) {
        connectionOptions
            .querySelectorAll(
                ".connection-editor-endpoint"
            )
            .forEach(
                (button) => {
                    button.classList.remove("selected");
                }
            );
    }

    const buttons =
        connectionOptions.querySelectorAll(
            ".connection-editor-endpoint"
        );

    const selectedButton =
        endpoint === "A"
            ? buttons[0]
            : buttons[1];

    selectedButton.classList.add("selected");

    console.log(
        "Selected connection endpoint:",
        endpoint
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

    connectionEditor = null;
    editedRoom = null;
    selectedConnection = null;
    selectedEndpoint = null;
    connectionOptions = null;
    connectionEditorContext = null;
}


// Returns the room with the supplied ID, or null when no matching room exists.
function getRoomByID(map, roomID) {
    if (!roomID) {
        return null;
    }

    return map.rooms.find(
        (room) => room.roomID === roomID
    ) || null;
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
        roomAConnectionSide: "E",
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