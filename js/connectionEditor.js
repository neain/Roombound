// ============================================================
// ROOMBOUND CONNECTION EDITOR
// ============================================================
//
// PUBLIC ENTRY POINT
// This file is the public interface for connection editing.
// Other modules should import connection editor functionality from
// this file rather than importing the internal connection modules directly.
//
// CURRENT PUBLIC FUNCTIONS:
//   openConnectionEditor()
//   createConnection()
//
// INTERNAL STATE:
//   connectionEditor
//   connectionEditorContext
//   editedRoom
//   selectedConnection
//   selectedEndpoint
//   connectionOptions
//
// INTERNAL RESPONSIBILITIES:
//   - Manage connection editor state.
//   - Create and manage the main connection editor UI.
//   - Select connections and connection directions.
//   - Refresh connection display after changes.
//   - Handle editor dragging and closing.
//   - Provide the state bridge used by specialized connection modules.
//
// INTERNAL MODULES:
//   ./connections/connection.js
//       Connection-level operations.
//       CURRENT: createConnection()
//
//   ./connections/connectionEndpoints.js
//       Endpoint room selection and attachment-side editing.
//       CURRENT: selectConnectionEndpoint()
//       CURRENT: createEndpointOptions()
//       CURRENT: setConnectionEndpointRoom()
//       CURRENT: createEndpointSideOptions()
//       CURRENT: setConnectionEndpointSide()
//       CURRENT: removeConnectionContextOptions()
//
//   ./connections/connectionGeometry.js
//       Endpoint position and room-range calculations.
//       CURRENT: getSelectedEndpointRoom()
//       CURRENT: getSelectedEndpointPoint()
//
// RELATED MODULES:
//   ./connectionRenderer.js
//       Connection rendering and map-side connection geometry.
//       CURRENT: renderConnections()
//       CURRENT: setSelectedConnectionEndpoint()
//       CURRENT: clearSelectedConnectionEndpoint()
//
//   ./mapUtils.js
//       Shared map/grid utilities.
//       CURRENT: getRoom()
//
// ARCHITECTURE NOTE:
//   connectionEditor.js intentionally remains the stable public doorway
//   for connection editing. Internal modules receive editor state through
//   getEditorState() rather than importing connectionEditor.js directly.
//   This avoids circular dependencies while allowing the internal modules
//   to modify editor state and request editor refreshes.
//
// ============================================================




// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: getRoom()
// If working on shared map lookups or grid utilities, inspect:
//   ./mapUtils.js
import {
    getRoom
} from "./mapUtils.js";

// Connection rendering and connection geometry.
// CURRENT: renderConnections(), setSelectedConnectionEndpoint(),
//          clearSelectedConnectionEndpoint()
// If working on how connections are drawn or positioned, inspect:
//   ./connectionRenderer.js
import {
    renderConnections,
    setSelectedConnectionEndpoint,
    clearSelectedConnectionEndpoint
} from "./connectionRenderer.js";

// Connection-level operations.
import {
    createConnection as createConnectionInternal
} from "./connections/connection.js";

// Connection endpoint editing.
import {
    selectConnectionEndpoint,
    createEndpointOptions,
    setConnectionEndpointRoom,
    createEndpointSideOptions,
    setConnectionEndpointSide,
    removeConnectionContextOptions
} from "./connections/connectionEndpoints.js";

// Connection geometry and endpoint positioning.
import {
    getSelectedEndpointRoom,
    getSelectedEndpointPoint
} from "./connections/connectionGeometry.js";


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
// CONNECTION EDITOR STATE ACCESS
// ============================================================

// Provides the current editor state to the specialized connection modules.
function getEditorState() {
    return {
        get connectionEditor() {
            return connectionEditor;
        },

        get connectionEditorContext() {
            return connectionEditorContext;
        },

        get editedRoom() {
            return editedRoom;
        },

        get selectedConnection() {
            return selectedConnection;
        },

        get selectedEndpoint() {
            return selectedEndpoint;
        },

        set selectedEndpoint(value) {
            selectedEndpoint = value;
        },

        get connectionOptions() {
            return connectionOptions;
        },

        get refreshSelectedConnection() {
            return refreshSelectedConnection;
        },

        getRoom
    };
}


// ============================================================
// CONNECTION EDITOR
// ============================================================

// Opens the connection editor for the supplied room.
//
// Every connection involving the selected room is included, regardless of
// whether the room is endpoint A or endpoint B.
export function openConnectionEditor(map, room, mapElement, connectionLayer, zoom, currentFloor) {
    connectionEditorContext = {
        map,
        connectionLayer,
        zoom,
        currentFloor
    };

    const connections = [];

    for (const connection of map.connections) {
        const roomA = getRoom(map, connection.roomA);
        const roomB = getRoom(map, connection.roomB);

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

    closeButton.addEventListener("click", closeConnectionEditor);

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
        emptyMessage.textContent = "This room has no connections.";

        editorContent.appendChild(emptyMessage);
    }

    for (const entry of connections) {
        const connectionElement = document.createElement("div");

        connectionElement.classList.add(
            "connection-editor-connection"
        );

        updateConnectionElement(entry, connectionElement);

        connectionElement.addEventListener(
            "click",
            () => {
                selectConnection(entry, connectionElement);
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
function selectConnection(entry, connectionElement) {
    if (selectedConnection) {
        selectedConnection.element.classList.remove("selected");
    }

    selectedConnection = {
        entry,
        element: connectionElement
    };

    selectedEndpoint = null;

    clearSelectedConnectionEndpoint();

    connectionElement.classList.add("selected");

    removeConnectionContextOptions(connectionOptions);

    // --------------------------------------------------------
    // Restore the connection element to the editor before
    // creating its new selection group.
    // --------------------------------------------------------

    const previousGroup = connectionElement.parentElement;

    if (
        previousGroup &&
        previousGroup.classList.contains(
            "connection-editor-connection-group"
        )
    ) {
        const groupParent = previousGroup.parentElement;

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

    const connectionGroup = document.createElement("div");

    connectionGroup.classList.add(
        "connection-editor-connection-group"
    );

    connectionElement.parentElement?.insertBefore(
        connectionGroup,
        connectionElement
    );

    connectionGroup.appendChild(connectionElement);

    // --------------------------------------------------------
    // Create the endpoint and direction selection row.
    // --------------------------------------------------------

    connectionOptions = document.createElement("div");

    connectionOptions.classList.add(
        "connection-editor-options"
    );

    const roomA = entry.roomA?.name || "Unconnected";
    const roomB = entry.roomB?.name || "Unconnected";

    const roomAButton = document.createElement("button");
    roomAButton.textContent = roomA;
    roomAButton.classList.add(
        "connection-editor-endpoint"
    );

    const directionButton = document.createElement("button");
    directionButton.textContent =
        getDirectionSymbol(entry.connection.directionTo);
    directionButton.classList.add(
        "connection-editor-direction"
    );

    const roomBButton = document.createElement("button");
    roomBButton.textContent = roomB;
    roomBButton.classList.add(
        "connection-editor-endpoint"
    );

    roomAButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            selectConnectionEndpoint(
                getEditorState(),
                "A"
            );
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

            selectConnectionEndpoint(
                getEditorState(),
                "B"
            );
        }
    );

    connectionOptions.appendChild(roomAButton);
    connectionOptions.appendChild(directionButton);
    connectionOptions.appendChild(roomBButton);

    connectionGroup.appendChild(connectionOptions);

    console.log("Selected connection:", entry);
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
        .querySelectorAll(".connection-editor-endpoint")
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

    removeConnectionContextOptions(connectionOptions);

    const directionOptions = document.createElement("div");

    directionOptions.classList.add(
        "connection-editor-direction-options"
    );

    const leftButton = document.createElement("button");
    leftButton.textContent = "←";

    const bothButton = document.createElement("button");
    bothButton.textContent = "↔";

    const rightButton = document.createElement("button");
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

    directionOptions.appendChild(leftButton);
    directionOptions.appendChild(bothButton);
    directionOptions.appendChild(rightButton);

    connectionOptions.after(directionOptions);
}


// Changes the direction of the selected connection.
//
// Direction is represented entirely by directionTo. Changing direction does
// not change either endpoint or move the connection between room objects.
function setConnectionDirection(direction) {
    if (!selectedConnection) {
        return;
    }

    const connection = selectedConnection.entry.connection;

    connection.directionTo = direction;

    refreshSelectedConnection();
}


// ============================================================
// CONNECTION DISPLAY
// ============================================================

// Updates the visible connection description from the current connection
// data.
function updateConnectionElement(entry, connectionElement) {
    const connection = entry.connection;
    const roomAName = entry.roomA?.name || "Unconnected";
    const roomBName = entry.roomB?.name || "Unconnected";

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

    const direction = getDirectionSymbol(connection.directionTo);

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

    const entry = selectedConnection.entry;
    const connection = entry.connection;

    entry.roomA = getRoom(
        connectionEditorContext.map,
        connection.roomA
    );

    entry.roomB = getRoom(
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
        getDirectionSymbol(connection.directionTo);

    const endpointButtons =
        connectionOptions.querySelectorAll(
            ".connection-editor-endpoint"
        );

    endpointButtons[0].textContent =
        entry.roomA?.name || "Unconnected";

    endpointButtons[1].textContent =
        entry.roomB?.name || "Unconnected";

    // Keep the side selector synchronized with the currently selected
    // endpoint after the connection data changes.
    const endpointOptions =
        connectionOptions.querySelector(
            ".connection-editor-endpoint-options"
        );

    if (endpointOptions) {
        const currentRoom = getSelectedEndpointRoom(
            connectionEditorContext,
            selectedConnection,
            selectedEndpoint
        );

        if (currentRoom) {
            createEndpointSideOptions(
                getEditorState(),
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

    renderConnections(
        connectionEditorContext.map,
        connectionEditorContext.connectionLayer,
        connectionEditorContext.zoom,
        connectionEditorContext.currentFloor
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

        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
    }

    // Moves the editor to follow the mouse.
    function drag(event) {
        const mouseDeltaX = event.clientX - startMouseX;
        const mouseDeltaY = event.clientY - startMouseY;

        connectionEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        connectionEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        connectionEditor.style.right = "auto";
        connectionEditor.style.bottom = "auto";
    }

    // Removes the temporary drag listeners when the editor is released.
    function stopDrag() {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);
    }

    editorHeader.addEventListener("mousedown", startDrag);
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
// PUBLIC CONNECTION OPERATIONS
// ============================================================

// Keeps connection creation available through the existing public module.
export function createConnection(
    map,
    room,
    connectionLayer,
    zoom = 1
) {
    return createConnectionInternal(
        map,
        room,
        connectionLayer,
        zoom
    );
}