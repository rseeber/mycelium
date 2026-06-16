#!/bin/bash
if [ $# -lt 1 ]; then
    exit;
fi
site=$1;
cd src/$site;
npx @11ty/eleventy --output=../../web/$site