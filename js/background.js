


const tab_log = function (json_args) {
    // decodeURI
    var args = JSON.parse(unescape(json_args));
    //console.log('args', {args: args} );
    console[args[0]].apply(console, Array.prototype.slice.call(args, 1));
};


var Background = function() {
    this.init();
};

Background.prototype = {
    runtimeOnMessage: function(message, sender, sendResponse) {
        //console.log('background::runtime::onMessage()', message);
        var msg = '';
        if(sender.tab ) {
            msg = "from a content script:" + sender.tab.url;
        }
        else
            msg = "from the extension";



        if(message.command === 'log') {
            console.log(message.from + '::' +message.msg, message);
        }
        else if(message.command === 'sendRequest') {
            var curl = new CURL();
            curl.doRequest(
                message.method,
                message.url,
                message.headers,
                message.data,
                message.tabId
            );
            sendResponse('Request is sent');
        }
        else {
            this.onMessage(message);
            //sendResponse('Request is done');
        }

    },

    /**
     * Long-Lived connection Messaging !!!
     *
     */
    activeListeners: {},
    portOnMessage: function(port, message) {
        console.log(message);
        if (message[0] === 'connect') {
            // get the tab id
            var tabId = message[1];

            // save the reference to the port
            this.activeListeners[tabId] = port;

            // make sure we clean up after disconnecting (closing the panel)
            this.activeListeners[tabId].onDisconnect.addListener(function() {
                delete this.activeListeners[tabId];
            }.bind(this));
        }
        else {
            // console.log('background::port::onMessage()', message);
            this.onMessage(message);
        }
    },

    onMessage: function(data) {
        console.log('background::onMessage()', data);
        // Request a tab for sending needed information

    },

    sendToContent: function(data) {
        chrome.tabs.query({'active': true,'currentWindow': true},
            function (tabs) {
                console.log('background::sendToContent()', tabs);
                // Send message to content script
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, data);
                }
            }
        );

    },

    ports: [],

    // Function to send a message to all devtool.html views:
    notifyDevtools: function(data) {
        console.log('background::notifyDevtools()', 'port count: ' + this.ports.length);
        Object.keys(this.ports).forEach(function(portId_) {
            console.log('backgground::Sending to '+ this.ports[portId_].name);
            this.ports[portId_].postMessage(data);
        }.bind(this));
    },


    init: function() {
        chrome.runtime.onMessage.addListener( this.runtimeOnMessage.bind(this) );

        var onPortConnect = function(port) {
            console.log('PortConnection{'+ port.name +'}', port);

            // Collecting Ports
            this.ports.push(port);
            // Remove port when destroyed (eg when devtools instance is closed)
            port.onDisconnect.addListener(function() {
                var i = this.ports.indexOf(port);
                if (i !== -1) this.ports.splice(i, 1);
            }.bind(this));

            port.onMessage.addListener(this.portOnMessage.bind(this, port));
        };
        chrome.extension.onConnect.addListener(onPortConnect.bind(this));
    }
};


var page = new Background();

page.notifyDevtools('notifyDevtools(-- test message from background --)');










