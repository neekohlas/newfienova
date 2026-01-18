/**
 * Analyze posts and geotagged photos to create proper mappings
 */

const fs = require('fs');
const path = require('path');

const postsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf8'));
const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/locations.json'), 'utf8'));

console.log('=== POSTS ANALYSIS ===\n');
console.log(`Total posts: ${postsData.posts.length}`);
console.log(`Total geotagged photos: ${locationsData.locations.length}\n`);

// Get all unique dates from geotagged photos
const photoDates = new Set();
locationsData.locations.forEach(loc => {
  const date = loc.date.split(' ')[0]; // "2008:08:04"
  photoDates.add(date);
});

console.log('Geotagged photo dates available:');
const sortedDates = [...photoDates].sort();
sortedDates.forEach(d => {
  const count = locationsData.locations.filter(l => l.date.startsWith(d)).length;
  console.log(`  ${d}: ${count} photos`);
});

console.log('\n=== POST TO DATE MAPPING ===\n');

// For each post, determine what date range makes sense
postsData.posts.forEach(post => {
  // Parse post date
  const postDate = new Date(post.published);
  const year = postDate.getFullYear();
  const month = String(postDate.getMonth() + 1).padStart(2, '0');
  const day = String(postDate.getDate()).padStart(2, '0');
  const postDateStr = `${year}:${month}:${day}`;

  // Check if there are photos on or around this date
  // Look at the day before, same day, and day after
  const checkDates = [];
  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(postDate);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    checkDates.push(`${y}:${m}:${dy}`);
  }

  const matchingPhotos = locationsData.locations.filter(loc => {
    const locDate = loc.date.split(' ')[0];
    return checkDates.includes(locDate);
  });

  console.log(`"${post.title}"`);
  console.log(`  Post ID: ${post.id}`);
  console.log(`  Published: ${post.shortDate} (${postDateStr})`);
  console.log(`  Matching photos (±2 days): ${matchingPhotos.length}`);

  if (matchingPhotos.length > 0) {
    const photoDateRange = matchingPhotos.map(p => p.date.split(' ')[0]);
    const minDate = photoDateRange.sort()[0];
    const maxDate = photoDateRange.sort().reverse()[0];
    console.log(`  Photo date range: ${minDate} to ${maxDate}`);
  }
  console.log('');
});

// Generate corrected post-locations.json
console.log('\n=== GENERATING CORRECTED MAPPINGS ===\n');

const newMappings = {};

postsData.posts.forEach(post => {
  const postDate = new Date(post.published);

  // Look for photos within a reasonable window
  // Blog posts often describe events from the past few days
  const checkDates = [];
  for (let offset = -3; offset <= 1; offset++) {
    const d = new Date(postDate);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    checkDates.push(`${y}:${m}:${dy}`);
  }

  const matchingPhotos = locationsData.locations.filter(loc => {
    const locDate = loc.date.split(' ')[0];
    return checkDates.includes(locDate);
  });

  if (matchingPhotos.length > 0) {
    const photoDateRange = matchingPhotos.map(p => p.date.split(' ')[0]).sort();
    const minDate = photoDateRange[0];
    const maxDate = photoDateRange[photoDateRange.length - 1];

    newMappings[post.id] = {
      title: post.title,
      dateRange: [minDate, maxDate]
    };
  }
});

console.log('Posts WITH geotagged photos:', Object.keys(newMappings).length);
console.log('Posts WITHOUT geotagged photos:', postsData.posts.length - Object.keys(newMappings).length);

// Output the new mappings
const output = {
  description: "Maps post IDs to date ranges for filtering geotagged photos",
  mappings: newMappings
};

fs.writeFileSync(
  path.join(__dirname, '../data/post-locations-new.json'),
  JSON.stringify(output, null, 2)
);

console.log('\nNew mappings written to data/post-locations-new.json');
