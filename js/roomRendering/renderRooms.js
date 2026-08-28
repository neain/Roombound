// Room-rendering router. Room-rendering functions, ghost-room state, and
// shared rendering state are accessed through the router rather than
// directly importing their implementation files.
import {
    createRoomElement,
    renderGhostRooms,
    ghostRooms,
    createGroupElement
} from "../roomRenderer.js";

// Removes the current room elements and redraws every room in the map.
//
// Rooms on the current floor are rendered normally. Rooms supplied as ghosts
// are additionally rendered when they are on another floor. Groups are then
// rendered over their member rooms.
export function renderRooms(
    map,
    mapElement,
    connectionLayer,
    zoom,
    currentFloor
) {
    const visibleRoomIDs = new Set();

    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

    // Remove any previously rendered group elements before rebuilding them.
    mapElement.querySelectorAll(".group").forEach(
        (groupElement) => groupElement.remove()
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

    // Re-order grouped rooms according to the persistent order stored in the
    // group's roomIDs list. Appending an existing element moves it to the end
    // of the DOM without creating a new element.
    for (const group of map.groups) {
        for (const roomID of group.roomIDs) {
            const roomElement =
                mapElement.querySelector(
                    `.room[data-room-id="${roomID}"]`
                );

            if (roomElement) {
                mapElement.appendChild(roomElement);
            }
        }
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

    // Groups are rendered last so the group element sits above every member
    // room and becomes the visible interaction surface for the group.
    for (const group of map.groups) {
        if (group.floor !== currentFloor) {
            continue;
        }

        const groupElement = createGroupElement(
            group,
            map,
            mapElement,
            connectionLayer,
            zoom,
            currentFloor
        );

        if (!groupElement) {
            continue;
        }

        mapElement.appendChild(groupElement);
    }
}