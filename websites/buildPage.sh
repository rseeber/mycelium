#!/bin/bash

# if no $site argument was passed in, exit
if [ $# -lt 1 ]; then
    echo "missing positional argument: 'site'";
    exit;
fi
if [ $# -lt 2 ]; then
    echo "missing positional argument: 'page'";
    exit;
fi
site=$1;
page=$2;

input="src/$site/$page";

# next, run 11ty
export DEMO=1;
npx @11ty/eleventy --config=./prebuild.config.js --input=$input --to=json;