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

    const aboutLink = document.querySelector('.about-link');
    const originalText = aboutLink.textContent;
    
    aboutLink.addEventListener('click', function(e) {
        e.preventDefault();
        const funnyMessages = [
            "🎬 Made by devs who know what they're doing... probably",
            "🚫 This blocks knowledge. Wait, that's not right...",
            "🧠 Warning: May cause excessive learning",
            "🎓 Sponsored by procrastination & coffee",
            "🦄 Turning YouTube into kNOwTube since... recently!",
            "🎪 No YouTubers harmed in making this",
            "🎮 Achievement unlocked: Found the About button!",
            "🍕 Runs on pizza and good vibes"
        ];
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        this.textContent = randomMessage;
    });
});