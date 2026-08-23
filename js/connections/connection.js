// ============================================================
// IMPORTS
// ============================================================

import {
    renderConnections
} from "../connectionRenderer.js";


// ============================================================
// CONNECTION CREATION
// ============================================================

// Creates a new map-level connection from the selections made by the
// new-connection context.
export function createConnection(
    map,
    roomA,
    roomB,
    directionTo,
    connectionLayer,
    zoom,
    currentFloor
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

    renderConnections({
        map,
        connectionLayer,
        zoom,
        currentFloor
    });

    console.log(
        `Created connection from ` +
        `${roomA?.name ?? "None"} to ${roomB?.name ?? "None"}`,
        connection
    );

    return connection;
}