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

      // Flatten and sort articles
      const sortedArticles = Object.entries(groupedArticles)
        .flatMap(([date, articles]) => 
          articles.map(article => ({...article, date}))
        )
        .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

      let currentDate = null;

      sortedArticles.forEach(function(article) {
        if (article.date !== currentDate) {
          currentDate = article.date;
          const dateHeader = document.createElement('h2');
          dateHeader.textContent = currentDate;
          dateHeader.className = 'mt-4 mb-3';
          synopsisContent.appendChild(dateHeader);
        }

        const articleDiv = document.createElement('div');
        articleDiv.className = 'row article-row';
        articleDiv.innerHTML = `
          <div class="col-md-6">
            <h3>
              <a href="${article.url}" target="_blank">${article.title}</a> 
              <small class="text-muted">(${article.domain})</small>
            </h3>
            <p>${article.timeSpent}</p>
          </div>
          <div class="col-md-6">
            <textarea id="synopsis-${article.url}" class="form-control" rows="4" placeholder="Write your synopsis here..."></textarea>
          </div>
        `;
        synopsisContent.appendChild(articleDiv);

        const textarea = articleDiv.querySelector('textarea');
        textarea.addEventListener('input', () => saveSynopsis(article.url, textarea.value));
        loadSynopsis(article.url, textarea);
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
    let csvContent = "Date,Title,URL,Domain,Time Spent,Synopsis\n";

    Object.entries(groupedArticles).forEach(([date, articles]) => {
      articles.forEach(article => {
        const synopsis = result[`synopsis_${article.url}`] || '';
        const row = [
          date,
          article.title.replace(/"/g, '""'),
          article.url,
          article.domain,
          article.timeSpent,
          synopsis.replace(/"/g, '""')
        ];
        csvContent += '"' + row.join('","') + '"\n';
      });
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recap_your_reads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}