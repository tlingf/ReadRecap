import { isArticle } from './utils.js';

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

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getFilteredArticles") {
      getFilteredArticles(request.minTime, request.startDate, request.endDate)
        .then(response => sendResponse(response));
      return true;  // Indicates that the response is sent asynchronously
    }
    // ... (handle other message types) ...
  });
  
  async function getFilteredArticles(minTime, startDate, endDate) {
    try {
      const historyItems = await chrome.history.search({
        text: '',
        startTime: startDate,
        endTime: endDate,
        maxResults: 1000
      });
  
      console.log(`Found ${historyItems.length} history items.`);
      const significantArticles = await processHistoryItems(historyItems, minTime);
  
      // Group articles by date
      const groupedArticles = groupArticlesByDate(significantArticles);
  
      const stats = {
        articleCount: significantArticles.length,
        startDate: startDate,
        endDate: endDate,
        recapCount: await getRecapCount()
      };
  
      return { articles: significantArticles, stats: stats };
    } catch (error) {
      console.error("Error during filtered history analysis:", error);
      return { articles: [], stats: { articleCount: 0, startDate, endDate, recapCount: 0 } };
    }
  }
  
  async function processHistoryItems(historyItems, minTime) {
    const significantArticles = [];
    const seenUrls = new Set();
  
    for (const item of historyItems) {
      if (isArticle(item.url, item.title) && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        const visits = await chrome.history.getVisits({url: item.url});
        
        if (visits.length > 1) {
          const timeSpent = visits[visits.length - 1].visitTime - visits[0].visitTime;
          if (timeSpent >= MINIMUM_TIME) {
            const domain = new URL(item.url).hostname.replace('www.', '');
            significantArticles.push({
              url: item.url,
              title: item.title,
              domain: domain,
              lastVisit: new Date(item.lastVisitTime),
              timeSpent: formatTime(Math.round(timeSpent / 60000))
            });
          }
        }
      }
    }

  return significantArticles;
}

async function getRecapCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      const recapCount = Object.keys(result).filter(key => key.startsWith('synopsis_') && result[key].trim() !== '').length;
      resolve(recapCount);
    });
  });
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
  return minutes >= 60 ? "60+ min" : `${minutes} min`;
}

// Run analysis periodically
chrome.alarms.create("checkHistory", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkHistory") {
    console.log("Alarm triggered. Running analysis.");
    analyzeHistory();
  }
});