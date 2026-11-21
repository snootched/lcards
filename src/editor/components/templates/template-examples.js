/**
 * @fileoverview Template examples for the sandbox's example picker. Each runs on
 * any card: where it needs a value the page may not have, it brings test values
 * (the sandbox's Test values box: entity, states, ds, variables).
 *
 * @module template-examples
 */

/**
 * @typedef {Object} TemplateExample
 * @property {string} name
 * @property {string} template
 * @property {string} description
 * @property {Object} [test] - Test values: { entity?: {state, attributes}, states?: {id: {state, attributes}}, ds?: {name: value}, variables?: {} }
 */

/** @type {Object.<string, TemplateExample>} */
export const EXAMPLE_TEMPLATES = {
    'entity-state': {
        name: "The card's entity state",
        template: '{entity.state}',
        description: 'The state, as Home Assistant shows it',
    },
    'entity-attribute': {
        name: 'An attribute',
        template: 'Brightness: {entity.attributes.brightness}',
        description: 'Any attribute of the entity',
        test: { entity: { state: 'on', attributes: { brightness: 200 } } },
    },
    'other-entity': {
        name: "Another entity's state",
        template: 'Outside: {states.sensor.outdoor_temperature.state}',
        description: 'Any entity, by its full ID',
        test: { states: { 'sensor.outdoor_temperature': { state: '12.5', attributes: { unit_of_measurement: '°C' } } } },
    },
    'datasource': {
        name: 'A data source, formatted',
        template: 'Core temperature: {ds:core_temp:.1f} °C',
        description: 'A data source value with a number format',
        test: { ds: { core_temp: 87.468 } },
    },
    'variables': {
        name: 'A card variable',
        template: 'Deck {variables.deck}: {variables.section}',
        description: "Values from the card's variables",
        test: { variables: { deck: 7, section: 'Sickbay' } },
    },
    'theme-token': {
        name: 'A theme token',
        template: '{theme:colors.text.onDark}',
        description: 'A value from the active LCARdS theme',
    },
    'user': {
        name: 'The current user',
        template: 'Welcome aboard, {hass.user.name}',
        description: 'Who is looking at the dashboard',
    },
    'js-conditional': {
        name: 'JavaScript: a condition',
        template: "[[[ return entity.state === 'on' ? 'ACTIVE' : 'STANDBY' ]]]",
        description: 'JavaScript with entity, states, variables, config, hass, theme and user',
        test: { entity: { state: 'on', attributes: {} } },
    },
    'js-calculation': {
        name: 'JavaScript: a calculation',
        template: "[[[ return Math.round(parseFloat(entity.state) * 1.8 + 32) + ' °F' ]]]",
        description: 'Convert a Celsius reading to Fahrenheit',
        test: { entity: { state: '21', attributes: { unit_of_measurement: '°C' } } },
    },
    'jinja-state': {
        name: 'Jinja2: a state',
        template: "{{ states('sun.sun') }}",
        description: "Home Assistant's own template engine (runs in Home Assistant)",
    },
    'jinja-conditional': {
        name: 'Jinja2: a condition',
        template: "{% if is_state('sun.sun', 'above_horizon') %}Day watch{% else %}Night watch{% endif %}",
        description: 'Jinja2 if / else',
    },
    'mixed': {
        name: 'Mixed: tokens, a data source and JavaScript',
        template: "{entity.state} · {ds:core_temp:.0f}° · [[[ return new Date().getHours() < 12 ? 'AM' : 'PM' ]]]",
        description: 'All four kinds can share one string; they run in order JavaScript, tokens, data sources, Jinja2',
        test: { entity: { state: 'on', attributes: {} }, ds: { core_temp: 87.4 } },
    },
};

/** Example ids, in menu order. */
export function getExampleIds() {
    return Object.keys(EXAMPLE_TEMPLATES);
}
