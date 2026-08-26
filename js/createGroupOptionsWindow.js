// ============================================================
// GROUP OPTIONS WINDOW
// ============================================================
//
// Provides the options window displayed before creating a combined group.
//
// The caller supplies no grouping logic. This module only presents the
// available options and resolves with the user's selections when OK is
// pressed.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
    createWindow
} from "./window.js";


// ============================================================
// GROUP OPTIONS WINDOW
// ============================================================

// Opens the grouping-options window and resolves with the selected options
// when the user confirms. Closing the window resolves with null.
export function openCreateGroupOptionsWindow() {
    return new Promise(
        (resolve) => {
            let groupOptionsWindow = null;

            function closeWindow() {
                if (!groupOptionsWindow) {
                    return;
                }

                groupOptionsWindow.remove();
                groupOptionsWindow = null;

                resolve(null);
            }

            groupOptionsWindow =
                createWindow(
                    "Create Group",
                    closeWindow
                );

            groupOptionsWindow.element.classList.add(
                "room-editor"
            );

            const content =
                groupOptionsWindow.content;

            // ------------------------------------------------
            // Window content
            // ------------------------------------------------

            const hideLabelsLabel =
                document.createElement("label");

            const hideLabelsCheckbox =
                document.createElement("input");

            hideLabelsCheckbox.type =
                "checkbox";

            hideLabelsCheckbox.checked =
                true;

            hideLabelsLabel.appendChild(
                hideLabelsCheckbox
            );

            hideLabelsLabel.appendChild(
                document.createTextNode(
                    " Hide room labels"
                )
            );

            content.appendChild(
                hideLabelsLabel
            );

            const moveNotesLabel =
                document.createElement("label");

            const moveNotesCheckbox =
                document.createElement("input");

            moveNotesCheckbox.type =
                "checkbox";

            moveNotesCheckbox.checked =
                true;

            moveNotesLabel.appendChild(
                moveNotesCheckbox
            );

            moveNotesLabel.appendChild(
                document.createTextNode(
                    " Move notes from rooms to the new combined room"
                )
            );

            content.appendChild(
                moveNotesLabel
            );

            // ------------------------------------------------
            // OK button
            // ------------------------------------------------

            const okButton =
                document.createElement("button");

            okButton.textContent =
                "OK";

            okButton.classList.add(
                "room-editor-save"
            );

            okButton.addEventListener(
                "click",
                () => {
                    groupOptionsWindow.remove();
                    groupOptionsWindow = null;

                    resolve({
                        hideRoomLabels:
                            hideLabelsCheckbox.checked,

                        moveNotes:
                            moveNotesCheckbox.checked
                    });
                }
            );

            content.appendChild(
                okButton
            );

            // Give the OK button focus so pressing Enter immediately accepts
            // the default options.
            okButton.focus();
        }
    );
}