import curses, update, os, json, time
from UI import UI

SCORES_FILE = os.path.join(os.path.dirname(__file__), 'scores.json')

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

def score(score, screen, text, row):
    """Request a name, and save the score."""
    
    text("Please enter your name")
    curses.curs_set(True)
    name = []
    pos = 0
    try:
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
        
            screen.move(row,0)
            screen.clrtoeol()
            screen.addstr(row,0, "".join(name), curses.color_pair(3))
            screen.move(row,pos)
            screen.refresh()
    except KeyboardInterrupt:
        curses.curs_set(False)
        text("Score discarded")
        return
    
    name = "".join(name)
    curses.curs_set(False)
    scores = get_scores()
    
    if len(scores) is 0:
        text("Welcome to the dungeon, you scored %i" % (score))
    elif score > scores[0]["num"]:
        text("New high score: %i by %s" % (score, name))
    else:
        text("Well done, you scored %i" % (score))
    
    scores.append({"name": name, "num": score})
    scores = sorted(scores, key=lambda score: score["num"], reverse=True)
    
    save_scores(scores)

class Scores(UI):
    title = "Dungeon"
    sub = "Highscores"
    version = update.get_version()
    errormsg = "No scores found"
    
    scoreslist = get_scores()
    
    try:
        longest_name = min(
                           50,
                           len(max(
                                   scoreslist,
                                   key=lambda score: len(score["name"])
                                  )["name"])
                          )
        longest_score = len(str(max(
                                    scoreslist,
                                    key=lambda score: score["num"]
                                   )["num"]))
    except ValueError:
        longest_name = longest_score = 0
    
    max_len = max(longest_name + longest_score + 6, len(title), len(sub), len(errormsg), 1+len(version))
    width = max_len+4
    innerheight = max(1,len(scoreslist))
    pos = 2
    
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
        self.pr(self.pad(self.title),curses.A_BOLD)
        self.pr(" │")
        self.pr("│ " + self.pad(self.sub) + " │")
        self.pr("│ " + self.pad("v"+self.version) + " │")
        self.pr("│ " + self.pad() + " │")
        if len(self.scoreslist) is 0:
            self.pr("│ " + self.pad("No scores found") + " │")
        else:
            self.pr(
                "│ 01) " + self.pad(self.scoreslist[0]["name"], self.longest_name, 2) +
                ": " + self.pad(str(self.scoreslist[0]["num"]), self.longest_score, 0) +
                " |"
            )
            if self.pos is not 2 and len(self.scoreslist) > 1:
                self.pr("| " + "-"*self.max_len + " │")
                for x in range(
                               self.pos,
                               min(
                                   self.pos + self.outerheight - 2,
                                   1000#len(self.scoreslist)+1-self.pos
                                  )
                              ):
                    self.pr(
                        "│ "+
                        self.pad(str(x), 2, 2, "0")+
                        ") " +
                        self.pad(self.scoreslist[x]["name"], self.longest_name, 2) +
                        ": " +
                        self.pad(str(self.scoreslist[x]["num"]), self.longest_score, 0) +
                        " |"
                    )
            else:
                for x in range(1,min(self.outerheight,len(self.scoreslist))):
                    self.pr(
                        "│ "+
                        self.pad(str(x+1), 2, 2, "0")+
                        ") " +
                        self.pad(self.scoreslist[x]["name"], self.longest_name, 2) +
                        ": " +
                        self.pad(str(self.scoreslist[x]["num"]), self.longest_score, 0) +
                        " |"
                    )
        
        self.pr("└─" + "─"*self.max_len + "─┘")
        win.refresh()
        self.screen.refresh()
    
    def scroll(self,d):
        d = int(d)
        self.pos = max(2,min(self.pos+d,self.innerheight - self.outerheight + 2))
    
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
            self.close()
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