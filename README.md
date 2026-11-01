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

Ensure you have the following packages installed: Python, npm, and GNU Screen.

Next, run the setup script:

```
./setup.sh
```

## Run the program

To run the program, simply call:

```
./run.sh
```

## Setting up the HTTP server

**Note: You will need to set up an HTTP server to serve the websites of your signed up users**

While you don't need to set up the HTTP server in order to sign up users or edit webpages, you will need it if you want to actually serve those published websites. Feel free to come back to this step after testing everything else first, if you need to.

We will explain how to do this with `apache2`, but you can accomplish this with any HTTP server software.

First, install `apache2`. Next, create a file in `/etc/apache2/sites-available/` -- we will call ours `mycelium.conf`, but you can call it anything you want. Put the following into the config file:

```conf
# Main page (not for your users)
<VirtualHost *:80>
	ServerName example.com			# replace this with your domain name
	ServerAlias www.example.com		# again, replace with domain name
	ServerAdmin webmaster@localhost	# set this as your email address
	DocumentRoot /var/www/mycelium/main/	# if you'd like, you can pick a different folder
</VirtualHost>
# Dynamic virtual hosts
# (e.g., foo.example.com serves from /var/www/mycelium/foo/)
<VirtualHost *:80>
	ServerAlias *.example.com	# replace with your domain name
	UseCanonicalName Off
	VirtualDocumentRoot /var/www/mycelium/%1/	# don't edit this folder unless you also edit the symlink at 'dist'
	ServerAdmin webmaster@localhost	# set as your email address
</VirtualHost>
```

Finally, we must enable the `vhost_alias` and enable our site:

```sh
a2enmod vhost_alias
a2ensite mycelium
# The changes will ask you to restart apache2, so let's do that
sudo systemctl restart apache2
```

### Now test it

You've got everything running, now simply open the web app (it should be located at http://localhost:5173/) in your browser.

If you've also set up the HTTP Server, you should be able to see the site of some user at http://user.example.com/ replacing 'user' with your user, and 'example.com' with whatever domain you're using. (Note: you can set up your own custom domains in the hosts file if you want to test this over localhost without buying a domain)

# Contributing

You can check out our [CONTRIBUTORS.md](/CONTRIBUTORS.md) and [ROADMAP.md](/ROADMAP.md) files for more information on how to contribute to the project.
