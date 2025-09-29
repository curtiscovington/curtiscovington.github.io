const postList = document.getElementById('postList');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (postList) {
  posts
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((post) => {
      const article = document.createElement('article');
      article.className = 'post-card';
      article.innerHTML = `
        <div class="post-card__meta">
          <span class="post-card__date">${post.date}</span>
          <span class="post-card__reading">${post.readingTime}</span>
        </div>
        <h3 class="post-card__title">${post.title}</h3>
        <p class="post-card__excerpt">${post.description}</p>
        <div class="post-card__tags">
          ${post.tags.map((tag) => `<span class="post-card__tag">${tag}</span>`).join('')}
        </div>
        <a class="post-card__link" href="post.html?post=${post.slug}">
          Read post
          <span aria-hidden="true">→</span>
        </a>
      `;
      postList.appendChild(article);
    });
}
