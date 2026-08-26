// ============================================================
// CONNECTION EDITOR DRAGGING
// ============================================================

// Adds dragging behavior to the connection editor's header.
function startConnectionEditorDragging(
    editorHeader,
    connectionEditor
) {
    let startMouseX;
    let startMouseY;
    let startEditorX;
    let startEditorY;

    // Records the mouse/editor positions when the header is grabbed.
    function startDrag(event) {
        event.preventDefault();

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startEditorX = connectionEditor.offsetLeft;
        startEditorY = connectionEditor.offsetTop;

        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", stopDrag);
    }

    // Moves the editor to follow the mouse.
    function drag(event) {
        const mouseDeltaX = event.clientX - startMouseX;
        const mouseDeltaY = event.clientY - startMouseY;

        connectionEditor.style.left =
            `${startEditorX + mouseDeltaX}px`;

        connectionEditor.style.top =
            `${startEditorY + mouseDeltaY}px`;

        connectionEditor.style.right = "auto";
        connectionEditor.style.bottom = "auto";
    }

    // Removes the temporary drag listeners when the editor is released.
    function stopDrag() {
        document.removeEventListener("mousemove", drag);
        document.removeEventListener("mouseup", stopDrag);
    }

    editorHeader.addEventListener("mousedown", startDrag);
}