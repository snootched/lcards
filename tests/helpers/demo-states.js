/**
 * Sample states for the demo views (demo/views/) outside Home Assistant: the docs
 * site's live demo (doc/.vitepress/theme/card-demo-runtime.js). The same sample
 * values the dashboard gallery shots use on the dev HA (GALLERY_STATES in
 * tests/ha/ha-client.mjs), plus the few non-personal entities the demos may use.
 * Browser-safe: no node imports.
 */
const number = (name, state, min, max, unit) => ({ state: String(state), attributes: { friendly_name: name, min, max, step: 1, ...(unit ? { unit_of_measurement: unit } : {}) } });
const toggle = (name, on) => ({ state: on ? 'on' : 'off', attributes: { friendly_name: name } });

export const DEMO_STATES = {
    'input_number.lcards_test_value': number('LCARdS Test Value', 40, 0, 100),
    'input_number.lcards_test_power': number('LCARdS Test Power', 82, 0, 100, '%'),
    'input_number.lcards_test_shields': number('LCARdS Test Shields', 64, 0, 100, '%'),
    'input_number.lcards_test_temperature': number('LCARdS Test Temperature', 21.5, 10, 35, '°C'),
    'input_number.lcards_test_humidity': number('LCARdS Test Humidity', 46, 0, 100, '%'),
    'input_number.lcards_test_stage': number('LCARdS Test Stage', 20, 0, 20),
    'input_boolean.lcards_test_toggle': toggle('LCARdS Test Toggle', false),
    'input_boolean.lcards_test_visible': toggle('LCARdS Test Visible', true),
    'input_boolean.lcards_test_lights': toggle('LCARdS Test Lights', true),
    'input_boolean.lcards_test_doors': toggle('LCARdS Test Doors', false),
    'input_select.lcards_test_mode': { state: 'beta', attributes: { friendly_name: 'LCARdS Test Mode', options: ['alpha', 'beta', 'gamma'] } },
    'sensor.desk_sensor_temperature': { state: '22.4', attributes: { friendly_name: 'Desk Temperature', unit_of_measurement: '°C', device_class: 'temperature' } },
    'zone.home': { state: '0', attributes: { friendly_name: 'Home', latitude: 51.4779, longitude: -0.0015, radius: 100 } },
    'sun.sun': { state: 'above_horizon', attributes: { friendly_name: 'Sun', elevation: 30, azimuth: 160 } },
    'input_select.lcards_alert_mode': {
        state: 'green_alert',
        attributes: { friendly_name: 'LCARdS Alert Mode', options: ['green_alert', 'red_alert', 'yellow_alert', 'blue_alert', 'gray_alert', 'black_alert'] },
    },
};

/** lcards.<service> alert actions -> the alert mode they set. */
export const ALERT_SERVICES = {
    red_alert: 'red_alert',
    yellow_alert: 'yellow_alert',
    blue_alert: 'blue_alert',
    gray_alert: 'gray_alert',
    black_alert: 'black_alert',
    clear_alert: 'green_alert',
};
