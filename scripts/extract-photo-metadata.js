const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const geotaggedDir = '/Users/nicohenry/Library/CloudStorage/GoogleDrive-nickhhenry@gmail.com/My Drive/Maritime Blog/geotagged photos 2';
const outputPath = path.join(__dirname, '../data/geotagged2-metadata.json');

// Get list of files
const files = fs.readdirSync(geotaggedDir)
  .filter(f => f.endsWith('.jpeg') || f.endsWith('.mov'))
  .sort((a, b) => {
    const numA = parseInt(a.match(/- (\d+)\./)?.[1] || '0');
    const numB = parseInt(b.match(/- (\d+)\./)?.[1] || '0');
    return numA - numB;
  });

console.log(`Found ${files.length} files`);

const metadata = [];

files.forEach((file, idx) => {
  const filePath = path.join(geotaggedDir, file);
  const num = parseInt(file.match(/- (\d+)\./)?.[1] || '0');

  try {
    const result = execSync(
      `mdls -name kMDItemContentCreationDate -name kMDItemLatitude -name kMDItemLongitude "${filePath}"`,
      { encoding: 'utf-8' }
    );

    const dateMatch = result.match(/kMDItemContentCreationDate = (.+)/);
    const latMatch = result.match(/kMDItemLatitude\s*= ([\d.-]+)/);
    const lngMatch = result.match(/kMDItemLongitude\s*= ([\d.-]+)/);

    const date = dateMatch ? new Date(dateMatch[1].trim()) : null;

    metadata.push({
      num,
      file,
      path: `/geotagged2/${encodeURIComponent(file)}`,
      date: date ? date.toISOString() : null,
      dateStr: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      latitude: latMatch ? parseFloat(latMatch[1]) : null,
      longitude: lngMatch ? parseFloat(lngMatch[1]) : null,
      isVideo: file.endsWith('.mov')
    });

    if ((idx + 1) % 20 === 0) {
      console.log(`Processed ${idx + 1}/${files.length}`);
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e.message);
  }
});

fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
console.log(`\nSaved metadata for ${metadata.length} files to ${outputPath}`);

// Print summary by date
const byDate = {};
metadata.forEach(m => {
  if (m.dateStr) {
    byDate[m.dateStr] = byDate[m.dateStr] || [];
    byDate[m.dateStr].push(m.num);
  }
});

console.log('\nPhotos by date:');
Object.entries(byDate).sort((a, b) => new Date(a[0]) - new Date(b[0])).forEach(([date, nums]) => {
  console.log(`  ${date}: #${nums[0]}-${nums[nums.length-1]} (${nums.length} photos)`);
});
