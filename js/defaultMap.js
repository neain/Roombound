const defaultMap = {
    rooms: [
        {
            roomID: "room_001",
            name: "Entrance Hall",
            floor: 1,
            notes: "",
            position: { x: 0, y: 0 },
            size: { width: 5, height: 5 },
            editorSize: { width: 200, height: 300 }
        },
        {
            roomID: "room_003",
            name: "Broom Closet",
            floor: 1,
            notes: "",
            position: { x: 5, y: 15 },
            size: { width: 5, height: 5 },
            editorSize: { width: 200, height: 300 }
        },
        {
            roomID: "room_002",
            name: "Kitchen",
            floor: 1,
            notes: "",
            position: { x: 20, y: 20 },
            size: { width: 5, height: 5 },
            editorSize: { width: 200, height: 300 }
        }
    ],

    connections: [
        {
            roomA: "room_001",
            roomB: "room_002",
            roomAConnectionSide: "E",
            roomBConnectionSide: "W",
            directionTo: "B",
            name: "Hallway"
        },
        {
            roomA: "room_001",
            roomB: null,
            roomAConnectionSide: "S",
            roomBConnectionSide: null,
            directionTo: "A",
            name: "Locked Door"
        },
        {
            roomA: "room_001",
            roomB: "room_003",
            roomAConnectionSide: "E",
            roomBConnectionSide: "W",
            directionTo: "both",
            name: "Hallway"
        },
        {
            roomA: "room_003",
            roomB: "room_002",
            roomAConnectionSide: "E",
            roomBConnectionSide: "W",
            directionTo: "both",
            name: "Hallway"
        },
        {
            roomA: "room_002",
            roomB: "room_001",
            roomAConnectionSide: "W",
            roomBConnectionSide: "E",
            directionTo: "both",
            name: "Hallway"
        }
    ]
};

export default defaultMap;