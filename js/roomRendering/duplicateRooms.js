// Room rendering router.
// CURRENT: renderRooms(), getSelectedRooms(), clearRoomSelection(),
//          addRoomToSelection()
import {
    clearRoomSelection,
    addRoomToSelection
} from "../roomRenderer.js";

import {
    renderMap
} from "../mapRenderer.js";

// ============================================================
// ROOM DUPLICATION
// ============================================================

// Duplicates the supplied rooms.
//
// Each duplicate receives the next available room ID, is offset one grid
// square down and to the right, and becomes part of the new selection.
// Connections are intentionally not duplicated.
export function duplicateRooms(
    rooms,
    map
) {
    if (!rooms || rooms.length === 0) {
        return;
    }

    let highestRoomNumber = 0;
    const duplicatedRooms = [];

    for (const room of map.rooms) {
        const match =
            room.roomID.match(/^room_(\d+)$/);

        if (!match) {
            continue;
        }

        highestRoomNumber =
            Math.max(
                highestRoomNumber,
                Number(match[1])
            );
    }

    for (const room of rooms) {
        highestRoomNumber++;

        const duplicate =
            structuredClone(room);

        duplicate.roomID =
            `room_${String(highestRoomNumber).padStart(3, "0")}`;

        duplicate.position.x += 1;
        duplicate.position.y += 1;

        map.rooms.push(duplicate);
        duplicatedRooms.push(duplicate);
    }

    clearRoomSelection();

    for (const room of duplicatedRooms) {
        addRoomToSelection(room);
    }

    renderMap();
}