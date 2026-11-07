/**
 * What a slider sets: the configured attribute decides the action (not only
 * what is read), and an attribute no action can set makes the slider read-only.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { controlServiceCall, controlSetter, controlRange, controlValueFromEntity, DEFAULT_CONTROL_ATTRIBUTE } from '../../src/cards/slider-control.js';

test('every default attribute can be set', () => {
  for (const [domain, attribute] of Object.entries(DEFAULT_CONTROL_ATTRIBUTE)) {
    assert.ok(controlSetter(domain, attribute), `${domain}.${attribute}`);
  }
  assert.ok(controlSetter('input_number', null));
  assert.ok(controlSetter('number', null));
});

test('a light sets brightness 0-255 from 0-100 %, and colour temperature in K', () => {
  assert.deepEqual(controlServiceCall('light.desk', 'brightness', 50), { domain: 'light', service: 'turn_on', data: { entity_id: 'light.desk', brightness: 128 } });
  assert.deepEqual(controlServiceCall('light.desk', 'color_temp_kelvin', 3012.4), { domain: 'light', service: 'turn_on', data: { entity_id: 'light.desk', color_temp_kelvin: 3012 } });
  assert.deepEqual(controlRange('light', 'color_temp_kelvin', { min_color_temp_kelvin: 2200, max_color_temp_kelvin: 6000 }), { min: 2200, max: 6000, step: 50, unit: 'K' });
});

test('a cover sets its position or its tilt', () => {
  assert.equal(controlServiceCall('cover.blind', 'current_position', 40)?.service, 'set_cover_position');
  assert.deepEqual(controlServiceCall('cover.blind', 'current_tilt_position', 30.6), { domain: 'cover', service: 'set_cover_tilt_position', data: { entity_id: 'cover.blind', tilt_position: 31 } });
});

test('a climate low or high target is sent with the other one', () => {
  const attrs = { target_temp_low: 19, target_temp_high: 24 };
  assert.deepEqual(controlServiceCall('climate.hall', 'target_temp_high', 25, attrs), { domain: 'climate', service: 'set_temperature', data: { entity_id: 'climate.hall', target_temp_high: 25, target_temp_low: 19 } });
  assert.deepEqual(controlServiceCall('climate.hall', 'target_temp_low', 18, attrs)?.data, { entity_id: 'climate.hall', target_temp_low: 18, target_temp_high: 24 });
  // without the other target (not in heat/cool) there is nothing valid to send
  assert.equal(controlServiceCall('climate.hall', 'target_temp_low', 18, {}), null);
  assert.equal(controlServiceCall('climate.hall', 'humidity', 45.2)?.service, 'set_humidity');
});

test('volume is 0-100 % on the slider and 0-1 to the action', () => {
  assert.equal(controlServiceCall('media_player.tv', 'volume_level', 25)?.data.volume_level, 0.25);
  assert.equal(controlValueFromEntity('media_player', 'volume_level', 0.4), 40);
  assert.equal(controlValueFromEntity('light', 'brightness', 255), 100);
});

test('anything else is read-only: no action is sent', () => {
  assert.equal(controlSetter('light', 'rgb_color'), null);
  assert.equal(controlServiceCall('light.desk', 'effect', 3), null);
  assert.equal(controlSetter('sensor', null), null);
  assert.equal(controlServiceCall('sensor.temp', '', 20), null);
  assert.equal(controlRange('sensor', null), null);
});

test('the slider schema knows every top-level option a slider component reads', async () => {
  const { sliderComponents } = await import('../../src/core/packs/components/sliders/index.js');
  const { getSliderSchema } = await import('../../src/cards/schemas/slider-schema.js');
  const props = getSliderSchema().properties;
  for (const [name, component] of Object.entries(sliderComponents)) {
    for (const opt of component.metadata?.configurableOptions ?? []) {
      if (opt.key.includes('.')) continue;
      assert.ok(props[opt.key], `${name}: ${opt.key} missing from the slider schema (add its list in component-options.js)`);
    }
  }
  assert.equal(props.show_animation.type, 'boolean');
  assert.equal(props.animation_speed.default, 2);
});
