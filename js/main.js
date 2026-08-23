// ============================================================
// IMPORTS
// ============================================================

import {
    getSelectedRoom
} from "./roomEditor.js";

// Room creation context.
// CURRENT: openNewRoomContext()
// If working on the new-room creation UI or its temporary room state,
// inspect:
//   ./newRoomContext.js
import {
    openNewRoomContext
} from "./newRoomContext.js";

// Map file saving and loading.
// CURRENT: saveMap(), loadMap(), loadMapFromUrl(), loadMapFromData()
// If working on the Roombound JSON file format or file persistence, inspect:
//   ./mapStorage.js
import {
    saveMap,
    loadMap,
    loadMapFromUrl
} from "./mapStorage.js";

// Map zoom controls.
// CURRENT: initializeMapZoom(), requestZoom(), getZoomStep()
// If working on the zoom rail, zoom buttons, or zoom behavior, inspect:
//   ./mapZoom.js
import {
    initializeMapZoom,
    requestZoom,
    getZoomStep
} from "./mapZoom.js";

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
} from "./mapUtils.js";

// Floor selection and floor navigation.
// CURRENT: initializeFloorControl()
// If working on floor selection, floor navigation, or the floor dropdown,
// inspect:
//   ./floorControl.js
import {
    initializeFloorControl
} from "./floorControl.js";

// Application menu and map loading dialogs.
// CURRENT: initializeMapMenu()
// If working on the hamburger menu, New Map workflow, or Load-from-URL UI,
// inspect:
//   ./mapMenu.js
import {
    initializeMapMenu
} from "./mapMenu.js";

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
    renderRooms
} from "./roomRenderer.js";

// Connection rendering and connection geometry.
// CURRENT: renderConnections()
// INTERNAL: analyzeConnections(), getConnectionPoints(), getConnectionPoint()
// If working on how connections are drawn, positioned, spaced along room
// sides, or represented as SVG, inspect:
//   ./connectionRenderer.js
import { renderConnections } from "./connectionRenderer.js";

// Map interaction and mouse behavior.
// CURRENT: initializeMapInteractions()
// If working on map clicks, connection hit detection, zoom interaction,
// or right-click panning, inspect:
//   ./mapInteraction.js
import {
    initializeMapInteractions
} from "./mapInteraction.js";

// Connection creation and editing.
// CURRENT: createConnection()
// FUTURE: Connection editing, destination selection, connection properties,
//         and the Edit Connections UI will be handled here.
// If working on creating or editing connections from the map UI, inspect:
//   ./connectionEditor.js
import { createConnection, openConnectionEditorForConnections } from "./connectionEditor.js";


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

// ============================================================
// INITIAL DOM CONFIGURATION
// ============================================================

mapWorld.classList.add("map-world");

mapWorld.style.width = `${MAP_SIZE}px`;
mapWorld.style.height = `${MAP_SIZE}px`;


// ============================================================
// ZOOM CONTROLS
// ============================================================

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

    console.log("Zoom Level:", mapView.zoom);
}

initializeMapZoom({
    mapElement,
    mapView,
    updateZoom
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
        openNewRoomContext(
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
            alert(
                "Please select a room before creating a new connection."
            );
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
// FLOOR CONTROL INITIALIZATION
// ============================================================

// Connect the floor-selection UI to the application's map state.
initializeFloorControl({
    map,
    mapView,
    updateZoom
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
// MAP MENU INITIALIZATION
// ============================================================

// Connect the menu UI to the application's map operations.
initializeMapMenu({
    saveMap: () => saveMap(map),
    loadMap: () => loadMap(map, updateZoom),
    loadMapFromUrl: (url) =>
        loadMapFromUrl(map, url, updateZoom),
    hasMapContent: () =>
        map.rooms.length > 0 ||
        map.connections.length > 0
});

// ============================================================
// MAP INTERACTION INITIALIZATION
// ============================================================

// Connect map mouse interaction to the current application state.
initializeMapInteractions({
    map,
    mapElement,
    mapWorld,
    mapView,
    changeZoom: (newZoom) =>
        requestZoom(
            mapElement,
            mapView,
            updateZoom,
            newZoom
        ),
    zoomStep: getZoomStep(),
    openConnectionEditorForConnections,
    openNewRoomContext,
    createConnection
});

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