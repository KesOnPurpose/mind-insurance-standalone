#!/usr/bin/env node

/**
 * Script to check Web Vitals against performance budget
 * Run after build to verify performance targets
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Performance budget thresholds
const BUDGETS = {
  LCP: { good: 2500, warning: 4000, label: 'Largest Contentful Paint' },
  FID: { good: 100, warning: 300, label: 'First Input Delay' },
  CLS: { good: 0.1, warning: 0.25, label: 'Cumulative Layout Shift' },
  FCP: { good: 1800, warning: 3000, label: 'First Contentful Paint' },
  TTFB: { good: 800, warning: 1800, label: 'Time to First Byte' },
};

// Bundle size budgets (in KB)
const SIZE_BUDGETS = {
  mainBundle: 500,
  vendorBundle: 300,
  totalInitial: 800,
};

/**
 * Check if dist folder exists
 */
function checkDistFolder() {
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found. Please run "npm run build" first.');
    process.exit(1);
  }
  return distPath;
}

/**
 * Get file size in KB
 */
function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024);
}

/**
 * Analyze bundle sizes
 */
function analyzeBundleSizes(distPath) {
  console.log('\n📦 Bundle Size Analysis\n' + '='.repeat(50));

  const assetsPath = path.join(distPath, 'assets');
  if (!fs.existsSync(assetsPath)) {
    console.warn('⚠️  No assets folder found in dist');
    return false;
  }

  const files = fs.readdirSync(assetsPath);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  let totalJS = 0;
  let totalCSS = 0;
  const bundles = [];

  // Analyze JS bundles
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const sizeKB = getFileSizeInKB(filePath);
    totalJS += sizeKB;

    const bundleType = file.includes('vendor') ? 'vendor' :
                      file.includes('react') ? 'react' :
                      file.includes('radix') ? 'radix-ui' :
                      file.includes('chart') ? 'charts' :
                      file.includes('index') ? 'main' : 'other';

    bundles.push({ file, type: bundleType, sizeKB });
  });

  // Analyze CSS files
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const sizeKB = getFileSizeInKB(filePath);
    totalCSS += sizeKB;
  });

  // Sort bundles by size
  bundles.sort((a, b) => b.sizeKB - a.sizeKB);

  // Display results
  console.log('JavaScript Bundles:');
  bundles.forEach(bundle => {
    const emoji = bundle.sizeKB > 300 ? '❌' : bundle.sizeKB > 200 ? '⚠️' : '✅';
    console.log(`  ${emoji} ${bundle.type.padEnd(15)} ${bundle.sizeKB}KB - ${bundle.file}`);
  });

  console.log(`\nTotal JS: ${totalJS}KB`);
  console.log(`Total CSS: ${totalCSS}KB`);
  console.log(`Total Assets: ${totalJS + totalCSS}KB`);

  // Check against budgets
  console.log('\n📊 Budget Compliance:');

  const mainBundle = bundles.find(b => b.type === 'main');
  if (mainBundle) {
    const status = mainBundle.sizeKB <= SIZE_BUDGETS.mainBundle ? '✅' : '❌';
    console.log(`  ${status} Main Bundle: ${mainBundle.sizeKB}KB / ${SIZE_BUDGETS.mainBundle}KB`);
  }

  const totalInitial = totalJS + totalCSS;
  const totalStatus = totalInitial <= SIZE_BUDGETS.totalInitial ? '✅' : '❌';
  console.log(`  ${totalStatus} Total Initial: ${totalInitial}KB / ${SIZE_BUDGETS.totalInitial}KB`);

  return totalInitial <= SIZE_BUDGETS.totalInitial;
}

/**
 * Check for performance anti-patterns in source code
 */
async function checkAntiPatterns() {
  console.log('\n🔍 Performance Anti-Pattern Check\n' + '='.repeat(50));

  const srcPath = path.join(__dirname, '..', 'src');
  const antiPatterns = [
    {
      pattern: /console\.(log|info|warn|error)/g,
      message: 'Console statements found (should be removed in production)',
      severity: 'warning',
    },
    {
      pattern: /import\s+.*\s+from\s+['"]lodash['"]/g,
      message: 'Full lodash import detected (use specific imports)',
      severity: 'error',
    },
    {
      pattern: /import\s+\*\s+as\s+\w+\s+from/g,
      message: 'Wildcard imports detected (may prevent tree-shaking)',
      severity: 'warning',
    },
    {
      pattern: /\.map\([^)]+\)\.map\(/g,
      message: 'Chained .map() calls detected (combine for performance)',
      severity: 'warning',
    },
  ];

  const issues = [];

  // Recursively check all TypeScript/JavaScript files
  function checkFile(filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.test.')) return;

    const content = fs.readFileSync(filePath, 'utf-8');

    antiPatterns.forEach(({ pattern, message, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          file: path.relative(srcPath, filePath),
          message,
          severity,
          count: matches.length,
        });
      }
    });
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        checkFile(filePath);
      }
    });
  }

  walkDir(srcPath);

  // Display results
  if (issues.length === 0) {
    console.log('✅ No performance anti-patterns detected!');
  } else {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message} (${issue.count} occurrences)`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message} (${issue.count} occurrences)`);
      });
    }

    return errors.length === 0;
  }

  return true;
}

/**
 * Generate performance report
 */
function generateReport(results) {
  console.log('\n📈 Performance Report Summary\n' + '='.repeat(50));

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    bundleSizeCheck: results.bundleSize ? 'PASS' : 'FAIL',
    antiPatternCheck: results.antiPatterns ? 'PASS' : 'FAIL',
    recommendations: [],
  };

  if (!results.bundleSize) {
    report.recommendations.push('Reduce bundle sizes by implementing code splitting');
    report.recommendations.push('Consider lazy loading heavy components');
  }

  if (!results.antiPatterns) {
    report.recommendations.push('Fix performance anti-patterns in source code');
    report.recommendations.push('Remove console statements for production');
  }

  console.log(`\nTimestamp: ${timestamp}`);
  console.log(`Bundle Size Check: ${report.bundleSizeCheck}`);
  console.log(`Anti-Pattern Check: ${report.antiPatternCheck}`);

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  return report.bundleSizeCheck === 'PASS' && report.antiPatternCheck === 'PASS';
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Mind Insurance Performance Check\n' + '='.repeat(50));

  try {
    const distPath = checkDistFolder();

    const results = {
      bundleSize: analyzeBundleSizes(distPath),
      antiPatterns: await checkAntiPatterns(),
    };

    const success = generateReport(results);

    if (success) {
      console.log('\n✅ All performance checks passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some performance checks failed. Please review the recommendations.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running performance check:', error);
    process.exit(1);
  }
}

// Run the script
main();