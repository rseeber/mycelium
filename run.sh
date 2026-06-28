#!/bin/bash

API_DIR="websites";
WEBHOST_DIR="app/WebHost";
HTTP_DIR="websites/dist/exampleSite";

session=mycelium;

# kill any existing sessions with the same name
screen -S $session -X quit >> /dev/null;

# start the session
screen -dmS $session;

# Run WebHost
screen -S $session -X screen -t "WebHost" bash -c "cd $WEBHOST_DIR && npm run dev; bash";

# Serve the page via HTTP
screen -S $session -X screen -t "HTTP Server" bash -c "cd $HTTP_DIR && python -m http.server 8080; bash";

# Run FastAPI
screen -S $session -X screen -t "FastAPI" bash -c "cd $API_DIR && fastapi dev api_handler.py; bash";

echo "Applications started. Press enter to attach to GNU Screen";
read;

# Attach to the screen
screen -r;