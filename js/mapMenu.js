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
//   - Create Share Link dialog.
//   - Dispatching Save/Load operations through callbacks supplied
//     by main.js.
//   - Dispatching map operations through callbacks supplied by main.js.
//
// This module owns the menu UI and user interaction. Map operations remain
// owned by their respective application modules.//

// ============================================================
// IMPORTS
// ============================================================

// Map saving, loading, and URL validation.
// If working on the Roombound JSON format, file persistence,
// URL loading, or map validation, inspect:
//   ./mapStorage.js
import {
    saveMap,
    saveMapAs,
    loadMap,
    validateMapUrl
} from "./mapStorage.js";

// Options window.
// If working on the Options UI, inspect:
//   ./optionsWindow.js
import {
    openOptionsWindow
} from "./optionsWindow.js";

// Creates and initializes the hamburger menu and its associated dialogs.
export function initializeMapMenu({
    map,
    refreshForNewMap
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

    // Save As button.
    const saveMapAsMenuButton = document.createElement("button");

    // Load Map menu item that reveals the Load submenu on hover.
    const loadMapMenuButton = document.createElement("div");

    // Load-from-URL submenu.
    const loadSubmenu = document.createElement("div");
    const loadFromFileMenuButton = document.createElement("button");
    const loadFromUrlMenuButton = document.createElement("button");

    // Create Share Link menu button.
    const createShareLinkMenuButton = document.createElement("button");

    // Options
    const optionsMenuButton = document.createElement("button");

    // General Help button.
    const helpMenuButton = document.createElement("button");


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
    // CREATE SHARE LINK DIALOG ELEMENTS
    // ========================================================

    // Create-share-link dialog overlay.
    const createShareLinkOverlay =
        document.createElement("div");

    // Create-share-link dialog.
    const createShareLinkDialog =
        document.createElement("div");

    // Dialog title.
    const createShareLinkTitle =
        document.createElement("h2");

    // Dialog message.
    const createShareLinkMessage =
        document.createElement("p");

    // URL input.
    const createShareLinkInput =
        document.createElement("input");

    // Generated share link.
    const createShareLinkResult =
        document.createElement("a");

    // Dialog buttons.
    const createShareLinkButtons =
        document.createElement("div");

    // Create button.
    const createShareLinkButton =
        document.createElement("button");

    // Cancel button.
    const cancelCreateShareLinkButton =
        document.createElement("button");

    // Help button.
    const createShareLinkHelpButton =
        document.createElement("button");


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

    saveMapAsMenuButton.classList.add("menu-item");
    saveMapAsMenuButton.textContent = "Save As";

    loadMapMenuButton.classList.add("menu-item-with-submenu");
    loadMapMenuButton.textContent = "Load Map";

    createShareLinkMenuButton.classList.add("menu-item");
    createShareLinkMenuButton.textContent = "Create Share Link";

    optionsMenuButton.classList.add(
        "menu-item",
        "menu-item-separated"
    );

    optionsMenuButton.textContent = "Options";

    helpMenuButton.classList.add("menu-item");
    helpMenuButton.textContent = "Help";


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
    menuPanel.appendChild(saveMapAsMenuButton);
    menuPanel.appendChild(loadMapMenuButton);
    menuPanel.appendChild(createShareLinkMenuButton);

    menuPanel.appendChild(optionsMenuButton);

    menuPanel.appendChild(helpMenuButton);

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
    // CREATE SHARE LINK DIALOG CONFIGURATION
    // ========================================================

    createShareLinkOverlay.classList.add(
        "create-share-link-overlay"
    );

    createShareLinkOverlay.style.display = "none";

    createShareLinkDialog.classList.add(
        "create-share-link-dialog"
    );

    createShareLinkTitle.textContent =
        "Create Share Link";

    createShareLinkMessage.textContent =
        "Enter the web address of a Roombound map JSON file.";

    createShareLinkInput.type = "url";
    createShareLinkInput.placeholder =
        "https://example.com/roombound-map.json";
    createShareLinkInput.setAttribute(
        "aria-label",
        "Map URL"
    );

    createShareLinkResult.textContent =
        "Roombound Map URL";

    createShareLinkResult.setAttribute(
        "aria-label",
        "Roombound share link"
    );

    createShareLinkResult.style.display =
        "none";

    createShareLinkButtons.classList.add(
        "create-share-link-buttons"
    );

    createShareLinkButton.classList.add(
        "create-share-link-create"
    );
    createShareLinkButton.textContent =
        "Create Share Link";

    cancelCreateShareLinkButton.classList.add(
        "create-share-link-cancel"
    );
    cancelCreateShareLinkButton.textContent =
        "Cancel";

    createShareLinkHelpButton.classList.add(
        "create-share-link-help"
    );
    createShareLinkHelpButton.textContent =
        "Help";

    createShareLinkButtons.appendChild(
        createShareLinkButton
    );

    createShareLinkButtons.appendChild(
        cancelCreateShareLinkButton
    );

    createShareLinkButtons.appendChild(
        createShareLinkHelpButton
    );

    createShareLinkDialog.appendChild(
        createShareLinkTitle
    );

    createShareLinkDialog.appendChild(
        createShareLinkMessage
    );

    createShareLinkDialog.appendChild(
        createShareLinkInput
    );

    createShareLinkDialog.appendChild(
        createShareLinkResult
    );

    createShareLinkDialog.appendChild(
        createShareLinkButtons
    );

    createShareLinkOverlay.appendChild(
        createShareLinkDialog
    );

    document.body.appendChild(
        createShareLinkOverlay
    );


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

    // Opens the New Map confirmation dialog or immediately creates a
    // new map when the current map is empty.
    function openNewMapDialog() {
        closeMenu();

    if (
        map.rooms.length === 0 &&
        map.connections.length === 0
    ) {
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
    
    // Clears the map URL while preserving the current page.
    function clearMapUrl() {
        window.history.pushState(
            {},
            "",
            window.location.pathname
        );
    }



    // ========================================================
    // CREATE SHARE LINK HELPERS
    // ========================================================

    // Closes the Create Share Link dialog.
    function closeCreateShareLinkDialog() {
        createShareLinkOverlay.style.display = "none";
    }

    function openCreateShareLinkDialog() {
        createShareLinkInput.value = "";
        createShareLinkResult.removeAttribute("href");
        createShareLinkResult.style.display = "none";

        createShareLinkButton.textContent =
            "Create Share Link";

        shareLinkReady = false;

        createShareLinkOverlay.style.display = "flex";
        createShareLinkInput.focus();
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
            saveMap(map);
        }
    );

    saveMapAsMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            saveMapAs(map);
        }
    );

    loadFromFileMenuButton.addEventListener(
        "click",
        async () => {
            closeMenu();

            const loaded =
                await loadMap(map);

            if (loaded) {
                clearMapUrl();
            }
        }
    );

    loadFromUrlMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            openLoadUrlDialog();
        }
    );

    createShareLinkMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            openCreateShareLinkDialog();
        }
    );

    optionsMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();
            openOptionsWindow();
        }
    );

    helpMenuButton.addEventListener(
        "click",
        () => {
            closeMenu();

            window.open(
                "help.html",
                "_blank",
                "noopener"
            );
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
            closeNewMapDialog();
            saveMap();

            // Give the browser a moment to begin the file download before
            // creating the new map.
            setTimeout(() => {
                refreshForNewMap();
            }, 100);
        }
    );

    newWithoutSavingButton.addEventListener(
        "click",
        () => {
            closeNewMapDialog();
            refreshForNewMap();
        }
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
        () => {
            const url = loadUrlInput.value.trim();

            if (!url) {
                alert("Please enter a map URL.");
                return;
            }

            const currentUrl =
                new URL(window.location.href);

            currentUrl.search = "";
            currentUrl.hash = "";

            currentUrl.searchParams.set(
                "map",
                url
            );

            window.location.href =
                currentUrl.toString();
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
                "help.html#load-from-url",
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
    // CREATE SHARE LINK EVENTS
    // ========================================================

    let shareLinkReady = false;

    createShareLinkButton.addEventListener(
        "click",
        async () => {
            if (shareLinkReady) {
                try {
                    await navigator.clipboard.writeText(
                        createShareLinkResult.href
                    );

                    createShareLinkButton.textContent =
                        "Copied!";

                    setTimeout(() => {
                        createShareLinkButton.textContent =
                            "Copy URL";
                    }, 1500);
                } catch (error) {
                    alert(
                        "Could not copy the share link.\n\n" +
                        error.message
                    );
                }

                return;
            }

            const url =
                createShareLinkInput.value.trim();

            if (!url) {
                alert("Please enter a map URL.");
                return;
            }

            try {
                await validateMapUrl(url);

                createShareLinkResult.href =
                    "https://neain.github.io/Roombound/?map=" +
                    url;

                createShareLinkResult.style.display =
                    "block";

                createShareLinkButton.textContent =
                    "Copy URL";

                shareLinkReady = true;
            } catch (error) {
                alert(
                    "Could not create a share link.\n\n" +
                    error.message
                );
            }
        }
    );

    cancelCreateShareLinkButton.addEventListener(
        "click",
        closeCreateShareLinkDialog
    );

    createShareLinkHelpButton.addEventListener(
        "click",
        () => {
            window.open(
                "help.html#create-share-link",
                "_blank",
                "noopener"
            );
        }
    );

    createShareLinkInput.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            createShareLinkButton.click();
        }
    );

    createShareLinkOverlay.addEventListener(
        "click",
        (event) => {
            if (event.target !== createShareLinkOverlay) {
                return;
            }

            closeCreateShareLinkDialog();
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