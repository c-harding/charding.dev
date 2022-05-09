import os, json, math, curses, urllib.request
from UI import UI

url = 'http://xsanda.me/projects/dungeon'
files = [
    "UI.py",
    "game.py",
    "help.py",
    "launcher.py",
    "score.py",
    "update.py",
    "version"
]

def get_version():
    version_file = os.path.join(os.path.dirname(__file__), 'version')
    this_version = ""
    if os.path.isfile(version_file):
        with open(version_file, 'r') as file:
            this_version = file.read().rstrip()
    return this_version

def check_update():
    this_version = get_version()
    with urllib.request.urlopen(url + "/version") as code:
        new_version = code.read().rstrip()
    new_version = new_version.decode('utf8')
    
    return new_version, version_compare(this_version, new_version)

def update(self=False):
    for file in files:
        if self is not False:
            self.text = "Now updating " + str(self.fileNo+1) + "/" + str(len(files))
            self.draw(True)
            self.fileNo += 1
        with urllib.request.urlopen(url + "/" + file) as code,\
             open(os.path.join(os.path.dirname(__file__), file), "w") as save:
            save.write(code.read().decode('utf8'))

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

class Updater(UI):
    title = "Updater"
    sub = "for Dungeon"
    version = get_version()
    
    state = 0
    
    def __init__(self, *args, **kwargs):
        self.show_state(0)
        super().__init__(*args, **kwargs)
    
    def show_state(self, state):
        self.state = state
        if state is 0:
            self.question = ["Do you want to check",
                             "online for updates?"]
            self.buttons  = ["[Yes]", "[No]"]
            self.button_actions = [
                lambda: self.show_state(1),
                self.close
            ]
    
            self.button = 0
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   max(self.question, key=len),
                                   " ".join(self.buttons),
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7+len(self.question)
        
        elif state is 1:
            self.text = "Checking online…"
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   self.text,
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7
        
        elif state is 2:
            self.question = ["Failed to reach server.",
                             "Retry?"]
            self.buttons  = ["[Yes]", "[No]"]
            self.button_actions = [
                lambda: self.show_state(1),
                self.close
            ]
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   max(self.question, key=len),
                                   " ".join(self.buttons),
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7+len(self.question)
        
        elif state is 3:
            self.question = ["You are on the latest version.",
                             "Press enter to return to the",
                             "main menu."]
            self.button_actions = [
                self.close,
                self.close
            ]
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   max(self.question, key=len),
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7+len(self.question)
        
        elif state is 4:
            self.textbase = "Now updating"
            self.fileNo = 0
            self.text = "Now updating " + str(self.fileNo) + "/" + str(len(files))
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   self.text,
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7
        
        elif state is 5:
            self.question = ["You have successfully updated.",
                             "Press enter to return to the",
                             "main menu."]
            self.button_actions = [
                self.close,
                self.close
            ]
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   max(self.question, key=len),
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7+len(self.question)
        
        elif state is 6:
            self.question = ["Update error.",
                             "If this game no longer plays,",
                             "redownload from",
                             url+"/installer.py"]
            self.button_actions = [
                self.close,
                self.close
            ]
            
            self.max_len = len(max(self.title,
                                   self.sub,
                                   "v"+self.version,
                                   max(self.question, key=len),
                                   key=len))
    
            self.width = 4+self.max_len
            self.height = 7+len(self.question)
        
        try:
            self.win.clear()
            self.screen.clear()
            self.screen.refresh()
            self.win.resize(self.height+1, self.width)
            self.centre()
        except AttributeError: pass
    
    def draw(self, fast=False):
        win = self.win
        
        win.clear()
        
        if self.state in (0,2): #check for updates? update?
            self.pr(0,0,"┌─" + "─"*self.max_len + "─┐")
            self.pr("│ ")
            self.pr(self.pad(self.title),curses.A_BOLD)
            self.pr(" │")
            self.pr("│ " + self.pad(self.sub) + " │")
            self.pr("│ " + self.pad("v"+self.version) + " │")
            self.pr("│ " + self.pad() + " │")
            for line in self.question:
                self.pr("│ " + self.pad(line) + " │")
        
            lpad = math.floor((self.max_len - len(" ".join(self.buttons)))/2)
            rpad = math.ceil((self.max_len - len(" ".join(self.buttons)))/2)
            self.pr("│ " + " "*lpad)
            for i, option in enumerate(self.buttons):
                if i == self.button: self.pr(option, curses.color_pair(10))
                else: self.pr(option)
                self.pr(" ")
            self.pr(" "*rpad + "│")
        
            self.pr("└─" + "─"*self.max_len + "─┘")
        
        elif self.state in (1,4): # checking, updating
            self.pr(0,0,"┌─" + "─"*self.max_len + "─┐")
            self.pr("│ ")
            self.pr(self.pad(self.title),curses.A_BOLD)
            self.pr(" │")
            self.pr("│ " + self.pad(self.sub) + " │")
            self.pr("│ " + self.pad("v"+self.version) + " │")
            self.pr("│ " + self.pad() + " │")
            self.pr("│ " + self.pad(self.text) + " │")
        
            self.pr("└─" + "─"*self.max_len + "─┘")
        
        elif self.state in (3,5,6): # no update, updated
            self.pr(0,0,"┌─" + "─"*self.max_len + "─┐")
            self.pr("│ ")
            self.pr(self.pad(self.title),curses.A_BOLD)
            self.pr(" │")
            self.pr("│ " + self.pad(self.sub) + " │")
            self.pr("│ " + self.pad("v"+self.version) + " │")
            self.pr("│ " + self.pad() + " │")
            for line in self.question:
                self.pr("│ " + self.pad(line) + " │")
        
            self.pr("└─" + "─"*self.max_len + "─┘")
        
        win.refresh()
        self.screen.refresh()
        
        if not(fast):
            if self.state is 1:
                try:
                    self.latest, self.update_avail = check_update()
                    if self.update_avail:
                        self.show_state(4)
                    else:
                        self.show_state(3)
                    self.draw()
                except (urllib.error.URLError, urllib.error.HTTPError, ConnectionResetError):
                    self.show_state(2)
                    self.draw()
        
            if self.state is 4:
                try:
                    update(self)
                    self.show_state(5)
                    self.draw()
                except (urllib.error.URLError, urllib.error.HTTPError):
                    self.show_state(6)
                    self.draw()
        
            if self.state in (1,4):
                self.screen.nodelay(True)
                while(self.screen.getch() is not -1): pass #discard intermediate keypresses
                self.screen.nodelay(False)
                
    
    def getch(self):
        screen = self.screen
        self.draw()
        
        try:
            key = self.screen.get_wch()
        except KeyboardInterrupt:
            self.show = False
            return
        
        try:
            ordkey = ord(key)
        except TypeError:
            ordkey = key

        if ordkey is 10:
            self.button_actions[self.button]()
        elif key in ('y', 'Y'):
            self.button_actions[0]()
        elif key in ('n', 'N'):
            self.button_actions[1]()
        elif ordkey is 27:
            screen.nodelay(True)
            nextkey = screen.getch()
            thirdkey = screen.getch()
            screen.nodelay(False)
            if nextkey is -1:
                self.close()
            elif nextkey is 91: # arrow key
                if thirdkey in range(65,69):
                    self.button = (self.button + 1) % 2
        elif key == curses.KEY_RESIZE:
            self.centre()