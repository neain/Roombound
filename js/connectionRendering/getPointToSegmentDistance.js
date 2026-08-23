// Returns the shortest distance between a point and a line segment.
export function getPointToSegmentDistance(
    pointX,
    pointY,
    startX,
    startY,
    endX,
    endY
) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (deltaX === 0 && deltaY === 0) {
        return Math.hypot(
            pointX - startX,
            pointY - startY
        );
    }

    const projection =
        (
            (pointX - startX) * deltaX +
            (pointY - startY) * deltaY
        ) /
        (deltaX * deltaX + deltaY * deltaY);

    const position =
        Math.max(
            0,
            Math.min(1, projection)
        );

    const closestX =
        startX + position * deltaX;

    const closestY =
        startY + position * deltaY;

    return Math.hypot(
        pointX - closestX,
        pointY - closestY
    );
}