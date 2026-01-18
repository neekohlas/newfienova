/**
 * Visually match blog post images with geotagged photos
 * by comparing resized versions
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');

const MEDIA_DIR = path.join(__dirname, '../public/media');
const GEOTAGGED_DIR = path.join(__dirname, '../public/geotagged');
const CACHE_DIR = path.join(__dirname, '../.image-cache');

// Create cache directory
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Load locations data for GPS coordinates
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/locations.json'), 'utf8'));
const geotaggedInfo = {};
locationsData.locations.forEach(loc => {
  geotaggedInfo[loc.filename] = {
    path: loc.path,
    latitude: loc.latitude,
    longitude: loc.longitude,
    date: loc.date
  };
});

// Convert image to raw pixel buffer at standard size
async function getImageBuffer(imagePath, width = 64, height = 48) {
  try {
    const buffer = await sharp(imagePath)
      .resize(width, height, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();
    return buffer;
  } catch (e) {
    console.error(`Error processing ${imagePath}: ${e.message}`);
    return null;
  }
}

// Compare two image buffers and return similarity (0-1)
function compareBuffers(buf1, buf2, width, height) {
  if (!buf1 || !buf2) return 0;
  if (buf1.length !== buf2.length) return 0;

  let diff = 0;
  for (let i = 0; i < buf1.length; i++) {
    diff += Math.abs(buf1[i] - buf2[i]);
  }

  const maxDiff = 255 * buf1.length;
  const similarity = 1 - (diff / maxDiff);
  return similarity;
}

async function main() {
  console.log('=== VISUAL IMAGE MATCHING ===\n');

  // Get all media files
  const mediaFiles = fs.readdirSync(MEDIA_DIR)
    .filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));

  // Get all geotagged files
  const geotaggedFiles = fs.readdirSync(GEOTAGGED_DIR)
    .filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));

  console.log(`Media files: ${mediaFiles.length}`);
  console.log(`Geotagged files: ${geotaggedFiles.length}`);
  console.log('\nProcessing geotagged images...\n');

  // Pre-process all geotagged images
  const geotaggedBuffers = {};
  for (let i = 0; i < geotaggedFiles.length; i++) {
    const file = geotaggedFiles[i];
    const filePath = path.join(GEOTAGGED_DIR, file);
    geotaggedBuffers[file] = await getImageBuffer(filePath);
    if ((i + 1) % 20 === 0) {
      console.log(`  Processed ${i + 1}/${geotaggedFiles.length} geotagged images`);
    }
  }

  console.log('\nMatching media files to geotagged photos...\n');

  const matches = {};
  const noMatch = [];
  const THRESHOLD = 0.85; // 85% similarity threshold

  for (let i = 0; i < mediaFiles.length; i++) {
    const mediaFile = mediaFiles[i];
    const mediaPath = path.join(MEDIA_DIR, mediaFile);
    const mediaBuffer = await getImageBuffer(mediaPath);

    if (!mediaBuffer) {
      noMatch.push({ file: mediaFile, reason: 'Could not process' });
      continue;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const geoFile of geotaggedFiles) {
      const geoBuffer = geotaggedBuffers[geoFile];
      const similarity = compareBuffers(mediaBuffer, geoBuffer, 64, 48);

      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = geoFile;
      }
    }

    if (bestScore >= THRESHOLD && bestMatch) {
      matches[`/media/${mediaFile}`] = {
        geotaggedFile: bestMatch,
        geotaggedPath: `/geotagged/${encodeURIComponent(bestMatch)}`,
        similarity: Math.round(bestScore * 100),
        ...geotaggedInfo[bestMatch]
      };
      console.log(`✓ ${mediaFile} -> ${bestMatch} (${Math.round(bestScore * 100)}%)`);
    } else {
      noMatch.push({ file: mediaFile, bestScore: Math.round(bestScore * 100), bestMatch });
      if (bestScore > 0.7) {
        console.log(`? ${mediaFile} -> ${bestMatch} (${Math.round(bestScore * 100)}% - below threshold)`);
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Progress: ${i + 1}/${mediaFiles.length}`);
    }
  }

  console.log('\n=== RESULTS ===\n');
  console.log(`Total media files: ${mediaFiles.length}`);
  console.log(`Matched: ${Object.keys(matches).length}`);
  console.log(`No match: ${noMatch.length}`);

  // Save matches
  const output = {
    description: "Maps blog post images to geotagged photos based on visual similarity",
    threshold: THRESHOLD,
    totalMatches: Object.keys(matches).length,
    matches: matches
  };

  fs.writeFileSync(
    path.join(__dirname, '../data/image-matches.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('\nMatches saved to data/image-matches.json');

  // Show some unmatched files
  if (noMatch.length > 0) {
    console.log('\n=== UNMATCHED FILES (showing up to 20) ===\n');
    noMatch.slice(0, 20).forEach(m => {
      console.log(`${m.file}: best ${m.bestScore}% (${m.bestMatch || 'none'})`);
    });
  }
}

main().catch(console.error);
