#!/bin/bash
hour=$((10#$(date +%H)))

if   [ "$hour" -ge 5  ] && [ "$hour" -lt 12 ]; then greet="Good morning";  icon="☀️ "; color="33"   # yellow
elif [ "$hour" -ge 12 ] && [ "$hour" -lt 18 ]; then greet="Good afternoon"; icon="🌤️ "; color="36"   # cyan
elif [ "$hour" -ge 18 ] && [ "$hour" -lt 22 ]; then greet="Good evening";   icon="🌆"; color="35"   # magenta
else greet="Burning the midnight oil"; icon="🌙"; color="34"                                         # blue
fi

# Literal \u001b (not a raw ESC byte) so the text is already valid inside a JSON string; jq isn't available here.
esc='\u001b'
reset="${esc}[0m"
bold="${esc}[1m"
c="${esc}[${color}m"
green="${esc}[32m"

msg="${icon} ${bold}${c}${greet}, Sanjay!${reset} ${green}Let's do something cool in Claude Code today${reset} 🚀✨"
printf '{"systemMessage":"%s"}\n' "$msg"
