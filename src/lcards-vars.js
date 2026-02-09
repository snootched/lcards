//LCARdS main verson from package.json: modified to work with ES modules
import packageJson from '../package.json' assert { type: 'json' };
export const LCARdS_VERSION = packageJson.version;
export const project_url = "https://lcards.unimatrix01.ca";


export const core_fonts = [
        'https://fonts.googleapis.com/css2?family=Antonio:wght@100;700&display=swap',
        'lcards_jeffries',
        'lcards_microgramma'
    ];
