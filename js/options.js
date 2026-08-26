// ============================================================
// DELETE OPTIONS
// ============================================================

let confirmDelete = false;
let confirmGroupDelete = true;

// Returns whether destructive deletions should be confirmed.
export function getConfirmDelete() {
    return confirmDelete;
}

// Sets whether destructive deletions should be confirmed.
export function setConfirmDelete(value) {
    confirmDelete = value;
}

// Returns whether deleting the rooms contained by a group should require
// an additional group-level confirmation.
export function getConfirmGroupDelete() {
    return confirmGroupDelete;
}

// Sets whether deleting the rooms contained by a group should require
// an additional group-level confirmation.
export function setConfirmGroupDelete(value) {
    confirmGroupDelete = value;
}


// ============================================================
// GROUP OPTIONS
// ============================================================

let groupDefaults = false;

// Returns whether grouping should use the default grouping options without
// displaying the grouping-options window.
export function getGroupDefaults() {
    return groupDefaults;
}

// Sets whether grouping should use the default grouping options without
// displaying the grouping-options window.
export function setGroupDefaults(value) {
    groupDefaults = value;
}

// ============================================================
// GRID SNAPPING
// ============================================================

// Default room snapping behavior.
let defaultSnapToGrid = true;

// Returns whether rooms should snap to the grid by default.
export function getDefaultSnapToGrid() {
    return defaultSnapToGrid;
}

// Sets the default room snapping behavior.
export function setDefaultSnapToGrid(value) {
    defaultSnapToGrid = Boolean(value);
}