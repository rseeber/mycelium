# Mycelium 🍄

Mycelium is an 11ty-powered project that allows users to create, edit, and publish a website all within their browser, without ever (needing) to see a single line of markdown or html code. The idea is to make a simple interface for making basic sites on the smallweb.

Future plans exist to extend beyond just the webHost program, and also make a module titled LinkBin, which will be a social, link-sharing service on the Social Web (aka "[fediverse](https://en.wikipedia.org/wiki/Fediverse)") via [ActivityPub](https://en.wikipedia.org/wiki/ActivityPub). You can read more about these plans in the [ROADMAP.md](/ROADMAP.md).


## Clone project and git submodules

This project uses several submodules for various components. After calling git clone and entering into the project, you will need to call the following command in order to clone or update each of the submodules:

```
git submodule update --init --recursive
```

Changes made to a submodule are tracked by the repo the submodule points to. The editor submodule is an in-house fork, so feel free to make PRs to it if the need arises.


## Install the prerequisites

This project requires both [Python](), [npm](), and [GNU Screen]() to be installed.

Additionally, you will need to call the `setup.sh` script, which installs various libraries and performs other setup tasks. The script might output errors if called multiple times.

## Run the program

In order to start the program, call `run.sh`. This script launches the web app and api that allows any user to login and edit their website. It also launches an HTTP server that hosts the website of just _one_ of the users. By default, that user is `testuser`, but you can specify any other user as an argument, instead: `run.sh [user]`.

If you'd like to login as the default user, their password is 'password' by default. You can find this information in the `setup.sh` script, where the user is initially created.

### Now test it

You've got everything running, now simply open the web app (it should be located at http://localhost:5173/) in your browser.

Also go ahead and check out your live site (after you hit "Publish") at http://127.0.0.1:8080/.

# Contributing

You can check out our [CONTRIBUTORS.md](/CONTRIBUTORS.md) and [ROADMAP.md](/ROADMAP.md) files for more information on how to contribute to the project.