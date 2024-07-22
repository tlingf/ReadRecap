// import { isArticle } from 'utils.js';

const MINIMUM_TIME = 3 * 60 * 1000; // 3 minutes in milliseconds

chrome.runtime.onInstalled.addListener(() => {
  console.log("Read Recap installed. Running initial analysis.");
  analyzeHistory();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runDebug") {
    console.log("Debug request received. Running analysis.");
    analyzeHistory();
    sendResponse({status: "success"});
  }
  return true;
});

function isArticle(url, title) {
  const lowercaseUrl = url.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  // Exclude certain types of pages
  if (lowercaseUrl.includes('google.com/search') || lowercaseUrl.includes('youtube.com')) {
    return false;
  }

  // Include pages with article-like keywords in URL or title
  const articleKeywords = ['article', 'post', 'blog', 'news', 'story', 'feature'];
  return articleKeywords.some(keyword => lowercaseUrl.includes(keyword) || lowercaseTitle.includes(keyword));
}

async function analyzeHistory() {
    console.log("Analyzing history...");
    const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
    
    try {
      const historyItems = await chrome.history.search({
        text: '',
        startTime: oneWeekAgo,
        maxResults: 1000
      });
  
      console.log(`Found ${historyItems.length} history items.`);
      const significantArticles = await processHistoryItems(historyItems);
  
      // Group articles by date
      const groupedArticles = groupArticlesByDate(significantArticles);
  
      console.log("Grouped articles:", groupedArticles);
  
      // Save to storage
      await chrome.storage.local.set({ groupedArticles: groupedArticles });
      console.log("Analysis complete. Saved grouped articles to storage.");
    } catch (error) {
      console.error("Error during history analysis:", error);
    }
  }

async function processHistoryItems(historyItems) {
  const significantArticles = [];
  const seenUrls = new Set();

  for (const item of historyItems) {
    if (isArticle(item.url, item.title) && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      const visits = await chrome.history.getVisits({url: item.url});
      
      if (visits.length > 1) {
        const timeSpent = visits[visits.length - 1].visitTime - visits[0].visitTime;
        if (timeSpent >= MINIMUM_TIME) {
          significantArticles.push({
            url: item.url,
            title: item.title,
            lastVisit: new Date(item.lastVisitTime),
            timeSpent: formatTime(Math.round(timeSpent / 60000))
          });
        }
      }
    }
  }

  return significantArticles;
}

function groupArticlesByDate(articles) {
  return articles.reduce((groups, article) => {
    const date = article.lastVisit.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push({
      ...article,
      lastVisit: article.lastVisit.toLocaleString()
    });
    return groups;
  }, {});
}

function formatTime(minutes) {
  return minutes >= 60 ? "60+ minutes" : `${minutes} minutes`;
}

// Run analysis periodically
chrome.alarms.create("checkHistory", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkHistory") {
    console.log("Alarm triggered. Running analysis.");
    analyzeHistory();
  }
});