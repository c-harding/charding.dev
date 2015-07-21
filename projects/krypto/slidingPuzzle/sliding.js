var context = $('#puzzlecanvas')[0].getContext('2d');

var paper = new Image()
var img = null

paper.onload = function () {
    var strings = [
        "Congratulations! You\nhave completed my\nfirst challenge. But be\nprepared for the\ndanger that is to\ncome!\nThe Master",
        "Well done, the first\nchallenge is solved.\nBut many more still\nremain, so keep\nsearching…\nI will not be defeated!\nThe Master",
        "You were lucky with this\nfirst puzzle. Next time\nit will not be so easy.\nPrepare yourself for\nthe remaining struggle\nof Κρυπτοδος!\nThe Master",
        "If you believe you have\nwon, you are lying to\nyourself. This is the\nfirst of many tests,\nand I will not be\ndefeated easily!\nThe Master"
    ]
    var paper_canvas = $('<canvas/>', {Height: 500, Width: 500})[0];
    var paper_context = paper_canvas.getContext('2d')
    paper_context.drawImage(paper, 0, 0)
    paper_context.font = '43px "Century Schoolbook"';
    paper_context.textAlign = 'center';
    paper_context.fillStyle = 'black';
    string = strings[Math.floor(Math.random()*strings.length)].split("\n")
    for (var i in string) {
        paper_context.fillText(string[i],250,70+60*i);
    }
    img = paper_canvas
    drawTiles()
}
paper.src = 'slidingPuzzle/paper.jpg'

var boardSize = document.getElementById('puzzlecanvas').width;
var tileCount = 3;

var tileSize = boardSize / tileCount;

var clickLoc = new Object;
clickLoc.x = 0;
clickLoc.y = 0;

var emptyLoc = {
    x: 2,
    y: 2
}

var solved = false;

var boardParts;
setBoard();


document.getElementById('puzzlecanvas').onclick = function(e) {
    clickLoc.x = Math.floor((e.pageX - this.getBoundingClientRect().left) / tileSize);
    clickLoc.y = Math.floor((e.pageY - this.getBoundingClientRect().top) / tileSize);
    if (distance(clickLoc.x, clickLoc.y, emptyLoc.x, emptyLoc.y) == 1) {
        slideTile(emptyLoc, clickLoc);
        drawTiles();
    }
    if (solved) {
        setTimeout(function() {
            inpuzzle = false
            zoom(false)
            puzzles_solved ++
            $('.shader').removeClass('shown slide')
        }, 2000);
    }
};

function setBoard() {
    gap = 8
    tiles = [[0,1,2],[3,4,5],[6,7,gap]]
    empty = [2,2]
    last = -1
    for (var random = -1,i = 20;i>0;i--){
        do random = Math.floor(Math.random()*4)
        while (
                random == (2+last)%4
              ||
                (empty[0] == 2 && random == 0)
              ||
                (empty[1] == 2 && random == 1)
              ||
                (empty[0] == 0 && random == 2)
              ||
                (empty[1] == 0 && random == 3)
              )
        last = random
        dir = random%2
        d = 1-(random-dir)
        old_empty = empty.slice()
        empty[dir] += d
        tiles[old_empty[0]][old_empty[1]] = tiles[empty[0]][empty[1]]
        tiles[empty[0]][empty[1]] = gap
        if (tiles[0][0] == 0) i--
    }

    boardParts = new Array(tileCount);
    for (var i = 0; i < tileCount; ++i)
        boardParts[i] = new Array(tileCount)

    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            if (tiles[i][j] == gap) emptyLoc = {x:i,y:j}
            num = tiles[i][j]
            var y = num%3,
                x = (num-y)/3
            boardParts[i][j] = {x:x,y:y}
        }
    }

    solved = false;
}

function drawTiles() {
    context.clearRect ( 0 , 0 , boardSize , boardSize );
    for (var i = 0; i < tileCount; ++i) {
        for (var j = 0; j < tileCount; ++j) {
            var x = boardParts[i][j].x;
            var y = boardParts[i][j].y;
            if(i != emptyLoc.x || j != emptyLoc.y || solved == true) {
                context.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize,
                        i * tileSize, j * tileSize, tileSize, tileSize);
            }
        }
    }
}

function distance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function slideTile(toLoc, fromLoc) {
    if (!solved) {
        boardParts[toLoc.x][toLoc.y].x = boardParts[fromLoc.x][fromLoc.y].x;
        boardParts[toLoc.x][toLoc.y].y = boardParts[fromLoc.x][fromLoc.y].y;
        boardParts[fromLoc.x][fromLoc.y].x = tileCount - 1;
        boardParts[fromLoc.x][fromLoc.y].y = tileCount - 1;
        toLoc.x = fromLoc.x;
        toLoc.y = fromLoc.y;
        checkSolved();
    }
}

function checkSolved() {
    var flag = true;
    for (var i = 0; i < tileCount; ++i) {
        for (var j = 0; j < tileCount; ++j) {
            if (boardParts[i][j].x != i || boardParts[i][j].y != j) {
                flag = false;
            }
        }
    }
    solved = flag;
}
