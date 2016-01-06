

function gotResponce(data) {
    var responseInfo = {
        status: data.status
    };
    panelLog('panel::gotResponce()', JSON.stringify(responseInfo));
    readResponse(data);
}

//
//document.documentElement.onclick = function() {
//    // No need to check for the existence of `respond`, because
//    // the panel can only be clicked when it's visible...
//
//    // WW comment: implementation can be found in devtools.js
//    window.respond('Another stupid example!');
//    window.Console.warn('check me');
//
//    var extension_url = 'chrome-extension://'+location.host+'/index.html';
//    chrome.tabs.create({url: extension_url});
//};

function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

// ------------------------------------------------------------------------

var statusCodes = [];
statusCodes[100] = "Continue";
statusCodes[101] = "Switching Protocols";
statusCodes[200] = "OK";
statusCodes[201] = "Created";
statusCodes[202] = "Accepted";
statusCodes[203] = "Non-Authoritative Information";
statusCodes[204] = "No Content";
statusCodes[205] = "Reset Content";
statusCodes[206] = "Partial Content";
statusCodes[300] = "Multiple Choices";
statusCodes[301] = "Moved Permanently";
statusCodes[302] = "Found";
statusCodes[303] = "See Other";
statusCodes[304] = "Not Modified";
statusCodes[305] = "Use Proxy";
statusCodes[307] = "Temporary Redirect";
statusCodes[400] = "Bad Request";
statusCodes[401] = "Unauthorized";
statusCodes[402] = "Payment Required";
statusCodes[403] = "Forbidden";
statusCodes[404] = "Not Found";
statusCodes[405] = "Method Not Allowed";
statusCodes[406] = "Not Acceptable";
statusCodes[407] = "Proxy Authentication Required";
statusCodes[408] = "Request Time-out";
statusCodes[409] = "Conflict";
statusCodes[410] = "Gone";
statusCodes[411] = "Length Required";
statusCodes[412] = "Precondition Failed";
statusCodes[413] = "Request Entity Too Large";
statusCodes[414] = "Request-URI Too Long";
statusCodes[415] = "Unsupported Media Type";
statusCodes[416] = "Requested range not satisfiable";
statusCodes[417] = "Expectation Failed";
statusCodes[500] = "Internal Server Error";
statusCodes[501] = "Not Implemented";
statusCodes[502] = "Bad Gateway";
statusCodes[503] = "Service Unavailable";
statusCodes[504] = "Gateway Time-out";
statusCodes[505] = "HTTP Version not supported";


function grow(a) {
    var b = document.getElementById(a), c = b.scrollHeight;
    if (c == 0 || $("#" + a).val() == "")c = 20;
    b.style.height = c + "px"
}

function setStatus(status) {
    $("#responseStatus").html(status);
}

function clearFields() {
    $("#response").css("display", "");
    $("#loader").css("display", "");
    $("#responsePrint").css("display", "none");
    setStatus("");
    $("#responseHeaders").val("");
    $("#codeData").text("");
    $("#responseHeaders").height(20);
    $("#headers").height(20);
    $("#postputdata").height(20);
    $("#respHeaders").css("display", "none");
    $("#respData").css("display", "none")
}

function panelLog(msg, data) {
    if(undefined === data) {
        $('#responseLog').append(msg + '<br/>');
    }
    else {
        $('#responseLog').append(msg + data + '<br/>');
    }

}

function contentConsoleLog(msg, data) {
    var evalSrc = "console.log('" + msg + "')";
    if(data !== undefined) {
        evalSrc = "console.log('" + msg + "', " + JSON.stringify(data) +")";
    }

    if(chrome.devtools) {
        chrome.devtools.inspectedWindow.eval(
            evalSrc,
            function(result, isException) { }
        );
    }
    else {
        console.log(msg, data);
    }
}

function sendRequest() {
    var url = $("#url").val();

    //clearFields();
    if (url != "") {
        var method = $("input[name=method][type=radio]:checked").val();
        var initialPage = $("input[name=initialPage][type=radio]:checked").val();

        var postPutData = '';

        // If post/put data needed
        if(jQuery.inArray(method, ["post", "put"]) > -1 )
            postPutData = $("#postputdata").val();

        var msgData = {url: url, data: postPutData, method: method, headers: $("#headers").val()};
        var msg = 'panel::sendRequest('+ initialPage + ')';
        panelLog(msg +  url );
        contentConsoleLog(msg + ' <'+ url+ '>', msgData );

        // Executing function from devtools.js
        if(undefined !== window.doRequest) {
            doRequest(
                initialPage,
                method,
                url,
                $("#headers").val(),
                postPutData
            );
        }
        else {
            page.doLocalRequest(
                initialPage,
                method,
                url,
                $("#headers").val(),
                postPutData
            );
        }

    }
    else {
        setStatus('<span style="color:#FF0000">bad_request</span>');

        $("#respHeaders").css("display", "none");
        $("#respData").css("display", "none");
        $("#loader").css("display", "none");
        $("#responsePrint").css("display", "")
    }
}




function readResponse(resp) {
    contentConsoleLog('readResponse', resp);

    grow("headers");
    grow("postputdata");


    try {
        if (resp.readyState == 4) {
            if (resp.status == 0)   throw "Status = 0";

            setStatus(resp.status + " " + statusCodes[resp.status]);

            $("#responseHeaders").val(jQuery.trim(resp.headers));


            var a = /X-Debug-URL: (.*)/i.exec($("#responseHeaders").val());
            if (a) {
                $("#debugLink").attr("href", a[1]).html(a[1]);
                $("#debugLinks").css("display", "")
            }
            $("#codeData").html(
                jQuery
                    .trim(resp.responseText)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g,"&gt;")
            );
            $("#respHeaders").css("display", "");
            $("#respData").css("display", "");
            $("#loader").css("display", "none");
            $("#responsePrint").css("display", "");
            $("#response").css("display", "");
            grow("responseHeaders");
            ChiliBook.automatic = false;
            contentConsoleLog('chili', ChiliBook);
            //$.chili.options.automatic.active = false;
            //$.chili.options.decoration.lineNumbers = false;
            $("#codeData").chili();
        }
    } catch (e) {
        contentConsoleLog('Exception', e.name + "::" + e.message);
        setStatus("No response.");
        $("#respHeaders").css("display", "none");
        $("#respData").css("display", "none");
        $("#loader").css("display", "none");
        $("#responsePrint").css("display", "")
    }
}

function toggleData() {
    jQuery.inArray($("input[type=radio]:checked").val(), ["post", "put"]) > -1 ? $("#data").css("display", "") : $("#data").css("display", "none")
}






//function lang() {
//    $("._msg_").each(function () {
//        var a = $(this).html();
//        $(this).html(chrome.i18n.getMessage(a))
//    });
//    $("._msg_val_").each(function () {
//        var a = $(this).val();
//        $(this).val(chrome.i18n.getMessage(a))
//    })
//}


var ChURLPage = function () {
    this.init();
};

ChURLPage.prototype = {
    tabId: undefined,

    doLocalRequest: function(initiator, method, url, headers, data) {
            contentConsoleLog('Sending message from page');
            var requestData = {
                initiator: initiator,
                senderType: 'page',
                tabId: this.tabId,
                command: "sendRequest",

                method: method,
                url: url,
                headers: headers,
                data: data
            };
            //chrome.runtime.sendMessage(dataRec);

            var editorExtensionId = "miefnlfpbpkndiegjaomaikeplobbofo";

            chrome.runtime.sendMessage(requestData, function(response) {
                contentConsoleLog('response', response);
                if('ok' === response) {
                    contentConsoleLog('send ok');

                }
            });

            // Make a simple request:
            //chrome.runtime.sendMessage(editorExtensionId, dataRec,
            //    function(response) {
            //        console.log('response', response);
            //        if('ok' === response) {
            //            contentConsoleLog('send ok');
            //
            //        }
            //
            //    });

    },

    initPort: function() {
        if(chrome.extension) {
            var panelLocation = 'page';
            if(undefined !== chrome.devtools){
                panelLocation = 'panel.' + this.tabId;
            }

            var port = chrome.extension.connect({name: panelLocation});

            // keep track of the port and tab id on the background by
            // sending the inspected windows tab id
            port.postMessage(['connect', '??WTF??']);
            var onMessage = function (data) {
                contentConsoleLog('panel::onMessage()', data);
                if(data.command === 'gotResponce') {
                    gotResponce(data.data);
                }
                if(chrome.devtools && data.tabId === chrome.devtools.inspectedWindow.tabId) {


                }
            };
            port.onMessage.addListener(onMessage);
        }
    },

    init: function() {
        if(undefined !== chrome.tabs) {
            chrome.tabs.getCurrent(function(tab) {
                contentConsoleLog('tabs.gutCurrent()', arguments);
                this.tabId = tab.id;
                this.initPort();
            }.bind(this));
        }
        else if(undefined !== chrome.devtools.inspectedWindow){
            this.tabId = chrome.devtools.inspectedWindow.tabId;
            this.initPort();
        }

        this.senderType = (undefined !== window.doRequest)?'devtools':'page';
        if(this.senderType==='page') {
            // TODO: Content request is not available. No content script are given
            $('label[for=content]').css('display', 'none');
        }


        contentConsoleLog('init churl page..');
        $("#url").width($("#purl").width() - 80 - 30);
        $("#headers").width($("#pheaders").width() - 80 - 30);
        $("#postputdata").width($("#data").width() - 80 - 30);
        $("#responseHeaders").width($("#respHeaders").width() - 80 - 30);
        $("#responseData").width($("#respHeaders").width() - 80 - 30);
        $("#response").css("display", "none");

        $("#loader").css("display", "");
        $("#responsePrint").css("display", "none");
        $("#sep").css("display", "none");
        $("#data").css("display", "none");
        $("#responseStatus").html("");
        $("#respHeaders").css("display",
            "none");
        $("#respData").css("display", "none");
        $("#submit").click(function () {
            sendRequest();
            return false
        });
        $("#reset").click(function () {
            location.reload()
        });
        $(".radio").change(function () {
            toggleData()
        });
        $(".radio").focus(function () {
            toggleData()
        });

    }
};

var page;
$(document).ready(function () {
//    lang();

    page = new ChURLPage();

    $(":input:first").focus();
});
