// ============================================================
// ROOMBOUND OPTIONS WINDOW
// ============================================================
//
// Provides the Options window and connects its controls to options.js.
//
// This module only owns the Options UI. It does not apply option behavior
// elsewhere in the application.
//

import {
    createWindow
} from "./window.js";

import {
    getConfirmDelete,
    setConfirmDelete,
    getConfirmGroupDelete,
    setConfirmGroupDelete,
    getGroupDefaults,
    setGroupDefaults,
    getDefaultSnapToGrid,
    setDefaultSnapToGrid,
    getDefaultNewRoomWidth,
    setDefaultNewRoomWidth,
    getDefaultNewRoomHeight,
    setDefaultNewRoomHeight,
    getDefaultNewRoomColor,
    setDefaultNewRoomColor,
    getDefaultNewRoomTextColor,
    setDefaultNewRoomTextColor,
    getConnectionEndpointSelectorSize,
    setConnectionEndpointSelectorSize,
    getAllowFloorZero,
    setAllowFloorZero,
    clearSavedOptions,
    getCloseWindowsOnClick,
    setCloseWindowsOnClick
} from "./options.js";


// ============================================================
// OPTIONS WINDOW
// ============================================================

// Opens the Options window.
export function openOptionsWindow() {
    const optionsWindow =
        createWindow(
            "Options",
            () => {
                optionsWindow.remove();
            }
        );

    optionsWindow.element.classList.add(
        "options-window"
    );

    optionsWindow.header.classList.add(
        "options-window-header"
    );

    const content =
        optionsWindow.content;

    content.classList.add(
        "options-window-content"
    );

    // --------------------------------------------------------
    // New Room Defaults
    // --------------------------------------------------------

    const roomDefaultsSection =
        createSection(
            "New Room Defaults"
        );

    roomDefaultsSection.appendChild(
        createColorOption(
            "Default room color",
            getDefaultNewRoomColor,
            setDefaultNewRoomColor
        )
    );

    roomDefaultsSection.appendChild(
        createColorOption(
            "Default room text color",
            getDefaultNewRoomTextColor,
            setDefaultNewRoomTextColor
        )
    );

    roomDefaultsSection.appendChild(
        createNumberOption(
            "Default room width",
            getDefaultNewRoomWidth,
            setDefaultNewRoomWidth
        )
    );

    roomDefaultsSection.appendChild(
        createNumberOption(
            "Default room height",
            getDefaultNewRoomHeight,
            setDefaultNewRoomHeight
        )
    );

    content.appendChild(
        roomDefaultsSection
    );

    // --------------------------------------------------------
    // Connection Editor
    // --------------------------------------------------------

    const connectionSection =
        createSection(
            "Connection Editor"
        );

    connectionSection.appendChild(
        createNumberOption(
            "Connection endpoint selector size",
            getConnectionEndpointSelectorSize,
            setConnectionEndpointSelectorSize
        )
    );

    content.appendChild(
        connectionSection
    );

    // --------------------------------------------------------
    // Map Behavior
    // --------------------------------------------------------

    const mapBehaviorSection =
        createSection(
            "Map Behavior"
        );

    mapBehaviorSection.appendChild(
        createCheckboxOption(
            "Snap to Grid",
            getDefaultSnapToGrid,
            setDefaultSnapToGrid,
            "When enabled, rooms snap to the grid normally and holding Shift temporarily unlocks snapping. When disabled, holding Shift temporarily enables snapping."
        )
    );

    mapBehaviorSection.appendChild(
        createCheckboxOption(
            "Allow Floor 0",
            getAllowFloorZero,
            setAllowFloorZero,
            "Allows rooms to exist on floor 0."
        )
    );

    content.appendChild(
        mapBehaviorSection
    );

    // --------------------------------------------------------
    // Window Behavior
    // --------------------------------------------------------

    const windowBehaviorSection =
        createSection(
            "Window Behavior"
        );

    windowBehaviorSection.appendChild(
        createCheckboxOption(
            "Close windows when clicking empty map",
            getCloseWindowsOnClick,
            setCloseWindowsOnClick,
            "When enabled, clicking empty map space closes open windows."
        )
    );

    content.appendChild(
        windowBehaviorSection
    );

    // --------------------------------------------------------
    // Deletion
    // --------------------------------------------------------

    const deletionSection =
        createSection(
            "Deletion"
        );

    deletionSection.appendChild(
        createCheckboxOption(
            "Confirm before deleting",
            getConfirmDelete,
            setConfirmDelete,
            "Ask for confirmation before performing destructive deletions."
        )
    );

    deletionSection.appendChild(
        createCheckboxOption(
            "Confirm before deleting rooms in a group",
            getConfirmGroupDelete,
            setConfirmGroupDelete,
            "When enabled, deleting rooms contained by a group requires an additional group-level confirmation."
        )
    );

    content.appendChild(
        deletionSection
    );

    // --------------------------------------------------------
    // Grouping
    // --------------------------------------------------------

    const groupingSection =
        createSection(
            "Grouping"
        );

    groupingSection.appendChild(
        createCheckboxOption(
            "Use default grouping options",
            getGroupDefaults,
            setGroupDefaults,
            "When enabled, rooms are grouped immediately using the default grouping options. When disabled, the grouping options window appears before grouping."
        )
    );

    content.appendChild(
        groupingSection
    );

    // --------------------------------------------------------
    // Reset
    // --------------------------------------------------------

    const resetSection =
        createSection(
            "Reset"
        );

    const resetButton =
        document.createElement("button");

    resetButton.textContent =
        "Reset Options";

    resetButton.title =
        "Reset all options to their defaults. Unsaved work will be lost.";

    resetButton.addEventListener(
        "click",
        () => {
            const confirmed =
                confirm(
                    "Reset all options to their defaults?\n\n" +
                    "Roombound will reload, and any unsaved work will be lost."
                );

            if (!confirmed) {
                return;
            }

            clearSavedOptions();
            window.location.reload();
        }
    );

    resetSection.appendChild(
        resetButton
    );

    content.appendChild(
        resetSection
    );
}


// ============================================================
// UI HELPERS
// ============================================================

// Creates a labeled section used to organize the Options window.
function createSection(title) {
    const section =
        document.createElement("div");

    section.classList.add(
        "options-window-section"
    );

    const heading =
        document.createElement("div");

    heading.classList.add(
        "options-window-section-title"
    );

    heading.textContent =
        title;

    section.appendChild(
        heading
    );

    return section;
}


// Creates a checkbox option connected directly to an options.js getter/setter.
function createCheckboxOption(
    labelText,
    getter,
    setter,
    tooltipText
) {
    const row =
        document.createElement("label");

    row.classList.add(
        "options-window-checkbox"
    );

    const checkbox =
        document.createElement("input");

    checkbox.type =
        "checkbox";

    checkbox.checked =
        getter();

    checkbox.addEventListener(
        "change",
        () => {
            setter(
                checkbox.checked
            );
        }
    );

    const label =
        document.createElement("span");

    label.textContent =
        labelText;

    row.appendChild(
        checkbox
    );

    row.appendChild(
        label
    );

    if (tooltipText) {
        row.title =
            tooltipText;
    }

    return row;
}


// Creates a color option connected directly to an options.js getter/setter.
function createColorOption(
    labelText,
    getter,
    setter
) {
    const row =
        document.createElement("label");

    row.classList.add(
        "options-window-field"
    );

    const label =
        document.createElement("span");

    label.textContent =
        labelText;

    const input =
        document.createElement("input");

    input.type =
        "color";

    input.value =
        getter();

    input.addEventListener(
        "input",
        () => {
            setter(
                input.value
            );
        }
    );

    row.appendChild(
        label
    );

    row.appendChild(
        input
    );

    return row;
}


// Creates a numeric option connected directly to an options.js getter/setter.
function createNumberOption(
    labelText,
    getter,
    setter
) {
    const row =
        document.createElement("label");

    row.classList.add(
        "options-window-field"
    );

    const label =
        document.createElement("span");

    label.textContent =
        labelText;

    const input =
        document.createElement("input");

    input.type =
        "number";

    input.value =
        getter();

    input.addEventListener(
        "change",
        () => {
            setter(
                input.value
            );
        }
    );

    row.appendChild(
        label
    );

    row.appendChild(
        input
    );

    return row;
}