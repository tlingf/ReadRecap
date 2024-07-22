document.addEventListener('DOMContentLoaded', function() {
    displayArticles();
    document.getElementById('openSynopsis').addEventListener('click', openSynopsisPage);
    document.getElementById('runDebug').addEventListener('click', runDebug);
    document.getElementById('refresh').addEventListener('click', displayArticles);
  });
  
  function displayArticles() {
    const articleList = document.getElementById('articleList');
    articleList.innerHTML = 'Loading...';
    
    chrome.storage.local.get(['groupedArticles'], function(result) {
      const groupedArticles = result.groupedArticles || {};
      
      if (Object.keys(groupedArticles).length === 0) {
        articleList.innerHTML = 'No significant articles found. Try running debug.';
      } else {
        articleList.innerHTML = '';
        Object.entries(groupedArticles).forEach(([date, articles]) => {
          const dateHeader = document.createElement('h2');
          dateHeader.textContent = date;
          articleList.appendChild(dateHeader);
  
          const ul = document.createElement('ul');
          articles.forEach(function(article) {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${article.url}" target="_blank">${article.title}</a> (${article.timeSpent})`;
            ul.appendChild(li);
          });
          articleList.appendChild(ul);
        });
      }
    });
  }
  
  function openSynopsisPage() {
    chrome.tabs.create({ url: 'synopsis.html' });
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