/**
 * CoreValidationService entity checks: only entity fields are looked up in HA.
 *
 * Regression: any string shaped like `domain.object` was treated as an entity,
 * so a Chart Studio series named `statistics.min` warned
 * 'Entity "statistics.min" not found in Home Assistant'.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { getChartSchema } from '../../src/cards/schemas/chart-schema.js';

function service() {
    const s = new CoreValidationService({ cacheResults: false });
    s.hass = { states: { 'sensor.humidity': { state: '40' }, 'light.tv': { state: 'on' } } };
    return s;
}

const missing = result => result.warnings.filter(w => w.type === 'missing_entity').map(w => `${w.field}=${w.context.entity}`);

test('dotted series names and buffer keys are not entity references', () => {
    const config = {
        type: 'custom:lcards-chart',
        data_sources: { test: { entity: 'sensor.humidity' } },
        sources: [
            { datasource: 'test', name: 'Raw' },
            { datasource: 'test', buffer: 'statistics_min', name: 'statistics.min' },
            { datasource: 'test', buffer: 'statistics_max', name: 'statistics.max' },
        ],
    };
    assert.deepEqual(missing(service().validate(config, getChartSchema())), []);
});

test('entity, entity_id and entities lists are still checked', () => {
    const config = {
        entity: 'sensor.gone',
        tap_action: { action: 'toggle', target: { entity_id: 'light.gone' } },
        entities: ['light.tv', 'switch.gone', { entity: 'sensor.also_gone' }],
        name: 'sensor.just_a_label',
    };
    assert.deepEqual(missing(service().validate(config, { type: 'object' })), [
        'entity=sensor.gone',
        'tap_action.target.entity_id=light.gone',
        'entities.1=switch.gone',
        'entities.2.entity=sensor.also_gone',
    ]);
});
