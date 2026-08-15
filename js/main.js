// Default map data used when Roombound loads.
import defaultMap from "./defaultMap.js";

// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, gridToPixels, pixelsToGrid } from "./mapUtils.js";

// Room rendering and room interaction: renderRooms(), startDragging().
import { renderRooms, startDragging } from "./roomRenderer.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";


const map = defaultMap;

const mapElement = document.getElementById("map");

const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

connectionLayer.classList.add("connections");
mapElement.appendChild(connectionLayer);

mapElement.style.setProperty("--grid-size", `${GRID_SIZE}px`);

console.log(
    "Roombound map loaded:",
    map
);

console.log(
    "Map element:",
    mapElement
);


renderRooms(map, mapElement, connectionLayer);
renderConnections(map, connectionLayer);