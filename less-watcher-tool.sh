#!/usr/bin/env sh

proj_path=$(dirname "$0")
"${proj_path}/node_modules/.bin/lessc" "$1" | "${proj_path}/node_modules/.bin/cleancss" -O2 -o "$2"