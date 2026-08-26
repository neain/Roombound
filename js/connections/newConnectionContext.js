// ============================================================
// ROOMBOUND NEW CONNECTION CONTEXT
// ============================================================
//
// Public entry point for creating a new connection.
//
// This module manages temporary creation state until the user presses
// Create. No connection is added to the map while this context is open.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
    CONNECTION_ROOM_RANGE
} from "../mapUtils.js";

import {
    createConnection
} from "./connection.js";

import {
    getDirectionSymbol
} from "./connectionEditorUI.js";

import {
    createWindow
} from "../window.js";


// ============================================================
// CONTEXT STATE
// ============================================================

// The currently displayed new-connection context window, if any.
let newConnectionContext = null;

// Temporary connection creation state.
let firstRoom = null;
let secondRoom = null;
let direction = "both";

// Map/rendering information needed when the connection is created.
let creationContext = null;


// ============================================================
// PUBLIC ENTRY POINT
// ============================================================

// Opens the new connection context using the supplied room as the initial
// first endpoint.
export function openNewConnectionContext(
    mapView,
    room
) {
    closeNewConnectionContext();

    creationContext = mapView;
    firstRoom = room;
    secondRoom = null;
    direction = "both";

    newConnectionContext =
        createWindow(
            "New Connection",
            closeNewConnectionContext
        );

    newConnectionContext.element.classList.add(
        "new-connection-context"
    );

    newConnectionContext.header.classList.add(
        "new-connection-context-header"
    );

    newConnectionContext.content.classList.add(
        "new-connection-context-content"
    );

    // --------------------------------------------------------
    // Context header / live connection preview
    // --------------------------------------------------------

    const preview =
        document.createElement("div");

    preview.classList.add(
        "new-connection-context-preview"
    );

    newConnectionContext.addHeaderElement(
        preview
    );

    // --------------------------------------------------------
    // Context content
    // --------------------------------------------------------

    const contextContent =
        document.createElement("div");

    contextContent.classList.add(
        "new-connection-context-content"
    );

    // --------------------------------------------------------
    // First room
    // --------------------------------------------------------

    const firstRoomSection =
        document.createElement("div");

    firstRoomSection.classList.add(
        "new-connection-context-section"
    );

    const firstRoomLabel =
        document.createElement("div");

    firstRoomLabel.textContent = "Room A";
    firstRoomLabel.classList.add(
        "new-connection-context-label"
    );

    const firstRoomList =
        document.createElement("div");

    firstRoomList.classList.add(
        "new-connection-context-room-list"
    );

    firstRoomSection.appendChild(
        firstRoomLabel
    );

    firstRoomSection.appendChild(
        firstRoomList
    );

    // --------------------------------------------------------
    // Direction
    // --------------------------------------------------------

    const directionSection =
        document.createElement("div");

    directionSection.classList.add(
        "new-connection-context-section"
    );

    const directionLabel =
        document.createElement("div");

    directionLabel.textContent = "Direction";
    directionLabel.classList.add(
        "new-connection-context-label"
    );

    const directionOptions =
        document.createElement("div");

    directionOptions.classList.add(
        "new-connection-context-direction"
    );

    const leftButton =
        document.createElement("button");

    const bothButton =
        document.createElement("button");

    const rightButton =
        document.createElement("button");

    leftButton.textContent = "←";
    bothButton.textContent = "↔";
    rightButton.textContent = "→";

    leftButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            direction = "A";
            updateContext();
        }
    );

    bothButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            direction = "both";
            updateContext();
        }
    );

    rightButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            direction = "B";
            updateContext();
        }
    );

    directionOptions.appendChild(
        leftButton
    );

    directionOptions.appendChild(
        bothButton
    );

    directionOptions.appendChild(
        rightButton
    );

    directionSection.appendChild(
        directionLabel
    );

    directionSection.appendChild(
        directionOptions
    );

    // --------------------------------------------------------
    // Second room
    // --------------------------------------------------------

    const secondRoomSection =
        document.createElement("div");

    secondRoomSection.classList.add(
        "new-connection-context-section"
    );

    const secondRoomLabel =
        document.createElement("div");

    secondRoomLabel.textContent = "Room B";
    secondRoomLabel.classList.add(
        "new-connection-context-label"
    );

    const secondRoomList =
        document.createElement("div");

    secondRoomList.classList.add(
        "new-connection-context-room-list"
    );

    secondRoomSection.appendChild(
        secondRoomLabel
    );

    secondRoomSection.appendChild(
        secondRoomList
    );

    // --------------------------------------------------------
    // Context buttons
    // --------------------------------------------------------

    const contextButtons =
        document.createElement("div");

    contextButtons.classList.add(
        "new-connection-context-buttons"
    );

    const cancelButton =
        document.createElement("button");

    const createButton =
        document.createElement("button");

    cancelButton.textContent = "Cancel";
    createButton.textContent = "Create";

    cancelButton.addEventListener(
        "click",
        closeNewConnectionContext
    );

    createButton.addEventListener(
        "click",
        () => {
            if (!firstRoom && !secondRoom) {
                return;
            }

            createConnection(
                creationContext.map,
                firstRoom,
                secondRoom,
                direction,
                creationContext.connectionLayer,
                creationContext.zoom,
                creationContext.currentFloor
            );

            closeNewConnectionContext();
        }
    );

    contextButtons.appendChild(
        cancelButton
    );

    contextButtons.appendChild(
        createButton
    );

    // --------------------------------------------------------
    // Assemble context
    // --------------------------------------------------------

    contextContent.appendChild(
        firstRoomSection
    );

    contextContent.appendChild(
        directionSection
    );

    contextContent.appendChild(
        secondRoomSection
    );

    newConnectionContext.content.appendChild(
        contextContent
    );

    newConnectionContext.content.appendChild(
        contextButtons
    );

    updateContext();
}


// ============================================================
// CONTEXT UPDATE
// ============================================================

// Rebuilds the room lists, direction selection, preview, and preview sizing
// from the current temporary connection state.
function updateContext() {
    if (!newConnectionContext) {
        return;
    }

    const firstRoomList =
        newConnectionContext.element.querySelector(
            ".new-connection-context-room-list"
        );

    const secondRoomList =
        newConnectionContext.element.querySelectorAll(
            ".new-connection-context-room-list"
        )[1];

    const preview =
        newConnectionContext.element.querySelector(
            ".new-connection-context-preview"
        );

    const directionButtons =
        newConnectionContext.element.querySelectorAll(
            ".new-connection-context-direction button"
        );

    const createButton =
        newConnectionContext.element.querySelector(
            ".new-connection-context-buttons button:last-child"
        );

    firstRoomList.innerHTML = "";
    secondRoomList.innerHTML = "";

    // Room A candidates are based on the current Room A endpoint.
    // If Room A has not been selected, use Room B as the starting point.
    const firstRoomCandidates =
        getRoomsInRange(
            creationContext.map,
            firstRoom || secondRoom
        );

    // Room B candidates are based on the current Room B endpoint.
    // If Room B has not been selected, use Room A as the starting point.
    const secondRoomCandidates =
        getRoomsInRange(
            creationContext.map,
            secondRoom || firstRoom
        );

    if (
        firstRoom &&
        !firstRoomCandidates.some(
            (room) => room.roomID === firstRoom.roomID
        )
    ) {
        firstRoomCandidates.push(firstRoom);
    }

    if (
        secondRoom &&
        !secondRoomCandidates.some(
            (room) => room.roomID === secondRoom.roomID
        )
    ) {
        secondRoomCandidates.push(secondRoom);
    }

    firstRoomCandidates.sort(
        (roomA, roomB) =>
            roomA.name.localeCompare(roomB.name)
    );

    secondRoomCandidates.sort(
        (roomA, roomB) =>
            roomA.name.localeCompare(roomB.name)
    );

    addNoneButton(
        firstRoomList,
        () => {
            firstRoom = null;
            updateContext();
        },
        !firstRoom
    );

    for (const room of firstRoomCandidates) {
        if (
            room.roomID === secondRoom?.roomID
        ) {
            continue;
        }

        addRoomButton(
            firstRoomList,
            room,
            room.roomID === firstRoom?.roomID,
            () => {
                firstRoom = room;
                updateContext();
            }
        );
    }

    addNoneButton(
        secondRoomList,
        () => {
            secondRoom = null;
            updateContext();
        },
        !secondRoom
    );

    for (const room of secondRoomCandidates) {
        if (
            room.roomID === firstRoom?.roomID
        ) {
            continue;
        }

        addRoomButton(
            secondRoomList,
            room,
            room.roomID === secondRoom?.roomID,
            () => {
                secondRoom = room;
                updateContext();
            }
        );
    }

    directionButtons.forEach(
        (button, index) => {
            button.classList.remove("selected");

            if (
                index === 0 &&
                direction === "A"
            ) {
                button.classList.add("selected");
            }

            if (
                index === 1 &&
                direction === "both"
            ) {
                button.classList.add("selected");
            }

            if (
                index === 2 &&
                direction === "B"
            ) {
                button.classList.add("selected");
            }
        }
    );

    const roomAName =
        firstRoom?.name || "—";

    const roomBName =
        secondRoom?.name || "—";

    preview.textContent =
        `${roomAName} ${getDirectionSymbol(direction)} ${roomBName}`;

    createButton.disabled =
        !firstRoom &&
        !secondRoom;

    updateContextPreviewSize(
        preview
    );
}


// ============================================================
// ROOM LIST UI
// ============================================================

// Adds the explicit None option to a room selection list.
function addNoneButton(
    container,
    callback,
    selected
) {
    const button =
        document.createElement("button");

    button.classList.add(
        "new-connection-context-room"
    );

    if (selected) {
        button.classList.add("selected");
    }

    const name =
        document.createElement("span");

    name.textContent = "None";

    name.classList.add(
        "new-connection-context-room-name"
    );

    button.appendChild(name);

    button.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            callback();
        }
    );

    container.appendChild(button);
}


// Adds a room to a room-selection list with its floor displayed in a
// separate right-aligned area.
function addRoomButton(
    container,
    room,
    selected,
    callback
) {
    const button =
        document.createElement("button");

    button.classList.add(
        "new-connection-context-room"
    );

    if (selected) {
        button.classList.add("selected");
    }

    const name =
        document.createElement("span");

    name.textContent = room.name;
    name.classList.add(
        "new-connection-context-room-name"
    );

    const floor =
        document.createElement("span");

    floor.textContent =
        `floor: ${room.floor}`;

    floor.classList.add(
        "new-connection-context-room-floor"
    );

    button.appendChild(name);
    button.appendChild(floor);

    button.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            callback();
        }
    );

    container.appendChild(button);
}


// ============================================================
// RANGE CALCULATION
// ============================================================

// Returns rooms whose X/Y bounds are within the configured connection range
// of any part of the supplied room. Floor is deliberately ignored.
function getRoomsInRange(
    map,
    sourceRoom
) {
    if (!sourceRoom) {
        return [];
    }

    const rooms = [];

    const rangeLeft =
        sourceRoom.position.x -
        CONNECTION_ROOM_RANGE;

    const rangeTop =
        sourceRoom.position.y -
        CONNECTION_ROOM_RANGE;

    const rangeRight =
        sourceRoom.position.x +
        sourceRoom.size.width +
        CONNECTION_ROOM_RANGE;

    const rangeBottom =
        sourceRoom.position.y +
        sourceRoom.size.height +
        CONNECTION_ROOM_RANGE;

    for (const room of map.rooms) {
        if (
            room.roomID === sourceRoom.roomID
        ) {
            continue;
        }

        const roomLeft =
            room.position.x;

        const roomTop =
            room.position.y;

        const roomRight =
            roomLeft +
            room.size.width;

        const roomBottom =
            roomTop +
            room.size.height;

        if (
            roomRight >= rangeLeft &&
            roomLeft <= rangeRight &&
            roomBottom >= rangeTop &&
            roomTop <= rangeBottom
        ) {
            rooms.push(room);
        }
    }

    rooms.sort(
        (roomA, roomB) =>
            roomA.name.localeCompare(roomB.name)
    );

    return rooms;
}


// ============================================================
// CONTEXT SIZING
// ============================================================

// Enlarges the context only when the complete connection preview no longer
// fits inside the current window width. The window is never automatically
// reduced.
function updateContextPreviewSize(
    preview
) {
    if (!newConnectionContext) {
        return;
    }

    const previewWidth =
        preview.scrollWidth;

    const contextWidth =
        newConnectionContext.element.clientWidth;

    if (previewWidth <= contextWidth) {
        return;
    }

    const widthIncrease =
        previewWidth -
        contextWidth;

    newConnectionContext.element.style.width =
        `${newConnectionContext.element.offsetWidth + widthIncrease + 20}px`;
}


// ============================================================
// CONTEXT CLOSING
// ============================================================

// Closes the new connection context without modifying the map.
export function closeNewConnectionContext() {
    if (!newConnectionContext) {
        return;
    }

    newConnectionContext.remove();

    newConnectionContext = null;
    firstRoom = null;
    secondRoom = null;
    direction = "both";
    creationContext = null;
}