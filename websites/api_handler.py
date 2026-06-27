from fastapi import FastAPI, HTTPException
import os, subprocess, shutil, time, json
from pathlib import Path
import re

app = FastAPI()


@app.get("/site/{site}/{page:path}")
def get_page(site: str, page: str):
    # read the file
    try:
        with open(f"src/{site}/{page}", "r") as f:
            md = f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="file not found")

    # get a version of the md without the frontmatter
    # we will call this version 'content'
    frontMatterEnd = md.find("---\n", 4)
    frontMatter = md[4:frontMatterEnd]
    content = md[frontMatterEnd+4:]


    # Pull the template name from the liquid header info
    # only if we're accessing a source file (.md or .html) 
    # that isn't a template (_includes/)
    templateName = None
    if not (page.endswith(".md") and page.endswith(".html") and page.startswith("_includes/")):
        templateStart, templateEnd = getTemplateIndices(frontMatter)
        templateName = frontMatter[templateStart:templateEnd]
        # we need to add error checking to this

    return {"md": md, "content": content, "frontMatter":frontMatter, "templateName": templateName}

# utility function that gets the indices of the layout file (following the "layout: ") 
# in a frontMatter string
def getTemplateIndices(frontMatter: str):
    # I'm sure there's a better way to do this, but it works
    start = frontMatter.find("layout: ") + len("layout: ")
    end = frontMatter.find("\n", start)
    return start, end

@app.put("/move/{site}/{page:path}")
def move_page(site: str, page: str, opt: dict, mkdir=False):
    destination = opt["destination"]
    print(f"(move page):\n\tsite: {site}\n\tpage: {page}\n\tdestination: {destination}")
    # make parent directories first
    if mkdir:
        MAX_DEPTH = 10   # prevent malicious deep nesting
        if page.count("/") > MAX_DEPTH:
            raise HTTPException(status_code=403, detail=f"resource nested too deep. Max depth = {MAX_DEPTH}")
        # create any missing parent folders
        # dir represents the full path, but without the specific file (/foo/bar.txt -> /foo/)
        path = f"src/{site}/{destination}"
        print(f"path: {path}")
        dir = re.sub(r"/([^/]*)$", "", path)
        print(f"making path: {dir}")
        Path(dir).mkdir(parents=True, exist_ok=True)

    # move the actual page
    shutil.move(f"src/{site}/{page}", f"src/{site}/{opt["destination"]}")

@app.put("/create/{site}/{page:path}")
def create_page(site: str, page: str, fileContents: dict):
    path = f"src/{site}/{page}"

    # if we're creating [file].[exten], but [file]/ exists,
    # return an error instead

    # gets the path without a file extension
    regex = re.compile(r"\.[^.]+$")
    strippedPath = re.sub(regex, "", path)

    if os.path.isdir(strippedPath):
        raise HTTPException(status_code=409, detail=f"Cannot create file {path}, as {strippedPath}/ already exists as a directory")

    # create any missing parent folders
    # dir represents the full path, but without the specific file (/foo/bar.txt -> /foo/)
    dir = re.sub(r"/([^/]*)$", "", path)
    print(f"making path: {dir}")
    Path(dir).mkdir(parents=True, exist_ok=True)
    # make sure the file doesn't already exist
    if os.path.isfile(path):
        # that's an error, don't proceed
        raise HTTPException(status_code=409, detail="This resource already exists")
    # call update page in order to create the file
    return update_page(site, page, fileContents)

# This API either creates a new page, or updates an existing page
# you only need to pass in a dictionary containing
# "frontMatter" and "content". All other fields are unused.
# this API will concatenate them in order to save back to the md file
@app.put("/update/{site}/{page:path}")
def update_page(site: str, page: str, update: dict):
    if site not in os.listdir("src"):
        raise HTTPException(status_code=404, detail="Site not found")

    # get frontMatter and content
    frontMatter = update["frontMatter"]
    content = update["content"]
    # construct md by combining the two objects
    md = f"---\n{frontMatter}---\n{content}"

    path = f"src/{site}/{page}"
    # first, create the page if it doesn't exist yet
    if not os.path.isfile(path):
        with open(path, "a") as f:
            f.write("")
    
    # next, update the content
    with open(path, "w") as f:
        f.write(md)


@app.put("/publish/{site}")
def publish_site(site: str):
    # go into path, run `npx @11ty/eleventy` in order to
    # generate the new site with the updated source files
    # (before this, we were _only_ updating source files,
    # not the deployed site)
    #
    # we accomplish this by running a bash script
    subprocess.run(["./publishSite.sh", site])
    # we need to add error checking at some point
    return

# return a list of templates currently "installed" on the site
@app.get("/meta/templates/{site}")
def get_templates(site: str):
    ls = os.listdir(f"src/{site}/_includes/")
    # get a list of all files that end with .html or .md
    templates = [t for t in ls if (t.endswith(".html") or t.endswith(".md"))]
    return {"templates": templates}

@app.put("/meta/templates/{site}/{page:path}")
def set_template(site: str, page: str, newTemplate: str):
    myPage = get_page(site, page)
    # if it's already done, do nothing
    if newTemplate == myPage["templateName"]:
        return
    # get the content and frontMatter
    content = myPage["content"]
    frontMatter = myPage["frontMatter"]
    # get the indices of the existing template
    start, end = getTemplateIndices(frontMatter)
    # update it with our new template we're using
    frontMatter = f"{frontMatter[:start]}{newTemplate}{frontMatter[end:]}"
    # update the source file with our new frontMatter
    update_page(site, page, {"content": content, "frontMatter": frontMatter})

@app.put("/meta/default_template/{site}")
def set_default_template(site: str, opt: dict):
    template = opt["template"]
    """
    # this assumes the file already exists, and it fully overwrites it
    with open(f"src/{site}/_data/layout.js", "w") as f:
        f.write(f"module.exports = \"{template}\"")
    """
    set_template(site, "_includes/default.html", template)

    

@app.get("/meta/default_template/{site}")
def get_default_template(site: str):
    # get the frontMatter for our default.html template
    default = get_page(site, "_includes/default.html")["frontMatter"]

    # parse it, and grab the layout
    m = re.search(r"(?<=layout: ).*", default)
    if m == None:
        print("there's no layout here")
        print(default)
        raise HTTPException(status_code=500, detail="Layout not found in _includes/default.html")

    layout = m.group(0)
    return layout
    


    """
    # this assumes the file already exists, and it fully overwrites it
    with open(f"src/{site}/_data/layout.js", "r") as f:
        file = f.read()
"""
#    m = re.search(r"(?<=(module\.exports = \")).+(?<!\")", file)
    """
    if m:
        return m.group()
    else:
        return m
    """

@app.put("/delete/{site}/{page:path}")
def delete_resource(site: str, page: str):
    resource = f"src/{site}/{page}"
    timestamp = int(time.time())
    if os.path.isdir(resource):
        trashName = f"{page}_{timestamp}"
    elif os.path.isfile(resource):
        # check if there's a filename with a dot in it (foo/bar/buzz.txt)
        # (but NOT foo/ba.r/buzz)
        if re.search(r"\.[^/]*$", resource):
            # do a regex (foo.txt -> foo_<timestamp>.txt)
            trashName = re.sub(r"\.(?=[^.]*$)", f"_{timestamp}.", page)
        # if the file has no extension (foo/bar/buzz, where buzz is a file)
        else:
            # just append (foo -> foo_<timestamp>)
            trashName = f"{resource}_{timestamp}"
    trashDestination = f".trash/{trashName}"
    print(resource)
    print(trashName)
    print(trashDestination)
    move_page(site, page, {"destination":trashDestination}, True)

@app.get("/meta/index/{site}")
def get_index(site: str):
    # recursively go through the subdirs of the site folder, listing everything
    return get_index_recursive(site, "")

def get_index_recursive(site, subPath):
    fullPath = f"src/{site}/{subPath}"
    ls = os.listdir(fullPath)
    index = {}
    for item in ls:
        if os.path.isdir(f"{fullPath}/{item}"):
            index.update({f"{subPath}/{item}": get_index_recursive(site, f"{subPath}/{item}")})
        else:
            index.update({f"{subPath}/{item}": None})
    return index

# Build the given page with its front matter, replacing content with a keyable
# value -- a div with id="_content". Returns as a string.
@app.get("/meta/skeleton/{site}/{page:path}")
def get_skeleton(site: str, page: str):
    # First, we take in the frontmatter for the page they want
    frontMatter = get_page(site, page)["frontMatter"]
    # then, we fill the content with a keyable string
    content = '<div id="_content"></div>'

    # write the markdown to _demo.md
    # TODO: perform this step without a disk operation
    update_page(site, "_demo.md", {"frontMatter": frontMatter, "content": content})

    # now use that _demo.md to build the skeleton
    output = subprocess.run(["./buildPage.sh", site, "_demo.md"], stdout=subprocess.PIPE).stdout

    # get the content (html output) of the site being built
    print(output)
    myJson = json.loads(output)[0]
    #print(json.dumps(myJson, indent=4))
    html = myJson["content"]

    # return the html
    return {"html": html}