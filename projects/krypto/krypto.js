// jQuery already imported

var puzzles = 2
var reds = 2*puzzles + 1
var redN = 0

var inpuzzle = false
var puzzles_solved = 0
var spotfound = []

function makePaths(pre) {
    var map = []
    for (var i=0; i < 60; i++) {
        map[i] = []
        for (j=0; j < 60; j++) 
            map[i][j] = 0
    }
    var pos = [30,30]
    var row = pos[0], cell = pos[1]
    var dir = 0
    while (
            map.reduce(function(a, b) {
               return a + b.reduce(function(a, b) {
                  return a + b;
               },0)
            },0) < 300
    ) {
        var d = Math.floor(Math.pow(((Math.random()+1)*1.7),2) * (Math.random()< 0.5 ? -1 : 1))
        for (var i = 0;;) {

            if (dir == 0) {
                row = pos[0]+i
                cell = pos[1]
            } else {
                row = pos[0]
                cell = pos[1]+i
            }

            map[row][cell] = 1

            if (d>0) i++
            else i--


            var newrow, newcell

            if (dir == 0) {
                newrow = pos[0]+i
                newcell = pos[1]
            } else {
                newrow = pos[0]
                newcell = pos[1]+i
            }

            if (
                i == d ||
                newrow + newcell < 41 || 
                newcell - newrow > 18 || 
                newrow - newcell > 17 || 
                newcell + newrow > 102
               ) break

        }
        pos = [row,cell]
        if (Math.random() > 0.3) dir = (dir + 1)%2
    }
    
    var doors = reds
    while (doors > 0) {
        y = Math.floor(Math.random()*60)
        x = Math.floor(Math.random()*60)
        horiz = ((x != 0 && map[y][x-1] == 0) && (x != 60-1 && map[y][x+1] == 0))
        vert = ((y != 0 && map[y-1][x] == 0) && (y != 60-1 && map[y+1][x] == 0))
        if (map[y][x] == 1 && (horiz || vert) && !(x == 30 && y == 30)) {
            map[y][x] = 2
            doors--
        }
    }
   
    map[myloc[0]][myloc[1]] = 13
    
    if (pre !== false) {
        pre = ""
        
        var print = {
            0: '#',
            1: ' ',
            2: 'x',
            3: 'o'
        }
        
        for (row in map) {
            for (cell in map[row]) {
                pre += print[map[row][cell]]
            }
            pre += '\n'
        }
        $('pre').html(pre)
    }
    return map
}

function render3d() {
    function toDegrees(angle) {
        return angle * (180 / Math.PI);
    }

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    function sin(deg) {
        return Math.sin(toRadians(deg))
    }

    function cos(deg) {
        return Math.cos(toRadians(deg))
    }

    function tan(deg) {
        return Math.tan(toRadians(deg))
    }

    function getCoords(x, y, z) {
        a = 30
        u = x * cos(a) + y * cos(a + 120) - z * cos(a - 120)
        v = x * sin(a) + y * sin(a + 120) - z * sin(a - 120)
        return [u, 500 - v]
    }

    var isoCtx = {
        setContext: function(context) {
            this.context = context
        },
        move: function(x, y, z) {
            coords = getCoords(x, y, z)
            this.context.moveTo(coords[0], coords[1])
        },
        line: function(x, y, z) {
            coords = getCoords(x, y, z)
            this.context.lineTo(coords[0], coords[1])
        },
        img: function(obj, x, y, z, width) {
            coords = getCoords(x, y, z)
            coords[0] -= 0.5*width*obj.height/obj.width
            coords[1] -= width
            this.context.drawImage(obj,coords[0],coords[1], width, width*obj.height/obj.width)
        }
    }
    
    var context = $('#isocanvas')[0].getContext("2d");
    isoCtx.setContext(context)

    context.fillStyle = 'black'
    context.fillRect(0,0,500,500)

    var print = {
        0: [0, 0, 0],
        1: [255, 255, 255],
        2: [255, 0, 0],
        3: [144, 238, 144],
        4: [255, 165, 0],
        5: [255, 192, 203],
        6: [255, 255, 0],
        toRGB: function(n){
            color = this[n]
            rgbstr = "rgb("+color[0]+","+color[1]+","+color[2]+")"
            return rgbstr
        },
        toRGBA0: function(n){
            color = this[n]
            rgbastr = "rgba("+color[0]+","+color[1]+","+color[2]+",0)"
            return rgbastr
        }
    }
    
    for (var i = 59; i >= -60; i--) {
        for (var j = 0; j < 60; j++) if (0 <= i+j && i+j < 60 && 0 <= j && j < 60){
            row = i+j
            cell = 59-j
            kind = map[row][cell]

            if (kind > 10 && 1 <= kind%10 && kind%10 <= 6) {
                if (kind > 20) {
                    var vx = (((map[row][cell]-10)%30)/10)>>0,
                        vy = ((map[row][cell]-10)/30)>>0

                    if (vx == 2) vx = -1
                    if (vy == 2) vy = -1
                    var wx = 0, wy = 0
                    if (vx == 0) wx = vy
                    if (vy == 0) wy = vx
                    var start = getCoords(15*(row+0.5*(1-wx-vx))-150,15*(cell+0.5*(1-wy-vy))-450, 0)
                    if (vx & vy != 0)
                        var end = getCoords(15*(row+0.5)-150,15*(cell+0.5)-450, 0)
                    else
                        var end = getCoords(15*(row+0.5*(1+vx))-150,15*(cell+0.5*(1+vy))-450, 0)
                    var gradient = context.createLinearGradient(start[0],start[1],end[0],end[1])
                    gradient.addColorStop(0,print.toRGB(map[row][cell]%10))
                    gradient.addColorStop(1,print.toRGBA0(map[row][cell]%10))
                    context.fillStyle = gradient
                } else
                    context.fillStyle = print.toRGB(map[row][cell]%10);
                context.beginPath()
                isoCtx.move(15*row-150, 15*cell-450, 0)
                isoCtx.line(15*(row+1)-150, 15*cell-450, 0)
                isoCtx.line(15*(row+1)-150, 15*(cell+1)-450, 0)
                isoCtx.line(15*row-150, 15*(cell+1)-450, 0)
                context.closePath()
                context.fill()
            } else if (kind%10 == 0 && (cell != 59 && 10 < map[row][cell+1] && map[row][cell+1]%10 != 0)) {
                var vx = (((map[row][cell+1]-10)%30)/10)>>0,
                    vy = ((map[row][cell+1]-10)/30)>>0
                if (vx == 2) vx = -1
                if (vy == 2) vy = -1

                if (vy == -1)
                    continue
                else if (vx != 0) {
                    var start = getCoords(15*(row)-150,15*(cell+1)-450, 15/2)
                    var end = getCoords(15*(row+1)-150,15*(cell+1)-450, 0)
                    var gradient = context.createLinearGradient(start[0],start[1],end[0],end[1])
                    gradient.addColorStop((1-vx)/2,'rgba(0,0,0,0.5)')
                    gradient.addColorStop((1+vx)/2,'rgba(0,0,0,0)')
                    context.fillStyle = gradient
                }
                else
                    context.fillStyle = 'rgba(0,0,0,0.5)'
                context.beginPath()
                isoCtx.move(15*row-150, 15*(cell+1)-450, 0)
                isoCtx.line(15*(row+1)-150, 15*(cell+1)-450, 0)
                isoCtx.line(15*(row+1)-150, 15*(cell+1)-450, 10)
                isoCtx.line(15*row-150, 15*(cell+1)-450, 10)
                context.closePath()
                context.fill()
            }
        }
        for (var j = 0; j < 60; j++)
                if (0 <= i+j && i+j < 60 && 0 <= j && j < 60)
                {
            row = i+j
            cell = 59-j
            kind = map[row][cell]

            if (kind%10 == 0 && (row != 59 && 10 < map[row+1][cell] && map[row+1][cell]%10 != 0)) {
                var vx = (((map[row+1][cell]-10)%30)/10)>>0,
                    vy = ((map[row+1][cell]-10)/30)>>0
                if (vx == 2) vx = -1
                if (vy == 2) vy = -1
                
                if (vx == -1) {
                    continue
                } else if (vy != 0) {
                    var start = getCoords(15*(row+1)-150,15*(cell+1)-450, 0)
                    var end = getCoords(15*(row+1)-150,15*(cell)-450, 15/2)
                    var gradient = context.createLinearGradient(start[0],start[1],end[0],end[1])
                    gradient.addColorStop((1+vy)/2,'rgba(0,0,0,0.5)')
                    gradient.addColorStop((1-vy)/2,'rgba(0,0,0,0)')
                    context.fillStyle = gradient
                }
                else
                    context.fillStyle = 'rgba(0,0,0,0.5)'
                context.beginPath()
                isoCtx.move(15*(row+1)-150, 15*cell-450, 0)
                isoCtx.line(15*(row+1)-150, 15*(cell+1)-450, 0)
                isoCtx.line(15*(row+1)-150, 15*(cell+1)-450, 10)
                isoCtx.line(15*(row+1)-150, 15*cell-450, 10)
                context.closePath()
                context.fill()
            }
        }
        for (var j = 0; j < 60; j++)
                if (0 <= i+j && i+j < 60 && 0 <= j && j < 60)
                {
            row = i+j
            cell = 59-j
            kind = map[row][cell]

            if (kind == 13) {
                isoCtx.img(man,15*(row+0.2)-150, 15*(cell+0.2)-450, 0, 24);
            }
        }
        for (var j = 0; j < 60; j++)
                if (0 <= i+j && i+j < 60 && 0 <= j && j < 60)
                {
            row = i+j
            cell = 59-j
            kind = map[row][cell]

            if (kind%10 == 0 && (row != 0 && 10 < map[row-1][cell] && map[row-1][cell]%10 != 0)) {
                var vx = (((map[row-1][cell]-10)%30)/10)>>0,
                    vy = ((map[row-1][cell]-10)/30)>>0
                if (vx == 2) vx = -1
                if (vy == 2) vy = -1
                
                if (vx == 1)
                    continue
                else if (vy != 0) {
                    var start = getCoords(15*row-150,15*(cell)-450, 15/2)
                    var end = getCoords(15*row-150,15*(cell+1)-450, 0)
                    var gradient = context.createLinearGradient(start[0],start[1],end[0],end[1])
                    gradient.addColorStop((1+vy)/2,'rgba(204,204,204,0)')
                    gradient.addColorStop((1-vy)/2,'rgba(204,204,204,1)')
                    context.fillStyle = gradient
                }
                else
                    context.fillStyle = '#CCC'
                context.beginPath()
                isoCtx.move(15*row-150, 15*cell-450, 0)
                isoCtx.line(15*row-150, 15*(cell+1)-450, 0)
                isoCtx.line(15*row-150, 15*(cell+1)-450, 10)
                isoCtx.line(15*row-150, 15*cell-450, 10)
                context.closePath()
                context.fill()
            }
        }
        for (var j = 0; j < 60; j++)
                if (0 <= i+j && i+j < 60 && 0 <= j && j < 60)
                {
            row = i+j
            cell = 59-j
            kind = map[row][cell]

            if (kind%10 == 0 && (cell != 0 && 10 < map[row][cell-1] && map[row][cell-1]%10 != 0)) {
                var vx = (((map[row][cell-1]-10)%30)/10)>>0,
                    vy = ((map[row][cell-1]-10)/30)>>0
                if (vx == 2) vx = -1
                if (vy == 2) vy = -1
                
                if (vy == 1)
                    continue
                else if (vx != 0) {
                    var start = getCoords(15*(row)-150,15*cell-450, 15/2)
                    var end = getCoords(15*(row+1)-150,15*cell-450, 0)
                    var gradient = context.createLinearGradient(start[0],start[1],end[0],end[1])
                    gradient.addColorStop((1+vx)/2,'rgba(153, 153, 153,0)')
                    gradient.addColorStop((1-vx)/2,'rgba(153, 153, 153,1)')
                    context.fillStyle = gradient
                }
                else
                    context.fillStyle = '#999'
                context.beginPath()
                isoCtx.move(15*row-150, 15*cell-450, 0)
                isoCtx.line(15*row-150, 15*cell-450, 10)
                isoCtx.line(15*(row+1)-150, 15*cell-450, 10)
                isoCtx.line(15*(row+1)-150, 15*cell-450, 0)
                context.closePath()
                context.fill()
            }
        }
    }
}

function open_puzzle(door) {
    inpuzzle = true
    puzzle = ['slide','caesar','spot','maths'][puzzles_solved]

    zoom(true)

    if (puzzle == "spot") {
        $('.spotdiffimg').each(function(){
            for (var i = 0; i!=6*6; i++) {
                $('<div/>', {
                    'class': 'hotspot'
                }).data({
                    'i': i
                }).appendTo(this);
            }
        })
        $('.hotspot').click(function(){
            if ([6,11,28,32].indexOf($(this).data('i')) !== -1)
                spotfound[$(this).data('i')] = 1
            
            var found = 0;
            for (var property in spotfound) {
                found += spotfound[property];
            }

            if (found == 4) {
                inpuzzle = false
                puzzles_solved ++
                $('.shader').removeClass('shown spot')
                zoom(false)
            }

            $('#spotfound').html(found)
        })
        $('.shader').addClass('shown spot')
    } else if (puzzle == "slide") {
        $('.shader').addClass('shown slide')
    } else if (puzzle == "maths") {
        var a = Math.floor(Math.random()*900 + 100)
        var b = Math.floor(Math.random()*900 + 100)
        var c = Math.floor(Math.random()*900 + 100)
        var d = Math.floor(Math.random()*900 + 100)
        var e = Math.floor(Math.random()*900 + 100)
        var f = Math.floor(Math.random()*900 + 100)
        if (f > e) {
            var g = f
            f = e
            e = g
        }

        $('#math-a').html(a/100)
        $('#math-b').html(b/100)
        $('#math-c').html(c/100)
        $('#math-d').html(d/100)
        $('#math-e').html(e/100)
        $('#math-f').html(f/100)

        function checkanswers(){
            if (
                parseFloat($('#math-ab').val()) == (a+b)/100
               &&
                parseFloat($('#math-cd').val()) == (c+d)/100
               &&
                parseFloat($('#math-ef').val()) == (e-f)/100
               ) {
                inpuzzle = false
                zoom(false)
                puzzles_solved ++
                $('.shader').removeClass('shown maths')
            }
        }

        $('#maths input').on('input', function (){
            if (
                parseFloat($('#math-ab').val()) == (a+b)/100
               &&
                parseFloat($('#math-cd').val()) == (c+d)/100
               &&
                parseFloat($('#math-ef').val()) == (e-f)/100
               ) {
                inpuzzle = false
                zoom(false)
                puzzles_solved ++
                $('.shader').removeClass('shown maths')
            }
        })

        $('.shader').addClass('shown maths')
    } else if (puzzle == "caesar") {
        var compare = ['A','B','C','D','E','F','G','H','I','J','K',
        'L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        var alphabet = ['A','B','C','D','E','F','G','H','I','J','K',
        'L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        
        //TYPE MESSAGE TO BE DECIPHERED HERE
        var str = atob("SE9XIERJRCBZT1UgRVNDQVBFIE1ZIENIQUxMRU5HRVMgV0VSRSBJTVBPU1NJQkxFIEVWRU4gRk9SIFRIRSBHUkVBVEVTVCBNSU5EUyBJIFdJTEwgSEFWRSBSRVZFTkdFIFRIRSBNQVNURVI=");
        
        var shiftBy = Math.floor((Math.random() * 25) + 1); 
        for ( i = 1 ; i <= shiftBy ; ++i ) {
            var element = alphabet.shift();
            alphabet.push(element);
        }
        
        var strLength = str.length;
        var newstr = "";
        for ( i = 0; i <= strLength - 1 ; ++i ) {
            var x = String(str.charAt(i));
            if (x == " ") {
                newstr += " ";
                continue;
            }
            var a = compare.indexOf(x);
            var valueAtIndex = String(alphabet[a]);
            newstr += valueAtIndex;
        }
        
        //document.write(newstr);
        document.getElementById("box").innerHTML = newstr;
        $('#answerinput').on('input',function () {
            var y;
            y = document.getElementById("answerinput").value.toLowerCase();
            y = y.replace(/[^a-z ]/g, '').replace(/ +/g,' ')
            if (y === str.toLowerCase()) {
                inpuzzle = false
                zoom(false)
                puzzles_solved ++
                $('.shader').removeClass('shown caesar')
            }
        })
        $('.shader').addClass('shown caesar')
    }
}

function vision(){

    function seen(dx,dy){
        var x = myloc[0]+dx
        var y = myloc[1]+dy
        var Dx = dx,
            Dy = dy
        if(dx != 2) Dy = (dy/2)>>0
        if(dy != 2) Dx = (dx/2)>>0
        var mx = (Dx+3)%3
        var my = (Dy+3)%3

        if (map[x][y] < 10)
            var ox = -1,
                oy = -1
        else
            var ox = (((map[x][y]-10)%30)/10)>>0,
                oy = ((map[x][y]-10)/30)>>0

        if (ox != -1) {
            mx = (mx&ox)%3
            my = (my&oy)%3
        }
        map[x][y] = map[x][y]%10 + 10 + 10*mx + 30*my
        
        if (map[x][y]%10 == 2) {
            if (redN%2 == 1) {
                redN ++
                map[x][y] += 3
            } else if (redN == puzzles*2) {
                redN ++
                map[x][y] += 4
            } else {
                redN ++
                map[x][y] += 2
            }
        }

    }
    
    seen(0,0)
    if (myloc[1] > 0)
        seen(0,-1)
    if (myloc[1] > 1 && map[myloc[0]][myloc[1]-1]%10 != 0)
        seen(0,-2)
    if (myloc[1] < 59)
        seen(0,1)
    if (myloc[1] < 58 && map[myloc[0]][myloc[1]+1]%10 != 0)
        seen(0,2)

    if (myloc[0] > 0) {
        seen(-1,0)
        if (
                myloc[1] > 0 &&
                (map[myloc[0]-1][myloc[1]]%10 != 0 ||
                map[myloc[0]][myloc[1]-1]%10 != 0)
           )
            seen(-1,-1)
        if (
                myloc[1] > 1 &&
                map[myloc[0]][myloc[1]-1]%10 != 0 &&
                map[myloc[0]-1][myloc[1]-1]%10 != 0
           )
            seen(-1,-2)
        if (
                myloc[1] < 59 &&
                (map[myloc[0]-1][myloc[1]]%10 != 0 ||
                map[myloc[0]][myloc[1]+1]%10 != 0)
           )
            seen(-1,1)
        if (
                myloc[1] < 58 &&
                map[myloc[0]][myloc[1]+1]%10 != 0 &&
                map[myloc[0]-1][myloc[1]+1]%10 != 0
           )
            seen(-1,2)
    }
    if (myloc[0] > 1) {
        if (map[myloc[0]-1][myloc[1]]%10 != 0)
            seen(-2,0)
        if (
                myloc[1] > 0 &&
                map[myloc[0]-1][myloc[1]]%10 != 0 &&
                map[myloc[0]-1][myloc[1]-1]%10 != 0
           )
            seen(-2,-1)
        if (
                myloc[1] < 59 &&
                map[myloc[0]-1][myloc[1]]%10 != 0 &&
                map[myloc[0]-1][myloc[1]+1]%10 != 0
           )
            seen(-2,1)
    }
    
    if (myloc[0] < 59) {
        seen(1,0)
        if (
                myloc[1] > 0 &&
                (map[myloc[0]+1][myloc[1]]%10 != 0 ||
                map[myloc[0]][myloc[1]-1]%10 != 0)
           )
            seen(1,-1)
        if (
                myloc[1] > 1 &&
                map[myloc[0]][myloc[1]-1]%10 != 0 &&
                map[myloc[0]+1][myloc[1]-1]%10 != 0
           )
            seen(1,-2)
        if (
                myloc[1] < 59 &&
                (map[myloc[0]+1][myloc[1]]%10 != 0 ||
                map[myloc[0]][myloc[1]+1]%10 != 0)
           )
            seen(1,1)
        if (
                myloc[1] < 58 &&
                map[myloc[0]][myloc[1]+1]%10 != 0 &&
                map[myloc[0]+1][myloc[1]+1]%10 != 0
           )
            seen(1,2)
    }
    if (myloc[0] < 58) {
        if (map[myloc[0]+1][myloc[1]]%10 != 0)
            seen(2,0)
        if (
                myloc[1] > 0 &&
                map[myloc[0]+1][myloc[1]]%10 != 0 &&
                map[myloc[0]+1][myloc[1]-1]%10 != 0
           )
            seen(2,-1)
        if (
                myloc[1] < 59 &&
                map[myloc[0]+1][myloc[1]]%10 != 0 &&
                map[myloc[0]+1][myloc[1]+1]%10 != 0
           )
            seen(2,1)
    }
}

$(document).keydown(function(e) {
    var no_win = false
    var original = myloc.slice()

    function doorevents(num) {
        if (num == 4)
            open_puzzle(false)
        if (num == 5)
            open_puzzle(false)
        if (num == 6) {
            if (puzzles_solved != 2*puzzles) {
                no_win = true
            }
            else {
                inpuzzle = true
                zoom(true)
                $('#win img')[0].src = man.src
                $('.shader').addClass('shown win')
            }
        } 
        if (num == 2)
            alert("Unrecognised security checkpoint")
    }

    switch(e.which) {
        case 37: // left
        if (inpuzzle) return false;
        if (
               myloc[1] == 59
            || map[myloc[0]][myloc[1]+1]%10 == 0
           ) break;

        map[myloc[0]][myloc[1]] -= 2
        myloc[1] += 1

        doorevents(map[myloc[0]][myloc[1]]%10)

        map[myloc[0]][myloc[1]] = 13
        break;

        case 38: // up
        if (inpuzzle) return false;
        if (
               myloc[0] == 59
            || map[myloc[0]+1][myloc[1]]%10 == 0
           ) break;
        map[myloc[0]][myloc[1]] -= 2
        myloc[0] += 1
        
        doorevents(map[myloc[0]][myloc[1]]%10)

        map[myloc[0]][myloc[1]] = 13
        break;

        case 39: // right
        if (inpuzzle) return false;
        if (
               myloc[1] == 0
            || map[myloc[0]][myloc[1]-1]%10 == 0
           ) break;
        map[myloc[0]][myloc[1]] -= 2
        myloc[1] -= 1
        
        doorevents(map[myloc[0]][myloc[1]]%10)

        map[myloc[0]][myloc[1]] = 13
        break;

        case 40: // down
        if (inpuzzle) return false;
        if (
               myloc[0] == 0
            || map[myloc[0]-1][myloc[1]]%10 == 0
           ) break;
        map[myloc[0]][myloc[1]] -= 2
        myloc[0] -= 1
        
        doorevents(map[myloc[0]][myloc[1]]%10)

        map[myloc[0]][myloc[1]] = 13
        break;

        default: return; // exit this handler for other keys
    }

    if (no_win === true) {
        map[myloc[0]][myloc[1]] = 16
        myloc = original.slice()
        map[myloc[0]][myloc[1]] = 13
    }
    vision()
    render3d()
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

function onSwipes(){
    hammer = new Hammer.Manager(document.body);
    console.log('swipes on')
    swipe = new Hammer.Swipe({ direction: Hammer.DIRECTION_ALL })
    hammer.add(swipe)
    hammer.on("swipe", function(eventObject) {
        var key = 0
        if(eventObject.angle < -90) {
            key = 37
        } else if(eventObject.angle < 0) {
            key = 38
        } else if(eventObject.angle < 90) {
            key = 39
        } else {
            key = 40
        }
        $('#isocanvas').trigger({type: 'keydown', which: key, keyCode: key})
    })
}

function offSwipes(){
    console.log('swipes off')
    hammer.destroy()
}

function zoom(on) {
    onMeta = 'width=600, minimum-scale=0.7, initial-scale=0.7'
    offMeta = 'width=600, minimum-scale=0.7, maximum-scale=0.7, initial-scale=0.7'
    $('meta[name="viewport"]').attr('content', on ? onMeta : offMeta)
    if (on) offSwipes()
    else {
        onSwipes()
        $('input:focus').blur()
    }
}

man = new Image()
man.onload = render3d
man.src = "data:image/png;base64,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/GMzLdsAADvyaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzA2NyA3OS4xNTc3NDcsIDIwMTUvMDMvMzAtMjM6NDA6NDIgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChNYWNpbnRvc2gpPC94bXA6Q3JlYXRvclRvb2w+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE1LTA3LTEzVDE2OjQzOjQ3KzAxOjAwPC94bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxNS0wNy0xNFQyMzoxNzo1MCswMTowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPHhtcDpNb2RpZnlEYXRlPjIwMTUtMDctMTRUMjM6MTc6NTArMDE6MDA8L3htcDpNb2RpZnlEYXRlPgogICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3BuZzwvZGM6Zm9ybWF0PgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmVlZjE4ZjNlLTQ3YTgtNGFiYi04NzM0LWI5YTg0NmYxOTNkNDwveG1wTU06SW5zdGFuY2VJRD4KICAgICAgICAgPHhtcE1NOkRvY3VtZW50SUQ+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk3Njc5YjVlLTZiMDQtMTE3OC1hMmYwLWVmMDRmOGVlM2Y2MDwveG1wTU06RG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD54bXAuZGlkOjQ0MTkwNmNlLTNkYWEtNDQ1Ny1iYTA4LTI0NzYyNGI2MzI0OTwveG1wTU06T3JpZ2luYWxEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SGlzdG9yeT4KICAgICAgICAgICAgPHJkZjpTZXE+CiAgICAgICAgICAgICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6YWN0aW9uPmNyZWF0ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDo0NDE5MDZjZS0zZGFhLTQ0NTctYmEwOC0yNDc2MjRiNjMyNDk8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTUtMDctMTNUMTY6NDM6NDcrMDE6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDoxNTdmZDA2ZS1iZmJjLTQ2NDctOTVmOC0wZjVkYWE1YTMzYzE8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTUtMDctMTRUMjM6MTc6NTArMDE6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+c2F2ZWQ8L3N0RXZ0OmFjdGlvbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0Omluc3RhbmNlSUQ+eG1wLmlpZDplZWYxOGYzZS00N2E4LTRhYmItODczNC1iOWE4NDZmMTkzZDQ8L3N0RXZ0Omluc3RhbmNlSUQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDp3aGVuPjIwMTUtMDctMTRUMjM6MTc6NTArMDE6MDA8L3N0RXZ0OndoZW4+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpzb2Z0d2FyZUFnZW50PkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChNYWNpbnRvc2gpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjY0PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjY0PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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"

var myloc = [30,30]
var map = makePaths(false)

$(vision);

$(render3d);

$(onSwipes);
