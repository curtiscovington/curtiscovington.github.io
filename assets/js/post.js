const postContent = document.getElementById('postContent');
const postMeta = document.getElementById('postMeta');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const params = new URLSearchParams(window.location.search);
const slug = params.get('post');

const post = posts.find((item) => item.slug === slug);

function renderNotFound() {
  if (!postContent || !postMeta) return;
  postMeta.innerHTML = '';
  postContent.innerHTML = `
    <h1>Post not found</h1>
    <p>The article you're looking for doesn't exist or has been moved.</p>
    <a class="post__cta" href="./#latest">Return to the latest posts</a>
  `;
  document.title = 'Post not found — Curtis Covington';
}

if (!post) {
  renderNotFound();
} else {
  document.title = `${post.title} — Curtis Covington`;
  postMeta.innerHTML = `
    <p class="post__date">${post.date}</p>
    <h1 class="post__title">${post.title}</h1>
    <p class="post__reading">${post.readingTime}</p>
  `;

  fetch(post.file)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Unable to load post');
      }
      return response.text();
    })
    .then((markdown) => {
      if (!postContent) return;
      postContent.innerHTML = marked.parse(markdown);
    })
    .catch(() => {
      renderNotFound();
    });
}
