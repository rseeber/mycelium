#!/bin/bash
# Edit these values if you want a different default user to be setup
user="testuser"
email="$user@email"
password="password"

# Edit this value to change the default location of where you want
# HTML output of user websites to be saved
# (a symlink to this location will be created at `websites/dist`)
MYCELIUM_HTML_DIR="/var/www/mycelium"

# Install npm dependencies into the web app
echo "Installing dependencies for the 'WebHost' web app"
cd app/WebHost
npm install

# Go back to the root of the project
cd ../..

# Create the `websites/data/` folder and it's `emails.json` file
cd websites
mkdir data
if test -f data/emails.json; then
    echo "emails.json exists"
else
    echo "{}" > data/emails.json
fi

# check if dist/ exists (as symlink or dir)
if test -h dist || test -d dist; then
    echo "dist/ exists"
else
    # create the symlink
    ln -sn $DEFAULT_MYCELIUM_DIR dist
# now check that the place it links to exists (if it's a symlink)
if test -h dist; then
    # this derefences dist and checks if the dir it points to exists
    if test -d dist; then
        echo "endpoint of dist/ symlink exists"
    else
        mkdir $(readlink dist)

# Go back to the root of the project
cd ..

# Install npm dependencies into the source folder for the deployed websites
echo "Installing static site generator (11ty) and its dependencies"
cd websites/src
npm install

# Go back to the root of the project
cd ../..

# Compile slim
cd websites/SLIM-cli
make

# Go back to the root of the project
cd ../..

# Install python dependencies for the API Handler
# Optional: create a Python virtual environment
echo "Creating a virtual environment for the python API handler program, and installing pip libraries"
python3 -m venv venv
source venv/bin/activate
# Required: install the pip dependencies
pip install fastapi fastapi[standard]

# Now create the default user for testing purposes
cd websites
python3 -c "import api_handler as api; \
api.create_account({'username':'$user', 'password':'$password', 'email': '$email'})"