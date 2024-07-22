export function isArticle(url, title) {
  const lowercaseUrl = url.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  if (lowercaseUrl.includes('colab.research.google.com')) return false;

  if (/\/\d{4}\/\d{2}\/\d{2}\//.test(url)) return true;

  const articleDomains = ['substack.com', 'medium.com', 'wikipedia.org'];
  if (articleDomains.some(domain => lowercaseUrl.includes(domain))) return true;

  const articleKeywords = ['article', 'story', 'news', 'blog', 'post'];
  if (articleKeywords.some(keyword => lowercaseUrl.includes(keyword) || lowercaseTitle.includes(keyword))) return true;

  return false;
}

export function formatTime(minutes) {
  return minutes >= 60 ? "60+ minutes" : `${minutes} minutes`;
}
