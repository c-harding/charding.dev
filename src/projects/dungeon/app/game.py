import curses, math
from random import random, randint
from UI import sleep
from score import score

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
    
    @classmethod
    def new_game(cls):
        cls.__number = 0
    
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
        
            elif key == "w":
                map.scroll(2)
            elif key == "a":
                map.scroll(3)
            elif key == "s":
                map.scroll(0)
            elif key == "d":
                map.scroll(1)
        
            map.draw()
            screen.move(self.height+4,0)
            screen.refresh()

            if self.win is True:
                sleep(1)
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
        for y, n in map:
            for x, item in map.cells(y):
                if item.name is "mob":
                    mob_locs[item.id] = (y, x)
    
        for mob in mob_locs:
            if mob is False: continue
            
            lose = False
            
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
                meItem = map[new_pos]
                lose = True
            self.add_coin(0)
        
            map[new_pos] = map[mob]
            if lose: map[new_pos].got_me()
            map[mob] = Blank()
        
            map.draw()
        
            if lose: self.lose_life(meItem)
    
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
            sleep(1)
            
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
            else: outputln("|")
        outputln("+" + "---"*width + "-+")
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

    def next_level(self):
        """Set up the variables for the level."""
        if len(self.levels) is 0:
            self.level.message("You beat the game!")
            sleep(1)
            exit()
        self.level = self.levels.pop(0)
        self.level.game = self
        self.level.play()
    
    def __init__(self, scrn):
        Level.new_game()
        self.levels = [
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
        global screen
        screen = scrn
        screen.clear()
        screen.refresh()
        self.bank = 0
        self.lives = 1
        
        try:
            while True:
                self.next_level()
        
        except (KeyboardInterrupt):
            self.message("Game quit")
        except (SystemExit):
            score(self.bank, screen,self.message,self.level.height+4)
            sleep(0.5)
        except:
            raise
        finally:
            screen.clear()
    
    def message(self, str=""):
        self.level.message(str)
    
    def draw(self):
        self.level.draw()