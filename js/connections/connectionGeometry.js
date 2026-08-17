// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: CONNECTION_ROOM_RANGE, getRoom()
// If working on connection search ranges or map lookups, inspect:
//   ../mapUtils.js
import {
    CONNECTION_ROOM_RANGE,
    getRoom
} from "../mapUtils.js";


// ============================================================
// ENDPOINT SEARCH
// ============================================================

// Finds rooms whose grid-space bounds overlap the configured endpoint range.
export function getRoomsInEndpointRange(
    context,
    selectedConnection,
    selectedEndpoint
) {
    const map =
        context.map;

    const endpoint =
        getSelectedEndpointPoint(
            context,
            selectedConnection,
            selectedEndpoint
        );

    if (!endpoint) {
        return [];
    }

    const rooms = [];

    for (const room of map.rooms) {
        const currentRoom =
            getSelectedEndpointRoom(
                context,
                selectedConnection,
                selectedEndpoint
            );

        if (
            currentRoom &&
            room.roomID === currentRoom.roomID
        ) {
            continue;
        }

        const roomLeft =
            room.position.x;

        const roomTop =
            room.position.y;

        const roomRight =
            roomLeft + room.size.width;

        const roomBottom =
            roomTop + room.size.height;

        const rangeLeft =
            endpoint.x - CONNECTION_ROOM_RANGE;

        const rangeTop =
            endpoint.y - CONNECTION_ROOM_RANGE;

        const rangeRight =
            endpoint.x + CONNECTION_ROOM_RANGE;

        const rangeBottom =
            endpoint.y + CONNECTION_ROOM_RANGE;

        if (
            roomRight >= rangeLeft &&
            roomLeft <= rangeRight &&
            roomBottom >= rangeTop &&
            roomTop <= rangeBottom
        ) {
            rooms.push(room);
        }
    }

    rooms.sort(
        (roomA, roomB) =>
            roomA.name.localeCompare(
                roomB.name
            )
    );

    return rooms;
}


// ============================================================
// ENDPOINT POSITION
// ============================================================

// Returns the room currently assigned to the selected endpoint.
export function getSelectedEndpointRoom(
    context,
    selectedConnection,
    selectedEndpoint
) {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return null;
    }

    const connection =
        selectedConnection.entry.connection;

    const roomID =
        selectedEndpoint === "A"
            ? connection.roomA
            : connection.roomB;

    return getRoom(
        context.map,
        roomID
    );
}


// Returns the map/grid position of the currently selected physical endpoint.
export function getSelectedEndpointPoint(
    context,
    selectedConnection,
    selectedEndpoint
) {
    if (
        !selectedConnection ||
        !selectedEndpoint
    ) {
        return null;
    }

    const connection =
        selectedConnection.entry.connection;

    const roomID =
        selectedEndpoint === "A"
            ? connection.roomA
            : connection.roomB;

    const side =
        selectedEndpoint === "A"
            ? connection.roomAConnectionSide
            : connection.roomBConnectionSide;

    const room =
        getRoom(
            context.map,
            roomID
        );

    if (!room) {
        return getFreeEndpointPoint(
            context,
            connection
        );
    }

    return getRoomEndpointPoint(
        room,
        side
    );
}


// Returns an approximate physical point for a connected room endpoint.
export function getRoomEndpointPoint(
    room,
    side
) {
    const left =
        room.position.x;

    const top =
        room.position.y;

    const width =
        room.size.width;

    const height =
        room.size.height;

    switch (side) {
        case "N":
            return {
                x: left + width / 2,
                y: top
            };

        case "E":
            return {
                x: left + width,
                y: top + height / 2
            };

        case "S":
            return {
                x: left + width / 2,
                y: top + height
            };

        case "W":
            return {
                x: left,
                y: top + height / 2
            };

        default:
            return {
                x: left + width / 2,
                y: top + height / 2
            };
    }
}


// Returns the grid-space point used for an unresolved endpoint.
//
// The current renderer represents an unresolved endpoint outward from room A,
// so use that endpoint when selecting an unconnected B endpoint.
export function getFreeEndpointPoint(
    context,
    connection
) {
    const roomA =
        getRoom(
            context.map,
            connection.roomA
        );

    if (!roomA) {
        return null;
    }

    const side =
        connection.roomAConnectionSide;

    const endpoint =
        getRoomEndpointPoint(
            roomA,
            side
        );

    switch (side) {
        case "N":
            endpoint.y -= 3;
            break;

        case "E":
            endpoint.x += 3;
            break;

        case "S":
            endpoint.y += 3;
            break;

        case "W":
            endpoint.x -= 3;
            break;
    }

    return endpoint;
}