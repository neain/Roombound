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
    selectRoomWithoutEditor,
    openRoomEditor
} from "./roomEditor.js";

import {
} from "./roomRenderer.js";

import {
    clearRoomSelection,
    startBoxSelection,
    getSelectedRooms
} from "./roomRenderer.js";

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

    let boxSelectionState = {dragged: false};


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
            const openRoomEditorMenuButton =
                document.createElement("button");

            const newConnectionMenuButton =
                document.createElement("button");

            openRoomEditorMenuButton.classList.add(
                "menu-item"
            );

            openRoomEditorMenuButton.textContent =
                "Open Room Editor";

            openRoomEditorMenuButton.addEventListener(
                "click",
                () => {
                    closeContextMenu();

                    openRoomEditor(
                        room,
                        map,
                        mapElement,
                        mapView.connectionLayer,
                        mapView.zoom,
                        mapView.currentFloor
                    );
                }
            );

            contextMenu.appendChild(
                openRoomEditorMenuButton
            );

            const selectedRooms =
                getSelectedRooms();

            if (selectedRooms.length >= 2) {
                const editSelectedRoomsMenuButton =
                    document.createElement("button");

                editSelectedRoomsMenuButton.classList.add(
                    "menu-item"
                );

                editSelectedRoomsMenuButton.textContent =
                    "Edit Selected Rooms";

                editSelectedRoomsMenuButton.addEventListener(
                    "click",
                    () => {
                        closeContextMenu();

                        // Multi-room editor will be implemented here.
                    }
                );

                contextMenu.appendChild(
                    editSelectedRoomsMenuButton
                );
            }

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

                // Right-clicking an already-selected room preserves the current
                // selection. Right-clicking an unselected room starts a new
                // single-room selection.
                const selectedRooms =
                    getSelectedRooms();

                if (!selectedRooms.includes(room)) {
                    selectRoomWithoutEditor(room);
                }

                // Refresh room rendering so the current selection highlights
                // are reflected visually.
                const currentSelectedRooms =
                    getSelectedRooms();

                mapElement
                    .querySelectorAll(".room")
                    .forEach(
                        (element) => {
                            const elementRoom =
                                map.rooms.find(
                                    (candidate) =>
                                        candidate.roomID ===
                                        element.dataset.roomId
                                );

                            element.classList.toggle(
                                "room-selected",
                                currentSelectedRooms.includes(
                                    elementRoom
                                )
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

    // Double-clicking a room opens the editor for that specific room.
    // Double-clicking empty map space starts new-room creation.
    mapElement.addEventListener(
        "dblclick",
        (event) => {
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

                openRoomEditor(
                    room,
                    map,
                    mapElement,
                    mapView.connectionLayer,
                    mapView.zoom,
                    mapView.currentFloor
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
    // ROOM BOX SELECTION
    // ========================================================

    // Begin a potential room-selection box when the left mouse button is
    // pressed over empty map space.
    mapElement.addEventListener(
        "mousedown",
        (event) => {
            if (event.button !== 0) {
                return;
            }

            if (
                event.target.closest &&
                event.target.closest(".room")
            ) {
                return;
            }

            boxSelectionState.dragged = false;

            startBoxSelection(
                event,
                map,
                mapElement,
                mapView.zoom,
                mapView.currentFloor,
                boxSelectionState
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

            if (boxSelectionState.dragged) {
                boxSelectionState.dragged = false;
                return;
            }

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
                // Normal empty-map clicks clear the room selection.
                // Shift-click preserves the current selection.
                if (!event.shiftKey) {
                    clearRoomSelection();

                    mapElement
                        .querySelectorAll(".room-selected")
                        .forEach(
                            (element) => {
                                element.classList.remove(
                                    "room-selected"
                                );
                            }
                        );
                }

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
    // ROOM BOX SELECTION
    // ========================================================

    // Begin a potential room-selection box when the left mouse button is
    // pressed over empty map space. The box itself is only created once the
    // pointer moves far enough to count as a drag.
    mapElement.addEventListener(
        "mousedown",
        (event) => {
            if (event.button !== 0) {
                return;
            }

            if (
                event.target.closest &&
                event.target.closest(".room")
            ) {
                return;
            }

            startBoxSelection(
                event,
                map,
                mapElement,
                mapView.zoom,
                mapView.currentFloor,
                boxSelectionState
            );
        }
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