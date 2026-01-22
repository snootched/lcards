# MSD Routing Visual Test Results

This directory contains automated test results for intelligent routing enhancements (PR #214).

## Running Tests

### Console Tests (Node.js)
```bash
npm run test:routing
```

Runs browser console test harnesses in jsdom and reports pass/fail status.

**Requirements:**
- Node.js v18+ 
- jsdom (already in devDependencies)

**What it tests:**
- All routing scenario test suites (routing, arcs, channels, autoUpgrade, smart, smoothing)
- Mock environment simulates MSD pipeline without requiring Home Assistant
- Exit code 0 on success, 1 on failure (CI/CD compatible)

### Visual Tests (Playwright)
```bash
# Set HA dev instance URL (optional, defaults to localhost:8123)
export HA_DEV_URL=http://your-ha-instance:8123

npm run test:routing:visual
```

Generates screenshots of test scenarios and saves results to this directory.

**Requirements:**
- Playwright (add with: `npm install --save-dev playwright`)
- Running Home Assistant instance with LCARdS installed
- Network access to Home Assistant

**What it generates:**
- Screenshots of rendered MSD routing paths
- JSON test results file
- Markdown summary report

## Test Scenarios

### Auto-Upgrade Tests
- **channels-auto-upgrade**: Line with `route_channels` automatically upgrades to smart routing
- **explicit-mode-respected**: Explicit `route_mode_full` prevents auto-upgrade
- **global-default-mode**: Global `routing.default_mode` applies to all lines
- **auto-upgrade-disabled**: Config flag can disable auto-upgrade behavior
- **waypoint-metadata**: Waypoint channels add coverage metadata
- **obstacles-auto-upgrade**: Obstacles trigger auto-upgrade to smart routing

### Other Test Suites
- **routing**: Core routing functionality (cache, grid vs manhattan, avoidance, etc.)
- **arcs**: Corner arc rendering and radius clamping
- **channels**: Channel preference and cost optimization
- **smart**: Smart routing algorithm behavior
- **smoothing**: Path smoothing and optimization

## Screenshot Files

When visual tests run successfully, this directory will contain:

- `01-full-msd-routing.png` - Complete MSD card with all test lines
- `02-auto-upgrade-line.png` - Line auto-upgraded to smart routing
- `03-waypoint-line.png` - Line forced through waypoint channel
- `04-explicit-manhattan.png` - Line with explicit manhattan mode (no upgrade)
- `test-results.json` - Raw test results in JSON format
- `TEST-SUMMARY.md` - Markdown summary with test results

## Expected Results

All tests should pass (✅) with:
- Auto-upgraded lines showing multi-bend paths
- Waypoint lines achieving >90% coverage or applying penalty
- Explicit modes respected (no auto-upgrade)
- Cache hits after first routing computation
- Arc metadata present when corner_style is 'round'

## Troubleshooting

### Test Runner Fails to Load Test Files

Ensure you're running from the repository root:
```bash
cd /path/to/LCARdS
npm run test:routing
```

### Visual Tests Can't Connect to Home Assistant

1. Verify Home Assistant is running: `curl http://localhost:8123`
2. Check LCARdS is installed in `config/www/community/lcards/`
3. Set custom URL: `export HA_DEV_URL=http://your-ha:8123`

### Playwright Not Installed

Install with: `npm install --save-dev playwright`

Then install browsers: `npx playwright install chromium`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: MSD Routing Tests

on: [pull_request]

jobs:
  test-routing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:routing
```

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed or execution error

## Development

### Adding New Test Scenarios

1. Edit test files in `src/msd/tests/`
2. Follow existing pattern: function returns `{ ok: boolean, details: object }`
3. Add to scenarios object with descriptive key
4. Test in browser console first: `window.__msdScenarios.autoUpgrade.run('your-test')`
5. Verify in Node.js runner: `npm run test:routing`

### Debugging Tests

Enable verbose logging in test files:
```javascript
console.log('[Test Debug]', someVariable);
```

View mock API responses by modifying `tools/test-routing-scenarios.js`

## Related Files

- PR #214: Intelligent Routing Mode Selection
- `src/msd/tests/routingScenarios.js` - Core routing tests
- `src/msd/tests/autoUpgradeRoutingScenarios.js` - Auto-upgrade tests
- `src/msd/tests/channelsRoutingScenarios.js` - Channel routing tests
- `src/msd/tests/arcsRoutingScenarios.js` - Corner arc tests
- `src/msd/tests/smartRoutingScenarios.js` - Smart routing tests
- `src/msd/tests/smoothingRoutingScenarios.js` - Path smoothing tests
- `src/msd/routing/RouterCore.js` - Auto-upgrade implementation
- `tools/test-routing-scenarios.js` - Node.js test runner
- `tools/test-routing-visual.js` - Visual screenshot generator
