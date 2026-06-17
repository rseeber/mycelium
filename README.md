# Linkbin (temporary name)

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

## Run the program

You will need to have 3 terminals open in order to do thisi, running each application at the same time. For now, they need to all be on the same device so they can access each other via `localhost`.

### API Handler

Go into `websites/` and run the `api_handler.py` script:

```
cd websites/
fastapi dev api_handler.py
```


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