from fastapi import FastAPI, HTTPException
import os, subprocess, shutil
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
        return {"error": "file not found error"}

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
def move_page(site: str, page: str, opt: dict):
    shutil.move(f"src/{site}/{page}", f"src/{opt["destination"]}")

@app.put("/create/{site}/{page:path}")
def create_page(site: str, page: str, fileContents: dict):
    path = f"src/{site}/{page}"
    # create any missing parent folders
    dir = re.sub("/([^/]*)$", "", path)
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
    # this assumes the file already exists, and it fully overwrites it
    with open(f"src/{site}/_data/layout.js", "r") as f:
        file = f.read()
    m = re.search(r"(?<=(module\.exports = \")).+(?<!\")", file)
    if m:
        return m.group()
    else:
        return m



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