import update, re, curses
from UI import UI

class ct: #colourtext
    def __init__(self, string="\n", colour = None, bold=False):
        self.string = str(string)
        self.colour = colour
        self.bold = bold
    
    def __add__(self, other):
        return cl(self, other)
    
    def __radd__(self, other):
        return cl(other, self)
    
    def __str__(self):
        return self.string
    
    def __repr__(self):
        return "<ct"+(" colour="+str(self.colour) if self.colour else "")+">"+self.string + "</ct>"
    
    def __len__(self):
        return len(self.string)
    
    def split(self, a, l = None, midline = True):
        if l is None: l = a
        paras = self.string.split("\n")
        listparas = []
        for para in paras:
            list = re.findall(" ?[^ \-]+(?: |\-|$)",para)
            lines = []
            while len(list) is not 0:
                line = ""
                quota = a if midline else l
                room = True
                while len(list) is not 0 and room:
                    if len(line)+len(list[0]) <= quota:
                        line += list.pop(0)
                    else:
                        room = False
                        if list[0][-1] == " " and len(line)+len(list[0]) == quota+1:
                            line += list.pop(0)[:-1]
                        elif len(line) is 0 and midline is False:
                            space = quota - len(line)
                            line += list[0][:space]
                            list[0] = list[0][space:]
                
                midline = False
                lines.append(ct(line, self.colour, self.bold))
            listparas.append(lines)
        
        listlines = []
        for para in listparas:
            listlines += para + [ct("\n", self.colour, self.bold)]
        
        return listlines[:-1]

class cl: #coloured line
    def __init__(self, *items):
        self.contents = []
        for item in items:
            if isinstance(item, ct):
                self.contents.append(item)
            elif isinstance(item, cl):
                self.contents += item.contents
            elif item is None:
                self.contents.append(ct('\n'))
            else: self.contents.append(ct(str(item)))
        
    
    def __add__(self, other):
        return cl(self, other)
    
    def __radd__(self, other):
        return cl(other, self)
    
    def __getitem__(self,n):
        return self.contents[n]
    
    def __setitem__(self,n,val):
        self.contents[n] = val
    
    def __str__(self):
        return "".join(str(i) for i in self)
    
    def __iter__(self):
        for i in self.contents:
            yield i
    
    def __str__(self):
        return "".join(str(i) for i in self)
    
    def __repr__(self):
        return "<cl>"+ "".join(repr(item) for item in self) + "</cl>\n"
    
    def __len__(self):
        return sum(len(item) for item in self.contents)
    
    def split(self, l = 40):
        lines = []
        line = cl()
        for i in self:
            space = l - len(line)
            spliti = i.split(space, l)
            for n, text in enumerate(spliti):
                if n is not 0 and str(text) != "\n":
                    lines.append(line)
                    line = cl()
                if str(text) == "\n":
                    lines.append(line)
                    lines.append(cl())
                    line = cl()
                    continue
                line += cl(text)
        if len(line) != 0:
            lines.append(line)
        
        for n, line in enumerate(lines):
            if len(line) != l:
                if len(line) == 0:
                    lines[n] += ""
                lines[n][-1].string += " "*(l-len(line))
        return lines

class Help(UI):
    name = "Dungeon"
    dev = "by Xsanda"
    version = update.get_version()
    
    helptext = (ct("How to play:", bold = True) + None
    + cl("Use the arrow keys to control your piece, the brackets ",ct("()",colour=3),". The aim is to collect all the coins on the map, in order to advance to the next level. Do not move into any blockers ",ct("><",colour=1)," or monsters ",ct("M!",colour=1),", as these will kill you. If you see a pink ",ct(">1",colour=4),", this is a portal, and it will teleport you to the other portal with the same number.",None,
    "For the earlier levels, moving off the edge of the map will loop around to the other side. However, as the maps get harder the map will not all fit on one screen, so the map will pan as you approach the edge of the screen. The map is still a loop, you just have to travel further to get back to where you started. You can manually pan with the keys WASD. As the game advances, you can also collect lives ",ct(">1",colour=5),", to protect you against the perils of the dungeon.",None,
    "If and when you die, you will have to enter your name. Hit enter afterwards to save your score locally. You can view these scores from the main menu. This game is still in development, and so it may have updates available. Check regularly for updates on the main menu.",None,
    "Press Esc to return to the menu."))
    
    max_len = 40
    width = max_len+4
    helptext_lines = helptext.split(width-4)
    innerheight = len(helptext_lines)
    pos = 0
    
    def __init__(self, *args, **kwargs):
        print(args[0].getmaxyx())
        self.max_height = args[0].getmaxyx()[0]
        self.outerheight = min(self.max_height-10, self.innerheight)
        self.height = self.outerheight+6
        super().__init__(*args, **kwargs)
    
    def centre(self, *args, **kwargs):
        self.max_height = self.screen.getmaxyx()[0]
        self.outerheight = min(self.max_height-10, self.innerheight)
        self.height = self.outerheight+6
        self.scroll(0)
        super().centre(*args, **kwargs)
    
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
        for line in self.helptext_lines[self.pos:self.pos+self.outerheight]:
            self.pr("│ ")
            for item in line:
                params = 0
                if item.colour: params |= curses.color_pair(item.colour)
                if item.bold: params |= curses.A_BOLD
                self.pr(str(item), params)
            self.pr(" │")
        self.pr("└─" + "─"*self.max_len + "─┘")
        win.refresh()
        self.screen.refresh()
    
    def scroll(self,d):
        d = int(d)
        self.pos = max(0,min(self.pos+d,self.innerheight - self.outerheight))
    
    def getch(self):
        self.draw()
        
        try:
            key = self.screen.get_wch()
        except KeyboardInterrupt:
            self.close()
            return
        
        try:
            ordkey = ord(key)
        except TypeError:
            ordkey = key

        if ordkey is 10:
            self.options[self.pos][1]()
        elif ordkey is 27:
            self.screen.nodelay(True)
            nextkey = self.screen.getch()
            thirdkey = self.screen.getch()
            self.screen.nodelay(False)
            if nextkey is -1:
                self.close()
            elif nextkey is 91: # arrow key
                if thirdkey is 66: #down
                    self.scroll(1)
                elif thirdkey is 67: #right
                    self.scroll(self.outerheight)
                elif thirdkey is 65: #up
                    self.scroll(-1)
                elif thirdkey is 68: #left
                    self.scroll(-self.outerheight)
        elif key == curses.KEY_RESIZE:
            self.centre()