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

## 10. Notes

Notes are a core feature rather than an afterthought.

Rooms should eventually support freeform notes such as:

> Three sarcophagi. One is empty. Door to the north is locked. We heard something behind the eastern wall.

Connections should also be able to contain notes.

Example:

> Locked. Need a key.

Notes should remain lightweight and should not attempt to become a full campaign-management or wiki system.

---

## 11. External Links

Rooms may optionally contain external URLs.

The initial implementation should treat these simply as links.

Examples:

* Battlemap
* Campaign wiki
* Google Docs
* Images
* PDFs
* Other mapping tools
* GM notes

Roombound does not initially need to understand or integrate with the linked resource.

This allows GM-oriented use without requiring Roombound to become a battlemap application.

---

## 12. Player / GM Use

Roombound is intended to support both player and GM use without creating separate core mapping systems.

### Player Use

A player can use Roombound to record:

* Where have we been?
* What connects to what?
* What doors remain unexplored?
* What did we find?
* Which locations are difficult to navigate between?

This is particularly useful when players are given individual battle maps or room descriptions without being given an overall map of the location.

Roombound can help reconstruct the relationships between those rooms when the overall layout is not obvious.

### GM Use

A GM can use the same system for:

* Dungeon brainstorming
* Location organization
* Planning connections
* Exploring possible room relationships
* Linking detailed maps or notes
* Building a rough location structure before creating detailed maps

The underlying map model should not need to know whether the person using it is a player or a GM.

---

## 13. Visual Philosophy

The map should prioritize:

**Clarity > Accuracy > Decoration**

Rooms should be visually distinct and easy to rearrange.

Connections should remain readable when rooms move.

The application should avoid unnecessary visual complexity associated with traditional battlemap software.

The map should feel more like:

> An interactive notebook / relationship diagram

than:

> A tactical map.

The visualization engine is responsible for determining how the underlying room and connection data is presented.

The data model should not unnecessarily encode visual layout decisions.

---

## 14. Data Model

The current conceptual data model is intentionally small.

```text
Map
└── rooms[]
    │
    ├── Room
    │   ├── roomID
    │   ├── name
    │   ├── floor
    │   └── connections[]
    │
    └── Connection
        ├── from
        ├── fromSide
        ├── to
        ├── toSide
        └── name
```

A more concrete example:

```text
{
    "rooms": [
        {
            "roomID": "room_001",
            "name": "Entrance Hall",
            "floor": 1,
            "connections": [
                {
                    "from": "room_001",
                    "fromSide": "E",
                    "to": "room_002",
                    "toSide": "W",
                    "name": "Hallway"
                },
                {
                    "from": "room_001",
                    "fromSide": "N",
                    "to": null,
                    "toSide": null,
                    "name": "Locked Door"
                }
            ]
        }
    ]
}
```

This is a conceptual representation rather than a finalized serialization format.

The exact implementation should remain flexible during early development.

In particular, the following are intentionally undecided:

* Room `Size`
* Exact room status implementation
* Additional connection metadata
* Exact serialization/file format
* How connection sides are visually rendered
* Whether connection sides eventually need to support anything beyond the eight directions and `NONE`

The goal is to avoid solving problems before the application demonstrates that they need to be solved.

---

## 15. Persistence

Roombound will eventually need both temporary and independent persistent storage.

The current intended direction is:

* Temporary/session state may use browser storage such as cookies or another appropriate browser mechanism.
* Maps should also be able to be saved to and loaded from an independent file.

The file format does not need to prioritize human readability. Its primary purpose is to allow users to conveniently save, move, and load their maps.

The exact persistence implementation is not yet finalized.

---

## 16. Technology

Initial implementation is planned as a web application using:

* HTML
* CSS
* JavaScript

Potential libraries may be used for graph visualization, node manipulation, edge routing, or other functionality where they significantly reduce implementation complexity.

The project should avoid unnecessary dependencies.

The initial implementation should favor simple, replaceable components rather than committing prematurely to a large framework or graph system.

---

## 17. Initial Development Target

The first development target is intentionally smaller than the eventual MVP.

The first prototype should establish that the core room-and-connection model works when represented visually.

It should be able to:

* Create or represent rooms
* Give rooms names
* Store floor numbers
* Store connections
* Connect rooms together
* Represent unresolved connections
* Move rooms visually
* Keep connections attached when rooms move
* Represent connection sides
* Display connection names

The first prototype does not need:

* Saving
* Loading
* Cookies
* Notes
* Statuses
* Multiple specialized editing modes
* A polished interface
* A finalized graph library
* Full room editing
* GM/player modes

The purpose of the first prototype is to test the fundamental interaction:

> **Room → Connection → Room**

before building additional systems around it.

A small hard-coded test map is sufficient for this stage.

---

## 18. MVP

The first usable version should eventually contain:

* Create room
* Delete room
* Move room
* Rename room
* Assign room floor
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

Additional display functionality should include the ability to distinguish rooms with no connections and eventually allow selected room information to remain visible without hovering.

Anything beyond this should be considered post-MVP unless it becomes necessary for the core workflow.

---

## 19. Future Possibilities

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

These are ideas, not commitments.

---

## 20. Scope Boundary

Roombound should remain a lightweight exploration and relationship-mapping tool.

When considering a new feature, ask:

> Does this help the user understand, record, or organize relationships between locations?

If not, the feature probably belongs in another application.

In particular, Roombound should resist becoming a full virtual tabletop.

A room does not need to become a detailed physical map simply because more information can be associated with it.

---

## 21. Development Philosophy

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

---

## 22. License

Roombound is currently not allowed to be copied or used without permission. This is intended to change in the future, but at the moment the project is not even alpha.
