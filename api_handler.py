from fastapi import FastAPI, HTTPException
import os, subprocess

app = FastAPI()


@app.get("/site/{site}/{page}")
def get_page(site: str, page: str):
    # read the file
    try:
        with open(f"src/{site}/{page}", "r") as f:
            content = f.read()
    except FileNotFoundError:
        return -1

    # Pull the template name from the liquid header info
    # only if we're accessing a source file (.md or .html) 
    # that isn't a template (_includes/)
    templateName = None
    if not (page.endswith(".md") and page.endswith(".html") and page.startswith("_includes/")):
        # I'm sure there's a better way to do this, but it works
        templateStart = content.find("layout: ") + len("layout: ")
        templateEnd = content.find("\n", templateStart)
        templateName = content[templateStart:templateEnd]
        # we need to add error checking to this

    return {"content": content, "templateName": templateName}

# This API either creates a new page, or updates an existing page
@app.put("/update/{site}/{page}")
def update_page(site: str, page: str, action: str, update: dict):
    if site not in os.listdir("src"):
        raise HTTPException(status_code=404, detail="Site not found")

    content = update["content"]

    path = f"src/{site}/{page}"
    # first, create the page if it doesn't exist yet
    if not os.path.isfile(path):
        with open(path, "a") as f:
            f.write("")
    
    # next, update the content
    with open(path, "w") as f:
        f.write(content)

    return

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
