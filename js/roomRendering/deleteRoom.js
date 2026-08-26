// ============================================================
// IMPORTS
// ============================================================

// Room rendering router.
// CURRENT: renderRooms()
// If changing how room deletion refreshes the room display, inspect:
//   ../roomRenderer.js
import {
    renderRooms
} from "../roomRenderer.js";

import {
    getConfirmDelete
} from "../options.js";

// Connection rendering.
// CURRENT: renderConnections()
// If changing how room deletion affects connection display, inspect:
//   ../connectionRenderer.js
import {
    renderConnections
} from "../connectionRenderer.js";

// Deletes a room from the map by ID and removes any connections that
// reference it. Then redraws the affected map elements.
//
// If the requested room does not exist, nothing happens.
//
// When confirmDelete is true, the user must confirm before the room
// is removed.
export function deleteRoom(
    map,
    roomID,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const roomIndex = map.rooms.findIndex(
        (room) => room.roomID === roomID
    );

    if (roomIndex === -1) {
        return false;
    }

    const room =
        map.rooms[roomIndex];

    if (getConfirmDelete()) {
        const confirmed =
            confirm(
                `Delete room "${room.name}"?\n\n` +
                "This will also remove any connections attached to it."
            );

        if (!confirmed) {
            return false;
        }
    }

    // Remove the room.
    map.rooms.splice(roomIndex, 1);

    // Remove every connection that points to this room
    // (either as roomA or roomB).
    map.connections = map.connections.filter(
        (conn) => conn.roomA !== roomID && conn.roomB !== roomID
    );

    renderRooms(
        map,
        mapElement,
        connectionLayer,
        zoom,
        currentFloor
    );

    renderConnections({
        map,
        connectionLayer,
        zoom,
        currentFloor
    });

    return true;
}