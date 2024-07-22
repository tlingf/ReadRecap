export function isArticle(url, title) {
  const lowercaseUrl = url.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  // Parse the URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    console.error("Invalid URL:", url);
    return false;
  }

  // Check if it's just the base domain
  if (parsedUrl.pathname === "/" || parsedUrl.pathname === "" || parsedUrl.pathname.endsWith("home")) {
    return false;
  }

  // Explicitly exclude Google Colab URLs
  if (lowercaseUrl.includes('colab.research.google.com')) return false;

  // Check for date pattern in URL (e.g., 2024/07/21)
  if (/\/\d{4}\/\d{2}\/\d{2}\//.test(url)) return true;

  // Check for Substack domain
  if (lowercaseUrl.includes('substack.com')) return true;

  // Check for "podcast" in URL
  if (lowercaseUrl.includes('podcast')) return true;

  // Medium articles
  if (lowercaseUrl.includes('medium.com')) return true;

  // Wikipedia articles
  if (lowercaseUrl.includes('wikipedia.org/wiki/')) return true;

  // Common blog platforms
  if (lowercaseUrl.includes('wordpress.com') || lowercaseUrl.includes('blogspot.com')) return true;

  // GitHub README files or documentation
  if (lowercaseUrl.includes('github.com') && (lowercaseUrl.includes('readme') || lowercaseUrl.includes('/docs/'))) return false;

  // Scientific papers (common domains)
  if (lowercaseUrl.includes('arxiv.org') || lowercaseUrl.includes('researchgate.net') || lowercaseUrl.includes('sciencedirect.com')) return true;

  // News websites (this list can be expanded)
  const newsKeywords = ['news', 'article', 'story', 'report', 'opinion', 'editorial'];
  if (newsKeywords.some(keyword => lowercaseUrl.includes(keyword) || lowercaseTitle.includes(keyword))) return true;

  // Long-form content indicators in title
  const longFormKeywords = ['longread', 'long read', 'in-depth', 'explainer', 'guide', 'tutorial'];
  if (longFormKeywords.some(keyword => lowercaseTitle.includes(keyword))) return true;

  return false;
}