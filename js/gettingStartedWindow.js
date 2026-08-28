// ============================================================
// GETTING STARTED WINDOW
// ============================================================
//
// Displays the introductory window shown when a map is empty.
//
// Application-specific content and behavior live here.
// Generic window behavior is provided by editorWindow.js.

import { createWindow } from "./window.js";
import {setShowGettingStarted} from "./options.js";

const DEMO_MAP_URL =
    "https://neain.github.io/Roombound/?map=https://raw.githubusercontent.com/neain/Roombound/refs/heads/main/Saved%20Maps%20-%20TEMP/roombound-map-Welcome-to-my-nightmare.json";

const HELP_URL = "help.html";


// ============================================================
// WINDOW CREATION
// ============================================================

// Opens the Getting Started window.
export function openGettingStarted() {

    let windowAPI;

    const backdrop = document.createElement("div");
    backdrop.classList.add("getting-started-backdrop");
    document.body.appendChild(backdrop);


    function closeWindow() {
        backdrop.remove();
        windowAPI.remove();        
    }

    backdrop.addEventListener(
        "click",
        closeWindow
    );


    windowAPI = createWindow(
        "Getting Started",
        closeWindow
    );

    const content = windowAPI.content;

    const heading = document.createElement("h2");
    heading.textContent = "Welcome to Roombound!";

    const intro = document.createElement("p");
    intro.textContent =
        "So, what is Roombound?";

    const description = document.createElement("p");
    description.textContent =
        "Basically, it's a place to keep track of rooms and locations " +
        "and how they connect to each other. I originally had tabletop " +
        "RPG exploration in mind, but there's no particular reason your " +
        "map has to be a dungeon. Buildings, cities, ships, complexes, " +
        "wilderness areas... if you can describe it as a collection of " +
        "connected places, Roombound can probably keep track of it.";

    const battleMap = document.createElement("p");
    battleMap.innerHTML =
        "<b>This isn't a battlemap.</b> Move rooms around wherever they " +
        "make the most sense, connect them however you need to, and use " +
        "the notes to remember the things that aren't obvious from the " +
        "map itself.";

    const demoText = document.createElement("p");
    demoText.textContent =
        "Want to see what Roombound can do before making your own map?";

    const demoLink = document.createElement("a");
    demoLink.href = DEMO_MAP_URL;
    demoLink.textContent = "Try the demo map.";

    const helpLink = document.createElement("a");
    helpLink.href = HELP_URL;
    helpLink.textContent = "Read the help page.";

    const links = document.createElement("p");
    links.appendChild(demoLink);
    links.appendChild(
        document.createTextNode(" or ")
    );
    links.appendChild(helpLink);

    const dontShowAgain = document.createElement("label");
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.addEventListener(
        "change",
        () => {
            setShowGettingStarted(!checkbox.checked);
        }
    );

    dontShowAgain.appendChild(checkbox);
    dontShowAgain.appendChild(
        document.createTextNode(" Don't show this again")
    );

    content.appendChild(heading);
    content.appendChild(intro);
    content.appendChild(description);
    content.appendChild(battleMap);
    content.appendChild(demoText);
    content.appendChild(links);
    content.appendChild(dontShowAgain);

    windowAPI.setSize(
        windowAPI.getSize().width * 2
    );

    windowAPI.element.classList.add(
        "getting-started-window"
    );
}