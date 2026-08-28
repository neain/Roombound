// ============================================================
// OPTION PERSISTENCE
// ============================================================

const STORAGE_PREFIX = "roombound.";

function saveOption(key, value) {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(value));
}

function getSavedOption(key) {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
}

// Clears all persisted Roombound options.

export function clearSavedOptions() {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);

        if (key?.startsWith(STORAGE_PREFIX)) {
            keysToRemove.push(key);
        }
    }

    for (const key of keysToRemove) {
        localStorage.removeItem(key);
    }
}

function parseBoolean(value) {
    return value === "true";
}

function parseNumber(value) {
    return Number(value);
}


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

export function setConfirmDelete(value, save = true) {
    confirmDelete = Boolean(value);
    if (!save) {return;}
    saveOption("confirmDelete", confirmDelete);
}

// Returns whether deleting the rooms contained by a group should require

// an additional group-level confirmation.

export function getConfirmGroupDelete() {

    return confirmGroupDelete;

}

// Sets whether deleting the rooms contained by a group should require

// an additional group-level confirmation.

export function setConfirmGroupDelete(value, save = true) {

    confirmGroupDelete = Boolean(value);

    if (!save) {return;}

    saveOption("confirmGroupDelete", confirmGroupDelete);

}

// ============================================================
// WINDOW OPTIONS
// ============================================================

let closeWindowsOnClick = true;

// Returns whether open windows should close when the empty map is clicked.

export function getCloseWindowsOnClick() {

    return closeWindowsOnClick;

}

// Sets whether open windows should close when the empty map is clicked.

export function setCloseWindowsOnClick(value, save = true) {

    closeWindowsOnClick = Boolean(value);

    if (!save) {return;}

    saveOption("closeWindowsOnClick", closeWindowsOnClick);

}


// ============================================================

// GROUP OPTIONS

// ============================================================

let groupDefaults = true;

// Returns whether grouping should use the default grouping options without

// displaying the grouping-options window.

export function getGroupDefaults() {

    return groupDefaults;

}

// Sets whether grouping should use the default grouping options without

// displaying the grouping-options window.

export function setGroupDefaults(value, save = true) {

    groupDefaults = Boolean(value);

    if (!save) {return;}

    saveOption("groupDefaults", groupDefaults);

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

export function setDefaultSnapToGrid(value, save = true) {

    defaultSnapToGrid = Boolean(value);

    if (!save) {return;}

    saveOption("defaultSnapToGrid", defaultSnapToGrid);

}

// ============================================================
// NEW USER WINDOW
// ============================================================


// Whether to show the Getting Started window when an empty map is loaded.
let showGettingStarted = true;


// Returns whether the Getting Started window should be shown.
export function getShowGettingStarted() {
    return showGettingStarted;
}


// Sets whether the Getting Started window should be shown.
export function setShowGettingStarted(value, save = true) {
    showGettingStarted = Boolean(value);
    if (!save) {return;}
    saveOption("showGettingStarted", showGettingStarted);
}

// ============================================================
// NEW ROOM DEFAULTS
// ============================================================

// Default fill color for newly created rooms.
let defaultNewRoomColor = "#333333";

// Default width for newly created rooms, in grid units.
let defaultNewRoomWidth = 5;

// Default height for newly created rooms, in grid units.
let defaultNewRoomHeight = 5;

// Returns the default fill color for newly created rooms.
export function getDefaultNewRoomColor() {
    return defaultNewRoomColor;
}

// Sets the default fill color for newly created rooms.
export function setDefaultNewRoomColor(value, save = true) {
    defaultNewRoomColor = value;
    if (!save) {return;}
    saveOption("defaultNewRoomColor", defaultNewRoomColor);
}

// Returns the default width for newly created rooms.

export function getDefaultNewRoomWidth() {

    return defaultNewRoomWidth;

}

// Sets the default width for newly created rooms, in grid units.

export function setDefaultNewRoomWidth(value, save = true) {

    defaultNewRoomWidth = Number(value);

    if (!save) {return;}

    saveOption("defaultNewRoomWidth", defaultNewRoomWidth);

}

// Returns the default height for newly created rooms.

export function getDefaultNewRoomHeight() {

    return defaultNewRoomHeight;

}

// Sets the default height for newly created rooms, in grid units.

export function setDefaultNewRoomHeight(value, save = true) {

    defaultNewRoomHeight = Number(value);

    if (!save) {return;}

    saveOption("defaultNewRoomHeight", defaultNewRoomHeight);

}


// ============================================================

// CONNECTION EDITOR DEFAULTS

// ============================================================

// Default size of the square used to select connection endpoints.

let connectionEndpointSelectorSize = 12;

// Returns the default connection endpoint selector size.

export function getConnectionEndpointSelectorSize() {

    return connectionEndpointSelectorSize;

}

// Sets the default connection endpoint selector size.

export function setConnectionEndpointSelectorSize(value, save = true) {

    connectionEndpointSelectorSize = Number(value);

    if (!save) {return;}

    saveOption("connectionEndpointSelectorSize", connectionEndpointSelectorSize);

}


// ============================================================

// FLOOR OPTIONS

// ============================================================

// Whether floor 0 is allowed to exist.

let allowFloorZero = false;

// Returns whether floor 0 is allowed.

export function getAllowFloorZero() {

    return allowFloorZero;

}

// Sets whether floor 0 is allowed.

export function setAllowFloorZero(value, save = true) {

    allowFloorZero = Boolean(value);

    if (!save) {return;}

    saveOption("allowFloorZero", allowFloorZero);

}


// ============================================================
// LOAD SAVED OPTIONS
// ============================================================

// Loads saved option values from localStorage.

export function initializeOptions() {

    const savedConfirmDelete = getSavedOption("confirmDelete");

    if (savedConfirmDelete !== null) {
        setConfirmDelete(parseBoolean(savedConfirmDelete), false);
    }

    const savedConfirmGroupDelete = getSavedOption("confirmGroupDelete");

    if (savedConfirmGroupDelete !== null) {
        setConfirmGroupDelete(parseBoolean(savedConfirmGroupDelete), false);
    }

    const savedGroupDefaults = getSavedOption("groupDefaults");

    if (savedGroupDefaults !== null) {
        setGroupDefaults(parseBoolean(savedGroupDefaults), false);
    }

    const savedDefaultSnapToGrid = getSavedOption("defaultSnapToGrid");

    if (savedDefaultSnapToGrid !== null) {
        setDefaultSnapToGrid(parseBoolean(savedDefaultSnapToGrid), false);
    }

    const savedDefaultNewRoomColor = getSavedOption("defaultNewRoomColor");

    if (savedDefaultNewRoomColor !== null) {
        setDefaultNewRoomColor(savedDefaultNewRoomColor, false);
    }

    const savedShowGettingStarted = getSavedOption("showGettingStarted");

    if (savedShowGettingStarted !== null) {
        setShowGettingStarted(
            parseBoolean(savedShowGettingStarted),
            false
        );
    }

    const savedDefaultNewRoomWidth = getSavedOption("defaultNewRoomWidth");

    if (savedDefaultNewRoomWidth !== null) {
        setDefaultNewRoomWidth(parseNumber(savedDefaultNewRoomWidth), false);
    }

    const savedDefaultNewRoomHeight = getSavedOption("defaultNewRoomHeight");

    if (savedDefaultNewRoomHeight !== null) {
        setDefaultNewRoomHeight(parseNumber(savedDefaultNewRoomHeight), false);
    }

    const savedConnectionEndpointSelectorSize = getSavedOption(
        "connectionEndpointSelectorSize"
    );

        if (savedConnectionEndpointSelectorSize !== null) {
        setConnectionEndpointSelectorSize(
            parseNumber(savedConnectionEndpointSelectorSize),
            false
        );
    }

    const savedAllowFloorZero = getSavedOption("allowFloorZero");

    if (savedAllowFloorZero !== null) {
        setAllowFloorZero(parseBoolean(savedAllowFloorZero), false);
    }

    const savedCloseWindowsOnClick =
        getSavedOption("closeWindowsOnClick");

    if (savedCloseWindowsOnClick !== null) {

        setCloseWindowsOnClick(
            parseBoolean(savedCloseWindowsOnClick),
            false
        );

    }

}