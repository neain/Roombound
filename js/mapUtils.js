// Shared map/grid utilities: GRID_SIZE, gridToPixels(), pixelsToGrid(), getRoom().

export const GRID_SIZE = 15;

export function gridToPixels(value) {
    return value * GRID_SIZE;
}

export function pixelsToGrid(value) {
    return Math.round(value / GRID_SIZE);
}

export function getRoom(map, roomID) {
    return map.rooms.find(
        (room) => room.roomID === roomID
    );
}