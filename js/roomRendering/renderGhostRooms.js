// Room-rendering router. Room elements are created through the router so
// rendering implementation files do not import other rendering
// implementations directly.
import {
    createRoomElement
} from "../roomRenderer.js";

// Renders the rooms supplied by the connection editor when they are not
// already visible on the current floor.
export function renderGhostRooms(
    rooms,
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor,
    visibleRoomIDs
) {
    for (const room of rooms) {
        if (
            room.floor === currentFloor ||
            visibleRoomIDs.has(room.roomID)
        ) {
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

        roomElement.classList.add("room-ghost");

        mapElement.appendChild(roomElement);
    }
}