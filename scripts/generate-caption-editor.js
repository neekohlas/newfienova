const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf-8'));

// Load existing image captions if any exist
let existingCaptions = {};
const captionsPath = path.join(__dirname, '../data/image-captions.json');
if (fs.existsSync(captionsPath)) {
  existingCaptions = JSON.parse(fs.readFileSync(captionsPath, 'utf-8'));
}

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Image Caption Editor - Maritime Blog</title>
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
    .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
    .image-card { border: 2px solid #e7e5e4; border-radius: 8px; overflow: hidden; background: #fafaf9; }
    .image-card.has-caption { border-color: #22c55e; }
    .image-card img { width: 100%; height: 220px; object-fit: cover; cursor: pointer; }
    .image-card img:hover { opacity: 0.9; }
    .caption-area { padding: 12px; }
    .position { font-weight: bold; color: #1c1917; font-size: 14px; margin-bottom: 8px; }
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
    .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
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
      <div><span class="count" id="totalCount">0</span> total images</div>
      <div><span class="count" id="progressPercent">0%</span></div>
    </div>
    <div>
      <button onclick="exportCaptions()">Export Captions JSON</button>
    </div>
  </div>

  <h1>Maritime Blog - Image Caption Editor</h1>
  <p class="subtitle">Add captions to photos, grouped by post. Captions auto-save as you type.</p>

  <div class="instructions">
    <strong>Instructions:</strong>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Click on an image to view it full-size in a new tab</li>
      <li>Type a caption in the text field below each image</li>
      <li>Captions are saved automatically as you type (stored in localStorage)</li>
      <li>Green border indicates an image has a caption</li>
      <li>Click "Export Captions JSON" when done to save the data</li>
    </ul>
  </div>

  <div class="filter-bar">
    <label>Show:</label>
    <select id="filterSelect" onchange="applyFilter()">
      <option value="all">All images</option>
      <option value="uncaptioned">Uncaptioned only</option>
      <option value="captioned">Captioned only</option>
    </select>
    <label style="margin-left: 20px;">Jump to post:</label>
    <select id="postSelect" onchange="jumpToPost()">
      <option value="">Select a post...</option>
    </select>
  </div>

  <div id="posts-container"></div>

  <script>
    const postsData = ${JSON.stringify(posts)};
    const existingCaptions = ${JSON.stringify(existingCaptions)};

    // Caption storage
    const captions = {};
    let totalImages = 0;

    // Initialize captions from localStorage or existing file
    function initCaptions() {
      const stored = localStorage.getItem('maritime-blog-captions');
      if (stored) {
        Object.assign(captions, JSON.parse(stored));
      }
      // Merge with existing captions from file (localStorage takes precedence)
      Object.keys(existingCaptions).forEach(key => {
        if (!captions[key]) {
          captions[key] = existingCaptions[key];
        }
      });
    }

    // Save captions to localStorage
    function saveCaptions() {
      localStorage.setItem('maritime-blog-captions', JSON.stringify(captions));
      updateStats();
    }

    // Handle caption input
    function handleCaptionChange(imagePath, value) {
      if (value.trim()) {
        captions[imagePath] = value.trim();
      } else {
        delete captions[imagePath];
      }
      saveCaptions();

      // Update card border
      const card = document.querySelector(\`[data-image="\${CSS.escape(imagePath)}"]\`);
      if (card) {
        card.classList.toggle('has-caption', !!value.trim());
      }
    }

    function updateStats() {
      const captioned = Object.keys(captions).filter(k => captions[k]).length;
      document.getElementById('captionedCount').textContent = captioned;
      document.getElementById('totalCount').textContent = totalImages;
      document.getElementById('progressPercent').textContent =
        totalImages > 0 ? Math.round(captioned / totalImages * 100) + '%' : '0%';
    }

    function getFilename(path) {
      return decodeURIComponent(path.split('/').pop());
    }

    function renderImageCard(postId, imagePath, index) {
      const caption = captions[imagePath] || '';
      const hasCaption = !!caption;
      const filename = getFilename(imagePath);

      return \`
        <div class="image-card \${hasCaption ? 'has-caption' : ''}" data-image="\${imagePath}" data-captioned="\${hasCaption}">
          <img src="\${imagePath}" alt="Image \${index + 1}"
               onclick="window.open('\${imagePath}', '_blank')"
               onerror="this.style.background='#e7e5e4';this.alt='Image not found'">
          <div class="caption-area">
            <div class="position">Image \${index + 1}</div>
            <div class="filename">\${filename}</div>
            <textarea
              class="caption-input"
              placeholder="Enter caption for this image..."
              oninput="handleCaptionChange('\${imagePath}', this.value)"
            >\${caption}</textarea>
          </div>
        </div>
      \`;
    }

    function renderPost(post) {
      const images = post.images || [];
      if (images.length === 0) return '';

      totalImages += images.length;

      const imagesHtml = images.map((img, idx) =>
        renderImageCard(post.id, img, idx)
      ).join('');

      return \`
        <div class="post" id="post-\${post.id}">
          <h2>\${post.title}</h2>
          <p class="post-date">\${post.formattedDate} &bull; \${images.length} image\${images.length !== 1 ? 's' : ''}</p>
          <div class="images-grid">
            \${imagesHtml}
          </div>
        </div>
      \`;
    }

    function renderPosts() {
      totalImages = 0;
      const container = document.getElementById('posts-container');
      container.innerHTML = postsData.posts
        .filter(p => p.images && p.images.length > 0)
        .map(renderPost)
        .join('');
      updateStats();
    }

    function populatePostSelect() {
      const select = document.getElementById('postSelect');
      postsData.posts
        .filter(p => p.images && p.images.length > 0)
        .forEach(post => {
          const option = document.createElement('option');
          option.value = post.id;
          option.textContent = post.title + ' (' + post.images.length + ')';
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
      const cards = document.querySelectorAll('.image-card');

      cards.forEach(card => {
        const hasCap = card.dataset.captioned === 'true';
        let show = true;

        if (filter === 'uncaptioned' && hasCap) show = false;
        if (filter === 'captioned' && !hasCap) show = false;

        card.style.display = show ? '' : 'none';
      });
    }

    function exportCaptions() {
      const output = {
        _instructions: "Add this to your posts.json or use as imageCaptions data",
        _generated: new Date().toISOString(),
        _count: Object.keys(captions).length,
        captions: captions
      };

      const json = JSON.stringify(output, null, 2);

      // Show modal
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = \`
        <div style="background:white;padding:20px;border-radius:8px;max-width:900px;width:100%;max-height:80vh;overflow:auto;">
          <h3 style="margin-top:0;">Export Captions</h3>
          <p>Copy this JSON. You can paste it to Claude to apply the captions, or save it as data/image-captions.json:</p>
          <textarea style="width:100%;height:400px;font-family:monospace;font-size:12px;padding:10px;" readonly>\${json}</textarea>
          <div style="margin-top:15px;display:flex;justify-content:space-between;">
            <div>
              <button onclick="downloadCaptions()" style="padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">Download JSON File</button>
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

    function downloadCaptions() {
      const output = {
        _generated: new Date().toISOString(),
        _count: Object.keys(captions).length,
        captions: captions
      };

      const json = JSON.stringify(output, null, 2);
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
const postsWithImages = posts.posts.filter(p => p.images && p.images.length > 0);
const totalImages = postsWithImages.reduce((sum, p) => sum + p.images.length, 0);

console.log('Generated caption-editor.html');
console.log('Posts with images:', postsWithImages.length);
console.log('Total images:', totalImages);
