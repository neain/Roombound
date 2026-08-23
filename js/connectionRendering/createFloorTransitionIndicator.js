// Creates the reusable visual indicator for a connection that changes floors.
//
// The indicator consists of an up/down arrow and a three-step stair icon.
// It is intentionally generated entirely in SVG so it scales naturally with
// the map zoom level.
export function createFloorTransitionIndicator(
    x,
    y,
    isUp,
    zoom
) {
    const group = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    group.classList.add(
        "floor-transition-indicator"
    );

    group.setAttribute(
        "transform",
        `translate(${-15 * zoom}, ${-10 * zoom})`
    );

    const arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );

    const arrowOffset =
    12 * zoom;

    arrow.setAttribute(
        "x",
        isUp
            ? x + arrowOffset
            : x - arrowOffset
    );

    arrow.setAttribute(
        "y",
        y
    );

    arrow.setAttribute(
        "text-anchor",
        "middle"
    );

    arrow.setAttribute(
        "dominant-baseline",
        "middle"
    );

    arrow.setAttribute(
        "font-size",
        `${14 * zoom}`
    );

    arrow.setAttribute(
        "font-weight",
        "bold"
    );

    arrow.setAttribute(
        "fill",
        "#000"
    );

    arrow.textContent =
        isUp ? "↑" : "↓";

    group.appendChild(arrow);


    // --------------------------------------------------------
    // Stair icon
    // --------------------------------------------------------

    const stepSize =
        4 * zoom;

    const stairGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    stairGroup.setAttribute(
        "transform",
        `translate(${x - stepSize}, ${y - stepSize})`
    );

    // Upper step.
    const upperStep = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );

    upperStep.setAttribute(
        "x",
        stepSize
    );

    upperStep.setAttribute(
        "y",
        0
    );

    upperStep.setAttribute(
        "width",
        stepSize
    );

    upperStep.setAttribute(
        "height",
        stepSize
    );

    upperStep.setAttribute(
        "fill",
        "#000"
    );

    // Lower step.
    const lowerStepLeft = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );

    lowerStepLeft.setAttribute(
        "x",
        0
    );

    lowerStepLeft.setAttribute(
        "y",
        stepSize
    );

    lowerStepLeft.setAttribute(
        "width",
        stepSize
    );

    lowerStepLeft.setAttribute(
        "height",
        stepSize
    );

    lowerStepLeft.setAttribute(
        "fill",
        "#000"
    );

    const lowerStepRight = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
    );

    lowerStepRight.setAttribute(
        "x",
        stepSize
    );

    lowerStepRight.setAttribute(
        "y",
        stepSize
    );

    lowerStepRight.setAttribute(
        "width",
        stepSize
    );

    lowerStepRight.setAttribute(
        "height",
        stepSize
    );

    lowerStepRight.setAttribute(
        "fill",
        "#000"
    );

    stairGroup.appendChild(upperStep);
    stairGroup.appendChild(lowerStepLeft);
    stairGroup.appendChild(lowerStepRight);

    group.appendChild(stairGroup);

    return group;
}