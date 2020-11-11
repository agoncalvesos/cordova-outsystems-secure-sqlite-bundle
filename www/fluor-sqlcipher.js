var originalOpenDatabase = window.sqlitePlugin.openDatabase;

function initializeCipheredDatabase(key, options, successCallback, errorCallback) {
    var newOptions = {};
    for (var prop in options) {
        if (options.hasOwnProperty(prop)) {
            newOptions[prop] = options[prop];
        }
    }
    
    // Ensure `location` is set (it is mandatory now)
    if (newOptions.location === undefined) {
        newOptions.location = "default";
    }
    
    // Set the `key` to the one provided
    newOptions.key = key;

    // Validate the options and call the original openDatabase
    validateDbOptions(newOptions);

    return originalOpenDatabase.call(window.sqlitePlugin, newOptions, successCallback, errorCallback);
};

/**
 * Validates the options passed to a `openDatabase` call are correctly set.
 *
 * @param {Object} options  Options object to be passed to a `openDatabase` call.
 */
function validateDbOptions(options) {
    if (typeof options.key !== 'string' || options.key.length === 0) {
        throw new Error("Attempting to open a database without a valid encryption key.");
    }
}

function openInAppbrowser(successCallback){
    var inAppBrowserRef = cordova.InAppBrowser.open('https://expertsmobile-dev.outsystems.com/FluorAuthSample/Login', '_blank', 'location=no');
       inAppBrowserRef.addEventListener('loadstop', function() {
           inAppBrowserRef.executeScript({code: "\
               setTimeout(function() {\
                 console.log('settimeout run!'); \
                 document.querySelector('.login-btn').addEventListener('click', function(){ \
                   var obj = {key: 'the key'}; \
                   webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(obj)); \
                 });\
               }, 5000)"
           }, function(p1){
                 console.log("after injection", p1)
           });
       });
           /*inAppBrowserRef.executeScript({file: "inappbrowser-scripts.js"}, function(p1){
               console.log("after injection", p1)
           });*/
       /*inAppBrowserRef.executeScript({file: "inappbrowser-scripts.js"}, function(p1){
           console.log("after injection", p1)
       });*/
       inAppBrowserRef.addEventListener('message', function(params){
           inAppBrowserRef.close();
           successCallback(params.data.key);
       });
 }

/**
 * Overrides the sqlitePlugin.openDatabase so it does nothing.
 * We need to override this because OutSystems calls this function in the OnDeviceReady event and we just want to call this after the user submits the login form.
 * A backup of this function was already saved in the originalOpenDatabase property so it can be used later.
 */
window.sqlitePlugin.openDatabase = function(options, successCallback, errorCallback) {
    return openInAppbrowser(function(key){
        return initializeCipheredDatabase(key, options, successCallback, errorCallback)
    });
 };


