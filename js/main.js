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
// APPLICATION STATE / DOM ELEMENTS
// ============================================================

// The map data currently being displayed and edited.
const map = defaultMap;

// The scrollable map viewport.
const mapElement = document.getElementById("map");

// The world container holds the map grid, rooms, and connection layer.
const mapWorld = document.createElement("div");

// SVG layer used to draw connections above the map world.
const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

// Current map/view state shared with renderers and editors.
const mapView = {
    map,
    connectionLayer,
    zoom: 1,
    currentFloor: 1
};

// Zoom limits and the amount each Ctrl+mouse-wheel action changes the zoom.
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

// Zoom control is a vertical rail fixed to the right side of the screen.
const zoomControl = document.createElement("div");
const zoomInButton = document.createElement("button");
const zoomTrack = document.createElement("div");
const zoomMarks = document.createElement("div");
const zoomHandle = document.createElement("button");
const zoomOutButton = document.createElement("button");

// The toolbar displayed in the bottom-right corner of the map.
const mapTools = document.createElement("div");

// Button used to begin creating a new connection.
const newConnectionButton = document.createElement("button");

// Button used to begin creating a new room.
const newRoomButton = document.createElement("button");

// Tooltip displayed when hovering over the New Room button.
const newRoomTooltip = document.createElement("div");

// Tooltip displayed when hovering over the New Connection button.
const newConnectionTooltip = document.createElement("div");

// Main container for the application menu.
const menuControl = document.createElement("div");

// Button used to open and close the menu.
const menuButton = document.createElement("button");

// Menu contents.
const menuPanel = document.createElement("div");

// New Map button.
const newMapMenuButton = document.createElement("button");

// Save Map button.
const saveMapMenuButton = document.createElement("button");

// Load Map button.
const loadMapMenuButton = document.createElement("button");

// Load-from-URL submenu.
const loadSubmenu = document.createElement("div");
const loadFromFileMenuButton = document.createElement("button");
const loadFromUrlMenuButton = document.createElement("button");

// Load-from-URL dialog.
const loadUrlOverlay = document.createElement("div");
const loadUrlDialog = document.createElement("div");
const loadUrlTitle = document.createElement("h2");
const loadUrlMessage = document.createElement("p");
const loadUrlInput = document.createElement("input");
const loadUrlButtons = document.createElement("div");
const loadUrlButton = document.createElement("button");
const cancelLoadUrlButton = document.createElement("button");
const loadUrlHelpButton = document.createElement("button");

// Options placeholder.
const optionsMenuButton = document.createElement("button");

// Confirmation overlay used before discarding the current map.
const newMapOverlay = document.createElement("div");

// Confirmation dialog.
const newMapDialog = document.createElement("div");

// Dialog title.
const newMapTitle = document.createElement("h2");

// Dialog message.
const newMapMessage = document.createElement("p");

// Dialog buttons.
const newMapButtons = document.createElement("div");

// Save button.
const saveAndNewButton = document.createElement("button");

// New Without Saving button.
const newWithoutSavingButton = document.createElement("button");

// Cancel button.
const cancelNewMapButton = document.createElement("button");

// Floor control.
const floorControl = document.createElement("div");

// Up button.
const floorUpButton = document.createElement("button");

// Current floor display.
const floorDisplay = document.createElement("button");

// Down button.
const floorDownButton = document.createElement("button");

// Dropdown containing the available floors.
const floorDropdown = document.createElement("div");

// Temporary state used while right-click panning the map.
let isPanning = false;
let panStartX;
let panStartY;
let scrollStartX;
let scrollStartY;

// Tracks whether the zoom handle is currently being dragged.
let isDraggingZoom = false;

// Current map file schema version.
const CURRENT_MAP_VERSION = 1;


// ============================================================
// INITIAL DOM CONFIGURATION
// ============================================================

mapWorld.classList.add("map-world");

mapWorld.style.width = `${MAP_SIZE}px`;
mapWorld.style.height = `${MAP_SIZE}px`;


// ============================================================
// FLOOR HELPERS
// ============================================================

/**
 * Returns an array of floor numbers that should appear in the dropdown.
 * Includes every floor that currently has rooms, plus one floor below
 * the lowest and one floor above the highest.
 */
function getFloorOptions(map) {
    const floors = map.rooms.map(r => r.floor);
    const min = floors.length > 0 ? Math.min(...floors) : 0;
    const max = floors.length > 0 ? Math.max(...floors) : 2;
    const options = [];
    let floor;

    if (map.rooms.length === 0) {
        return [0, 1, 2];
    }

    for (floor = min - 1; floor <= max + 1; floor++) {
        options.push(floor);
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
// ZOOM
// ============================================================

// Changes the current zoom level while keeping the point at the center of
// the viewport in the same place on the map.
function changeZoom(newZoom) {
    const oldZoom = mapView.zoom;
    const centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;
    const centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;
    const worldX = centerX / oldZoom;
    const worldY = centerY / oldZoom;

    mapView.zoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, newZoom)
    );

    if (mapView.zoom === oldZoom) {
        updateZoomControl();
        return;
    }

    // Find the point currently at the center of the visible map.
    // The coordinates were captured above before changing the zoom.

    updateZoom();

    // Restore the same world position to the center of the viewport.
    mapElement.scrollLeft =
        worldX * mapView.zoom -
        mapElement.clientWidth / 2;

    mapElement.scrollTop =
        worldY * mapView.zoom -
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
        `${MAP_SIZE * mapView.zoom}px`;

    mapWorld.style.height =
        `${MAP_SIZE * mapView.zoom}px`;

    // Scale the CSS grid along with the map.
    mapWorld.style.setProperty(
        "--grid-size",
        `${GRID_SIZE * mapView.zoom}px`
    );

    // Redraw both rooms and connections using the new view state.
    renderRooms(
        map,
        mapWorld,
        connectionLayer,
        mapView.zoom,
        mapView.currentFloor
    );

    renderConnections(mapView);

    updateZoomControl();

    console.log("Zoom Level:", mapView.zoom);
}


// ============================================================
// ZOOM CONTROL
// ============================================================

zoomControl.classList.add("zoom-control");
zoomControl.setAttribute("aria-label", "Map zoom controls");

zoomInButton.classList.add("zoom-button");
zoomInButton.textContent = "+";
zoomInButton.setAttribute("aria-label", "Zoom in");

zoomTrack.classList.add("zoom-track");

zoomMarks.classList.add("zoom-marks");

zoomHandle.classList.add("zoom-handle");
zoomHandle.setAttribute("aria-label", "Current zoom level");

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
    const zoomRange = MAX_ZOOM - MIN_ZOOM;
    let markZoom;
    let mark;
    let progress;
    let percentage;

    zoomMarks.innerHTML = "";

    for (
        markZoom = MIN_ZOOM;
        markZoom <= MAX_ZOOM;
        markZoom += ZOOM_STEP
    ) {
        mark = document.createElement("button");
        progress =
            (markZoom - MIN_ZOOM) / zoomRange;
        percentage = getZoomPercent(markZoom);

        mark.classList.add("zoom-mark");

        mark.style.bottom =
            `${progress * 100}%`;

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

// Updates the zoom handle position and tooltip to match the current zoom.
function updateZoomControl() {
    const zoomRange = MAX_ZOOM - MIN_ZOOM;
    const zoomProgress =
        (mapView.zoom - MIN_ZOOM) / zoomRange;
    const percentage =
        getZoomPercent(mapView.zoom);

    // 0% progress is the minimum zoom at the bottom of the rail.
    // 100% progress is the maximum zoom at the top.
    zoomHandle.style.bottom =
        `${zoomProgress * 100}%`;

    zoomHandle.title =
        `${percentage}%`;

    zoomHandle.setAttribute(
        "aria-label",
        `Current zoom level: ${percentage}%`
    );
}

// Build the zoom marks once from the current zoom configuration.
createZoomMarks();

// Zoom button events.
zoomInButton.addEventListener("click", () => {
    changeZoom(mapView.zoom + ZOOM_STEP);
});

zoomOutButton.addEventListener("click", () => {
    changeZoom(mapView.zoom - ZOOM_STEP);
});

// Clicking the rail changes zoom to the nearest available zoom level.
zoomTrack.addEventListener("click", (event) => {
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

    if (
        event.target === zoomHandle ||
        event.target.classList.contains("zoom-mark")
    ) {
        return;
    }

    changeZoom(steppedZoom);
});

// Dragging the zoom handle changes the zoom level.
zoomHandle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    isDraggingZoom = true;
});

document.addEventListener("mousemove", (event) => {
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

    if (!isDraggingZoom) {
        return;
    }

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

mapTools.classList.add("map-tools");

newConnectionButton.classList.add("map-tool-button");
newConnectionButton.textContent = "→+";
newConnectionButton.setAttribute("aria-label", "New Connection");

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
            mapView.zoom,
            mapView.currentFloor
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
            mapView,
            room
        );
    }
);


// ============================================================
// MAP TOOL TOOLTIPS
// ============================================================

newRoomTooltip.classList.add("map-tool-tooltip");
newRoomTooltip.textContent = "New Room";

newRoomButton.appendChild(newRoomTooltip);

newConnectionTooltip.classList.add("map-tool-tooltip");
newConnectionTooltip.textContent = "New Connection";

newConnectionButton.appendChild(newConnectionTooltip);


// Add the map tool buttons to the toolbar and add the toolbar to the page.
mapTools.appendChild(newConnectionButton);
mapTools.appendChild(newRoomButton);

document.body.appendChild(mapTools);


// ============================================================
// HAMBURGER MENU
// ============================================================

menuControl.classList.add("menu-control");

menuButton.classList.add("menu-button");
menuButton.textContent = "☰";
menuButton.setAttribute("aria-label", "Open menu");
menuButton.setAttribute("aria-expanded", "false");

menuPanel.classList.add("menu-panel");
menuPanel.style.display = "none";

newMapMenuButton.classList.add("menu-item");
newMapMenuButton.textContent = "New Map";

saveMapMenuButton.classList.add("menu-item");
saveMapMenuButton.textContent = "Save Map";

loadMapMenuButton.classList.add("menu-item");
loadMapMenuButton.textContent = "Load Map";

optionsMenuButton.classList.add("menu-item");
optionsMenuButton.classList.add("menu-item-disabled");
optionsMenuButton.textContent = "Options";
optionsMenuButton.disabled = true;

menuPanel.appendChild(newMapMenuButton);
menuPanel.appendChild(saveMapMenuButton);

loadMapMenuButton.classList.add("menu-item-with-submenu");
loadMapMenuButton.textContent = "Load Map";

loadSubmenu.classList.add("load-submenu");

loadFromFileMenuButton.classList.add("menu-item");
loadFromFileMenuButton.textContent = "Load from File";

loadFromUrlMenuButton.classList.add("menu-item");
loadFromUrlMenuButton.textContent = "Load from URL";

loadSubmenu.appendChild(loadFromFileMenuButton);
loadSubmenu.appendChild(loadFromUrlMenuButton);

loadMapMenuButton.appendChild(loadSubmenu);
menuPanel.appendChild(loadMapMenuButton);

menuPanel.appendChild(optionsMenuButton);

menuControl.appendChild(menuButton);
menuControl.appendChild(menuPanel);

document.body.appendChild(menuControl);


// ----------------------------------------------------------
// Menu visibility
// ----------------------------------------------------------

function closeMenu() {
    menuPanel.style.display = "none";
    menuButton.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
    const isOpen = menuPanel.style.display === "block";

    if (isOpen) {
        closeMenu();
        return;
    }

    menuPanel.style.display = "block";
    menuButton.setAttribute("aria-expanded", "true");
}

menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
});

menuPanel.addEventListener("click", (event) => {
    event.stopPropagation();
});


// ----------------------------------------------------------
// Save / Load menu events
// ----------------------------------------------------------

saveMapMenuButton.addEventListener("click", () => {
    closeMenu();
    saveMap();
});

loadFromFileMenuButton.addEventListener("click", () => {
    closeMenu();
    loadMap();
});

loadFromUrlMenuButton.addEventListener("click", () => {
    closeMenu();
    openLoadUrlDialog();
});

// ============================================================
// NEW MAP CONFIRMATION
// ============================================================

newMapOverlay.classList.add("new-map-overlay");
newMapOverlay.style.display = "none";

newMapDialog.classList.add("new-map-dialog");

newMapTitle.textContent = "Create New Map?";

newMapMessage.textContent =
    "Your current map will be discarded.";

newMapButtons.classList.add("new-map-buttons");

saveAndNewButton.classList.add("new-map-save");
saveAndNewButton.textContent = "Save";

newWithoutSavingButton.classList.add("new-map-discard");
newWithoutSavingButton.textContent = "Don't Save";

cancelNewMapButton.classList.add("new-map-cancel");
cancelNewMapButton.textContent = "Cancel";

newMapButtons.appendChild(saveAndNewButton);
newMapButtons.appendChild(newWithoutSavingButton);
newMapButtons.appendChild(cancelNewMapButton);

newMapDialog.appendChild(newMapTitle);
newMapDialog.appendChild(newMapMessage);
newMapDialog.appendChild(newMapButtons);

newMapOverlay.appendChild(newMapDialog);

document.body.appendChild(newMapOverlay);


// ----------------------------------------------------------
// New Map helpers
// ----------------------------------------------------------

function closeNewMapDialog() {
    newMapOverlay.style.display = "none";
}

function refreshForNewMap() {
    window.location.reload();
}

function openNewMapDialog() {
    closeMenu();

    if (
        map.rooms.length === 0 &&
        map.connections.length === 0
    ) {
        refreshForNewMap();
        return;
    }

    newMapOverlay.style.display = "flex";
}


// ----------------------------------------------------------
// New Map events
// ----------------------------------------------------------

newMapMenuButton.addEventListener(
    "click",
    openNewMapDialog
);

saveAndNewButton.addEventListener(
    "click",
    () => {
        saveMap();

        // Give the browser a moment to begin the file download before
        // refreshing the page.
        setTimeout(() => {
            refreshForNewMap();
        }, 100);
    }
);

newWithoutSavingButton.addEventListener(
    "click",
    refreshForNewMap
);

cancelNewMapButton.addEventListener(
    "click",
    closeNewMapDialog
);

// Clicking the dark overlay outside the dialog cancels the operation.
newMapOverlay.addEventListener(
    "click",
    (event) => {
        if (event.target !== newMapOverlay) {
            return;
        }

        closeNewMapDialog();
    }
);

// ============================================================
// LOAD FROM URL DIALOG
// ============================================================

loadUrlOverlay.classList.add("load-url-overlay");
loadUrlOverlay.style.display = "none";

loadUrlDialog.classList.add("load-url-dialog");

loadUrlTitle.textContent = "Load Map from URL";

loadUrlMessage.textContent =
    "Enter the web address of a Roombound map JSON file.";

loadUrlInput.type = "url";
loadUrlInput.placeholder =
    "https://example.com/roombound-map.json";
loadUrlInput.setAttribute(
    "aria-label",
    "Map URL"
);

loadUrlButtons.classList.add("load-url-buttons");

loadUrlButton.classList.add("load-url-load");
loadUrlButton.textContent = "Load";

cancelLoadUrlButton.classList.add("load-url-cancel");
cancelLoadUrlButton.textContent = "Cancel";

loadUrlHelpButton.classList.add("load-url-help");
loadUrlHelpButton.textContent = "Help";

loadUrlButtons.appendChild(loadUrlButton);
loadUrlButtons.appendChild(cancelLoadUrlButton);
loadUrlButtons.appendChild(loadUrlHelpButton);

loadUrlDialog.appendChild(loadUrlTitle);
loadUrlDialog.appendChild(loadUrlMessage);
loadUrlDialog.appendChild(loadUrlInput);
loadUrlDialog.appendChild(loadUrlButtons);

loadUrlOverlay.appendChild(loadUrlDialog);

document.body.appendChild(loadUrlOverlay);


// ----------------------------------------------------------
// Load from URL helpers
// ----------------------------------------------------------

function closeLoadUrlDialog() {
    loadUrlOverlay.style.display = "none";
}

function openLoadUrlDialog() {
    loadUrlInput.value = "";
    loadUrlOverlay.style.display = "flex";
    loadUrlInput.focus();
}

async function loadMapFromUrl() {
    const url = loadUrlInput.value.trim();

    if (!url) {
        alert("Please enter a map URL.");
        return;
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `The server returned ${response.status} ${response.statusText}.`
            );
        }

        const data = await response.json();

        loadMapFromData(data);
        closeLoadUrlDialog();
    } catch (error) {
        alert(
            "Could not load the map from that URL.\n\n" +
            error.message
        );
    }
}


// ----------------------------------------------------------
// Load from URL events
// ----------------------------------------------------------

loadUrlButton.addEventListener(
    "click",
    loadMapFromUrl
);

cancelLoadUrlButton.addEventListener(
    "click",
    closeLoadUrlDialog
);

loadUrlHelpButton.addEventListener(
    "click",
    () => {
        window.open(
            "load-url-tutorial.html",
            "_blank",
            "noopener"
        );
    }
);

loadUrlInput.addEventListener(
    "keydown",
    (event) => {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        loadMapFromUrl();
    }
);

loadUrlOverlay.addEventListener(
    "click",
    (event) => {
        if (event.target !== loadUrlOverlay) {
            return;
        }

        closeLoadUrlDialog();
    }
);

// ============================================================
// FLOOR CONTROL (top-right)
// ============================================================

floorControl.classList.add("floor-control");

floorUpButton.classList.add("floor-button");
floorUpButton.textContent = "↑";
floorUpButton.setAttribute("aria-label", "Go up one floor");

floorDisplay.classList.add("floor-display");
floorDisplay.textContent = `Floor ${mapView.currentFloor}`;
floorDisplay.setAttribute("aria-label", "Select floor");

floorDownButton.classList.add("floor-button");
floorDownButton.textContent = "↓";
floorDownButton.setAttribute("aria-label", "Go down one floor");

floorDropdown.classList.add("floor-dropdown");
floorDropdown.style.display = "none";

floorControl.appendChild(floorDownButton);
floorControl.appendChild(floorDisplay);
floorControl.appendChild(floorUpButton);
floorControl.appendChild(floorDropdown);

document.body.appendChild(floorControl);


// Changes the currently displayed floor.
function setCurrentFloor(newFloor) {
    if (newFloor === mapView.currentFloor) {
        return;
    }

    mapView.currentFloor = newFloor;
    floorDisplay.textContent =
        `Floor ${mapView.currentFloor}`;

    // Close dropdown if open.
    floorDropdown.style.display = "none";

    // Re-render with the new floor.
    updateZoom();
}


// ----------------------------------------------------------
// Button events
// ----------------------------------------------------------

floorUpButton.addEventListener("click", () => {
    setCurrentFloor(mapView.currentFloor + 1);
});

floorDownButton.addEventListener("click", () => {
    setCurrentFloor(mapView.currentFloor - 1);
});


// ----------------------------------------------------------
// Dropdown
// ----------------------------------------------------------

floorDisplay.addEventListener("click", (event) => {
    const options = getFloorOptions(map);
    let count;
    let item;

    event.stopPropagation();

    // Toggle.
    if (floorDropdown.style.display === "block") {
        floorDropdown.style.display = "none";
        return;
    }

    // Rebuild the list every time it opens.
    floorDropdown.innerHTML = "";

    for (const floor of options) {
        count = getRoomCountOnFloor(map, floor);
        item = document.createElement("button");

        item.classList.add("floor-dropdown-item");

        if (floor === mapView.currentFloor) {
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
        const editor =
            document.querySelector(".room-editor");

        if (event.target !== mapElement && event.target !== mapWorld) {
            return;
        }

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
            changeZoom(mapView.zoom + ZOOM_STEP);
        } else {
            changeZoom(mapView.zoom - ZOOM_STEP);
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

/**
 * Creates a clean serializable copy of the current map.
 * Strips any temporary UI-only state.
 */
function getSerializableMap() {
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
function saveMap() {
    const data = getSerializableMap();
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
function loadMapFromData(data) {
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
 * Opens a file picker and loads a JSON map.
 */
function loadMap() {
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
    (MAP_SIZE * mapView.zoom - mapElement.clientWidth) / 2;

mapElement.scrollTop =
    (MAP_SIZE * mapView.zoom - mapElement.clientHeight) / 2;