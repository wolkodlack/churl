
/**
 * Created by wolkodlack on 1/4/16.
 */


var ChURL = function() {

};

ChURL.prototype = {
    /**
     *
     * @param {String} method
     * @param {String} url
     * @param {String} headers
     * @param {String} data
     */
    doRequest: function(method, url, headers, data, senderType, tabId) {
        console.log('background::CURL::doRequest()', arguments);
        var xlr = new XMLHttpRequest;
        var _this = this;
        xlr.onreadystatechange = this.readResponse.bind(_this, senderType, tabId);
        xlr.onerror = function(err) {
            console.error('Error', err.target.status);
        };

        try {
            xlr.open(method, url, true);
            var b = headers;
            b = b.split("\n");
            for (var c = 0; c < b.length; c++) {
                var d = b[c].split(": ");
                d[1] && xlr.setRequestHeader(d[0], d[1])
            }
            xlr.send(data);
            return true;
        }
        catch (e) {
            // Fill me
            console.log('---exeption', e);

        }
        return false;
    },


    /**
     * TODO:
     * FIXME: see solution HERE:
     * https://developer.chrome.com/extensions/devtools
     * @param tabId
     */
    readResponse: function (senderType, tabId, event) {
        //console.log('background::readResponse()', arguments);
        var resp = {
            'readyState': event.target.readyState
        };

        if (event.target.readyState == 4) {
            if (event.target.status == 0)   throw "Status = 0";


            resp.status  = event.target.status;
            resp.headers = event.target.getAllResponseHeaders();
            resp.responseText = event.target.responseText;



            var headers = {};
            for(i in decodeURIComponent(resp.headers).split("\n")) {
                var header = decodeURIComponent(resp.headers).split("\n")[i].split(":");
                if(header[1]!==undefined) {
                    var x = header.shift();
                    headers[x] = header.join(':').trim();
                }

            }
            resp.headersMap = headers;
            if(resp.headersMap['Content-Type'] === 'application/json') {
                resp.data = JSON.parse(resp.responseText);
            }

            console.log('ChURL got response.status:', resp.status);

            resp.tabId = tabId;

            var messageData = {
                command: 'gotResponce',
                msg: 'CURL::gotResponce',
                data: resp,
                tabId: tabId,
                from: 'ChURL'
            };

            if(senderType === 'devtool') {
                if (typeof page !== 'undefined' && undefined !== page) {
                    page.notifyDevtools(messageData, tabId);
                }

            }
            else if(senderType === 'page') {
                if (typeof page !== 'undefined' && undefined !== page) {
                    page.notifyPage(messageData, tabId);
                }
            }
            else if(senderType === 'panel') {
                if (typeof page !== 'undefined' && undefined !== page) {
                    page.notifyPanel(messageData, tabId);
                }
            }

        }
    },

    init: function() {
        console.log('ChURL lib initiation ...');
    }
};
