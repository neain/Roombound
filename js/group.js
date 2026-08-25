import {
    clearRoomSelection,
    selectRoom
} from "./roomRenderer.js";

// ============================================================
// GROUP
// ============================================================
//
// Handles group data operations.
//
// Group rendering and map interaction are handled by groupElement.js.
// This module is responsible for creating and calculating group data.
//


// ============================================================
// GROUP CREATION
// ============================================================

// Creates a group from the supplied rooms.
//
// Groups exist on exactly one floor. The user is asked whether member room
// labels should be cleared before the group is created. The new group becomes
// the only selected object after creation.
export function createGroup(
    map,
    rooms,
    floor
) {
    if (rooms.length < 2) {
        return null;
    }

    const clearLabels =
        confirm(
            "Clear the room labels for this group?"
        );

    const group = {
        groupID: createGroupID(map),
        roomIDs: rooms.map(
            (room) => room.roomID
        ),
        name: "New Group",
        floor,
        position: {
            x: Infinity,
            y: Infinity
        },
        size: getGroupSize(rooms),
        notes: "",
        clearLabels
    };

    for (const room of rooms) {
        group.position.x =
            Math.min(
                group.position.x,
                room.position.x
            );

        group.position.y =
            Math.min(
                group.position.y,
                room.position.y
            );
    }

    map.groups.push(group);

    clearRoomSelection();
    selectRoom(group);

    return group;
}


// Returns the group's bounding size based on its current member rooms.
//
// Group size is calculated when the group is created or when rooms are added.
// Moving the group does not require recalculating this value because every
// member room moves by the same amount.
export function getGroupSize(
    rooms
) {
    let minX = Infinity;
    let minY = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    for (const room of rooms) {
        minX = Math.min(
            minX,
            room.position.x
        );

        minY = Math.min(
            minY,
            room.position.y
        );

        maxRight = Math.max(
            maxRight,
            room.position.x + room.size.width
        );

        maxBottom = Math.max(
            maxBottom,
            room.position.y + room.size.height
        );
    }

    return {
        width: maxRight - minX,
        height: maxBottom - minY
    };
}


// Creates the next available group ID using the same numbered format as rooms.
export function createGroupID(
    map
) {
    let highestGroupNumber = 0;

    for (const group of map.groups) {
        const match =
            group.groupID?.match(/^group_(\d+)$/);

        if (!match) {
            continue;
        }

        highestGroupNumber =
            Math.max(
                highestGroupNumber,
                Number(match[1])
            );
    }

    return `group_${String(
        highestGroupNumber + 1
    ).padStart(3, "0")}`;
}