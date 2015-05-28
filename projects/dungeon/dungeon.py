#!/usr/bin/env python3
VERSION = "1.0.0"
#so it's always newer than the existing version, for legacy updates

import os, stat
import sys, os.path

if sys.version_info[0] < 3:
    print('This version of python is too old to run Dungeon.\nPlease run the installer with python 3 or newer.\nIt may already be installed,\ntry running `python3 path/to/this/file.py`.')
    exit()

import urllib.request

p = eval("print") # otherwise print with args is a syntax error in python2

url = 'http://xsanda.me/projects/dungeon/app'
files = [
    "UI.py",
    "game.py",
    "help.py",
    "launcher.py",
    "score.py",
    "update.py",
    "version"
]
directory = os.path.join(os.path.dirname(__file__),"dungeon_game/")

def update():
    fileNo = 0
    p("\033[?25l")
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        for file in files:
            p("\033[1F    Completing update: file " + str(fileNo+1) + "/" + str(len(files)+1))
            fileNo += 1
            with urllib.request.urlopen(url + "/" + file) as code,\
                 open(os.path.join(directory, file), "w") as save:
                save.write(code.read().decode('utf8'))
    
        p("\033[1F    Completing update: file " + str(fileNo+1) + "/" + str(len(files)+1))
        os.remove(os.path.join(os.path.dirname(__file__), "dungeon.py"))
        os.symlink(
                   os.path.join(os.path.dirname(__file__), "dungeon_game/launcher.py"),
                   os.path.join(os.path.dirname(__file__), "dungeon.py")
                  )
        file = os.path.join(os.path.dirname(__file__), "dungeon.py")
        os.chmod(file, os.stat(file).st_mode | stat.S_IEXEC)
        
        file = os.path.join(directory, "launcher.py")
        os.chmod(file, os.stat(file).st_mode | stat.S_IEXEC)
        
        if os.path.exists(os.path.join(os.path.dirname(__file__), "dungeon_scores.json")):
            os.rename(
                      os.path.join(os.path.dirname(__file__), "dungeon_scores.json"),
                      os.path.join(os.path.dirname(__file__), "dungeon_game/scores.json")
                     )
        
        p("\033[?25h", end="")
    except KeyboardInterrupt:
        p("\033[?25h", end="")
    except:
        p("\033[?25h", end="")
        raise

update()