/**
 * Data Grid Card Schema
 *
 * JSON Schema definition with x-ui-hints for LCARdS Data Grid Card.
 * Supports 3 data modes: random (decorative), template (manual), datasource (real-time)
 * with full CSS Grid configuration and hierarchical styling.
 *
 * @see doc/editor/schema-ui-hints.md
 * @see doc/user/configuration/cards/data-grid.md
 */

import { animationSchema, filterSchema } from './common-schemas.js';

export const dataGridSchema = {
    "type": "object",
    "required": [
        "type",
        "data_mode"
    ],
    "properties": {
        // ====================================================================
        // HOME ASSISTANT REQUIRED PROPERTIES
        // ====================================================================

        "type": {
            "type": "string",
            "const": "custom:lcards-data-grid",
            "x-ui-hints": {
                "hidden": true
            }
        },

        // ====================================================================
        // CORE CONFIGURATION
        // ====================================================================

        "data_mode": {
            "type": "string",
            "enum": ["decorative", "data", "random", "template", "datasource"],
            "default": "decorative",
            "x-ui-hints": {
                "label": "Data Mode",
                "helper": "Choose data input mode: decorative (random) or data (real entities/sensors). Legacy: random→decorative, template/datasource→data",
                "selector": {
                    "select": {
                        "mode": "dropdown",
                        "options": [
                            { "value": "decorative", "label": "Decorative (Random Data)" },
                            { "value": "data", "label": "Data (Real Entities/Sensors)" },
                            { "value": "random", "label": "⚠️ Random (deprecated, use decorative)" },
                            { "value": "template", "label": "⚠️ Template (deprecated, use data)" },
                            { "value": "datasource", "label": "⚠️ DataSource (deprecated, use data)" }
                        ]
                    }
                }
            }
        },

        // ====================================================================
        // RANDOM MODE PROPERTIES
        // ====================================================================

        "format": {
            "type": "string",
            "enum": ["digit", "float", "alpha", "hex", "mixed"],
            "default": "mixed",
            "x-ui-hints": {
                "label": "Data Format",
                "helper": "Format for randomly generated data",
                "showIf": { "data_mode": ["decorative", "random"] },
                "selector": {
                    "select": {
                        "mode": "dropdown",
                        "options": [
                            { "value": "digit", "label": "Digit (0042, 1337)" },
                            { "value": "float", "label": "Float (42.17, 3.14)" },
                            { "value": "alpha", "label": "Alpha (AB, XY)" },
                            { "value": "hex", "label": "Hex (A3F1, 00FF)" },
                            { "value": "mixed", "label": "Mixed (various)" }
                        ]
                    }
                }
            }
        },

        "refresh_interval": {
            "type": "number",
            "minimum": 0,
            "default": 0,
            "x-ui-hints": {
                "label": "Refresh Interval",
                "helper": "Auto-refresh interval in milliseconds (0 = disabled)",
                "showIf": { "data_mode": ["decorative", "random"] },
                "selector": {
                    "number": {
                        "mode": "box",
                        "min": 0,
                        "max": 60000,
                        "step": 100,
                        "unit_of_measurement": "ms"
                    }
                }
            }
        },

        // ====================================================================
        // DATA MODE PROPERTIES
        // ====================================================================

        "rows": {
            "type": "array",
            "x-ui-hints": {
                "label": "Grid Rows",
                "helper": "Row definitions with auto-detected cell types (static text, entity IDs, or {{templates}})",
                "showIf": { "data_mode": ["data", "template", "datasource"] }
            },
            "items": {
                "oneOf": [
                    {
                        "type": "array",
                        "title": "Simple Row",
                        "description": "Array of cell values (auto-detects static text, entity IDs, or templates)",
                        "items": {
                            "type": ["string", "number"]
                        }
                    },
                    {
                        "type": "object",
                        "title": "Styled Row",
                        "description": "Row with values and optional style overrides",
                        "properties": {
                            "values": {
                                "type": "array",
                                "items": {
                                    "type": ["string", "number"]
                                }
                            },
                            "style": {
                                "type": "object",
                                "description": "Row-level style overrides"
                            }
                        },
                        "required": ["values"]
                    }
                ]
            }
        },

        // ====================================================================
        // CSS GRID CONFIGURATION
        // ====================================================================

        "grid": {
            "type": "object",
            "x-ui-hints": {
                "label": "Grid Layout Configuration"
            },
            "properties": {
                // Standard CSS Grid Properties
                "grid-template-columns": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Grid Template Columns",
                        "helper": "CSS Grid columns definition (e.g., 'repeat(12, 1fr)' or '100px 1fr 2fr')",
                        "selector": {
                            "text": {
                                "placeholder": "repeat(12, 1fr)"
                            }
                        }
                    }
                },

                "grid-template-rows": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Grid Template Rows",
                        "helper": "CSS Grid rows definition (e.g., 'repeat(8, auto)' or '50px 100px auto')",
                        "selector": {
                            "text": {
                                "placeholder": "repeat(8, auto)"
                            }
                        }
                    }
                },

                "gap": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Gap (Uniform)",
                        "helper": "Uniform spacing between cells (e.g., '8px' or '1rem')",
                        "selector": {
                            "text": {
                                "placeholder": "8px"
                            }
                        }
                    }
                },

                "row-gap": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Row Gap",
                        "helper": "Vertical spacing between rows",
                        "selector": {
                            "text": {
                                "placeholder": "8px"
                            }
                        }
                    }
                },

                "column-gap": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Column Gap",
                        "helper": "Horizontal spacing between columns",
                        "selector": {
                            "text": {
                                "placeholder": "8px"
                            }
                        }
                    }
                },

                "grid-auto-flow": {
                    "type": "string",
                    "enum": ["row", "column", "dense", "row dense", "column dense"],
                    "default": "row",
                    "x-ui-hints": {
                        "label": "Auto Flow",
                        "helper": "How cells automatically fill the grid",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "row", "label": "Row" },
                                    { "value": "column", "label": "Column" },
                                    { "value": "dense", "label": "Dense" },
                                    { "value": "row dense", "label": "Row Dense" },
                                    { "value": "column dense", "label": "Column Dense" }
                                ]
                            }
                        }
                    }
                },

                "justify-items": {
                    "type": "string",
                    "enum": ["stretch", "start", "end", "center"],
                    "default": "stretch",
                    "x-ui-hints": {
                        "label": "Justify Items",
                        "helper": "Horizontal alignment of cells within their grid areas",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "stretch", "label": "Stretch" },
                                    { "value": "start", "label": "Start" },
                                    { "value": "end", "label": "End" },
                                    { "value": "center", "label": "Center" }
                                ]
                            }
                        }
                    }
                },

                "align-items": {
                    "type": "string",
                    "enum": ["stretch", "start", "end", "center"],
                    "default": "stretch",
                    "x-ui-hints": {
                        "label": "Align Items",
                        "helper": "Vertical alignment of cells within their grid areas",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "stretch", "label": "Stretch" },
                                    { "value": "start", "label": "Start" },
                                    { "value": "end", "label": "End" },
                                    { "value": "center", "label": "Center" }
                                ]
                            }
                        }
                    }
                },

                // Advanced CSS Grid Properties
                "grid-auto-columns": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Auto Columns",
                        "helper": "Width of implicit columns (e.g., '100px' or '1fr')",
                        "selector": {
                            "text": {
                                "placeholder": "1fr"
                            }
                        }
                    }
                },

                "grid-auto-rows": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Auto Rows",
                        "helper": "Height of implicit rows (e.g., '50px' or 'auto')",
                        "selector": {
                            "text": {
                                "placeholder": "auto"
                            }
                        }
                    }
                },

                "justify-content": {
                    "type": "string",
                    "enum": ["start", "end", "center", "space-between", "space-around", "space-evenly"],
                    "x-ui-hints": {
                        "label": "Justify Content",
                        "helper": "Horizontal alignment of the grid within the card",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "start", "label": "Start" },
                                    { "value": "end", "label": "End" },
                                    { "value": "center", "label": "Center" },
                                    { "value": "space-between", "label": "Space Between" },
                                    { "value": "space-around", "label": "Space Around" },
                                    { "value": "space-evenly", "label": "Space Evenly" }
                                ]
                            }
                        }
                    }
                },

                "align-content": {
                    "type": "string",
                    "enum": ["start", "end", "center", "space-between", "space-around", "space-evenly"],
                    "x-ui-hints": {
                        "label": "Align Content",
                        "helper": "Vertical alignment of the grid within the card",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "start", "label": "Start" },
                                    { "value": "end", "label": "End" },
                                    { "value": "center", "label": "Center" },
                                    { "value": "space-between", "label": "Space Between" },
                                    { "value": "space-around", "label": "Space Around" },
                                    { "value": "space-evenly", "label": "Space Evenly" }
                                ]
                            }
                        }
                    }
                },

                // Legacy Shorthand Properties (deprecated but supported)
                "rows": {
                    "type": "number",
                    "minimum": 1,
                    "x-ui-hints": {
                        "label": "Rows (Legacy)",
                        "helper": "⚠️ Deprecated: Use grid-template-rows instead",
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 1,
                                "max": 100
                            }
                        }
                    }
                },

                "columns": {
                    "type": "number",
                    "minimum": 1,
                    "x-ui-hints": {
                        "label": "Columns (Legacy)",
                        "helper": "⚠️ Deprecated: Use grid-template-columns instead",
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 1,
                                "max": 100
                            }
                        }
                    }
                },

                "cell_width": {
                    "oneOf": [
                        {
                            "type": "string",
                            "const": "auto",
                            "title": "Auto"
                        },
                        {
                            "type": "number",
                            "title": "Fixed Width",
                            "minimum": 0
                        }
                    ],
                    "x-ui-hints": {
                        "label": "Cell Width (Legacy)",
                        "helper": "⚠️ Deprecated: Use grid-template-columns instead"
                    }
                }
            }
        },

        // ====================================================================
        // HIERARCHICAL STYLING
        // ====================================================================

        "style": {
            "type": "object",
            "x-ui-hints": {
                "label": "Grid-Wide Style",
                "helper": "Default styling applied to all cells"
            },
            "properties": {
                "font_size": {
                    "type": ["number", "string"],
                    "x-ui-hints": {
                        "label": "Font Size",
                        "helper": "Font size in px or with unit (e.g., '18px', '1.2rem'). Number values auto-convert to px.",
                        "selector": {
                            "text": {
                                "placeholder": "18"
                            }
                        }
                    }
                },

                "font_family": {
                    "type": "string",
                    "format": "font-family",
                    "x-ui-hints": {
                        "label": "Font Family",
                        "helper": "Font family for cell text. Use LCARdS fonts (Antonio, Oswald) or system fonts",
                        "selector": {
                            "text": {
                                "placeholder": "Antonio, sans-serif"
                            }
                        }
                    }
                },

                "font_weight": {
                    "type": ["number", "string"],
                    "x-ui-hints": {
                        "label": "Font Weight",
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 100,
                                "max": 900,
                                "step": 100
                            }
                        }
                    }
                },

                "color": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Text Color",
                        "helper": "Cell text color (supports theme tokens like 'theme:colors.lcars.blue')",
                        "selector": {
                            "ui_color": {
                                "default_color": "theme:colors.grid.cellText"
                            }
                        }
                    }
                },

                "background": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Background Color",
                        "helper": "Cell background color (supports theme tokens like 'theme:colors.lcars.dark-blue')",
                        "selector": {
                            "ui_color": {
                                "default_color": "transparent"
                            }
                        }
                    }
                },

                "align": {
                    "type": "string",
                    "enum": ["left", "center", "right"],
                    "default": "right",
                    "x-ui-hints": {
                        "label": "Text Alignment",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "left", "label": "Left" },
                                    { "value": "center", "label": "Center" },
                                    { "value": "right", "label": "Right" }
                                ]
                            }
                        }
                    }
                },

                "padding": {
                    "type": ["number", "string"],
                    "x-ui-hints": {
                        "label": "Padding",
                        "helper": "Cell padding in px or with unit",
                        "selector": {
                            "text": {
                                "placeholder": "8px"
                            }
                        }
                    }
                },

                "border_width": {
                    "type": "number",
                    "minimum": 0,
                    "x-ui-hints": {
                        "label": "Border Width",
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 0,
                                "max": 10,
                                "unit_of_measurement": "px"
                            }
                        }
                    }
                },

                "border_color": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Border Color",
                        "helper": "Cell border color (supports theme tokens)",
                        "selector": {
                            "ui_color": {
                                "default_color": "theme:colors.grid.cellBorder"
                            }
                        }
                    }
                },

                "border_style": {
                    "type": "string",
                    "enum": ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"],
                    "default": "solid",
                    "x-ui-hints": {
                        "label": "Border Style",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "solid", "label": "Solid" },
                                    { "value": "dashed", "label": "Dashed" },
                                    { "value": "dotted", "label": "Dotted" },
                                    { "value": "double", "label": "Double" },
                                    { "value": "groove", "label": "Groove" },
                                    { "value": "ridge", "label": "Ridge" },
                                    { "value": "inset", "label": "Inset" },
                                    { "value": "outset", "label": "Outset" }
                                ]
                            }
                        }
                    }
                }
            }
        },

        // ====================================================================
        // ANIMATION CONFIGURATION (Standard animations array pattern)
        // ====================================================================

        "animations": {
            "type": "array",
            "x-ui-hints": {
                "label": "Animations",
                "helper": "Animation definitions triggered by events (on_load, on_hover, etc.)"
            },
            "items": animationSchema
        },

        // FILTERS CONFIGURATION (Standard filters array pattern)
        // ====================================================================

        "filters": {
            "type": "array",
            "x-ui-hints": {
                "label": "Visual Filters",
                "helper": "CSS and SVG filters applied to the entire data grid"
            },
            "items": filterSchema
        },

        // ====================================================================
        // CARD METADATA
        // ====================================================================

        "id": {
            "type": "string",
            "x-ui-hints": {
                "label": "Card ID",
                "helper": "Unique identifier for rules engine targeting",
                "selector": {
                    "text": {}
                }
            }
        },

        "tags": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "x-ui-hints": {
                "label": "Tags",
                "helper": "Tags for rules engine categorization",
                "selector": {
                    "text": {
                        "multiple": true
                    }
                }
            }
        }
    }
};
