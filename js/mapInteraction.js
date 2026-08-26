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

import {
    getMapWorld
} from "./mapRenderer.js";

// Room selection without opening the room editor.
import {
    selectRoomWithoutEditor,
    openRoomEditor,
    closeRoomEditor
} from "./roomEditor.js";

import {
    closeMultiRoomEditor
} from "./multiRoomEditor.js";

import {
    openConnectionEditor,
    closeConnectionEditor,
    closeNewConnectionContext

} from "./connectionEditor.js";

import {
    clearRoomSelection,
    startBoxSelection,
    getSelectedRooms,
    setRoomClipboard,
    getRoomClipboard,
    deleteRoom,
    duplicateRooms
} from "./roomRenderer.js";

import {
    createGroup,
    isGroup
} from "./group.js";

import {
    renderMap
} from "./mapRenderer.js";


// ============================================================
// MAP INTERACTION
// ============================================================


// Initializes all direct mouse interactions with the map.
export function initializeMapInteractions({
    map,
    mapElement,
    mapView,
    openConnectionEditorForConnections,
    openNewRoomContext,
    openMultiRoomEditor,
    createConnection
}) {
    let isPanning = false;
    let hasPanned = false;
    let panStartX;
    let panStartY;
    let scrollStartX;
    let scrollStartY;
    let contextMenu = null;
    let mapWorld = getMapWorld();

    let boxSelectionState = {dragged: false};

    // Returns the map object represented by a room or group DOM element.
    //
    // Groups are intentionally treated like rooms for map interaction so the
    // same editor and context-menu behavior can operate on either object.
    function getRoomLikeObject(element) {
        if (!element) {
            return null;
        }

        if (element.classList.contains("room")) {
            const roomID =
                element.dataset.roomId;

            return map.rooms.find(
                (room) => room.roomID === roomID
            ) || null;
        }

        if (element.classList.contains("group")) {
            const groupID =
                element.dataset.groupId;

            return map.groups.find(
                (group) => group.groupID === groupID
            ) || null;
        }

        return null;
    }

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
    function openContextMenu(
        event,
        room,
        mapPosition = null,
        connections = []
    ) {
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

        // Adds a visual separator between logical groups of menu actions.
        function addMenuSeparator(menu) {
            const separator =
                document.createElement("div");

            separator.classList.add("menu-separator");

            menu.appendChild(separator);
        }

        if (room) {
            const openRoomEditorMenuButton =
                document.createElement("button");

            const editConnectionsMenuButton =
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

            editConnectionsMenuButton.classList.add(
                "menu-item"
            );

            editConnectionsMenuButton.textContent =
                "Edit Connections";

            editConnectionsMenuButton.addEventListener(
                "click",
                () => {
                    closeContextMenu();

                    openConnectionEditor(
                        map,
                        room,
                        mapElement,
                        mapView.connectionLayer,
                        mapView.zoom,
                        mapView.currentFloor
                    );
                }
            );

            contextMenu.appendChild(
                editConnectionsMenuButton
            );

            const selectedRooms =
                getSelectedRooms();

            if (selectedRooms.length >= 2) {
                const editSelectedRoomsMenuButton =
                    document.createElement("button");

                const convertToGroupMenuButton =
                    document.createElement("button");

                addMenuSeparator(contextMenu);

                editSelectedRoomsMenuButton.classList.add(
                    "menu-item"
                );

                editSelectedRoomsMenuButton.textContent =
                    "Edit Selected Rooms";

                editSelectedRoomsMenuButton.addEventListener(
                    "click",
                    () => {
                        closeContextMenu();

                        openMultiRoomEditor(
                            map,
                            mapElement,
                            mapView.connectionLayer,
                            mapView.zoom,
                            mapView.currentFloor
                        );
                    }
                );

                convertToGroupMenuButton.classList.add(
                    "menu-item"
                );

                convertToGroupMenuButton.textContent =
                    "Combine Rooms";

                convertToGroupMenuButton.addEventListener(
                    "click",
                    () => {
                        closeContextMenu();

                        const objectsOnCurrentFloor =
                            getSelectedRooms().filter(
                                (selectedObject) =>
                                    selectedObject.floor ===
                                    mapView.currentFloor
                            );

                        if (objectsOnCurrentFloor.length < 2) {
                            return;
                        }

                        createGroup(
                            map,
                            objectsOnCurrentFloor,
                            mapView.currentFloor
                        );

                        renderMap();
                    }
                );

                contextMenu.appendChild(
                    editSelectedRoomsMenuButton
                );

                contextMenu.appendChild(
                    convertToGroupMenuButton
                );

                addMenuSeparator(contextMenu);
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

            // Delete is separated from the normal room actions because it is
            // destructive and should not be mistaken for an editing action.
            if (!isGroup(room)) {
                const selectedRooms =
                    getSelectedRooms();

                const deleteRoomMenuButton =
                    document.createElement("button");

                deleteRoomMenuButton.classList.add(
                    "menu-item",
                    "menu-item-danger"
                );

                deleteRoomMenuButton.textContent =
                    selectedRooms.length > 1
                        ? "Delete Selected Rooms"
                        : "Delete Room";

                deleteRoomMenuButton.addEventListener(
                    "click",
                    () => {
                        closeContextMenu();

                        const roomsToDelete =
                            selectedRooms.length > 1
                                ? [...selectedRooms]
                                : [room];

                        for (const selectedRoom of roomsToDelete) {
                            if (isGroup(selectedRoom)) {
                                continue;
                            }

                            deleteRoom(
                                map,
                                selectedRoom.roomID,
                                mapElement,
                                mapView.connectionLayer,
                                mapView.zoom,
                                mapView.currentFloor
                            );
                        }
                    }
                );

                addMenuSeparator(contextMenu);

                contextMenu.appendChild(
                    deleteRoomMenuButton
                );
            }
        } else {
            // New Room remains the primary context-menu action. When connections
            // are nearby, editing them is added as a secondary action.
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
                        mapView,
                        mapElement,
                        renderMap,
                        mapPosition
                    );
                }
            );

            contextMenu.appendChild(
                newRoomMenuButton
            );

            if (connections.length > 0) {
                const editConnectionsMenuButton =
                    document.createElement("button");

                editConnectionsMenuButton.classList.add(
                    "menu-item"
                );

                editConnectionsMenuButton.textContent =
                    "Edit Connections";

                editConnectionsMenuButton.addEventListener(
                    "click",
                    () => {
                        closeContextMenu();

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

                addMenuSeparator(contextMenu);

                contextMenu.appendChild(
                    editConnectionsMenuButton
                );
            }
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
                event.target.closest?.(".room, .group");

            if (roomElement) {
                const room =
                    getRoomLikeObject(roomElement);

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

            // BEGIN EDIT
            // Use the same hit detection as the normal left-click connection
            // editor path. This deliberately checks all nearby connections.
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

            openContextMenu(
                event,
                null,
                {
                    x: clickX,
                    y: clickY
                },
                connections
            );
            // END EDIT
        }
    );

    // Double-clicking a room opens the editor for that specific room.
    // Double-clicking empty map space starts new-room creation.
    mapElement.addEventListener(
        "dblclick",
        (event) => {
            console.log(
                "DOUBLE CLICK:",
                event.target,
                event.target.closest?.(".room"),
                event.target.closest?.(".group")
            );

            const roomElement =
                event.target.closest?.(".room, .group");

            if (roomElement) {
                const room =
                    getRoomLikeObject(roomElement);

                console.log(
                    "DOUBLE CLICK OBJECT:",
                    room
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
                mapView,
                mapElement,
                renderMap,
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
                event.target.closest(".room, .group")
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

    // Handles normal left-click behavior on the map.
    // Room clicks take priority over empty-map interaction.
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
                event.target.closest(".room, .group")
            ) {
                return;
            }

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

            if (event.target === mapElement || event.target === mapWorld) {
                closeRoomEditor();
                closeMultiRoomEditor();
                closeConnectionEditor();
                closeNewConnectionContext();
            }
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
                event.target.closest(".room, .group")
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

    // Handles standard room copy and paste shortcuts.
    //
    // Copy stores the current room selection in the room clipboard. Paste creates
    // new rooms from that clipboard data using the normal room duplication path.
    document.addEventListener(
        "keydown",
        (event) => {
            if (!event.ctrlKey) {
                return;
            }

            const target =
                event.target;

            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target.isContentEditable
            ) {
                return;
            }

                        if (event.key.toLowerCase() === "c") {
                const selectedRooms =
                    getSelectedRooms();

                if (selectedRooms.length === 0) {
                    return;
                }

                event.preventDefault();

                const copySelection = [
                    ...selectedRooms
                ];

                for (const selectedObject of selectedRooms) {
                    if (!isGroup(selectedObject)) {
                        continue;
                    }

                    for (const roomID of selectedObject.roomIDs) {
                        const room =
                            map.rooms.find(
                                (candidate) =>
                                    candidate.roomID === roomID
                            );

                        if (
                            room &&
                            !copySelection.includes(room)
                        ) {
                            copySelection.push(room);
                        }
                    }
                }

                setRoomClipboard(
                    copySelection
                );

                return;
            }

            if (event.key.toLowerCase() === "v") {
                const roomClipboard =
                    getRoomClipboard();

                if (
                    !roomClipboard ||
                    roomClipboard.length === 0
                ) {
                    return;
                }

                event.preventDefault();

                duplicateRooms(
                    roomClipboard,
                    map,
                    mapElement,
                    mapView.connectionLayer,
                    mapView.zoom,
                    mapView.currentFloor
                );
            }
        }
    );

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