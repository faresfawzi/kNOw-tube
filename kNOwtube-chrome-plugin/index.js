function getVideoIdFromUrl(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.main-button').addEventListener('click', function() {
        (async () => {
            const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
            console.log(tab.url);
            chrome.tabs.create({ url: `http://localhost:5173/?v=${getVideoIdFromUrl(tab.url)}` });
        })();
    });
});