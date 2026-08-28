// ============================================================
// IMPORTS
// ============================================================

// Current map file schema version.
const CURRENT_MAP_VERSION = 1.1;

import {
    renderMap
} from "./mapRenderer.js";

// ============================================================
// MAP FILE STATE
// ============================================================

// File handle for the currently associated local map file.
//
// This is intentionally not stored inside the map JSON because it is
// browser-specific UI state rather than map data.
let currentFileHandle = null;


// ============================================================
// MAP STORAGE
// ============================================================

/**
 * Creates a clean serializable copy of the current map.
 * Strips any temporary UI-only state.
 */
function getSerializableMap(map) {
    return {
        version: CURRENT_MAP_VERSION,
        app: "Roombound",
        editorSize: map.editorSize
            ? { ...map.editorSize }
            : { width: 400, height: 500 },
        rooms: map.rooms.map(room => {
            const savedRoom = { ...room };

            delete savedRoom.editorSize;

            return savedRoom;
        }),
        groups: map.groups,
        connections: map.connections.map(conn => ({
            roomA: conn.roomA,
            roomB: conn.roomB,
            roomAConnectionSide: conn.roomAConnectionSide,
            roomBConnectionSide: conn.roomBConnectionSide,
            directionTo: conn.directionTo,
            name: "name" in conn ? conn.name : ""
        }))
    };
}


// ============================================================
// FILE SYSTEM ACCESS API
// ============================================================

/**
 * Writes the current map data to an existing File System Access API handle.
 */
async function writeMapToFileHandle(
    map,
    fileHandle
) {
    const data = getSerializableMap(map);
    const json = JSON.stringify(data, null, 2);

    const writable =
        await fileHandle.createWritable();

    await writable.write(json);
    await writable.close();

    console.log(
        `Map saved to ${fileHandle.name}`
    );
}

// Clears the local file associated with the current map.
//
// A newly created map must not retain the file association of the map that
// was previously being edited, otherwise Save could overwrite the old map.
export function clearCurrentFileHandle() {
    currentFileHandle = null;
}

// ============================================================
// LEGACY SAVE FALLBACK
// ============================================================

/**
 * Downloads the current map as a JSON file.
 *
 * This is the fallback for browsers that do not support the File System
 * Access API. The browser's normal download behavior determines whether
 * the user is prompted for a save location.
 */
function saveMapWithDownload(map) {
    const data = getSerializableMap(map);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob(
        [json],
        { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download =
        `roombound-map-${new Date().toISOString().slice(0, 10)}.json`;

    a.click();

    URL.revokeObjectURL(url);

    console.log("Map saved");
}


// ============================================================
// SAVE
// ============================================================

/**
 * Saves the current map.
 *
 * If the browser supports the File System Access API and a file has already
 * been associated with the map, the existing file is overwritten.
 *
 * Browsers without the API use the legacy download behavior instead.
 */
export async function saveMap(map) {
    // Browsers without File System Access API support use the old behavior.
    if (!window.showSaveFilePicker) {
        saveMapWithDownload(map);
        return;
    }

    if (currentFileHandle) {
        try {
            await writeMapToFileHandle(
                map,
                currentFileHandle
            );

            return;
        } catch (error) {
            // If the existing file can no longer be written, fall through to
            // Save As so the user can choose another destination.
            console.warn(
                "Could not overwrite the current map file.",
                error
            );
        }
    }

    await saveMapAs(map);
}


// ============================================================
// SAVE AS
// ============================================================

/**
 * Always prompts the user to choose a file.
 *
 * Browsers with File System Access API support use the native save picker.
 * Other browsers fall back to the browser's normal download behavior.
 */
export async function saveMapAs(map) {
    const suggestedName =
        currentFileHandle?.name ||
        `roombound-map-${new Date().toISOString().slice(0, 10)}.json`;

    // Use the File System Access API when available.
    if (window.showSaveFilePicker) {
        try {
            const fileHandle =
                await window.showSaveFilePicker({
                    suggestedName,
                    startIn: "documents",
                    types: [
                        {
                            description: "Roombound Map",
                            accept: {
                                "application/json": [".json"]
                            }
                        }
                    ]
                });

            currentFileHandle = fileHandle;

            await writeMapToFileHandle(
                map,
                currentFileHandle
            );
        } catch (error) {
            // The user cancelling the file picker is normal and should not
            // produce an error dialog.
            if (error.name === "AbortError") {
                return;
            }

            console.error(
                "Could not save map.",
                error
            );

            alert(
                "Could not save the map.\n\n" +
                error.message
            );
        }

        return;
    }

    // Browsers without File System Access API support use the old behavior.
    saveMapWithDownload(map);
}


// ============================================================
// MAP VALIDATION
// ============================================================

/**
 * Basic validation of a loaded map object.
 */
function isValidMapData(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    if (!Array.isArray(data.rooms) || !Array.isArray(data.connections)) {
        return false;
    }

    // Groups were added after the original map format. Older maps simply
    // load without any groups.
    return true;
}

// ============================================================
// MAP LOADING
// ============================================================

/**
 * Replaces the current map with loaded data and re-renders.
 *
 * A data-only load, such as loading from a URL, has no associated local file.
 */
export function loadMapFromData(
    map,
    data
) {
    const editors =
        document.querySelectorAll(
            ".room-editor, .multi-room-editor, .connection-editor"
        );

    if (!isValidMapData(data)) {
        alert("Invalid Roombound map file.");
        return;
    }

    // Replace the data in place.
    map.rooms.length = 0;
    map.groups.length = 0;
    map.connections.length = 0;

    data.rooms.forEach(room => map.rooms.push(room));

    // Older maps do not contain groups.
    if (Array.isArray(data.groups)) {
        data.groups.forEach(group => map.groups.push(group));
    }

    data.connections.forEach(conn => map.connections.push(conn));

    // Restore the shared room-editor size, or use the default for older maps.
    map.editorSize = data.editorSize
        ? { ...data.editorSize }
        : { width: 400, height: 500 };

    // Close any open editors before displaying the newly loaded map.
    editors.forEach(el => el.remove());

    // Re-render.
    renderMap();

    console.log("Map loaded", map);
}


// ============================================================
// LOAD FROM URL
// ============================================================

export async function validateMapUrl(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `The server returned ${response.status} ${response.statusText}.`
        );
    }

    const data = await response.json();

    if (!isValidMapData(data)) {
        throw new Error("Invalid Roombound map file.");
    }

    return data;
}

/**
 * Loads a map JSON object from a URL.
 *
 * URL-loaded maps intentionally have no associated local file, so Save will
 * use Save As behavior.
 */
export async function loadMapFromUrl(
    map,
    url
) {
    const data =
        await validateMapUrl(url);

    currentFileHandle = null;

    loadMapFromData(
        map,
        data
    );
}


// ============================================================
// LOAD FROM FILE
// ============================================================

/**
 * Opens a file picker and loads a JSON map.
 *
 * The File System Access API is used when available so the selected file can
 * become the map's associated file for future Save operations.
 *
 * Returns true when a map was successfully loaded and false when loading was
 * cancelled or failed.
 */
export async function loadMap(
    map
) {
    if (window.showOpenFilePicker) {
        try {
            const [fileHandle] =
                await window.showOpenFilePicker({
                    startIn: "documents",
                    types: [
                        {
                            description: "Roombound Map",
                            accept: {
                                "application/json": [".json"]
                            }
                        }
                    ],
                    multiple: false
                });

            const file =
                await fileHandle.getFile();

            const text =
                await file.text();

            const data =
                JSON.parse(text);

            if (!isValidMapData(data)) {
                alert("Invalid Roombound map file.");
                return false;
            }

            currentFileHandle = fileHandle;

            loadMapFromData(
                map,
                data
            );

            console.log(
                `Map loaded from ${fileHandle.name}`
            );

            return true;
        } catch (error) {
            // Cancelling the picker is normal.
            if (error.name === "AbortError") {
                return false;
            }

            alert(
                "Could not read the map file.\n" +
                error.message
            );

            return false;
        }
    }

    // Fallback for browsers without the File System Access API.
    return new Promise(
        (resolve) => {
            const input = document.createElement("input");

            input.type = "file";
            input.accept = ".json,application/json";

            input.addEventListener(
                "change",
                (event) => {
                    const file =
                        event.target.files[0];

                    if (!file) {
                        resolve(false);
                        return;
                    }

                    const reader =
                        new FileReader();

                    reader.onload =
                        (event) => {
                            try {
                                const data =
                                    JSON.parse(event.target.result);

                                if (!isValidMapData(data)) {
                                    alert("Invalid Roombound map file.");
                                    resolve(false);
                                    return;
                                }

                                // The selected file cannot be associated with
                                // the map without File System Access API support.
                                currentFileHandle = null;

                                loadMapFromData(
                                    map,
                                    data
                                );

                                resolve(true);
                            } catch (error) {
                                alert(
                                    "Could not read the map file.\n" +
                                    error.message
                                );

                                resolve(false);
                            }
                        };

                    reader.onerror =
                        () => {
                            alert(
                                "Could not read the map file."
                            );

                            resolve(false);
                        };

                    reader.readAsText(file);
                }
            );

            input.click();
        }
    );
}