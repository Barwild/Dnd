import os

# Paths relative to the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
jsx_path = os.path.abspath(os.path.join(script_dir, '../../app/src/pages/CharacterSheet.jsx'))
new_layout_path = os.path.abspath(os.path.join(script_dir, 'new_print_layout.txt'))

print(f"JSX Path: {jsx_path}")
print(f"New Layout Path: {new_layout_path}")

# Read original file
with open(jsx_path, 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# Read replacement content
with open(new_layout_path, 'r', encoding='utf-8') as f:
    new_layout = f.read()

# Locate print layout comment
target_comment = '{/* ═══════ PRINT LAYOUT — Official D&D 5E Spanish Sheet ═══════ */}'
start_idx = jsx_content.find(target_comment)
if start_idx == -1:
    # try matching without double spaces or specific chars
    for line_idx, line in enumerate(jsx_content.splitlines()):
        if 'PRINT LAYOUT' in line and 'Official D&D 5E Spanish Sheet' in line:
            start_idx = jsx_content.find(line)
            break

if start_idx == -1:
    print("ERROR: Could not find start comment index!")
    exit(1)

# Find the end of the file closing structure
end_marker = '    </div>\n  );\n}'
end_idx = jsx_content.find(end_marker, start_idx)
if end_idx == -1:
    end_marker = '    </div>\r\n  );\r\n}'
    end_idx = jsx_content.find(end_marker, start_idx)

if end_idx == -1:
    # Try finding the last occurrence of );\n}
    end_marker = ');\n}'
    end_idx = jsx_content.rfind(end_marker)
    if end_idx != -1:
        # back up to find the </div> before it
        div_idx = jsx_content.rfind('</div>', start_idx, end_idx)
        if div_idx != -1:
            # We want to replace up to the div closure (not including it if it belongs to container)
            # Actually, the div right before is the print-sheet wrapper, which is replaced.
            # The div at line 1374 is the main container wrapper. We want to preserve it.
            # Let's count divs. Or let's see.
            pass

if end_idx == -1:
    print("ERROR: Could not find end marker index!")
    exit(1)

# We want to replace everything from start_idx up to the end_marker
# The end_marker itself (e.g. '    </div>\n  );\n}') contains the container closing div and the return closure.
# So our replacement code does:
# ... new_layout ... + '\n' + end_marker
# Let's verify: new_layout has the closing `</div>` for print-sheet.
# So new_layout ends with `    </div>\n  );\n}` ? No, new_layout ends with `      })()}\n\n    </div>` (wait, new_layout ends with `      })()}\n\n    </div>` which closes print-sheet or print-page?
# Let's check new_layout closure:
# It returns the print-sheet element:
# `return ( <div className="print-sheet"> ... </div> ); })() \n\n </div>`
# Wait! Let's make sure the brackets match perfectly.
# jsx_content[end_idx:] will contain the end_marker, which is `    </div>\n  );\n}`.
# This closes the main container `div` and the render block!
# So replacing jsx_content[start_idx:end_idx] with new_layout is perfectly correct!

new_content = jsx_content[:start_idx] + new_layout + '\n' + jsx_content[end_idx:]

with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Print layout replaced successfully in CharacterSheet.jsx!")
