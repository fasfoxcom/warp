'use strict';

function Utils() {
}

//TODO_X: remove the same from ZoneUserData
Utils.makeUserStr = function(login,name) {
    return  name + " ["+login+"]";
};

Utils.makeUserStrRev = function (str) {
    const regEx = /(.*) \[([^[]*)\]$/;
    var login = str.match(regEx);

    if (login !== null)
        return [login[2],login[1]];

    throw Error("Unknown login");
};

Utils.formatError = function(status, response) {

    if (status === 200)
        throw Error("Status 200 is not an error");

    if (response instanceof Object && 'code' in response) {
        if (TR.has("errorCode."+response.code)) {
            return TR("errorCode."+response.code,{code: response.code});
        }
        else if (status == 403) {
            return TR("errorCode.Forbidden (%{code})",{code: response.code});
        }
        else {
            return TR("errorCode.Other error. (status=%{status} code=%{code})",{status: status, code: response.code});
        }
    }
    else {
        return TR("errorCode.Other error. (status=%{status})",{status: status});
    }

}

Utils.xhr = function(url,data,toastOnSuccess = true, errorOnFailure = true, responseType = "json", requestType = "POST") {
    return new Promise(function(resolve, reject) {

        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function(e) {

            if (this.status == 200 && this.response !== null) {
                resolve({status:this.status, response: this.response, requestObject: this});
                if (toastOnSuccess)
                    M.toast({text: TR('Action successfull.')});
            }
            else {
                let errorMsg = Utils.formatError(this.status,this.response);
                reject({status:this.status, response: this.response, requestObject: this, errorMsg: errorMsg});
                if (errorOnFailure) {
                    WarpModal.getInstance().open(TR("Error"),errorMsg);
                }
            }
        });

        xhr.open(requestType, url);
        xhr.responseType = responseType;

        if (!(data instanceof FormData)) {
            // we try to jsonify it
            data = JSON.stringify(data);
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        }

        xhr.send(data);
    });
}

Utils.Listeners = function(types, async = true) {

    this.async = async;

    this.listeners = {};
    for (let t of types)
        this.listeners[t] = new Set();

    this.on = function(type,listener) {
        if (type in this.listeners && typeof(listener) === 'function') {
            this.listeners[type].add(listener);
        }
    };

    this.off = function(type,listener = null) {
        if (!type in this.listeners)
            return;

        if (listener == null)
            this.listeners[type].clear();
        else
            this.listeners[type].delete(listener);
    }

    this.fireEvent = function(type,_this,param) {

        if (this.async) {
            for (let i of this.listeners[type]) {
                setTimeout(i.bind(_this),0,param);
            }
        }
        else {
            for (let i of this.listeners[type]) {
                i.call(this,param);
            }
        }
    }

}