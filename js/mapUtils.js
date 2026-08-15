// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid(), getRoom().

export const GRID_SIZE = 15;
export const MAP_SIZE = 10020;
export const MAP_ORIGIN = MAP_SIZE / 2;

export function gridToPixels(value) {
    return value * GRID_SIZE;
}

export function gridToWorldPixels(value) {
    return MAP_ORIGIN + gridToPixels(value);
}

export function pixelsToGrid(value) {
    return Math.round(value / GRID_SIZE);
}

export function getRoom(map, roomID) {
    return map.rooms.find(
        (room) => room.roomID === roomID
    );
}