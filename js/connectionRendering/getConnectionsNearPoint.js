import {
    analyzeConnections,
    getConnectionPoints,
    getConnectionPoint,
    getFreeConnectionPoint,
    getPointToSegmentDistance
} from "../connectionRenderer.js";

import {
    getRoom
} from "../mapUtils.js";

// ============================================================
// CONNECTION HIT TESTING
// ============================================================

// Returns every visible connection whose rendered line is within the given
// pixel range of the supplied SVG/map coordinates.
//
// The returned connections are ordered from closest to farthest so callers
// can use the first connection as the most likely intended selection.
export function getConnectionsNearPoint(
    mapView,
    x,
    y,
    range
) {
    const {
        map,
        zoom,
        currentFloor
    } = mapView;

    const connectionData =
        analyzeConnections(map);

    const connectionPoints =
        getConnectionPoints(
            map,
            connectionData,
            zoom
        );

    const nearbyConnections = [];

    for (const connection of map.connections) {
        const roomA = getRoom(map, connection.roomA);

        if (!roomA) {
            continue;
        }

        const roomB = connection.roomB
            ? getRoom(map, connection.roomB)
            : null;

        const roomAOnFloor =
            roomA.floor === currentFloor;

        const roomBOnFloor =
            roomB?.floor === currentFloor;

        if (!roomAOnFloor && !roomBOnFloor) {
            continue;
        }

        const roomAConnections =
            connectionData.get(roomA.roomID)
                ?.[connection.roomAConnectionSide];

        if (!roomAConnections) {
            continue;
        }

        const roomAIndex =
            roomAConnections.findIndex(
                (entry) => entry.connection === connection
            );

        const roomAPoint =
            connectionPoints
                .get(roomA.roomID)
                ?.[connection.roomAConnectionSide]
                ?.[roomAIndex];

        if (!roomAPoint) {
            continue;
        }

        let roomBPoint = null;

        if (roomB && connection.roomBConnectionSide) {
            const roomBConnections =
                connectionData.get(roomB.roomID)
                    ?.[connection.roomBConnectionSide];

            if (roomBConnections) {
                const roomBIndex =
                    roomBConnections.findIndex(
                        (entry) => entry.connection === connection
                    );

                roomBPoint =
                    connectionPoints
                        .get(roomB.roomID)
                        ?.[connection.roomBConnectionSide]
                        ?.[roomBIndex];
            }
        }

        if (!roomBPoint) {
            roomBPoint = getConnectionPoint(
                roomA,
                connection.roomAConnectionSide,
                roomAIndex,
                roomAConnections.length,
                0,
                zoom
            );

            if (!roomB) {
                roomBPoint = getFreeConnectionPoint(
                    roomA,
                    connection.roomAConnectionSide,
                    zoom
                );
            }
        }

        const distance =
            getPointToSegmentDistance(
                x,
                y,
                roomAPoint.x,
                roomAPoint.y,
                roomBPoint.x,
                roomBPoint.y
            );

        if (distance <= range) {
            nearbyConnections.push({
                connection,
                distance
            });
        }
    }

    nearbyConnections.sort(
        (a, b) => a.distance - b.distance
    );

    return nearbyConnections.map(
        (entry) => entry.connection
    );
}