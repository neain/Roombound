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
//   openConnectionEditorForConnections()
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
//   - Handle editor closing.
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
//   ./connectionEditorUI.js
//       Connection editor row/control construction.
//       CURRENT: updateConnectionElement()
//       CURRENT: getDirectionSymbol()
//
//   ./connectionEditorDragging.js
//       Connection editor dragging behavior.
//       CURRENT: startConnectionEditorDragging()
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
    setSelectedConnection,
    clearSelectedConnection,
    setSelectedConnectionEndpoint,
    clearSelectedConnectionEndpoint
} from "./connectionRenderer.js";

import {
    openNewConnectionContext
} from "./connections/newConnectionContext.js";

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

// Connection editor UI.
import {
    updateConnectionElement,
    getDirectionSymbol
} from "./connections/connectionEditorUI.js";

// Connection editor dragging.
import {
    startConnectionEditorDragging
} from "./connections/connectionEditorDragging.js";


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

// Document listener used to close the editor when clicking outside it.
let closeEditorClickHandler = null;


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
export function openConnectionEditor(
    map,
    room,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
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

    openConnectionEditorWithConnections(
        map,
        room,
        connections,
        null,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    );
}


// Opens the connection editor for an explicitly supplied set of
// connections. The first connection in the list is selected automatically.
export function openConnectionEditorForConnections(
    map,
    connections,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    if (!connections || connections.length === 0) {
        return;
    }

    const firstConnection = connections[0];

    const roomA =
        getRoom(
            map,
            firstConnection.roomA
        );

    const roomB =
        getRoom(
            map,
            firstConnection.roomB
        );

    const room =
        roomA || roomB;

    if (!room) {
        return;
    }

    const connectionEntries =
        connections.map(
            (connection) => ({
                connection,
                roomA: getRoom(
                    map,
                    connection.roomA
                ),
                roomB: getRoom(
                    map,
                    connection.roomB
                )
            })
        );

    openConnectionEditorWithConnections(
        map,
        room,
        connectionEntries,
        firstConnection,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    );
}


// Builds and displays the connection editor from an explicit connection list.
function openConnectionEditorWithConnections(
    map,
    room,
    connections,
    selectedConnectionToOpen,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    let initiallySelectedEntry = null;
    let initiallySelectedElement = null;

    connectionEditorContext = {
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    };

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
        emptyMessage.textContent = "This room has no connections.";

        editorContent.appendChild(emptyMessage);
    }

    // Build every connection with its editing controls already visible.
    // Selecting a connection now highlights the existing row instead of
    // creating a second layer of controls.
    for (const entry of connections) {
        const connectionElement = document.createElement("div");

        connectionElement.classList.add(
            "connection-editor-connection"
        );

        updateConnectionElement(
            entry,
            connectionElement,
            {
                selectConnection,
                selectConnectionEndpoint: (endpoint) => {
                    selectConnectionEndpoint(
                        getEditorState(),
                        endpoint
                    );
                },
                selectConnectionDirection
            }
        );

        connectionElement.addEventListener(
            "click",
            (event) => {
                if (
                    event.target.closest(
                        ".connection-editor-options, " +
                        ".connection-editor-endpoint-options"
                    )
                ) {
                    return;
                }

                selectConnection(
                    entry,
                    connectionElement
                );
            }
        );

        editorContent.appendChild(connectionElement);

        if (
            selectedConnectionToOpen &&
            entry.connection === selectedConnectionToOpen
        ) {
            initiallySelectedEntry = entry;
            initiallySelectedElement = connectionElement;
        }
    }

    connectionEditor.appendChild(editorContent);

    document.body.appendChild(connectionEditor);

    // Install the map-click listener after the opening click has finished.
    // Otherwise the click that opened the editor would immediately close it.
    //
    // Only a click on the empty map background closes the editor.
    // Clicking rooms, connections, or the editor itself leaves it open.
    setTimeout(
        () => {
            if (!connectionEditor) {
                return;
            }

            closeEditorClickHandler =
                (event) => {
                    if (!connectionEditor) {
                        return;
                    }

                    if (
                        connectionEditor.contains(event.target)
                    ) {
                        return;
                    }

                    if (
                        event.target !== mapElement
                    ) {
                        return;
                    }

                    closeConnectionEditor();
                };

            mapElement.addEventListener(
                "click",
                closeEditorClickHandler
            );
        },
        0
    );

    if (
        initiallySelectedEntry &&
        initiallySelectedElement
    ) {
        selectConnection(
            initiallySelectedEntry,
            initiallySelectedElement
        );
    }

    startConnectionEditorDragging(
        editorHeader,
        connectionEditor
    );

    console.log(
        "Opened connection editor for",
        room.name,
        connections
    );
}


// ============================================================
// CONNECTION SELECTION
// ============================================================

// Selects a connection in the connection editor.
//
// Each connection row already contains its endpoint and direction controls.
// Selection now only manages highlighting, map selection, and contextual
// editing options.
function selectConnection(entry, connectionElement) {
    if (selectedConnection) {
        selectedConnection.element.classList.remove("selected");
    }

    selectedConnection = {
        entry,
        element: connectionElement
    };

    setSelectedConnection(
        entry.connection
    );

    selectedEndpoint = null;

    clearSelectedConnectionEndpoint();

    connectionElement.classList.add("selected");

    removeConnectionContextOptions(connectionOptions);

    connectionOptions =
        connectionElement.querySelector(
            ".connection-editor-options"
        );

    // Redraw so the newly selected connection receives its visual highlight.
    renderConnections({
        map: connectionEditorContext.map,
        connectionLayer: connectionEditorContext.connectionLayer,
        zoom: connectionEditorContext.zoom,
        currentFloor: connectionEditorContext.currentFloor
    });

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

    connectionOptions =
        updateConnectionElement(
            entry,
            selectedConnection.element,
            {
                selectConnection,
                selectConnectionEndpoint: (endpoint) => {
                    selectConnectionEndpoint(
                        getEditorState(),
                        endpoint
                    );
                },
                selectConnectionDirection
            }
        );

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

    // renderConnections() expects a mapView object.
    renderConnections({
        map: connectionEditorContext.map,
        connectionLayer: connectionEditorContext.connectionLayer,
        zoom: connectionEditorContext.zoom,
        currentFloor: connectionEditorContext.currentFloor
    });
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

    if (closeEditorClickHandler) {
        connectionEditorContext.mapElement.removeEventListener(
            "click",
            closeEditorClickHandler
        );
    }

    clearSelectedConnectionEndpoint();
    clearSelectedConnection();

    // Redraw after clearing the endpoint selection so the visual marker
    // disappears from the map immediately.
    // renderConnections() expects a mapView object.
    renderConnections({
        map: connectionEditorContext.map,
        connectionLayer: connectionEditorContext.connectionLayer,
        zoom: connectionEditorContext.zoom,
        currentFloor: connectionEditorContext.currentFloor
    });

    connectionEditor = null;
    editedRoom = null;
    selectedConnection = null;
    selectedEndpoint = null;
    connectionOptions = null;
    connectionEditorContext = null;
    closeEditorClickHandler = null;
}


// ============================================================
// PUBLIC CONNECTION OPERATIONS
// ============================================================

// Opens the new connection context using the supplied room as the initial
// first endpoint.
export function createConnection(
    mapView,
    room
) {
    openNewConnectionContext(
        mapView,
        room
    );
}