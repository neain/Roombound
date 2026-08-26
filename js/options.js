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

