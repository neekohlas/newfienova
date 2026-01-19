/**
 * Image Optimization Script
 *
 * Generates two sizes of optimized images:
 * - Inline: Small images for blog post display (800px)
 * - Gallery: Larger images for lightbox/gallery view (1400px)
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

  // Output directories
  inlineDir: 'public/images-inline',
  galleryDir: 'public/images-gallery',

  // Inline image settings (for display in blog posts)
  inline: {
    width: 800,
    quality: 60,
  },

  // Gallery image settings (for lightbox/fullscreen viewing)
  gallery: {
    width: 1400,
    quality: 75,
  },

  // Supported image extensions
  extensions: ['.jpg', '.jpeg', '.png'],
};

// Track statistics
const stats = {
  inline: { processed: 0, skipped: 0, errors: 0, totalSize: 0 },
  gallery: { processed: 0, skipped: 0, errors: 0, totalSize: 0 },
  originalSize: 0,
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
function ensureOutputDir(baseDir, subDir) {
  const fullPath = path.join(baseDir, subDir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

/**
 * Optimize a single image to a specific size
 */
async function optimizeImage(sourcePath, outputPath, settings, statsObj) {
  try {
    const originalStats = fs.statSync(sourcePath);

    // Check if optimized version already exists and is newer than source
    if (fs.existsSync(outputPath)) {
      const optimizedStats = fs.statSync(outputPath);
      if (optimizedStats.mtime >= originalStats.mtime) {
        statsObj.skipped++;
        statsObj.totalSize += optimizedStats.size;
        return { skipped: true };
      }
    }

    // Read and optimize the image
    const image = sharp(sourcePath);
    const metadata = await image.metadata();

    // Only resize if image is larger than target width
    let pipeline = image;
    if (metadata.width > settings.width) {
      pipeline = pipeline.resize(settings.width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Output as JPEG with specified quality
    await pipeline
      .jpeg({ quality: settings.quality, mozjpeg: true })
      .toFile(outputPath);

    const optimizedStats = fs.statSync(outputPath);
    statsObj.totalSize += optimizedStats.size;
    statsObj.processed++;

    return { skipped: false };
  } catch (error) {
    statsObj.errors++;
    console.error(`  Error processing ${sourcePath}: ${error.message}`);
    return { error: true };
  }
}

/**
 * Process all images in a directory for both sizes
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

  const inlineOutputDir = ensureOutputDir(CONFIG.inlineDir, dirName);
  const galleryOutputDir = ensureOutputDir(CONFIG.galleryDir, dirName);

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const outputFileName = file.replace(/\.(jpeg|png)$/i, '.jpg');

    // Track original size (only once per file)
    const originalStats = fs.statSync(sourcePath);
    stats.originalSize += originalStats.size;

    // Generate inline version
    const inlineResult = await optimizeImage(
      sourcePath,
      path.join(inlineOutputDir, outputFileName),
      CONFIG.inline,
      stats.inline
    );

    // Generate gallery version
    const galleryResult = await optimizeImage(
      sourcePath,
      path.join(galleryOutputDir, outputFileName),
      CONFIG.gallery,
      stats.gallery
    );

    // Show progress
    if (inlineResult.error || galleryResult.error) {
      process.stdout.write('X');
    } else if (inlineResult.skipped && galleryResult.skipped) {
      process.stdout.write('.');
    } else {
      process.stdout.write('✓');
    }
  }
  console.log('');
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
  console.log(`  Inline:  ${CONFIG.inline.width}px @ quality ${CONFIG.inline.quality}`);
  console.log(`  Gallery: ${CONFIG.gallery.width}px @ quality ${CONFIG.gallery.quality}`);

  // Process each source directory
  for (const sourceDir of CONFIG.sourceDirs) {
    await processDirectory(sourceDir);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`\n  Original total: ${formatBytes(stats.originalSize)}`);
  console.log(`\n  Inline (${CONFIG.inline.width}px):`);
  console.log(`    Processed: ${stats.inline.processed}, Skipped: ${stats.inline.skipped}, Errors: ${stats.inline.errors}`);
  console.log(`    Total size: ${formatBytes(stats.inline.totalSize)} (${((1 - stats.inline.totalSize / stats.originalSize) * 100).toFixed(1)}% savings)`);
  console.log(`\n  Gallery (${CONFIG.gallery.width}px):`);
  console.log(`    Processed: ${stats.gallery.processed}, Skipped: ${stats.gallery.skipped}, Errors: ${stats.gallery.errors}`);
  console.log(`    Total size: ${formatBytes(stats.gallery.totalSize)} (${((1 - stats.gallery.totalSize / stats.originalSize) * 100).toFixed(1)}% savings)`);
  console.log('='.repeat(60));
}

main().catch(console.error);
