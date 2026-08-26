import {
    clearRoomSelection,
    selectRoom,
    deleteRoom
} from "./roomRenderer.js";

import {
    getRoom
} from "./mapUtils.js";

import {
    renderMap
} from "./mapRenderer.js"

import {
    getConfirmGroupDelete,
    getConfirmDelete
} from "./options.js";

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

// Creates a group from the supplied rooms and/or groups.
//
// Groups exist on exactly one floor. The user is asked whether member room
// labels should be cleared before the group is created. Notes from all
// supplied objects are combined into the new group. Existing groups supplied
// to this function are replaced by the newly created group.
export function createGroup(
    map,
    objects,
    floor
) {
    if (objects.length < 2) {
        return null;
    }

    const rooms = [];

    for (const object of objects) {
        if (isGroup(object)) {
            for (const roomID of object.roomIDs) {
                const room =
                    getRoom(
                        map,
                        roomID
                    );

                if (room) {
                    rooms.push(room);
                }
            }
        } else {
            rooms.push(object);
        }
    }

    if (rooms.length < 2) {
        return null;
    }

    const clearLabels =
        confirm(
            "Clear the room labels from the combined room?"
        );

    const hasNotes =
        objects.some(
            (object) => object.notes
        );

    let notes = "";

    if (hasNotes) {
        const preserveNotes =
            confirm(
                "Preserve notes?"
            );

        if (preserveNotes) {
            notes =
                getGroupedNotes(objects);
        }
    }

    const group = {
        groupID: createGroupID(map),
        roomIDs: rooms.map(
            (room) => room.roomID
        ),
        name: "New Group",
        floor,
        position: getGroupPosition(rooms),
        size: getGroupSize(rooms),
        notes,
        clearLabels
    };

    // BEGIN EDIT
    // Replace any groups used to create this group.
    map.groups =
        map.groups.filter(
            (existingGroup) =>
                !objects.includes(existingGroup)
        );

    map.groups.push(group);
    // END EDIT

    clearRoomSelection();
    selectRoom(group);

    return group;
}

// ============================================================
// GROUP DELETION
// ============================================================

// Deletes a group and optionally deletes all rooms that make up the group.
//
// Group deletion confirmation is controlled by confirmGroupDelete.
// Member-room deletion is passed through deleteRoom(), which handles its own
// room-deletion confirmation.
export function deleteGroup(
    map,
    group
) {
    if (!group || !isGroup(group)) {
        return;
    }

    if (getConfirmDelete()) {
        const confirmed =
            confirm(
                `Delete "${group.name}"?`
            );

        if (!confirmed) {
            return;
        }
    }

    let deleteRooms = true;

    if (getConfirmGroupDelete()) {
        deleteRooms =
            confirm(
                `Delete all rooms that make up "${group.name}"?`
            );
    }

    if (deleteRooms) {
        const memberRoomIDs =
            [...group.roomIDs];

        for (const roomID of memberRoomIDs) {
            deleteRoom(map,roomID);
        }
    }

    const groupIndex =
        map.groups.findIndex(
            (existingGroup) =>
                existingGroup.groupID === group.groupID
        );

    if (groupIndex !== -1) {
        map.groups.splice(
            groupIndex,
            1
        );
    }

    clearRoomSelection();
    renderMap();
}

// Returns the group's bounding size based on its current member rooms.
//
// Group size is calculated when the group is created. Moving the group does
// not require recalculating this value because every member room moves by the
// same amount.
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

// Returns the top-left position of the group's bounding rectangle based on
// its current member rooms.
export function getGroupPosition(
    rooms
) {
    let minX = Infinity;
    let minY = Infinity;

    for (const room of rooms) {
        minX = Math.min(
            minX,
            room.position.x
        );

        minY = Math.min(
            minY,
            room.position.y
        );
    }

    return {
        x: minX,
        y: minY
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

// Creates a snapshot of the notes from the supplied rooms or groups.
//
// Each object's notes are labeled with the object's name and separated from
// the next object's notes by a blank line. Objects without notes are ignored.
export function getGroupedNotes(
    objects
) {
    const noteBlocks = [];

    for (const object of objects) {
        if (!object.notes) {
            continue;
        }

        noteBlocks.push(
            `${object.name}:\n${object.notes}`
        );
    }

    return noteBlocks.join("\n\n");
}

// Returns whether the supplied object is a group.
export function isGroup(
    object
) {
    return Boolean(
        object?.groupID
    );
}