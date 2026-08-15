// Default map data used when Roombound loads.
import defaultMap from "./defaultMap.js";

// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid().
import { GRID_SIZE, MAP_SIZE, MAP_ORIGIN, gridToPixels, pixelsToGrid } from "./mapUtils.js";

// Room rendering and room interaction: renderRooms(), startDragging().
import { renderRooms, startDragging, createRoom, getSelectedRoom } from "./roomRenderer.js";

// Connection rendering and connection geometry: renderConnections() and related helpers.
import { renderConnections } from "./connectionRenderer.js";

import { createConnection } from "./connectionEditor.js";

const connectionLayer = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
);

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

let zoom = 1;

const map = defaultMap;
const mapElement = document.getElementById("map");
const mapWorld = document.createElement("div");
mapWorld.classList.add("map-world");

mapWorld.style.width = `${MAP_SIZE}px`;
mapWorld.style.height = `${MAP_SIZE}px`;

function changeZoom(newZoom) {
    const oldZoom = zoom;

    zoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, newZoom)
    );

    if (zoom === oldZoom) {
        return;
    }

    const centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;

    const centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;

    const worldX =
        centerX / oldZoom;

    const worldY =
        centerY / oldZoom;

    updateZoom();

    mapElement.scrollLeft =
        worldX * zoom -
        mapElement.clientWidth / 2;

    mapElement.scrollTop =
        worldY * zoom -
        mapElement.clientHeight / 2;
}

function updateZoom() {
    mapElement.querySelectorAll(".room").forEach(
        (roomElement) => roomElement.remove()
    );

    mapWorld.style.width =
        `${MAP_SIZE * zoom}px`;

    mapWorld.style.height =
        `${MAP_SIZE * zoom}px`;

    mapWorld.style.setProperty(
        "--grid-size",
        `${GRID_SIZE * zoom}px`
    );

    renderRooms(
        map,
        mapWorld,
        connectionLayer,
        zoom
    );

    renderConnections(
        map,
        connectionLayer,
        zoom
    );

    console.log("Zoom Level:", zoom)
}

mapElement.appendChild(mapWorld);


// this defines the bottom right bar. conceptualy at least
const mapTools = document.createElement("div");
mapTools.classList.add("map-tools");

// this defines a button for making new connections
const newConnectionButton = document.createElement("button");
newConnectionButton.classList.add("map-tool-button");
newConnectionButton.textContent = "→+";
newConnectionButton.setAttribute("aria-label", "New Connection");

// this defines a button for making new rooms
const newRoomButton = document.createElement("button");
newRoomButton.classList.add("map-tool-button");
newRoomButton.textContent = "+";
newRoomButton.setAttribute("aria-label", "New Room");

newRoomButton.addEventListener(
    "click",
    () => {
        createRoom(
            map,
            mapElement,
            connectionLayer,
            zoom
        );
    }
);

newConnectionButton.addEventListener(
    "click",
    () => {
        const room = getSelectedRoom();

        if (!room) {
            return;
        }

        createConnection(
            map,
            room,
            connectionLayer,
            zoom
        );
    }
);

const newRoomTooltip =
    document.createElement("div");

newRoomTooltip.classList.add("map-tool-tooltip");
newRoomTooltip.textContent = "New Room";

newRoomButton.appendChild(newRoomTooltip);

const newConnectionTooltip =
    document.createElement("div");

newConnectionTooltip.classList.add("map-tool-tooltip");
newConnectionTooltip.textContent = "New Connection";

newConnectionButton.appendChild(newConnectionTooltip);

mapTools.appendChild(newConnectionButton);
mapTools.appendChild(newRoomButton);

document.body.appendChild(mapTools);

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

updateZoom();

mapElement.scrollLeft =
    (MAP_SIZE * zoom - mapElement.clientWidth) / 2;

mapElement.scrollTop =
    (MAP_SIZE * zoom - mapElement.clientHeight) / 2;
