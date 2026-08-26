// ============================================================
// CONNECTION RENDERING FUNCTIONS
// ============================================================

// Renders every connection currently visible on the map.
//
// Clears the existing connection SVG layer, creates the required arrow
// definitions, calculates connection geometry, draws connection lines,
// renders floor-transition indicators, and displays selection markers
// for the currently selected connection or endpoint.
import {
    renderConnections as renderConnectionsImpl
} from "./connectionRendering/renderConnections.js";

// Finds connections whose rendered line passes within the supplied pixel
// range of a given map/SVG coordinate.
//
// Only connections visible on the current floor are considered. Matching
// connections are returned from closest to farthest so the first result
// represents the most likely connection intended by the user.
import {
    getConnectionsNearPoint as getConnectionsNearPointImpl
} from "./connectionRendering/getConnectionsNearPoint.js";


// Calculates the shortest distance between a point and a line segment.
//
// Used by connection hit testing to determine how close the user's click
// or pointer position is to a rendered connection line.
import {
    getPointToSegmentDistance as getPointToSegmentDistanceImpl
} from "./connectionRendering/getPointToSegmentDistance.js";


// Builds the connection occupancy data used by the renderer.
//
// Creates a lookup for every room that records which connections occupy
// each possible connection side. Each connection endpoint is registered
// independently, allowing one-sided connections with no room B endpoint.
import {
    analyzeConnections as analyzeConnectionsImpl
} from "./connectionRendering/analyzeConnections.js";


// Generates the rendered SVG coordinates for every connection endpoint.
//
// Uses the connection occupancy data to determine each connection's
// position along its room side, producing a lookup of calculated points
// that can be reused while rendering and hit testing connections.
import {
    getConnectionPoints as getConnectionPointsImpl
} from "./connectionRendering/getConnectionPoints.js";


// Calculates the fallback position for a connection endpoint that does
// not resolve to another room.
//
// Starts at the normal connection point on the supplied room side and
// extends it outward by the configured distance so unresolved connections
// can still be rendered and selected.
import {
    getFreeConnectionPoint as getFreeConnectionPointImpl
} from "./connectionRendering/getFreeConnectionPoint.js";


// Calculates the exact SVG coordinates for a single connection endpoint.
//
// Determines the room's position and dimensions at the current zoom level,
// then places the endpoint according to its side, position among other
// connections on that side, and optional outward distance.
import {
    getConnectionPoint as getConnectionPointImpl
} from "./connectionRendering/getConnectionPoint.js";


// ============================================================
// CONNECTION SELECTION HELPERS
// ============================================================

// Sets the connection currently selected by the connection editor.
//
// Passing a connection makes it the active highlighted connection; passing
// a falsy value clears the current selection.
import {
    setSelectedConnection as setSelectedConnectionImpl,
    clearSelectedConnection as clearSelectedConnectionImpl,
    setSelectedConnectionEndpoint as setSelectedConnectionEndpointImpl,
    clearSelectedConnectionEndpoint as clearSelectedConnectionEndpointImpl
} from "./connectionRendering/connectionHelper.js";


// ============================================================
// CONNECTION RENDERING CONFIGURATION
// ============================================================

// Size of the SVG arrowhead markers used on connection lines.
export const arrowSize = 4;

// ============================================================
// CONNECTION RENDERING STATE
// ============================================================

// The connection currently selected by the connection editor.
let selectedConnection = null;

// The connection endpoint currently selected by the connection editor.
let selectedEndpoint = null;

// Returns the connection currently selected by the connection editor.
export function getSelectedConnection() {
    return selectedConnection;
}

// Sets the connection currently selected by the connection editor.
export function updateSelectedConnection(connection) {
    selectedConnection = connection || null;
}

// Returns the connection endpoint currently selected by the connection editor.
export function getSelectedConnectionEndpoint() {
    return selectedEndpoint;
}

// Sets the connection endpoint currently selected by the connection editor.
export function updateSelectedConnectionEndpoint(endpoint) {
    selectedEndpoint = endpoint;
}

// ============================================================
// CONNECTION RENDERING ROUTER
// ============================================================

// Routes requests to the connection rendering implementation.
//
// This router is the public interface for the connection rendering system.
// Rendering functions should request other rendering functions through
// this router rather than importing them directly.

export function renderConnections(...args) {
    return renderConnectionsImpl(...args);
}

export function getConnectionsNearPoint(...args) {
    return getConnectionsNearPointImpl(...args);
}

export function getPointToSegmentDistance(...args) {
    return getPointToSegmentDistanceImpl(...args);
}

export function analyzeConnections(...args) {
    return analyzeConnectionsImpl(...args);
}

export function getConnectionPoints(...args) {
    return getConnectionPointsImpl(...args);
}

export function getFreeConnectionPoint(...args) {
    return getFreeConnectionPointImpl(...args);
}

export function getConnectionPoint(...args) {
    return getConnectionPointImpl(...args);
}

// ============================================================
// CONNECTION SELECTION ROUTER
// ============================================================
// Routes requests to change the currently selected connection.
export function setSelectedConnection(...args) {
    return setSelectedConnectionImpl(...args);
}
// Routes requests to clear the currently selected connection.
export function clearSelectedConnection(...args) {
    return clearSelectedConnectionImpl(...args);
}
// Routes requests to change the currently selected connection endpoint.
export function setSelectedConnectionEndpoint(...args) {
    return setSelectedConnectionEndpointImpl(...args);
}
// Routes requests to clear the currently selected connection endpoint.
export function clearSelectedConnectionEndpoint(...args) {
    return clearSelectedConnectionEndpointImpl(...args);
}