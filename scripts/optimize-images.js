/**
 * Image Optimization Script
 *
 * Generates smaller versions of images for inline display while
 * preserving originals for the lightbox/gallery view.
 *
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Source directories containing original images
  sourceDirs: ['public/geotagged', 'public/geotagged2', 'public/media'],

  // Output directory for optimized images
  outputDir: 'public/images-optimized',

  // Inline image settings (for display in blog posts)
  inline: {
    width: 800,        // Max width in pixels
    quality: 60,       // JPEG quality (1-100) - lower for faster mobile loading
  },

  // Supported image extensions
  extensions: ['.jpg', '.jpeg', '.png'],
};

// Track statistics
const stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
};

/**
 * Get all image files from a directory
 */
function getImageFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`  Directory not found: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return CONFIG.extensions.includes(ext);
  });
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(subDir) {
  const fullPath = path.join(CONFIG.outputDir, subDir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

/**
 * Optimize a single image
 */
async function optimizeImage(sourcePath, outputPath) {
  try {
    const originalStats = fs.statSync(sourcePath);
    stats.totalOriginalSize += originalStats.size;

    // Check if optimized version already exists and is newer than source
    if (fs.existsSync(outputPath)) {
      const optimizedStats = fs.statSync(outputPath);
      if (optimizedStats.mtime >= originalStats.mtime) {
        stats.skipped++;
        stats.totalOptimizedSize += optimizedStats.size;
        return { skipped: true };
      }
    }

    // Read and optimize the image
    const image = sharp(sourcePath);
    const metadata = await image.metadata();

    // Only resize if image is larger than target width
    let pipeline = image;
    if (metadata.width > CONFIG.inline.width) {
      pipeline = pipeline.resize(CONFIG.inline.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Output as JPEG with specified quality
    await pipeline
      .jpeg({ quality: CONFIG.inline.quality, mozjpeg: true })
      .toFile(outputPath);

    const optimizedStats = fs.statSync(outputPath);
    stats.totalOptimizedSize += optimizedStats.size;
    stats.processed++;

    const savings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);
    return {
      skipped: false,
      originalSize: originalStats.size,
      optimizedSize: optimizedStats.size,
      savings: `${savings}%`
    };
  } catch (error) {
    stats.errors++;
    console.error(`  Error processing ${sourcePath}: ${error.message}`);
    return { error: true };
  }
}

/**
 * Process all images in a directory
 */
async function processDirectory(sourceDir) {
  const dirName = path.basename(sourceDir);
  console.log(`\nProcessing ${sourceDir}...`);

  const files = getImageFiles(sourceDir);
  if (files.length === 0) {
    console.log('  No images found');
    return;
  }

  console.log(`  Found ${files.length} images`);
  const outputDir = ensureOutputDir(dirName);

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    // Keep same filename but ensure .jpg extension for consistency
    const outputFileName = file.replace(/\.(jpeg|png)$/i, '.jpg');
    const outputPath = path.join(outputDir, outputFileName);

    const result = await optimizeImage(sourcePath, outputPath);

    if (result.skipped) {
      process.stdout.write('.');
    } else if (result.error) {
      process.stdout.write('X');
    } else {
      process.stdout.write('✓');
    }
  }
  console.log('');
}

/**
 * Generate mapping file for the app to use
 */
function generateMapping() {
  const mapping = {};

  for (const sourceDir of CONFIG.sourceDirs) {
    const dirName = path.basename(sourceDir);
    const outputDir = path.join(CONFIG.outputDir, dirName);

    if (!fs.existsSync(outputDir)) continue;

    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      // Map original path to optimized path
      // Original: /geotagged/image.jpeg -> Optimized: /images-optimized/geotagged/image.jpg
      const originalPath = `/${dirName}/${file.replace('.jpg', '.jpeg')}`;
      const optimizedPath = `/images-optimized/${dirName}/${file}`;
      mapping[originalPath] = optimizedPath;

      // Also map .jpg extension
      const originalPathJpg = `/${dirName}/${file}`;
      mapping[originalPathJpg] = optimizedPath;
    }
  }

  const mappingPath = path.join('data', 'image-optimization-map.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`\nGenerated mapping file: ${mappingPath}`);
  return mapping;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Image Optimization Script');
  console.log('='.repeat(60));
  console.log(`\nSettings:`);
  console.log(`  Inline width: ${CONFIG.inline.width}px`);
  console.log(`  JPEG quality: ${CONFIG.inline.quality}`);
  console.log(`  Output: ${CONFIG.outputDir}`);

  // Process each source directory
  for (const sourceDir of CONFIG.sourceDirs) {
    await processDirectory(sourceDir);
  }

  // Generate mapping file
  generateMapping();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Skipped (already optimized): ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  Original total size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`  Optimized total size: ${formatBytes(stats.totalOptimizedSize)}`);

  const totalSavings = ((1 - stats.totalOptimizedSize / stats.totalOriginalSize) * 100).toFixed(1);
  console.log(`  Total savings: ${totalSavings}%`);
  console.log('='.repeat(60));
}

main().catch(console.error);
