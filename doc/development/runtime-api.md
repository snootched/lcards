# Runtime API Reference

Production utilities for MSD cards, accessed via `window.lcards.cards.msd`.

```javascript
window.lcards.cards.msd.getAll()
window.lcards.cards.msd.getById('bridge')
```

---

## `getAll()`

Returns all MSD card elements registered with SystemsManager. Falls back to `querySelectorAll('lcards-msd-card')` if SystemsManager isn't available.

```javascript
const cards = window.lcards.cards.msd.getAll();
// Returns: Array<Element>

cards.forEach(card => {
  console.log(card._msdPipeline?.config?.id);
});
```

---

## `getById(id)`

Returns the MSD card element whose config `id` attribute matches, or `null` if not found. Falls back to a DOM query if SystemsManager isn't available.

**Parameters:**
- `id` (string) — Card config ID (set via `id:` in the card config)

```javascript
const card = window.lcards.cards.msd.getById('bridge');
// Returns: Element | null

if (card) {
  const pipeline = card._msdPipeline;
  console.log('Overlays:', pipeline?.getResolvedModel()?.overlays?.length);
}
```

---

## Advanced Introspection

For deeper debugging (routing, styles, rules, animations, pipeline), use the [Debug API](debug-api.md) at `window.lcards.debug.msd`.

## See Also

- [Debug API](debug-api.md)
- [Systems Manager](../architecture/subsystems/systems-manager.md)
