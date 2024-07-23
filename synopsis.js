let allArticles = [];
let displayedArticles = 0;
const articlesPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
  setupDateInputs();
  document.getElementById('exportButton').addEventListener('click', exportData);
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('loadMoreBtn').addEventListener('click', loadMoreArticles);
  loadAndDisplaySynopsis();
});

function setupDateInputs() {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  document.getElementById('startDate').valueAsDate = oneWeekAgo;
  document.getElementById('endDate').valueAsDate = today;
}

function applyFilters() {
  displayedArticles = 0;
  loadAndDisplaySynopsis();
}

function loadAndDisplaySynopsis() {
  const minTime = document.getElementById('minTimeInput').value * 60 * 1000; // Convert to milliseconds
  const startDate = new Date(document.getElementById('startDate').value).getTime();
  const endDate = new Date(document.getElementById('endDate').value).getTime() + 86400000; // Add one day to include the end date

  chrome.runtime.sendMessage({
    action: "getFilteredArticles",
    minTime: minTime,
    startDate: startDate,
    endDate: endDate
  }, function(response) {
    allArticles = response.articles;
    updateStats(response.stats);
    displaySynopsis(true);
  });
}

function updateStats(stats) {
  document.getElementById('articleCount').textContent = `Articles found: ${stats.articleCount}`;
  document.getElementById('timePeriod').textContent = `Time period: ${new Date(stats.startDate).toLocaleDateString()} - ${new Date(stats.endDate).toLocaleDateString()}`;
  document.getElementById('recapCount').textContent = `Recaps written: ${stats.recapCount}`;
}

function displaySynopsis(clearExisting = false) {
  const synopsisContent = document.getElementById('synopsisContent');
  if (clearExisting) {
    synopsisContent.innerHTML = '';
    displayedArticles = 0;
  }
  
  const articlesToDisplay = allArticles.slice(displayedArticles, displayedArticles + articlesPerPage);
  displayedArticles += articlesToDisplay.length;

  let currentMonth = null;
  const seenUrls = new Set();

  articlesToDisplay.forEach(function(article) {
    if (seenUrls.has(article.url)) {
      return; // Skip duplicate URLs
    }
    seenUrls.add(article.url);

    const articleDate = new Date(article.lastVisit);
    const articleMonth = articleDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    if (articleMonth !== currentMonth) {
      currentMonth = articleMonth;
      const monthHeader = document.createElement('h2');
      monthHeader.textContent = currentMonth;
      monthHeader.className = 'month-header';
      synopsisContent.appendChild(monthHeader);
    }

    const articleDiv = document.createElement('div');
    articleDiv.className = 'row article-row align-items-center';
    articleDiv.innerHTML = `
      <div class="col-md-6">
          <a href="${article.url}" target="_blank">${article.title}</a>
        <p class="mb-1"><small class="text-muted">${article.domain}</small></p>
        <p class="mb-0">
          <span class="badge bg-secondary">${article.timeSpent}</span>
          <small class="text-muted ml-2">Last read: ${articleDate.toLocaleString()}</small>
        </p>
      </div>
      <div class="col-md-6">
        <textarea id="synopsis-${article.url}" class="form-control" rows="3" placeholder="Write your synopsis here..."></textarea>
      </div>
    `;
    synopsisContent.appendChild(articleDiv);

    const textarea = articleDiv.querySelector('textarea');
    textarea.addEventListener('input', () => saveSynopsis(article.url, textarea.value));
    loadSynopsis(article.url, textarea);
  });

  document.getElementById('loadMoreBtn').disabled = displayedArticles >= allArticles.length;
}

function loadMoreArticles() {
  displaySynopsis(false);
}

function saveSynopsis(url, synopsis) {
  chrome.storage.local.set({[`synopsis_${url}`]: synopsis}, () => {
    console.log('Synopsis saved');
    updateRecapCount();
  });
}

function loadSynopsis(url, textarea) {
  chrome.storage.local.get([`synopsis_${url}`], (result) => {
    if (result[`synopsis_${url}`]) {
      textarea.value = result[`synopsis_${url}`];
    }
  });
}

function updateRecapCount() {
  chrome.storage.local.get(null, (result) => {
    const recapCount = Object.keys(result).filter(key => key.startsWith('synopsis_') && result[key].trim() !== '').length;
    document.getElementById('recapCount').textContent = `Recaps written: ${recapCount}`;
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