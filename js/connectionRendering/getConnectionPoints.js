import {
    getRoom
} from "../mapUtils.js";

import {
    getConnectionPoint
} from "../connectionRenderer.js";

// ============================================================
// CONNECTION POINT GENERATION
// ============================================================

// Generates the actual SVG coordinates for every connection position on
// every side of every room.
export function getConnectionPoints(
    map,
    connectionData,
    zoom = 1
) {
    const points = new Map();

    for (const [roomID, sides] of connectionData) {
        const room =
            getRoom(
                map,
                roomID
            );

        points.set(
            roomID,
            {
                N: sides.N.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "N",
                            index,
                            sides.N.length,
                            0,
                            zoom
                        )
                ),

                E: sides.E.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "E",
                            index,
                            sides.E.length,
                            0,
                            zoom
                        )
                ),

                S: sides.S.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "S",
                            index,
                            sides.S.length,
                            0,
                            zoom
                        )
                ),

                W: sides.W.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "W",
                            index,
                            sides.W.length,
                            0,
                            zoom
                        )
                ),

                NE: sides.NE.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "NE",
                            index,
                            sides.NE.length,
                            0,
                            zoom
                        )
                ),

                NW: sides.NW.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "NW",
                            index,
                            sides.NW.length,
                            0,
                            zoom
                        )
                ),

                SE: sides.SE.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "SE",
                            index,
                            sides.SE.length,
                            0,
                            zoom
                        )
                ),

                SW: sides.SW.map(
                    (_, index) =>
                        getConnectionPoint(
                            room,
                            "SW",
                            index,
                            sides.SW.length,
                            0,
                            zoom
                        )
                ),

                NONE: sides.NONE.map(
                    (_, index) =>
                        getConnectionPoint(room, "NONE",index, sides.NONE.length, 0, zoom)
                )
            }
        );
    }

    return points;
}