//LCARdS main verson from package.json
const packageJson = require('../package.json');
export const LCARdS_VERSION = packageJson.version;
export const project_url = "https://lcards.unimatrix01.ca";


export const core_fonts = [
        'https://fonts.googleapis.com/css2?family=Antonio:wght@100;700&display=swap',
        'cb-lcars_jeffries',
        'cb-lcars_microgramma'
    ];


//CB-LARS yaml configuration files (templates, strategies, editor forms, etc.)
export const templates_uri = '/hacsfiles/lcards/lcards-lovelace.yaml';
export const stub_config_uri = '/hacsfiles/lcards/lcards-stub-config.yaml';
export const theme_colors_uri = '/hacsfiles/lcards/lcards-themes.yaml';
export const airlock_uri = '/hacsfiles/lcards/lcards-airlock.yaml';
export const gallery_uri = '/hacsfiles/lcards/lcards-gallery.yaml';
//export const card_editor_uri = '/hacsfiles/lcards/lcards-card-editor-forms.yaml'
export const card_editor_uri = '/hacsfiles/lcards/editor'
export const gallery_views_uris = [
        '/hacsfiles/lcards/lcards-gallery.yaml',
        '/hacsfiles/lcards/lcards-gallery-buttons.yaml',
        '/hacsfiles/lcards/lcards-gallery-elbows.yaml',
        '/hacsfiles/lcards/lcards-gallery-multimeter.yaml'
    ]

export const builtin_svg_keys = [
    'ncc-1701-a',
    'ncc-1701-a-blue',
    'enterprise-d-shuttlecraft15-anomaly',
    // Add more built-in SVG keys here (without .svg extension)
    ];
export const builtin_svg_basepath = '/hacsfiles/lcards/msd/';
