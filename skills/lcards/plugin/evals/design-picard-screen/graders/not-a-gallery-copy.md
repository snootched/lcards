---
type: regex
target: { source: file, path: engineering.yaml }
# Signatures of the six design-guide gallery screens (their area rows, column grids and
# titles): a screen that keeps one of them is a reskin of a gallery screen.
pattern: 'grid-template-columns: 110px 220px|"pills\s+nums|"headl\s+headl\s+headr"|"gauges\s+tiles\s+readout"|56px 150px 120px minmax\(0, 1fr\)|"codes\s+status"|170px minmax\(0, 3fr\) minmax\(0, 2fr\)|"side\s+pills\s+readout"|"side\s+status\s+readout"|"side\s+display\s+list"|"side\s+pills\s+list"|"upper\s+upper\s+cascade"|"side\s+list\s+numbers"|U\.S\.S\. TITAN · SYSTEMS|OPERATIONS • 40272|DECK PLAN · SECTION 7|SHUTTLECRAFT SYSTEMS|VOYAGER DUTY ROSTER'
match: not_contains
weight: 2
---
