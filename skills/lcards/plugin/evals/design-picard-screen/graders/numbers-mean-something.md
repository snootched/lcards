---
type: llm
focus: { source: file, path: engineering.yaml }
---

PASS if the numbers on the screen are mostly the user's readings with short labels (for example a readings table, readout rows, gauges or blocks showing entity states), and decorative number cascades (data grids with `data_mode: decorative` or no rows) fill at most one area, apart from short groups of three or four rows inside a code-block column.
FAIL if two or more decorative cascades fill separate areas, or large grids of random numbers stand where the user's readings could go.
