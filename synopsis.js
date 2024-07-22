document.addEventListener('DOMContentLoaded', function() {
    displaySynopsis();
    document.getElementById('exportButton').addEventListener('click', exportData);
  });
  
  function displaySynopsis() {
    const synopsisContent = document.getElementById('synopsisContent');
    
    chrome.storage.local.get(['groupedArticles'], function(result) {
      const groupedArticles = result.groupedArticles || {};
      
      if (Object.keys(groupedArticles).length === 0) {
        synopsisContent.innerHTML = 'No significant articles found. Try running debug from the popup.';
      } else {
        synopsisContent.innerHTML = '';
        Object.entries(groupedArticles).forEach(([date, articles]) => {
          const dateHeader = document.createElement('h2');
          dateHeader.textContent = date;
          synopsisContent.appendChild(dateHeader);
  
          articles.forEach(function(article) {
            const articleDiv = document.createElement('div');
            articleDiv.innerHTML = `
              <h3><a href="${article.url}" target="_blank">${article.title}</a> (${article.timeSpent})</h3>
              <textarea id="synopsis-${article.url}" rows="4" cols="50" placeholder="Write your synopsis here..."></textarea>
            `;
            synopsisContent.appendChild(articleDiv);
  
            const textarea = articleDiv.querySelector('textarea');
            textarea.addEventListener('input', () => saveSynopsis(article.url, textarea.value));
            loadSynopsis(article.url, textarea);
          });
        });
      }
    });
  }
  
  function saveSynopsis(url, synopsis) {
    chrome.storage.local.set({[`synopsis_${url}`]: synopsis}, () => {
      console.log('Synopsis saved');
    });
  }
  
  function loadSynopsis(url, textarea) {
    chrome.storage.local.get([`synopsis_${url}`], (result) => {
      if (result[`synopsis_${url}`]) {
        textarea.value = result[`synopsis_${url}`];
      }
    });
  }
  
  function exportData() {
    chrome.storage.local.get(null, (result) => {
      const groupedArticles = result.groupedArticles || {};
      let csvContent = "Date,Title,URL,Time Spent,Synopsis\n";
  
      Object.entries(groupedArticles).forEach(([date, articles]) => {
        articles.forEach(article => {
          const synopsis = result[`synopsis_${article.url}`] || '';
          const row = [
            date,
            article.title.replace(/"/g, '""'),
            article.url,
            article.timeSpent,
            synopsis.replace(/"/g, '""')
          ];
          csvContent += '"' + row.join('","') + '"\n';
        });
      });
  
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "read_recap_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }