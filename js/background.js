


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
            var data = message.data;
            console.log(message.from + '::' +message.msg, data);

        }
        else if('gotResponce' == message.command) {
            console.info('Forwarding to devtools ...', message);
            this.notifyDevtools(message, message.tabId);
        }
        else if(message.initiator === 'content') {
            console.log('Forwarding to content script...');
            this.sendToContent(message);
        }
        else if(message.command === 'sendRequest' && message.initiator === 'background') {
            console.log('backgound::churl.doRequest()', sender, message);
            var churl = new ChURL();
            churl.doRequest(
                message.method,
                message.url,
                message.headers,
                message.data,
                message.senderType,
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
                console.log('TABS: ', tabs);
                // Send message to content script
                if (tabs[0]) {
                    console.log('background::sendToContent()', data);
                    chrome.tabs.sendMessage(tabs[0].id, data);
                }
            }
        );

    },

    ports: [],

    // Function to send a message to all devtool.html views:
    notifyDevtools: function(data, tabId) {
        var onPort = function(portId_) {
            console.log('port[' + this.ports[portId_].name + ']', this.ports[portId_]);
            if(
                this.ports[portId_].name === ('devtools.' + tabId)
            ) {
                console.log('backgground::Sending to (:' +portId_+ ') '+ this.ports[portId_].name);
                this.ports[portId_].postMessage(data);
            }
        }.bind(this);
        Object.keys(this.ports).forEach(onPort);
    },

    // Function to send a message to all devtool.html views:
    notifyPage: function(data, tabId) {
        console.log('background::notifyPage() tabId: ', tabId);
        var onPort = function(portId_) {
            //console.log('port[' + this.ports[portId_].name + ']', this.ports[portId_]);
            if(
                this.ports[portId_].sender.tab !== undefined
                &&
                this.ports[portId_].sender.tab.id === tabId
                &&
                this.ports[portId_].name === 'page'
            ) {
                console.log('background::Sending to (:' +portId_+ ') '+ this.ports[portId_].name);
                this.ports[portId_].postMessage(data);
            }


        }.bind(this);
        Object.keys(this.ports).forEach(onPort);
    },

    // TODO: To be emplemented
    notifyPanel: function(data, tabId) {

    },

    runtimeOnMessageExternal: function(request, sender, sendResponse) {
        console.log('background::runtimeOnMessageExternal()', arguments);
        if (sender.url == 'http://<blacklisted.here>')
            return;  // don't allow this web page access


        if(request.initiator === 'content') {
            console.log('Forwarding to content script...');
            this.sendToContent(request);
        }
        else if(request.command === 'sendRequest' && request.initiator === 'background') {
            var churl = new ChURL();
            churl.doRequest(
                request.method,
                request.url,
                request.headers,
                request.data,
                request.tabId
            );
            sendResponse('ok');
        }

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


        chrome.runtime.onMessageExternal.addListener(this.runtimeOnMessageExternal.bind(this));
    }
};


var page = new Background();









