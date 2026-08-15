import { renderConnections } from "./connectionRenderer.js";

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