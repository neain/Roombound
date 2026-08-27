// ============================================================
// MAP / GRID UTILITIES
// ============================================================
//
// This file contains shared constants and coordinate-conversion helpers
// used throughout Roombound.
//
// Coordinate systems used here:
//   Grid coordinates = logical map positions used by rooms/connections.
//   World pixels     = pixel positions inside the map world.
//   Screen pixels    = positions after zoom has been applied.
//
// If working on map dimensions, grid spacing, coordinate conversion, or
// looking up rooms by ID, this is the file to inspect.



// ============================================================
// MAP CONFIGURATION
// ============================================================


// Distance between adjacent grid positions in unzoomed world pixels.
export const GRID_SIZE = 15;


// Total size of the map world in unzoomed pixels.
export const MAP_SIZE = 10020;


// The pixel coordinate at the center of the map world.
// The map uses its center as the origin for grid coordinates.
export const MAP_ORIGIN = MAP_SIZE / 2;

export const CONNECTION_CLICK_RANGE = 2;


// Valid attachment sides for room connection endpoints.
export const CONNECTION_SIDES = [
    {
        value: "NONE",
        label: "None"
    },
    {
        value: "N",
        label: "North"
    },
    {
        value: "E",
        label: "East"
    },
    {
        value: "S",
        label: "South"
    },
    {
        value: "W",
        label: "West"
    },
    {
        value: "NE",
        label: "Northeast"
    },
    {
        value: "NW",
        label: "Northwest"
    },
    {
        value: "SE",
        label: "Southeast"
    },
    {
        value: "SW",
        label: "Southwest"
    }
];



// ============================================================
// COORDINATE CONVERSION
// ============================================================


// Converts a grid-coordinate value into a pixel distance.
//
// Input:
//   value = grid-coordinate distance from the origin
//   zoom  = current map zoom level
//
// Output:
//   Pixel distance from the origin, scaled for the current zoom.
export function gridToPixels(value, zoom = 1) {
    return value * GRID_SIZE * zoom;
}


// Converts a grid-coordinate value into an absolute position within the
// map world.
//
// Unlike gridToPixels(), this includes MAP_ORIGIN so that grid coordinate 0
// corresponds to the center of the map rather than the top-left corner.
//
// Input:
//   value = grid-coordinate position
//   zoom  = current map zoom level
//
// Output:
//   Absolute pixel position within the map world.
export function gridToWorldPixels(value, zoom = 1) {
    return MAP_ORIGIN * zoom + gridToPixels(value, zoom);
}


// Converts a pixel distance back into the nearest grid-coordinate value.
//
// Input:
//   value = pixel distance from the grid origin
//   zoom  = current map zoom level
//
// Output:
//   Rounded grid-coordinate value.
export function pixelsToGrid(value, zoom = 1) {
    return Math.round(
        value / (GRID_SIZE * zoom)
    );
}



// ============================================================
// MAP DATA LOOKUP
// ============================================================


// Finds a room in the map data by its unique room ID.
//
// Returns the matching room object, or undefined if no room has that ID.
export function getRoom(map, roomID) {
    return map.rooms.find(
        (room) => room.roomID === roomID
    );
}