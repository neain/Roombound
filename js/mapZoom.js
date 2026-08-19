// ============================================================
// APPLICATION ZOOM CONTROL
// ============================================================

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

const zoomControl = document.createElement("div");
const zoomInButton = document.createElement("button");
const zoomTrack = document.createElement("div");
const zoomMarks = document.createElement("div");
const zoomHandle = document.createElement("button");
const zoomOutButton = document.createElement("button");

let isDraggingZoom = false;


// ============================================================
// ZOOM INITIALIZATION
// ============================================================

/**
 * Initializes the map zoom controls.
 */
export function initializeMapZoom({
    mapElement,
    mapView,
    updateZoom
}) {
    zoomControl.classList.add("zoom-control");
    zoomControl.setAttribute("aria-label", "Map zoom controls");

    zoomInButton.classList.add("zoom-button");
    zoomInButton.textContent = "+";
    zoomInButton.setAttribute("aria-label", "Zoom in");

    zoomTrack.classList.add("zoom-track");

    zoomMarks.classList.add("zoom-marks");

    zoomHandle.classList.add("zoom-handle");
    zoomHandle.setAttribute("aria-label", "Current zoom level");

    zoomOutButton.classList.add("zoom-button");
    zoomOutButton.textContent = "−";
    zoomOutButton.setAttribute("aria-label", "Zoom out");

    zoomTrack.appendChild(zoomMarks);
    zoomTrack.appendChild(zoomHandle);

    zoomControl.appendChild(zoomInButton);
    zoomControl.appendChild(zoomTrack);
    zoomControl.appendChild(zoomOutButton);

    document.body.appendChild(zoomControl);

    createZoomMarks(
        mapElement,
        mapView,
        updateZoom
    );

    zoomInButton.addEventListener("click", () => {
        changeZoom(
            mapElement,
            mapView,
            updateZoom,
            mapView.zoom + ZOOM_STEP
        );
    });

    zoomOutButton.addEventListener("click", () => {
        changeZoom(
            mapElement,
            mapView,
            updateZoom,
            mapView.zoom - ZOOM_STEP
        );
    });

    zoomTrack.addEventListener("click", (event) => {
        const trackRect = zoomTrack.getBoundingClientRect();
        const clickPosition =
            trackRect.bottom - event.clientY;
        const usableHeight = trackRect.height;
        const progress =
            Math.max(0, Math.min(1, clickPosition / usableHeight));
        const rawZoom =
            MIN_ZOOM +
            progress * (MAX_ZOOM - MIN_ZOOM);
        const steppedZoom =
            Math.round(rawZoom / ZOOM_STEP) * ZOOM_STEP;

        if (
            event.target === zoomHandle ||
            event.target.classList.contains("zoom-mark")
        ) {
            return;
        }

        changeZoom(
            mapElement,
            mapView,
            updateZoom,
            steppedZoom
        );
    });

    zoomHandle.addEventListener("mousedown", (event) => {
        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        isDraggingZoom = true;
    });

    document.addEventListener("mousemove", (event) => {
        if (!isDraggingZoom) {
            return;
        }

        const trackRect = zoomTrack.getBoundingClientRect();
        const positionFromBottom =
            trackRect.bottom - event.clientY;
        const usableHeight = trackRect.height;
        const progress =
            Math.max(
                0,
                Math.min(1, positionFromBottom / usableHeight)
            );
        const rawZoom =
            MIN_ZOOM +
            progress * (MAX_ZOOM - MIN_ZOOM);
        const steppedZoom =
            Math.round(rawZoom / ZOOM_STEP) * ZOOM_STEP;

        changeZoom(
            mapElement,
            mapView,
            updateZoom,
            steppedZoom
        );
    });

    document.addEventListener("mouseup", () => {
        isDraggingZoom = false;
    });

    updateZoomControl(mapView.zoom);
}


// ============================================================
// ZOOM HELPERS
// ============================================================

/**
 * Returns the zoom percentage represented by a zoom value.
 */
function getZoomPercent(zoomValue) {
    return Math.round(zoomValue * 100);
}

/**
 * Creates the clickable marks for every available zoom step.
 */
function createZoomMarks(
    mapElement,
    mapView,
    updateZoom
) {
    const zoomRange = MAX_ZOOM - MIN_ZOOM;
    let markZoom;
    let mark;
    let progress;
    let percentage;

    zoomMarks.innerHTML = "";

    for (
        markZoom = MIN_ZOOM;
        markZoom <= MAX_ZOOM;
        markZoom += ZOOM_STEP
    ) {
        mark = document.createElement("button");
        progress =
            (markZoom - MIN_ZOOM) / zoomRange;
        percentage = getZoomPercent(markZoom);

        mark.classList.add("zoom-mark");

        mark.style.bottom =
            `${progress * 100}%`;

        mark.title = `${percentage}%`;

        mark.setAttribute(
            "aria-label",
            `Set zoom to ${percentage}%`
        );

        mark.addEventListener("click", (event) => {
            event.stopPropagation();

            changeZoom(
                mapElement,
                mapView,
                updateZoom,
                markZoom
            );
        });

        zoomMarks.appendChild(mark);
    }
}

/**
 * Changes the zoom while keeping the viewport center on the same map point.
 */
function changeZoom(
    mapElement,
    mapView,
    updateZoom,
    newZoom
) {
    const oldZoom = mapView.zoom;
    const centerX =
        mapElement.scrollLeft +
        mapElement.clientWidth / 2;
    const centerY =
        mapElement.scrollTop +
        mapElement.clientHeight / 2;
    const worldX = centerX / oldZoom;
    const worldY = centerY / oldZoom;

    mapView.zoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, newZoom)
    );

    if (mapView.zoom === oldZoom) {
        updateZoomControl(mapView.zoom);
        return;
    }

    updateZoom();

    mapElement.scrollLeft =
        worldX * mapView.zoom -
        mapElement.clientWidth / 2;

    mapElement.scrollTop =
        worldY * mapView.zoom -
        mapElement.clientHeight / 2;
}

/**
 * Updates the zoom handle position and tooltip.
 */
function updateZoomControl(zoomValue) {
    const zoomRange = MAX_ZOOM - MIN_ZOOM;
    const zoomProgress =
        (zoomValue - MIN_ZOOM) / zoomRange;
    const percentage =
        getZoomPercent(zoomValue);

    zoomHandle.style.bottom =
        `${zoomProgress * 100}%`;

    zoomHandle.title =
        `${percentage}%`;

    zoomHandle.setAttribute(
        "aria-label",
        `Current zoom level: ${percentage}%`
    );
}


// ============================================================
// EXTERNAL ZOOM API
// ============================================================

/**
 * Changes the map zoom to the requested value.
 */
export function requestZoom(
    mapElement,
    mapView,
    updateZoom,
    newZoom
) {
    changeZoom(
        mapElement,
        mapView,
        updateZoom,
        newZoom
    );
}

/**
 * Returns the configured zoom increment.
 */
export function getZoomStep() {
    return ZOOM_STEP;
}