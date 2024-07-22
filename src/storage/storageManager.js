export async function saveGroupedArticles(groupedArticles) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ groupedArticles }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

export async function getGroupedArticles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['groupedArticles'], (result) => {
      resolve(result.groupedArticles || {});
    });
  });
}
