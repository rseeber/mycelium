# Mycelium

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

You will need to have 3 terminals open in order to do thisi, running each application at the same time. For now, they need to all be on the same device so they can access each other via `localhost`.

### API Handler

Go into `websites/` and run the `api_handler.py` script:

```
cd websites/
fastapi dev api_handler.py
```

If this section ever gives you a command not found error, be sure to check that you're still using the python virtual environment: `source ../venv/bin/activate`


### Web App

You'll use `npm` to run the web app, as it is built with `vite`:

```
cd app/WebHost
npm run dev
```

### Deploy prod sites

This one is a little bit open ended. A proper solution is eventually going to be created, but for now we're using existing tools to bridge the gap.

We're going to serve the `exampleSite` folder over HTTP. From the root of the project, cd into it, then run the python http server:

```
cd websites/dist/exampleSite
python -m http.server 8080 # Serve over port 8080
```

### Now test it

You've got everything running, now simply open the web app (it should be located at http://localhost:5173/) in your browser.

Also go ahead and check out your live site (after you hit "Publish") at http://127.0.0.1:8080/.

# Contributing

You can check out our [CONTRIBUTORS.md](/CONTRIBUTORS.md) and [ROADMAP.md](/ROADMAP.md) files for more information on how to contribute to the project.