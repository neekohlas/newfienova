/**
 * Verify post-to-location mappings are working correctly
 */

const fs = require('fs');
const path = require('path');

const postsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf8'));
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/locations.json'), 'utf8'));
const mappings = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/post-locations.json'), 'utf8'));

console.log('=== VERIFICATION REPORT ===\n');

let postsWithMaps = 0;
let postsWithoutMaps = 0;
let totalPhotosOnMaps = 0;

postsData.posts.forEach((post, idx) => {
  const mapping = mappings.mappings[post.id];

  console.log(`${idx + 1}. "${post.title}"`);
  console.log(`   Post ID: ${post.id}`);
  console.log(`   Published: ${post.shortDate}`);

  if (!mapping) {
    console.log(`   ❌ NO MAPPING FOUND IN post-locations.json`);
    postsWithoutMaps++;
  } else if (!mapping.dateRange) {
    console.log(`   ⚠️  No map (${mapping.note || 'dateRange is null'})`);
    postsWithoutMaps++;
  } else {
    const [startDate, endDate] = mapping.dateRange;

    // Find matching photos
    const matchingPhotos = locationsData.locations.filter(loc => {
      const locDate = loc.date.split(' ')[0];
      return locDate >= startDate && locDate <= endDate;
    });

    if (matchingPhotos.length === 0) {
      console.log(`   ⚠️  Date range ${startDate} to ${endDate} but 0 photos match`);
      postsWithoutMaps++;
    } else {
      console.log(`   ✓ Map with ${matchingPhotos.length} photos (${startDate} to ${endDate})`);
      postsWithMaps++;
      totalPhotosOnMaps += matchingPhotos.length;

      // Show which photos
      matchingPhotos.forEach(p => {
        console.log(`      - ${p.filename.substring(0, 50)}... (${p.date.split(' ')[0]})`);
      });
    }
  }
  console.log('');
});

console.log('=== SUMMARY ===');
console.log(`Total posts: ${postsData.posts.length}`);
console.log(`Posts WITH maps: ${postsWithMaps}`);
console.log(`Posts WITHOUT maps: ${postsWithoutMaps}`);
console.log(`Total photo appearances on maps: ${totalPhotosOnMaps}`);
console.log(`Unique geotagged photos: ${locationsData.locations.length}`);
