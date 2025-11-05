// Define the dashboard class

import * as LCARdS from '../lcards-vars.js'
import { lcardsLog } from '../utils/lcards-logging.js';
import { readYamlFile } from '../utils/lcards-fileutils.js';

export class LCARdSDashboardStrategy {
    static async generate(config, hass) {
        try {
            const [areas, devices, entities] = await Promise.all([
                hass.callWS({ type: "config/area_registry/list" }),
                hass.callWS({ type: "config/device_registry/list" }),
                hass.callWS({ type: "config/entity_registry/list" }),
                ]);

            //lcardsLog.debug('areas:',areas);
            //lcardsLog.debug('devices:',devices);
            //lcardsLog.debug('entities:',entities);

            lcardsLog.info('Generating LCARdS dashboard strategy...');

            // Load the main LCARdS button card templates
            //const buttonTemplates = await readYamlFile(LCARdS.templates_uri);

            // Array of file paths for gallery views
            const galleryPaths = LCARdS.gallery_views_uris || [];

            // Generate gallery views from the array of file paths
            const galleryViews = await Promise.all(galleryPaths.map(async (filePath) => {
                const fileName = filePath.split('/').pop().split('.')[0];
                return {
                    title: `Gallery-${fileName}`,
                    strategy: {
                        type: 'custom:lcards-view',
                        options: { path: filePath }
                    },
                    subview: true
                };
            }));

            return {

                //'cb-lcars': {
                //    manage_config: true
                //},
                //...buttonTemplates,

                title: 'LCARdS',
                views: [
                    {
                        title: 'LCARdS Airlock',
                        strategy: {
                            type: 'custom:lcards-airlock',
                            options: config
                        }
                    },
                    ...galleryViews
                ]

            };
        } catch (error) {
            lcardsLog.error(`Error generating LCARdS dashboard strategy: ${error.message}`);
            throw error;
        }
    }
}

//define airlock view strategy
export class LCARdSViewStrategyAirlock {
    static async generate(config, hass) {
        try {
            lcardsLog.info('Generating LCARdS Airlock strategy view...');
            const jsObject = await readYamlFile(LCARdS.airlock_uri);

            return {
                ...jsObject
            };
        } catch (error) {
            lcardsLog.error(`Error loading LCARdS Airlock strategy view: ${error.message}`);
            throw error;
        }
    }
}

export class LCARdSViewStrategy {
    static async generate(config, hass) {
        try {
            const { path } = config;
            lcardsLog.info(`Generating LCARdS strategy view from path: ${path}...`);
            const jsObject = await readYamlFile(path);

            return {
                ...jsObject
            };
        } catch (error) {
            lcardsLog.error(`Error loading LCARdS strategy view: ${error.message}`);
            throw error;
        }
    }
}


// define the strategies in HA
customElements.define('ll-strategy-view-lcards-airlock', LCARdSViewStrategyAirlock);
customElements.define('ll-strategy-view-lcards-view', LCARdSViewStrategy);
customElements.define('ll-strategy-dashboard-cb-lcars', LCARdSDashboardStrategy);
