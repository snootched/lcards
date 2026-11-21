![LCARdS Banner](doc/public/img/lcards-banner.gif)

**A unified card system for Home Assistant inspired by the iconic Star Trek LCARS interfaces.
<br>Build your own LCARS-style dashboards and Master Systems Display (MSD) with realistic controls, reactivity and animations.**

[![GitHub release](https://img.shields.io/github/v/release/snootched/lcards?logo=startrek&logoColor=37a6d1&color=37a6d1)](https://github.com/snootched/LCARdS/releases)

![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/snootched/lcards/latest/total?logo=startrek&logoColor=37a6d1&label=Latest%20Release%20Downloads&color=37a6d1)

[![License](https://img.shields.io/badge/license-MIT-37a6d1?logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/snootched/LCARdS?style=default&logo=git&logoColor=white&color=37a6d1)](https://github.com/snootched/LCARdS/commits/main)
[![GitHub Repo stars](https://img.shields.io/github/stars/snootched/lcards?style=flat&logo=stardock&logoColor=37a6d1&color=37a6d1)](https://github.com/snootched/lcards/stargazers)

<br>

### [Documentation](https://lcards.unimatrix01.ca) · [Dashboard Gallery](https://lcards.unimatrix01.ca/getting-started/dashboard-gallery) · [AI help](https://lcards.unimatrix01.ca/getting-started/ai-assistance) · [Getting help](https://lcards.unimatrix01.ca/getting-started/getting-help)

[![Picard-era operations screen: a 3D Enterprise with labelled systems, sliders and status readouts (see it live in the Live Demo)](doc/public/gallery/picard-operations.webp)](https://lcards.unimatrix01.ca/getting-started/live-demo)

<br>

<table>
  <tr>
    <td><img src="doc/public/gallery/bridge.webp" alt="Classic bridge screen: framed history chart, ship status readout and rows of pill buttons" /></td>
    <td><img src="doc/public/gallery/picard-console.webp" alt="Picard-era deck plan: a shuttle cutaway with callouts, gauges and status bars" /></td>
  </tr>
  <tr>
    <td><img src="doc/public/gallery/engineering.webp" alt="Master systems display: a ship schematic with controls joined by routed lines" /></td>
    <td><img src="doc/public/gallery/sciences.webp" alt="Sciences screen: history chart, radial gauges, a sensor log and a bar chart" /></td>
  </tr>
</table>

<sub>Every dashboard above is in the <a href="https://lcards.unimatrix01.ca/getting-started/dashboard-gallery">gallery</a>, with its YAML to copy.</sub>

## What you get

- **A full LCARS toolkit:** buttons, elbows, sliders, charts, data grids, select menus and ship displays, all sharing one look and one theme.
- **3D astrometrics:** star maps, planets and starships in real 3D, driven by your entities.
- **Dashboards that build themselves:** pick the LCARS dashboard or section strategy and get a full screen from your areas and entities, then make it your own.
- **Alive with your home:** colours, animations and sounds follow entity state; red, yellow or blue alert repaints the whole dashboard.
- **Live data:** history, smoothing and statistics in charts, tables and any label.
- **Visual editors everywhere:** every card has an editor, plus studios for layouts, charts, alerts and ship displays.
- **Help when you need it:** a [gallery](https://lcards.unimatrix01.ca/getting-started/dashboard-gallery) of sample screens to copy, a [config checker](https://lcards.unimatrix01.ca/getting-started/config-checker), and an [LCARdS skill](https://lcards.unimatrix01.ca/getting-started/ai-assistance) that teaches Claude to write your YAML.

## Install

[![Open your Home Assistant instance and open a repository in the Marketplace.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=snootched&repository=lcards&category=integrations)

1. In the **Marketplace**, search for **LCARdS** under **Integrations** and download it.
2. Restart Home Assistant.
3. Go to **Settings > Devices & services > Add integration > LCARdS**.

Requires **Home Assistant 2026.11 or newer**, and nothing else. Pair it with an [HA-LCARS theme](https://github.com/th3jesta/ha-lcars) for the full experience. See the [installation guide](https://lcards.unimatrix01.ca/getting-started/installation) for details.

## The cards

| Card | What it does |
|------|-------------|
| `lcards-button` | LCARS buttons and labels, plus multi-part controls (D-pad, alert symbol, custom shapes) |
| `lcards-elbow` | LCARS corners and frames, including Picard-style double elbows |
| `lcards-slider` | Bars and gauges to show or set a value |
| `lcards-select-menu` | A grid of buttons for an `input_select` or `select` entity |
| `lcards-data-grid` | Tables of live values, or decorative data cascades |
| `lcards-chart` | Charts of history, statistics and data sources (ApexCharts) |
| `lcards-alert-overlay` | The full-screen overlay shown during an alert mode |
| `lcards-msd-card` | Master Systems Display: a ship blueprint with cards joined by routed lines |
| `lcards-astrometrics-card` | Star maps, planets and starships in 3D, driven by your entities |
| `lcards-layout-card` | A grid of cards inside one card, with a visual Layout Studio |
| `lcards-layout-view` | A dashboard view type with the same visual grid editor |

Plus [dashboard and section strategies](https://lcards.unimatrix01.ca/getting-started/dashboard-strategies) that build LCARS screens from your areas and entities.

[Browse the cards](https://lcards.unimatrix01.ca/cards/) on the docs site, with live demos.

<sub>Coming from the older CB-LCARS cards? See [Coming from CB-LCARS](https://lcards.unimatrix01.ca/getting-started/cb-lcars-migration).</sub>

## Support & community

LCARdS is a hobby and passion project. If you find it useful (or just cool):

- ⭐ **Star the repo**: it helps other people find the project.
- **[Report issues](https://github.com/snootched/lcards/issues)**: open the LCARdS panel, **Welcome > Support & system info**, for a health check and a pre-filled bug report.
- **[Join discussions](https://github.com/snootched/lcards/discussions)**: questions, ideas, and showing off what you've built are all welcome.
- **[Contribute](CONTRIBUTING.md)**: fixes and features start with an issue; AI-assisted pull requests are welcome.

> [!NOTE]
> LCARdS is a hobby project, not a fully commissioned Starfleet product: expect the occasional tribble. It is for personal use, and AI coding tools are used in its development (see [AI use](#ai-use)).

---

## AI use

LCARdS is built with AI coding assistants (mainly Claude Code), directed by its maintainer. What to build, how it fits together and what ships are human decisions. Changes are reviewed and run through the automated test suites and a live Home Assistant before release. Commits written with an assistant say so in a `Co-Authored-By:` trailer. Contributors are welcome to use AI too; see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Acknowledgements & thanks

A very sincere thanks to these projects and their authors, contributors and communities:

[**ha-lcars theme**](https://github.com/th3jesta/ha-lcars): the definitive LCARS theme for Home Assistant

[LCARSlad London](https://twitter.com/lcarslad) for excellent LCARS images and diagrams for reference.

[meWho Titan.DS](https://www.mewho.com/titan) for such a cool interactive design demo and colour reference. Such a cool UI to aspire to!

[TheLCARS.com](https://www.thelcars.com): a great LCARS design reference, and the original base reference for colours, Data Cascade and Pulsewave animations.

[lcars](https://github.com/joernweissenborn/lcars) for the SVG used inline in the D-pad control.

[**lovelace-layout-card**](https://github.com/thomasloven/lovelace-layout-card) · [**lovelace-card-mod**](https://github.com/thomasloven/lovelace-card-mod)

**All Star Trek & LCARS fans**: your passion drives this project 🖖

---

## License & disclaimers

This project is released under the [MIT License](LICENSE).

**A STAR TREK FAN PRODUCTION**

This project is a non-commercial fan production. Star Trek and all related marks, logos, and characters are solely owned by CBS Studios Inc.
This fan production is not endorsed by, sponsored by, nor affiliated with CBS, Paramount Pictures, or any other Star Trek franchise.

No commercial exhibition or distribution is permitted. No alleged independent rights will be asserted against CBS or Paramount Pictures.
This work is intended for personal and recreational use only.

---

🖖 **Live long and prosper** 🖖
