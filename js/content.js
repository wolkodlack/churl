

console.log('content::Loaded','content.js');

chrome.runtime.onMessage.addListener(function (message, sender) {
    console.log('content::onMessage()', message, sender);
});

