// ============================================================
// ROOMBOUND MAP RENDERER
// ============================================================
//
// Owns the complete visual redraw of the map.
//
// The renderer is initialized once by main.js. Other modules can import
// renderMap() directly rather than receiving it as a callback dependency.
//


// ============================================================
// IMPORTS
// ============================================================

import {
    GRID_SIZE,
    MAP_SIZE
} from "./mapUtils.js";

import {
    renderRooms
} from "./roomRenderer.js";

import {
    renderConnections
} from "./connectionRenderer.js";


// ============================================================
// RENDERER STATE
// ============================================================

let map;
let mapElement;
let mapWorld;
let connectionLayer;
let mapView;

// Returns the map-world container used by the renderer.
export function getMapWorld() {
    return mapWorld;
}

// ============================================================
// MAP RENDERER INITIALIZATION
// ============================================================
/**
 * Initializes the map renderer with the application's rendering state.
 */
export function initializeMapRenderer({
    map: applicationMap,
    mapElement: applicationMapElement,
    connectionLayer: applicationConnectionLayer,
    mapView: applicationMapView
}) {
    map = applicationMap;
    mapElement = applicationMapElement;
    connectionLayer = applicationConnectionLayer;
    mapView = applicationMapView;

    mapWorld = document.createElement("div");
    mapWorld.classList.add("map-world");

    mapWorld.style.width =
        `${MAP_SIZE}px`;

    mapWorld.style.height =
        `${MAP_SIZE}px`;

    mapWorld.appendChild(connectionLayer);
    mapElement.appendChild(mapWorld);
}


// ============================================================
// MAP RENDERING
// ============================================================

/**
 * Redraws the complete visible map using the current map/view state.
 */
export function renderMap() {
    // Room elements contain zoom-dependent positioning, so remove the
    // current rendered rooms before drawing them at the new scale.
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