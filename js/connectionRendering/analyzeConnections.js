import {
    getRoom
} from "../mapUtils.js";

// ============================================================
// CONNECTION ANALYSIS
// ============================================================

// Builds a lookup structure describing which connections occupy each side
// of every room.
//
// Every valid endpoint is registered independently. A connection with a null
// roomB therefore occupies only roomA's side.
export function analyzeConnections(map) {
    const connectionData = new Map();

    for (const room of map.rooms) {
        connectionData.set(
            room.roomID,
            {
                N: [],
                E: [],
                S: [],
                W: [],
                NE: [],
                NW: [],
                SE: [],
                SW: [],
                NONE: []
            }
        );
    }

    for (const connection of map.connections) {
        const roomA =
            getRoom(
                map,
                connection.roomA
            );

        if (roomA) {
            connectionData
                .get(roomA.roomID)
                [connection.roomAConnectionSide]
                .push({
                    connection,
                    room: roomA,
                    side: connection.roomAConnectionSide
                });
        }

        const roomB =
            getRoom(
                map,
                connection.roomB
            );

        if (!roomB) {
            continue;
        }

        connectionData
            .get(roomB.roomID)
            [connection.roomBConnectionSide]
            .push({
                connection,
                room: roomB,
                side: connection.roomBConnectionSide
            });
    }

    return connectionData;
}