// ============================================================
// EDITOR WINDOW
// ============================================================
//
// Creates the shared floating-window shell used by editor-style UI.
//
// The returned object exposes the window element, header, title, close
// button, content container, and generic window operations so callers do not
// need to manipulate window geometry or lifecycle directly.
//
// Application-specific behavior remains in the calling module.

// ============================================================
// WINDOW STATE
// ============================================================

const openWindows = new Set();

// ============================================================
// WINDOW CREATION
// ============================================================

// Closes all currently open windows.
export function closeWindowsOnMapClick() {

    for (const window of openWindows) {
        window.close();
    }

}

// Creates and displays a floating window with the standard Roombound window
// structure and behavior.
export function createWindow(
    title,
    onClose
) {
    const windowElement = document.createElement("div");
    const header = document.createElement("div");
    const titleElement = document.createElement("span");
    const closeButton = document.createElement("button");
    const content = document.createElement("div");

    const windowAPI = {
        element: windowElement,
        header,
        title: titleElement,
        closeButton,
        content,

        close: () => {
            onClose();
        },

        // Generic window geometry and lifecycle operations.
        setSize: (
            width,
            height
        ) => {
            setWindowSize(
                windowElement,
                width,
                height
            );
        },

        getSize: () => {
            return getWindowSize(windowElement);
        },

        setPosition: (
            x,
            y
        ) => {
            setWindowPosition(
                windowElement,
                x,
                y
            );
        },

        getPosition: () => {
            return getWindowPosition(windowElement);
        },

        remove: () => {
            openWindows.delete(windowAPI);
            windowElement.remove();
        },

        onResize: (
            callback
        ) => {
            observeWindowResize(
                windowElement,
                callback
            );
        },

        addHeaderElement: (
            element
        ) => {
            header.insertBefore(
                element,
                closeButton
            );
        }
    };

    windowElement.classList.add("editor-window");
    header.classList.add("editor-window-header");
    titleElement.classList.add("editor-window-title");
    closeButton.classList.add("editor-window-close");
    content.classList.add("editor-window-content");

    titleElement.textContent = title;

    closeButton.type = "button";
    closeButton.textContent = "×";

    closeButton.addEventListener(
        "click",
        onClose
    );

    header.appendChild(titleElement);
    header.appendChild(closeButton);

    windowElement.appendChild(header);
    windowElement.appendChild(content);

    windowElement.addEventListener(
        "mousedown",
        () => {
            bringEditorWindowToFront(windowElement);
        }
    );

    // Escape closes the window through the caller's normal close handler.
    windowElement.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            onClose();
        }
    );

    startEditorDragging(
        windowElement,
        header
    );

    document.body.appendChild(windowElement);

    bringEditorWindowToFront(windowElement);

    openWindows.add(windowAPI);

    return windowAPI;
}


// ============================================================
// WINDOW GEOMETRY
// ============================================================

// Sets the displayed size of a window.
function setWindowSize(
    windowElement,
    width,
    height
) {
    if (width !== undefined) {
        windowElement.style.width =
            `${width}px`;
    }

    if (height !== undefined) {
        windowElement.style.height =
            `${height}px`;
    }
}


// Returns the current displayed size of a window.
function getWindowSize(
    windowElement
) {
    return {
        width: windowElement.offsetWidth,
        height: windowElement.offsetHeight
    };
}


// Sets the screen position of a window.
function setWindowPosition(
    windowElement,
    x,
    y
) {
    windowElement.style.left =
        `${x}px`;

    windowElement.style.top =
        `${y}px`;

    windowElement.style.right =
        "auto";
}


// Returns the current screen position of a window.
function getWindowPosition(
    windowElement
) {
    return {
        x: windowElement.offsetLeft,
        y: windowElement.offsetTop
    };
}


// ============================================================
// WINDOW RESIZING
// ============================================================

// Watches for changes to the displayed window dimensions.
function observeWindowResize(
    windowElement,
    callback
) {
    let previousWidth =
        windowElement.offsetWidth;

    let previousHeight =
        windowElement.offsetHeight;

    windowElement.addEventListener(
        "mouseup",
        () => {
            const width =
                windowElement.offsetWidth;

            const height =
                windowElement.offsetHeight;

            if (
                width === previousWidth &&
                height === previousHeight
            ) {
                return;
            }

            previousWidth = width;
            previousHeight = height;

            callback({
                width,
                height
            });
        }
    );
}


// ============================================================
// WINDOW DRAGGING
// ============================================================

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