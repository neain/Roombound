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

import {
    startEditorDragging
} from "./editorWindowDragging.js";

// ============================================================
// GROUP OPTIONS WINDOW
// ============================================================

// Opens the grouping-options window and resolves with the selected options
// when the user confirms.
export function openCreateGroupOptionsWindow() {
    return new Promise(
        (resolve) => {
            const windowElement =
                document.createElement("div");

            windowElement.classList.add(
                "room-editor"
            );

            // ------------------------------------------------
            // Window header
            // ------------------------------------------------

            const header =
                document.createElement("div");

            header.classList.add(
                "room-editor-header"
            );

            const title =
                document.createElement("span");

            title.textContent =
                "Create Group";

            header.appendChild(
                title
            );

            windowElement.appendChild(
                header
            );

            // ------------------------------------------------
            // Window content
            // ------------------------------------------------

            const content =
                document.createElement("div");

            content.classList.add(
                "room-editor-content"
            );

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

            startEditorDragging(
                windowElement,
                header
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
                    windowElement.remove();

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

            windowElement.appendChild(
                content
            );

            document.body.appendChild(
                windowElement
            );

            // Give the OK button focus so pressing Enter immediately accepts
            // the default options.
            okButton.focus();
        }
    );
}