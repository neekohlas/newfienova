/**
 * Compare dates between media files and geotagged photos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MEDIA_DIR = path.join(__dirname, '../public/media');

// Get EXIF date from an image
function getExifDate(filePath) {
  try {
    const result = execSync(`mdls -name kMDItemContentCreationDate "${filePath}" 2>/dev/null`, { encoding: 'utf8' });
    const match = result.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
    if (match) return match[1];
    return null;
  } catch (e) {
    return null;
  }
}

// Load geotagged dates
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/locations.json'), 'utf8'));
const geotaggedDates = locationsData.locations.map(l => l.date).sort();

console.log('=== GEOTAGGED PHOTO DATES ===');
console.log('Min:', geotaggedDates[0]);
console.log('Max:', geotaggedDates[geotaggedDates.length - 1]);
console.log('Sample:', geotaggedDates.slice(0, 5));

// Get media file dates
const mediaFiles = fs.readdirSync(MEDIA_DIR).filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));

const mediaDates = [];
for (const file of mediaFiles.slice(0, 20)) {
  const filePath = path.join(MEDIA_DIR, file);
  const date = getExifDate(filePath);
  if (date) mediaDates.push({ file, date });
}

console.log('\n=== MEDIA FILE DATES (first 20) ===');
mediaDates.forEach(m => {
  console.log(`${m.file}: ${m.date}`);
});

// Check if dates overlap
const geoMin = geotaggedDates[0].replace(/:/g, '-');
const geoMax = geotaggedDates[geotaggedDates.length - 1].replace(/:/g, '-');

console.log('\n=== DATE COMPARISON ===');
console.log(`Geotagged range: ${geoMin} to ${geoMax}`);
console.log('Media dates are in format:', mediaDates[0]?.date);
