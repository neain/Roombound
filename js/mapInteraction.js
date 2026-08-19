// ============================================================
// ROOMBOUND MAP INTERACTION
// ============================================================
//
// Handles direct mouse interaction with the map itself.
//
// RESPONSIBILITIES:
//   - Map click handling.
//   - Connection selection by clicking near connection paths.
//   - Room-click priority over connection selection.
//   - Ctrl + mouse-wheel zoom.
//   - Right-click map panning.
//   - Browser context-menu suppression over the map.
//
// The interaction module receives application state and callbacks from
// main.js rather than importing application state directly. This keeps
// interaction behavior separate from application initialization.
//

// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
import {
    CONNECTION_CLICK_RANGE,
    pixelsToGrid,
    gridToPixels
} from "./mapUtils.js";

// Connection hit detection.
import {
    getConnectionsNearPoint
} from "./connectionRenderer.js";


// ============================================================
// MAP INTERACTION
// ============================================================

// Initializes all direct mouse interactions with the map.
export function initializeMapInteractions({
    map,
    mapElement,
    mapWorld,
    mapView,
    changeZoom,
    zoomStep,
    openConnectionEditorForConnections
}) {
    let isPanning = false;
    let panStartX;
    let panStartY;
    let scrollStartX;
    let scrollStartY;


    // ========================================================
    // CONTEXT MENU
    // ========================================================

    // Prevent the browser's default right-click context menu over the map.
    // Right-click is used for map panning instead.
    mapElement.addEventListener(
        "contextmenu",
        (event) => {
            event.preventDefault();
        }
    );


    // ========================================================
    // MAP CLICK
    // ========================================================

    // Clicking near a connection opens the connection editor with every
    // nearby connection. Room clicks take priority so connections cannot
    // be selected through a room.
    mapElement.addEventListener(
        "click",
        (event) => {
            const mapRect =
                mapElement.getBoundingClientRect();

            const clickX =
                event.clientX -
                mapRect.left +
                mapElement.scrollLeft;

            const clickY =
                event.clientY -
                mapRect.top +
                mapElement.scrollTop;

            const worldX =
                pixelsToGrid(
                    clickX,
                    mapView.zoom
                );

            const worldY =
                pixelsToGrid(
                    clickY,
                    mapView.zoom
                );

            const clickedRoom =
                map.rooms.some(
                    (room) => {
                        const roomX = room.position.x;
                        const roomY = room.position.y;
                        const roomWidth = room.size.width;
                        const roomHeight = room.size.height;

                        return (
                            worldX >= roomX &&
                            worldX <= roomX + roomWidth &&
                            worldY >= roomY &&
                            worldY <= roomY + roomHeight
                        );
                    }
                );

            if (clickedRoom) {
                return;
            }

            if (
                event.target.closest &&
                event.target.closest(".room")
            ) {
                return;
            }

            const connections =
                getConnectionsNearPoint(
                    mapView,
                    clickX,
                    clickY,
                    gridToPixels(
                        CONNECTION_CLICK_RANGE,
                        mapView.zoom
                    )
                );

            if (connections.length === 0) {
                const editor =
                    document.querySelector(".room-editor");

                if (
                    (event.target === mapElement ||
                    event.target === mapWorld) &&
                    editor
                ) {
                    editor
                        .querySelector(".room-editor-cancel")
                        .click();
                }

                return;
            }

            openConnectionEditorForConnections(
                map,
                connections,
                mapElement,
                mapView.connectionLayer,
                mapView.zoom,
                mapView.currentFloor
            );
        }
    );


    // ========================================================
    // ZOOM
    // ========================================================

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
                changeZoom(mapView.zoom + zoomStep);
            } else {
                changeZoom(mapView.zoom - zoomStep);
            }
        },
        { passive: false }
    );


    // ========================================================
    // MAP PANNING
    // ========================================================

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
                scrollStartX -
                (event.clientX - panStartX);

            mapElement.scrollTop =
                scrollStartY -
                (event.clientY - panStartY);
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
}