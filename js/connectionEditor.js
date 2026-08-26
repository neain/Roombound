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
//   connectionEditorWindow
//   connectionEditorContext
//   editedRoom
//   editorOpeningConnection
//   connectionEntries
//   selectedConnection
//   selectedEndpoint
//   connectionOptions
//
// INTERNAL RESPONSIBILITIES:
//   - Manage connection editor state.
//   - Create and manage the main connection editor UI.
//   - Build and refresh the displayed connection list.
//   - Select connections and connection directions.
//   - Create new connections from the editor.
//   - Refresh connection display after changes.
//   - Handle editor closing.
//   - Provide the state bridge used by specialized connection modules.
//
// INTERNAL MODULES:
//   ./connections/connection.js
//       Connection-level operations.
//       CURRENT: createConnection()
//       CURRENT: deleteConnection()
//       CURRENT: deleteConnections()
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
// RELATED MODULES:
//   ./connectionRenderer.js
//       Connection rendering and map-side connection geometry.
//       CURRENT: setSelectedConnection()
//       CURRENT: clearSelectedConnection()
//       CURRENT: clearSelectedConnectionEndpoint()
//
//   ./mapUtils.js
//       Shared map/grid utilities.
//       CURRENT: getRoom()
//
//   ./window.js
//       Shared floating editor-window behavior.
//       CURRENT: createWindow()
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

import {
    renderMap
} from "./mapRenderer.js";

import {
    createWindow
} from "./window.js";

// Connection rendering and connection geometry.
// CURRENT: setSelectedConnection(), clearSelectedConnection(),
//          clearSelectedConnectionEndpoint()
// If working on how connections are drawn or positioned, inspect:
//   ./connectionRenderer.js
import {
    setSelectedConnection,
    clearSelectedConnection,
    clearSelectedConnectionEndpoint
} from "./connectionRenderer.js";

import {
    openNewConnectionContext
} from "./connections/newConnectionContext.js";

// Connection-level operations.
import {
    createConnection as createConnectionImpl,
    deleteConnection as deleteConnectionImpl,
    deleteConnections as deleteConnectionsImpl
} from "./connections/connection.js";

// Connection endpoint editing.
import {
    selectConnectionEndpoint,
    createEndpointSideOptions,
    removeConnectionContextOptions
} from "./connections/connectionEndpoints.js";

// Connection geometry and endpoint positioning.
import {
    getSelectedEndpointRoom
} from "./connections/connectionGeometry.js";

// Connection editor UI.
import {
    updateConnectionElement
} from "./connections/connectionEditorUI.js";

import {
    renderRooms,
    setGhostRooms,
    clearGhostRooms
} from "./roomRenderer.js";

import {
    closeNewConnectionContext as closeNewConnectionContextImpl
} from "./connections/newConnectionContext.js";


// ============================================================
// CONNECTION EDITOR STATE
// ============================================================

// The connection editor currently being displayed, if any.
let connectionEditor = null;

// Generic floating-window shell used by the connection editor.
let connectionEditorWindow = null;

// Map/rendering information needed when a connection is modified.
let connectionEditorContext = null;

// The room supplied when the editor was originally opened.
let editedRoom = null;

// The connection that caused the editor to open, if one exists.
// Used only to provide deterministic context for creating new connections.
let editorOpeningConnection = null;

// The connection entries currently displayed by the editor.
let connectionEntries = [];

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
    let initiallySelectedConnection = null;

    connectionEditorContext = {
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    };

    editedRoom = room;
    editorOpeningConnection = selectedConnectionToOpen;
    connectionEntries = connections;

    // Keep every room involved in the displayed connections visible while
    // the connection editor is open, regardless of floor.
    const ghostRoomSet = new Set();

    ghostRoomSet.add(room);

    for (const entry of connectionEntries) {
        if (entry.roomA) {
            ghostRoomSet.add(entry.roomA);
        }

        if (entry.roomB) {
            ghostRoomSet.add(entry.roomB);
        }
    }

    setGhostRooms(
        [...ghostRoomSet]
    );

    renderMap();

    if (connectionEditor) {
        connectionEditor.remove();
    }

    connectionEditorWindow =
        createWindow(
            "Connection Editor",
            closeConnectionEditor
        );

    connectionEditor =
        connectionEditorWindow.element;

    connectionEditor.classList.add(
        "connection-editor"
    );

    connectionEditorWindow.header.classList.add(
        "connection-editor-header"
    );

    // --------------------------------------------------------
    // Editor content
    // --------------------------------------------------------

    const editorContent =
        document.createElement("div");

    editorContent.classList.add(
        "connection-editor-content"
    );

    const roomLabel =
        document.createElement("div");

    roomLabel.textContent =
        `Room: ${room.name}`;

    editorContent.appendChild(
        roomLabel
    );

    connectionEditorWindow.content.appendChild(
        editorContent
    );

    refreshConnectionList();

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

    if (selectedConnectionToOpen) {
        initiallySelectedConnection =
            selectedConnectionToOpen;
    }

    if (initiallySelectedConnection) {
        selectConnectionByConnection(
            initiallySelectedConnection
        );
    }

    console.log(
        "Opened connection editor for",
        room.name,
        connectionEntries
    );
}


// ============================================================
// CONNECTION LIST
// ============================================================

// Rebuilds the visible connection list from the current connection entries.
//
// The map remains authoritative for connection data. The editor keeps the
// displayed entry set so that adding a connection can expand the current
// editor without changing what connections the editor was opened for.
function refreshConnectionList(
    connectionToSelect = null
) {
    if (!connectionEditorWindow) {
        return;
    }

    const editorContent =
        connectionEditorWindow.content.querySelector(
            ".connection-editor-content"
        );

    if (!editorContent) {
        return;
    }

    editorContent
        .querySelectorAll(
            ".connection-editor-connection"
        )
        .forEach(
            (element) => {
                element.remove();
            }
        );

    if (connectionEntries.length === 0) {
        const emptyMessage =
            document.createElement("div");

        emptyMessage.textContent =
            "This room has no connections.";

        editorContent.appendChild(
            emptyMessage
        );
    }

    // Build every connection with its editing controls already visible.
    // Selecting a connection highlights the existing row instead of
    // creating a second layer of controls.
    for (const entry of connectionEntries) {
        const connectionElement =
            document.createElement("div");

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

        editorContent.appendChild(
            connectionElement
        );

        if (
            connectionToSelect &&
            entry.connection === connectionToSelect
        ) {
            selectConnection(
                entry,
                connectionElement
            );
        }
    }

    // The editor's add-connection control occupies the entire width of a
    // normal connection row.
    const createConnectionElement =
        document.createElement("div");

    createConnectionElement.classList.add(
        "connection-editor-connection",
        "connection-editor-create"
    );

    const createConnectionButton =
        document.createElement("button");

    createConnectionButton.textContent =
        "Create New Connection";

    createConnectionButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            addConnectionFromEditor();
        }
    );

    createConnectionElement.appendChild(
        createConnectionButton
    );

    editorContent.appendChild(
        createConnectionElement
    );
}


// ============================================================
// NEW CONNECTION
// ============================================================

// Determines which room should become Room A when creating a connection
// from the current editor contents.
//
// The most frequently occurring room wins. If the counts tie, Room A from
// the connection that opened the editor wins when possible. Otherwise the
// first tied Room A provides a deterministic fallback. If no connections
// exist, the originally supplied room is used.
function getNewConnectionStartingRoom() {
    if (connectionEntries.length === 0) {
        return editedRoom;
    }

    const roomCounts =
        new Map();

    for (const entry of connectionEntries) {
        if (entry.roomA) {
            roomCounts.set(
                entry.roomA,
                (roomCounts.get(entry.roomA) || 0) + 1
            );
        }

        if (entry.roomB) {
            roomCounts.set(
                entry.roomB,
                (roomCounts.get(entry.roomB) || 0) + 1
            );
        }
    }

    let highestCount = 0;

    for (const count of roomCounts.values()) {
        if (count > highestCount) {
            highestCount = count;
        }
    }

    const tiedRooms =
        new Set();

    for (const [room, count] of roomCounts) {
        if (count === highestCount) {
            tiedRooms.add(room);
        }
    }

    if (
        editorOpeningConnection &&
        tiedRooms.has(
            getRoom(
                connectionEditorContext.map,
                editorOpeningConnection.roomA
            )
        )
    ) {
        return getRoom(
            connectionEditorContext.map,
            editorOpeningConnection.roomA
        );
    }

    for (const entry of connectionEntries) {
        if (
            entry.roomA &&
            tiedRooms.has(entry.roomA)
        ) {
            return entry.roomA;
        }
    }

    for (const room of tiedRooms) {
        return room;
    }

    return editedRoom;
}


// Creates a new connection directly from the editor using the same defaults
// as the normal low-level connection creator.
function addConnectionFromEditor() {
    if (!connectionEditorContext) {
        return;
    }

    const startingRoom =
        getNewConnectionStartingRoom();

    const connection =
        createConnectionImpl(
            connectionEditorContext.map,
            startingRoom,
            null,
            "both"
        );

    const entry = {
        connection,
        roomA: startingRoom,
        roomB: null
    };

    connectionEntries.push(
        entry
    );

    refreshConnectionList(
        connection
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
    renderMap();

    console.log(
        "Selected connection:",
        entry
    );
}


// Selects a connection by its underlying connection object after the visible
// connection list has been rebuilt.
function selectConnectionByConnection(connection) {
    const entry =
        connectionEntries.find(
            (candidate) =>
                candidate.connection === connection
        );

    if (!entry) {
        return;
    }

    const elements =
        connectionEditorWindow.content.querySelectorAll(
            ".connection-editor-connection"
        );

    for (const element of elements) {
        const options =
            element.querySelector(
                ".connection-editor-options"
            );

        if (!options) {
            continue;
        }

        const matchingEntry =
            connectionEntries.find(
                (candidate) =>
                    candidate.connection === connection
            );

        if (matchingEntry === entry) {
            selectConnection(
                entry,
                element
            );

            return;
        }
    }
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

    const directionOptions =
        document.createElement("div");

    directionOptions.classList.add(
        "connection-editor-direction-options"
    );

    const leftButton =
        document.createElement("button");

    leftButton.textContent =
        "←";

    const bothButton =
        document.createElement("button");

    bothButton.textContent =
        "↔";

    const rightButton =
        document.createElement("button");

    rightButton.textContent =
        "→";

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
function setConnectionDirection(direction) {
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
        const currentRoom =
            getSelectedEndpointRoom(
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

    renderMap();
}


// ============================================================
// CONNECTION EDITOR HELPERS
// ============================================================

// Closes the current connection editor and clears its state.
export function closeConnectionEditor() {
    if (!connectionEditor) {
        return;
    }

    clearGhostRooms();

    connectionEditorWindow.remove();

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
    renderMap();

    connectionEditor = null;
    connectionEditorWindow = null;
    editedRoom = null;
    editorOpeningConnection = null;
    connectionEntries = [];
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

export function closeNewConnectionContext(...args) {
    return closeNewConnectionContextImpl(...args);
}

export function deleteConnection(...args) {
    return deleteConnectionImpl(...args);
}

export function deleteConnections(...args) {
    return deleteConnectionsImpl(...args);
}