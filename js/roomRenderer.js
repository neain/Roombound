// ============================================================
// ROOM RENDERING ROUTER
// ============================================================

// Public interface for the room rendering system.
//
// Rendering, room creation/deletion, room movement/resizing, room selection,
// and room-related UI helpers are implemented in individual files. This
// router provides the public doorway to those functions and owns shared room
// rendering state that must be accessible across the system.


// ============================================================
// ROOM RENDERING FUNCTIONS
// ============================================================

// Renders every room currently visible on the map.
//
// Clears existing room elements, creates rooms for the current floor, applies
// the current selection state, and handles any supplied ghost rooms.
import {
    renderRooms as renderRoomsImpl
} from "./roomRendering/renderRooms.js";

// Creates a new temporary room centered on the currently visible portion of
// the map.
//
// The room is passed to the new-room context, which determines whether it is
// ultimately added to the map.
import {
    createRoom as createRoomImpl
} from "./roomRendering/createRoom.js";

// Deletes a room from the map and removes any connections that reference it.
//
// Redraws the affected rooms and connections after the deletion.
import {
    deleteRoom as deleteRoomImpl
} from "./roomRendering/deleteRoom.js";

// Moves a room while the left mouse button is held down.
//
// Converts mouse movement into grid movement, updates the room's stored
// position, updates its visible position, and redraws affected connections.
import {
    startDragging as startDraggingImpl
} from "./roomRendering/startDragging.js";

// Resizes a room while its resize handle is dragged.
//
// Converts mouse movement into grid dimensions, updates the room's stored
// size, updates its visible size, and redraws affected connections.
import {
    startResizing as startResizingImpl
} from "./roomRendering/startResizing.js";

// Creates the visible DOM element representing a room.
import {
    createRoomElement as createRoomElementImpl
} from "./roomRendering/createRoomElement.js";

// Renders rooms that must remain visible while the connection editor is open,
// including rooms that are not on the current floor.
import {
    renderGhostRooms as renderGhostRoomsImpl
} from "./roomRendering/renderGhostRooms.js";

import {
    createGroupElement as createGroupElementImpl
} from "./roomRendering/groupElement.js";

// Duplicates every currently selected room.
//
// Creates independent room data with new IDs and offsets their positions.
// Connections are intentionally not duplicated.
import {
    duplicateRooms as duplicateRoomsImpl
} from "./roomRendering/duplicateRooms.js";

// ============================================================
// ROOM SELECTION FUNCTIONS
// ============================================================

// Begins a potential box selection over empty map space.
//
// Handles pointer tracking and creates the temporary selection rectangle.
import {
    startBoxSelection as startBoxSelectionImpl
} from "./roomRendering/startBoxSelection.js";

// Selects every visible room whose map-space rectangle intersects the
// supplied selection rectangle.
import {
    selectIntersectingRooms as selectIntersectingRoomsImpl
} from "./roomRendering/selectIntersectingRooms.js";


// ============================================================
// ROOM STATE
// ============================================================

// Rooms that should remain visible while the connection editor is open,
// even when they are on another floor.
export let ghostRooms = null;

let roomClipboard = null;

// The rooms currently selected by the user.
//
// Selection state is owned by the router because multiple room-selection
// functions and other room-rendering functions need access to the same state.
let selectedRooms = [];

// ============================================================
// GHOST ROOM STATE
// ============================================================

// Sets the rooms that should remain visible while the connection editor is
// open, regardless of their floor.
export function setGhostRooms(rooms) {
    ghostRooms = rooms || null;
}

// Clears the rooms currently being displayed as ghosts.
export function clearGhostRooms() {
    ghostRooms = null;
}


// ============================================================
// ROOM SELECTION STATE
// ============================================================

// Returns every room currently selected.
export function getSelectedRooms() {
    return selectedRooms;
}

// Returns the first selected room, or null when nothing is selected.
//
// This preserves the existing single-room selection interface while supporting
// multi-room selection.

// Selects exactly one room and clears any previous selection.
export function selectRoom(room) {
    selectedRooms = [room];
}

// Adds a room to the current selection if it is not already selected.
export function addRoomToSelection(room) {
    if (selectedRooms.includes(room)) {
        return;
    }

    selectedRooms.push(room);
}

// Removes a room from the current selection.
export function removeRoomFromSelection(room) {
    selectedRooms =
        selectedRooms.filter(
            (selectedRoom) =>
                selectedRoom !== room
        );
}

// Clears the current selection.
export function clearRoomSelection() {
    selectedRooms = [];
}

// Returns whether a room is currently selected.
export function isRoomSelected(room) {
    return selectedRooms.includes(room);
}


// ============================================================
// ROOM RENDERING ROUTER
// ============================================================

// Routes requests to render every visible room on the map.
export function renderRooms(...args) {
    return renderRoomsImpl(...args);
}

// Routes requests to create a new temporary room.
export function createRoom(...args) {
    return createRoomImpl(...args);
}

// Routes requests to delete a room and its associated connections.
export function deleteRoom(...args) {
    return deleteRoomImpl(...args);
}

// Routes requests to duplicate the currently selected rooms.
export function duplicateRooms(...args) {
    return duplicateRoomsImpl(...args);
}

// Routes requests to begin dragging a room.
export function startDragging(...args) {
    return startDraggingImpl(...args);
}

// Routes requests to begin resizing a room.
export function startResizing(...args) {
    return startResizingImpl(...args);
}

// Routes requests to create the visible DOM element for a room.
export function createRoomElement(...args) {
    return createRoomElementImpl(...args);
}

// Routes requests to render ghost rooms supplied by the connection editor.
export function renderGhostRooms(...args) {
    return renderGhostRoomsImpl(...args);
}

export function createGroupElement(...args) {
    return createGroupElementImpl(...args);
}


// ============================================================
// ROOM SELECTION ROUTER
// ============================================================

// Routes requests to begin box selection.
export function startBoxSelection(...args) {
    return startBoxSelectionImpl(...args);
}

// Routes requests to select rooms intersecting a selection rectangle.
export function selectIntersectingRooms(...args) {
    return selectIntersectingRoomsImpl(...args);
}


// ============================================================
// ROOM DUPLICATION HELPERS
// ============================================================

export function setRoomClipboard(rooms) {
    roomClipboard = structuredClone(rooms);
}

export function getRoomClipboard() {
    return roomClipboard;
}

export function clearRoomClipboard() {
    roomClipboard = null;
}