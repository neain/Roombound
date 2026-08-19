// ============================================================
// IMPORTS
// ============================================================

// Current map file schema version.
const CURRENT_MAP_VERSION = 1;


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
        rooms: map.rooms.map(room => ({
            roomID: room.roomID,
            name: room.name,
            floor: room.floor,
            notes: room.notes || "",
            position: { ...room.position },
            size: { ...room.size }
        })),
        connections: map.connections.map(conn => ({
            roomA: conn.roomA,
            roomB: conn.roomB,
            roomAConnectionSide: conn.roomAConnectionSide,
            roomBConnectionSide: conn.roomBConnectionSide,
            directionTo: conn.directionTo,
            name: conn.name || ""
        }))
    };
}

/**
 * Downloads the current map as a JSON file.
 */
export function saveMap(map) {
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

    // Optional: check version later if we evolve the schema.
    return true;
}

/**
 * Replaces the current map with loaded data and re-renders.
 */
export function loadMapFromData(
    map,
    data,
    updateZoom
) {
    const editors =
        document.querySelectorAll(
            ".room-editor, .connection-editor"
        );

    if (!isValidMapData(data)) {
        alert("Invalid Roombound map file.");
        return;
    }

    // Replace the data in place.
    map.rooms.length = 0;
    map.connections.length = 0;

    data.rooms.forEach(room => map.rooms.push(room));
    data.connections.forEach(conn => map.connections.push(conn));

    // Restore the shared room-editor size, or use the default for older maps.
    map.editorSize = data.editorSize
        ? { ...data.editorSize }
        : { width: 400, height: 500 };

    // Close any open editors (simple approach for now).
    editors.forEach(el => el.remove());

    // Re-render.
    updateZoom();

    console.log("Map loaded", map);
}

/**
 * Loads a map JSON object from a URL.
 */
export async function loadMapFromUrl(
    map,
    url,
    updateZoom
) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `The server returned ${response.status} ${response.statusText}.`
        );
    }

    const data = await response.json();

    loadMapFromData(
        map,
        data,
        updateZoom
    );
}

/**
 * Opens a file picker and loads a JSON map.
 */
export function loadMap(
    map,
    updateZoom
) {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        if (!file) {
            return;
        }

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                loadMapFromData(
                    map,
                    data,
                    updateZoom
                );
            } catch (err) {
                alert(
                    "Could not read the map file.\n" +
                    err.message
                );
            }
        };

        reader.readAsText(file);
    });

    input.click();
}