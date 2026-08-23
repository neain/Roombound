import {
    selectIntersectingRooms
} from "../roomRenderer.js";

// Begins a potential box selection over empty map space.
//
// The supplied interactionState object communicates whether the pointer
// movement became an actual drag. This allows the map click handler to ignore
// the click event generated after a completed box selection.
export function startBoxSelection(
    event,
    map,
    mapElement,
    zoom,
    currentFloor,
    interactionState
) {
    let startX;
    let startY;
    let currentX;
    let currentY;
    let isDragging = false;
    let shiftHeld = event.shiftKey;

    const selectionRectangle =
        document.createElement("div");

    const mapRect =
        mapElement.getBoundingClientRect();

    startX =
        event.clientX -
        mapRect.left +
        mapElement.scrollLeft;

    startY =
        event.clientY -
        mapRect.top +
        mapElement.scrollTop;

    currentX = startX;
    currentY = startY;

    selectionRectangle.classList.add(
        "room-selection-rectangle"
    );

    // Updates the temporary rectangle to match the current pointer position.
    function updateRectangle() {
        const left =
            Math.min(startX, currentX);

        const top =
            Math.min(startY, currentY);

        const width =
            Math.abs(currentX - startX);

        const height =
            Math.abs(currentY - startY);

        selectionRectangle.style.left =
            `${left}px`;

        selectionRectangle.style.top =
            `${top}px`;

        selectionRectangle.style.width =
            `${width}px`;

        selectionRectangle.style.height =
            `${height}px`;
    }

    // Tracks the pointer while the potential box selection is active.
    function move(event) {
        currentX =
            event.clientX -
            mapRect.left +
            mapElement.scrollLeft;

        currentY =
            event.clientY -
            mapRect.top +
            mapElement.scrollTop;

        if (
            !isDragging &&
            Math.abs(currentX - startX) <= 3 &&
            Math.abs(currentY - startY) <= 3
        ) {
            return;
        }

        if (!isDragging) {
            isDragging = true;
            interactionState.dragged = true;

            mapElement.classList.add(
                "room-box-selecting"
            );

            mapElement.appendChild(
                selectionRectangle
            );
        }

        updateRectangle();
    }

    // Finishes the box selection and applies the resulting room selection.
    function stop(event) {
        document.removeEventListener(
            "mousemove",
            move
        );

        document.removeEventListener(
            "mouseup",
            stop
        );

        mapElement.classList.remove(
            "room-box-selecting"
        );

        if (!isDragging) {
            return;
        }

        currentX =
            event.clientX -
            mapRect.left +
            mapElement.scrollLeft;

        currentY =
            event.clientY -
            mapRect.top +
            mapElement.scrollTop;

        updateRectangle();

        selectIntersectingRooms(
            map,
            mapElement,
            zoom,
            currentFloor,
            startX,
            startY,
            currentX,
            currentY,
            shiftHeld
        );

        selectionRectangle.remove();
    }

    document.addEventListener(
        "mousemove",
        move
    );

    document.addEventListener(
        "mouseup",
        stop
    );
}