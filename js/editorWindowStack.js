// ============================================================
// EDITOR WINDOW STACK
// ============================================================

// Starting z-index for editor windows.
//
// This stays above normal map controls but below modal overlays.
let editorWindowZIndex = 1001;


// ============================================================
// PUBLIC API
// ============================================================

// Brings an editor window above all other editor windows.
function bringEditorWindowToFront(
    editorWindow
) {
    editorWindowZIndex++;

    editorWindow.style.zIndex =
        String(editorWindowZIndex);
}