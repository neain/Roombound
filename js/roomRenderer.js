// ============================================================
// ROOM RENDERING ROUTER
// ============================================================

// Renders every room currently visible on the map.
//
// Clears the existing room elements, creates room elements for the current
// floor, applies the current selection state, and handles ghost rooms when
// they have been supplied by the connection editor.

// Creates a new temporary room centered on the currently visible portion
// of the map.
//
// The room is passed to the new-room context, which determines whether the
// room is ultimately added to the map.

// Deletes a room from the map and removes any connections that reference it.
//
// Redraws the affected rooms and connections after the deletion.

// Moves a room while the left mouse button is held down.
//
// Converts mouse movement into grid movement, updates the room's stored
// position, updates its visible position, and redraws affected connections.

// Resizes a room while its resize handle is dragged.
//
// Converts mouse movement into grid dimensions, updates the room's stored
// size, updates its visible size, and redraws affected connections.
import {
    renderGhostRooms as renderGhostRoomsImpl
} from "./roomRendering/renderGhostRooms.js";

import {
    renderRooms as renderRoomsImpl
} from "./roomRendering/renderRooms.js";

import {
    createRoom as createRoomImpl
} from "./roomRendering/createRoom.js";

import {
    deleteRoom as deleteRoomImpl
} from "./roomRendering/deleteRoom.js";

import {
    startDragging as startDraggingImpl
} from "./roomRendering/startDragging.js";

import {
    startResizing as startResizingImpl
} from "./roomRendering/startResizing.js";

import {
    createRoomElement as createRoomElementImpl
} from "./roomRendering/createRoomElement.js";

// =================================================================================================
// TEMPORARY!!!
// =================================================================================================
import {
    selectRoom as selectRoomImpl,
    addRoomToSelection as addRoomToSelectionImpl,
    removeRoomFromSelection as removeRoomFromSelectionImpl,
    clearRoomSelection as clearRoomSelectionImpl,
    isRoomSelected as isRoomSelectedImpl,
    getSelectedRooms as getSelectedRoomsImpl,
    startBoxSelection as startBoxSelectionImpl
} from "./roomRendering/roomSelection.js";

// ============================================================
// ROOM RENDERING HELPERS
// ============================================================

// Sets the rooms that should remain visible as ghosts while the connection
// editor is open.
//
// Ghost rooms remain visible regardless of the current floor.

// Clears the rooms currently being displayed as ghosts.

// Builds the information displayed in the room tooltip.
//
// Internal room properties listed in hoverExceptions are excluded so the
// tooltip only displays normal room information.
import {
    getRoomHoverInfo as getRoomHoverInfoImpl
} from "./roomRendering/rendererHelper.js";

// ============================================================
// ROOM STATE
// ============================================================

// Room properties that should not be displayed in the room tooltip or editor.
// These are structural/internal properties rather than normal room details.
export const hoverExceptions = [
    "roomID",
    "connections",
    "position",
    "size",
    "editorSize",
    "textSize"
];

// Rooms that should remain visible while the connection editor is open,
// even when they are on another floor.
export let ghostRooms = null;


// Sets the rooms that should remain visible while the connection editor is
// open, regardless of their floor.
export function setGhostRooms(rooms) {
    ghostRooms = rooms || null;
}

// Clears the rooms currently being displayed as ghosts.
export function clearGhostRooms() {
    ghostRooms = null;
}

// Shared tooltip used when hovering over rooms.
export const roomTooltip = document.createElement("div");

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

export function selectRoom(...args) {
    return selectRoomImpl(...args);
}

export function addRoomToSelection(...args) {
    return addRoomToSelectionImpl(...args);
}

export function removeRoomFromSelection(...args) {
    return removeRoomFromSelectionImpl(...args);
}

export function clearRoomSelection(...args) {
    return clearRoomSelectionImpl(...args);
}

export function isRoomSelected(...args) {
    return isRoomSelectedImpl(...args);
}

export function getSelectedRooms(...args) {
    return getSelectedRoomsImpl(...args);
}

// Routes requests to begin room box selection.
export function startBoxSelection(...args) {
    return startBoxSelectionImpl(...args);
}

// ============================================================
// ROOM RENDERING HELPERS
// ============================================================

// Routes requests to build the information displayed in a room tooltip.
export function getRoomHoverInfo(...args) {
    return getRoomHoverInfoImpl(...args);
}