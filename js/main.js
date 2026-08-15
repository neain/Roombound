// Default map data used when Roombound loads.
import defaultMap from "./defaultMap.js";

// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, MAP_SIZE, MAP_ORIGIN, gridToPixels, pixelsToGrid } from "./mapUtils.js";

// Room rendering and room interaction: renderRooms(), startDragging().
import { renderRooms, startDragging } from "./roomRenderer.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";

const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

const map = defaultMap;
const mapElement = document.getElementById("map");
const mapWorld = document.createElement("div");
mapWorld.classList.add("map-world");

mapWorld.style.width = `${MAP_SIZE}px`;
mapWorld.style.height = `${MAP_SIZE}px`;

mapWorld.style.setProperty(
    "--map-origin",
    `${MAP_ORIGIN}px`
);

mapElement.appendChild(mapWorld);

connectionLayer.classList.add("connections");
mapWorld.appendChild(connectionLayer);

mapElement.style.setProperty("--grid-size", `${GRID_SIZE}px`);

console.log(
    "Roombound map loaded:",
    map
);

console.log(
    "Map element:",
    mapElement
);

mapElement.addEventListener(
    "contextmenu",
    (event) => {
        event.preventDefault();
    }
);

let isPanning = false;
let panStartX;
let panStartY;
let scrollStartX;
let scrollStartY;

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

document.addEventListener(
    "mouseup",
    (event) => {
        if (event.button !== 2) {
            return;
        }

        isPanning = false;
    }
);

renderRooms(map, mapWorld, connectionLayer);
renderConnections(map, connectionLayer);

mapElement.scrollLeft =
    (MAP_SIZE - mapElement.clientWidth) / 2;

mapElement.scrollTop =
    (MAP_SIZE - mapElement.clientHeight) / 2;
