// ============================================================
// IMPORTS
// ============================================================

// Default map data used when Roombound loads.
import defaultMap from "./defaultMap.js";

// Shared map/grid utilities.
// CURRENT: GRID_SIZE, MAP_SIZE, MAP_ORIGIN, gridToPixels(), pixelsToGrid(),
//          gridToWorldPixels(), getRoom()
// If working on map dimensions, grid spacing, coordinate conversion, or
// looking up rooms by ID, inspect:
//   ./mapUtils.js
import {
    GRID_SIZE,
    MAP_SIZE,
    MAP_ORIGIN,
    gridToPixels,
    pixelsToGrid
} from "./mapUtils.js";

// Room rendering, room interaction, and room editing.
// CURRENT: renderRooms(), startDragging(), createRoom(), deleteRoom(),
//          getSelectedRoom()
// INTERNAL: selectRoom(), getRoomHoverInfo(), saveRoomEditor(),
//           cancelRoomEditor(), closeRoomEditor(), updateRoomEditor(),
//           startEditorDragging()
// If working on room rendering, creation, deletion, selection, dragging,
// tooltips, or the room editor, inspect:
//   ./roomRenderer.js
import {
    renderRooms,
    startDragging,
    createRoom,
    getSelectedRoom
} from "./roomRenderer.js";

// Connection rendering and connection geometry.
// CURRENT: renderConnections()
// INTERNAL: analyzeConnections(), getConnectionPoints(), getConnectionPoint()
// If working on how connections are drawn, positioned, spaced along room
// sides, or represented as SVG, inspect:
//   ./connectionRenderer.js
import { renderConnections } from "./connectionRenderer.js";

// Connection creation and editing.
// CURRENT: createConnection()
// FUTURE: Connection editing, destination selection, connection properties,
//         and the Edit Connections UI will be handled here.
// If working on creating or editing connections from the map UI, inspect:
//   ./connectionEditor.js
import { createConnection } from "./connectionEditor.js";


// ============================================================
// MAP / VIEW CONFIGURATION
// ============================================================

// SVG layer used to draw connections above the map world.
const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

// Zoom limits and the amount each Ctrl+mouse-wheel action changes the zoom.
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

// Current map zoom level.
let zoom = 1;

// Temporary state used while right-click panning the map.
let isPanning = false;
let panStartX;
let panStartY;
let scrollStartX;
let scrollStartY;
let currentFloor = 1;


// ============================================================
// FLOOR HELPERS
// ============================================================

/**
 * Returns an array of floor numbers that should appear in the dropdown.
 * Includes every floor that currently has rooms, plus one floor below
 * the lowest and one floor above the highest.
 */
function getFloorOptions(map) {
    if (map.rooms.length === 0) {
        return [0, 1, 2]; // sensible defaults when the map is empty
    }

    const floors = map.rooms.map(r => r.floor);
    const min = Math.min(...floors);
    const max = Math.max(...floors);

    const options = [];
    for (let f = min - 1; f <= max + 1; f++) {
        options.push(f);
    }

    return options;
}

/**
 * Returns how many rooms are on a given floor.
 */
function getRoomCountOnFloor(map, floor) {
    return map.rooms.filter(r => r.floor === floor).length;
}


// ============================================================
// MAP STATE / DOM ELEMENTS
// ============================================================

// The map data currently being displayed and edited.
const map = defaultMap;

// The scrollable map viewport.
const mapElement = document.getElementById("map");

// The world container holds the map grid, rooms, and connection layer.
const mapWorld = document.createElement("div");
mapWorld.classList.add("map-world");

mapWorld.style.width = `${MAP_SIZE}px`;
mapWorld.style.height = `${MAP_SIZE}px`;


// ============================================================
// ZOOM
// ============================================================

// Changes the current zoom level while keeping the point at the center of
// the viewport in the same place on the map.
function changeZoom(newZoom) {
    const oldZoom = zoom;

    zoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, newZoom)
    );

    if (zoom === oldZoom) {
        updateZoomControl();
        return;
    }

    // Find the point currently at the center of the visible map.
    const centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;

    const centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;

    // Convert the viewport center from the old zoomed coordinate space back
    // into world coordinates so it can be preserved after the zoom changes.
    const worldX =
        centerX / oldZoom;

    const worldY =
        centerY / oldZoom;

    updateZoom();

    // Restore the same world position to the center of the viewport.
    mapElement.scrollLeft =
        worldX * zoom -
        mapElement.clientWidth / 2;

    mapElement.scrollTop =
        worldY * zoom -
        mapElement.clientHeight / 2;
}

// Updates the map world's dimensions and redraws rooms/connections for the
// current zoom level.
function updateZoom() {
    // Room elements contain zoom-dependent positioning, so remove the current
    // rendered rooms before drawing them again at the new scale.
    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

    mapWorld.style.width =
        `${MAP_SIZE * zoom}px`;

    mapWorld.style.height =
        `${MAP_SIZE * zoom}px`;

    // Scale the CSS grid along with the map.
    mapWorld.style.setProperty(
        "--grid-size",
        `${GRID_SIZE * zoom}px`
    );

    // Redraw both rooms and connections using the new zoom level.
    renderRooms(
        map,
        mapWorld,
        connectionLayer,
        zoom,
        currentFloor
    );

    renderConnections(
        map,
        connectionLayer,
        zoom,
        currentFloor
    );

    updateZoomControl();

    console.log("Zoom Level:", zoom);
}


// ============================================================
// ZOOM CONTROL
// ============================================================

// The zoom control is a vertical rail fixed to the right side of the screen.
const zoomControl = document.createElement("div");
zoomControl.classList.add("zoom-control");
zoomControl.setAttribute("aria-label", "Map zoom controls");

// Button used to increase the map zoom.
const zoomInButton = document.createElement("button");
zoomInButton.classList.add("zoom-button");
zoomInButton.textContent = "+";
zoomInButton.setAttribute("aria-label", "Zoom in");

// Track representing the available zoom range.
const zoomTrack = document.createElement("div");
zoomTrack.classList.add("zoom-track");

// Container for the clickable zoom level marks.
const zoomMarks = document.createElement("div");
zoomMarks.classList.add("zoom-marks");

// Movable handle representing the current zoom level.
const zoomHandle = document.createElement("button");
zoomHandle.classList.add("zoom-handle");
zoomHandle.setAttribute("aria-label", "Current zoom level");

// Button used to decrease the map zoom.
const zoomOutButton = document.createElement("button");
zoomOutButton.classList.add("zoom-button");
zoomOutButton.textContent = "−";
zoomOutButton.setAttribute("aria-label", "Zoom out");

zoomTrack.appendChild(zoomMarks);
zoomTrack.appendChild(zoomHandle);

zoomControl.appendChild(zoomInButton);
zoomControl.appendChild(zoomTrack);
zoomControl.appendChild(zoomOutButton);

document.body.appendChild(zoomControl);

/**
 * Returns the zoom percentage represented by a zoom value.
 */
function getZoomPercent(zoomValue) {
    return Math.round(zoomValue * 100);
}

/**
 * Creates the clickable marks for every available zoom step.
 */
function createZoomMarks() {
    zoomMarks.innerHTML = "";

    const zoomRange = MAX_ZOOM - MIN_ZOOM;

    for (
        let markZoom = MIN_ZOOM;
        markZoom <= MAX_ZOOM;
        markZoom += ZOOM_STEP
    ) {
        const mark = document.createElement("button");
        mark.classList.add("zoom-mark");

        const progress =
            (markZoom - MIN_ZOOM) / zoomRange;

        mark.style.bottom = `${progress * 100}%`;

        const percentage = getZoomPercent(markZoom);

        mark.title = `${percentage}%`;
        mark.setAttribute(
            "aria-label",
            `Set zoom to ${percentage}%`
        );

        mark.addEventListener("click", (event) => {
            event.stopPropagation();
            changeZoom(markZoom);
        });

        zoomMarks.appendChild(mark);
    }
}

/**
 * Updates the zoom handle position and tooltip to match the current zoom.
 */
function updateZoomControl() {
    const zoomRange = MAX_ZOOM - MIN_ZOOM;
    const zoomProgress = (zoom - MIN_ZOOM) / zoomRange;
    const percentage = getZoomPercent(zoom);

    // 0% progress is the minimum zoom at the bottom of the rail.
    // 100% progress is the maximum zoom at the top.
    zoomHandle.style.bottom = `${zoomProgress * 100}%`;
    zoomHandle.title = `${percentage}%`;
    zoomHandle.setAttribute(
        "aria-label",
        `Current zoom level: ${percentage}%`
    );
}

// Build the zoom marks once from the current zoom configuration.
createZoomMarks();

// Zoom button events.
zoomInButton.addEventListener("click", () => {
    changeZoom(zoom + ZOOM_STEP);
});

zoomOutButton.addEventListener("click", () => {
    changeZoom(zoom - ZOOM_STEP);
});

// Clicking the rail changes zoom to the nearest available zoom level.
zoomTrack.addEventListener("click", (event) => {
    if (
        event.target === zoomHandle ||
        event.target.classList.contains("zoom-mark")
    ) {
        return;
    }

    const trackRect = zoomTrack.getBoundingClientRect();
    const clickPosition =
        trackRect.bottom - event.clientY;

    const usableHeight = trackRect.height;
    const progress =
        Math.max(0, Math.min(1, clickPosition / usableHeight));

    const rawZoom =
        MIN_ZOOM +
        progress * (MAX_ZOOM - MIN_ZOOM);

    const steppedZoom =
        Math.round(rawZoom / ZOOM_STEP) * ZOOM_STEP;

    changeZoom(steppedZoom);
});

// Dragging the zoom handle changes the zoom level.
let isDraggingZoom = false;

zoomHandle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    isDraggingZoom = true;
});

document.addEventListener("mousemove", (event) => {
    if (!isDraggingZoom) {
        return;
    }

    const trackRect = zoomTrack.getBoundingClientRect();
    const positionFromBottom =
        trackRect.bottom - event.clientY;

    const usableHeight = trackRect.height;
    const progress =
        Math.max(0, Math.min(1, positionFromBottom / usableHeight));

    const rawZoom =
        MIN_ZOOM +
        progress * (MAX_ZOOM - MIN_ZOOM);

    const steppedZoom =
        Math.round(rawZoom / ZOOM_STEP) * ZOOM_STEP;

    changeZoom(steppedZoom);
});

document.addEventListener("mouseup", () => {
    isDraggingZoom = false;
});


// ============================================================
// MAP WORLD INITIALIZATION
// ============================================================

// Add the world container to the scrollable map viewport.
mapElement.appendChild(mapWorld);


// ============================================================
// MAP TOOLS
// ============================================================

// The toolbar displayed in the bottom-right corner of the map.
const mapTools = document.createElement("div");
mapTools.classList.add("map-tools");

// Button used to begin creating a new connection.
const newConnectionButton = document.createElement("button");
newConnectionButton.classList.add("map-tool-button");
newConnectionButton.textContent = "→+";
newConnectionButton.setAttribute("aria-label", "New Connection");

// Button used to begin creating a new room.
const newRoomButton = document.createElement("button");
newRoomButton.classList.add("map-tool-button");
newRoomButton.textContent = "+";
newRoomButton.setAttribute("aria-label", "New Room");


// ============================================================
// MAP TOOL EVENTS
// ============================================================

// Start room creation when the New Room button is clicked.
newRoomButton.addEventListener(
    "click",
    () => {
        createRoom(
            map,
            mapElement,
            connectionLayer,
            zoom,
            currentFloor
        );
    }
);

// Start connection creation from the currently selected room when the
// New Connection button is clicked.
newConnectionButton.addEventListener(
    "click",
    () => {
        const room = getSelectedRoom();

        // A connection cannot be started without a source room.
        if (!room) {
            return;
        }

        createConnection(
            map,
            room,
            connectionLayer,
            zoom,
            currentFloor
        );
    }
);


// ============================================================
// MAP TOOL TOOLTIPS
// ============================================================

// Tooltip displayed when hovering over the New Room button.
const newRoomTooltip =
    document.createElement("div");

newRoomTooltip.classList.add("map-tool-tooltip");
newRoomTooltip.textContent = "New Room";

newRoomButton.appendChild(newRoomTooltip);

// Tooltip displayed when hovering over the New Connection button.
const newConnectionTooltip = document.createElement("div");

newConnectionTooltip.classList.add("map-tool-tooltip");
newConnectionTooltip.textContent = "New Connection";
newConnectionButton.appendChild(newConnectionTooltip);

// Save button
const saveButton = document.createElement("button");
saveButton.classList.add("map-tool-button");
saveButton.textContent = "↓";
saveButton.setAttribute("aria-label", "Save Map");
saveButton.addEventListener("click", saveMap);

// Load button
const loadButton = document.createElement("button");
loadButton.classList.add("map-tool-button");
loadButton.textContent = "↑";
loadButton.setAttribute("aria-label", "Load Map");
loadButton.addEventListener("click", loadMap);

// Tooltips
const saveTooltip = document.createElement("div");
saveTooltip.classList.add("map-tool-tooltip");
saveTooltip.textContent = "Save Map";
saveButton.appendChild(saveTooltip);

const loadTooltip = document.createElement("div");
loadTooltip.classList.add("map-tool-tooltip");
loadTooltip.textContent = "Load Map";
loadButton.appendChild(loadTooltip);

// Add them to the toolbar (order is up to you)
mapTools.appendChild(saveButton);
mapTools.appendChild(loadButton);


// Add the map tool buttons to the toolbar and add the toolbar to the page.
mapTools.appendChild(newConnectionButton);
mapTools.appendChild(newRoomButton);

document.body.appendChild(mapTools);


// ============================================================
// FLOOR CONTROL (top-right)
// ============================================================

const floorControl = document.createElement("div");
floorControl.classList.add("floor-control");

// Up button
const floorUpButton = document.createElement("button");
floorUpButton.classList.add("floor-button");
floorUpButton.textContent = "↑";
floorUpButton.setAttribute("aria-label", "Go up one floor");

// Current floor display (clickable)
const floorDisplay = document.createElement("button");
floorDisplay.classList.add("floor-display");
floorDisplay.textContent = `Floor ${currentFloor}`;
floorDisplay.setAttribute("aria-label", "Select floor");

// Down button
const floorDownButton = document.createElement("button");
floorDownButton.classList.add("floor-button");
floorDownButton.textContent = "↓";
floorDownButton.setAttribute("aria-label", "Go down one floor");

// Dropdown (hidden by default)
const floorDropdown = document.createElement("div");
floorDropdown.classList.add("floor-dropdown");
floorDropdown.style.display = "none";

floorControl.appendChild(floorUpButton);
floorControl.appendChild(floorDisplay);
floorControl.appendChild(floorDownButton);
floorControl.appendChild(floorDropdown);

document.body.appendChild(floorControl);


// ----------------------------------------------------------
// Floor change helper
// ----------------------------------------------------------

function setCurrentFloor(newFloor) {
    if (newFloor === currentFloor) {
        return;
    }

    currentFloor = newFloor;
    floorDisplay.textContent = `Floor ${currentFloor}`;

    // Close dropdown if open.
    floorDropdown.style.display = "none";

    // Re-render with the new floor.
    updateZoom();
}


// ----------------------------------------------------------
// Button events
// ----------------------------------------------------------

floorUpButton.addEventListener("click", () => {
    setCurrentFloor(currentFloor + 1);
});

floorDownButton.addEventListener("click", () => {
    setCurrentFloor(currentFloor - 1);
});


// ----------------------------------------------------------
// Dropdown
// ----------------------------------------------------------

floorDisplay.addEventListener("click", (event) => {
    event.stopPropagation();

    // Toggle.
    if (floorDropdown.style.display === "block") {
        floorDropdown.style.display = "none";
        return;
    }

    // Rebuild the list every time it opens.
    floorDropdown.innerHTML = "";

    const options = getFloorOptions(map);

    for (const floor of options) {
        const count = getRoomCountOnFloor(map, floor);

        const item = document.createElement("button");
        item.classList.add("floor-dropdown-item");

        if (floor === currentFloor) {
            item.classList.add("selected");
        }

        item.textContent =
            `Floor ${floor}  (${count} room${count === 1 ? "" : "s"})`;

        item.addEventListener("click", (e) => {
            e.stopPropagation();
            setCurrentFloor(floor);
        });

        floorDropdown.appendChild(item);
    }

    floorDropdown.style.display = "block";
});


// Close dropdown when clicking elsewhere.
document.addEventListener("click", () => {
    floorDropdown.style.display = "none";
});


// ============================================================
// CONNECTION LAYER / MAP GRID
// ============================================================

// Connections are drawn in their own SVG layer so they can be rendered
// independently from the HTML room elements.
connectionLayer.classList.add("connections");
mapWorld.appendChild(connectionLayer);

// Set the initial grid size before the first render.
mapElement.style.setProperty(
    "--grid-size",
    `${GRID_SIZE}px`
);


// ============================================================
// DEBUG INFORMATION
// ============================================================

console.log(
    "Roombound map loaded:",
    map
);

console.log(
    "Map element:",
    mapElement
);


// ============================================================
// MAP EVENT HANDLERS
// ============================================================

// Prevent the browser's default right-click context menu over the map.
// Right-click is used for map panning instead.
mapElement.addEventListener(
    "contextmenu",
    (event) => {
        event.preventDefault();
    }
);

// Clicking empty map space cancels an active room editor.
// Clicking on rooms or other map content is left alone so those elements can
// handle their own click behavior.
mapElement.addEventListener(
    "click",
    (event) => {
        if (event.target !== mapElement && event.target !== mapWorld) {
            return;
        }

        const editor =
            document.querySelector(".room-editor");

        if (!editor) {
            return;
        }

        editor.querySelector(".room-editor-cancel").click();
    }
);

// Ctrl + mouse wheel changes the map zoom.
// Normal mouse-wheel scrolling remains available for navigating the map.
mapElement.addEventListener(
    "wheel",
    (event) => {
        if (!event.ctrlKey) {
            return;
        }

        event.preventDefault();

        if (event.deltaY < 0) {
            changeZoom(zoom + ZOOM_STEP);
        } else {
            changeZoom(zoom - ZOOM_STEP);
        }
    },
    { passive: false }
);


// ============================================================
// MAP PANNING
// ============================================================

// Begin panning when the right mouse button is pressed over the map.
mapElement.addEventListener(
    "mousedown",
    (event) => {
        if (event.button !== 2) {
            return;
        }

        isPanning = true;

        panStartX = event.clientX;
        panStartY = event.clientY;

        scrollStartX = mapElement.scrollLeft;
        scrollStartY = mapElement.scrollTop;
    }
);

// Move the map viewport while right-click panning is active.
document.addEventListener(
    "mousemove",
    (event) => {
        if (!isPanning) {
            return;
        }

        mapElement.scrollLeft =
            scrollStartX - (event.clientX - panStartX);

        mapElement.scrollTop =
            scrollStartY - (event.clientY - panStartY);
    }
);

// Stop panning when the right mouse button is released.
document.addEventListener(
    "mouseup",
    (event) => {
        if (event.button !== 2) {
            return;
        }

        isPanning = false;
    }
);


// ============================================================
// SAVE / LOAD
// ============================================================

const CURRENT_MAP_VERSION = 1;

/**
 * Creates a clean serializable copy of the current map.
 * Strips any temporary UI-only state.
 */
function getSerializableMap() {
    return {
        version: CURRENT_MAP_VERSION,
        app: "Roombound",
        rooms: map.rooms.map(room => ({
            roomID: room.roomID,
            name: room.name,
            floor: room.floor,
            notes: room.notes || "",
            position: { ...room.position },
            size: { ...room.size },
            editorSize: room.editorSize
                ? { ...room.editorSize }
                : { width: 200, height: 300 }
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
function saveMap() {
    const data = getSerializableMap();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
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
function loadMapFromData(data) {
    if (!isValidMapData(data)) {
        alert("Invalid Roombound map file.");
        return;
    }

    // Replace the data in place.
    map.rooms.length = 0;
    map.connections.length = 0;

    data.rooms.forEach(room => map.rooms.push(room));
    data.connections.forEach(conn => map.connections.push(conn));

    // Close any open editors (simple approach for now).
    document.querySelectorAll(
        ".room-editor, .connection-editor"
    ).forEach(el => el.remove());

    // Re-render.
    updateZoom();

    console.log("Map loaded", map);
}

/**
 * Opens a file picker and loads a JSON map.
 */
function loadMap() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                loadMapFromData(data);
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


// ============================================================
// INITIAL MAP RENDER
// ============================================================

// Perform the first render using the default zoom level.
updateZoom();

// Start with the map centered in the viewport.
mapElement.scrollLeft =
    (MAP_SIZE * zoom - mapElement.clientWidth) / 2;

mapElement.scrollTop =
    (MAP_SIZE * zoom - mapElement.clientHeight) / 2;