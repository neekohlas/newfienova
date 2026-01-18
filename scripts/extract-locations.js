/**
 * Extract GPS coordinates from geotagged photos
 * Uses exifreader to read EXIF data directly from files
 */

const ExifReader = require('exifreader');
const fs = require('fs');
const path = require('path');

const GEOTAGGED_DIR = path.join(__dirname, '../public/geotagged');
const OUTPUT_DIR = path.join(__dirname, '../data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Convert GPS coordinates from EXIF format to decimal
function convertGPSToDecimal(gpsData, ref, isLongitude = false) {
  if (!gpsData || !gpsData.value) return null;

  const coords = gpsData.value;
  let decimal;

  if (Array.isArray(coords)) {
    // Format: [[deg, 1], [min, 1], [sec, 1000]]
    const degrees = coords[0][0] / coords[0][1];
    const minutes = coords[1][0] / coords[1][1];
    const seconds = coords[2][0] / coords[2][1];
    decimal = degrees + minutes / 60 + seconds / 3600;
  } else {
    decimal = coords;
  }

  // Apply reference (N/S or E/W)
  const refValue = ref?.value || ref?.description || '';
  if (refValue === 'S' || refValue === 'W') {
    decimal = -decimal;
  }

  // For longitudes in the western hemisphere (like Nova Scotia/Newfoundland),
  // ensure they're negative if they should be
  if (isLongitude && decimal > 0 && decimal > 50 && decimal < 80) {
    // These coordinates are in the Atlantic Canada region and should be negative
    decimal = -decimal;
  }

  return decimal;
}

// Extract photo number from filename for ordering
function getPhotoNumber(filename) {
  // Format: "Newfoundland and Nova Scotia Trip - 2008 (X of 161).jpeg"
  const match = filename.match(/\((\d+) of \d+\)/);
  return match ? parseInt(match[1]) : 0;
}

// Main extraction function
async function extractLocations() {
  console.log('Extracting GPS coordinates from geotagged photos...\n');

  const files = fs.readdirSync(GEOTAGGED_DIR)
    .filter(f => f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.jpg'));

  console.log(`Found ${files.length} photos\n`);

  const locations = [];
  let validCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(GEOTAGGED_DIR, file);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const tags = ExifReader.load(fileBuffer);

      const lat = convertGPSToDecimal(tags.GPSLatitude, tags.GPSLatitudeRef, false);
      const lng = convertGPSToDecimal(tags.GPSLongitude, tags.GPSLongitudeRef, true);

      if (lat && lng) {
        const photoNum = getPhotoNumber(file);

        // Get date if available
        let dateStr = null;
        if (tags.DateTimeOriginal) {
          dateStr = tags.DateTimeOriginal.description;
        } else if (tags.DateTime) {
          dateStr = tags.DateTime.description;
        }

        locations.push({
          id: photoNum,
          filename: file,
          path: `/geotagged/${encodeURIComponent(file)}`,
          latitude: lat,
          longitude: lng,
          date: dateStr
        });

        validCount++;
      }
    } catch (error) {
      errorCount++;
    }

    process.stdout.write(`\rProcessed: ${validCount + errorCount}/${files.length} (${validCount} with GPS)`);
  }

  console.log('\n');

  if (locations.length === 0) {
    console.log('No GPS data found in photos.');
    // Create placeholder data
    const outputData = {
      totalPhotos: 0,
      bounds: null,
      route: [],
      locations: []
    };
    const outputPath = path.join(OUTPUT_DIR, 'locations.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    return outputData;
  }

  // Sort by photo number (chronological)
  locations.sort((a, b) => a.id - b.id);

  // Calculate bounding box for map
  const lats = locations.map(l => l.latitude);
  const lngs = locations.map(l => l.longitude);

  const bounds = {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
    center: {
      lat: (Math.max(...lats) + Math.min(...lats)) / 2,
      lng: (Math.max(...lngs) + Math.min(...lngs)) / 2
    }
  };

  // Create route line (ordered by photo sequence)
  const route = locations.map(l => [l.longitude, l.latitude]);

  const outputData = {
    totalPhotos: locations.length,
    bounds: bounds,
    route: route,
    locations: locations
  };

  // Write output
  const outputPath = path.join(OUTPUT_DIR, 'locations.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

  console.log(`✓ Extracted ${validCount} locations with GPS data`);
  console.log(`✓ Bounding box: ${bounds.south.toFixed(2)}°N to ${bounds.north.toFixed(2)}°N`);
  console.log(`✓ Longitude range: ${bounds.west.toFixed(2)}° to ${bounds.east.toFixed(2)}°`);
  console.log(`✓ Center point: ${bounds.center.lat.toFixed(4)}, ${bounds.center.lng.toFixed(4)}`);
  console.log(`✓ Output written to: ${outputPath}`);

  return outputData;
}

// Run if called directly
if (require.main === module) {
  extractLocations().catch(console.error);
}

module.exports = { extractLocations };
