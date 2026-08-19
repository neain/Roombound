// ============================================================
// IMPORTS
// ============================================================

import {
    CONNECTION_SIDES,
    getRoom
} from "../mapUtils.js";

import {
    renderConnections,
    setSelectedConnectionEndpoint,
    clearSelectedConnectionEndpoint
} from "../connectionRenderer.js";

import {
    getRoomsInEndpointRange,
    getSelectedEndpointRoom,
    getSelectedEndpointPoint
} from "./connectionGeometry.js";


// ============================================================
// CONNECTION ENDPOINT SELECTION
// ============================================================

// Selects either endpoint A or endpoint B of the active connection.
//
// Selecting an endpoint displays nearby room choices and highlights the
// physical endpoint on the map.
export function selectConnectionEndpoint(
    state,
    endpoint
) {
    const {
        selectedConnection,
        selectedEndpoint,
        connectionOptions,
        connectionEditorContext
    } = state;

    if (!selectedConnection || !connectionOptions) {
        return;
    }

    if (
        selectedEndpoint === endpoint &&
        connectionOptions.parentElement?.querySelector(
            ".connection-editor-endpoint-options"
        )
    ) {
        state.selectedEndpoint = null;

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

        removeConnectionContextOptions(
            connectionOptions
        );

        return;
    }

    state.selectedEndpoint = endpoint;

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

    removeConnectionContextOptions(
        connectionOptions
    );

    const connection =
        selectedConnection.entry.connection;

    setSelectedConnectionEndpoint(
        connection,
        endpoint
    );

    createEndpointOptions(
        state
    );

    // BEGIN EDIT
    // renderConnections() now expects a mapView object rather than
    // positional arguments.
    renderConnections({
        map: connectionEditorContext.map,
        connectionLayer: connectionEditorContext.connectionLayer,
        zoom: connectionEditorContext.zoom,
        currentFloor: connectionEditorContext.currentFloor
    });
    // END EDIT
}


// Creates the room-selection dropdown and side controls for the
// currently selected endpoint.
export function createEndpointOptions(
    state
) {
    const {
        selectedConnection,
        selectedEndpoint,
        connectionOptions,
        connectionEditorContext
    } = state;

    if (
        !selectedConnection ||
        !connectionOptions ||
        !selectedEndpoint
    ) {
        return;
    }

    // Ensure any existing options panel is cleaned up first
    removeConnectionContextOptions(
        connectionOptions
    );

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
                state,
                roomSelect
            );
        }
    );

    roomSelect.addEventListener(
        "change",
        () => {
            setConnectionEndpointRoom(
                state,
                roomSelect.value
            );
        }
    );

    // Populate the dropdown options immediately upon creation
    populateRoomSelect(
        state,
        roomSelect
    );

    endpointOptions.appendChild(
        roomSelect
    );

    connectionOptions.after(
        endpointOptions
    );

    const currentRoom =
        getSelectedEndpointRoom(
            connectionEditorContext,
            selectedConnection,
            selectedEndpoint
        );

    // A connected endpoint should always expose its side selector,
    // including when its current side is NONE.
    if (currentRoom) {
        createEndpointSideOptions(
            state,
            endpointOptions
        );
    }
}


// Populates the room dropdown with the current room, nearby rooms, and None.
export function populateRoomSelect(
    state,
    roomSelect
) {
    const {
        selectedConnection,
        selectedEndpoint,
        connectionEditorContext
    } = state;

    roomSelect.innerHTML = "";

    const currentRoom =
        getSelectedEndpointRoom(
            connectionEditorContext,
            selectedConnection,
            selectedEndpoint
        );

    const candidateRooms =
        getRoomsInEndpointRange(
            connectionEditorContext,
            selectedConnection,
            selectedEndpoint
        );

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


// Assigns a room to the selected endpoint.
//
// Selecting a room resets its side to NONE. Selecting None clears both the
// room and its side because an unconnected endpoint has no room attachment.
export function setConnectionEndpointRoom(
    state,
    roomID
) {
    const {
        selectedConnection,
        selectedEndpoint,
        connectionEditorContext
    } = state;

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

        if (state.refreshSelectedConnection) {
            state.refreshSelectedConnection();
        }

        createEndpointOptions(state);
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

    if (state.refreshSelectedConnection) {
        state.refreshSelectedConnection();
    }

    // Re-render endpoint options so the side-selection dropdown appears immediately
    createEndpointOptions(state);
}


// Creates the side-selection row for the currently selected endpoint.
export function createEndpointSideOptions(
    state,
    endpointOptions
) {
    const {
        selectedConnection,
        selectedEndpoint
    } = state;

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
                state,
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
export function setConnectionEndpointSide(
    state,
    side
) {
    const {
        selectedConnection,
        selectedEndpoint
    } = state;

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

    if (state.refreshSelectedConnection) {
        state.refreshSelectedConnection();
    }
}


// Removes every temporary context menu currently displayed for the selected
// connection.
export function removeConnectionContextOptions(
    connectionOptions
) {
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