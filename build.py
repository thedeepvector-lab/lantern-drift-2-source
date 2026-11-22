#!/usr/bin/env python3
"""Join the source modules into one self-contained page: dist/index.html"""
import os, re
ORDER = ['core', 'audio', 'world', 'light', 'player', 'things', 'enemies', 'render', 'draw', 'levels', 'ui', 'main']
here = os.path.dirname(os.path.abspath(__file__))
src = '\n'.join(open(f'{here}/src/{n}.js').read() for n in ORDER)
html = open(f'{here}/index.template.html').read().replace('/*__SRC__*/', src)
os.makedirs(f'{here}/dist', exist_ok=True)
open(f'{here}/dist/index.html', 'w').write(html)
open(f'{here}/dist/game.js', 'w').write("(() => {\n'use strict';\n" + src + "\n})();\n")
print('built', len(html) // 1024, 'KB,', src.count('\n'), 'lines of game code')
