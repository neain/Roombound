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
            ]
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
            ]
        }
    ]
};

const mapElement = document.getElementById("map");

console.log("Roombound map loaded:", map);
console.log("Map element:", mapElement);