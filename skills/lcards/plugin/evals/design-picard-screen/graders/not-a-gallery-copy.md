---
type: regex
target: { source: file, path: engineering.yaml }
# Signatures of the design-guide gallery screens (their area rows, column grids and
# titles): a screen that keeps one of them is a reskin of a gallery screen.
pattern: 'grid-template-columns: 110px 220px|"pills\s+nums|"headl\s+headl\s+headr"|"gauges\s+tiles\s+readout"|56px 150px 120px minmax\(0, 1fr\)|"codes\s+status"|170px minmax\(0, 3fr\) minmax\(0, 2fr\)|"side\s+pills\s+readout"|"side\s+status\s+readout"|"side\s+display\s+list"|"side\s+pills\s+list"|"upper\s+upper\s+cascade"|"side\s+list\s+numbers"|grid-template-columns: 130px 220px|"corner\s+corner\s+bar\s+bar"|"fcorner\s+fcorner\s+fbar|"tcorner\s+tcorner\s+tbar|"bcorner\s+bcorner\s+bbar|"ucorner\s+ucorner\s+upper|"lcorner\s+lcorner\s+lower|U\.S\.S\. TITAN · SYSTEMS|OPERATIONS • 40272|DECK PLAN · SECTION 7|SHUTTLECRAFT SYSTEMS|VOYAGER DUTY ROSTER|ENTERPRISE CREW ROSTER|SECTION MONITOR|WARP PROPULSION • 4471|"hsw\s+hsw\s+bar\s+bar\s+bar\s+util"|"lsw\s+lsw\s+lbar\s+ctop\s+rbar\s+rsw\s+rsw"|grid-template-columns: 130px 180px minmax\(0, 1fr\) 196px|LONG RANGE SCAN • 1576|U\.S\.S\. ENTERPRISE · OPERATIONS|NCC-1701 · SYSTEMS PROFILE'
match: not_contains
weight: 2
---
