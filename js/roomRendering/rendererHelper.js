// Room-rendering router. Shared room-rendering state is owned by the router
// and imported here so these helper functions can read and modify it.
import {
    hoverExceptions
} from "../roomRenderer.js";


// Builds the information shown when the mouse hovers over a room.
//
// Internal/structural room properties listed in hoverExceptions are omitted.
export function getRoomHoverInfo(room) {
    return Object.entries(room)
        .filter(([key]) => !hoverExceptions.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
}