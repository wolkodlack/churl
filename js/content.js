

console.log('content::Loaded','content.js');

var Content = function() {
    this.init();
};

Content.prototype = {
    runtimeOnMessage: function (message, sender, sendResponse) {
        console.log('content::onMessage()', message, sender);

        if(message.command === 'log') {
            console.log(message.from + '::' +message.msg, message);

        }
        else if(message.command === 'sendRequest') {
            var churl = new ChURL();
            churl.doRequest(
                message.method,
                message.url,
                message.headers,
                message.data,
                message.tabId
            );
            sendResponse('Request is sent');
        }
        else {
            //this.onMessage(message);
            //sendResponse('Request is done');
        }
    },

    notifyDevtools: function(data) {
        console.log('Content::notifyDevtools()', data);
        chrome.runtime.sendMessage(data);

    },

    init: function() {
        console.log('Content::init()');
        chrome.runtime.onMessage.addListener(this.runtimeOnMessage.bind(this));
    }

};

var page = new Content();