const defaultMap = {

    rooms: [
        {
            roomID: "room_001",
            name: "Entrance Hall",
            floor: 1,
            connections: [
                {
                    fromSide: "E",
                    to: "room_002",
                    toSide: "W",
                    name: "Hallway",
                    bidirectional: false
                },
                {
                    fromSide: "S",
                    to: null,
                    toSide: null,
                    name: "Locked Door",
                    bidirectional: false
                },
                {
                    fromSide: "E",
                    to: "room_003",
                    toSide: "W",
                    name: "Hallway",
                    bidirectional: true
                }
            ],
            position: {x: 0, y: 0},
            size: {width: 5, height: 5},
        },{
            roomID: "room_003",
            name: "Broom Closet",
            floor: 1,
            connections: [
                {
                    fromSide: "E",
                    to: "room_002",
                    toSide: "W",
                    name: "Hallway",
                    bidirectional: true
                }
            ],
            position: {x: 5, y: 15},
            size: {width: 5, height: 5},
        },
        {
            roomID: "room_002",
            name: "Kitchen",
            floor: 1,
            connections: [
                {
                    fromSide: "W",
                    to: "room_001",
                    toSide: "E",
                    name: "Hallway",
                    bidirectional: true
                }
            ],
            position: {x: 20, y: 20},
            size: {width: 5, height: 5},
        }
    ]

};

export default defaultMap;