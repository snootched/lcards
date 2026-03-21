# Developer Guide

Documentation for developers extending LCARdS — building custom cards, editors, and packs.

## How-to Guides

| Page | Description |
|---|---|
| [Building a Custom Card](custom-card.md) | Extend `LCARdSCard`, wire lifecycle hooks, register in `lcards.js` |
| [Building an Editor](building-an-editor.md) | Add a visual editor to your card using `LCARdSBaseEditor` |
| [Building a Pack](building-a-pack.md) | Bundle style presets, components, themes, audio, and more into a distributable pack |

## API Reference

| Page | Description |
|---|---|
| [Animation API](anim-api.md) | `window.lcards.anim.*` — anime.js v4 access, helpers, presets, scopes |
| [Assets & SVG API](assets-api.md) | Font loading, SVG cache, SVG/anchor helpers, text measure cache |
| [Color Resolution](color-resolution.md) | Correct patterns for resolving CSS vars, computed expressions (`darken`, `lighten`, `alpha`, etc.) in all contexts |
| [Debug API](debug-api.md) | Console introspection: log level, core singletons, MSD cards, data sources |
| [Helpers API](helpers-api.md) | WebSocket-based HA helper management — create, read, update, delete |

## Release Notes

| Page | Description |
|---|---|
| [Changelog](changelog.md) | Release notes and breaking changes |
