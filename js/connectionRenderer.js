/*
 * Connection Renderer
 *
 * Renders map connections as SVG lines.
 *
 * renderConnections(map)
 *   - map: map object containing rooms and connections
 *
 * Connections support:
 *   - fromSide
 *   - to
 *   - toSide
 *   - bidirectional
 */

// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, gridToPixels, gridToWorldPixels, pixelsToGrid, getRoom } from "./mapUtils.js";

const arrowSize = 4;

export function renderConnections(map, connectionLayer) {
    connectionLayer.innerHTML = "";
    const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
    );

    const markerEnd = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );

    markerEnd.setAttribute("id", "arrowhead-end");
    markerEnd.setAttribute("markerWidth", arrowSize);
    markerEnd.setAttribute("markerHeight", arrowSize);
    markerEnd.setAttribute("refX", arrowSize);
    markerEnd.setAttribute("refY", arrowSize / 2);
    markerEnd.setAttribute("orient", "auto");
    markerEnd.setAttribute("markerUnits", "strokeWidth");

    const arrowEnd = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    arrowEnd.setAttribute(
        "d",
        `M 0 0 L ${arrowSize} ${arrowSize / 2} L 0 ${arrowSize} Z`
    );

    markerEnd.appendChild(arrowEnd);
    defs.appendChild(markerEnd);


    const markerStart = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );

    markerStart.setAttribute("id", "arrowhead-start");
    markerStart.setAttribute("markerWidth", arrowSize);
    markerStart.setAttribute("markerHeight", arrowSize);
    markerStart.setAttribute("refX", arrowSize);
    markerStart.setAttribute("refY", arrowSize / 2);
    markerStart.setAttribute("orient", "auto-start-reverse");
    markerStart.setAttribute("markerUnits", "strokeWidth");

    const arrowStart = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    arrowStart.setAttribute(
        "d",
        `M 0 0 L ${arrowSize} ${arrowSize / 2} L 0 ${arrowSize} Z`
    );

    markerStart.appendChild(arrowStart);
    defs.appendChild(markerStart);

    connectionLayer.appendChild(defs);

    const connectionData = analyzeConnections(map);
    const connectionPoints = getConnectionPoints(map, connectionData);

    for (const room of map.rooms) {

        for (const connection of room.connections) {

            const fromConnections =
                connectionData
                    .get(room.roomID)
                    [connection.fromSide];

            const fromIndex =
                fromConnections.findIndex(
                    (entry) => entry.connection === connection
                );

            const fromPoint =
                connectionPoints
                    .get(room.roomID)
                    [connection.fromSide]
                    [fromIndex];


            const toRoom = getRoom(map, connection.to);

            let toPoint;

            if (toRoom) {

                const toConnections =
                    connectionData
                        .get(toRoom.roomID)
                        [connection.toSide];

                const toIndex =
                    toConnections.findIndex(
                        (entry) => entry.connection === connection
                    );

                toPoint =
                    connectionPoints
                        .get(toRoom.roomID)
                        [connection.toSide]
                        [toIndex];

            } else {

                toPoint = getConnectionPoint(
                    room,
                    connection.fromSide,
                    fromIndex,
                    fromConnections.length,
                    3
                );
            }

            const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            line.setAttribute("x1", fromPoint.x);
            line.setAttribute("y1", fromPoint.y);
            line.setAttribute("x2", toPoint.x);
            line.setAttribute("y2", toPoint.y);

            line.classList.add("connection");

            if (connection.bidirectional) {
                line.setAttribute("marker-start", "url(#arrowhead-start)");
                line.setAttribute("marker-end", "url(#arrowhead-end)");            
            } else {
                line.setAttribute("marker-end", "url(#arrowhead-end)");
            }

            connectionLayer.appendChild(line);
        }
    }
}

export function analyzeConnections(map) {
    const connectionData = new Map();

    for (const room of map.rooms) {
        connectionData.set(room.roomID, {
            N: [],
            E: [],
            S: [],
            W: []
        });
    }

    for (const room of map.rooms) {
        for (const connection of room.connections) {

            connectionData
                .get(room.roomID)
                [connection.fromSide]
                .push({
                    connection,
                    room,
                    side: connection.fromSide
                });

            const toRoom = getRoom(map, connection.to);

            if (!toRoom) {
                continue;
            }

            connectionData
                .get(toRoom.roomID)
                [connection.toSide]
                .push({
                    connection,
                    room: toRoom,
                    side: connection.toSide
                });
        }
    }

    return connectionData;
}

export function getConnectionPoint(
        room,
        side,
        index = 0,
        count = 1,
        distance = 0
    ) {
    const left = gridToWorldPixels(room.position.x);
    const top = gridToWorldPixels(room.position.y);
    const width = gridToPixels(room.size.width);
    const height = gridToPixels(room.size.height);
    const offset = gridToPixels(distance);

    const position = (index + 1) / (count + 1);

    switch (side) {

        case "N":
            return {
                x: left + width * position,
                y: top - offset
            };

        case "E":
            return {
                x: left + width + offset,
                y: top + height * position
            };

        case "S":
            return {
                x: left + width * position,
                y: top + height + offset
            };

        case "W":
            return {
                x: left - offset,
                y: top + height * position
            };

        default:
            return {
                x: left + width / 2,
                y: top + height / 2
            };
    }
}

export function getConnectionPoints(map, connectionData) {
    const points = new Map();

    for (const [roomID, sides] of connectionData) {

        const room = getRoom(map, roomID);

        points.set(roomID, {
            N: sides.N.map((_, index) =>
                getConnectionPoint(
                    room,
                    "N",
                    index,
                    sides.N.length
                )
            ),

            E: sides.E.map((_, index) =>
                getConnectionPoint(
                    room,
                    "E",
                    index,
                    sides.E.length
                )
            ),

            S: sides.S.map((_, index) =>
                getConnectionPoint(
                    room,
                    "S",
                    index,
                    sides.S.length
                )
            ),

            W: sides.W.map((_, index) =>
                getConnectionPoint(
                    room,
                    "W",
                    index,
                    sides.W.length
                )
            )
        });
    }

    return points;
}