

//var port = chrome.extension.connect({name: "devtools"});
//
//
//function sendToBackground(data) {
//    var messageData = {
//        assigner: "devtool::port::postMessage()",
//        tabId:  chrome.devtools.inspectedWindow.tabId,
//        data: data
//    };
//    port.postMessage(messageData);
//}
//var onDevtoolMessage = function(data) {
//    _log('devtools::onDevtoolMessage()', data);
//
//};
//port.onMessage.addListener(onDevtoolMessage);


// ---------------------------------------------

var _log = function(msg, data) {
    // SEND MESSAGE
    var message = {command: "log", msg: msg, from: 'devtools', data: data};
    chrome.runtime.sendMessage(message, function(response) {
        //console.log(response.farewell);
    });

};


var onRuntimeMessage = function(request, sender, sendResponse) {
    _log('devtools::onRuntimeMessage()', arguments);
};
chrome.runtime.onMessage.addListener(onRuntimeMessage);



/**
 *
 * @param {Object} extensionPanel
 */
var devPanelCallback = function (extensionPanel) {
    var Console = Console;
    var _window; // Going to hold the reference to panel.html's `window`

    var sendCommand = function(command, data) {
        //_log('executing command['+ command + ']', data);
        if( chrome.devtools.inspectedWindow.tabId === data.tabId) {
            _window[command](data);
        }
        else {
            _log('wrong TAB',
                {
                    current: data.tabId,
                    target: chrome.devtools.inspectedWindow.tabId
                }
            );
        }

    };

    var dataPool = [];
    var port = chrome.extension.connect({name: "devtools"});

    port.onMessage.addListener(function (data) {
        _log('devtools::onDevtoolMessage()', data);

        // Write information to the panel, if exists.
        // If we don't have a panel reference (yet), queue the data.
        if (_window) {
            var command = data.command;
            sendCommand(command, data.data);
        }
        else {
            dataPool.push('###'.data);
        }
    });

    //extensionPanel.createStatusBarButton('../images/icon16.png', 'tooltip text', true);
    var onPanelShown = function (panelWindow) {
        extensionPanel.onShown.removeListener(onPanelShown); // Run once only
        _window = panelWindow;

        // Release queued data
        var data;
        while (data = dataPool.shift()) {
            var command = data.command;
            sendCommand(command, data.data);
        }

        // Just to show that it's easy to talk to pass a message back:
        _window.respond = function (msg) {
            port.postMessage(msg);
        };

        _window.doRequest = function (initiator, method, url, headers, data) {
            _log('_window.doRequest', arguments);

            var requestData = {
                initiator: initiator,
                command: "sendRequest",

                method: method,
                url: url,
                headers: headers,
                data: data,
                tabId: chrome.devtools.inspectedWindow.tabId

            };
            _log('doRequest()', requestData);
            //port.postMessage('request is DONE');

            //chrome.extension.sendRequest(requestData);
            chrome.runtime.sendMessage(requestData, function(response) {
                _log(response);
            });
        };

    };

    extensionPanel.onShown.addListener(onPanelShown.bind(Console));
};

//// Panel for dev-tools -------------------------------------------------------------------------------------------
if(chrome.devtools.inspectedWindow.tabId !== undefined ) {
    _log('creating Requester panel for tabId=' + chrome.devtools.inspectedWindow.tabId);
    chrome.devtools.panels.create(
        "Requester",
        "../images/devtool_icon.png",
        "../html/panel.html",
        devPanelCallback
    );
}




