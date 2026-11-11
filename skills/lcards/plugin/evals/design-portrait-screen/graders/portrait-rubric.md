---
type: llm
focus: { source: file, path: phone.yaml }
---

PASS if the view's layout is built for an upright phone: one column of content, or two, with the sections stacked top to bottom. Narrow fixed px tracks for small parts (for example `64px 64px` for a column of code blocks beside the content, or a 60 px gauge) do not count as content columns.
FAIL if the main grid is a wide landscape layout with three or more side-by-side columns of content, or a desktop screen copied with smaller numbers.
