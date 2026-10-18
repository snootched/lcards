---
type: llm
focus: { source: file, path: phone.yaml }
---

PASS if the view's layout is built for an upright phone: its main grid has one or two narrow columns (for example `grid-template-columns` with at most two tracks, or a single column) and the sections stack top to bottom.
FAIL if the main grid is a wide landscape layout with three or more side-by-side columns of content, or a desktop screen copied with smaller numbers.
