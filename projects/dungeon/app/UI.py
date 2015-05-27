import update, curses, math, time

class UI:
    width = 1
    height = 1
    show = True
    
    def close(self):
        self.show = False
    
    def __init__(self, screen):
        self.screen = screen
        screen.clear()
        self.win = curses.newwin(self.height + 1, self.width)
        self.centre()
        self.run()
    
    def centre(self):
        self.win.clear()
        self.win.refresh()
        scr_width = self.screen.getmaxyx()[1]
        tl = max(0,(scr_width - self.width)//2)
        self.win.mvwin(0, tl)
    
    def draw(self):
        win = self.win
        win.refresh()
    
    def pad(self, str="", width=None, pos=1, filler=" "):
        if width is None:
            width = self.max_len
        
        to_add = width - len(str)
        start = math.floor(to_add/2)
        end = math.ceil(to_add/2)
        
        output = [filler*start, filler*end]
        output.insert(pos,str)
        return "".join(output)
    
    def pr(self, *args, **kwargs):
        try:
            self.win.addstr(*args, **kwargs)
        except curses.error:
            self.close()
            raise
    
    def run(self):
        while self.show:
            self.draw()
            self.getch()
        self.win.clear()
        self.win.refresh()
    
    def getch(): pass

def sleep(t):
    try: time.sleep(t)
    except KeyboardInterrupt:
        pass