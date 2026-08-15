import defaultMap from "./defaultMap.js";

const map = defaultMap;

const mapElement = document.getElementById("map");

const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

connectionLayer.classList.add("connections");
mapElement.appendChild(connectionLayer);

const GRID_SIZE = 15;
mapElement.style.setProperty("--grid-size", `${GRID_SIZE}px`);


function gridToPixels(value) {
    return value * GRID_SIZE;
}


function pixelsToGrid(value) {
    return Math.round(value / GRID_SIZE);
}


function getRoom(roomID) {
    return map.rooms.find(
        (room) => room.roomID === roomID
    );
}


function analyzeConnections(map) {
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

            const toRoom = getRoom(connection.to);

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


function getConnectionPoint(
    room,
    side,
    index = 0,
    count = 1,
    distance = 0
) {
    const left = gridToPixels(room.position.x);
    const top = gridToPixels(room.position.y);
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


function getConnectionPoints(connectionData) {
    const points = new Map();

    for (const [roomID, sides] of connectionData) {

        const room = getRoom(roomID);

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


function renderConnections(map) {
    connectionLayer.innerHTML = "";

    const connectionData = analyzeConnections(map);
    const connectionPoints = getConnectionPoints(connectionData);

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


            const toRoom = getRoom(connection.to);

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

            connectionLayer.appendChild(line);
        }
    }
}


function renderRooms(map) {

    for (const room of map.rooms) {

        const roomElement = document.createElement("div");

        roomElement.classList.add("room");
        roomElement.dataset.roomId = room.roomID;

        roomElement.textContent = room.name;

        roomElement.style.left =
            `${gridToPixels(room.position.x)}px`;

        roomElement.style.top =
            `${gridToPixels(room.position.y)}px`;

        roomElement.style.width =
            `${gridToPixels(room.size.width)}px`;

        roomElement.style.height =
            `${gridToPixels(room.size.height)}px`;


        roomElement.addEventListener(
            "mousedown",
            (event) => {
                startDragging(
                    event,
                    room,
                    roomElement
                );
            }
        );

        mapElement.appendChild(roomElement);
    }
}


function startDragging(event, room, roomElement) {

    event.preventDefault();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const startRoomX = room.position.x;
    const startRoomY = room.position.y;


    function drag(event) {

        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;


        const deltaGridX =
            pixelsToGrid(mouseDeltaX);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY);


        room.position.x =
            startRoomX + deltaGridX;

        room.position.y =
            startRoomY + deltaGridY;


        roomElement.style.left =
            `${gridToPixels(room.position.x)}px`;

        roomElement.style.top =
            `${gridToPixels(room.position.y)}px`;


        renderConnections(map);
    }


    function stopDragging() {

        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDragging
        );


        console.log(
            `Moved ${room.name} to`,
            room.position
        );
    }


    document.addEventListener(
        "mousemove",
        drag
    );

    document.addEventListener(
        "mouseup",
        stopDragging
    );
}


console.log(
    "Roombound map loaded:",
    map
);

console.log(
    "Map element:",
    mapElement
);


renderRooms(map);
renderConnections(map);