#!/bin/bash
# Edit these values if you want a different default user to be setup
user="testuser"
email="$user@email"
password="password"

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

# Go back to the root of the project
cd ..

# Install npm dependencies into the source folder for the deployed websites
echo "Installing static site generator (11ty) and its dependencies"
cd websites/src
npm install

# Go back to the root of the project
cd ../..

cd websites/SLIM-cli
make

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