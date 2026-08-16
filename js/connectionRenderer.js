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
// Connections reference two room endpoints rather than belonging to either
// room. directionTo determines which endpoint receives an arrow.
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

    const connectionData =
        analyzeConnections(map);

    const connectionPoints =
        getConnectionPoints(
            map,
            connectionData,
            zoom
        );


    // --------------------------------------------------------
    // Draw connections
    // --------------------------------------------------------

    for (const connection of map.connections) {
        const roomA =
            getRoom(
                map,
                connection.roomA
            );

        if (!roomA) {
            continue;
        }

        const roomAConnections =
            connectionData
                .get(roomA.roomID)
                [connection.roomAConnectionSide];

        const roomAIndex =
            roomAConnections.findIndex(
                (entry) => entry.connection === connection
            );

        const roomAPoint =
            connectionPoints
                .get(roomA.roomID)
                [connection.roomAConnectionSide]
                [roomAIndex];

        let roomB = null;
        let roomBPoint = null;

        if (connection.roomB) {
            roomB =
                getRoom(
                    map,
                    connection.roomB
                );
        }

        if (roomB && connection.roomBConnectionSide) {
            const roomBConnections =
                connectionData
                    .get(roomB.roomID)
                    [connection.roomBConnectionSide];

            const roomBIndex =
                roomBConnections.findIndex(
                    (entry) => entry.connection === connection
                );

            roomBPoint =
                connectionPoints
                    .get(roomB.roomID)
                    [connection.roomBConnectionSide]
                    [roomBIndex];
        }

        // A connection without room B extends outward from room A.
        if (!roomBPoint) {
            roomBPoint =
                getConnectionPoint(
                    roomA,
                    connection.roomAConnectionSide,
                    roomAIndex,
                    roomAConnections.length,
                    3,
                    zoom
                );
        }

        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

        line.setAttribute(
            "x1",
            roomAPoint.x
        );

        line.setAttribute(
            "y1",
            roomAPoint.y
        );

        line.setAttribute(
            "x2",
            roomBPoint.x
        );

        line.setAttribute(
            "y2",
            roomBPoint.y
        );

        line.classList.add("connection");


        // directionTo describes which endpoint receives the arrow.
        if (
            connection.directionTo === "A" ||
            connection.directionTo === "both"
        ) {
            line.setAttribute(
                "marker-start",
                "url(#arrowhead-start)"
            );
        }

        if (
            connection.directionTo === "B" ||
            connection.directionTo === "both"
        ) {
            line.setAttribute(
                "marker-end",
                "url(#arrowhead-end)"
            );
        }

        connectionLayer.appendChild(line);
    }
}


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
                W: []
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


// ============================================================
// CONNECTION POINT GENERATION
// ============================================================

// Generates the actual SVG coordinates for every connection position on
// every side of every room.
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