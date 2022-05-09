#!/usr/bin/env python3
import update, math, curses
from UI import UI
from game import Game
from help import Help
from score import Scores

class Menu(UI):
    name = "Dungeon"
    dev = "by Xsanda"
    version = update.get_version()
    
    options = [
        ["Play game", lambda: Game(screen)],
        ["View leaderboard", lambda: Scores(screen)],
        ["Help", lambda: Help(screen)],
        ["Check for updates", lambda: update.Updater(screen)],
        ["Quit", exit]
    ]
    
    max_title = len(max(name, dev, version, key=len))
    max_item = len(max(options, key=lambda x:len(x[0]))[0])
    max_len = max(max_title, max_item)

    pos = 0

    width = 4+max_len
    height = 7+len(options)
    
    def draw(self):
        win = self.win
        
        win.clear()
        self.pr(0,0,"┌─" + "─"*self.max_len + "─┐")
        self.pr("│ ")
        self.pr(self.pad(self.name),curses.A_BOLD)
        self.pr(" │")
        self.pr("│ " + self.pad(self.dev) + " │")
        self.pr("│ " + self.pad("v"+self.version) + " │")
        self.pr("│ " + self.pad() + " │")
        for i, option in enumerate(self.options):
            self.pr("│ ")
            if i == self.pos: self.pr(self.pad(option[0]), curses.color_pair(10))
            else: self.pr(self.pad(option[0]))
            self.pr(" │")
        self.pr("└─" + "─"*self.max_len + "─┘")
        win.refresh()
        screen.refresh()
    
    def getch(self):
        self.draw()
        
        try:
            key = self.screen.get_wch()
        except KeyboardInterrupt:
            exit()
        
        try:
            ordkey = ord(key)
        except TypeError:
            ordkey = key

        if ordkey is 10:
            self.options[self.pos][1]()
        elif ordkey is 27:
            screen.nodelay(True)
            nextkey = screen.getch()
            thirdkey = screen.getch()
            screen.nodelay(False)
            if nextkey is -1:
                exit()
            elif nextkey is 91: # arrow key
                if thirdkey is 66: #down
                    self.pos=min(self.pos+1,len(self.options)-1)
                elif thirdkey is 67: #right
                    self.pos=len(self.options)-1
                elif thirdkey is 65: #up
                    self.pos=max(self.pos-1,0)
                elif thirdkey is 68: #left
                    self.pos=0
        elif key == curses.KEY_RESIZE:
            self.centre()

screen = curses.initscr()
curses.start_color()
curses.noecho()
curses.cbreak()
curses.curs_set(False)
curses.init_pair(10,curses.COLOR_BLACK, curses.COLOR_WHITE)
curses.init_pair(1, curses.COLOR_RED, 0)
curses.init_pair(2, curses.COLOR_YELLOW, 0)
curses.init_pair(3, curses.COLOR_CYAN, 0)
curses.init_pair(4, curses.COLOR_MAGENTA, 0)
curses.init_pair(5, curses.COLOR_GREEN, 0)

try:
    Menu(screen)
except:# (SystemExit, KeyboardInterrupt):
    curses.endwin()
    raise