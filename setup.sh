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
echo "> Installing dependencies for the 'WebHost' web app"
cd app/WebHost
npm install

# Go back to the root of the project
cd ../..

# Create the `websites/data/` folder and it's `emails.json` file
cd websites
if test -d data || test -h data; then
	echo "> websites/data/ exists"
else
	echo "> creating websites/data/"
	mkdir data
fi
if test -f data/emails.json; then
    echo "> emails.json exists"
else
    echo "{}" > data/emails.json
fi
# Create the log directory as well
if test -d log || test -h log; then
	echo "> websites/log/ exists"
else
	echo "> creating websites/log/"
	mkdir log
fi


# check if dist/ exists (as symlink or dir)
if test -h dist || test -d dist; then
    echo "> dist/ exists"
else
    # create the symlink
    ln -sn $MYCELIUM_HTML_DIR dist
fi
# now check that the place it links to exists (if it's a symlink)
if test -h dist; then
    # this derefences dist and checks if the dir it points to exists
    if test -d dist; then
        echo "> endpoint of dist/ symlink exists"
    else
		sudo mkdir $(readlink dist) 
	fi
fi
# Set up the current user:group to be the owner of the symlinked location
sudo chown $(whoami):$(id -gn) $(readlink dist)

# Go back to the root of the project
cd ..

# Install npm dependencies into the source folder for the deployed websites
echo "> Installing static site generator (11ty) and its dependencies"
cd websites/src
npm install

# Go back to the root of the project
cd ../..

# Compile slim
cd websites/SLIM-cli
echo "> compiling slim..."
make

# Go back to the root of the project
cd ../..

# Install python dependencies for the API Handler
# Optional: create a Python virtual environment
echo "> Creating a virtual environment for the python API handler program, and installing pip libraries"
if test -d venv; then
	echo "> venv already exists"
else
	python3 -m venv venv
fi
source venv/bin/activate
# Required: install the pip dependencies
pip install fastapi fastapi[standard] filelock

# Now create the default user for testing purposes
cd websites
#python3 -c "import api_handler as api; \
#api.create_account({'username':'$user', 'password':'$password', 'email': '$email'})"
