// ============================================================
// IMPORTS
// ============================================================

// Shared map/grid utilities.
// CURRENT: gridToPixels(), pixelsToGrid()
// If working on room coordinates, dimensions, or grid conversion, inspect:
//   ../mapUtils.js
import {
    gridToPixels,
    pixelsToGrid
} from "../mapUtils.js";

// Connection rendering.
// CURRENT: renderConnections()
// If changing how room resizing affects connection geometry, inspect:
//   ../connectionRenderer.js
import {
    renderConnections
} from "../connectionRenderer.js";

// Resizes a room while the bottom-right resize handle is dragged.
//
// The room's top-left position remains fixed. Width and height are stored in
// grid coordinates and snap to whole grid units.
export function startResizing(
    event,
    room,
    roomElement,
    map,
    connectionLayer,
    zoom,
    currentFloor
) {
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startWidth = room.size.width;
    const startHeight = room.size.height;

    if (event.button !== 0) {
        return;
    }

    event.preventDefault();

    // Updates the room size while the mouse is moving.
    function resize(event) {
        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        const deltaGridX =
            pixelsToGrid(mouseDeltaX, zoom);

        const deltaGridY =
            pixelsToGrid(mouseDeltaY, zoom);

        room.size.width =
            Math.max(
                1,
                startWidth + deltaGridX
            );

        room.size.height =
            Math.max(
                1,
                startHeight + deltaGridY
            );

        roomElement.style.width =
            `${gridToPixels(room.size.width, zoom)}px`;

        roomElement.style.height =
            `${gridToPixels(room.size.height, zoom)}px`;

        // Connections can depend on the room's dimensions, so redraw them
        // while the room is being resized.
        renderConnections({
            map,
            connectionLayer,
            zoom,
            currentFloor
        });
    }

    // Removes the temporary mouse listeners when resizing ends.
    function stopResizing() {
        document.removeEventListener(
            "mousemove",
            resize
        );

        document.removeEventListener(
            "mouseup",
            stopResizing
        );

        console.log(
            `Resized ${room.name} to`,
            room.size
        );
    }

    document.addEventListener(
        "mousemove",
        resize
    );

    document.addEventListener(
        "mouseup",
        stopResizing
    );
}