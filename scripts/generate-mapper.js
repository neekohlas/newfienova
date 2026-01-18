const fs = require('fs');
const path = require('path');

const posts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/posts.json'), 'utf-8'));

const html = `<!DOCTYPE html>
<html>
<head>
  <title>Image & Video Mapper - Maritime Blog</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f4;
    }
    h1 { color: #1c1917; }
    h2 { color: #44403c; border-bottom: 2px solid #d6d3d1; padding-bottom: 10px; margin-top: 40px; }
    .post { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .post-date { color: #78716c; font-size: 14px; margin-bottom: 15px; }
    .media-section { margin-bottom: 20px; }
    .media-section h4 { margin: 0 0 10px 0; color: #44403c; font-size: 14px; }
    .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
    .media-card { border: 2px solid #e7e5e4; border-radius: 8px; overflow: hidden; background: #fafaf9; position: relative; }
    .media-card.changed { border-color: #22c55e; }
    .media-card.deleted { border-color: #ef4444; opacity: 0.5; }
    .media-card.added { border-color: #3b82f6; }
    .media-card img, .media-card video { width: 100%; height: 180px; object-fit: cover; cursor: pointer; }
    .media-card img:hover, .media-card video:hover { opacity: 0.9; }
    .media-info { padding: 10px; font-size: 12px; }
    .position { font-weight: bold; color: #1c1917; font-size: 16px; }
    .filename { color: #78716c; font-size: 11px; word-break: break-all; margin-top: 4px; }
    .source-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px; }
    .source-media { background: #fef3c7; color: #92400e; }
    .source-geotagged { background: #d1fae5; color: #065f46; }
    .source-geotagged2 { background: #dbeafe; color: #1e40af; }
    .source-video { background: #fae8ff; color: #86198f; }
    .btn-row { display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap; }
    .btn {
      flex: 1;
      min-width: 70px;
      padding: 6px 8px;
      background: #f5f5f4;
      border: 1px solid #d6d3d1;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      text-align: center;
    }
    .btn:hover { background: #e7e5e4; }
    .btn-replace { background: #dbeafe; border-color: #93c5fd; }
    .btn-replace:hover { background: #bfdbfe; }
    .btn-delete { background: #fee2e2; border-color: #fca5a5; }
    .btn-delete:hover { background: #fecaca; }
    .btn-add { background: #d1fae5; border-color: #6ee7b7; }
    .btn-add:hover { background: #a7f3d0; }
    .btn-insert { background: #e0e7ff; border-color: #a5b4fc; }
    .btn-insert:hover { background: #c7d2fe; }
    .btn-revert { background: #fef3c7; border-color: #fcd34d; }
    .btn-revert:hover { background: #fde68a; }
    .deleted-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(239, 68, 68, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #991b1b;
      font-weight: bold;
      font-size: 18px;
      pointer-events: none;
    }
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
    .counter-bar button:disabled { background: #6b7280; cursor: not-allowed; }
    body { padding-top: 70px; }
    .instructions { background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .no-media { color: #78716c; font-style: italic; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="counter-bar">
    <div>
      <span class="count" id="changeCount">0</span> posts modified
    </div>
    <div>
      <button onclick="exportChanges()" id="exportBtn" disabled>Export Changes JSON</button>
    </div>
  </div>

  <h1>Maritime Blog - Image & Video Mapper</h1>

  <div class="instructions">
    <strong>Instructions:</strong>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li><strong>Replace:</strong> Click to select a new image/video from your local files</li>
      <li><strong>Delete:</strong> Remove an image/video from the post</li>
      <li><strong>Insert:</strong> Insert a new image/video before this position</li>
      <li><strong>Add:</strong> Add a new image/video to the end of a post</li>
      <li><strong>Revert:</strong> Undo changes for a specific post</li>
    </ul>
    <p style="margin-top: 10px; font-size: 13px;">
      <strong>Source badges:</strong>
      <span class="source-badge source-media">MEDIA</span> Low-res blogger original
      <span class="source-badge source-geotagged">GEOTAGGED</span> High-res from folder 1
      <span class="source-badge source-geotagged2">GEOTAGGED2</span> High-res from folder 2
      <span class="source-badge source-video">VIDEO</span> Video file
    </p>
  </div>

  <div id="posts-container"></div>

  <script>
    const postsData = ${JSON.stringify(posts)};

    // Track original and current state
    const originalImages = {};
    const originalVideos = {};
    const currentImages = {};
    const currentVideos = {};
    const changedPosts = new Set();

    // Initialize state
    postsData.posts.forEach(post => {
      originalImages[post.id] = [...(post.images || [])];
      originalVideos[post.id] = [...(post.videos || [])];
      currentImages[post.id] = [...(post.images || [])];
      currentVideos[post.id] = [...(post.videos || [])];
    });

    function getSource(path) {
      if (path.startsWith('/geotagged2/')) return { label: 'GEOTAGGED2', class: 'source-geotagged2' };
      if (path.startsWith('/geotagged/')) return { label: 'GEOTAGGED', class: 'source-geotagged' };
      if (path.startsWith('/videos/')) return { label: 'VIDEO', class: 'source-video' };
      return { label: 'MEDIA', class: 'source-media' };
    }

    function getFilename(path) {
      return decodeURIComponent(path.split('/').pop());
    }

    function isVideo(path) {
      const ext = path.toLowerCase().split('.').pop();
      return ['mov', 'mp4', 'webm', 'avi'].includes(ext);
    }

    function updateCounter() {
      document.getElementById('changeCount').textContent = changedPosts.size;
      document.getElementById('exportBtn').disabled = changedPosts.size === 0;
    }

    function checkIfChanged(postId) {
      const imagesMatch = JSON.stringify(currentImages[postId]) === JSON.stringify(originalImages[postId]);
      const videosMatch = JSON.stringify(currentVideos[postId]) === JSON.stringify(originalVideos[postId]);
      if (imagesMatch && videosMatch) {
        changedPosts.delete(postId);
      } else {
        changedPosts.add(postId);
      }
      updateCounter();
    }

    function handleReplace(postId, index, type, input) {
      const file = input.files[0];
      if (!file) return;

      const isVid = isVideo(file.name);
      const folder = isVid ? '/videos/' : (file.name.includes('Nova_Newfie') ? '/geotagged2/' : '/geotagged/');
      const newPath = folder + encodeURIComponent(file.name);

      if (type === 'image') {
        currentImages[postId][index] = newPath;
      } else {
        currentVideos[postId][index] = newPath;
      }

      checkIfChanged(postId);
      renderPosts();
    }

    function handleDelete(postId, index, type) {
      if (type === 'image') {
        currentImages[postId].splice(index, 1);
      } else {
        currentVideos[postId].splice(index, 1);
      }
      checkIfChanged(postId);
      renderPosts();
    }

    function handleInsert(postId, index, type, input) {
      const file = input.files[0];
      if (!file) return;

      const isVid = isVideo(file.name);
      const folder = isVid ? '/videos/' : (file.name.includes('Nova_Newfie') ? '/geotagged2/' : '/geotagged/');
      const newPath = folder + encodeURIComponent(file.name);

      if (type === 'image') {
        currentImages[postId].splice(index, 0, newPath);
      } else {
        currentVideos[postId].splice(index, 0, newPath);
      }

      checkIfChanged(postId);
      renderPosts();
    }

    function handleAdd(postId, type, input) {
      const file = input.files[0];
      if (!file) return;

      const isVid = isVideo(file.name);
      const folder = isVid ? '/videos/' : (file.name.includes('Nova_Newfie') ? '/geotagged2/' : '/geotagged/');
      const newPath = folder + encodeURIComponent(file.name);

      if (type === 'video' || isVid) {
        currentVideos[postId].push(newPath);
      } else {
        currentImages[postId].push(newPath);
      }

      checkIfChanged(postId);
      renderPosts();
    }

    function handleRevert(postId) {
      currentImages[postId] = [...originalImages[postId]];
      currentVideos[postId] = [...originalVideos[postId]];
      changedPosts.delete(postId);
      updateCounter();
      renderPosts();
    }

    function renderMediaCard(postId, path, index, type, isChanged) {
      const source = getSource(path);
      const filename = getFilename(path);
      const isVid = isVideo(path);

      return \`
        <div class="media-card \${isChanged ? 'changed' : ''}">
          \${isVid
            ? \`<video src="\${path}" controls preload="metadata"></video>\`
            : \`<img src="\${path}" alt="Position \${index + 1}" onclick="window.open('\${path}', '_blank')">\`
          }
          <div class="media-info">
            <span class="position">\${type === 'image' ? 'Image' : 'Video'} \${index + 1}</span>
            <span class="source-badge \${source.class}">\${source.label}</span>
            <div class="filename">\${filename}</div>
            <div class="btn-row">
              <label class="btn btn-replace">
                Replace
                <input type="file" accept="\${type === 'video' ? 'video/*' : 'image/*,video/*'}" style="display:none"
                  onchange="handleReplace('\${postId}', \${index}, '\${type}', this)">
              </label>
              <label class="btn btn-insert">
                Insert
                <input type="file" accept="\${type === 'video' ? 'video/*' : 'image/*,video/*'}" style="display:none"
                  onchange="handleInsert('\${postId}', \${index}, '\${type}', this)">
              </label>
              <button class="btn btn-delete" onclick="handleDelete('\${postId}', \${index}, '\${type}')">Delete</button>
            </div>
          </div>
        </div>
      \`;
    }

    function renderPost(post) {
      const images = currentImages[post.id];
      const videos = currentVideos[post.id];
      const hasChanges = changedPosts.has(post.id);

      let imagesHtml = '';
      if (images.length > 0) {
        imagesHtml = images.map((img, idx) => {
          const wasChanged = originalImages[post.id][idx] !== img;
          return renderMediaCard(post.id, img, idx, 'image', wasChanged);
        }).join('');
      } else {
        imagesHtml = '<div class="no-media">No images</div>';
      }

      let videosHtml = '';
      if (videos.length > 0) {
        videosHtml = videos.map((vid, idx) => {
          const wasChanged = originalVideos[post.id][idx] !== vid;
          return renderMediaCard(post.id, vid, idx, 'video', wasChanged);
        }).join('');
      }

      return \`
        <div class="post" id="post-\${post.id}">
          <h2>\${post.title} \${hasChanges ? '<span style="color:#22c55e">(modified)</span>' : ''}</h2>
          <p class="post-date">\${post.formattedDate}</p>

          <div class="media-section">
            <h4>Images</h4>
            <div class="images-grid">
              \${imagesHtml}
              <div class="media-card" style="border-style: dashed; display: flex; align-items: center; justify-content: center; min-height: 180px;">
                <label class="btn btn-add" style="width: auto; padding: 12px 20px;">
                  + Add Image
                  <input type="file" accept="image/*" style="display:none"
                    onchange="handleAdd('\${post.id}', 'image', this)">
                </label>
              </div>
            </div>
          </div>

          \${videos.length > 0 || originalVideos[post.id].length > 0 ? \`
          <div class="media-section">
            <h4>Videos</h4>
            <div class="images-grid">
              \${videosHtml || '<div class="no-media">No videos</div>'}
              <div class="media-card" style="border-style: dashed; display: flex; align-items: center; justify-content: center; min-height: 180px;">
                <label class="btn btn-add" style="width: auto; padding: 12px 20px;">
                  + Add Video
                  <input type="file" accept="video/*" style="display:none"
                    onchange="handleAdd('\${post.id}', 'video', this)">
                </label>
              </div>
            </div>
          </div>
          \` : ''}

          \${hasChanges ? \`
          <div style="margin-top: 15px; text-align: right;">
            <button class="btn btn-revert" onclick="handleRevert('\${post.id}')" style="width: auto; padding: 8px 16px;">
              Revert Changes
            </button>
          </div>
          \` : ''}
        </div>
      \`;
    }

    function renderPosts() {
      const container = document.getElementById('posts-container');
      container.innerHTML = postsData.posts.map(renderPost).join('');
    }

    function exportChanges() {
      const changes = [];
      changedPosts.forEach(postId => {
        const post = postsData.posts.find(p => p.id === postId);
        const change = {
          postId,
          postTitle: post.title,
        };

        if (JSON.stringify(currentImages[postId]) !== JSON.stringify(originalImages[postId])) {
          change.images = currentImages[postId];
        }
        if (JSON.stringify(currentVideos[postId]) !== JSON.stringify(originalVideos[postId])) {
          change.videos = currentVideos[postId];
        }

        changes.push(change);
      });

      const output = {
        instructions: "Copy this and paste it to Claude to apply the changes",
        changes
      };

      const json = JSON.stringify(output, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Show in a text area for easy copying
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;';
      modal.innerHTML = \`
        <div style="background:white;padding:20px;border-radius:8px;max-width:800px;width:100%;max-height:80vh;overflow:auto;">
          <h3 style="margin-top:0;">Export Changes</h3>
          <p>Copy the JSON below and paste it to Claude:</p>
          <textarea style="width:100%;height:300px;font-family:monospace;font-size:12px;padding:10px;" readonly>\${json}</textarea>
          <div style="margin-top:15px;text-align:right;">
            <button onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value);this.textContent='Copied!'" style="padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;margin-right:10px;">Copy to Clipboard</button>
            <button onclick="this.closest('div').parentElement.remove()" style="padding:8px 16px;background:#e7e5e4;border:1px solid #d6d3d1;border-radius:4px;cursor:pointer;">Close</button>
          </div>
        </div>
      \`;
      document.body.appendChild(modal);
    }

    // Initial render
    renderPosts();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../public/mapper.html'), html);
console.log('Generated mapper.html with', posts.posts.length, 'posts');
console.log('Posts with videos:', posts.posts.filter(p => p.videos && p.videos.length > 0).length);
