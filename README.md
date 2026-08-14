# Roombound

*A lightweight, player-facing exploration mapper for tabletop RPGs.*

## 1. Project Overview

### Purpose

Roombound is a free, lightweight mapping and note-taking tool for tabletop RPGs.

It is designed around situations where players (or gms) want to keep track of:
- Places they have visited
- Rooms and locations they have discovered
- Connections between those locations
- Doors, passages, stairs, and other transitions
- Locations they haven't fully explored
- Notes and observations about locations
- External resources associated with locations

Roombound focuses on **relationships between locations**, rather than precise physical maps.

### Core Concept

A Roombound map is a **graph presented spatially**.

- **Nodes** represent rooms or locations.
- **Edges** represent connections between locations.
- Nodes can be freely moved around the map.
- Connections automatically remain attached to their nodes.
- Notes and metadata can be associated with nodes and connections.

The visual arrangement is primarily for **human comprehension**, not physical accuracy.

---

## 2. Design Goals

Roombound should be:

### Simple

A user should be able to create a useful map without learning a complex mapping application.

### Fast

Adding a room and connecting it to another room should take seconds.

### Player-Facing

The primary use case is a player maintaining their own record of an explored environment.
The secondary use case is if a GM wants to brainstorm a relationship between a set of rooms without comitting to a full battlemap pass

### Flexible

The system should work for:

- Dungeons
- Buildings
- Cities
- Wilderness
- Complexes
- Spaceships
- Other connected locations

### Free

Roombound is intended to remain a free project.

### Extensible

Features should be designed so additional functionality can be added without requiring the core mapping system to become complicated.

---

## 3. Non-Goals

**Roombound is not a virtual tabletop.**

The project does **not** initially attempt to provide:

- Battlemap creation
- Tactical combat positioning
- Character tokens
- Initiative tracking
- Dice rolling
- Line of sight
- Lighting systems
- Fog-of-war simulation
- Monster/NPC stat blocks
- Automated game rules
- Detailed terrain rendering
- 3D environments

A location does not need to represent its actual physical dimensions.

A room node is a **record of a location**, not a battlemap.

---

## 4. Core Map Model

### Locations

A location is represented by a movable node.

A location may contain:

- Name
- Description
- Notes
- Status
- Tags
- External links

The visual size and position of a location are primarily organizational.

### Connections

A connection represents a relationship between two locations.

Examples:

- Door
- Hallway
- Stairway
- Passage
- Teleporter
- Secret passage
- One-way route
- Unknown connection

Connections should remain attached to their associated locations when locations are moved.

### Unresolved Connections

A connection may exist without a known destination.

Example:

```text
Room 12
   │
   │ Unknown door
   │
   ?
```



## 5. Connection State

### Connections should support lightweight states such as:

Open
Closed
Locked
Secret
Blocked
Unknown
One-way

The exact visual representation is a UI decision and should remain flexible during development.

## 6. Notes

Notes are a core feature rather than an afterthought.

Locations should support freeform notes such as:

Three sarcophagi.
One is empty.
Door to the north is locked.
We heard something behind the eastern wall.

Connections should also be able to contain notes.

Example:

Locked. Need a key.

Notes should remain lightweight and should not attempt to become a full campaign-management/wiki system.

## 7. External Links

Locations may optionally contain external URLs.

The initial implementation should treat these simply as links.

Examples:

Battlemap
Campaign wiki
Google Docs
Images
PDFs
Other mapping tools
GM notes

Roombound does not initially need to understand or integrate with the linked resource.

Example:

External Resource:
https://example.com/my-battlemap

This allows GM-oriented use without requiring Roombound to become a battlemap application.

## 8. Player / GM Use

Roombound is primarily designed for players, but the underlying map structure can also support GM use.

Player Use

A player can record:

Where have we been?
What connects to what?
What doors remain unexplored?
What did we find?
GM Use

A GM can use the same system for:

Dungeon brainstorming
Location organization
Planning connections
Linking detailed maps or notes

The distinction between player and GM functionality should not unnecessarily complicate the core mapping system.

## 9. Visual Philosophy

The map should prioritize:

Clarity > Accuracy > Decoration

Locations should be visually distinct and easy to rearrange.

Connections should remain readable when locations move.

The application should avoid unnecessary visual complexity associated with traditional battlemap software.

The map should feel more like:

An interactive notebook / relationship diagram

than:

A tactical map.

## 10. Data Model

The map should be representable as structured data.

Conceptually:

Map
 ├── Locations
 │    ├── ID
 │    ├── Name
 │    ├── Position
 │    ├── Size
 │    ├── Notes
 │    ├── Tags
 │    └── Links
 │
 └── Connections
      ├── ID
      ├── Source
      ├── Destination
      ├── Type
      ├── State
      └── Notes

The exact implementation should not be locked down prematurely.

## 11. Technology

Initial implementation is planned as a web application using:

HTML
CSS
JavaScript

Potential libraries may be used for graph visualization, node manipulation, edge routing, or other functionality where they significantly reduce implementation complexity.

The project should avoid unnecessary dependencies.

## 12. Initial MVP

The first usable version should contain only:

Create location
Delete location
Move location
Rename location
Create connection
Delete connection
Move connected locations without breaking connections
Zoom
Pan
Save map
Load map
Basic location notes
Basic connection notes
External URL associated with a location

Anything beyond this should be considered post-MVP unless it becomes necessary for the core workflow.

## 13. Future Possibilities

Potential future features include:

Multiple map levels
Fog/reveal states
Tags
Search
Connection-specific icons
Custom location icons
Images
Player/GM modes
Map sharing
Collaboration
Export/import
Automatic edge routing
Custom themes
Print/export functionality

These are ideas, not commitments.

## 14. Scope Boundary

Roombound should remain a lightweight exploration and relationship-mapping tool.

When considering a new feature, ask:

Does this help the user understand, record, or organize relationships between locations?

If not, the feature probably belongs in another application.

In particular, Roombound should resist becoming a full virtual tabletop.

## 15. Development Philosophy

The project should favor:

Simple implementations
Small features
Replaceable components
Human-readable data
Minimal configuration
Fast iteration
Useful functionality over visual polish

The application should be useful before it is pretty.

## 16. License

Roombound is currently not allwed to be coppied or used without permission. that is intended to change in the future, but at the moment its not even alpha.
