const map = {
    rooms: [
        {
            roomID: "room_001",
            name: "Entrance Hall",
            floor: 1,
            connections: [
                {
                    from: "room_001",
                    fromSide: "E",
                    to: "room_002",
                    toSide: "W",
                    name: "Hallway"
                },
                {
                    from: "room_001",
                    fromSide: "N",
                    to: null,
                    toSide: null,
                    name: "Locked Door"
                }
            ],
            position: {x: 5, y: 5},
            size: {width: 5, height: 5},
        },
        {
            roomID: "room_002",
            name: "Kitchen",
            floor: 1,
            connections: [
                {
                    from: "room_002",
                    fromSide: "W",
                    to: "room_001",
                    toSide: "E",
                    name: "Hallway"
                }
            ],
            position: {x: 20, y: 20},
            size: {width: 5, height: 5},
        }
    ]
};

const mapElement = document.getElementById("map");
const GRID_SIZE = 15;
mapElement.style.setProperty("--grid-size", `${GRID_SIZE}px`);

function gridToPixels(value) {
    return value * GRID_SIZE;
}

function pixelsToGrid(value) {
    return Math.round(value / GRID_SIZE);
}

function renderRooms(map) {
    for (const room of map.rooms) {
        const roomElement = document.createElement("div");

        roomElement.classList.add("room");
        roomElement.dataset.roomId = room.roomID;

        roomElement.textContent = room.name;

        roomElement.style.left = `${gridToPixels(room.position.x)}px`;
        roomElement.style.top = `${gridToPixels(room.position.y)}px`;

        roomElement.style.width = `${gridToPixels(room.size.width)}px`;
        roomElement.style.height = `${gridToPixels(room.size.height)}px`;

        roomElement.addEventListener("mousedown", (event) => {
            startDragging(event, room, roomElement);
        });

        mapElement.appendChild(roomElement);
    }
}

function startDragging(event, room, roomElement) {
    event.preventDefault();

    const mapRect = mapElement.getBoundingClientRect();

    const startMouseX = event.clientX;
    const startMouseY = event.clientY;

    const startRoomX = room.position.x;
    const startRoomY = room.position.y;

    function drag(event) {
        const mouseDeltaX = event.clientX - startMouseX;
        const mouseDeltaY = event.clientY - startMouseY;

        const deltaGridX = pixelsToGrid(mouseDeltaX);
        const deltaGridY = pixelsToGrid(mouseDeltaY);

        room.position.x = startRoomX + deltaGridX;
        room.position.y = startRoomY + deltaGridY;

        roomElement.style.left = `${gridToPixels(room.position.x)}px`;
        roomElement.style.top = `${gridToPixels(room.position.y)}px`;
    }

    function stopDragging() {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDragging);

        console.log(
            `Moved ${room.name} to`,
            room.position
        );
    }

    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDragging);
}

console.log("Roombound map loaded:", map);
console.log("Map element:", mapElement);

renderRooms(map);