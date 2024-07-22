document.addEventListener('DOMContentLoaded', function() {
    displayArticles();
    document.getElementById('openSynopsis').addEventListener('click', openSynopsisPage);
    document.getElementById('runDebug').addEventListener('click', runDebug);
    document.getElementById('refresh').addEventListener('click', displayArticles);
  });
  
  function displayArticles() {
    const articleList = document.getElementById('articleList');
    articleList.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    chrome.storage.local.get(['groupedArticles'], function(result) {
      const groupedArticles = result.groupedArticles || {};
      
      if (Object.keys(groupedArticles).length === 0) {
        articleList.innerHTML = '<div class="alert alert-info">No significant articles found. Try running debug.</div>';
      } else {
        articleList.innerHTML = '';
        Object.entries(groupedArticles).forEach(([date, articles]) => {
          const dateHeader = document.createElement('h2');
          dateHeader.className = 'h6 mt-3 mb-2';
          dateHeader.textContent = date;
          articleList.appendChild(dateHeader);
  
          const ul = document.createElement('ul');
          ul.className = 'list-group';
          articles.forEach(function(article) {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
              <a href="${article.url}" target="_blank" class="text-truncate d-inline-block" style="max-width: 200px;">
                ${article.title}
              </a>
              <small class="text-muted d-block">${article.domain}</small>
              <span class="badge bg-secondary float-end">${article.timeSpent}</span>
            `;
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