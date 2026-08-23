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
//   - Right-click context menu.
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

// Room selection without opening the room editor.
import {
    selectRoomWithoutEditor
} from "./roomEditor.js";


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
    openConnectionEditorForConnections,
    openNewRoomContext,
    createConnection
}) {
    let isPanning = false;
    let hasPanned = false;
    let panStartX;
    let panStartY;
    let scrollStartX;
    let scrollStartY;

    let contextMenu = null;


    // ========================================================
    // CONTEXT MENU
    // ========================================================

    // Closes the custom map context menu.
    function closeContextMenu() {
        if (!contextMenu) {
            return;
        }

        contextMenu.remove();
        contextMenu = null;
    }

    // Creates the custom right-click context menu.
    function openContextMenu(event, room, mapPosition = null) {
        closeContextMenu();

        contextMenu = document.createElement("div");
        contextMenu.classList.add(
            "menu-panel",
            "map-context-menu"
        );

        const newRoomMenuButton =
            document.createElement("button");

        const newConnectionMenuButton =
            document.createElement("button");

        if (room) {
            newConnectionMenuButton.classList.add(
                "menu-item"
            );

            newConnectionMenuButton.textContent =
                "New Connection";

            newConnectionMenuButton.addEventListener(
                "click",
                () => {
                    closeContextMenu();

                    createConnection(
                        mapView,
                        room
                    );
                }
            );

            contextMenu.appendChild(
                newConnectionMenuButton
            );
        } else {
            newRoomMenuButton.classList.add(
                "menu-item"
            );

            newRoomMenuButton.textContent =
                "New Room";

            newRoomMenuButton.addEventListener(
                "click",
                () => {
                    closeContextMenu();

                    openNewRoomContext(
                        map,
                        mapElement,
                        mapView.connectionLayer,
                        mapView.zoom,
                        mapView.currentFloor,
                        mapPosition
                    );
                }
            );

            contextMenu.appendChild(
                newRoomMenuButton
            );
        }

        contextMenu.style.position = "fixed";
        contextMenu.style.left =
            `${event.clientX}px`;
        contextMenu.style.top =
            `${event.clientY}px`;
        contextMenu.style.display = "block";
        contextMenu.style.zIndex = "1002";

        document.body.appendChild(
            contextMenu
        );
    }

    // Handle right-clicks before the normal browser context menu appears.
    mapElement.addEventListener(
        "contextmenu",
        (event) => {
            event.preventDefault();

            // Do not open the context menu after a right-click pan.
            if (hasPanned) {
                hasPanned = false;
                return;
            }

            const roomElement =
                event.target.closest?.(".room");

            if (roomElement) {
                const roomID =
                    roomElement.dataset.roomId;

                const room =
                    map.rooms.find(
                        (candidate) =>
                            candidate.roomID === roomID
                    );

                if (!room) {
                    return;
                }

                // Right-clicking a room selects it without opening the editor.
                selectRoomWithoutEditor(room);

                // Refresh room rendering so the selection highlight appears.
                mapElement
                    .querySelectorAll(".room")
                    .forEach(
                        (element) => {
                            element.classList.toggle(
                                "room-selected",
                                element === roomElement
                            );
                        }
                    );

                openContextMenu(
                    event,
                    room
                );

                return;
            }

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

            openContextMenu(
                event,
                null,
                {
                    x: clickX,
                    y: clickY
                }
            );        
        }
    );

    // Double-clicking empty map space starts new-room creation at the
    // clicked map position.
    mapElement.addEventListener(
        "dblclick",
        (event) => {
            const roomElement =
                event.target.closest?.(".room");

            if (roomElement) {
                return;
            }

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

            openNewRoomContext(
                map,
                mapElement,
                mapView.connectionLayer,
                mapView.zoom,
                mapView.currentFloor,
                {
                    x: clickX,
                    y: clickY
                }
            );
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
            closeContextMenu();

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

    // Begin panning when the right mouse button is pressed over empty map
    // space. Right-clicking a room is reserved for the context menu.
mapElement.addEventListener(
    "mousedown",
    (event) => {
        if (event.button !== 2) {
            return;
        }

        isPanning = true;
        hasPanned = false;

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

        const mouseDeltaX =
            event.clientX - panStartX;

        const mouseDeltaY =
            event.clientY - panStartY;

        if (
            Math.abs(mouseDeltaX) > 3 ||
            Math.abs(mouseDeltaY) > 3
        ) {
            hasPanned = true;
        }

        mapElement.scrollLeft =
            scrollStartX -
            mouseDeltaX;

        mapElement.scrollTop =
            scrollStartY -
            mouseDeltaY;
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


    // ========================================================
    // DOCUMENT EVENTS
    // ========================================================

    // Clicking elsewhere closes the custom context menu.
    document.addEventListener(
        "click",
        (event) => {
            if (
                contextMenu &&
                !contextMenu.contains(event.target)
            ) {
                closeContextMenu();
            }
        }
    );
}