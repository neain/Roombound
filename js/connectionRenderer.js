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
    CONNECTION_ROOM_RANGE,
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
// CONNECTION RENDERING STATE
// ============================================================

// The connection currently selected by the connection editor.
let selectedConnection = null;

// The connection endpoint currently selected by the connection editor.
let selectedEndpoint = null;

// ============================================================
// CONNECTION EDITOR CONNECTION SELECTION
// ============================================================

// Sets the connection currently highlighted by the editor.
export function setSelectedConnection(connection) {
    selectedConnection = connection || null;
}


// Clears the currently highlighted connection.
export function clearSelectedConnection() {
    selectedConnection = null;
}

// ============================================================
// CONNECTION EDITOR ENDPOINT SELECTION
// ============================================================

// Sets the connection endpoint currently highlighted by the editor.
//
// endpoint must be either "A", "B", or null to clear the selection.
export function setSelectedConnectionEndpoint(
    connection,
    endpoint
) {
    if (!connection || !endpoint) {
        selectedEndpoint = null;
        return;
    }

    selectedEndpoint = {
        connection,
        endpoint
    };
}


// Clears the currently highlighted connection endpoint.
export function clearSelectedConnectionEndpoint() {
    selectedEndpoint = null;
}


// ============================================================
// CONNECTION RENDERING
// ============================================================

// Removes the existing connection graphics and redraws every connection
// currently stored in the map.
//
// Connections reference two room endpoints rather than belonging to either
// room. directionTo determines which endpoint receives an arrow.
export function renderConnections(mapView) {
    const {
        map,
        connectionLayer,
        zoom,
        currentFloor
    } = mapView;

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
        const roomA = getRoom(map, connection.roomA);
        if (!roomA) continue;

        const roomB = connection.roomB
            ? getRoom(map, connection.roomB)
            : null;

        // --------------------------------------------------------
        // Visibility rule (Option B)
        // Show the connection if at least one endpoint is on the
        // currently selected floor.
        // --------------------------------------------------------
        const roomAOnFloor = roomA.floor === currentFloor;
        const roomBOnFloor = roomB ? roomB.floor === currentFloor : false;

        if (!roomAOnFloor && !roomBOnFloor) {
            continue; // neither end is on this floor → skip
        }

        // --------------------------------------------------------
        // Geometry (still calculated for both rooms even if one
        // is on a different floor)
        // --------------------------------------------------------
        const roomAConnections =
            connectionData.get(roomA.roomID)?.[connection.roomAConnectionSide];

        if (!roomAConnections) continue;

        const roomAIndex = roomAConnections.findIndex(
            (entry) => entry.connection === connection
        );

        const roomAPoint =
            connectionPoints
                .get(roomA.roomID)
                ?.[connection.roomAConnectionSide]
                ?.[roomAIndex];

        if (!roomAPoint) continue;

        let roomBPoint = null;

        if (roomB && connection.roomBConnectionSide) {
            const roomBConnections =
                connectionData.get(roomB.roomID)?.[connection.roomBConnectionSide];

            if (roomBConnections) {
                const roomBIndex = roomBConnections.findIndex(
                    (entry) => entry.connection === connection
                );

                roomBPoint =
                    connectionPoints
                        .get(roomB.roomID)
                        ?.[connection.roomBConnectionSide]
                        ?.[roomBIndex];
            }
        }

        // Fallback for unresolved / NONE side (same as before)
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

        // --------------------------------------------------------
        // Selected connection highlight
        // --------------------------------------------------------
        // Draw a wider line underneath the actual connection so the
        // selection remains clearly defined rather than relying entirely
        // on a blurred drop shadow.
        if (selectedConnection === connection) {
            const highlight = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

            highlight.setAttribute("x1", roomAPoint.x);
            highlight.setAttribute("y1", roomAPoint.y);
            highlight.setAttribute("x2", roomBPoint.x);
            highlight.setAttribute("y2", roomBPoint.y);
            highlight.classList.add(
                "connection-selection-highlight"
            );

            connectionLayer.appendChild(highlight);
        }


        // --------------------------------------------------------
        // Draw the line (full geometry – Option B)
        // --------------------------------------------------------
        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        line.setAttribute("x1", roomAPoint.x);
        line.setAttribute("y1", roomAPoint.y);
        line.setAttribute("x2", roomBPoint.x);
        line.setAttribute("y2", roomBPoint.y);
        line.classList.add("connection");

        // Direction arrows (same as before)
        if (
            connection.directionTo === "A" ||
            connection.directionTo === "both"
        ) {
            line.setAttribute("marker-start", "url(#arrowhead-start)");
        }

        if (
            connection.directionTo === "B" ||
            connection.directionTo === "both"
        ) {
            line.setAttribute("marker-end", "url(#arrowhead-end)");
        }

        connectionLayer.appendChild(line);

        // --------------------------------------------------------
        // Inter-floor indicator (↑ / ↓)
        // Place the indicator near the endpoint that is NOT on
        // the current floor.
        // --------------------------------------------------------
        if (roomB && roomAOnFloor !== roomBOnFloor) {
            const offFloorPoint = roomAOnFloor ? roomBPoint : roomAPoint;
            const otherFloor = roomAOnFloor ? roomB.floor : roomA.floor;
            const isUp = otherFloor > currentFloor;

            const indicator = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            indicator.setAttribute("x", offFloorPoint.x);
            indicator.setAttribute("y", offFloorPoint.y);
            indicator.setAttribute("text-anchor", "middle");
            indicator.setAttribute("dominant-baseline", "middle");
            indicator.setAttribute("font-size", `${14 * zoom}`);
            indicator.setAttribute("font-weight", "bold");
            indicator.setAttribute("fill", "#000");
            indicator.classList.add("floor-indicator");

            // Slight offset so it doesn’t sit exactly on the endpoint
            const offset = 12 * zoom;
            indicator.setAttribute(
                "dy",
                isUp ? `-${offset}` : `${offset}`
            );

            indicator.textContent = isUp ? "↑" : "↓";

            connectionLayer.appendChild(indicator);
        }

        // --------------------------------------------------------
        // Selected endpoint marker (unchanged)
        // --------------------------------------------------------
        if (
            selectedEndpoint &&
            selectedEndpoint.connection === connection
        ) {
            const point =
                selectedEndpoint.endpoint === "A"
                    ? roomAPoint
                    : roomBPoint;

            const range = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
            );

            const rangeSize = gridToPixels(
                CONNECTION_ROOM_RANGE * 2,
                zoom
            );

            range.setAttribute("x", point.x - rangeSize / 2);
            range.setAttribute("y", point.y - rangeSize / 2);
            range.setAttribute("width", rangeSize);
            range.setAttribute("height", rangeSize);
            range.classList.add("connection-endpoint-range");

            connectionLayer.appendChild(range);
        }
    }
}

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


// Returns the shortest distance between a point and a line segment.
function getPointToSegmentDistance(
    pointX,
    pointY,
    startX,
    startY,
    endX,
    endY
) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (deltaX === 0 && deltaY === 0) {
        return Math.hypot(
            pointX - startX,
            pointY - startY
        );
    }

    const projection =
        (
            (pointX - startX) * deltaX +
            (pointY - startY) * deltaY
        ) /
        (deltaX * deltaX + deltaY * deltaY);

    const position =
        Math.max(
            0,
            Math.min(1, projection)
        );

    const closestX =
        startX + position * deltaX;

    const closestY =
        startY + position * deltaY;

    return Math.hypot(
        pointX - closestX,
        pointY - closestY
    );
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
                W: [],
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
                ),

                NONE: sides.NONE.map(
                    (_, index) =>
                        getConnectionPoint(room, "NONE",index, sides.NONE.length, 0, zoom)
                )
            }
        );
    }

    return points;
}

// Returns the unresolved endpoint position extending outward from a room.
function getFreeConnectionPoint(
    room,
    side,
    zoom
) {
    const point =
        getConnectionPoint(
            room,
            side,
            0,
            1,
            0,
            zoom
        );

    const distance =
        gridToPixels(
            3,
            zoom
        );

    switch (side) {
        case "N":
            point.y -= distance;
            break;

        case "E":
            point.x += distance;
            break;

        case "S":
            point.y += distance;
            break;

        case "W":
            point.x -= distance;
            break;
    }

    return point;
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

        case "NONE":
            return {
                x: left + width / 2,
                y: top + height / 2
            };

        default:
            return {
                x: left + width / 2,
                y: top + height / 2
            };
    }
}