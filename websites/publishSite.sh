#!/bin/bash

# if no $site argument was passed in, exit
if [ $# -lt 1 ]; then
    echo "missing positional argument: 'site'";
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
echo "clearing $output/* and $output/.*";
rm -rf $output/*;
rm -rf $output/.*;

# next, run 11ty in the input folder
cd $input
npx @11ty/eleventy --config=../../eleventy.config.js --output="../../$output";