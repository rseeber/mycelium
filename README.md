# Mycelium 🍄

Mycelium is an 11ty-powered project that allows users to create, edit, and publish a website all within their browser, without ever (needing) to see a single line of markdown or html code. Future plans exist to extend beyond just the webHost program, and also make a module titled LinkBin, which will be a social, link-sharing service on the Social Web (aka "[fediverse](https://en.wikipedia.org/wiki/Fediverse)") via [ActivityPub](https://en.wikipedia.org/wiki/ActivityPub). You can read more about these plans in the [ROADMAP.md](/ROADMAP.md).


## Clone project and git submodules

This project uses a submodule to handle the WYSIWYG markdown editor. As a result, you need to run 2 additional commands in order to be all set up and running:

```
# Clone the project
git clone https://github.com/rseeber/linkBin.git

# Initialize the submodules
git submodule init

# Fetch code from the submodules
git submodule update
```

Changes made to a submodule are tracked by the repo the submodule points to. The editor submodule is an in-house fork, so feel free to make PRs to it if the need arises.


## Prerequisites

This project has 3 moving parts: 

1. the web app (the user dashboard where you can edit your webpage), 
2. the API (which is how the web app can modify real data), 
3. and the deployed site (which can be deployed using any HTTP mechanism of your choosing).

You will need to install some `npm` packages into the web app, as well as into the source folder for the deployed sites.

### Install all dependencies

From the root of the project, call:

```
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
python -m venv venv
source venv/bin/activate
# Required: install the pip dependencies
pip install fastapi

```

## Clone the demo folder

We don't track user data fields in the git repo (otherwise, any amount of experimentation on the app would make changes to the git log). Thus, you will need to copy the skeleton folder over to our default (currently hard-coded) user, by calling the following from the root of the repo:

```
# Copy the skeleton to the default user
cp websites/src/demoSite websites/src/exampleSite -r
```

## Run the program

To easily start all 3 programs, simply call from the root of the project:

```
./run.sh
```

### Now test it

You've got everything running, now simply open the web app (it should be located at http://localhost:5173/) in your browser.

Also go ahead and check out your live site (after you hit "Publish") at http://127.0.0.1:8080/.

# Contributing

You can check out our [CONTRIBUTORS.md](/CONTRIBUTORS.md) and [ROADMAP.md](/ROADMAP.md) files for more information on how to contribute to the project.
