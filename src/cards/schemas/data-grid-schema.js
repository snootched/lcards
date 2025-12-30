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
            "enum": ["random", "template", "datasource"],
            "default": "random",
            "x-ui-hints": {
                "label": "Data Mode",
                "helper": "Choose data input mode: random (decorative), template (manual), datasource (real-time)",
                "selector": {
                    "select": {
                        "mode": "dropdown",
                        "options": [
                            { "value": "random", "label": "Random (Decorative)" },
                            { "value": "template", "label": "Template (Manual Grid)" },
                            { "value": "datasource", "label": "DataSource (Real-Time)" }
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
                "showIf": { "data_mode": "random" },
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
                "showIf": { "data_mode": "random" },
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
        // TEMPLATE MODE PROPERTIES
        // ====================================================================

        "rows": {
            "type": "array",
            "x-ui-hints": {
                "label": "Grid Rows",
                "helper": "Row definitions (template mode: array of arrays; datasource mode: row configs)",
                "showIf": { "data_mode": ["template", "datasource"] }
            },
            "items": {
                "oneOf": [
                    {
                        "type": "array",
                        "title": "Template Row",
                        "items": {
                            "type": ["string", "number"]
                        }
                    },
                    {
                        "type": "object",
                        "title": "DataSource Row",
                        "properties": {
                            "sources": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {
                                            "type": "string",
                                            "enum": ["static", "datasource"]
                                        },
                                        "column": {
                                            "type": "number",
                                            "minimum": 0
                                        },
                                        "value": {
                                            "type": ["string", "number"]
                                        },
                                        "source": {
                                            "type": "string"
                                        },
                                        "format": {
                                            "type": "string"
                                        }
                                    }
                                }
                            },
                            "style": {
                                "type": "object"
                            }
                        }
                    }
                ]
            }
        },

        // ====================================================================
        // DATASOURCE MODE PROPERTIES
        // ====================================================================

        "layout": {
            "type": "string",
            "enum": ["timeline", "spreadsheet"],
            "x-ui-hints": {
                "label": "Layout Type",
                "helper": "Choose layout: timeline (flowing data) or spreadsheet (structured grid)",
                "showIf": { "data_mode": "datasource" },
                "selector": {
                    "select": {
                        "mode": "dropdown",
                        "options": [
                            { "value": "timeline", "label": "Timeline (Flowing Data)" },
                            { "value": "spreadsheet", "label": "Spreadsheet (Structured Grid)" }
                        ]
                    }
                }
            }
        },

        "source": {
            "type": "string",
            "x-ui-hints": {
                "label": "Data Source",
                "helper": "Entity ID or DataSource name for timeline mode",
                "showIf": { 
                    "data_mode": "datasource",
                    "layout": "timeline"
                },
                "selector": {
                    "text": {
                        "placeholder": "sensor.temperature"
                    }
                }
            }
        },

        "history_hours": {
            "type": "number",
            "minimum": 0,
            "default": 1,
            "x-ui-hints": {
                "label": "History Hours",
                "helper": "Hours of historical data to preload",
                "showIf": { 
                    "data_mode": "datasource",
                    "layout": "timeline"
                },
                "selector": {
                    "number": {
                        "mode": "box",
                        "min": 0,
                        "max": 168,
                        "step": 1,
                        "unit_of_measurement": "hours"
                    }
                }
            }
        },

        "value_template": {
            "type": "string",
            "default": "{value}",
            "x-ui-hints": {
                "label": "Value Template",
                "helper": "Format template for displayed values (e.g., '{value}°C')",
                "showIf": { 
                    "data_mode": "datasource",
                    "layout": "timeline"
                },
                "selector": {
                    "text": {
                        "placeholder": "{value}°C"
                    }
                }
            }
        },

        "columns": {
            "type": "array",
            "x-ui-hints": {
                "label": "Column Definitions",
                "helper": "Define columns for spreadsheet layout",
                "showIf": { 
                    "data_mode": "datasource",
                    "layout": "spreadsheet"
                }
            },
            "items": {
                "type": "object",
                "properties": {
                    "header": {
                        "type": "string",
                        "x-ui-hints": {
                            "label": "Header Text",
                            "selector": {
                                "text": {}
                            }
                        }
                    },
                    "width": {
                        "type": "number",
                        "minimum": 0,
                        "x-ui-hints": {
                            "label": "Width",
                            "selector": {
                                "number": {
                                    "mode": "box",
                                    "min": 0,
                                    "unit_of_measurement": "px"
                                }
                            }
                        }
                    },
                    "align": {
                        "type": "string",
                        "enum": ["left", "center", "right"],
                        "default": "left",
                        "x-ui-hints": {
                            "label": "Alignment",
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
                    "style": {
                        "type": "object",
                        "x-ui-hints": {
                            "label": "Column Style"
                        }
                    }
                }
            }
        },

        "data_sources": {
            "type": "object",
            "x-ui-hints": {
                "label": "Data Sources",
                "helper": "Named DataSource definitions (shared across all LCARdS)"
            },
            "additionalProperties": {
                "type": "object",
                "properties": {
                    "entity": {
                        "type": "string",
                        "format": "entity",
                        "x-ui-hints": {
                            "label": "Entity",
                            "selector": {
                                "entity": {}
                            }
                        }
                    },
                    "windowSeconds": {
                        "type": "number",
                        "minimum": 1,
                        "x-ui-hints": {
                            "label": "Window (seconds)",
                            "selector": {
                                "number": {
                                    "mode": "box",
                                    "min": 1,
                                    "unit_of_measurement": "s"
                                }
                            }
                        }
                    }
                }
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
                        "helper": "Font size in px or with unit (e.g., '18px', '1.2rem')",
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
                        "helper": "Font family (LCARdS fonts or system fonts)",
                        "selector": {
                            "text": {
                                "placeholder": "Antonio"
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
                        "helper": "Cell text color (supports theme tokens)",
                        "selector": {
                            "ui_color": {}
                        }
                    }
                },

                "background": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Background Color",
                        "helper": "Cell background color",
                        "selector": {
                            "ui_color": {}
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
                        "selector": {
                            "ui_color": {}
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

        "header_style": {
            "type": "object",
            "x-ui-hints": {
                "label": "Header Style",
                "helper": "Styling for header row (spreadsheet mode only)",
                "showIf": { 
                    "data_mode": "datasource",
                    "layout": "spreadsheet"
                }
            },
            "properties": {
                "background": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Background Color",
                        "selector": {
                            "ui_color": {}
                        }
                    }
                },
                "color": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Text Color",
                        "selector": {
                            "ui_color": {}
                        }
                    }
                },
                "font_size": {
                    "type": "number",
                    "x-ui-hints": {
                        "label": "Font Size",
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 8,
                                "max": 48,
                                "unit_of_measurement": "px"
                            }
                        }
                    }
                },
                "font_weight": {
                    "type": "number",
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
                "text_transform": {
                    "type": "string",
                    "enum": ["none", "uppercase", "lowercase", "capitalize"],
                    "default": "uppercase",
                    "x-ui-hints": {
                        "label": "Text Transform",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "none", "label": "None" },
                                    { "value": "uppercase", "label": "Uppercase" },
                                    { "value": "lowercase", "label": "Lowercase" },
                                    { "value": "capitalize", "label": "Capitalize" }
                                ]
                            }
                        }
                    }
                },
                "padding": {
                    "type": "string",
                    "x-ui-hints": {
                        "label": "Padding",
                        "selector": {
                            "text": {
                                "placeholder": "12px 8px"
                            }
                        }
                    }
                },
                "border_bottom_width": {
                    "type": "number",
                    "x-ui-hints": {
                        "label": "Bottom Border Width",
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
                "border_bottom_color": {
                    "type": "string",
                    "format": "color",
                    "x-ui-hints": {
                        "label": "Bottom Border Color",
                        "selector": {
                            "ui_color": {}
                        }
                    }
                },
                "border_bottom_style": {
                    "type": "string",
                    "enum": ["solid", "dashed", "dotted"],
                    "default": "solid",
                    "x-ui-hints": {
                        "label": "Bottom Border Style",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "solid", "label": "Solid" },
                                    { "value": "dashed", "label": "Dashed" },
                                    { "value": "dotted", "label": "Dotted" }
                                ]
                            }
                        }
                    }
                }
            }
        },

        // ====================================================================
        // ANIMATION CONFIGURATION
        // ====================================================================

        "animation": {
            "type": "object",
            "x-ui-hints": {
                "label": "Animation Configuration"
            },
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["cascade", "none"],
                    "default": "none",
                    "x-ui-hints": {
                        "label": "Animation Type",
                        "helper": "Enable cascade animation for waterfall color cycling effect",
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "none", "label": "None" },
                                    { "value": "cascade", "label": "Cascade (Waterfall Effect)" }
                                ]
                            }
                        }
                    }
                },

                "pattern": {
                    "type": "string",
                    "enum": ["default", "niagara", "fast", "custom"],
                    "default": "default",
                    "x-ui-hints": {
                        "label": "Timing Pattern",
                        "helper": "Preset timing patterns for cascade animation",
                        "showIf": { "animation.type": "cascade" },
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "default", "label": "Default (Varied Organic)" },
                                    { "value": "niagara", "label": "Niagara (Smooth Uniform)" },
                                    { "value": "fast", "label": "Fast (Quick Waterfall)" },
                                    { "value": "custom", "label": "Custom (Define Your Own)" }
                                ]
                            }
                        }
                    }
                },

                "colors": {
                    "type": "object",
                    "x-ui-hints": {
                        "label": "Cascade Colors",
                        "helper": "3-color cycle for cascade animation",
                        "showIf": { "animation.type": "cascade" }
                    },
                    "properties": {
                        "start": {
                            "type": "string",
                            "format": "color",
                            "x-ui-hints": {
                                "label": "Start Color",
                                "helper": "Starting color (75% dwell)",
                                "selector": {
                                    "ui_color": {}
                                }
                            }
                        },
                        "text": {
                            "type": "string",
                            "format": "color",
                            "x-ui-hints": {
                                "label": "Middle Color",
                                "helper": "Middle color (10% snap)",
                                "selector": {
                                    "ui_color": {}
                                }
                            }
                        },
                        "end": {
                            "type": "string",
                            "format": "color",
                            "x-ui-hints": {
                                "label": "End Color",
                                "helper": "Ending color (10% brief)",
                                "selector": {
                                    "ui_color": {}
                                }
                            }
                        }
                    }
                },

                "speed_multiplier": {
                    "type": "number",
                    "minimum": 0.1,
                    "maximum": 10,
                    "default": 1.0,
                    "x-ui-hints": {
                        "label": "Speed Multiplier",
                        "helper": "Speed multiplier (2.0 = twice as fast, 0.5 = half speed)",
                        "showIf": { "animation.type": "cascade" },
                        "selector": {
                            "number": {
                                "mode": "slider",
                                "min": 0.1,
                                "max": 10,
                                "step": 0.1
                            }
                        }
                    }
                },

                "duration": {
                    "type": "number",
                    "minimum": 100,
                    "x-ui-hints": {
                        "label": "Override Duration",
                        "helper": "Override all row durations (milliseconds). Leave empty to use pattern timing.",
                        "showIf": { "animation.type": "cascade" },
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 100,
                                "max": 10000,
                                "step": 100,
                                "unit_of_measurement": "ms"
                            }
                        }
                    }
                },

                "easing": {
                    "type": "string",
                    "default": "linear",
                    "x-ui-hints": {
                        "label": "Easing Function",
                        "helper": "Animation easing (e.g., 'linear', 'ease', 'ease-in-out')",
                        "showIf": { "animation.type": "cascade" },
                        "selector": {
                            "text": {
                                "placeholder": "linear"
                            }
                        }
                    }
                },

                "timing": {
                    "type": "array",
                    "x-ui-hints": {
                        "label": "Custom Timing",
                        "helper": "Custom per-row timing array (only for pattern: custom)",
                        "showIf": { 
                            "animation.type": "cascade",
                            "animation.pattern": "custom"
                        }
                    },
                    "items": {
                        "type": "object",
                        "properties": {
                            "duration": {
                                "type": "number",
                                "minimum": 100
                            },
                            "delay": {
                                "type": "number",
                                "minimum": 0
                            }
                        }
                    }
                },

                // Change Detection
                "highlight_changes": {
                    "type": "boolean",
                    "default": false,
                    "x-ui-hints": {
                        "label": "Highlight Changes",
                        "helper": "Enable animation when cell values change",
                        "selector": {
                            "boolean": {}
                        }
                    }
                },

                "change_preset": {
                    "type": "string",
                    "enum": ["pulse", "glow", "flash"],
                    "default": "pulse",
                    "x-ui-hints": {
                        "label": "Change Animation Preset",
                        "helper": "Animation style for value changes",
                        "showIf": { "animation.highlight_changes": true },
                        "selector": {
                            "select": {
                                "mode": "dropdown",
                                "options": [
                                    { "value": "pulse", "label": "Pulse (Scale & Fade)" },
                                    { "value": "glow", "label": "Glow (Shadow Effect)" },
                                    { "value": "flash", "label": "Flash (Background Color)" }
                                ]
                            }
                        }
                    }
                },

                "change_duration": {
                    "type": "number",
                    "minimum": 100,
                    "default": 500,
                    "x-ui-hints": {
                        "label": "Change Duration",
                        "helper": "Duration of change animation in milliseconds",
                        "showIf": { "animation.highlight_changes": true },
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 100,
                                "max": 5000,
                                "step": 50,
                                "unit_of_measurement": "ms"
                            }
                        }
                    }
                },

                "change_easing": {
                    "type": "string",
                    "default": "easeOutQuad",
                    "x-ui-hints": {
                        "label": "Change Easing",
                        "helper": "Easing function for change animation",
                        "showIf": { "animation.highlight_changes": true },
                        "selector": {
                            "text": {
                                "placeholder": "easeOutQuad"
                            }
                        }
                    }
                },

                "max_highlight_cells": {
                    "type": "number",
                    "minimum": 1,
                    "default": 50,
                    "x-ui-hints": {
                        "label": "Max Highlight Cells",
                        "helper": "Maximum number of cells to animate per update",
                        "showIf": { "animation.highlight_changes": true },
                        "selector": {
                            "number": {
                                "mode": "box",
                                "min": 1,
                                "max": 1000,
                                "step": 10
                            }
                        }
                    }
                },

                "change_params": {
                    "type": "object",
                    "x-ui-hints": {
                        "label": "Change Parameters",
                        "helper": "Preset-specific parameters (varies by change_preset)",
                        "showIf": { "animation.highlight_changes": true }
                    },
                    "properties": {
                        "max_scale": {
                            "type": "number",
                            "x-ui-hints": {
                                "label": "Max Scale (Pulse)",
                                "selector": {
                                    "number": {
                                        "mode": "box",
                                        "min": 1.0,
                                        "max": 2.0,
                                        "step": 0.01
                                    }
                                }
                            }
                        },
                        "min_opacity": {
                            "type": "number",
                            "x-ui-hints": {
                                "label": "Min Opacity (Pulse)",
                                "selector": {
                                    "number": {
                                        "mode": "box",
                                        "min": 0,
                                        "max": 1,
                                        "step": 0.1
                                    }
                                }
                            }
                        },
                        "color": {
                            "type": "string",
                            "format": "color",
                            "x-ui-hints": {
                                "label": "Effect Color",
                                "selector": {
                                    "ui_color": {}
                                }
                            }
                        },
                        "blur_max": {
                            "type": "number",
                            "x-ui-hints": {
                                "label": "Max Blur (Glow)",
                                "selector": {
                                    "number": {
                                        "mode": "box",
                                        "min": 0,
                                        "max": 50,
                                        "unit_of_measurement": "px"
                                    }
                                }
                            }
                        },
                        "intensity": {
                            "type": "number",
                            "x-ui-hints": {
                                "label": "Intensity (Flash)",
                                "selector": {
                                    "number": {
                                        "mode": "box",
                                        "min": 0,
                                        "max": 1,
                                        "step": 0.1
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
