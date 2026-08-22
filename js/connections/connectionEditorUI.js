// ============================================================
// ROOMBOUND CONNECTION EDITOR UI
// ============================================================
//
// UI construction for individual connection rows.
//
// This module deliberately does not import connectionEditor.js.
// The editor supplies callbacks for selection and editing behavior,
// keeping the editor as the coordinator while this module owns the DOM.
//

// ============================================================
// CONNECTION DISPLAY
// ============================================================

// Updates the visible connection controls from the current connection data.
export function updateConnectionElement(
    entry,
    connectionElement,
    callbacks
) {
    const connection = entry.connection;
    const roomAName = entry.roomA?.name || "Unconnected";
    const roomBName = entry.roomB?.name || "Unconnected";

    const roomASide =
        connection.roomAConnectionSide &&
        connection.roomAConnectionSide !== "NONE"
            ? ` (${connection.roomAConnectionSide})`
            : "";

    const roomBSide =
        connection.roomBConnectionSide &&
        connection.roomBConnectionSide !== "NONE"
            ? ` (${connection.roomBConnectionSide})`
            : "";

    connectionElement.innerHTML = "";

    const connectionOptions = document.createElement("div");

    connectionOptions.classList.add(
        "connection-editor-options"
    );

    // Prevent clicks on endpoint/direction controls from
    // re-selecting the parent connection.
    connectionOptions.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();
        }
    );

    const roomAButton =
        document.createElement("button");

    roomAButton.textContent =
        `${roomAName}${roomASide}`;

    roomAButton.classList.add(
        "connection-editor-endpoint"
    );

    const directionButton =
        document.createElement("button");

    directionButton.textContent =
        getDirectionSymbol(
            connection.directionTo
        );

    directionButton.classList.add(
        "connection-editor-direction"
    );

    const roomBButton =
        document.createElement("button");

    roomBButton.textContent =
        `${roomBSide}${roomBName}`;

    roomBButton.classList.add(
        "connection-editor-endpoint"
    );

    roomAButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            callbacks.selectConnection(
                entry,
                connectionElement
            );

            callbacks.selectConnectionEndpoint("A");
        }
    );

    directionButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            callbacks.selectConnection(
                entry,
                connectionElement
            );

            callbacks.selectConnectionDirection();
        }
    );

    roomBButton.addEventListener(
        "click",
        (event) => {
            event.stopPropagation();

            callbacks.selectConnection(
                entry,
                connectionElement
            );

            callbacks.selectConnectionEndpoint("B");
        }
    );

    connectionOptions.appendChild(roomAButton);
    connectionOptions.appendChild(directionButton);
    connectionOptions.appendChild(roomBButton);

    connectionElement.appendChild(connectionOptions);

    return connectionOptions;
}


// ============================================================
// CONNECTION DISPLAY HELPERS
// ============================================================

// Returns the visual direction symbol for a directionTo value.
export function getDirectionSymbol(directionTo) {
    if (directionTo === "A") {
        return "←";
    }

    if (directionTo === "both") {
        return "↔";
    }

    return "→";
}