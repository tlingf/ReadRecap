import { getGroupedArticles } from '../storage/storageManager';

document.addEventListener('DOMContentLoaded', function() {
  const articleList = document.getElementById('articleList');
  articleList.innerHTML = 'Loading...';

  displayArticles();

  const debugButton = document.createElement('button');
  debugButton.textContent = 'Run Debug';
  debugButton.onclick = runDebug;
  document.body.appendChild(debugButton);

  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'Refresh';
  refreshButton.onclick = displayArticles;
  document.body.appendChild(refreshButton);
});

async function displayArticles() {
  const articleList = document.getElementById('articleList');
  try {
    const groupedArticles = await getGroupedArticles();
    console.log("Retrieved data from storage:", groupedArticles);

    if (Object.keys(groupedArticles).length === 0) {
      articleList.innerHTML = '<li>No significant articles found. If you just installed the extension, please wait a few minutes and try again.</li>';
      console.log("No grouped articles found in storage.");
    } else {
      articleList.innerHTML = '';
      Object.entries(groupedArticles).forEach(([date, articles]) => {
        console.log(`Rendering articles for date: ${date}`);
        const dateHeader = document.createElement('h2');
        dateHeader.textContent = date;
        articleList.appendChild(dateHeader);

        const ul = document.createElement('ul');
        articles.forEach(function(article) {
          console.log(`Rendering article: ${article.title}`);
          const li = document.createElement('li');
          li.innerHTML = `<a href="${article.url}" target="_blank">${article.title}</a> (${article.timeSpent || 'Time not available'})`;
          ul.appendChild(li);
        });
        articleList.appendChild(ul);
      });
    }
  } catch (error) {
    console.error("Error displaying articles:", error);
    articleList.innerHTML = '<li>Error loading articles. Please try again later.</li>';
  }
}

function runDebug() {
  chrome.runtime.sendMessage({action: "runDebug"}, response => {
    if (response && response.status === "success") {
      alert('Debug analysis started. Please check the extension logs for details.');
      setTimeout(displayArticles, 2000);
    } else {
      alert('Failed to start debug analysis. Please check the extension logs for details.');
    }
  });
}
