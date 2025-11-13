/**
 * Test: Token Syntax Migration (Phase 1)
 *
 * Validates that the token syntax migration from {{token}} to {token}
 * works correctly by testing the regex patterns and logic directly.
 *
 * Run: node test/test-token-syntax-migration.js
 */

// ============================================================================
// REGEX PATTERNS (from actual implementation)
// ============================================================================

// List of MSD domain prefixes to exclude
const MSD_DOMAINS = [
  'sensor', 'light', 'switch', 'climate', 'binary_sensor',
  'cover', 'fan', 'lock', 'media_player', 'vacuum',
  'camera', 'alarm_control_panel', 'device_tracker', 'person',
  'zone', 'input_boolean', 'input_number', 'input_select',
  'input_text', 'input_datetime', 'counter', 'timer'
];

// Token regex: {token} but NOT {{jinja2}} or {msd.datasource}
const domainPattern = MSD_DOMAINS.join('\\.|') + '\\.';
const TOKEN_REGEX = new RegExp(`\\{(?!\\{)(?!${domainPattern})([^{}]+)\\}`, 'g');

// Jinja2 detection patterns
const JINJA2_PATTERNS = [
  /\{\{\s*states\s*\(/,           // {{states('entity')}}
  /\{\{\s*state_attr\s*\(/,       // {{state_attr('entity', 'attr')}}
  /\{\{\s*now\s*\(/,              // {{now()}}
  /\{\{\s*is_state\s*\(/,         // {{is_state('entity', 'on')}}
  /\{\{[^}]*\|[^}]+\}\}/,         // {{value | filter}}
  /\{%[\s\S]*?%\}/                // {% if/for/etc %}
];

// ============================================================================
// IMPLEMENTATION FUNCTIONS
// ============================================================================

// Token detection: {token} but NOT {{jinja2}} or {domain.entity}
function hasTokens(content) {
  if (!content || typeof content !== 'string') return false;

  if (!content.includes('{')) return false;

  const regex = new RegExp(TOKEN_REGEX);

  // Quick check: if content has {{, we need to filter those out
  if (content.includes('{{')) {
    // Remove all {{...}} patterns and check if there are still tokens
    const withoutJinja2 = content.replace(/\{\{[^}]*\}\}/g, '');
    return regex.test(withoutJinja2);
  }

  return regex.test(content);
}

// Jinja2 detection
function hasJinja2(content) {
  if (!content || typeof content !== 'string') return false;
  return JINJA2_PATTERNS.some(pattern => pattern.test(content));
}

// Extract tokens
function extractTokens(content) {
  if (!content || typeof content !== 'string') return [];

  const tokens = [];
  const regex = new RegExp(TOKEN_REGEX);

  // If content has {{, remove them first to avoid matching inner braces
  let cleanContent = content;
  if (content.includes('{{')) {
    cleanContent = content.replace(/\{\{[^}]*\}\}/g, '');
  }

  let match;
  while ((match = regex.exec(cleanContent)) !== null) {
    tokens.push({
      token: match[1].trim(),
      path: match[1].trim()
    });
  }

  return tokens;
}

// Evaluate tokens (simplified version)
function evaluateTokens(content, context) {
  if (!content || typeof content !== 'string') return content;

  const regex = new RegExp(TOKEN_REGEX);

  // If content has {{, we need to avoid modifying them
  // Strategy: extract {{...}} parts, evaluate tokens in the rest, then reassemble
  if (content.includes('{{')) {
    const jinja2Parts = [];
    const placeholder = '\x00JINJA2\x00';

    // Replace {{...}} with placeholders
    let cleanContent = content.replace(/\{\{[^}]*\}\}/g, (match) => {
      jinja2Parts.push(match);
      return placeholder;
    });

    // Evaluate tokens in clean content
    cleanContent = cleanContent.replace(regex, (match, token) => {
      try {
        const path = token.trim().split('.');
        let value = context;

        for (const key of path) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return match;
          }
        }

        return value !== null && value !== undefined ? String(value) : '';
      } catch (error) {
        return match;
      }
    });

    // Restore {{...}} parts
    jinja2Parts.forEach((part) => {
      cleanContent = cleanContent.replace(placeholder, part);
    });

    return cleanContent;
  }

  return content.replace(regex, (match, token) => {
    try {
      const path = token.trim().split('.');
      let value = context;

      for (const key of path) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match; // Can't resolve, return original
        }
      }

      return value !== null && value !== undefined ? String(value) : '';
    } catch (error) {
      return match; // Return original if resolution fails
    }
  });
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passCount++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    failCount++;
  }
}

function assertEquals(actual, expected, testName) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passCount++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual:   ${JSON.stringify(actual)}`);
    failCount++;
  }
}

function section(name) {
  console.log(`\n${colors.cyan}═══ ${name} ═══${colors.reset}`);
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log(`${colors.blue}╔═══════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║  Token Syntax Migration Test Suite (Phase 1)     ║${colors.reset}`);
console.log(`${colors.blue}╚═══════════════════════════════════════════════════╝${colors.reset}`);

// TEST 1: Token Detection - Single Brace {token}
section('Token Detection - Single Brace {token}');

assert(
  hasTokens('{entity.state}'),
  'Detects single brace token: {entity.state}'
);

assert(
  hasTokens('{variables.color}'),
  'Detects single brace token: {variables.color}'
);

assert(
  hasTokens('Hello {entity.attributes.friendly_name}!'),
  'Detects token in text: Hello {entity.attributes.friendly_name}!'
);

assert(
  !hasTokens('{{states("sensor.temp")}}'),
  'Does NOT detect Jinja2: {{states("sensor.temp")}}'
);

assert(
  !hasTokens('{{entity.state | round}}'),
  'Does NOT detect Jinja2 with filter: {{entity.state | round}}'
);

assert(
  !hasTokens('{sensor.temperature}'),
  'Does NOT detect MSD datasource: {sensor.temperature}'
);

assert(
  !hasTokens('{light.desk_lamp}'),
  'Does NOT detect MSD datasource: {light.desk_lamp}'
);

assert(
  !hasTokens('{switch.fan}'),
  'Does NOT detect MSD datasource: {switch.fan}'
);

assert(
  !hasTokens('{climate.thermostat}'),
  'Does NOT detect MSD datasource: {climate.thermostat}'
);

// TEST 2: Jinja2 Detection
section('Jinja2 Detection - Double Brace {{expression}}');

assert(
  hasJinja2('{{states("sensor.temp")}}'),
  'Detects Jinja2 function: {{states("sensor.temp")}}'
);

assert(
  hasJinja2('{{state_attr("light.tv", "brightness")}}'),
  'Detects Jinja2 function: {{state_attr(...)}}'
);

assert(
  hasJinja2('{{value | round(1)}}'),
  'Detects Jinja2 filter: {{value | round(1)}}'
);

assert(
  hasJinja2('{% if condition %}text{% endif %}'),
  'Detects Jinja2 statement: {% if condition %}'
);

assert(
  !hasJinja2('{entity.state}'),
  'Does NOT detect simple token: {entity.state}'
);

assert(
  !hasJinja2('{sensor.temperature}'),
  'Does NOT detect MSD datasource: {sensor.temperature}'
);

// TEST 3: Token Extraction
section('Token Extraction - extractTokens()');

let tokens1 = extractTokens('{entity.state}');
assertEquals(
  tokens1,
  [{ token: 'entity.state', path: 'entity.state' }],
  'Extracts single token: {entity.state}'
);

let tokens2 = extractTokens('Hello {entity.attributes.friendly_name}!');
assertEquals(
  tokens2,
  [{ token: 'entity.attributes.friendly_name', path: 'entity.attributes.friendly_name' }],
  'Extracts token from text'
);

let tokens3 = extractTokens('{entity.state} - {variables.color}');
assertEquals(
  tokens3,
  [
    { token: 'entity.state', path: 'entity.state' },
    { token: 'variables.color', path: 'variables.color' }
  ],
  'Extracts multiple tokens'
);

let tokens4 = extractTokens('{{states("sensor.temp")}}');
assertEquals(
  tokens4,
  [],
  'Does NOT extract Jinja2 as tokens: {{states("sensor.temp")}}'
);

let tokens5 = extractTokens('{sensor.temperature}');
assertEquals(
  tokens5,
  [],
  'Does NOT extract MSD datasource: {sensor.temperature}'
);

let tokens6 = extractTokens('{light.desk.brightness}');
assertEquals(
  tokens6,
  [],
  'Does NOT extract MSD datasource: {light.desk.brightness}'
);

// TEST 4: Token Evaluation
section('Token Evaluation - evaluateTokens()');

const mockContext = {
  entity: {
    state: 'on',
    attributes: {
      friendly_name: 'Living Room Light',
      brightness: 255
    }
  },
  variables: {
    color: '#FF9900',
    label: 'Test Label'
  }
};

let eval1 = evaluateTokens('{entity.state}', mockContext);
assertEquals(
  eval1,
  'on',
  'Evaluates single brace token: {entity.state}'
);

let eval2 = evaluateTokens('Hello {entity.attributes.friendly_name}!', mockContext);
assertEquals(
  eval2,
  'Hello Living Room Light!',
  'Evaluates token in text'
);

let eval3 = evaluateTokens('{variables.color}', mockContext);
assertEquals(
  eval3,
  '#FF9900',
  'Evaluates variable token: {variables.color}'
);

// Test that Jinja2 is NOT evaluated (should pass through unchanged)
let eval4 = evaluateTokens('{{states("sensor.temp")}}', mockContext);
assertEquals(
  eval4,
  '{{states("sensor.temp")}}',
  'Does NOT evaluate Jinja2: {{states("sensor.temp")}}'
);

// Test that MSD datasources are NOT evaluated (should pass through unchanged)
let eval5 = evaluateTokens('{sensor.temperature}', mockContext);
assertEquals(
  eval5,
  '{sensor.temperature}',
  'Does NOT evaluate MSD datasource: {sensor.temperature}'
);

let eval6 = evaluateTokens('{light.desk}', mockContext);
assertEquals(
  eval6,
  '{light.desk}',
  'Does NOT evaluate MSD datasource: {light.desk}'
);

// Test mixed content
let eval7 = evaluateTokens('{entity.state} - {{states("sensor.temp")}}', mockContext);
assertEquals(
  eval7,
  'on - {{states("sensor.temp")}}',
  'Evaluates tokens but preserves Jinja2 in mixed content'
);

// TEST 5: Real-world Examples
section('Real-world Examples');

assert(
  hasTokens('Temperature: {entity.attributes.current_temperature}°C') &&
  !hasJinja2('Temperature: {entity.attributes.current_temperature}°C'),
  'Real example 1: Temperature display with token'
);

assert(
  !hasTokens('CPU: {{states("sensor.cpu_usage")}}%') &&
  hasJinja2('CPU: {{states("sensor.cpu_usage")}}%'),
  'Real example 2: CPU usage with Jinja2'
);

assert(
  hasTokens('Status: {entity.state}') &&
  !hasTokens('{light.living_room}'),
  'Real example 3: Token vs MSD datasource'
);

let eval8 = evaluateTokens(
  'Light: {entity.attributes.friendly_name} is {entity.state}',
  mockContext
);
assertEquals(
  eval8,
  'Light: Living Room Light is on',
  'Real example 4: Multiple tokens in sentence'
);

// TEST 6: Edge Cases
section('Edge Cases');

assert(
  !hasTokens('{}'),
  'Edge case: Empty braces {}'
);

assert(
  hasTokens('{ }'),
  'Edge case: Braces with space { } (matches but won\'t resolve)'
);

assert(
  hasTokens('{a}'),
  'Edge case: Single letter token {a}'
);

assert(
  !hasTokens(''),
  'Edge case: Empty string'
);

assert(
  !hasTokens(null),
  'Edge case: Null input'
);

let tokens7 = extractTokens('{entity.state}{variables.color}');
assertEquals(
  tokens7.length,
  2,
  'Edge case: Adjacent tokens without space'
);

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║                  TEST RESULTS                     ║${colors.reset}`);
console.log(`${colors.blue}╚═══════════════════════════════════════════════════╝${colors.reset}`);
console.log(`${colors.green}Passed:${colors.reset} ${passCount}`);
console.log(`${colors.red}Failed:${colors.reset} ${failCount}`);
console.log(`${colors.yellow}Total:${colors.reset}  ${passCount + failCount}`);

if (failCount === 0) {
  console.log(`\n${colors.green}✓ All tests passed! Token syntax migration is working correctly.${colors.reset}`);
  console.log(`\n${colors.cyan}Key Validations:${colors.reset}`);
  console.log(`  • Single brace {token} syntax is detected correctly`);
  console.log(`  • Double brace {{jinja2}} syntax is NOT detected as tokens`);
  console.log(`  • MSD datasources {domain.entity} are excluded from token detection`);
  console.log(`  • Token evaluation works with the new syntax`);
  console.log(`  • Mixed content (tokens + Jinja2) is handled correctly`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}✗ Some tests failed. Please review the implementation.${colors.reset}`);
  process.exit(1);
}
