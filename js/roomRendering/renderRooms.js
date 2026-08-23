// Room-rendering router. Room-rendering functions, ghost-room state, and
// shared rendering state are accessed through the router rather than
// directly importing their implementation files.
import {
    createRoomElement,
    renderGhostRooms,
    roomTooltip,
    ghostRooms
} from "../roomRenderer.js";

// Removes the current room elements and redraws every room in the map.
//
// Rooms on the current floor are rendered normally. Rooms supplied as ghosts
// are additionally rendered when they are on another floor.
export function renderRooms(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const visibleRoomIDs = new Set();

    if (!roomTooltip.parentElement) {
        roomTooltip.classList.add("room-tooltip");
        mapElement.appendChild(roomTooltip);
    }

    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

    // Render all normal rooms on the current floor.
    for (const room of map.rooms) {
        if (room.floor !== currentFloor) {
            continue;
        }

        const roomElement = createRoomElement(
            room,
            map,
            mapElement,
            connectionLayer,
            zoom,
            currentFloor
        );

        mapElement.appendChild(roomElement);
        visibleRoomIDs.add(room.roomID);
    }

    // Render ghost rooms from other floors in addition to the normal rooms.
    if (ghostRooms !== null) {
        renderGhostRooms(
            ghostRooms,
            map,
            mapElement,
            connectionLayer,
            zoom,
            currentFloor,
            visibleRoomIDs
        );
    }
}