/**
 * Process blog content from Blogger export JSON files
 * Outputs clean, structured data for the Next.js site
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../../posts');
const OUTPUT_DIR = path.join(__dirname, '../data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Posts to SKIP (fabricated, drafts, or duplicates not in original published blog)
const SKIP_TITLES = [
  'Corner Brook, maybe we\'ll just stay...',
  'To Corner Brook, Beyond, and Back Again',
  'Videos',
  'Maintenance',
  'Maintenance - Biking',
  'cooking video',
  'picture of spoke',
  'video of burgeo road',
  'Beyond Corner Brook',
  'pictres',
  'Untitled',
  'Video Blog - An Average Day'  // Draft version - use the actual "Video Blog" post from Sep 5
];

// Title corrections (map from incorrect to correct)
const TITLE_CORRECTIONS = {
  // None needed currently
};

// Date corrections (title -> corrected ISO date)
// Use original Blogger dates - no corrections needed
const DATE_CORRECTIONS = {
  // Keeping original dates from Blogger export
};

// Video mappings (title -> array of video files)
const VIDEO_MAP = {
  'Video Blog': ['/videos/videoblog1.mov', '/videos/videoblog2.mp4'],
  'Cooking': ['/videos/cooking1.mov'],
  'Bike Maintenance': ['/videos/bikemaint1.mov', '/videos/bikemaint2.mov'],
  'Let the Riding Begin...God-willing': ['/videos/godwilling1.mov', '/videos/godwilling2.mov'],
  'Sou\'western Coast': ['/videos/swcoast1.mov', '/videos/swcoast2.mp4'],
  'The Choice Was Clear': ['/videos/ferry.mp4'],
  'The Long And Lonely Road': ['/videos/burgeo_road.mp4']
};

// Geotagged photo mappings (title -> date ranges to include)
// These map posts to geotagged photos based on the actual travel dates
const GEOTAGGED_DATE_RANGES = {
  'Corner Brook, Beyond, and Back': { start: '2008:08:10', end: '2008:08:12' }
};

// Load geotagged photo data
function loadGeotaggedPhotos() {
  try {
    const locationsPath = path.join(__dirname, '../data/locations.json');
    const data = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
    return data.locations || [];
  } catch (e) {
    console.warn('Could not load geotagged locations:', e.message);
    return [];
  }
}

// Get geotagged photos for a post based on date range
function getGeotaggedPhotos(title, geotaggedPhotos) {
  const range = GEOTAGGED_DATE_RANGES[title];
  if (!range) return [];

  return geotaggedPhotos
    .filter(photo => {
      const dateStr = photo.date.split(' ')[0];
      return dateStr >= range.start && dateStr <= range.end;
    })
    .map(photo => photo.path);
}

// Valid titles from original blog (28 posts total)
// August 2008: 22 posts
// September 2008: 6 posts
const VALID_TITLES = [
  // August
  'The Journey Begins....Now!  No wait...Now!',
  'The CAR',
  'Let the Riding Begin...God-willing',
  'KABOOM!!!',
  'Ah, the Joy of Mobility',
  'The Choice Was Clear',
  'Biking in Newfoundland',
  'Bringing Someone Home from the Bar...the Gas Bar, That Is',
  '7am Naps: A Battle of Wills',
  'We Interrupt This Blogcast...',
  'Corner Brook, Beyond, and Back',
  'Berry Heaven',
  'The Coveted Loop',
  'The Century Day',
  'Update on the berries',
  'Scenery',
  'Resettlement',
  'Heading South',
  'Cooking',
  'The Long And Lonely Road',
  'A Lesson in Aerodynamics',
  'Sou\'western Coast',
  // September
  'Bike Maintenance',
  'Video Blog',
  'Grand Bruit',
  'The Last of the Ferries',
  'The Home Stretch',
  'Home James!'
];

// Helper to extract title from nested structure
function getTitle(titleObj) {
  if (typeof titleObj === 'string') return titleObj;
  if (titleObj && titleObj._) return titleObj._;
  return 'Untitled';
}

// Helper to clean HTML content
function cleanContent(html) {
  if (!html) return '';

  // Remove old Blogger cruft
  let cleaned = html
    // Remove inline styles but keep the content
    .replace(/style="[^"]*"/gi, '')
    // Remove old Blogger image wrappers
    .replace(/<a[^>]*onblur="[^"]*"[^>]*>(.*?)<\/a>/gi, '$1')
    // Remove "PIC" placeholders (image placeholders that were never filled in)
    .replace(/<p>\s*PIC\s*<\/p>/gi, '')
    .replace(/<div>\s*PIC\s*<\/div>/gi, '')
    .replace(/>\s*PIC\s*</gi, '><')
    .replace(/\bPIC\b/g, '')
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    // Remove empty divs
    .replace(/<div>\s*<\/div>/gi, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    // Convert <br><br> to paragraph breaks
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>')
    // Wrap orphan text in paragraphs
    .trim();

  return cleaned;
}

// Extract image paths from content
function extractImages(content, imageMap) {
  const images = [];
  const imgRegex = /<img[^>]*src="([^"]*)"[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[1];
    // Convert to local path if it's our media
    if (src.startsWith('/media/')) {
      images.push(src);
    }
  }

  // Also add from imageMap if available
  if (imageMap) {
    Object.values(imageMap).forEach(localPath => {
      if (!images.includes(localPath)) {
        images.push(localPath);
      }
    });
  }

  return images;
}

// Format date nicely
function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Get short date for grouping
function getShortDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// Main processing function
function processAllPosts() {
  // Read the blog index
  const indexPath = path.join(POSTS_DIR, 'blog-index.json');
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  // Load geotagged photos for date-based mapping
  const geotaggedPhotos = loadGeotaggedPhotos();
  console.log(`Loaded ${geotaggedPhotos.length} geotagged photos`);

  console.log(`Processing ${indexData.postCount} posts from export...`);

  const processedPosts = [];
  const seenTitles = new Set();

  // Process each post
  for (const postMeta of indexData.posts) {
    const postPath = path.join(POSTS_DIR, `${postMeta.id}.json`);

    if (!fs.existsSync(postPath)) {
      console.warn(`Post file not found: ${postPath}`);
      continue;
    }

    const post = JSON.parse(fs.readFileSync(postPath, 'utf8'));
    let title = getTitle(post.title);

    // Apply title corrections
    if (TITLE_CORRECTIONS[title]) {
      console.log(`  Correcting title: "${title}" -> "${TITLE_CORRECTIONS[title]}"`);
      title = TITLE_CORRECTIONS[title];
    }

    // Skip fabricated/invalid posts
    if (SKIP_TITLES.includes(title)) {
      console.log(`Skipping (not in original): ${title}`);
      continue;
    }

    // Skip if we've already seen this title (duplicates)
    if (seenTitles.has(title)) {
      console.log(`Skipping (duplicate): ${title}`);
      continue;
    }

    // Verify it's a valid original post
    if (!VALID_TITLES.includes(title)) {
      console.log(`Skipping (not verified): ${title}`);
      continue;
    }

    seenTitles.add(title);

    // Apply date corrections if needed
    let published = post.published;
    if (DATE_CORRECTIONS[title]) {
      console.log(`  Correcting date: "${title}" from ${post.published.split('T')[0]} to ${DATE_CORRECTIONS[title].split('T')[0]}`);
      published = DATE_CORRECTIONS[title];
    }

    const cleanedContent = cleanContent(post.content);
    let images = extractImages(post.content, post.imageMap);
    const videos = VIDEO_MAP[title] || [];

    // Add geotagged photos based on date ranges
    const geoPhotos = getGeotaggedPhotos(title, geotaggedPhotos);
    if (geoPhotos.length > 0) {
      console.log(`  Adding ${geoPhotos.length} geotagged photos to "${title}"`);
      images = [...images, ...geoPhotos];
    }

    // Determine hero image (first image or null)
    const heroImage = images.length > 0 ? images[0] : null;

    processedPosts.push({
      id: post.id,
      title: title,
      content: cleanedContent,
      published: published,
      formattedDate: formatDate(published),
      shortDate: getShortDate(published),
      author: post.author?.name || 'Nico',
      images: images,
      heroImage: heroImage,
      hasImages: images.length > 0,
      imageCount: images.length,
      videos: videos,
      hasVideos: videos.length > 0
    });

    console.log(`✓ Processed: ${title} (${images.length} images, ${videos.length} videos)`);
  }

  // Sort by date (chronological)
  processedPosts.sort((a, b) => new Date(a.published) - new Date(b.published));

  // Group posts by date for chapter dividers
  const chapters = [];
  let currentDate = '';

  processedPosts.forEach(post => {
    const postDate = post.shortDate;
    if (postDate !== currentDate) {
      chapters.push({
        date: postDate,
        fullDate: post.formattedDate,
        posts: [post]
      });
      currentDate = postDate;
    } else {
      chapters[chapters.length - 1].posts.push(post);
    }
  });

  // Create output data
  const outputData = {
    title: 'Maritime Biking',
    subtitle: 'A 900-Mile Bicycle Journey Through Nova Scotia and Newfoundland',
    year: '2008',
    authors: ['Nico', 'Dominic', 'Gretta'],
    totalPosts: processedPosts.length,
    totalImages: processedPosts.reduce((sum, p) => sum + p.imageCount, 0),
    dateRange: {
      start: processedPosts[0]?.formattedDate,
      end: processedPosts[processedPosts.length - 1]?.formattedDate
    },
    posts: processedPosts,
    chapters: chapters
  };

  // Write processed data
  const outputPath = path.join(OUTPUT_DIR, 'posts.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

  console.log(`\n✓ Processed ${processedPosts.length} posts (should be 28)`);
  console.log(`✓ Total images: ${outputData.totalImages}`);
  console.log(`✓ Output written to: ${outputPath}`);

  return outputData;
}

// Run if called directly
if (require.main === module) {
  processAllPosts();
}

module.exports = { processAllPosts };
