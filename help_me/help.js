// ============================================================
// ROOMBOUND HELP PAGE
// ============================================================
//
// Builds the page navigation from documentation headings.
//
// Any <h2> or <h3> inside #help-content automatically appears
// in the floating "PAGE CONTENTS" navigation.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const helpContent = document.getElementById("help-content");
    const navigationList = document.getElementById("navigation-list");

    if (!helpContent || !navigationList) {
        return;
    }

    const headings = helpContent.querySelectorAll("h2, h3");

    headings.forEach((heading, index) => {
        const id = heading.id || `section-${index + 1}`;

        heading.id = id;

        const listItem = document.createElement("li");
        const link = document.createElement("a");

        link.href = `#${id}`;
        link.textContent = heading.textContent;

        if (heading.tagName === "H3") {
            link.style.paddingLeft = "20px";
            link.style.fontSize = "11px";
        }

        listItem.appendChild(link);
        navigationList.appendChild(listItem);
    });
});