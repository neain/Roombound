// ============================================================
// ROOMBOUND MAP MENU
// ============================================================
//
// Handles the hamburger menu and its associated dialogs.
//
// RESPONSIBILITIES:
//   - Hamburger menu visibility.
//   - New Map confirmation dialog.
//   - Load Map submenu.
//   - Load-from-URL dialog.
//   - Dispatching Save/Load operations through callbacks supplied
//     by main.js.
//
// The actual map persistence and rendering logic remains in main.js.
// This module owns the UI and user interaction surrounding those operations.
//


// ============================================================
// MAP MENU INITIALIZATION
// ============================================================

// Creates and initializes the hamburger menu and its associated dialogs.
export function initializeMapMenu({
    saveMap,
    loadMap,
    loadMapFromUrl,
    refreshForNewMap,
    hasMapContent
}) {
    // ========================================================
    // MENU ELEMENTS
    // ========================================================

    // Main container for the application menu.
    const menuControl = document.createElement("div");

    // Button used to open and close the menu.
    const menuButton = document.createElement("button");

    // Menu contents.
    const menuPanel = document.createElement("div");

    // New Map button.
    const newMapMenuButton = document.createElement("button");

    // Save Map button.
    const saveMapMenuButton = document.createElement("button");

    // Load Map button.
    const loadMapMenuButton = document.createElement("button");

    // Load-from-URL submenu.
    const loadSubmenu = document.createElement("div");
    const loadFromFileMenuButton = document.createElement("button");
    const loadFromUrlMenuButton = document.createElement("button");

    // Options placeholder.
    const optionsMenuButton = document.createElement("button");


    // ========================================================
    // NEW MAP DIALOG ELEMENTS
    // ========================================================

    // Confirmation overlay used before discarding the current map.
    const newMapOverlay = document.createElement("div");

    // Confirmation dialog.
    const newMapDialog = document.createElement("div");

    // Dialog title.
    const newMapTitle = document.createElement("h2");

    // Dialog message.
    const newMapMessage = document.createElement("p");

    // Dialog buttons.
    const newMapButtons = document.createElement("div");

    // Save button.
    const saveAndNewButton = document.createElement("button");

    // New Without Saving button.
    const newWithoutSavingButton = document.createElement("button");

    // Cancel button.
    const cancelNewMapButton = document.createElement("button");


    // ========================================================
    // LOAD FROM URL DIALOG ELEMENTS
    // ========================================================

    // Load-from-URL dialog overlay.
    const loadUrlOverlay = document.createElement("div");

    // Load-from-URL dialog.
    const loadUrlDialog = document.createElement("div");

    // Dialog title.
    const loadUrlTitle = document.createElement("h2");

    // Dialog message.
    const loadUrlMessage = document.createElement("p");

    // URL input.
    const loadUrlInput = document.createElement("input");

    // Dialog buttons.
    const loadUrlButtons = document.createElement("div");

    // Load button.
    const loadUrlButton = document.createElement("button");

    // Cancel button.
    const cancelLoadUrlButton = document.createElement("button");

    // Help button.
    const loadUrlHelpButton = document.createElement("button");


    // ========================================================
    // MENU CONFIGURATION
    // ========================================================

    menuControl.classList.add("menu-control");

    menuButton.classList.add("menu-button");
    menuButton.textContent = "☰";
    menuButton.setAttribute("aria-label", "Open menu");
    menuButton.setAttribute("aria-expanded", "false");

    menuPanel.classList.add("menu-panel");
    menuPanel.style.display = "none";

    newMapMenuButton.classList.add("menu-item");
    newMapMenuButton.textContent = "New Map";

    saveMapMenuButton.classList.add("menu-item");
    saveMapMenuButton.textContent = "Save Map";

    loadMapMenuButton.classList.add("menu-item-with-submenu");
    loadMapMenuButton.textContent = "Load Map";

    optionsMenuButton.classList.add(
        "menu-item",
        "menu-item-disabled"
    );
    optionsMenuButton.textContent = "Options";
    optionsMenuButton.disabled = true;


    // ========================================================
    // LOAD SUBMENU CONFIGURATION
    // ========================================================

    loadSubmenu.classList.add("load-submenu");

    loadFromFileMenuButton.classList.add("menu-item");
    loadFromFileMenuButton.textContent = "Load from File";

    loadFromUrlMenuButton.classList.add("menu-item");
    loadFromUrlMenuButton.textContent = "Load from URL";

    loadSubmenu.appendChild(loadFromFileMenuButton);
    loadSubmenu.appendChild(loadFromUrlMenuButton);

    loadMapMenuButton.appendChild(loadSubmenu);


    // ========================================================
    // MENU ASSEMBLY
    // ========================================================

    menuPanel.appendChild(newMapMenuButton);
    menuPanel.appendChild(saveMapMenuButton);
    menuPanel.appendChild(loadMapMenuButton);
    menuPanel.appendChild(optionsMenuButton);

    menuControl.appendChild(menuButton);
    menuControl.appendChild(menuPanel);

    document.body.appendChild(menuControl);


    // ========================================================
    // NEW MAP DIALOG CONFIGURATION
    // ========================================================

    newMapOverlay.classList.add("new-map-overlay");
    newMapOverlay.style.display = "none";

    newMapDialog.classList.add("new-map-dialog");

    newMapTitle.textContent = "Create New Map?";

    newMapMessage.textContent =
        "Your current map will be discarded.";

    newMapButtons.classList.add("new-map-buttons");

    saveAndNewButton.classList.add("new-map-save");
    saveAndNewButton.textContent = "Save";

    newWithoutSavingButton.classList.add("new-map-discard");
    newWithoutSavingButton.textContent = "Don't Save";

    cancelNewMapButton.classList.add("new-map-cancel");
    cancelNewMapButton.textContent = "Cancel";

    newMapButtons.appendChild(saveAndNewButton);
    newMapButtons.appendChild(newWithoutSavingButton);
    newMapButtons.appendChild(cancelNewMapButton);

    newMapDialog.appendChild(newMapTitle);
    newMapDialog.appendChild(newMapMessage);
    newMapDialog.appendChild(newMapButtons);

    newMapOverlay.appendChild(newMapDialog);

    document.body.appendChild(newMapOverlay);


    // ========================================================
    // LOAD FROM URL DIALOG CONFIGURATION
    // ========================================================

    loadUrlOverlay.classList.add("load-url-overlay");
    loadUrlOverlay.style.display = "none";

    loadUrlDialog.classList.add("load-url-dialog");

    loadUrlTitle.textContent = "Load Map from URL";

    loadUrlMessage.textContent =
        "Enter the web address of a Roombound map JSON file.";

    loadUrlInput.type = "url";
    loadUrlInput.placeholder =
        "https://example.com/roombound-map.json";
    loadUrlInput.setAttribute(
        "aria-label",
        "Map URL"
    );

    loadUrlButtons.classList.add("load-url-buttons");

    loadUrlButton.classList.add("load-url-load");
    loadUrlButton.textContent = "Load";

    cancelLoadUrlButton.classList.add("load-url-cancel");
    cancelLoadUrlButton.textContent = "Cancel";

    loadUrlHelpButton.classList.add("load-url-help");
    loadUrlHelpButton.textContent = "Help";

    loadUrlButtons.appendChild(loadUrlButton);
    loadUrlButtons.appendChild(cancelLoadUrlButton);
    loadUrlButtons.appendChild(loadUrlHelpButton);

    loadUrlDialog.appendChild(loadUrlTitle);
    loadUrlDialog.appendChild(loadUrlMessage);
    loadUrlDialog.appendChild(loadUrlInput);
    loadUrlDialog.appendChild(loadUrlButtons);

    loadUrlOverlay.appendChild(loadUrlDialog);

    document.body.appendChild(loadUrlOverlay);


    // ========================================================
    // MENU VISIBILITY
    // ========================================================

    // Closes the hamburger menu.
    function closeMenu() {
        menuPanel.style.display = "none";
        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    // Opens or closes the hamburger menu.
    function toggleMenu() {
        const isOpen =
            menuPanel.style.display === "block";

        if (isOpen) {
            closeMenu();
            return;
        }

        menuPanel.style.display = "block";

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    // ========================================================
    // NEW MAP HELPERS
    // ========================================================

    // Closes the New Map confirmation dialog.
    function closeNewMapDialog() {
        newMapOverlay.style.display = "none";
    }

    // Refreshes the application to create a new map.
    function refreshForNewMap() {
        window.location.reload();
    }

    // Opens the New Map confirmation dialog or immediately creates a
    // new map when the current map is empty.
    function openNewMapDialog() {
        closeMenu();

        if (!hasMapContent()) {
            refreshForNewMap();
            return;
        }

        newMapOverlay.style.display = "flex";
    }


    // ========================================================
    // LOAD FROM URL HELPERS
    // ========================================================

    // Closes the Load-from-URL dialog.
    function closeLoadUrlDialog() {
        loadUrlOverlay.style.display = "none";
    }

    // Opens the Load-from-URL dialog.
    function openLoadUrlDialog() {
        loadUrlInput.value = "";
        loadUrlOverlay.style.display = "flex";
        loadUrlInput.focus();
    }


    // ========================================================
    // MENU EVENTS
    // ========================================================

    menuButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
            toggleMenu();
        }
    );

    menuPanel.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
        }
    );

    saveMapMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            saveMap();
        }
    );

    loadFromFileMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            loadMap();
        }
    );

    loadFromUrlMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            openLoadUrlDialog();
        }
    );


    // ========================================================
    // NEW MAP EVENTS
    // ========================================================

    newMapMenuButton.addEventListener(
        "click",
        openNewMapDialog
    );

    saveAndNewButton.addEventListener(
        "click",
        () => {
            saveMap();

            // Give the browser a moment to begin the file download before
            // refreshing the page.
            setTimeout(() => {
                refreshForNewMap();
            }, 100);
        }
    );

    newWithoutSavingButton.addEventListener(
        "click",
        refreshForNewMap
    );

    cancelNewMapButton.addEventListener(
        "click",
        closeNewMapDialog
    );

    // Clicking the dark overlay outside the dialog cancels the operation.
    newMapOverlay.addEventListener(
        "click",
        (event) => {
            if (event.target !== newMapOverlay) {
                return;
            }

            closeNewMapDialog();
        }
    );


    // ========================================================
    // LOAD FROM URL EVENTS
    // ========================================================

    loadUrlButton.addEventListener(
        "click",
        async () => {
            const url = loadUrlInput.value.trim();

            if (!url) {
                alert("Please enter a map URL.");
                return;
            }

            try {
                await loadMapFromUrl(url);
                closeLoadUrlDialog();
            } catch (error) {
                alert(
                    "Could not load the map from that URL.\n\n" +
                    error.message
                );
            }
        }
    );

    cancelLoadUrlButton.addEventListener(
        "click",
        closeLoadUrlDialog
    );

    loadUrlHelpButton.addEventListener(
        "click",
        () => {
            window.open(
                "load-url-tutorial.html",
                "_blank",
                "noopener"
            );
        }
    );

    loadUrlInput.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            loadUrlButton.click();
        }
    );

    loadUrlOverlay.addEventListener(
        "click",
        (event) => {
            if (event.target !== loadUrlOverlay) {
                return;
            }

            closeLoadUrlDialog();
        }
    );


    // ========================================================
    // DOCUMENT EVENTS
    // ========================================================

    // Close the menu when clicking elsewhere on the page.
    document.addEventListener(
        "click",
        () => {
            closeMenu();
        }
    );
}