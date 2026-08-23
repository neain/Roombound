// Shared map/grid utilities used to calculate the visible map center
// and convert that position into room grid coordinates.
import {
    GRID_SIZE,
    MAP_ORIGIN
} from "../mapUtils.js";

// New-room creation context that receives the temporary room and allows
// the user to either create it or cancel the operation.
import {
    openNewRoomContext
} from "../newRoomContext.js";

// Room rendering router. Used only if this function later needs to request
// room-rendering operations; currently not required by createRoom itself.

// Creates a new room centered on the currently visible portion of the map.
//
// The room is created as temporary data and passed to the new-room context.
// It is not added to the map until the user presses Create.
export function createRoom(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    let highestRoomNumber = 0;
    let roomNumber;
    let centerX;
    let centerY;
    let worldX;
    let worldY;
    let room;

    for (const room of map.rooms) {
        const match = room.roomID.match(/^room_(\d+)$/);

        if (!match) {
            continue;
        }

        highestRoomNumber =
            Math.max(
                highestRoomNumber,
                Number(match[1])
            );
    }

    roomNumber =
        String(highestRoomNumber + 1).padStart(3, "0");

    // Determine the center of the currently visible map area.
    centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;

    centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;

    // Convert that screen position back into map grid coordinates.
    worldX =
        (centerX - MAP_ORIGIN * zoom) /
        (GRID_SIZE * zoom);

    worldY =
        (centerY - MAP_ORIGIN * zoom) /
        (GRID_SIZE * zoom);

    // Create the room as temporary data. The new-room context decides whether
    // this room is eventually added to the map.
    room = {
        roomID: `room_${roomNumber}`,
        name: "New Room",
        floor: currentFloor,
        notes: "",
        connections: [],
        position: {
            x: Math.round(worldX - 2.5),
            y: Math.round(worldY - 2.5)
        },
        size: {
            width: 5,
            height: 5
        },
        textSize: 16
    };

    openNewRoomContext({
        map,
        room,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    });
}