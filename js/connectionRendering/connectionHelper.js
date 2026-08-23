import {
    updateSelectedConnection,
    updateSelectedConnectionEndpoint
} from "../connectionRenderer.js";

// Sets the connection currently highlighted by the editor.
export function setSelectedConnection(connection) {
    updateSelectedConnection(connection);
}


// Clears the currently highlighted connection.
export function clearSelectedConnection() {
    updateSelectedConnection(null);
}


// Sets the connection endpoint currently highlighted by the editor.
//
// endpoint must be either "A", "B", or null to clear the selection.
export function setSelectedConnectionEndpoint(
    connection,
    endpoint
) {
    if (!connection || !endpoint) {
        updateSelectedConnectionEndpoint(null);
        return;
    }

    updateSelectedConnectionEndpoint({
        connection,
        endpoint
    });
}


// Clears the currently highlighted connection endpoint.
export function clearSelectedConnectionEndpoint() {
    updateSelectedConnectionEndpoint(null);
}