# Roombound
Live Demo: https://neain.github.io/Roombound/

A lightweight, player-facing exploration mapper for tabletop RPGs.

## 1. Project Overview

### Purpose

Roombound is a free, lightweight mapping and note-taking tool for tabletop RPGs.

It is designed around situations where players (or GMs) want to keep track of:

* Places they have visited
* Rooms and locations they have discovered
* Connections between those locations
* Doors, passages, stairs, and other transitions
* Locations they haven't fully explored
* Notes and observations about locations
* External resources associated with locations

Roombound focuses on relationships between locations rather than precise physical maps.

### Core Concept

A Roombound map is a graph presented spatially.

* Nodes represent rooms or locations.
* Edges represent connections between rooms.
* Nodes can be freely moved around the map.
* Connections remain attached to their rooms when rooms are moved.
* Notes and metadata can be associated with rooms and connections.
* The visual arrangement is primarily for human comprehension, not physical accuracy.

A room and a location are currently considered the same thing within Roombound. There is no intended functional distinction between the two terms.

---

## 2. Design Goals

Roombound should be:

### Simple

A user should be able to create a useful map without learning a complex mapping application.

### Fast

Adding a room and connecting it to another room should take seconds.

### Player-Facing

The primary use case is a player maintaining their own record of an explored environment.

A secondary use case is a GM using Roombound to brainstorm and organize relationships between rooms and locations without committing to a detailed battlemap.

The application should not require separate player and GM systems for its core mapping functionality.

### Flexible

The system should work for:

* Dungeons
* Buildings
* Cities
* Wilderness
* Complexes
* Spaceships
* Other connected locations

### Free

Roombound is intended to remain a free project.

### Extensible

Features should be designed so additional functionality can be added without requiring the core mapping system to become complicated.

---

## 3. Non-Goals

Roombound is not a virtual tabletop.

The project does not initially attempt to provide:

* Battlemap creation
* Tactical combat positioning
* Character tokens
* Initiative tracking
* Dice rolling
* Line of sight
* Lighting systems
* Fog-of-war simulation
* Monster/NPC stat blocks
* Automated game rules
* Detailed terrain rendering
* 3D environments

A room does not need to represent its actual physical dimensions.

A room node is a record of a location, not a battlemap.

---

## 4. Core Map Model

### Map

The map itself should remain a very simple data structure.

Conceptually: 
Map
├── rooms[]
└── connections[]

The map does not need to understand the visual arrangement of rooms or determine how rooms should be displayed.

Visualization and interaction behavior should remain separate from the underlying map meaning.

### Rooms

A room is represented by a movable node.

The core room data currently includes:
Room
├── roomID
├── name
├── floor
├── position
├── size
└── connections[]

#### `roomID`

An internal unique identifier for the room.

The ID exists primarily so rooms can be referenced reliably and serialized.

It is not intended to be displayed to the user and has no inherent meaning to the application.

Room names should not be used as IDs. Multiple rooms may have the same name.

#### `name`

The visible name of the room.

Examples:

* Entrance Hall
* Kitchen
* Grand Ballroom
* Room 12
* Unknown Chamber

The room name is currently displayed directly on the room node.

#### `floor`

An integer identifying the floor associated with the room.

The value is relative to the normal ground/first-floor level.

Examples:
1 = first floor
2 = second floor
5 = fifth floor

-1 = first basement
-2 = second basement

`0` is currently unused.

The floor number is simply a property of the room. It does not create a separate floor data structure, and rooms on different floors can still be connected directly.

For example, a staircase or elevator could connect:
Floor 1 → Floor 5

without Roombound needing to understand the floors as separate maps.

#### `position`

The room's position on Roombound's abstract grid.

Positions use grid coordinates rather than screen pixels.

The position represents the top-left corner of the room.

For example:
position: { x: 10, y: 5 }

The visualization layer converts grid coordinates into screen coordinates.

The current implementation updates the room's stored position when the room is dragged.

#### `size`

The room's size on the abstract grid.

Size is represented independently from position:
size: { width: 10, height: 10 }

The initial default room size is 10 × 10 grid units.
Room size is not intended to represent physical dimensions in the game world. It primarily controls the visual footprint of the room in Roombound.
#### `connections[]`

A room may have any number of connections, including zero.

An empty connection list is valid.

The current implementation stores connection objects in room connection lists for practical access and rendering.

This storage arrangement should not be interpreted as meaning that the room owns or originates the connection. The connection data itself identifies its two endpoints independently.

A room may therefore contain a connection whose other endpoint is the room itself or another room, depending on the connection's endpoint data.

Multiple connections between the same two rooms are valid and intentional. For example, two rooms may have multiple doors or passages connecting them, potentially using different room sides or having different names.

---

## 5. Connections

A connection represents a transition or relationship between two rooms.

Examples include:

* Door
* Hallway
* Stairway
* Passage
* Teleporter
* Secret passage
* Other transitions between rooms

Connections are intentionally lightweight.

A substantial hallway or other area that needs its own meaningful information should generally be represented as its own room, with connections leading to it.

### Connection Model

Connections use two endpoints rather than a `from`/`to` ownership model.

The current conceptual structure is:

Connection
├── roomA
├── roomAConnectionSide
├── roomB
├── roomBConnectionSide
├── directionTo
└── name

The two rooms are endpoints of the same connection. Neither room is inherently the source or owner of the connection.

### `roomA`

The room ID of endpoint A.

This identifies one endpoint of the connection.

### `roomAConnectionSide`

The side of room A where the connection is attached.

The currently implemented values are:

N
E
S
W
NONE

The four directional values represent the cardinal sides of a room.

Diagonal directions (NE, SE, SW, NW) and vertical directions (UP, DOWN) are planned for a later development step. Their visual treatment is not yet defined.

`NONE` means that the connection exists but is not associated with a particular side.

The exact visual treatment of these positions is a visualization concern.

### `roomB`

The room ID of endpoint B.

This value may be `null`.

A `null` room B represents an unresolved connection: the user knows that a connection exists from the known endpoint, but does not yet know which room it leads to.

For example:

Room A
└── Unknown Door → null

Room B being `null` does not create a separate connection type. It simply represents an incomplete connection.

### `roomBConnectionSide`

The side of room B where the connection is attached.

It uses the same conceptual values as `roomAConnectionSide`.

If `roomB` is `null`, `roomBConnectionSide` must also be `null`.

`NONE` and `null` have different meanings:

* `null` means there is no known room at that endpoint.
* `NONE` means a room is known, but the connection is not associated with a particular side of that room.

### `name`

An optional human-readable name or descriptor for the connection.

Examples:

* North Door
* Main Hallway
* Secret Passage
* Staircase
* Door to the Ballroom
* Locked Door

The name may be left blank.

### `directionTo`

`directionTo` describes the direction in which the connection points.

It does **not** identify which room owns or originates the connection.

The current values are:

"A"
"B"
"both"

Their meanings are:

"A" = the connection points toward room A
"B" = the connection points toward room B
"both" = the connection works in both directions

For example:

roomA: "room_001"
roomB: "room_002"
directionTo: "A"

means that the connection points toward room A.

Likewise:

roomA: "room_001"
roomB: "room_002"
directionTo: "B"

means that the connection points toward room B.

Directionality is therefore a property of the relationship between the two endpoints rather than a property of either room.

Reversing a connection's direction does not swap room A and room B. It changes `directionTo` and therefore changes how the connection is interpreted and rendered.

### Multiple Connections

Multiple connections between the same two rooms are valid.

For example, two rooms might have:

Room A ── Door 1 ── Room B
Room A ── Door 2 ── Room B

These are separate connection objects even though they reference the same pair of rooms.

This is intentional. Different doors, passages, sides, names, or other future properties may make otherwise similar connections meaningfully different to the user.

---

## 6. Unresolved Connections

A connection may exist without a known room at endpoint B.

Example:

[Room 12]
│
│ Unknown Door
│
?

This is represented by a connection whose A endpoint is known while B is unresolved:

roomA: "room_012"
roomAConnectionSide: "E"
roomB: null
roomBConnectionSide: null

The unresolved state is therefore not intended to be a separate permanent type of connection. It is simply a connection whose second endpoint has not yet been identified.

When the destination is discovered, the user should eventually be able to either:

* Connect it to an already existing room.
* Create a new room and connect the existing connection to it.

The connection remains the same connection while its unresolved endpoint is completed.

---

## 7. Connection State

Connections may eventually support lightweight states such as:

* Open
* Closed
* Locked
* Secret
* Blocked
* Unknown

These states are separate from connection direction.

Directionality is currently represented by `directionTo`, while other connection states may be added as additional properties in the future.

The exact state system and visual representation are not finalized.

These should not be added to the minimum connection model until they are needed by the application.

---

## 8. Room Information and Display

Rooms have multiple conceptual layers of information in the user interface.

### Always-Visible Information

A room should have a deliberately small amount of information that is always visible on the map.

The room name is currently the primary always-visible field.

For example:

[Grand Ballroom]

This keeps the overall graph readable even when many rooms are present.

### Hover Information

Additional room information is available when the user hovers over a room.

The current implementation automatically displays room properties as key/value pairs.

The hover display is data-driven:

* Properties are automatically discovered from the room object.
* Certain properties are excluded through an exception list.
* `roomID` is excluded because it is an internal backend identifier.
* `connections` are excluded because they describe relationships rather than basic room information.
* `position` and `size` are excluded because they are primarily implementation/display data rather than information the user needs during normal inspection.

The exception list can be expanded later if additional properties should not be displayed.

The current hover display is intentionally simple and uses a custom floating tooltip.

The tooltip:

* Appears immediately when the mouse enters a room.
* Displays the room's available information as key/value pairs.
* Appears above rooms.
* Disappears when the mouse leaves the room.
* Disappears when room dragging begins.

The tooltip is currently intended as a lightweight inspection tool rather than a permanent UI component.

### Room Selection

Clicking a room selects it.

Selection is currently implemented independently from room dragging.

The selected room is stored as application state and is used to determine which room the room editor displays.

### Room Editor

Selecting a room opens a floating room editor.

The editor is a UI element rather than a browser window.

The editor:

* Exists independently of the map.
* Does not move when rooms are moved.
* Does not move when another room is selected.
* Changes its displayed information when a different room is selected.
* Can be moved by dragging its header.
* Can be resized by the user.
* Remains in its current position when the selected room changes.

The current editor is an early implementation and currently displays the same non-excluded room properties shown by the hover system.

The intended future editor will allow the user to edit appropriate room properties.

`name` and `floor` are currently intended to be displayed but treated as read-only properties.

A separate read-only property list is used so that a property can remain visible while being protected from editing.

### Room Notes

Roombound is expected to eventually support free-form notes associated with rooms.

The preferred approach is a notepad-style text area rather than immediately building a dynamic custom-property editor.

This allows users to record arbitrary information without requiring every possible piece of room information to become a structured field.

Structured custom properties may be considered later if the application demonstrates a need for them.

---

## 9. Coordinate and Map Model

### World Coordinates

Roombound uses an abstract grid coordinate system for room positioning.

Room coordinates represent logical map positions rather than screen pixels.

The coordinate system is intended to be centered around a world origin:

(0, 0)

The origin is not intended to be a hard boundary.

The map should effectively support rooms extending in any direction from the origin.

### Initial View

The application should initially position the viewport around `(0, 0)`.

This gives a newly created map a useful central starting point while allowing the user to expand naturally in any direction.

The user should not need to reach the edge of a fixed map before being able to continue building.

### Map Size

The map should not be implemented as a hard `100 × 100` grid.

A finite initial visual workspace may be useful for development, but the underlying coordinate system should not have an arbitrary maximum.

The intended model is effectively an unbounded coordinate space viewed through a finite viewport.

### Grid Rendering

The visible grid is a visual aid.

Its purpose is to show where rooms will snap when moved.

The grid itself is not meaningful map data and does not represent physical game-world squares.

The grid should eventually be rendered based on the currently visible area rather than requiring a large number of permanent grid elements.

### Camera / Viewport

The map has a camera-like viewport system.

The viewport determines which part of the world coordinate space is currently visible.

The map content can be moved relative to the viewport without changing the underlying room coordinates.

The current interaction model is:

* Right-click drag → pan the map.
* Ctrl + mouse wheel → zoom in and out.
* Rooms and connections move and scale together with the map.
* The room editor remains independent of the map camera.

### Zoom

Zoom operates on the map's visual representation rather than changing the underlying room coordinates.

A room at:

position: { x: 12, y: -7 }

should remain at those coordinates regardless of zoom level.

Zoom scales:

* Room positions on screen
* Room sizes
* Room text
* Connections
* The visible grid

Zoom is implemented through shared map/camera utilities rather than changing the stored room data.

Zoom: Ctrl + Scroll Wheel changes zoom between the configured minimum and maximum values. Zooming preserves the center of the current viewport rather than centering on the overall map. Zoom changes are routed through a shared `changeZoom()` function so future zoom controls can reuse the same behavior.

### Coordinate Separation

The visualization system should conceptually maintain three coordinate spaces:

World coordinates
↓
Map/camera coordinates
↓
Screen coordinates

World coordinates are stored in the map.

Camera state determines how the world is viewed.

Screen coordinates are derived from the world and camera state.

This separation allows panning and zooming without changing the underlying map data.

---

## 10. Data Model

The map is intentionally a simple data structure.

Visualization and interaction logic should operate on the data rather than becoming part of the map itself.

### Map

The map currently consists of:

Map
├── rooms[]
└── connections[]

### Room

The current conceptual Room structure is:

Room
├── roomID
├── name
├── floor
├── position
├── size
└── connections[]

`roomID`

An internal unique identifier used to reference and serialize rooms.

It is not intended to be visible to the user.

`name`

The human-visible name of the room.

`floor`

An integer representing the floor associated with the room.

`position`

The room's logical grid position.

`size`

The room's logical grid footprint.

`connections[]`

Connections associated with the room.

A room may have zero or more connections.

Connections are stored in room connection lists for the current implementation, but the connection itself is conceptually independent of the room that happens to store it.

### Connection

Connections are independent relationship objects representing transitions between two endpoints.

The current conceptual structure is:

Connection
├── roomA
├── roomAConnectionSide
├── roomB
├── roomBConnectionSide
├── directionTo
└── name

See the Connections section for details.

A connection does not have an inherent originating room.

The A/B labels exist only to identify the two endpoints consistently.

---

## 11. Visualization Model

The visualization engine is intentionally separate from the underlying map meaning.

The map data describes:

* What rooms and relationships exist.

The visualization describes:

* How those rooms and relationships are shown to a human.

### Grid

Roombound uses an abstract grid for positioning rooms.

The current visualization uses:

const GRID_SIZE = 20;

This means one map grid unit currently corresponds to 20 screen pixels before camera scaling.

Changing the visualization grid size does not change the underlying room coordinates.

### Room Positioning

Room positions are stored in grid coordinates.

The visualization converts those coordinates to screen pixels.

Rooms currently snap to the grid when moved.

The room's position in the map data is updated when the room is dragged.

### Room Size

Rooms currently use their stored grid-based size when rendered.

The initial default size is:

10 × 10 grid units

* A floating room editor
* A resizable room editor
* A draggable room editor header
* A persistent editor position when selecting different rooms
* Room creation
* Room deletion
* Room editing
* Connection creation
* Connection editing
* Connection editor discovery of connections involving the selected room
* Connection endpoint editing UI
* Connection direction editing
* Directionality represented independently from connection endpoint identity
* A/B connection endpoint model
* Floating and draggable connection editor

The room and connection editors are still early implementations and are expected to receive additional usability and polish work.

---

## 13. Development Target List
The development progression was:

1. Render rooms
2. Make rooms draggable
3. Snap rooms to the grid
4. Render connections
5. Handle connection attachment points
6. Render unresolved connections
7. Add basic hover information
8. Add room selection
9. Add a floating/resizable room editor
10. Establish the origin-centered map coordinate system
11. Add map panning
12. Add map zooming
13. Verify that rooms, connections, grid, and room text remain aligned during pan/zoom
14. Return to the room editor and add editable room properties, as well as the ability to close the editor
15. Add room editor save behavior
16. Add free-form room notes
17. Begin interactive room/connection creation and editing
18. Complete the connection endpoint editing workflow using the A/B connection model
19. Add room-target selection for connection endpoints
20. Add connection-side selection for each endpoint
21. Handle disconnecting either endpoint, including deleting a connection when both endpoints are disconnected
22. Refine unresolved connection behavior and creation workflow
23. Add save and load features
24. add additional map layers to show that there are additional floors, not just a floor section in the data structure.
25. Add way to delete rooms. 
26. use the app on a real dungeon and see if you can accuratly show everything that needs to be shown. if not, add more ToDo. if so... go to the next item on the list.

50. You are done. Go to the Polish List, and may you one day find the end.

### Current Position

Steps 1–26 are currently working in prototype form.
Started the polish list.
Steps 1-4 are currently marked as complete.
Current Step: 5


### Polish List
1. Zoom bar + visible zoom level + possibly keyboard shortcuts.
2. Hamburger menu with New Map, Save/Load, Options, etc.
3. Swap the floor-selection arrows.
4. Make the connection endpoint selection square larger and make it disappear when the connection editor closes.
5. Resize room names with the room so they remain readable.
6. Make the default room editor size large enough that nothing is clipped.
7. Don't close the room editor when saving; add a changed indicator.
8. Decide what happens to the room editor when editing a connection. Decided: close the room editor if the edit connections button was clicked. Any other way of getting to the connection editor will ignore the room editor as it has been doing.
9. Make connection paths clickable to open their editor.
10. Visually indicate on the map which connection is currently being edited.
11. Make the connection editor follow clicks on rooms/connections.
12. Improve the connection-list interaction instead of repeating the same text/button hierarchy.
13. Clean up connection-editor sorting/arrows/default ordering.
14. Don't open the room editor just because a room was moved.
15. Add NONE connection visuals.
16. Fix NE/NW/SE/SW attachment points.
17. Add a context menu for new connection creation.
18. Add the main-map right-click context menu.
19. Improve how new rooms are created. Add context menu asking for its name and how many connections to add to it.
20. Reconsider Edit Room button placement. See how two rows look.
21. Double-click blank map space to create a room there.
22. Allow rooms to be recolored.
23. Allow room size/color changes, including resizing via a corner drag.
24. Allow different room shapes.
25. Consolidate editor-window color CSS properties.
26. Save As + smarter Save behavior.
27. Up/down floor controls in the room context menu.
28. Remove floor 0, with an option for people who want it.
29. Better visualization of rooms on other floors, including stairs.
30. Make rooms on other floors partially visible / non-selectable.
31. Hover information for cross-floor connections.
32. Multi-select rooms and move them together.
33. Show looping connections with a looping arrow.
34. Add in the library that would let the connections avoid rooms.

* options menu items: Change the default color of rooms and room text. change the default size of rooms. change the size of the connection endpoint selector square.


* Nail down bugs
* The URL for the github pages that is hosting the webpage based in github is https://neain.github.io/Roombound/ technicly at index.html, but thats implied.

### Possible Bugs
* when opening a connection to be edited, its not closing the other connections in the same list (this may end up not being a bug as other polish steps are modifying this list)
---

## 14. Initial MVP

The eventual first usable version should contain:

* Create room
* Delete room
* Move room
* Rename room
* Assign room floor
* Resize room
* Create connection
* Delete connection
* Connect an unresolved connection to an existing room
* Create a new room from an unresolved connection
* Move connected rooms without breaking connections
* Zoom
* Pan
* Save map
* Load map
* Basic room notes
* Basic connection notes
* External URL associated with a room

Additional display functionality should eventually allow:

* Rooms with no connections to be visually distinguished
* Selected room information to remain visible without hovering
* Useful room information to be edited directly
* Free-form room notes to be maintained independently of structured room properties

Anything beyond this should be considered post-MVP unless it becomes necessary for the core workflow.

---

## 15. Future Possibilities

Potential future features include:

* Multiple map levels
* Fog/reveal states
* Tags
* Search
* Connection-specific icons
* Custom room icons
* Images
* Player/GM modes
* Map sharing
* Collaboration
* Export/import
* Automatic edge routing
* Custom themes
* Print/export functionality
* More detailed connection states
* Additional room display controls
* User-defined room properties

These are ideas, not commitments.

Search is specifically considered a potentially useful future feature because Roombound may eventually contain maps large enough that users need help locating rooms or information.

---

## 16. Scope Boundary

Roombound should remain a lightweight exploration and relationship-mapping tool.

When considering a new feature, ask:

> Does this help the user understand, record, or organize relationships between locations?

If not, the feature probably belongs in another application.

In particular, Roombound should resist becoming a full virtual tabletop.

A room does not need to become a detailed physical map simply because more information can be associated with it.

The coordinate grid exists to organize the graph visually, not to turn Roombound into a tactical map.

---

## 17. Development Philosophy

The project should favor:

* Simple implementations
* Small features
* Replaceable components
* Minimal configuration
* Fast iteration
* Useful functionality over visual polish
* A simple underlying data model
* Keeping visualization concerns separate from map data

The application should be useful before it is pretty.

When a design question is uncertain, prefer implementing the smallest version that can answer the question rather than attempting to predict the final solution in advance.

The project should avoid building complex infrastructure for features that may not ultimately be needed.

---

## 18. License
Roombound is currently not allowed to be copied or used without permission.
This is intended to change in the future, but at the moment the project is not even alpha.
