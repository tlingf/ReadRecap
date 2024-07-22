import { isArticle, formatTime } from '../utils/articleUtils';
import { saveGroupedArticles } from '../storage/storageManager';

const MINIMUM_VISITS = 2;
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
  console.log("Starting history analysis.");
  const oneWeekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
  
  try {
    const historyItems = await chrome.history.search({
      text: '',
      startTime: oneWeekAgo,
      maxResults: 1000
    });

    console.log(`Found ${historyItems.length} history items.`);
    const significantArticles = await processHistoryItems(historyItems);

    // Sort articles by last visit date (most recent first)
    significantArticles.sort((a, b) => b.lastVisit - a.lastVisit);

    // Group articles by date
    const groupedArticles = groupArticlesByDate(significantArticles);

    console.log(`Analysis complete. Found ${significantArticles.length} significant articles.`);
    await saveGroupedArticles(groupedArticles);
    console.log("Saved grouped articles to storage.");
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
      console.log(`Analyzing article: ${item.url}, Visit count: ${item.visitCount}`);
      
      let timeSpent = "";
      if (item.visitCount >= MINIMUM_VISITS) {
        timeSpent = "Multiple visits";
      } else {
        const visits = await chrome.history.getVisits({url: item.url});
        
        if (visits.length > 1) {
          const calculatedTime = visits[visits.length - 1].visitTime - visits[visits.length - 2].visitTime;
          console.log(`Time spent on ${item.url}: ${calculatedTime}ms`);
          if (calculatedTime >= MINIMUM_TIME) {
            timeSpent = formatTime(Math.round(calculatedTime / 60000));
          }
        }
      }

      if (timeSpent) {
        significantArticles.push({
          url: item.url,
          title: item.title,
          visits: item.visitCount,
          lastVisit: new Date(item.lastVisitTime),
          timeSpent: timeSpent
        });
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

// Run analysis periodically
chrome.alarms.create("checkHistory", { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkHistory") {
    console.log("Alarm triggered. Running analysis.");
    analyzeHistory();
  }
});
