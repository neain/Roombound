// Room rendering router.
// CURRENT: renderRooms(), getSelectedRooms(), clearRoomSelection(),
//          addRoomToSelection()
import {
    clearRoomSelection
} from "../roomRenderer.js";

import {
    renderMap,
    getCurrentFloor
} from "../mapRenderer.js";

import {
    isGroup,
    createGroupID
} from "../group.js";

// ============================================================
// ROOM DUPLICATION
// ============================================================

// Duplicates the supplied rooms and groups.
//
// Rooms receive new IDs and are offset one grid square down and to the right.
// Groups receive new IDs and retain their membership structure, with their
// member room IDs remapped to the newly duplicated rooms. All duplicated
// objects are placed on the current floor. Connections are intentionally not
// duplicated.
export function duplicateRooms(
    objects,
    map
) {
    if (!objects || objects.length === 0) {
        return;
    }

    const currentFloor =
        getCurrentFloor();

    let highestRoomNumber = 0;
    const duplicatedObjects = [];
    const roomIDMap = new Map();

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

    // Duplicate rooms first so groups can point at their new room IDs.
    for (const object of objects) {
        if (isGroup(object)) {
            continue;
        }

        highestRoomNumber++;

        const duplicate =
            structuredClone(object);

        const newRoomID =
            `room_${String(highestRoomNumber).padStart(3, "0")}`;

        roomIDMap.set(
            object.roomID,
            newRoomID
        );

        duplicate.roomID =
            newRoomID;

        duplicate.position.x += 1;
        duplicate.position.y += 1;
        duplicate.floor =
            currentFloor;

        map.rooms.push(duplicate);
        duplicatedObjects.push(duplicate);
    }

    // Duplicate groups after their member rooms have been duplicated.
    for (const object of objects) {
        if (!isGroup(object)) {
            continue;
        }

        const duplicate =
            structuredClone(object);

        duplicate.groupID =
            createGroupID(map);

        duplicate.roomIDs =
            object.roomIDs
                .map(
                    (roomID) =>
                        roomIDMap.get(roomID)
                )
                .filter(
                    (roomID) =>
                        roomID !== undefined
                );

        duplicate.position.x += 1;
        duplicate.position.y += 1;
        duplicate.floor =
            currentFloor;

        map.groups.push(duplicate);
        duplicatedObjects.push(duplicate);
    }

    clearRoomSelection();
    renderMap();
}