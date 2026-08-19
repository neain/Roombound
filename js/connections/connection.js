// ============================================================
// IMPORTS
// ============================================================

import {
    renderConnections
} from "../connectionRenderer.js";


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
    zoom,
    currentFloor
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

    renderConnections({
        map,
        connectionLayer,
        zoom,
        currentFloor
    });

    console.log(
        `Created connection from ${room.name}`,
        connection
    );
}