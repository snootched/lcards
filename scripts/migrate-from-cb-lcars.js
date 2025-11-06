#!/usr/bin/env node

/**
 * CB-LCARS to LCARdS Migration Script
 *
 * This script automates the migration from CB-LCARS to LCARdS by:
 * - Converting element names and card types
 * - Updating configuration paths and variables
 * - Preserving all functionality while updating to new architecture
 *
 * Usage:
 *   node scripts/migrate-from-cb-lcars.js [input-file] [output-file]
 *   node scripts/migrate-from-cb-lcars.js ui-lovelace.yaml ui-lovelace-lcards.yaml
 */

const fs = require('fs');
const path = require('path');

// Migration mappings
const ELEMENT_MAPPINGS = {
  'custom:cb-lcars-msd-card': 'custom:lcards-msd-card',
  'custom:cb-lcars-button-card': 'custom:lcards-button-card',
  'custom:cb-lcars-elbow-card': 'custom:lcards-elbow-card',
  'custom:cb-lcars-label-card': 'custom:lcards-label-card',
  'custom:cb-lcars-multimeter-card': 'custom:lcards-multimeter-card',
  'custom:cb-lcars-slider-card': 'custom:lcards-slider-card',
  'custom:cb-lcars-meter-card': 'custom:lcards-meter-card'
};

const CARD_TYPE_MAPPINGS = {
  // Button types
  'cb-lcars-button-lozenge': 'lcards-button-lozenge',
  'cb-lcars-button-picard': 'lcards-button-picard',
  'cb-lcars-button-bullet': 'lcards-button-bullet',
  'cb-lcars-button-rounded': 'lcards-button-rounded',

  // Elbow types
  'cb-lcars-elbow-left': 'lcards-elbow-left',
  'cb-lcars-elbow-right': 'lcards-elbow-right',
  'cb-lcars-elbow-top-left': 'lcards-elbow-top-left',
  'cb-lcars-elbow-top-right': 'lcards-elbow-top-right',
  'cb-lcars-elbow-bottom-left': 'lcards-elbow-bottom-left',
  'cb-lcars-elbow-bottom-right': 'lcards-elbow-bottom-right',

  // Label types
  'cb-lcars-label-text': 'lcards-label-text',
  'cb-lcars-label-header': 'lcards-label-header',
  'cb-lcars-label-subheader': 'lcards-label-subheader',
  'cb-lcars-label-title': 'lcards-label-title',

  // Multimeter types
  'cb-lcars-multimeter-standard': 'lcards-multimeter-standard',
  'cb-lcars-multimeter-vertical': 'lcards-multimeter-vertical',
  'cb-lcars-multimeter-radial': 'lcards-multimeter-radial',
  'cb-lcars-multimeter-horizontal': 'lcards-multimeter-horizontal'
};

const CONFIG_VARIABLE_MAPPINGS = {
  'cblcars_card_type': 'lcards_card_type',
  'cb-lcars-msd': 'lcards-msd',
  'cb_lcars': 'lcards',
  'cblcars': 'lcards'
};

const RESOURCE_MAPPINGS = {
  '/hacsfiles/cb-lcars/cb-lcars.js': '/hacsfiles/lcards/lcards.js',
  '/local/cb-lcars/cb-lcars.js': '/local/lcards/lcards.js',
  'cb-lcars.js': 'lcards.js'
};

class CBLCARSMigrator {
  constructor() {
    this.stats = {
      elementsConverted: 0,
      cardTypesConverted: 0,
      configVarsConverted: 0,
      resourcesConverted: 0,
      msdCardsConverted: 0,
      linesProcessed: 0
    };
  }

  migrate(inputPath, outputPath = null) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    console.log(`🔄 Starting migration from CB-LCARS to LCARdS...`);
    console.log(`📂 Input file: ${inputPath}`);

    // Read and backup original file
    const originalContent = fs.readFileSync(inputPath, 'utf8');
    const backupPath = `${inputPath}.cb-lcars-backup`;
    fs.writeFileSync(backupPath, originalContent);
    console.log(`💾 Backup created: ${backupPath}`);

    // Perform migration
    const migratedContent = this.performMigration(originalContent);

    // Write output
    const finalOutputPath = outputPath || inputPath;
    fs.writeFileSync(finalOutputPath, migratedContent);

    console.log(`✅ Migration completed!`);
    console.log(`📝 Output file: ${finalOutputPath}`);
    this.printStats();

    return {
      inputPath,
      outputPath: finalOutputPath,
      backupPath,
      stats: this.stats
    };
  }

  performMigration(content) {
    let migratedContent = content;
    const lines = content.split('\n');
    this.stats.linesProcessed = lines.length;

    // 1. Convert custom element names
    for (const [oldElement, newElement] of Object.entries(ELEMENT_MAPPINGS)) {
      const regex = new RegExp(`type:\\s*${oldElement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const matches = migratedContent.match(regex);
      if (matches) {
        migratedContent = migratedContent.replace(regex, `type: ${newElement}`);
        this.stats.elementsConverted += matches.length;
      }
    }

    // 2. Convert card type variables
    for (const [oldType, newType] of Object.entries(CARD_TYPE_MAPPINGS)) {
      const regex = new RegExp(`(card_type|cblcars_card_type|lcards_card_type):\\s*${oldType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const matches = migratedContent.match(regex);
      if (matches) {
        migratedContent = migratedContent.replace(regex, `lcards_card_type: ${newType}`);
        this.stats.cardTypesConverted += matches.length;
      }
    }

    // 3. Convert configuration variables
    for (const [oldVar, newVar] of Object.entries(CONFIG_VARIABLE_MAPPINGS)) {
      const regex = new RegExp(`\\b${oldVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'g');
      const matches = migratedContent.match(regex);
      if (matches) {
        migratedContent = migratedContent.replace(regex, `${newVar}:`);
        this.stats.configVarsConverted += matches.length;
      }
    }

    // 4. Convert resource URLs
    for (const [oldResource, newResource] of Object.entries(RESOURCE_MAPPINGS)) {
      const regex = new RegExp(oldResource.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = migratedContent.match(regex);
      if (matches) {
        migratedContent = migratedContent.replace(regex, newResource);
        this.stats.resourcesConverted += matches.length;
      }
    }

    // 5. Special handling for MSD cards
    const msdMatches = migratedContent.match(/cb-lcars-msd:/g);
    if (msdMatches) {
      migratedContent = migratedContent.replace(/cb-lcars-msd:/g, 'lcards-msd:');
      this.stats.msdCardsConverted += msdMatches.length;
    }

    // 6. Convert any remaining cb-lcars references in strings and comments
    migratedContent = migratedContent.replace(/cb-lcars/g, 'lcards');
    migratedContent = migratedContent.replace(/CB-LCARS/g, 'LCARdS');
    migratedContent = migratedContent.replace(/cblcars/g, 'lcards');
    migratedContent = migratedContent.replace(/CBLCARS/g, 'LCARdS');

    return migratedContent;
  }

  printStats() {
    console.log('\n📊 Migration Statistics:');
    console.log(`   • Lines processed: ${this.stats.linesProcessed}`);
    console.log(`   • Custom elements converted: ${this.stats.elementsConverted}`);
    console.log(`   • Card types updated: ${this.stats.cardTypesConverted}`);
    console.log(`   • Config variables updated: ${this.stats.configVarsConverted}`);
    console.log(`   • Resources updated: ${this.stats.resourcesConverted}`);
    console.log(`   • MSD cards converted: ${this.stats.msdCardsConverted}`);

    const totalChanges = this.stats.elementsConverted + this.stats.cardTypesConverted +
                        this.stats.configVarsConverted + this.stats.resourcesConverted +
                        this.stats.msdCardsConverted;

    console.log(`   • Total changes: ${totalChanges}`);

    if (totalChanges === 0) {
      console.log('\n⚠️  No CB-LCARS content found. File may already be migrated or not contain CB-LCARS configurations.');
    } else {
      console.log('\n🎉 Migration successful! Your configuration has been updated to use LCARdS.');
      console.log('\n📋 Next steps:');
      console.log('   1. Review the migrated configuration');
      console.log('   2. Install LCARdS via HACS');
      console.log('   3. Restart Home Assistant');
      console.log('   4. Test your dashboards');
    }
  }

  // Dry run mode - show what would be changed without modifying files
  dryRun(inputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    console.log(`🔍 Dry run - analyzing ${inputPath} for CB-LCARS content...`);

    const content = fs.readFileSync(inputPath, 'utf8');
    const migratedContent = this.performMigration(content);

    if (content === migratedContent) {
      console.log('✅ No changes needed - file appears to already use LCARdS or contains no CB-LCARS content.');
    } else {
      console.log('🔄 Changes would be made:');
      this.printStats();
    }

    return this.stats;
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
CB-LCARS to LCARdS Migration Script

Usage:
  node scripts/migrate-from-cb-lcars.js [options] <input-file> [output-file]

Options:
  --dry-run, -d    Show what would be changed without modifying files
  --help, -h       Show this help message

Examples:
  # Migrate in-place (creates backup)
  node scripts/migrate-from-cb-lcars.js ui-lovelace.yaml

  # Migrate to new file
  node scripts/migrate-from-cb-lcars.js ui-lovelace.yaml ui-lovelace-lcards.yaml

  # Dry run to preview changes
  node scripts/migrate-from-cb-lcars.js --dry-run ui-lovelace.yaml

The script will:
- Convert all CB-LCARS element names to LCARdS equivalents
- Update card type configurations
- Migrate resource URLs
- Create a backup of the original file
- Preserve all existing functionality

CB-LCARS → LCARdS Element Mapping:
  custom:cb-lcars-msd-card → custom:lcards-msd-card
  custom:cb-lcars-button-card → custom:lcards-button-card
  cblcars_card_type → lcards_card_type
  cb-lcars-msd → lcards-msd

For more information: https://github.com/snootched/lcards
`);
    return;
  }

  const migrator = new CBLCARSMigrator();

  try {
    if (args.includes('--dry-run') || args.includes('-d')) {
      const inputFile = args.find(arg => !arg.startsWith('-'));
      if (!inputFile) {
        console.error('❌ Error: Input file required for dry run');
        process.exit(1);
      }
      migrator.dryRun(inputFile);
    } else {
      const [inputFile, outputFile] = args.filter(arg => !arg.startsWith('-'));
      if (!inputFile) {
        console.error('❌ Error: Input file required');
        process.exit(1);
      }
      migrator.migrate(inputFile, outputFile);
    }
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { CBLCARSMigrator, ELEMENT_MAPPINGS, CARD_TYPE_MAPPINGS, CONFIG_VARIABLE_MAPPINGS };

// Run if called directly
if (require.main === module) {
  main();
}