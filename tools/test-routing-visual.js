#!/usr/bin/env node
/**
 * Visual Screenshot Generator for MSD Routing Tests
 * Requires Playwright and a local Home Assistant dev instance
 */
import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const HA_URL = process.env.HA_DEV_URL || 'http://localhost:8123';
const OUTPUT_DIR = path.resolve(__dirname, '../test-results/routing-screenshots');
const TEST_CARD_CONFIG = {
  type: 'custom:lcards-msd',
  msd: {
    view_box: [0, 0, 1000, 600],
    routing: {
      default_mode: 'auto',
      auto_upgrade_simple_lines: true,
      channels: [
        { id: 'main_channel', rect: [200, 100, 400, 200], type: 'bundling' },
        { id: 'waypoint_channel', rect: [400, 300, 100, 100], type: 'waypoint' }
      ]
    },
    anchors: {
      start: [50, 300],
      end: [950, 300],
      channel_entry: [200, 150],
      channel_exit: [600, 250]
    },
    overlays: [
      {
        id: 'test_auto_upgrade_line',
        type: 'line',
        anchor: 'start',
        attach_to: 'channel_exit',
        route_channels: ['main_channel'],
        style: { color: '#ff9900', width: 3 }
      },
      {
        id: 'test_waypoint_line',
        type: 'line',
        anchor: 'channel_exit',
        attach_to: 'end',
        route_channels: ['waypoint_channel'],
        route_channel_mode: 'force',
        style: { color: '#00ff00', width: 3 }
      },
      {
        id: 'test_explicit_manhattan',
        type: 'line',
        anchor: 'start',
        attach_to: 'end',
        route_mode_full: 'manhattan',
        style: { color: '#0099ff', width: 2 }
      }
    ]
  }
};

async function captureScreenshots() {
  console.log('📸 MSD Routing Visual Screenshot Generator\n');
  
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    console.error('❌ Failed to launch browser. Make sure Playwright is installed:');
    console.error('   npm install --save-dev playwright');
    console.error('\nError:', error.message);
    process.exit(1);
  }
  
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();
  
  try {
    // Navigate to HA dev instance
    console.log(`🌐 Connecting to ${HA_URL}...`);
    await page.goto(HA_URL, { waitUntil: 'networkidle', timeout: 10000 });
    
    // Wait for HA to load (adjust selector as needed)
    await page.waitForSelector('home-assistant', { timeout: 10000 });
    
    // Inject test card via console
    console.log('💉 Injecting test MSD card...');
    await page.evaluate((config) => {
      const card = document.createElement('lcards-msd');
      card.setConfig(config);
      document.body.appendChild(card);
    }, TEST_CARD_CONFIG);
    
    // Wait for MSD to render
    await page.waitForSelector('lcards-msd svg', { timeout: 5000 });
    await page.waitForTimeout(1000); // Allow routing to complete
    
    // Run console tests and capture results
    console.log('🧪 Running console tests...\n');
    const testResults = await page.evaluate(() => {
      if (!window.__msdScenarios?.autoUpgrade) {
        return { error: 'Test harness not loaded' };
      }
      return window.__msdScenarios.autoUpgrade.runAll();
    });
    
    // Capture full page screenshot
    const fullPath = path.join(OUTPUT_DIR, '01-full-msd-routing.png');
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`✅ Saved: ${fullPath}`);
    
    // Capture individual line screenshots
    const lineSelectors = [
      { id: 'test_auto_upgrade_line', name: '02-auto-upgrade-line' },
      { id: 'test_waypoint_line', name: '03-waypoint-line' },
      { id: 'test_explicit_manhattan', name: '04-explicit-manhattan' }
    ];
    
    for (const { id, name } of lineSelectors) {
      const element = await page.$(`lcards-msd svg path[data-line-id="${id}"]`);
      if (element) {
        const screenshotPath = path.join(OUTPUT_DIR, `${name}.png`);
        await element.screenshot({ path: screenshotPath });
        console.log(`✅ Saved: ${screenshotPath}`);
      } else {
        console.log(`⚠️  Line '${id}' not found in SVG`);
      }
    }
    
    // Save test results as JSON
    const resultsPath = path.join(OUTPUT_DIR, 'test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`✅ Saved: ${resultsPath}`);
    
    // Generate summary markdown
    const summary = generateMarkdownSummary(testResults);
    const summaryPath = path.join(OUTPUT_DIR, 'TEST-SUMMARY.md');
    await fs.writeFile(summaryPath, summary);
    console.log(`✅ Saved: ${summaryPath}`);
    
    console.log('\n✅ Screenshot generation complete!');
    
  } catch (error) {
    console.error('❌ Screenshot generation failed:', error.message);
    console.error('\nThis tool requires:');
    console.error('1. Playwright installed: npm install --save-dev playwright');
    console.error('2. Home Assistant running at:', HA_URL);
    console.error('3. LCARdS card installed in Home Assistant');
    console.error('\nSet HA_DEV_URL environment variable to use a different URL.');
    throw error;
  } finally {
    await browser.close();
  }
}

function generateMarkdownSummary(results) {
  const passed = Object.values(results).filter(r => r?.ok).length;
  const total = Object.keys(results).length;
  
  let md = `# MSD Routing Test Results\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `**Results:** ${passed}/${total} passed\n\n`;
  md += `---\n\n`;
  
  if (results.error) {
    md += `## ❌ Error\n\n`;
    md += `${results.error}\n\n`;
    return md;
  }
  
  for (const [name, result] of Object.entries(results)) {
    const icon = result?.ok ? '✅' : '❌';
    md += `## ${icon} ${name}\n\n`;
    md += `**Status:** ${result?.ok ? 'PASS' : 'FAIL'}\n\n`;
    md += `**Details:**\n\`\`\`json\n${JSON.stringify(result?.details, null, 2)}\n\`\`\`\n\n`;
    md += `---\n\n`;
  }
  
  return md;
}

captureScreenshots().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
