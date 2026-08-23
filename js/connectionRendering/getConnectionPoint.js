import {
    gridToPixels,
    gridToWorldPixels
} from "../mapUtils.js";

// Calculates the exact SVG point for one connection on one side of a room.
export function getConnectionPoint(
    room,
    side,
    index = 0,
    count = 1,
    distance = 0,
    zoom = 1
) {
    const left =
        gridToWorldPixels(
            room.position.x,
            zoom
        );

    const top =
        gridToWorldPixels(
            room.position.y,
            zoom
        );

    const width =
        gridToPixels(
            room.size.width,
            zoom
        );

    const height =
        gridToPixels(
            room.size.height,
            zoom
        );

    const offset =
        gridToPixels(
            distance,
            zoom
        );

    const position =
        (index + 1) / (count + 1);

    switch (side) {
        case "N":
            return {
                x: left + width * position,
                y: top - offset
            };

        case "E":
            return {
                x: left + width + offset,
                y: top + height * position
            };

        case "S":
            return {
                x: left + width * position,
                y: top + height + offset
            };

        case "W":
            return {
                x: left - offset,
                y: top + height * position
            };

        case "NONE":
            return {
                x: left + width / 2,
                y: top + height / 2
            };

        case "NE":
            return {
                x: left + width,
                y: top
            };

        case "NW":
            return {
                x: left,
                y: top
            };

        case "SE":
            return {
                x: left + width,
                y: top + height
            };

        case "SW":
            return {
                x: left,
                y: top + height
            };

        default:
            return {
                x: left + width / 2,
                y: top + height / 2
            };
    }
}