#!/bin/bash
if [[ $1 ]]; then
    autopep8 --in-place --aggressive --aggressive $@
    echo "Formatted $@."
else
    echo "No filename provided."
fi
