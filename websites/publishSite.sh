#!/bin/bash

# if no $site argument was passed in, exit
if [ $# -lt 1 ]; then
    exit;
fi
site=$1;

output="dist/$site";
input="src/$site";

# this is to prevent stupid mistakes as this script gets edited in the future
if [[ $output == /* ]]; then
    echo "why is there a root at the beginning of the string!!?";
    exit;
fi;

# first, clean out the old contents of the output dir
echo "clearing $output/*";
rm -rf $output/*;     # change this to rm -rf at some point

# next, run 11ty
npx @11ty/eleventy --input=$input --output=$output;