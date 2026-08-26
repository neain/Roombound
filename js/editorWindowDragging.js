// ============================================================
// EDITOR WINDOW DRAGGING
// ============================================================

// Adds dragging behavior to an editor window using its header.
function startEditorDragging(
    windowElement,
    header
) {
    let startMouseX;
    let startMouseY;
    let startWindowX;
    let startWindowY;

    // Records the mouse/window positions when the header is grabbed.
    function startDrag(event) {
        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startWindowX =
            windowElement.offsetLeft;

        startWindowY =
            windowElement.offsetTop;

        document.addEventListener(
            "mousemove",
            drag
        );

        document.addEventListener(
            "mouseup",
            stopDrag
        );
    }

    // Moves the window to follow the mouse.
    function drag(event) {
        const mouseDeltaX =
            event.clientX - startMouseX;

        const mouseDeltaY =
            event.clientY - startMouseY;

        windowElement.style.left =
            `${startWindowX + mouseDeltaX}px`;

        windowElement.style.top =
            `${startWindowY + mouseDeltaY}px`;

        windowElement.style.right = "auto";
    }

    // Removes the temporary drag listeners when the window is released.
    function stopDrag() {
        document.removeEventListener(
            "mousemove",
            drag
        );

        document.removeEventListener(
            "mouseup",
            stopDrag
        );
    }

    header.addEventListener(
        "mousedown",
        startDrag
    );
}