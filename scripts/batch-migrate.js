#!/usr/bin/env node

/**
 * Batch Migration Tool for CB-LCARS to LCARdS
 *
 * This tool helps migrate multiple YAML files from CB-LCARS to LCARdS
 *
 * Usage:
 *   node scripts/batch-migrate.js [directory]
 *   node scripts/batch-migrate.js --config /config
 */

const fs = require('fs');
const path = require('path');
const { CBLCARSMigrator } = require('./migrate-from-cb-lcars.js');

class BatchMigrator {
  constructor() {
    this.migrator = new CBLCARSMigrator();
    this.results = [];
  }

  findYamlFiles(directory) {
    const yamlFiles = [];
    const files = fs.readdirSync(directory);

    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively search subdirectories
        yamlFiles.push(...this.findYamlFiles(fullPath));
      } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        yamlFiles.push(fullPath);
      }
    }

    return yamlFiles;
  }

  async migrateBatch(directory, options = {}) {
    const { dryRun = false, excludePatterns = [], includePatterns = [] } = options;

    console.log(`🔍 Scanning for YAML files in: ${directory}`);

    const yamlFiles = this.findYamlFiles(directory);
    console.log(`📁 Found ${yamlFiles.length} YAML files`);

    // Filter files based on patterns
    let filteredFiles = yamlFiles;

    if (excludePatterns.length > 0) {
      filteredFiles = filteredFiles.filter(file => {
        return !excludePatterns.some(pattern => file.includes(pattern));
      });
    }

    if (includePatterns.length > 0) {
      filteredFiles = filteredFiles.filter(file => {
        return includePatterns.some(pattern => file.includes(pattern));
      });
    }

    console.log(`📋 Processing ${filteredFiles.length} files${dryRun ? ' (dry run)' : ''}...`);

    let totalStats = {
      filesProcessed: 0,
      filesWithChanges: 0,
      totalChanges: 0,
      errors: 0
    };

    for (const file of filteredFiles) {
      try {
        console.log(`\n📄 Processing: ${path.relative(directory, file)}`);

        const stats = dryRun ?
          this.migrator.dryRun(file) :
          this.migrator.migrate(file).stats;

        const changes = stats.elementsConverted + stats.cardTypesConverted +
                       stats.configVarsConverted + stats.resourcesConverted +
                       stats.msdCardsConverted;

        this.results.push({
          file: file,
          stats: stats,
          changes: changes,
          success: true
        });

        totalStats.filesProcessed++;
        if (changes > 0) {
          totalStats.filesWithChanges++;
          totalStats.totalChanges += changes;
        }

      } catch (error) {
        console.error(`❌ Error processing ${file}: ${error.message}`);
        this.results.push({
          file: file,
          error: error.message,
          success: false
        });
        totalStats.errors++;
      }
    }

    this.printBatchSummary(totalStats, dryRun);
    return this.results;
  }

  printBatchSummary(stats, dryRun) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files processed: ${stats.filesProcessed}`);
    console.log(`Files with changes: ${stats.filesWithChanges}`);
    console.log(`Total changes made: ${stats.totalChanges}`);
    console.log(`Errors encountered: ${stats.errors}`);

    if (stats.filesWithChanges > 0) {
      console.log('\n✅ Files with CB-LCARS content found and migrated:');
      this.results
        .filter(r => r.success && r.changes > 0)
        .forEach(r => {
          const relativePath = path.relative(process.cwd(), r.file);
          console.log(`   • ${relativePath} (${r.changes} changes)`);
        });
    }

    if (stats.errors > 0) {
      console.log('\n❌ Files with errors:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          const relativePath = path.relative(process.cwd(), r.file);
          console.log(`   • ${relativePath}: ${r.error}`);
        });
    }

    const filesWithoutChanges = stats.filesProcessed - stats.filesWithChanges;
    if (filesWithoutChanges > 0) {
      console.log(`\nℹ️  ${filesWithoutChanges} files contained no CB-LCARS content`);
    }

    if (!dryRun && stats.totalChanges > 0) {
      console.log('\n🎉 Batch migration completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Install LCARdS via HACS');
      console.log('   2. Restart Home Assistant');
      console.log('   3. Test your dashboards');
      console.log('   4. Remove CB-LCARS when ready');
    } else if (dryRun) {
      console.log(`\n🔍 Dry run completed. ${stats.totalChanges} changes would be made.`);
      console.log('   Run without --dry-run to perform the migration.');
    }
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CB-LCARS to LCARdS Batch Migration Tool

Usage:
  node scripts/batch-migrate.js [options] [directory]

Options:
  --dry-run, -d                Show what would be changed without modifying files
  --config                     Migrate Home Assistant config directory
  --exclude <pattern>          Exclude files containing pattern (can be repeated)
  --include <pattern>          Include only files containing pattern (can be repeated)
  --help, -h                   Show this help message

Examples:
  # Migrate all YAML files in current directory
  node scripts/batch-migrate.js .

  # Migrate Home Assistant config directory
  node scripts/batch-migrate.js --config /config

  # Dry run on specific directory
  node scripts/batch-migrate.js --dry-run /config/dashboards

  # Exclude backup files
  node scripts/batch-migrate.js --exclude .backup --exclude .old /config

  # Include only dashboard files
  node scripts/batch-migrate.js --include dashboard --include lovelace /config

The tool will:
- Scan for all YAML files recursively
- Identify files containing CB-LCARS content
- Migrate them to LCARdS format
- Create backups automatically
- Provide detailed summary report

For single file migration, use: scripts/migrate-from-cb-lcars.js
`);
    return;
  }

  const migrator = new BatchMigrator();
  const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    excludePatterns: [],
    includePatterns: []
  };

  // Parse exclude patterns
  args.forEach((arg, index) => {
    if (arg === '--exclude' && args[index + 1]) {
      options.excludePatterns.push(args[index + 1]);
    }
    if (arg === '--include' && args[index + 1]) {
      options.includePatterns.push(args[index + 1]);
    }
  });

  // Determine target directory
  let targetDir = '.';

  if (args.includes('--config')) {
    const configIndex = args.indexOf('--config');
    targetDir = args[configIndex + 1] || '/config';
  } else {
    // Look for directory argument (not starting with --)
    const dirArg = args.find(arg => !arg.startsWith('--') && !options.excludePatterns.includes(arg) && !options.includePatterns.includes(arg));
    if (dirArg) {
      targetDir = dirArg;
    }
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Error: Directory not found: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.statSync(targetDir).isDirectory()) {
    console.error(`❌ Error: Path is not a directory: ${targetDir}`);
    process.exit(1);
  }

  console.log(`🚀 Starting batch migration of ${targetDir}`);
  console.log(`🔧 Options: ${JSON.stringify(options, null, 2)}`);

  migrator.migrateBatch(targetDir, options)
    .then(() => {
      console.log('\n✅ Batch migration completed!');
    })
    .catch(error => {
      console.error(`❌ Batch migration failed: ${error.message}`);
      process.exit(1);
    });
}

// Export for programmatic use
module.exports = { BatchMigrator };

// Run if called directly
if (require.main === module) {
  main();
}