// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid(), getRoom().

export const GRID_SIZE = 15;
export const MAP_SIZE = 10020;
export const MAP_ORIGIN = MAP_SIZE / 2;

export function gridToPixels(value, zoom = 1) {
    return value * GRID_SIZE * zoom;
}

export function gridToWorldPixels(value, zoom = 1) {
    return MAP_ORIGIN * zoom + gridToPixels(value, zoom);
}

export function pixelsToGrid(value, zoom = 1) {
    return Math.round(
        value / (GRID_SIZE * zoom)
    );
}

export function getRoom(map, roomID) {
    return map.rooms.find(
        (room) => room.roomID === roomID
    );
}