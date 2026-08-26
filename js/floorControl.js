import {
    renderMap
} from "./mapRenderer.js";


// ============================================================
// ROOMBOUND FLOOR CONTROL
// ============================================================
//
// Owns the floor-selection UI and its interaction logic.
// The application supplies map state and the renderMap callback so that
// changing floors can trigger the normal map re-render.
//
// ============================================================

// ============================================================
// FLOOR SETTINGS
// ============================================================

// Whether the hidden/debug floor 0 should be available to the user.
//
// FUTURE: This should eventually be supplied by the Options menu rather
// than being hardcoded here.
const SHOW_FLOOR_ZERO = false;

// ============================================================
// FLOOR HELPERS
// ============================================================

/**
 * Returns an array of floor numbers that should appear in the dropdown.
 *
 * Normal integer floors are included around the range of the map, except
 * floor 0. Any floor that actually contains a room but is not part of the
 * normal integer range is added separately. This includes floor 0 and
 * fractional floors.
 */
function getFloorOptions(map) {
    const floors = map.rooms.map(
        room => room.floor
    );

    console.log(
        "Room floors:",
        floors
    );

    const options = [];
    let min;
    let max;
    let floor;

    if (map.rooms.length === 0) {
        return [-1, 1, 2];
    }

    min = Math.min(...floors);
    max = Math.max(...floors);

    // Add the normal integer floor range, except floor 0.
    for (
        floor = Math.floor(min);
        floor <= Math.ceil(max);
        floor++
    ) {
        if (floor === 0) {
            continue;
        }

        options.push(floor);
    }

    // Add any occupied floor that is not already in the normal range.
    for (const roomFloor of floors) {
        if (!options.includes(roomFloor)) {
            options.push(roomFloor);
        }
    }

    options.sort(
        (a, b) => a - b
    );

    return options;
}

/**
 * Returns the next floor in the given direction, skipping floor 0 when it
 * is hidden.
 */
function getAdjacentFloor(currentFloor, direction) {
    let floor = currentFloor + direction;

    if (!SHOW_FLOOR_ZERO && floor === 0) {
        floor += direction;
    }

    return floor;
}

/**
 * Returns how many rooms are on a given floor.
 */
function getRoomCountOnFloor(map, floor) {
    return map.rooms.filter(r => r.floor === floor).length;
}

// ============================================================
// FLOOR CONTROL INITIALIZATION
// ============================================================

/**
 * Creates and initializes the floor-selection control.
 */
export function initializeFloorControl({
    map,
    mapView
}) {
    const floorControl = document.createElement("div");
    const floorUpButton = document.createElement("button");
    const floorDisplay = document.createElement("button");
    const floorDownButton = document.createElement("button");
    const floorDropdown = document.createElement("div");

    floorControl.classList.add("floor-control");

    floorUpButton.classList.add("floor-button");
    floorUpButton.textContent = "↑";
    floorUpButton.setAttribute("aria-label", "Go up one floor");

    floorDisplay.classList.add("floor-display");
    floorDisplay.textContent = `Floor ${mapView.currentFloor}`;
    floorDisplay.setAttribute("aria-label", "Select floor");

    floorDownButton.classList.add("floor-button");
    floorDownButton.textContent = "↓";
    floorDownButton.setAttribute("aria-label", "Go down one floor");

    floorDropdown.classList.add("floor-dropdown");
    floorDropdown.style.display = "none";

    floorControl.appendChild(floorDownButton);
    floorControl.appendChild(floorDisplay);
    floorControl.appendChild(floorUpButton);
    floorControl.appendChild(floorDropdown);

    document.body.appendChild(floorControl);

    // --------------------------------------------------------
    // Floor changing
    // --------------------------------------------------------

    // Changes the currently displayed floor.
    function setCurrentFloor(newFloor) {
        if (newFloor === mapView.currentFloor) {
            return;
        }

        mapView.currentFloor = newFloor;
        floorDisplay.textContent =
            `Floor ${mapView.currentFloor}`;

        // Close dropdown if open.
        floorDropdown.style.display = "none";

        // Re-render the map with the new floor.
        renderMap();
    }

    // --------------------------------------------------------
    // Button events
    // --------------------------------------------------------

    floorUpButton.addEventListener("click", () => {
        setCurrentFloor(
            getAdjacentFloor(
                mapView.currentFloor,
                1
            )
        );
    });

    floorDownButton.addEventListener("click", () => {
        setCurrentFloor(
            getAdjacentFloor(
                mapView.currentFloor,
                -1
            )
        );
    });

    // --------------------------------------------------------
    // Dropdown
    // --------------------------------------------------------

    floorDisplay.addEventListener("click", (event) => {
        const options = getFloorOptions(map);
        let count;
        let item;

        event.stopPropagation();

        // Toggle.
        if (floorDropdown.style.display === "block") {
            floorDropdown.style.display = "none";
            return;
        }

        // Rebuild the list every time it opens.
        floorDropdown.innerHTML = "";

        for (const floor of options) {
            count = getRoomCountOnFloor(map, floor);
            item = document.createElement("button");

            item.classList.add("floor-dropdown-item");

            if (floor === mapView.currentFloor) {
                item.classList.add("selected");
            }

            item.textContent =
                `Floor ${floor}  (${count} room${count === 1 ? "" : "s"})`;

            item.addEventListener("click", (e) => {
                e.stopPropagation();
                setCurrentFloor(floor);
            });

            floorDropdown.appendChild(item);
        }

        floorDropdown.style.display = "block";
    });

    // Close dropdown when clicking elsewhere.
    document.addEventListener("click", () => {
        floorDropdown.style.display = "none";
    });
}