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
        bidirectional: false
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