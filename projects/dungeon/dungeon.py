#!/usr/bin/env python3
VERSION = "0.2.1"

#import modules
import curses, sys, time, traceback, os.path, json, math
from termcolor import colored
from random import random, randint
import urllib.request

SCORES_FILE = os.path.join(os.path.dirname(__file__), 'dungeon_scores.json')
HELPTEXT = """Dungeon by Xsanda
Thank you for downloading Dungeon by Xsanda, version %s

How to play:

Use the arrow keys to control your piece, the brackets ().
The aim is to collect all the coins on the map, in order to
advance to the next level. Do not move into any blockers ><
or monsters M!, as these will kill you. If you see a pink
>1, this is a portal, and it will teleport you to the other
portal with the same number. For the earlier levels, moving
off the edge of the map will loop around to the other side.
However, as the maps get harder the map will not all fit on
one screen, so the map will pan as you approach the edge of
the screen. You can manually pan with the keys WASD. As the
game advances, you can also collect lives, to protect you
against the perils of the dungeon.

If and when you die, you will have to enter your name. Hit
enter afterwards to save your score locally. This will
create a file `dungeon_scores.json` in your current
directory. You can view those scores by pressing #. This
game is still in development, and so it may have updates
available. Press u to check for updates online."""%VERSION

class Level:
    __number = 0
    
    def __init__(self, height, width = False,
                 mines = 0, coins = {1:1, 5:0}, mobs = 0, display = [0, 0],
                 portals = 0, life = 0):
        self.height = height
        self.width = width or height
        self.mines = mines
        self.coins = coins
        self.sum_coins = sum(v*n for v,n in coins.items())
        self.mobs = mobs
        self.number = Level.__number
        self.display = display
        self.portals = portals
        self.life = life
        
        self.coinscore = 0
        
        Level.__number+=1
    
    def play(self):
        map = self.game.map = self.map = Map(self)
        screen.nodelay(True)
        while(screen.getch() is not -1): pass #discard intermediate keypresses
        screen.nodelay(False)
        
        self.win = False
        
        map.draw()
    
        while True:
            key = screen.getkey().lower()
            if key == "\x1b":
                screen.nodelay(True)
                nextkey = screen.getch()
                thirdkey = screen.getch()
                screen.nodelay(False)
                if nextkey is -1:
                    raise KeyboardInterrupt()
                elif nextkey is 91: # arrow key
                    if thirdkey is 66: #down
                        self.move(0)
                    elif thirdkey is 67: #right
                        self.move(1)
                    elif thirdkey is 65: #up
                        self.move(2)
                    elif thirdkey is 68: #left
                        self.move(3)
        
            elif key == "q":
                raise KeyboardInterrupt()
            elif key == "t":
                map.message(str(level.coinscore)+"/"+str(level.sum_coins))
        
            elif key == "w":
                map.scroll(2)
            elif key == "a":
                map.scroll(3)
            elif key == "s":
                map.scroll(0)
            elif key == "d":
                map.scroll(1)
        
            elif key == "#":
                show_scores()
            elif key == "h":
                show_help()
            elif key == "u":
                check_update()
        
            map.draw()
            screen.move(self.height+4,0)
            screen.refresh()

            if self.win is True:
                time.sleep(0.5)
                break
    
    def move(self, d):
        """Move player to neighbouring spot.
    
        d = 0 => down
        d = 1 => right
        d = 2 => up
        d = 3 => left
        """
        
        map = self.map
        
        change = 1 - 2*(d//2)
        direction = d % 2
    
        map.scroll_me() #prevent "out of sight, out of mind" hack
    
        new_me = map.me[:]
        new_me[direction] = (new_me[direction] + change) % (self.height, self.width)[direction]
        if map[new_me].function is "death":
            map[new_me].got_me()
            me = map[map.me]
            map[map.me] = Blank()
            map.me = new_me[:]
            map.scroll_me()
            self.lose_life(me)
    
        elif map[new_me].name is "portal":
            new_me = map[new_me].target
            newnewme = new_me[:]
            newnewme[direction] = (newnewme[direction] + change) % (self.height, self.width)[direction]
            if map[newnewme].function in {"death", "move"}:
                d = -1
                while map[newnewme].function in {"death", "move"}:
                    d += 1
                    change = 1 - 2*(d//2)
                    direction = d % 2
                    newnewme = new_me[:]
                    if d is 4: break
                    newnewme[direction] = (newnewme[direction] + change) % (self.height, self.width)[direction]
        
            new_me = newnewme
    
        if map[new_me].name is "coin":
            self.add_coin(map[new_me].value)
        
        elif map[new_me].name is "life":
            self.add_life(map[new_me].value)
    
        map[map.me] = Blank()
        old_me, map.me = map.me[:], new_me[:]
        map[map.me] = Me()
    
        self.move_mob(old_me, map.me)
        
        map.scroll_me()
    
    def move_mob(self, old_me, new_me):
        """Move mobs by one click towards player's location."""
        
        map = self.map
        
        mob_locs = [False]*self.mobs
        lose = False
        for y, n in map:
            for x, item in map.cells(y):
                if item.name is "mob":
                    mob_locs[item.id] = (y, x)
    
        for mob in mob_locs:
            if mob is False: continue
            rand = random()
            if rand < 0.6:
                me = old_me
            elif rand < 0.9:
                me = new_me
            else:
                me = [
                    randint(0,self.height-1),
                    randint(0,self.width-1)
                ]
            midheight = int(self.height/2)
            midwidth = int(self.width/2)
            dy = (me[0]-mob[0] + midheight) % self.height - midheight
            dx = (me[1]-mob[1] + midwidth) % self.width - midwidth
        
            if dx is 0 or dy is not 0 and random() < 0.5:
                if dy > 0:
                    new_pos = ((mob[0]+1)%self.height, mob[1])
                else: new_pos = ((mob[0]-1)%self.height, mob[1])
            else:
                if dx > 0:
                    new_pos = (mob[0], (mob[1]+1)%self.width)
                else: new_pos = (mob[0], (mob[1]-1)%self.width)
        
            if map[new_pos].name is "coin":
                self.sum_coins -= map[new_pos].value
            elif map[new_pos].name is "portal":
                map[mob] = Blank()
                map[map[new_pos].target] = Blank()
            elif map[new_pos].name is "me":
                me = map[new_pos]
                lose = True
            self.add_coin(0)
        
            map[new_pos] = map[mob]
            if lose: map[new_pos].got_me()
            map[mob] = Blank()
        
            map.draw()
        
            if lose: self.lose_life(me)
    
    def draw(self):
        self.map.draw()
    
    @property
    def bank(self):
        return self.game.bank
    
    @property
    def lives(self):
        return self.game.lives
    
    def add_coin(self,num=1):
        self.coinscore += num
        self.game.bank += num
    
        if self.coinscore is self.sum_coins:
            self.message("You win!")
            self.win = True
    
    def add_life(self,num=1):
        self.game.lives += num
        return self.game.lives
    
    def lose_life(self, me, num=1):
        map = self.map
        
        self.game.lives -= num
        if self.game.lives is 0:
            map.message("You lose")
            exit()
        else:
            map.message("You lose a life")
            time.sleep(1)
            
            screen.nodelay(True)
            while(screen.getch() is not -1): pass #discard intermediate keypresses
            screen.nodelay(False)
            
            map[map.me] = me
            map.message()
    
    def message(self, str=""):
        self.map.message(str)

class Item:
    colour = 0
    type = 0
    disp = "   "
    name = "unknown"
    function = None
    
    def __bool__(self):
        return self.type is not 0
class Blank(Item):
    type = 0
    name = "blank"
class Mine(Item):
    disp = ">< "
    colour = 1
    type = 1
    name = "mine"
    function = "death"
    
    def got_me(self):
        self.colour = 3
class Me(Item):
    disp = "() "
    colour = 3
    type = 2
    name = "me"
    function = "player"
class Coin(Item):
    disp = "$$ "
    colour = 2
    type = 3
    name = "coin"
    value = 1
    function = "collect"
    
    def __init__(self, value = 1):
        self.value = value
    
    @property
    def disp(self):
        return "$%-2i" % self.value
class Portal(Item):
    disp = ">1 "
    colour = 4
    type = 4
    name = "portal"
    function = "move"
    
    def __init__(self, id = 0, target = [0,0]):
        self.id = id + 1
        self.target = target
    
    @property
    def disp(self):
        return ">%-2i" % self.id
class Mob(Mine):
    disp = "M! "
    colour = 1
    type = 5
    name = "mob"
    id = 0
    
    def __init__(self, id = 0):
        self.id = id
class Life(Item):
    disp = "+1 "
    colour = 5
    type = 6
    name = "life"
    value = 1
    function = "collect"
    
    def __init__(self, value = 1):
        self.value = value
    
    @property
    def disp(self):
        return "+%-2i" % self.value

class Map:
    height = 2
    width = 2
    scrolly = 0
    scrollx = 0
    contents = []
    last_message = ""
    
    def __init__(self, level):
        self.level = level
        self.width = level.width
        self.height = level.height
        self.fill()
    
    def __getitem__(self, coords):
        if len(coords) is 1:
            if isinstance(coords[0], int):
                return self.contents[coords[0]]
            else: coords = coords[0]
        return self.contents[coords[0]][coords[1]]
    
    def __setitem__(self, coords, value):
        if len(coords) is 1:
            if isinstance(coords[0], int):
                self.contents[coords[0]] = value
                return
            else: coords = coords[0]
        self.contents[coords[0]][coords[1]] = value
    
    def __iter__(self):
        for n in range(self.level.display[0] or self.height):
            r = (n + self.scrolly) % self.height
            yield r, n
    
    def cells(self, r):
        for n in range(self.level.display[1] or self.width):
            d = (n + self.scrollx) % self.width
            yield d, self[r,d]
    
    def fill(self):
        level = self.level
        
        self.contents = [[Mine() for c in range(self.width)] for r in range(self.height)]
        
        mover = [randint(0,self.height-1), randint(0,self.width-1)]
        mines = self.height * self.width
        while mines != level.mines:
            if random() > 0.5:
                if random() > 0.5:
                    mover[0] = (mover[0]+1) % self.height
                else: mover[0] = (mover[0]-1) % self.height
            else:
                if random() > 0.5:
                    mover[1] = (mover[1]+1) % self.width
                else: mover[1] = (mover[1]+1) % self.width
            
            if self[mover].type is 1: mines -= 1
            self[mover] = Blank()
        
        for v in level.coins:
            for i in range (level.coins[v]):
                while True:
                    y = randint(0,self.height-1)
                    x = randint(0,self.width-1)
                    if not self[y,x]:
                        self[y,x] = Coin(v)
                        break
        
        for i in range(level.mobs):
            while True:
                y = randint(0,self.height-1)
                x = randint(0,self.width-1)
                if not self[y,x]:
                    self[y,x] = Mob(i)
                    break
        
        for i in range(level.life):
            while True:
                y = randint(0,self.height-1)
                x = randint(0,self.width-1)
                if not self[y,x]:
                    self[y,x] = Life()
                    break
        
        for i in range(level.portals):
            first = []
            second = []
            while True:
                y = randint(0,self.height-1)
                x = randint(0,self.width-1)
                if not self[y,x]:
                    first = [y,x]
                    break
            while True:
                y = randint(0,self.height-1)
                x = randint(0,self.width-1)
                if not(self[y,x]) and repr(first) != repr([y,x]):
                    second = [y,x]
                    break
            self[first] = Portal(i, second)
            self[second] = Portal(i, first)
        
        while True:
            y = randint(0,self.height-1)
            x = randint(0,self.width-1)
            if not self[y,x]:
                self.me = me = [y,x]
                self[me] = Me()
                break
                
        self.scroll_me()
    
    def draw(self):
        level = self.level
        global game
        
        if curses.isendwin():
            output = lambda str="": print(str, end="")
            outputln = lambda str="": print(str)
        else:
            screen.clear()
            nl = True
            ln = 0
            def output(str=""):
                nonlocal nl, ln
                if nl: screen.addstr(ln,0,str)
                else: screen.addstr(str)
                nl = False
            def outputln(str=""):
                nonlocal nl, ln
                if nl: screen.addstr(ln,0,str)
                else: screen.addstr(str)
                nl = True
                ln += 1
            
        width = level.display[1] or self.width
        outputln("+" + "---"*width + "-+  Level %i" % (level.number+1))
        for r, n in self:
            output("| ")
            for y,item in self.cells(r): self.display(item)
            if n is 0: outputln("|  $%4i" % level.coinscore)
            elif n is 1: outputln("|  Σ$%3i" % level.bank)
            elif level.lives > 1 and n is 2:
                outputln("|  ♡ %3i" % level.lives)
            elif (level.lives > 1 and n is 3) or n is 2:
                outputln("|  Press h for help")
            else: outputln("|")
        output("+" + "---"*width + "-+")
        if self.height is 2:
             outputln("  Press h for help")
        else: outputln()
        outputln()
        outputln(self.last_message)
        output()
        
        if not curses.isendwin():
            screen.refresh()
    
    def display(self,item):
        """Prints out a gameplay item, either on the curses screen, or stdout if end_game is True."""
        colour = item.colour
        text = item.disp
    
        if curses.isendwin():
          if colour:
              print(colored(text, ("","red","yellow","cyan","magenta")[colour]), end="")
          else:
              print(text,end="")
        else:
          if colour:  screen.addstr(text, curses.color_pair(colour))
          else: screen.addstr(text)
    
    def message(self, message=""):
        """Add a message to the bottom of the gameplay map. Clear the message by passing no arguments."""
    
        self.last_message = message
        self.draw()
    
    def scroll(self,d):
        """Pan screen by one click.
    
        d = 0 => down
        d = 1 => right
        d = 2 => up
        d = 3 => left
        """
    
        change = 1-2*(d//2) # 1 => down/right; -1=> up/left
        direction = d % 2 # 0 => y; 1 => x
    
        if direction is 0:
            self.scrolly = (self.scrolly+change) % self.height
        else:
            self.scrollx = (self.scrollx+change) % self.width
    
        self.draw()
    
    def scroll_me(self):
        display = self.level.display
        if display[0] is not 0:
            i = self.height
            while (not(0 < (self.me[0] - self.scrolly) % self.height)
                   and i is not 0):
                self.scrolly-=1
                i-=1
            
            i = self.height
            while (not((self.me[0] - self.scrolly) % self.height < display[0]-1)
                   and i is not 0):
                self.scrolly+=1
                i-=1
        
        if display[1] is not 0:
            i = self.width
            while (not(0 < (self.me[1] - self.scrollx) % self.width)
                   and i is not 0):
                self.scrollx-=1
                i-=1
            
            i = self.width
            while (not((self.me[1] - self.scrollx) % self.width < display[1]-1)
                   and i is not 0):
                self.scrollx+=1
                i-=1

class Game:
    #define some levels
    levels = [
              #width  #mines          #mobs
                  #height #coins          #view
        Level(  2,  2,  0,{1: 1}),
        Level(  5,  5,  4,{1: 4}),
        Level(  4,  4,  4,{1: 1}),
        Level(  5,  5,  4,{1: 4}),
        Level(  6,  6,  6,{1: 4}, life = 1),
        Level(  5, 15, 10,{1: 5},       0, [ 0, 8]),
        Level(  5,  5,  7,{1: 5},       1),
        Level(  7,  7, 20,{1: 2},       2),
        Level(  8,  8,  5,{1:10}, portals = 1),
        Level( 11, 11, 30,{1:12,5: 2},  1, portals = 1),
        Level(  5, 15, 20,{1: 5,5: 3},  3, [ 0, 8], life = 1),
        Level( 12, 12, 40,{1: 5,5: 3},  2, [ 8, 8], 1),
        Level( 15, 15, 40,{1: 4,5: 6},  1, [10, 6]),
        Level( 15, 15, 80,{1: 5,5: 3},  5, [10,10], 4),
        Level( 15, 15,150,{10: 1},      1),
        Level( 20, 20,350,{20: 1},       0, [ 4, 4], life = 2),
        Level( 15, 15,100,{1:40,2:5,20:1},17)
    ]

    def next_level(self):
        """Set up the variables for the level."""
    
        if len(self.levels) is 0:
            self.level.message("You beat the game!")
            time.sleep(1)
            exit()
        self.level = self.levels.pop(0)
        self.level.game = game
        self.level.play()
    
    def play(game):
        init_curses()
        
        game.bank = 0
        game.lives = 1
        
        while True: game.next_level()
    
    def message(self, str=""):
        self.level.message(str)
    
    def draw(self):
        self.level.draw()

def score():
    """Request a name, and save the score."""
    
    game.message("Please enter your name")
    curses.curs_set(True)
    name = []
    pos = 0
    while True:
        key = screen.get_wch()
        if ord(key) >= 32 and ord(key) is not 127:
            name.insert(pos,key)
            pos += 1
        elif ord(key) is 10:
            break
        elif ord(key) is 27:
            screen.nodelay(True)
            nextkey = screen.getch()
            thirdkey = screen.getch()
            screen.nodelay(False)
            if nextkey is -1:
                raise KeyboardInterrupt()
            elif nextkey is 91: # arrow key
                if thirdkey is 66: #down
                    pos=len(name)
                elif thirdkey is 67: #right
                    pos=min(pos+1,len(name))
                elif thirdkey is 65: #up
                    pos=0
                elif thirdkey is 68: #left
                    pos=max(pos-1,0)
        elif ord(key) is 127:
            if pos is not 0: pos -= 1
            name.pop(pos)
        
        screen.move(game.level.height+4,0)
        screen.clrtoeol()
        screen.addstr(game.level.height+4,0, "".join(name), curses.color_pair(3))
        screen.move(game.level.height+4,pos)
        screen.refresh()
    
    name = "".join(name)
    curses.curs_set(False)
    scores = get_scores()
    
    if len(scores) is 0:
        game.message("Welcome to the dungeon, you scored %i" % (game.bank))
    elif game.bank > scores[0]["num"]:
        game.message("New high score: %i by %s" % (game.bank, name))
    else:
        game.message("Well done, you scored %i" % (game.bank))
    
    scores.append({"name": name, "num": game.bank})
    scores = sorted(scores, key=lambda score: score["num"], reverse=True)
    
    save_scores(scores)

def get_scores():
    scores = []
    if os.path.isfile(SCORES_FILE):
        with open(SCORES_FILE, 'r') as file:
            scores = json.loads(file.read())
    
    return scores

def save_scores(scores):
    scores = scores[:99]
    with open(SCORES_FILE, 'w') as file:
        file.write(json.dumps(scores))

def show_scores():
    scores = get_scores()
    if len(scores) is 0:
        screen.clear()
        screen.addstr(0,0,"x~~HIGHSCORES~~~")
        screen.addstr(2,0," No scores found")
        screen.refresh()
        screen.getch()
        return
    
    longest_name = min(
                       50,
                       len(max(
                               scores,
                               key=lambda score: len(score["name"])
                              )["name"])
                      )
    longest_score = len(str(max(
                                scores,
                                key=lambda score: len(str(score["num"]))
                               )["num"]))
    
    num_to_show = 7
    scrollpos = 2
    
    if longest_name + longest_score < 7:
        longest_name = 7 - longest_score

    def print_scores():
        screen.clear()
        header = "x" + "~"* (math.floor((longest_name + longest_score - 5)/2)) + "HIGHSCORES" + "~" * (math.ceil((longest_name + longest_score - 5)/2))
        screen.addstr(0,0,header)
        screen.addstr(1,0, ("01) %"+str(longest_name)+"."+str(longest_name)+"s: %i") % (scores[0]["name"], scores[0]["num"]))
        if scrollpos is not 2 and len(scores) is not 1:
            screen.addstr(2,0, "-"*(longest_name + longest_score + 6))
            for x in range(scrollpos,min(scrollpos + num_to_show - 2,len(scores)+1-scrollpos)):
                screen.addstr(x-scrollpos+3,0, ("%02i) %"+str(longest_name)+"."+str(longest_name)+"s: %i") % (x+1, scores[x]["name"], scores[x]["num"]))
            
        else:
            for x in range(1,min(num_to_show,len(scores))):
                screen.addstr(x+1,0, ("%02i) %"+str(longest_name)+"."+str(longest_name)+"s: %i") % (x+1, scores[x]["name"], scores[x]["num"]))
        
        screen.addstr(min(num_to_show,len(scores))+2,1,"Press c to clear scores")
        
        screen.refresh()
    
    print_scores()
    
    def scroll_scores(dir):
        nonlocal scrollpos
        
        scrollpos += dir
        
        if scrollpos < 3:
            scrollpos = 2
        elif scrollpos > len(scores) - num_to_show - 5:
            scrollpos = len(scores) - num_to_show - 5
        
        print_scores()
    
    while True:
        key = screen.getkey().lower()
        if key == "\x1b":
            screen.nodelay(True)
            nextkey = screen.getch()
            thirdkey = screen.getch()
            screen.nodelay(False)
            if nextkey is -1:
                map.draw()
                break
            elif nextkey is 91: # arrow key
                if thirdkey is 65: #up
                    scroll_scores(-1)
                if thirdkey is 66: #down
                    scroll_scores(1)
                if thirdkey is 67: #right
                    scroll_scores(10)
                if thirdkey is 68: #left
                    scroll_scores(-10)
        elif key == "c":
            screen.clear()
            screen.addstr(0,0,"Are you sure you want to clear scores?")
            screen.addstr(1,0,"Press enter or y to confirm.")
            screen.refresh()
            
            key=screen.getkey().lower()
            if key in {"Y", "\x0a"}:
                save_scores([])
                map.draw()
                break
            else:
                print_scores()
        else: break

def show_help():
    screen.clear()
    screen.addstr(0,0,HELPTEXT)
    screen.getkey()

def check_update():
    def version_compare(old, new):
        if old == new: return 0
        O = [int(o) for o in old.split('.')]
        N = [int(n) for n in new.split('.')]
        if O[0] < N[0]: return 1
        elif O[0] > N[0]: return -1
        else:
            if len(O) == 1 and len(N) == 1:
                return 0
            elif len(O) == 1:
                O.append(0)
            elif len(N) == 1:
                N.append(0)

        if O[1] < N[1]: return 1
        elif O[1] > N[1]: return -1
        else:
            if len(O) == 2 and len(N) == 2:
                return 0
            elif len(O) == 2:
                O.append(0)
            elif len(N) == 2:
                N.append(0)

            if O[2] < N[2]: return 1
            elif O[2] > N[2]: return -1
            else: return 0

    url = 'http://xsanda.me/projects/dungeon/dungeon.py'
    with urllib.request.urlopen(url) as code:
        shebang = str(code.readline())
        versionline = code.readline()
    new_version = versionline[11:-2].decode('utf8')
    update_code = version_compare(VERSION, new_version)
    if update_code == 1:
        game.message("Update available: v%s (current version %s). Would you like to update? y/n" % (new_version, VERSION))
        key=screen.getkey().lower()
        if key == "y" or ord(key) is 10:
            game.message("Now updating.")
            update()
        else: game.message("Update cancelled.")
    elif update_code == 0:
        game.message("You're on the latest version.")

def update():
    url = 'http://xsanda.me/projects/dungeon/dungeon.py'
    
    try:
        with urllib.request.urlopen(url) as code,\
             open(os.path.realpath(__file__), "w") as save:
            save.write(code.read().decode('utf8'))
    
    except:
        game.message("Update error. If this game no longer plays, redownload from '%s'." % url)

def init_curses():
    global screen
    screen = curses.initscr()
    curses.start_color()
    curses.init_pair(1, curses.COLOR_RED, 0)
    curses.init_pair(2, curses.COLOR_YELLOW, 0)
    curses.init_pair(3, curses.COLOR_CYAN, 0)
    curses.init_pair(4, curses.COLOR_MAGENTA, 0)
    curses.init_pair(5, curses.COLOR_GREEN, 0)
    curses.noecho()
    curses.cbreak()
    curses.curs_set(False)

game = Game()
try:
    game.play()
except (KeyboardInterrupt):
    game.message("Game quit")
except (SystemExit):
    try: score()
    except (KeyboardInterrupt):
        game.message("You died")
finally:
    curses.endwin()
    game.draw()

# CHANGELOG
""" Done:
    - Add highscores 0.1.0
    - Add help, with version 0.1.0
    - Zoom by four (didn't work, removed) 0.1.1α
    - Add "clear highscores" 0.1.0
    - Tidy highscores: border, scrolling. Add quit function: [x]|[Esc]|[q] instead of time 0.1.0
    - Use Item 0.1.1
    - Add subclasses of Item 0.1.1
    - Merge coins and notes 0.1.1
    - Add big scrolling maps 0.1.2
    - Scroll to dead 0.1.2
    - Add "can't reach" button: all things are now reachable 0.1.3
    - Add auto-update 0.1.4
    - Add portals 0.1.4
    - New URL 0.1.6
    - Game object 0.2.0
    - Lives 0.2.1
    
    Todo:
    - Retry in game: full menu
    - Increase documentation
    - Localisation
    - Multiple files?
    - Score object
    - More levels: too easy with lives!
"""