const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf-8'));

// Collect all videos
const allVideos = [];
posts.posts.forEach(post => {
  if (post.videos && post.videos.length > 0) {
    post.videos.forEach(video => {
      allVideos.push(video);
    });
  }
});

console.log(`Found ${allVideos.length} videos to process`);

// Create thumbnails directory
const thumbDir = path.join(__dirname, '../public/video-thumbs');
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// Generate thumbnails
const thumbnails = {};

allVideos.forEach((videoPath, index) => {
  const videoFile = path.join(__dirname, '../public', videoPath);
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const thumbFile = path.join(thumbDir, `${videoName}.jpg`);
  const thumbPath = `/video-thumbs/${videoName}.jpg`;

  console.log(`[${index + 1}/${allVideos.length}] Processing: ${videoPath}`);

  if (!fs.existsSync(videoFile)) {
    console.log(`  Skipping - video file not found: ${videoFile}`);
    return;
  }

  if (fs.existsSync(thumbFile)) {
    console.log(`  Thumbnail already exists`);
    thumbnails[videoPath] = thumbPath;
    return;
  }

  try {
    // Extract frame at 1 second (or 0 if video is shorter)
    // Using ffmpeg to get a frame and resize to reasonable thumbnail size
    execSync(`ffmpeg -i "${videoFile}" -ss 00:00:01 -vframes 1 -vf "scale=640:-1" -q:v 2 "${thumbFile}" -y 2>/dev/null || ffmpeg -i "${videoFile}" -ss 00:00:00 -vframes 1 -vf "scale=640:-1" -q:v 2 "${thumbFile}" -y 2>/dev/null`);
    console.log(`  Generated thumbnail: ${thumbPath}`);
    thumbnails[videoPath] = thumbPath;
  } catch (error) {
    console.log(`  Error generating thumbnail: ${error.message}`);
  }
});

// Save thumbnails mapping
const outputPath = path.join(__dirname, '../data/video-thumbnails.json');
fs.writeFileSync(outputPath, JSON.stringify(thumbnails, null, 2));

console.log(`\nGenerated ${Object.keys(thumbnails).length} thumbnails`);
console.log(`Thumbnails mapping saved to: ${outputPath}`);
