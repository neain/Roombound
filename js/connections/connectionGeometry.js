// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: CONNECTION_ROOM_RANGE, getRoom()
// If working on connection search ranges or map lookups, inspect:
//   ../mapUtils.js
import {
    getRoom
} from "../mapUtils.js";

import {
    getConnectionEndpointSelectorSize
} from "../options.js";


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

        const ConnectionEndpointSelectorSize = getConnectionEndpointSelectorSize();

        const rangeLeft =
            endpoint.x - ConnectionEndpointSelectorSize;

        const rangeTop =
            endpoint.y - ConnectionEndpointSelectorSize;

        const rangeRight =
            endpoint.x + ConnectionEndpointSelectorSize;

        const rangeBottom =
            endpoint.y + ConnectionEndpointSelectorSize;

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


// Returns the grid-space point for a room's selected attachment position.
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

        case "NE":
            return {
                x: left + width,
                y: top
            };

        case "NW":
            return {
                x: left,
                y: top
            };

        case "SE":
            return {
                x: left + width,
                y: top + height
            };

        case "SW":
            return {
                x: left,
                y: top + height
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

        case "NE":
            endpoint.x += 3;
            endpoint.y -= 3;
            break;

        case "NW":
            endpoint.x -= 3;
            endpoint.y -= 3;
            break;

        case "SE":
            endpoint.x += 3;
            endpoint.y += 3;
            break;

        case "SW":
            endpoint.x -= 3;
            endpoint.y += 3;
            break;
    }

    return endpoint;
}