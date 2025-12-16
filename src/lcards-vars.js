//LCARdS main verson from package.json
const packageJson = require('../package.json');
export const LCARdS_VERSION = packageJson.version;
export const project_url = "https://lcards.unimatrix01.ca";


export const core_fonts = [
        'https://fonts.googleapis.com/css2?family=Antonio:wght@100;700&display=swap',
        'lcards_jeffries',
        'lcards_microgramma'
    ];


//CB-LARS yaml configuration files (templates, strategies, editor forms, etc.)
export const theme_colors_uri = '/hacsfiles/lcards/lcards-themes.yaml';

export const builtin_svg_keys = [
    'ncc-1701-a',
    'ncc-1701-a-blue',
    'enterprise-d-shuttlecraft15-anomaly',
    // Add more built-in SVG keys here (without .svg extension)
    ];
export const builtin_svg_basepath = '/hacsfiles/lcards/msd/';
