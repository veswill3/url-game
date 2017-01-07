var urlGame = new UrlGame(),
    gameStage = null,
    gameStep = 1,
    emails = null,
    secret = null,
    gameboard = null;

var GameboardHandler = function(state) {
    var player = 1;
    var board = {}; // to keep track of who moved where
    var boardElements = {}; // to keep track of what element to change
    var pendingMove = null;
    var moves = (state) ? state : [];
    var winner = null;
    // use touch events if they're supported, otherwise use mouse events
    var down = ('createTouch' in document) ? 'touchstart' : 'mousedown';

    var makeMove = function(c, isPend) {
        var elems = document.querySelectorAll('.winning-tile');
        for (var i = 0; i < elems.length; i++) {
            elems[i].classList.remove('winning-tile');
        }
        if (pendingMove) {
            moves.pop();
            delete board[pendingMove];
            boardElements[pendingMove].classList.remove('player-' + player);
            pendingMove = null;
        }
        var r = 0;
        while (board[r+','+c]) {
            r++;
        }
        if (r >= 6) {
            return;
        }
        board[r+','+c] = player;
        boardElements[r+','+c].classList.add('player-' + player);
        if (isPend) {
            pendingMove = r+','+c;
            moves.push(c);
        }

        // check for win
        var dirs = [[1,0],[1,1],[0,1],[1,-1]];
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            // Shift back along dir to check each possible position
            // 4 shifts: -3 @---, -2 -@--, -1 --@-, no-shift ---@
            for (var shift = -3; shift <= 0; shift++) {
                var chk = []; // positions to check
                // check the 4 spaces along dir
                for (var j = 0; j <= 3; j++) {
                    chk.push([
                            r + (dir[0]*shift) + (j*dir[0]),
                            c + (dir[1]*shift) + (j*dir[1])
                        ]);
                }
                if (board[chk[0]] === board[chk[1]] &&
                    board[chk[1]] === board[chk[2]] &&
                    board[chk[2]] === board[chk[3]]) {
                    chk.forEach(function(x) {
                        void boardElements[x].offsetWidth; // make sure the animation restarts
                        boardElements[x].classList.add('winning-tile');
                    });
                    winner = player;
                }
            }
        }
        if (isPend) {
            document.getElementById('sendmove').disabled = false;
        }
    };

    var colHover = function(c) {
        boardElements['head-'+c].classList.add('player-' + player);
    };

    var colBlur = function(c) {
        boardElements['head-'+c].classList.remove('player-1', 'player-2');
    };

    this.getState = function() {
        return moves;
    };

    // build a table to show the game board
    var table = document.createElement('table');
    for (var r = -1; r < 6; r++) {
        var tr = document.createElement('tr');
        if (r === -1) {
            tr.classList.add('header');
        } else {
            tr.classList.add('playable-row');
        }
        for (var c = 0; c < 7; c++) {
            var td = document.createElement('td');
            td.innerHTML = '<div></div>';
            // add event listeners
            (function(colIndex) {
                td.addEventListener(down       , function() { makeMove(colIndex, true); }, false);
                td.addEventListener('mouseover', function() { colHover(colIndex); }, false);
                td.addEventListener('mouseout' , function() { colBlur(colIndex);  }, false);
            })(c);
            var index;
            if (r === -1) {
                index = 'head-' + c; // header row
            } else {
                index  = (5-r) + ',' + c; // flip the board upsidown
            }
            boardElements[index] = td;
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    // add the table to the page
    document.getElementById('gameboard').appendChild(table);
    // replay the moves history
    moves.forEach(function(c, m) {
        player = m % 2 ? 2 : 1; // alternate the player
        makeMove(+c);
    }, this);
    player = moves.length % 2 ? 2 : 1;
    // if there is a winner, display the message
    if (winner) {
        showComponents(gameStage, 3);
        document.getElementById('gameboard').classList.add('disabled');
    }
};

function showComponents(stage, step) {
    var gameStageComponents = document.querySelectorAll('[data-' + stage + ']');
    for (var i = 0; i < gameStageComponents.length; i++) {
        var cmp = gameStageComponents[i];
        if (cmp.dataset.gameStep.indexOf(step) > -1) {
            cmp.classList.remove('hidden');
        } else {
            cmp.classList.add('hidden');
        }
    }
}

// email-address-collection
function saveEmails() {
    var form = document.getElementById('email-address-collection-form');
    var editLink = document.getElementById('edit-emails');
    emails = [document.getElementById('email1').value, document.getElementById('email2').value]
    editLink.innerHTML = emails[0] + ' vs ' + emails[1] + ' - Click here to edit.';
    form.style.display = 'none';
    editLink.onclick = function() {
        emails = null;
        editLink.style.display = 'none';
        form.style.display = 'block';
        return false; // stop reload
    }
    editLink.style.display = 'block';
    moveToNextStep();
}

// create-a-secret
function validateNewSecret() {
    var newSecret = document.getElementById('secret-create'),
        confirmSecret = document.getElementById('secret-confirm');
    if (newSecret.value != confirmSecret.value) {
        confirmSecret.setCustomValidity("Secrets Don't Match");
    } else {
        confirmSecret.setCustomValidity('');
    }
}

function saveSecret() {
    var form = document.getElementById('create-a-secret-form');
    var editLink = document.getElementById('edit-secret');
    form.style.display = 'none';
    editLink.onclick = function() {
        secret = null;
        editLink.style.display = 'none';
        form.style.display = 'block';
        return false; // stop reload
    }
    editLink.style.display = 'block';
    secret = document.getElementById('secret-create').value;
    moveToNextStep();
}

function verifyGameData(event) {
    if (event && event.keyCode !== 13) return;

    secret = document.getElementById('secret').value;
    if (urlGame.isUrlValid(secret)) {
        moveToNextStep();
    } else {
        document.getElementById('secret').value = "";
        document.getElementById('verifyFailMessage').style.display = 'block';
    }
}

function moveToNextStep() {
    if (urlGame.urlParams.emails) {
        emails = urlGame.urlParams.emails;
    }
    if (gameStep === 1 && emails !== null && secret !== null) {
        gameStep = 2;
        showComponents(gameStage, 2);
        var moves = [];
        if (urlGame.urlParams.state) {
            moves = urlGame.urlParams.state.split(',');
        }
        gameboard = new GameboardHandler(moves);
    }
}

function sendMove() {
    // TODO: generate email instead of this temp
    var state = gameboard.getState();
    var url = urlGame.generateURL(secret, state, emails);
    var tempEl = document.getElementById('temp-url');
    tempEl.innerHTML = 'Temporary link';
    tempEl.href = url;

    window.open(url);
}

function init() {

    document.getElementById('secret-create').onchange = validateNewSecret;
    document.getElementById('secret-confirm').onkeyup = validateNewSecret;
    document.getElementById('secret').onkeyup = verifyGameData;

    // fill in email placeholders
    if (urlGame.urlParams.emails) {
        var emails = urlGame.urlParams.emails.split(',');
        var emailSpans = document.querySelectorAll('[data-player-email]');
        for (var i = 0; i < emailSpans.length; i++) {
            var span = emailSpans[i];
            var indx = +span.dataset.playerEmail;
            if (emails.length > indx) {
                span.innerHTML = emails[indx];
            }
        }
    }

    gameStage = urlGame.getGameStage();
    gameStep = 1;
    showComponents(gameStage, gameStep);
}
