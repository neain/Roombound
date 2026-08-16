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

// Opens the connection editor for the supplied room.
//
// Connections involving the selected room are collected from both directions:
// connections originating from the room and connections originating elsewhere
// that target the room.
export function openConnectionEditor(map, room, mapElement, connectionLayer, zoom = 1 ) {
    connectionEditorContext = {map, connectionLayer, zoom};
    const connections = [];

    // Add connections originating from the selected room.
    for (const connection of room.connections) {
        connections.push({
            connection,
            fromRoom: room,
            toRoom: getRoomByID(map, connection.to)
        });
    }

    // Find connections originating from other rooms that target the selected
    // room.
    for (const otherRoom of map.rooms) {
        if (otherRoom === room) {
            continue;
        }

        for (const connection of otherRoom.connections) {
            if (connection.to !== room.roomID) {
                continue;
            }

            connections.push({
                connection,
                fromRoom: otherRoom,
                toRoom: room
            });
        }
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

        const fromName = entry.fromRoom?.name || "Unknown Room";

        const toName = entry.toRoom?.name || "Unconnected";

        const fromSide = 
            entry.connection.fromSide
                ? ` (${entry.connection.fromSide})`
                : "";

        const toSide =
            entry.connection.toSide
                ? ` (${entry.connection.toSide}) `
                : "";

        let direction = "→";

        if (entry.connection.bidirectional) {
            direction = "↔";
        }

        connectionElement.textContent = `${fromName}${fromSide} ${direction} ${toSide}${toName}`;

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

    // Remove the previous connection options and their containing group.
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

    const fromButton =
        document.createElement("button");

    fromButton.textContent =
        entry.fromRoom?.name || "Unknown Room";

    fromButton.classList.add(
        "connection-editor-endpoint"
    );

    const directionButton =
        document.createElement("button");

    directionButton.textContent =
        entry.connection.bidirectional
            ? "↔"
            : "→";

    directionButton.classList.add(
        "connection-editor-direction"
    );

    const toButton =
        document.createElement("button");

    toButton.textContent =
        entry.toRoom?.name || "Unconnected";

    toButton.classList.add(
        "connection-editor-endpoint"
    );

    fromButton.addEventListener(
        "click",
        () => {
            selectConnectionEndpoint("from");
        }
    );

    directionButton.addEventListener(
        "click",
        () => {
            selectConnectionDirection();
        }
    );

    toButton.addEventListener(
        "click",
        () => {
            selectConnectionEndpoint("to");
        }
    );

    connectionOptions.appendChild(
        fromButton
    );

    connectionOptions.appendChild(
        directionButton
    );

    connectionOptions.appendChild(
        toButton
    );

    connectionGroup.appendChild(
        connectionOptions
    );

    console.log(
        "Selected connection:",
        entry
    );
}

// Opens the direction choices for the selected connection.
//
// The choices represent the direction as the user sees it rather than
// exposing the underlying from/to data model.
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
            setConnectionDirection("left");
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
            setConnectionDirection("right");
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
// Right preserves the existing from/to relationship and makes the connection
// one-way. Both makes it bidirectional. Left reverses the endpoints and their
// sides, then makes the resulting connection one-way.
function setConnectionDirection(
    direction
) {
    if (!selectedConnection) {
        return;
    }

    const entry =
        selectedConnection.entry;

    const connection =
        entry.connection;

    if (direction === "both") {
        connection.bidirectional = true;
    }

    if (direction === "right") {
        connection.bidirectional = false;
    }

    if (direction === "left") {
        if (!entry.toRoom) {
            return;
        }

        const oldFromRoom =
            entry.fromRoom;

        const oldToRoom =
            entry.toRoom;

        const oldFromSide =
            connection.fromSide;

        const oldToSide =
            connection.toSide;

        const oldIndex =
            oldFromRoom.connections.indexOf(
                connection
            );

        if (oldIndex !== -1) {
            oldFromRoom.connections.splice(
                oldIndex,
                1
            );
        }

        oldToRoom.connections.push(
            connection
        );

        connection.fromSide =
            oldToSide;

        connection.toSide =
            oldFromSide;

        connection.to =
            oldFromRoom.roomID;

        connection.bidirectional = false;

        entry.fromRoom =
            oldToRoom;

        entry.toRoom =
            oldFromRoom;
    }

    refreshSelectedConnection();
}

// Refreshes the selected connection's visible text and redraws the map after
// a connection property changes.
function refreshSelectedConnection() {
    const entry =
        selectedConnection.entry;

    const connection =
        entry.connection;

    const fromName =
        entry.fromRoom?.name || "Unknown Room";

    const toName =
        entry.toRoom?.name || "Unconnected";

    const fromSide =
        connection.fromSide
            ? ` (${connection.fromSide})`
            : "";

    const toSide =
        connection.toSide
            ? ` (${connection.toSide})`
            : "";

    const direction =
        connection.bidirectional
            ? "↔"
            : "→";

    selectedConnection.element.textContent =
        `${fromName}${fromSide} ${direction} ${toSide}${toName}`;

    const directionButton =
        connectionOptions.querySelector(
            ".connection-editor-direction"
        );

    directionButton.textContent =
        connection.bidirectional
            ? "↔"
            : "→";

    const endpointButtons =
        connectionOptions.querySelectorAll(
            ".connection-editor-endpoint"
        );

    endpointButtons[0].textContent =
        fromName;

    endpointButtons[1].textContent =
        toName;

    renderConnections(
        connectionEditorContext.map,
        connectionEditorContext.connectionLayer,
        connectionEditorContext.zoom
    );
}

// Selects either the From or To endpoint of the active connection.
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
        endpoint === "from"
            ? buttons[0]
            : buttons[1];

    selectedButton.classList.add("selected");

    console.log(
        "Selected connection endpoint:",
        endpoint
    );
}

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

// Creates a new connection originating from the supplied room.
//
// The connection is added to the room's connection list immediately, then
// the connection layer is redrawn so the new connection appears on the map.
//
// Connection destination/target selection will be added as the connection
// editing workflow is expanded.
export function createConnection(
    map,
    room,
    connectionLayer,
    zoom = 1
) {
    const connection = {
        fromSide: "E",
        to: null,
        toSide: null,
        name: "New Connection",
        bidirectional: true
    };

    room.connections.push(connection);

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