/**
 * Match blog post images with geotagged photos by comparing EXIF capture dates
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MEDIA_DIR = path.join(__dirname, '../public/media');
const GEOTAGGED_DIR = path.join(__dirname, '../public/geotagged');

// Get EXIF date from an image using mdls (macOS) or exiftool
function getExifDate(filePath) {
  try {
    // Try using mdls (macOS built-in)
    const result = execSync(`mdls -name kMDItemContentCreationDate "${filePath}" 2>/dev/null`, { encoding: 'utf8' });
    const match = result.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (match) return match[1];

    // Try DateTimeOriginal with sips
    const result2 = execSync(`sips -g creation "${filePath}" 2>/dev/null`, { encoding: 'utf8' });
    const match2 = result2.match(/creation: (.+)/);
    if (match2) return match2[1].trim();

    return null;
  } catch (e) {
    return null;
  }
}

// Try using exiftool if available
function getExifDateWithExiftool(filePath) {
  try {
    const result = execSync(`exiftool -DateTimeOriginal -s3 "${filePath}" 2>/dev/null`, { encoding: 'utf8' });
    return result.trim() || null;
  } catch (e) {
    return null;
  }
}

console.log('=== MATCHING BLOG IMAGES TO GEOTAGGED PHOTOS ===\n');

// First, build a map of geotagged photos by date/time
console.log('Loading geotagged photo dates from locations.json...');
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/locations.json'), 'utf8'));

const geotaggedByDate = {};
locationsData.locations.forEach(loc => {
  // Date format is "2008:08:04 13:37:41"
  const dateKey = loc.date;
  geotaggedByDate[dateKey] = {
    path: loc.path,
    filename: loc.filename,
    latitude: loc.latitude,
    longitude: loc.longitude
  };
});

console.log(`Found ${Object.keys(geotaggedByDate).length} geotagged photos with dates\n`);

// Now scan blog post images and try to extract their dates
console.log('Scanning blog post images for EXIF dates...\n');

const mediaFiles = fs.readdirSync(MEDIA_DIR).filter(f =>
  f.match(/\.(jpg|jpeg|png|gif)$/i)
);

console.log(`Found ${mediaFiles.length} media files\n`);

// Check if exiftool is available
let hasExiftool = false;
try {
  execSync('which exiftool', { encoding: 'utf8' });
  hasExiftool = true;
  console.log('Using exiftool for EXIF extraction\n');
} catch (e) {
  console.log('exiftool not found, trying alternative methods...\n');
}

const matches = [];
const noDate = [];
const noMatch = [];

let count = 0;
for (const file of mediaFiles) {
  count++;
  if (count % 20 === 0) {
    console.log(`Processing ${count}/${mediaFiles.length}...`);
  }

  const filePath = path.join(MEDIA_DIR, file);

  let dateTime = null;
  if (hasExiftool) {
    dateTime = getExifDateWithExiftool(filePath);
  }

  if (!dateTime) {
    dateTime = getExifDate(filePath);
  }

  if (!dateTime) {
    noDate.push(file);
    continue;
  }

  // Normalize date format to match geotagged format "2008:08:04 13:37:41"
  // exiftool gives "2008:08:04 13:37:41"
  // mdls gives "2008-08-04 13:37:41"
  const normalizedDate = dateTime.replace(/-/g, ':');

  // Try exact match first
  if (geotaggedByDate[normalizedDate]) {
    matches.push({
      mediaFile: file,
      mediaPath: `/media/${file}`,
      dateTime: normalizedDate,
      geotagged: geotaggedByDate[normalizedDate]
    });
  } else {
    // Try matching just by date (ignoring seconds)
    const datePrefix = normalizedDate.substring(0, 16); // "2008:08:04 13:37"
    const possibleMatches = Object.keys(geotaggedByDate).filter(d => d.startsWith(datePrefix));

    if (possibleMatches.length > 0) {
      matches.push({
        mediaFile: file,
        mediaPath: `/media/${file}`,
        dateTime: normalizedDate,
        geotagged: geotaggedByDate[possibleMatches[0]],
        fuzzyMatch: true
      });
    } else {
      noMatch.push({ file, dateTime: normalizedDate });
    }
  }
}

console.log('\n=== RESULTS ===\n');
console.log(`Total media files: ${mediaFiles.length}`);
console.log(`Files with EXIF dates: ${mediaFiles.length - noDate.length}`);
console.log(`Files without EXIF dates: ${noDate.length}`);
console.log(`Matched to geotagged photos: ${matches.length}`);
console.log(`Had date but no geotagged match: ${noMatch.length}`);

if (matches.length > 0) {
  console.log('\n=== MATCHED IMAGES ===\n');
  matches.forEach(m => {
    console.log(`${m.mediaFile}`);
    console.log(`  -> ${m.geotagged.filename}`);
    console.log(`  Date: ${m.dateTime}`);
    console.log(`  GPS: ${m.geotagged.latitude}, ${m.geotagged.longitude}`);
    if (m.fuzzyMatch) console.log(`  (fuzzy match)`);
    console.log('');
  });

  // Save matches to JSON for use in the app
  const matchesOutput = {
    description: "Maps blog post images to geotagged photo coordinates",
    matches: {}
  };

  matches.forEach(m => {
    matchesOutput.matches[m.mediaPath] = {
      geotaggedPath: m.geotagged.path,
      latitude: m.geotagged.latitude,
      longitude: m.geotagged.longitude,
      dateTime: m.dateTime
    };
  });

  fs.writeFileSync(
    path.join(__dirname, '../data/image-matches.json'),
    JSON.stringify(matchesOutput, null, 2)
  );
  console.log('Matches saved to data/image-matches.json');
}

if (noMatch.length > 0 && noMatch.length <= 20) {
  console.log('\n=== IMAGES WITH DATES BUT NO GEOTAGGED MATCH ===\n');
  noMatch.forEach(m => {
    console.log(`${m.file}: ${m.dateTime}`);
  });
}

if (noDate.length > 0 && noDate.length <= 10) {
  console.log('\n=== IMAGES WITHOUT EXIF DATES ===\n');
  noDate.forEach(f => console.log(f));
}
