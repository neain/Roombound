import {
    arrowSize,
    analyzeConnections,
    getConnectionPoints,
    getConnectionPoint,
    getFreeConnectionPoint,
    getSelectedConnection,
    getSelectedConnectionEndpoint
} from "../connectionRenderer.js";

import {
    CONNECTION_ROOM_RANGE,
    getRoom,
    gridToPixels
} from "../mapUtils.js";

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
    
    const selectedConnection =
        getSelectedConnection();

    const selectedEndpoint =
        getSelectedConnectionEndpoint();

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

        if (!roomA) {
            continue;
        }

        const roomB = connection.roomB
            ? getRoom(map, connection.roomB)
            : null;

        // --------------------------------------------------------
        // Visibility rule
        // Show the connection if at least one endpoint is on the
        // currently selected floor.
        // --------------------------------------------------------

        const roomAOnFloor =
            roomA.floor === currentFloor;

        const roomBOnFloor =
            roomB
                ? roomB.floor === currentFloor
                : false;

        if (!roomAOnFloor && !roomBOnFloor) {
            continue;
        }


        // --------------------------------------------------------
        // Connection geometry
        // --------------------------------------------------------

        const roomAConnections =
            connectionData
                .get(roomA.roomID)
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
                connectionData
                    .get(roomB.roomID)
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

        // Fallback for unresolved / NONE side.
        if (!roomBPoint) {
            roomBPoint =
                getConnectionPoint(
                    roomA,
                    connection.roomAConnectionSide,
                    roomAIndex,
                    roomAConnections.length,
                    0,
                    zoom
                );

            if (!roomB) {
                roomBPoint =
                    getFreeConnectionPoint(
                        roomA,
                        connection.roomAConnectionSide,
                        zoom
                    );
            }
        }


        // --------------------------------------------------------
        // Selected connection highlight
        // --------------------------------------------------------

        if (selectedConnection === connection) {
            const highlight =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );

            highlight.setAttribute(
                "x1",
                roomAPoint.x
            );

            highlight.setAttribute(
                "y1",
                roomAPoint.y
            );

            highlight.setAttribute(
                "x2",
                roomBPoint.x
            );

            highlight.setAttribute(
                "y2",
                roomBPoint.y
            );

            highlight.classList.add(
                "connection-selection-highlight"
            );

            connectionLayer.appendChild(
                highlight
            );
        }


        // --------------------------------------------------------
        // Draw connection line
        // --------------------------------------------------------

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

        line.classList.add(
            "connection"
        );

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

        connectionLayer.appendChild(
            line
        );


        // --------------------------------------------------------
        // Inter-floor indicator
        //
        // The entire indicator is anchored perpendicular to the
        // connection at its midpoint.
        // --------------------------------------------------------

        if (
            roomB &&
            roomAOnFloor !== roomBOnFloor
        ) {
            const otherFloor =
                roomAOnFloor
                    ? roomB.floor
                    : roomA.floor;

            const isUp =
                otherFloor > currentFloor;

            const midpointX =
                (roomAPoint.x + roomBPoint.x) / 2;

            const midpointY =
                (roomAPoint.y + roomBPoint.y) / 2;

            const deltaX =
                roomBPoint.x - roomAPoint.x;

            const deltaY =
                roomBPoint.y - roomAPoint.y;

            const length =
                Math.hypot(
                    deltaX,
                    deltaY
                );

            if (length === 0) {
                continue;
            }

            // Rotational-left perpendicular vector.
            let perpendicularX;
            let perpendicularY;

            if (Math.abs(deltaX) < 0.0001) {
                // Perfectly vertical connection:
                // up = left, down = right.
                perpendicularX = isUp ? -1 : 1;
                perpendicularY = 0;
            } else {
                // Start with the rotational-left perpendicular.
                perpendicularX = -deltaY / length;
                perpendicularY = deltaX / length;

                // Up indicators belong above the line.
                if (isUp && perpendicularY > 0) {
                    perpendicularX *= -1;
                    perpendicularY *= -1;
                }

                // Down indicators belong below the line.
                if (!isUp && perpendicularY < 0) {
                    perpendicularX *= -1;
                    perpendicularY *= -1;
                }
            }
                
            const indicatorOffset =
                20 * zoom;

            const indicatorX =
                midpointX +
                perpendicularX * indicatorOffset;

            const indicatorY =
                midpointY +
                perpendicularY * indicatorOffset;


            // ----------------------------------------------------
            // Stair icon
            //
            // This is intentionally identical for both up and down
            // connections. The icon itself does not rotate or change.
            //
            //   X
            //   XX
            // ----------------------------------------------------

            const stairGroup =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "g"
                );

            stairGroup.classList.add(
                "floor-stair-indicator"
            );

            const stairWidth =
                7 * zoom;

            const stairHeight =
                7 * zoom;

            const stairGap =
                2 * zoom;

            const stairTop =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );

            stairTop.setAttribute(
                "x",
                indicatorX - stairWidth / 2
            );

            stairTop.setAttribute(
                "y",
                indicatorY - stairHeight - stairGap / 2
            );

            stairTop.setAttribute(
                "width",
                stairWidth
            );

            stairTop.setAttribute(
                "height",
                stairHeight
            );

            stairTop.classList.add(
                "floor-stair"
            );


            const stairBottom =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );

            stairBottom.setAttribute(
                "x",
                indicatorX - stairWidth / 2
            );

            stairBottom.setAttribute(
                "y",
                indicatorY + stairGap / 2
            );

            stairBottom.setAttribute(
                "width",
                stairWidth * 2
            );

            stairBottom.setAttribute(
                "height",
                stairHeight
            );

            stairBottom.classList.add(
                "floor-stair"
            );

            stairGroup.appendChild(
                stairTop
            );

            stairGroup.appendChild(
                stairBottom
            );

            connectionLayer.appendChild(
                stairGroup
            );


            // ----------------------------------------------------
            // Direction arrow
            //
            // The arrow is positioned beside the stair icon rather
            // than above/below it.
            // ----------------------------------------------------

            const indicator =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "text"
                );

            const arrowOffset =
                14 * zoom;

            indicator.setAttribute(
                "x",
                indicatorX +
                    (isUp
                        ? arrowOffset
                        : -arrowOffset)
            );

            indicator.setAttribute(
                "y",
                indicatorY
            );

            indicator.setAttribute(
                "text-anchor",
                "middle"
            );

            indicator.setAttribute(
                "dominant-baseline",
                "middle"
            );

            indicator.setAttribute(
                "font-size",
                `${14 * zoom}`
            );

            indicator.setAttribute(
                "font-weight",
                "bold"
            );

            indicator.setAttribute(
                "fill",
                "#000"
            );

            indicator.classList.add(
                "floor-indicator"
            );

            indicator.textContent =
                isUp
                    ? "↑"
                    : "↓";

            connectionLayer.appendChild(
                indicator
            );
        }


        // --------------------------------------------------------
        // Selected endpoint marker
        // --------------------------------------------------------

        if (
            selectedEndpoint &&
            selectedEndpoint.connection === connection
        ) {
            const point =
                selectedEndpoint.endpoint === "A"
                    ? roomAPoint
                    : roomBPoint;

            const range =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );

            const rangeSize =
                gridToPixels(
                    CONNECTION_ROOM_RANGE * 2,
                    zoom
                );

            range.setAttribute(
                "x",
                point.x - rangeSize / 2
            );

            range.setAttribute(
                "y",
                point.y - rangeSize / 2
            );

            range.setAttribute(
                "width",
                rangeSize
            );

            range.setAttribute(
                "height",
                rangeSize
            );

            range.classList.add(
                "connection-endpoint-range"
            );

            connectionLayer.appendChild(
                range
            );
        }
    }
}