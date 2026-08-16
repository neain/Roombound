// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: GRID_SIZE, gridToPixels(), gridToWorldPixels(), pixelsToGrid(),
//          getRoom()
// If working on map dimensions, grid spacing, coordinate conversion, or
// looking up rooms by ID, inspect:
//   ./mapUtils.js
import {
    GRID_SIZE,
    gridToPixels,
    gridToWorldPixels,
    pixelsToGrid,
    getRoom
} from "./mapUtils.js";


// ============================================================
// CONNECTION RENDERING CONFIGURATION
// ============================================================

// Size of the SVG arrowhead markers used on connection lines.
const arrowSize = 4;


// ============================================================
// CONNECTION RENDERING
// ============================================================

// Removes the existing connection graphics and redraws every connection
// currently stored in the map.
//
// Connections are represented as SVG lines. Their endpoints are calculated
// from the rooms and sides they connect to.
//
// Unconnected destinations are drawn as a short line extending outward from
// the originating room. This allows partially-created connections to remain
// visible while they are being edited.
export function renderConnections(
    map,
    connectionLayer,
    zoom = 1
) {
    connectionLayer.innerHTML = "";

    // --------------------------------------------------------
    // SVG arrow definitions
    // --------------------------------------------------------

    const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
    );

    const markerEnd = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
    );

    markerEnd.setAttribute(
        "id",
        "arrowhead-end"
    );

    markerEnd.setAttribute(
        "markerWidth",
        arrowSize
    );

    markerEnd.setAttribute(
        "markerHeight",
        arrowSize
    );

    markerEnd.setAttribute(
        "refX",
        arrowSize
    );

    markerEnd.setAttribute(
        "refY",
        arrowSize / 2
    );

    markerEnd.setAttribute(
        "orient",
        "auto"
    );

    markerEnd.setAttribute(
        "markerUnits",
        "strokeWidth"
    );

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

    markerStart.setAttribute(
        "id",
        "arrowhead-start"
    );

    markerStart.setAttribute(
        "markerWidth",
        arrowSize
    );

    markerStart.setAttribute(
        "markerHeight",
        arrowSize
    );

    markerStart.setAttribute(
        "refX",
        arrowSize
    );

    markerStart.setAttribute(
        "refY",
        arrowSize / 2
    );

    markerStart.setAttribute(
        "orient",
        "auto-start-reverse"
    );

    markerStart.setAttribute(
        "markerUnits",
        "strokeWidth"
    );

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


    // --------------------------------------------------------
    // Connection geometry
    // --------------------------------------------------------

    // First determine how many connections occupy each side of each room.
    // This allows multiple connections to be spaced evenly along a side.
    const connectionData =
        analyzeConnections(map);

    // Convert the analyzed connection data into actual SVG coordinates.
    const connectionPoints =
        getConnectionPoints(
            map,
            connectionData,
            zoom
        );


    // --------------------------------------------------------
    // Draw connections
    // --------------------------------------------------------

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


            // Find the destination room, if this connection has one.
            const toRoom =
                getRoom(
                    map,
                    connection.to
                );

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
                // No destination has been selected yet, so extend the
                // connection outward from its originating room.
                toPoint =
                    getConnectionPoint(
                        room,
                        connection.fromSide,
                        fromIndex,
                        fromConnections.length,
                        3,
                        zoom
                    );
            }


            // Create the SVG line representing the connection.
            const line = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            line.setAttribute(
                "x1",
                fromPoint.x
            );

            line.setAttribute(
                "y1",
                fromPoint.y
            );

            line.setAttribute(
                "x2",
                toPoint.x
            );

            line.setAttribute(
                "y2",
                toPoint.y
            );

            line.classList.add("connection");


            // Bidirectional connections receive arrows at both ends.
            if (connection.bidirectional) {
                line.setAttribute(
                    "marker-start",
                    "url(#arrowhead-start)"
                );

                line.setAttribute(
                    "marker-end",
                    "url(#arrowhead-end)"
                );
            } else {
                line.setAttribute(
                    "marker-end",
                    "url(#arrowhead-end)"
                );
            }

            connectionLayer.appendChild(line);
        }
    }
}


// ============================================================
// CONNECTION ANALYSIS
// ============================================================

// Builds a lookup structure describing which connections occupy each side
// of every room.
//
// This information is used to distribute multiple connections evenly along
// the same room side.
//
// Each connection is registered twice when it has a valid destination:
// once for its originating room/side and once for its destination room/side.
export function analyzeConnections(map) {
    const connectionData = new Map();

    // Create an empty side list for every room.
    for (const room of map.rooms) {
        connectionData.set(
            room.roomID,
            {
                N: [],
                E: [],
                S: [],
                W: []
            }
        );
    }

    // Register each connection with its originating and destination sides.
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

            const toRoom =
                getRoom(
                    map,
                    connection.to
                );

            // An incomplete connection has no destination to register.
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


// ============================================================
// CONNECTION POINT GENERATION
// ============================================================

// Generates the actual SVG coordinates for every connection position on
// every side of every room.
//
// connectionData determines how many connections occupy each side, which
// allows getConnectionPoint() to space them evenly.
export function getConnectionPoints(
    map,
    connectionData,
    zoom = 1
) {
    const points = new Map();

    for (const [roomID, sides] of connectionData) {
        const room =
            getRoom(
                map,
                roomID
            );

        points.set(
            roomID,
            {
                N: sides.N.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "N",
                            index,
                            sides.N.length,
                            0,
                            zoom
                        )
                ),

                E: sides.E.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "E",
                            index,
                            sides.E.length,
                            0,
                            zoom
                        )
                ),

                S: sides.S.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "S",
                            index,
                            sides.S.length,
                            0,
                            zoom
                        )
                ),

                W: sides.W.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "W",
                            index,
                            sides.W.length,
                            0,
                            zoom
                        )
                )
            }
        );
    }

    return points;
}


// Calculates the exact SVG point for one connection on one side of a room.
//
// index and count determine where multiple connections are distributed along
// the same side. distance moves the point outward from the room.
//
// The default case returns the room center, providing a safe fallback if an
// invalid side value is supplied.
export function getConnectionPoint(
    room,
    side,
    index = 0,
    count = 1,
    distance = 0,
    zoom = 1
) {
    const left =
        gridToWorldPixels(
            room.position.x,
            zoom
        );

    const top =
        gridToWorldPixels(
            room.position.y,
            zoom
        );

    const width =
        gridToPixels(
            room.size.width,
            zoom
        );

    const height =
        gridToPixels(
            room.size.height,
            zoom
        );

    const offset =
        gridToPixels(
            distance,
            zoom
        );

    // Keep connection points evenly distributed along the side while leaving
    // space between the endpoints and the room corners.
    const position =
        (index + 1) / (count + 1);

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