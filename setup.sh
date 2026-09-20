#!/bin/bash

# Install npm dependencies into the web app
echo "Installing dependencies for the 'WebHost' web app"
cd app/WebHost
npm install

# Go back to the root of the project
cd ../..

# Install npm dependencies into the source folder for the deployed websites
echo "Installing static site generator (11ty) and its dependencies"
cd websites/src
npm install

# Go back to the root of the project
cd ../..

# Install python dependencies for the API Handler
# Optional: create a Python virtual environment
echo "Creating a virtual environment for the python API handler program, and installing pip libraries"
python3 -m venv venv
source venv/bin/activate
# Required: install the pip dependencies
pip install fastapi fastapi[standard]