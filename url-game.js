// url parameters -> emails, state, leave, check
var UrlGame = function() {
    // put url paremeters into urlParams
    this.urlParams = {};
    // window.addEventListener('popstate', function() {
        // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript?page=1&tab=votes#tab-top
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        while (match = search.exec(query)) {
            this.urlParams[decode(match[1])] = decode(match[2]);
        }
    // });
};

UrlGame.prototype.getGameStage = function() {
    // new-game, collecting-players, active-game
    if (this.urlParams.state) {
        if (this.urlParams.check) {
            return 'active-game';
        } else {
            return 'collecting-players';
        }
    }
    return 'new-game';
};

UrlGame.prototype.isUrlValid = function(secret) {
    var moves = this.urlParams.state.split(','),
        hx_to_check = [];
    for (var i = 0; i < moves.length - 1; i++) {
        hx_to_check.push(moves[i]);
    }
    return this.urlParams.check === sha256(secret + hx_to_check.join())
};

UrlGame.prototype.generateURL = function(secret, state, emails) {
    var winloc = window.location;
    var baseURL = winloc.protocol + "//" + winloc.host + "/" + winloc.pathname;
    var url = baseURL + '?emails=' + encodeURI(emails) + '&state=' + encodeURI(state) + '&leave=' + encodeURI(sha256(secret + state));
    if (this.urlParams.leave) {
        url += '&check=' + encodeURI(this.urlParams.leave);
    }
    return url;
};
