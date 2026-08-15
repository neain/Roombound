# Roombound

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

Roombound focuses on relationships between locations, rather than precise physical maps.

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

```text
Map
└── rooms[]
```

The map does not need to understand the spatial relationships between floors or determine how rooms should be visually arranged.

Most visualization-related information and behavior should be handled by the visualization engine rather than stored directly in the map structure.

### Rooms

A room is represented by a movable node.

At the current stage, the minimum room data is:

```text
Room
├── roomID
├── name
├── floor
└── connections[]
```

#### `roomID`

An internal unique identifier for the room.

The ID exists primarily so rooms can be referenced reliably and serialized. It is not intended to normally be displayed to the user, and it should not have any inherent meaning to the application.

Room names should not be used as IDs. Multiple rooms may have the same name.

#### `name`

The visible name of the room.

Examples:

* Entrance Hall
* Kitchen
* Grand Ballroom
* Room 12
* Unknown Chamber

#### `floor`

An integer identifying the floor associated with the room.

The value is relative to the normal ground/first-floor level.

Examples:

```text
1   = first floor
2   = second floor
5   = fifth floor

-1  = first basement
-2  = second basement
```

`0` is currently unused.

The floor number is simply a property of the room. It does not create a separate floor data structure, and rooms on different floors can still be connected directly.

For example, a staircase or elevator could connect:

```text
Floor 1 → Floor 5
```

without Roombound needing to understand the floors as separate maps.

#### `connections[]`

A room may have any number of connections, including zero.

An empty connection list is valid.

This is important both for:

* The initial room in a new map
* A newly created blank room that has not yet been connected
* A room that genuinely has no known connections

A room with zero connections may eventually be displayed differently from a connected room, but this should be derived by the visualization layer rather than requiring a special room state.

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

Connections are intentionally lightweight. A substantial hallway or other area that needs its own meaningful information should generally be represented as its own room, with connections leading to it.

The initial connection model is:

```text
Connection
├── from
├── fromSide
├── to
├── toSide
└── name
```

### `from`

The room ID where the connection originates.

This value is required.

### `fromSide`

The side of the originating room where the connection is attached.

The intended values are currently:

```text
N
NE
E
SE
S
SW
W
NW
NONE
```

The eight directional values represent the cardinal and diagonal sides of a room.

`NONE` means that the connection exists but is not associated with a particular side.

The exact visual treatment of these positions is a visualization concern and does not need to be determined by the data structure yet.

### `to`

The room ID of the destination room.

This value may be `null`.

A `null` destination represents an unresolved connection: the user knows that a connection exists, but does not yet know where it leads.

For example:

```text
Room A
  └── Unknown Door → null
```

An unresolved connection should eventually allow the user to either:

1. Connect it to an already existing room.
2. Create a new room and connect it to that room.

### `toSide`

The side of the destination room where the connection is attached.

It uses the same conceptual values as `fromSide`:

```text
N
NE
E
SE
S
SW
W
NW
NONE
```

If `to` is `null`, `toSide` must also be `null`.

`NONE` and `null` have different meanings:

* `null` means there is no known destination.
* `NONE` means there is a known destination, but the connection is not associated with a particular side of that room.

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

The connection name exists even when the connection is otherwise very simple. In some cases the only meaningful information about a connection may be its position between two rooms, but the data model should still allow a user to provide a descriptor when one is useful.

### Directionality

Connections are not currently treated as directional in the public model.

The `from` and `to` fields identify the two endpoints of the connection, but this does not currently imply that movement is one-way.

Future functionality may change or expand this model if directional connections become necessary.

---

## 6. Unresolved Connections

A connection may exist without a known destination.

Example:

```text
[Room 12]
    │
    │ Unknown Door
    │
    ?
```

This is represented by a connection whose `from` and `fromSide` are known while `to` and `toSide` are `null`.

When the destination is discovered, the user should be able to either:

* Connect the existing connection to an already existing room.
* Create a new room and connect the existing connection to it.

The unresolved state is therefore not intended to be a separate permanent type of connection. It is simply a connection whose destination has not yet been identified.

---

## 7. Connection State

Connections may eventually support lightweight states such as:

* Open
* Closed
* Locked
* Secret
* Blocked
* Unknown
* One-way

The exact state system and visual representation are not yet finalized.

These should not be added to the minimum connection model until they are needed by the application.

---

## 8. Room Information and Display

Rooms have two conceptual layers of information in the user interface.

### Always-Visible Information

A room should have a deliberately small amount of information that is always visible on the map.

The room name is currently the primary always-visible field.

For example:

```text
[Grand Ballroom]
```

This keeps the overall graph readable even when many rooms are present.

### Additional Information

Additional room information can be shown when the user hovers over or otherwise interacts with the room.

This may eventually include:

* Floor
* Status
* Notes
* Tags
* Links
* Connection information
* Other room metadata

Users may eventually be able to promote selected information into the always-visible layer without requiring a hover.

The exact interaction for this is not yet finalized. Possible approaches include an edit mode or controls that allow individual fields to remain visible.

The underlying room data should remain independent of this display behavior.

---

## 9. Room Status

Rooms may eventually have an exploration or availability status.

The current likely status values are:

* Unexplored
* Partially explored
* Explored
* Custom

The exact status system is not finalized.

A custom status may be useful for situations that do not fit the standard exploration states.

---

10. Data Model

The map is intentionally a simple data structure. Visualization and interaction logic should operate on the data rather than becoming part of the map itself.

Map

The map currently consists of:

Map
└── rooms[]

The map itself does not need to understand floors, visual layout, or connection rendering.

Room

The current conceptual Room structure is:

Room
├── roomID
├── name
├── floor
├── position
├── size
└── connections[]
roomID

An internal unique identifier used to reference and serialize rooms.

It is not intended to normally be visible to the user.

Room names should not be used as IDs, since multiple rooms may have the same name.

name

The human-visible name of the room.

floor

An integer representing the floor associated with the room.

Examples:

1   = first floor
2   = second floor
5   = fifth floor

-1  = first basement
-2  = second basement

0 is currently unused.

The floor is simply a property of the room. It does not create a separate floor structure, and rooms on different floors can still be connected directly.

position

The room's position on Roombound's abstract grid.

The position uses grid coordinates rather than screen pixels.

The position represents the top-left corner of the room.

For example:

position:
    x: 10
    y: 5

The visualization layer converts these grid coordinates into screen coordinates.

size

The room's size on the abstract grid.

Size is represented independently from position:

size:
    width: 10
    height: 10

The initial default room size is 10 × 10 grid units.

Room size is not intended to represent physical dimensions in the game world. It primarily controls the visual footprint of the room in Roombound.

Keeping size as room data allows rooms to eventually be resized to accommodate additional visible information without turning the application into a battlemap.

connections[]

A room may have any number of connections, including zero.

An empty connection list is valid.

This is important both for:

The initial room in a new map
A newly created room that has not yet been connected
A room that genuinely has no known connections

The visualization layer may eventually display rooms with zero connections differently.

Connection

Connections are independent objects representing transitions between rooms.

The current conceptual structure is:

Connection
├── from
├── fromSide
├── to
├── toSide
└── name
from

The ID of the room where the connection originates.

This is required.

fromSide

The side of the originating room where the connection attaches.

The intended values are:

N
NE
E
SE
S
SW
W
NW
NONE

The eight directional values represent the cardinal and diagonal sides of a room.

NONE means that the connection is associated with the room but does not imply a particular side.

to

The ID of the destination room.

This may be null.

A null destination represents an unresolved connection: the user knows a connection exists but does not yet know where it leads.

toSide

The side of the destination room where the connection attaches.

It uses the same conceptual values as fromSide.

If to is null, toSide must also be null.

NONE and null have different meanings:

null = no known destination
NONE = known destination, but no particular side is implied
name

An optional human-readable descriptor for the connection.

Examples:

North Door
Main Hallway
Secret Passage
Staircase
Locked Door

A connection may have an empty name.

Unresolved Connections

An unresolved connection can be represented without creating a special connection type.

Example:

Room A
  │
  │ Locked Door
  │
  ?

The connection has a valid from and fromSide, while to and toSide are null.

When the destination becomes known, the user should eventually be able to:

Connect it to an existing room.
Create a new room and connect it to that room.
Directionality

Connections are not currently treated as directional in the public model.

from and to identify the two endpoints of a connection but do not currently imply that the connection is one-way.

Directional connections may be added later if needed.

11. Visualization Model

The visualization engine is intentionally separate from the underlying map meaning.

The map data describes:

What rooms and relationships exist.

The visualization describes:

How those rooms and relationships are shown to a human.

Grid

Roombound uses an abstract grid for positioning rooms.

The visible grid is currently only a visual aid. Its purpose is to let the user see where rooms will snap when moved.

The grid itself is not meaningful map data and does not represent physical game-world squares.

The visualization currently has a configurable grid size:

const GRID_SIZE = 20;

This means one map grid unit currently corresponds to 20 screen pixels.

Changing the visualization's grid size does not change the underlying room coordinates.

Room Positioning

Room positions are stored in grid coordinates.

The visualization converts those coordinates to screen pixels when rendering.

Rooms currently snap to the grid when moved.

The room's position in the map data is updated when the room is dragged.

Room Size

Rooms currently use their stored grid-based size when rendered.

The initial default size is:

10 × 10 grid units

The size is independent of the current visual pixel scale.

Room Display

The room name is currently displayed directly on the room node.

The eventual UI is expected to have two conceptual information layers:

A small amount of information that is always visible.
Additional information that appears when the user interacts with or hovers over a room.

The user may eventually be able to promote selected information into the always-visible layer.

The exact interaction for this is not yet finalized.

12. Current Implementation

The project currently uses:

HTML
CSS
JavaScript

No graph visualization library is currently required.

The current prototype has:

A basic HTML application shell
A map visualization area
A hard-coded test map
Room objects with names, floors, positions, sizes, and connections
Grid-based room positioning
Visible visualization grid
Room rendering from the map data
Draggable rooms
Grid-snapped room movement
Room position updates when rooms are dragged

The current prototype does not yet render connections visually.

The next major development step is expected to be connection visualization.

13. Current Development Target

The immediate goal is to establish the fundamental visual graph before adding editing, persistence, or other larger systems.

The current development progression is:

Render rooms
Make rooms draggable
Snap rooms to the grid
Render connections
Handle connection attachment points
Render unresolved connections
Add basic hover information
Begin interactive room/connection creation and editing

Steps 1–3 are currently working.

The next step is connection visualization.

The purpose of this prototype is to discover problems with the interaction and data model while the project is still small.

14. Initial MVP

The eventual first usable version should contain:

Create room
Delete room
Move room
Rename room
Assign room floor
Resize room
Create connection
Delete connection
Connect an unresolved connection to an existing room
Create a new room from an unresolved connection
Move connected rooms without breaking connections
Zoom
Pan
Save map
Load map
Basic room notes
Basic connection notes
External URL associated with a room

Additional display functionality should eventually allow rooms with no connections to be visually distinguished and allow selected room information to remain visible without hovering.

Anything beyond this should be considered post-MVP unless it becomes necessary for the core workflow.

15. Future Possibilities

Potential future features include:

Multiple map levels
Fog/reveal states
Tags
Search
Connection-specific icons
Custom room icons
Images
Player/GM modes
Map sharing
Collaboration
Export/import
Automatic edge routing
Custom themes
Print/export functionality
More detailed connection states
Additional room display controls

These are ideas, not commitments.

16. Scope Boundary

Roombound should remain a lightweight exploration and relationship-mapping tool.

When considering a new feature, ask:

Does this help the user understand, record, or organize relationships between locations?

If not, the feature probably belongs in another application.

In particular, Roombound should resist becoming a full virtual tabletop.

A room does not need to become a detailed physical map simply because more information can be associated with it.

17. Development Philosophy

The project should favor:

Simple implementations
Small features
Replaceable components
Minimal configuration
Fast iteration
Useful functionality over visual polish
A simple underlying data model
Keeping visualization concerns separate from map data

The application should be useful before it is pretty.

When a design question is uncertain, prefer implementing the smallest version that can answer the question rather than attempting to predict the final solution in advance.

18. License

Roombound is currently not allowed to be copied or used without permission. This is intended to change in the future, but at the moment the project is not even alpha.