// ============================================================
// IMPORTS
// ============================================================

import {
    renderMap
} from "../mapRenderer.js";


// ============================================================
// CONNECTION CREATION
// ============================================================

// Creates a new map-level connection from the selections made by the
// new-connection context.
export function createConnection(
    map,
    roomA,
    roomB,
    directionTo
) {
    const connection = {
        roomA: roomA?.roomID ?? null,
        roomB: roomB?.roomID ?? null,
        roomAConnectionSide: "NONE",
        roomBConnectionSide: "NONE",
        directionTo,
        name: "New Connection"
    };

    map.connections.push(
        connection
    );

    renderMap();

    console.log(
        `Created connection from ` +
        `${roomA?.name ?? "None"} to ${roomB?.name ?? "None"}`,
        connection
    );

    return connection;
}


// ============================================================
// CONNECTION DELETION
// ============================================================

// Deletes a single connection from the map.
export function deleteConnection(
    map,
    connection,
    render = true
) {
    if (!connection) {
        return;
    }

    const connectionIndex =
        map.connections.indexOf(connection);

    if (connectionIndex === -1) {
        return;
    }

    map.connections.splice(
        connectionIndex,
        1
    );

    if (render) {
        renderMap();
    }

    console.log(
        "Deleted connection:",
        connection
    );
}


// Deletes multiple connections from the map in one operation.
export function deleteConnections(
    map,
    connections
) {
    if (
        !connections ||
        connections.length === 0
    ) {
        return;
    }

    for (const connection of connections) {
        deleteConnection(
            map,
            connection,
            false
        );
    }

    renderMap();

    console.log(
        "Deleted connections:",
        connections
    );
}