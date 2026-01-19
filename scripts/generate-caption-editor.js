const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf-8'));

// Load existing image captions if any exist
let existingImageCaptions = {};
const imageCaptionsPath = path.join(__dirname, '../data/image-captions.json');
if (fs.existsSync(imageCaptionsPath)) {
  existingImageCaptions = JSON.parse(fs.readFileSync(imageCaptionsPath, 'utf-8'));
}

// Load video thumbnails
let videoThumbnails = {};
const videoThumbnailsPath = path.join(__dirname, '../data/video-thumbnails.json');
if (fs.existsSync(videoThumbnailsPath)) {
  videoThumbnails = JSON.parse(fs.readFileSync(videoThumbnailsPath, 'utf-8'));
}

// Extract existing video captions from posts
let existingVideoCaptions = {};
posts.posts.forEach(post => {
  if (post.videoCaptions) {
    Object.assign(existingVideoCaptions, post.videoCaptions);
  }
});

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Media Caption Editor - Maritime Blog</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f4;
    }
    h1 { color: #1c1917; margin-bottom: 5px; }
    h2 { color: #44403c; border-bottom: 2px solid #d6d3d1; padding-bottom: 10px; margin-top: 40px; }
    .subtitle { color: #78716c; margin-bottom: 20px; }
    .post { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .post-date { color: #78716c; font-size: 14px; margin-bottom: 15px; }
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
    .media-card { border: 2px solid #e7e5e4; border-radius: 8px; overflow: hidden; background: #fafaf9; }
    .media-card.has-caption { border-color: #22c55e; }
    .media-card.is-video { border-color: #3b82f6; }
    .media-card.is-video.has-caption { border-color: #22c55e; }
    .media-card img, .media-card video { width: 100%; height: 220px; object-fit: cover; cursor: pointer; }
    .media-card img:hover, .media-card video:hover { opacity: 0.9; }
    .video-placeholder {
      width: 100%;
      height: 220px;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
    }
    .video-placeholder:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
    .video-placeholder svg { width: 60px; height: 60px; margin-bottom: 10px; }
    .video-placeholder span { font-size: 14px; opacity: 0.8; }
    .video-thumbnail-container {
      position: relative;
      width: 100%;
      height: 220px;
      cursor: pointer;
    }
    .video-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .video-play-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      transition: background 0.2s;
    }
    .video-thumbnail-container:hover .video-play-overlay { background: rgba(0, 0, 0, 0.5); }
    .video-play-overlay svg { width: 60px; height: 60px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
    .caption-area { padding: 12px; }
    .position { font-weight: bold; color: #1c1917; font-size: 14px; margin-bottom: 8px; }
    .position .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      margin-left: 8px;
    }
    .badge-image { background: #dbeafe; color: #1d4ed8; }
    .badge-video { background: #fee2e2; color: #dc2626; }
    .filename { color: #a8a29e; font-size: 10px; word-break: break-all; margin-bottom: 8px; }
    .caption-input {
      width: 100%;
      min-height: 60px;
      padding: 8px;
      border: 1px solid #d6d3d1;
      border-radius: 4px;
      font-family: inherit;
      font-size: 13px;
      resize: vertical;
    }
    .caption-input:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
    }
    .caption-input::placeholder { color: #a8a29e; }
    .counter-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #1c1917;
      color: white;
      padding: 12px 20px;
      z-index: 1000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .counter-bar .stats { display: flex; gap: 20px; }
    .counter-bar .count { font-weight: bold; }
    .counter-bar button {
      background: #22c55e;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
    .counter-bar button:hover { background: #16a34a; }
    body { padding-top: 70px; }
    .instructions { background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .no-images { color: #78716c; font-style: italic; padding: 20px; text-align: center; }
    .char-count { font-size: 11px; color: #a8a29e; text-align: right; margin-top: 4px; }
    .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
    .filter-bar label { font-size: 14px; color: #44403c; }
    .filter-bar select, .filter-bar input {
      padding: 8px 12px;
      border: 1px solid #d6d3d1;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="counter-bar">
    <div class="stats">
      <div><span class="count" id="captionedCount">0</span> captioned</div>
      <div><span class="count" id="totalCount">0</span> total media</div>
      <div><span class="count" id="progressPercent">0%</span></div>
    </div>
    <div>
      <button onclick="exportCaptions()">Export Captions JSON</button>
    </div>
  </div>

  <h1>Maritime Blog - Media Caption Editor</h1>
  <p class="subtitle">Add captions to photos and videos, grouped by post. Captions auto-save as you type.</p>

  <div class="instructions">
    <strong>Instructions:</strong>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Click on an image/video to view it full-size in a new tab</li>
      <li>Type a caption in the text field below each media item</li>
      <li>Captions are saved automatically as you type (stored in localStorage)</li>
      <li>Green border indicates an item has a caption</li>
      <li>Blue border with red badge indicates a video</li>
      <li>Click "Export Captions JSON" when done to save the data</li>
    </ul>
  </div>

  <div class="filter-bar">
    <label>Show:</label>
    <select id="filterSelect" onchange="applyFilter()">
      <option value="all">All media</option>
      <option value="uncaptioned">Uncaptioned only</option>
      <option value="captioned">Captioned only</option>
      <option value="images">Images only</option>
      <option value="videos">Videos only</option>
    </select>
    <label style="margin-left: 20px;">Jump to post:</label>
    <select id="postSelect" onchange="jumpToPost()">
      <option value="">Select a post...</option>
    </select>
  </div>

  <div id="posts-container"></div>

  <script>
    const postsData = ${JSON.stringify(posts)};
    const existingImageCaptions = ${JSON.stringify(existingImageCaptions)};
    const existingVideoCaptions = ${JSON.stringify(existingVideoCaptions)};
    const videoThumbnails = ${JSON.stringify(videoThumbnails)};

    // Caption storage (separate for images and videos)
    const imageCaptions = {};
    const videoCaptions = {};
    let totalMedia = 0;

    // Initialize captions from localStorage or existing file
    function initCaptions() {
      const storedImages = localStorage.getItem('maritime-blog-image-captions');
      const storedVideos = localStorage.getItem('maritime-blog-video-captions');

      if (storedImages) {
        Object.assign(imageCaptions, JSON.parse(storedImages));
      }
      if (storedVideos) {
        Object.assign(videoCaptions, JSON.parse(storedVideos));
      }

      // Merge with existing captions from file (localStorage takes precedence)
      Object.keys(existingImageCaptions).forEach(key => {
        if (!imageCaptions[key]) {
          imageCaptions[key] = existingImageCaptions[key];
        }
      });
      Object.keys(existingVideoCaptions).forEach(key => {
        if (!videoCaptions[key]) {
          videoCaptions[key] = existingVideoCaptions[key];
        }
      });
    }

    // Save captions to localStorage
    function saveCaptions() {
      localStorage.setItem('maritime-blog-image-captions', JSON.stringify(imageCaptions));
      localStorage.setItem('maritime-blog-video-captions', JSON.stringify(videoCaptions));
      updateStats();
    }

    // Handle caption input
    function handleCaptionChange(mediaPath, value, isVideo) {
      const captions = isVideo ? videoCaptions : imageCaptions;
      if (value.trim()) {
        captions[mediaPath] = value.trim();
      } else {
        delete captions[mediaPath];
      }
      saveCaptions();

      // Update card border
      const card = document.querySelector(\`[data-media="\${CSS.escape(mediaPath)}"]\`);
      if (card) {
        card.classList.toggle('has-caption', !!value.trim());
        card.dataset.captioned = !!value.trim();
      }
    }

    function updateStats() {
      const captionedImages = Object.keys(imageCaptions).filter(k => imageCaptions[k]).length;
      const captionedVideos = Object.keys(videoCaptions).filter(k => videoCaptions[k]).length;
      const total = captionedImages + captionedVideos;

      document.getElementById('captionedCount').textContent = total;
      document.getElementById('totalCount').textContent = totalMedia;
      document.getElementById('progressPercent').textContent =
        totalMedia > 0 ? Math.round(total / totalMedia * 100) + '%' : '0%';
    }

    function getFilename(path) {
      return decodeURIComponent(path.split('/').pop());
    }

    function renderImageCard(postId, imagePath, index, overallIndex) {
      const caption = imageCaptions[imagePath] || '';
      const hasCaption = !!caption;
      const filename = getFilename(imagePath);

      return \`
        <div class="media-card \${hasCaption ? 'has-caption' : ''}" data-media="\${imagePath}" data-captioned="\${hasCaption}" data-type="image">
          <img src="\${imagePath}" alt="Image \${index + 1}"
               onclick="window.open('\${imagePath}', '_blank')"
               onerror="this.style.background='#e7e5e4';this.alt='Image not found'">
          <div class="caption-area">
            <div class="position">Media \${overallIndex + 1} <span class="badge badge-image">Image</span></div>
            <div class="filename">\${filename}</div>
            <textarea
              class="caption-input"
              placeholder="Enter caption for this image..."
              oninput="handleCaptionChange('\${imagePath}', this.value, false)"
            >\${caption}</textarea>
          </div>
        </div>
      \`;
    }

    function renderVideoCard(postId, videoPath, index, overallIndex) {
      const caption = videoCaptions[videoPath] || '';
      const hasCaption = !!caption;
      const filename = getFilename(videoPath);
      const thumbnailPath = videoThumbnails[videoPath];

      const mediaContent = thumbnailPath
        ? \`<div class="video-thumbnail-container" onclick="window.open('\${videoPath}', '_blank')">
            <img src="\${thumbnailPath}" alt="Video \${index + 1}" class="video-thumbnail">
            <div class="video-play-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>\`
        : \`<div class="video-placeholder" onclick="window.open('\${videoPath}', '_blank')">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Click to play video</span>
          </div>\`;

      return \`
        <div class="media-card is-video \${hasCaption ? 'has-caption' : ''}" data-media="\${videoPath}" data-captioned="\${hasCaption}" data-type="video">
          \${mediaContent}
          <div class="caption-area">
            <div class="position">Media \${overallIndex + 1} <span class="badge badge-video">Video</span></div>
            <div class="filename">\${filename}</div>
            <textarea
              class="caption-input"
              placeholder="Enter caption for this video..."
              oninput="handleCaptionChange('\${videoPath}', this.value, true)"
            >\${caption}</textarea>
          </div>
        </div>
      \`;
    }

    function renderPost(post) {
      const images = post.images || [];
      const videos = post.videos || [];
      const mediaCount = images.length + videos.length;

      if (mediaCount === 0) return '';

      totalMedia += mediaCount;

      // Render images first, then videos
      let overallIndex = 0;
      const imagesHtml = images.map((img, idx) => {
        const html = renderImageCard(post.id, img, idx, overallIndex);
        overallIndex++;
        return html;
      }).join('');

      const videosHtml = videos.map((vid, idx) => {
        const html = renderVideoCard(post.id, vid, idx, overallIndex);
        overallIndex++;
        return html;
      }).join('');

      const imageText = images.length > 0 ? images.length + ' image' + (images.length !== 1 ? 's' : '') : '';
      const videoText = videos.length > 0 ? videos.length + ' video' + (videos.length !== 1 ? 's' : '') : '';
      const mediaText = [imageText, videoText].filter(Boolean).join(', ');

      return \`
        <div class="post" id="post-\${post.id}">
          <h2>\${post.title}</h2>
          <p class="post-date">\${post.formattedDate} &bull; \${mediaText}</p>
          <div class="media-grid">
            \${imagesHtml}
            \${videosHtml}
          </div>
        </div>
      \`;
    }

    function renderPosts() {
      totalMedia = 0;
      const container = document.getElementById('posts-container');
      container.innerHTML = postsData.posts
        .filter(p => (p.images && p.images.length > 0) || (p.videos && p.videos.length > 0))
        .map(renderPost)
        .join('');
      updateStats();
    }

    function populatePostSelect() {
      const select = document.getElementById('postSelect');
      postsData.posts
        .filter(p => (p.images && p.images.length > 0) || (p.videos && p.videos.length > 0))
        .forEach(post => {
          const images = post.images?.length || 0;
          const videos = post.videos?.length || 0;
          const option = document.createElement('option');
          option.value = post.id;
          option.textContent = post.title + ' (' + images + 'i, ' + videos + 'v)';
          select.appendChild(option);
        });
    }

    function jumpToPost() {
      const postId = document.getElementById('postSelect').value;
      if (postId) {
        const element = document.getElementById('post-' + postId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    function applyFilter() {
      const filter = document.getElementById('filterSelect').value;
      const cards = document.querySelectorAll('.media-card');

      cards.forEach(card => {
        const hasCap = card.dataset.captioned === 'true';
        const type = card.dataset.type;
        let show = true;

        if (filter === 'uncaptioned' && hasCap) show = false;
        if (filter === 'captioned' && !hasCap) show = false;
        if (filter === 'images' && type !== 'image') show = false;
        if (filter === 'videos' && type !== 'video') show = false;

        card.style.display = show ? '' : 'none';
      });
    }

    function exportCaptions() {
      const output = {
        imageCaptions: imageCaptions,
        videoCaptions: videoCaptions,
        _generated: new Date().toISOString(),
        _imageCount: Object.keys(imageCaptions).length,
        _videoCount: Object.keys(videoCaptions).length
      };

      const json = JSON.stringify(output, null, 2);

      // Show modal
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = \`
        <div style="background:white;padding:20px;border-radius:8px;max-width:900px;width:100%;max-height:80vh;overflow:auto;">
          <h3 style="margin-top:0;">Export Captions</h3>
          <p>Copy this JSON to share with Claude. It contains both image and video captions:</p>
          <textarea style="width:100%;height:400px;font-family:monospace;font-size:12px;padding:10px;" readonly>\${json}</textarea>
          <div style="margin-top:15px;display:flex;justify-content:space-between;">
            <div>
              <button onclick="downloadImageCaptions()" style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">Download image-captions.json</button>
            </div>
            <div>
              <button onclick="navigator.clipboard.writeText(this.parentElement.parentElement.previousElementSibling.value);this.textContent='Copied!'" style="padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">Copy to Clipboard</button>
              <button onclick="this.closest('div').parentElement.parentElement.remove()" style="padding:8px 16px;background:#e7e5e4;border:1px solid #d6d3d1;border-radius:4px;cursor:pointer;">Close</button>
            </div>
          </div>
        </div>
      \`;
      document.body.appendChild(modal);
    }

    function downloadImageCaptions() {
      const json = JSON.stringify(imageCaptions, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'image-captions.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initialize
    initCaptions();
    renderPosts();
    populatePostSelect();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../public/caption-editor.html'), html);

// Count stats
const postsWithMedia = posts.posts.filter(p => (p.images && p.images.length > 0) || (p.videos && p.videos.length > 0));
const totalImages = postsWithMedia.reduce((sum, p) => sum + (p.images?.length || 0), 0);
const totalVideos = postsWithMedia.reduce((sum, p) => sum + (p.videos?.length || 0), 0);

console.log('Generated caption-editor.html');
console.log('Posts with media:', postsWithMedia.length);
console.log('Total images:', totalImages);
console.log('Total videos:', totalVideos);
