import {
    getConnectionPoint
} from "../connectionRenderer.js";

import {
    gridToPixels
} from "../mapUtils.js";

// Returns the unresolved endpoint position extending outward from a room.
export function getFreeConnectionPoint(
    room,
    side,
    zoom
) {
    const point =
        getConnectionPoint(
            room,
            side,
            0,
            1,
            0,
            zoom
        );

    const distance =
        gridToPixels(
            3,
            zoom
        );

    switch (side) {
        case "N":
            point.y -= distance;
            break;

        case "E":
            point.x += distance;
            break;

        case "S":
            point.y += distance;
            break;

        case "W":
            point.x -= distance;
            break;

        case "NE":
            point.x += distance;
            point.y -= distance;
            break;

        case "NW":
            point.x -= distance;
            point.y -= distance;
            break;

        case "SE":
            point.x += distance;
            point.y += distance;
            break;

        case "SW":
            point.x -= distance;
            point.y += distance;
            break;
    }

    return point;
}