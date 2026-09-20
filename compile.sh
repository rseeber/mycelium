#!/bin/bash

# Install npm dependencies into the web app
cd app/WebHost
npm install

# Go back to the root of the project
cd ../..

# Install npm dependencies into the source folder for the deployed websites
cd websites/src
npm install

# Go back to the root of the project
cd ../..

# Install python dependencies for the API Handler
# Optional: create a Python virtual environment
python3 -m venv venv
source venv/bin/activate
# Required: install the pip dependencies
pip install fastapi