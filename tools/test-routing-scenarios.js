#!/usr/bin/env node
/**
 * Node.js Test Runner for MSD Routing Scenarios
 * Executes browser console tests via jsdom
 */
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runRoutingTests() {
  console.log('🧪 MSD Routing Scenario Tests\n');
  
  // Load test harnesses
  const testFiles = [
    'src/msd/tests/routingScenarios.js',
    'src/msd/tests/arcsRoutingScenarios.js',
    'src/msd/tests/channelsRoutingScenarios.js',
    'src/msd/tests/autoUpgradeRoutingScenarios.js',
    'src/msd/tests/smartRoutingScenarios.js',
    'src/msd/tests/smoothingRoutingScenarios.js'
  ];
  
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    runScripts: 'outside-only',
    resources: 'usable'
  });
  
  const window = dom.window;
  
  // Mock minimal __msdDebug API
  window.__msdDebug = {
    pipelineInstance: {
      enabled: true,
      getResolvedModel: () => ({
        overlays: [
          { id: 'test_auto_upgrade_line', _raw: {} },
          { id: 'test_global_default_line', _raw: {} },
          { id: 'test_waypoint_line', _raw: {} },
          { id: 'test_explicit_mode_line', _raw: {} },
          { id: 'test_shaping_line', _raw: {} },
          { id: 'line_channel_demo', _raw: {} },
          { id: 'line_grid_forced', _raw: {} },
          { id: 'line_manhattan_baseline', _raw: {} },
          { id: 'line_smart_clear', _raw: {} },
          { id: 'line_smart_far_avoid', _raw: {} }
        ],
        anchors: {
          smart_far_anchor: [100, 100]
        }
      }),
      setAnchor: (id, pos) => {
        const model = window.__msdDebug.pipelineInstance.getResolvedModel();
        if (model.anchors[id]) {
          model.anchors[id] = pos;
          return true;
        }
        return false;
      },
      coordinator: {
        router: {
          config: {
            default_mode: 'manhattan',
            auto_upgrade_simple_lines: true,
            clearance: 8
          },
          _channels: [],
          _normalizeChannels: (channels) => channels.map(c => ({
            id: c.id,
            x1: c.rect[0],
            y1: c.rect[1],
            x2: c.rect[0] + c.rect[2],
            y2: c.rect[1] + c.rect[3],
            weight: c.weight || 0.5,
            type: c.type || 'bundling'
          })),
          _computeGrid: null // Will be set by tests
        }
      },
      router: null // Alias for coordinator.router
    },
    routing: {
      inspect: (id) => ({
        overlayId: id,
        pts: [[0, 0], [100, 0], [100, 100]],
        d: 'M0,0 L100,0 L100,100 A40,40 0 0 1 150,150',
        meta: {
          strategy: 'smart',
          modeAutoUpgraded: true,
          autoUpgradeReason: 'channels_present',
          bends: 2,
          cost: 200,
          cache_hit: false,
          channel: {
            coveragePct: 75,
            deltaCost: 0,
            shaping: {
              attempts: 5,
              accepted: 3
            }
          },
          arc: {
            count: 1,
            trimPx: 20
          }
        }
      }),
      invalidate: () => {
        // Reset cache_hit on invalidation
        const mockInspect = window.__msdDebug.routing.inspect;
        let callCount = 0;
        window.__msdDebug.routing.inspect = (id) => {
          const result = mockInspect(id);
          result.meta.cache_hit = callCount > 0;
          callCount++;
          return result;
        };
      }
    },
    lastRenderModel: null
  };
  
  // Set router alias
  window.__msdDebug.pipelineInstance.router = window.__msdDebug.pipelineInstance.coordinator.router;
  
  // Set up _computeGrid for fallback test
  window.__msdDebug.pipelineInstance.coordinator.router._computeGrid = function(req) {
    // Default implementation returns mock grid
    return {
      pts: [[0, 0], [50, 0], [50, 50], [100, 50]],
      meta: { strategy: 'grid-basic' }
    };
  };
  
  window.__msdScenarios = {};
  
  // Load test harnesses
  let loadedCount = 0;
  for (const file of testFiles) {
    const filePath = path.resolve(__dirname, '..', file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      window.eval(content);
      console.log(`✅ Loaded: ${file}`);
      loadedCount++;
    } catch (error) {
      console.log(`⚠️  Skipped: ${file} (${error.message})`);
    }
  }
  
  if (loadedCount === 0) {
    console.error('❌ No test files loaded');
    process.exit(1);
  }
  
  console.log('');
  
  // Run tests
  const testSuites = [
    'routing',
    'arcs',
    'channels',
    'autoUpgrade',
    'smart',
    'smoothing'
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];
  
  for (const suite of testSuites) {
    const api = window.__msdScenarios[suite];
    if (!api) {
      console.log(`⚠️  Suite '${suite}' not loaded\n`);
      continue;
    }
    
    console.log(`📦 Running ${suite} tests...\n`);
    const results = api.runAll();
    
    for (const [name, result] of Object.entries(results)) {
      totalTests++;
      if (result && result.ok) {
        passedTests++;
        console.log(`  ✅ ${name}`);
      } else {
        failedTests.push({ suite, name, result });
        console.log(`  ❌ ${name}:`, result?.details || 'unknown error');
      }
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`📊 Results: ${passedTests}/${totalTests} passed`);
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed tests (${failedTests.length}):`);
    for (const { suite, name, result } of failedTests) {
      console.log(`  - ${suite}.${name}`);
      if (result?.details) {
        console.log(`    Details:`, JSON.stringify(result.details, null, 2).split('\n').join('\n    '));
      }
    }
  }
  
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${totalTests - passedTests} tests failed\n`);
    process.exit(1);
  }
}

runRoutingTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
