// ============================================================
// ROOMBOUND FLOOR CONTROL
// ============================================================
//
// Owns the floor-selection UI and its interaction logic.
// The application supplies map state and the updateZoom callback so that
// changing floors can trigger the normal map re-render.
//
// ============================================================


// ============================================================
// FLOOR HELPERS
// ============================================================

/**
 * Returns an array of floor numbers that should appear in the dropdown.
 * Includes every floor that currently has rooms, plus one floor below
 * the lowest and one floor above the highest.
 */
function getFloorOptions(map) {
    const floors = map.rooms.map(r => r.floor);
    const min = floors.length > 0 ? Math.min(...floors) : 0;
    const max = floors.length > 0 ? Math.max(...floors) : 2;
    const options = [];
    let floor;

    if (map.rooms.length === 0) {
        return [0, 1, 2];
    }

    for (floor = min - 1; floor <= max + 1; floor++) {
        options.push(floor);
    }

    return options;
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
    mapView,
    updateZoom
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

        // Re-render with the new floor.
        updateZoom();
    }


    // --------------------------------------------------------
    // Button events
    // --------------------------------------------------------

    floorUpButton.addEventListener("click", () => {
        setCurrentFloor(mapView.currentFloor + 1);
    });

    floorDownButton.addEventListener("click", () => {
        setCurrentFloor(mapView.currentFloor - 1);
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