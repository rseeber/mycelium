import editor_paste_in from "./resources/editor_paste_in.html?raw"


let site;
let currentPage = "index.md";
let apiStem = "http://localhost:8000";
let startingVals = {};

let editor;

let frame;
let frameWindow;


//this bit is just to initialize everything
setSite();

function setEditorValue(content, isInitial=false){

    frameWindow.editor.setValue(content, isInitial);
}

function getEditorValue(){
    return frameWindow.editor.getValue();
}

// set the name for the site. This function allows 
// you to swap between which site is selected. It does not rename your site.
function setSite() {
    site = document.getElementById("site").value;
    document.getElementById("site_title").textContent = site;
    // get the current list of templates
    api_get_templates()
    .then(function(data){
        let templates = data["templates"];
        prefillTemplateSelector(templates, "template_selector");
        prefillTemplateSelector(templates, "default_template", true);

        //after selecting which site to edit, we load the homepage contents 
        // for the site into the buffer
        loadPage();

        // fill out the file explorer
        handleFileIndex();
    });
}
window.setSite = setSite;   //accessible via html


function prefillTemplateSelector(templates, selectorID, excludeDefault=false) {
    for (let i = 0; i < templates.length; i++) {
        // the filename of the template
        const template = templates[i];
        // filename without extension (.md, .html)
        let template_stripped = template.replace(/\.[^/.]+$/, ""); // https://stackoverflow.com/a/4250408

        // don't add the "default" option if we're not supposed to
        if(excludeDefault && template_stripped == "default"){
            continue;
        }

        // create an html node for this option
        let opt = document.createElement("option");
        opt.value = template;
        opt.innerHTML = template_stripped;
        // append this option to the list in the selector
        document.getElementById(selectorID).appendChild(opt);
    }
}


function switchPage(newPage, save=true){
    // if we're not changing anything, don't waste the network or compute resources
    if(newPage == currentPage){
        return;
    }
    if(save){
        //save current buffer
        savePage();
    }
    currentPage = newPage;
    //load the new page into the buffer
    loadPage();
    // reprint the file explorer, but with the new page highlighted
    applyFileIndex(startingVals["fileIndex"]);
}
window.switchPage = switchPage;

// tell the server to run 11ty, updating the deployed site with current 
// versions of the source files
function publishSite(){
    // we should save the site one last time before publishing
    savePage();

    //okay now actually publish
    return api_publish_site();
}
window.publishSite = publishSite;   //accessible via html

function api_publish_site() {
    return fetch(apiStem+"/publish/"+site, {
        method: "PUT"
    }).then(function(response) {
        return response.json();
    });
}

function api_get_page(page){
    return fetch(apiStem+"/site/"+site+"/"+page)
    .then(function(response) {
        return response.json();
    });
}

function api_delete_resource(page){
    return fetch(apiStem+"/delete/"+site+"/"+page, {
        method: "PUT"
    });
}

function api_move_page(src, dest){
    return fetch(apiStem+"/move/"+site+"/"+src, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"destination": dest}),
    });
}

function api_update_page(page, data){
    return fetch("http://localhost:8000/update/"+site+"/"+page, {
        method: "PUT",
        content: "application/text+json",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

// file should begin with a slash (eg '/', '/blog', etc)
function api_create_page(file, data){
    return fetch(apiStem+"/create/"+site+file, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

function api_get_skeleton(page){
    return fetch(apiStem+"/meta/skeleton/"+site+"/"+page)
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        return data["html"];
    })
}

// returns the json response
function api_get_templates(){
    return fetch(apiStem+"/meta/templates/"+site)
    .then(function(response){
        return response.json()
    });
}

// get the default template, returning it as a string
function api_get_default_template(){
    return fetch(
        apiStem+"/meta/default_template/"+site, 
        {method : "GET"})
    .then(response => response.text()
    ).then(function(data){
        data = data.replace(/"/g, "");
        return data;
    });
}

function api_set_default_template(defaultTemplate){
    return fetch(apiStem+"/meta/default_template/"+site, {
        method : "PUT",
        body: JSON.stringify({"template": defaultTemplate}),
        headers: {
            "Content-Type": "application/json"
        }
    });
}

function api_get_index(){
    return fetch(apiStem+"/meta/index/"+site)
    .then(function(response){
        return response.json();
    });
}

function deletePage(){
    // (control flow on this function is a little confusing perhaps)
    let myPage = currentPage;
    console.log("currentPage: ", currentPage);
    // if it's an index, treat it like deleting the whole folder
    if(currentPage.endsWith("/index.md")){
        myPage = currentPage.replace(/\/index.md$/, "");
        console.log(myPage);
        // but if they press cancel, just delete the index file
        if(!confirm("Delete entire folder '"+myPage+"'? \
Press cancel to just delete '"+currentPage+"'.")){
            console.log("A");
            myPage = currentPage;
        }
    }
    console.log(myPage);
    // delete the current page
    api_delete_resource(myPage).then(() => {
        console.log("okay");
        switchPage("index.md", false);
        handleFileIndex();
    });
}
window.deletePage = deletePage;

function removeLinkRow(i, refresh=true){
    startingVals.data.links.splice(i, 1);
    if(refresh){
        fillTemplateData(startingVals.data);
        saveTemplateData();
    }
}
window.removeLinkRow = removeLinkRow;

function addLinkRow(i=null, url=null, text=null){
    let myList = document.getElementById("navbar_settings_links");
    if(!i){
        i = myList.childElementCount;
    }


    // label for the url
    let urlLabel = document.createElement("label");
    urlLabel.textContent = "Link: ";
    // TODO: add `for` and other metadata for accessibility
    // input box for the url
    let urlInput = document.createElement("input");
    urlInput.value = url;

    // label for the text
    let textLabel = document.createElement("label");
    textLabel.textContent = "Text: ";
    // TODO: add `for` and other metadata for accessibility
    // input box for the text
    let textInput = document.createElement("input");
    textInput.value = text;

    // trash button
    let trashButton = document.createElement("button");
    trashButton.textContent = "-";
    trashButton.setAttribute("onclick", "removeLinkRow("+i+")");

    // br element
    let br = document.createElement("br");

    myList.appendChild(urlLabel);
    myList.appendChild(urlInput);
    myList.appendChild(textLabel);
    myList.appendChild(textInput);
    myList.appendChild(trashButton);
    myList.appendChild(br);
}
window.addLinkRow = addLinkRow;

// save user input in the link form to our working cache
function cacheLinks() {
    let myList = document.getElementById("navbar_settings_links");
    // collect all the input in a 1-D list
    let messyList = [];
    for(const elem of myList.children){
        // only read the text input values
        if (["LABEL", "BR", "BUTTON"].includes(elem.nodeName)){
            continue;
        }
        messyList.push(elem.value);
    }
    let links = [];
    // seperate the list into our data pairs of 'url' and 'text'
    for(let i = 0; i < messyList.length; i+=2){
        let item = {"url": messyList[i], "text": messyList[i+1]};
        links.push(item);
    }
    // now save it
    startingVals.data.links = links;
}

function saveTemplateData(){
    // first, save everything already in our link form
    cacheLinks();
    // then, send the data back to the server
    let data = {"frontMatter": null, "content": startingVals.data};
    return api_update_page("_data/data.json", data)
    .then(savePage())
    .then(loadPage());
}
window.saveTemplateData = saveTemplateData;

function fillTemplateData(data){
    startingVals.data = data;
    console.log(startingVals.data.links);
    let myList = document.getElementById("navbar_settings_links");
    myList.innerHTML = "";
    //console.log(data.links);
    let links = data.links;
    // iterate through each link
    for(let i = 0; i < links.length; ++i){
        let link = links[i];
        addLinkRow(i, link.url, link.text);
    }
}

// loads the HTML of the template into the iframe
function loadTemplate(){
    // get the data file, and load up any metadata fields
    api_get_page("_data/data.json").then((data) => {
        let output = data.md;
        return JSON.parse(output);
    }).then((data) => {
        fillTemplateData(data);
    });

    // get the skeleton layout for this page
    return api_get_skeleton(currentPage)
    .then(function(html){
        let myDoc = new DOMParser().parseFromString(html, "text/html");
        // import the required scripts for the editor
        let markedScript = myDoc.createElement("script");
        // marked is a dependency of the editor
        markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
        // this is the editor itself
        let editorScript = myDoc.createElement("script");
        editorScript.src = "/src/markdown-wysiwyg/dist/editor.js";
        // this is the script that loads the editor in
        let callScript = myDoc.createElement("script");
        callScript.src = "/src/markdown-wysiwyg/dist/loader.js";
        
        //we also need to import the stylesheet for the editor
        let sheet = myDoc.createElement("link");
        sheet.rel = "stylesheet";
        sheet.href = "/src/markdown-wysiwyg/dist/editor.css";

        // stick all those nodes into the actual document
        myDoc.head.appendChild(markedScript);
        myDoc.head.appendChild(editorScript);
        myDoc.head.appendChild(callScript);
        myDoc.head.appendChild(sheet);
        
        // replace all the keyable sections
        // content
        myDoc.getElementById("_content").innerHTML = editor_paste_in;

        // Source - https://stackoverflow.com/a/35917295
        html = new XMLSerializer().serializeToString(myDoc);

        // now shove that modified HTML into the iframe
        let myFrame = document.createElement("iframe");
        myFrame.srcdoc = html;
        myFrame.id = "webpage_iframe";
        let webpageDiv = document.getElementById("webpage");
        webpageDiv.innerHTML = "";
        webpageDiv.appendChild(myFrame);

        // once the iframe is loaded, we can set the `frame` global var,
        // and return our promise
        return new Promise(function(resolve, reject){
            // Wait for the iframe to load before resolving so its document is ready.
            myFrame.addEventListener('load', function() {
                frame = myFrame.contentDocument;
                frameWindow = myFrame.contentWindow;

                // give the frame access to functions it needs
                frameWindow.savePage = savePage;

                resolve();
            },
            //only run the listener once
            {once: true});

            // Give up after some time if it doesn't load
            setTimeout(() => reject(new Error('iframe load timeout')), 5000);
        });
    });
}

//download the page from the server, overwritting the current local buffer
function loadPage(){
    // decide which page on the site to download
    document.getElementById("page_title").innerHTML = currentPage;


    //fetch the page via the API
    api_get_page(currentPage)
    // get the response body as a json
    .then(function(data){
        let content = data["content"];
        let frontMatter = data["frontMatter"];
        let template = data["templateName"];

        // we cache this so we can diff against it when we upload, 
        // saving on network bandwidth
        startingVals["content"] = content;
        startingVals["frontMatter"] = frontMatter;
        startingVals["template"] = template;

        //get the template selector set up right
        document.getElementById("template_selector").value = template;

        // save the frontMatter for later when we upload
        document.getElementById("frontMatter").value = frontMatter;

        // load the default template value in the input box
        loadDefaultTemplate();

        // set the title inside the little textbox
        loadTitle(getFrontMatterValue("title"));

        // load the template html into the iframe
        loadTemplate()
        .then(function(){
            setEditorValue(content, true);
        });
    });
}

function setTemplate(){
    // get the input element in the html
    let templateSelector = document.getElementById("template_selector");
    // get the filename for the selected template
    let template = templateSelector.options[templateSelector.selectedIndex].value;
    // get the old frontMatter
    let frontMatter = document.getElementById("frontMatter").value;
    // update the frontMatter to use the new template
    frontMatter = frontMatter.replace(/(?<=layout: ).*/, template);
    // overwrite our saved value (in the hidden input) for the frontMatter
    document.getElementById("frontMatter").value = frontMatter;

    return savePage().then(loadPage());
}
window.setTemplate = setTemplate;

function loadDefaultTemplate(){
    //get the template selection box
    let defaultTemplate = document.getElementById("default_template");

    // get the default template
    api_get_default_template()
    //then, set the value in the DOM
    .then((data) => {
        defaultTemplate.value = data;
    })
}

function setDefaultTemplate(){
    //get the template selection box
    let defaultTemplate = document.getElementById("default_template").value;

    return api_set_default_template(defaultTemplate)
    // TODO: only do this if the current page uses 'default' as their template
    .then(savePage())
    .then(loadPage());
}
window.setDefaultTemplate = setDefaultTemplate;

function setTitle(){
    let title = document.getElementById("title").value;
    editFrontMatter("title", title);
    // save the new title
    savePage()
    // load the page so the title is reflected
    .then(() => {
        setTimeout(loadPage(), 500);
    });
}
window.setTitle = setTitle;

function loadTitle(title){
    document.getElementById("title").value = title;
}

function editFrontMatter(key, value){
    // get the old frontMatter
    let frontMatter = document.getElementById("frontMatter").value;
    // create the dynamic regex to find and replace the value at the key
    var regex = new RegExp("(?<="+key+": ).*") // equiv to /(?<=key: ).*/
    // if the key doesn't exist, append it
    if(!regex.test(frontMatter)){
        frontMatter += key+": "+value;
    }
    // otherwise, update it
    else{
        // update the frontMatter to use the new template
        frontMatter = frontMatter.replace(regex, value);
    }
    // overwrite our saved value (in the hidden input) for the frontMatter
    document.getElementById("frontMatter").value = frontMatter;
}

function getFrontMatterValue(key){
    // get the frontMatter
    let frontMatter = document.getElementById("frontMatter").value;
    // create the dynamic regex to find and replace the value at the key
    var regex = new RegExp("(?<="+key+": ).*") // equiv to /(?<=key: ).*/
    // if the key doesn't exist, return null
    if(!regex.test(frontMatter)){
        return null
    }
    // return the first match
    return frontMatter.match(regex)[0];

}

//upload the page to the server
function savePage(){
    // get the hidden frontMatter
    let frontMatter = document.getElementById("frontMatter").value;
    // get the content from the text editor
    let content = getEditorValue();
    let data = {"content": content, "frontMatter": frontMatter};

    // get the specific page we're editing
    //send an `update_page` API to the server
    return api_update_page(currentPage, data);
}

function createSiblingPage(){
    // remove the file ending (/foo/bar -> /foo)
    let parentIndex = ("/"+currentPage).replace(/\/([^\/]*)$/, "");
    // get the parent folder by appending index.md, then make a child of it
    // (i.e., a sibling is just a child of the same parent)
    createChildPage(parentIndex+"/index.md");
}
window.createSiblingPage = createSiblingPage;

function createChildPage(myPage=null){
    if(myPage == null){
        myPage = currentPage;
    }
    console.log("myPage: ", myPage);
    // get the current scope
    // remove the file from the  overall path of where we're currently at
    let path = ("/"+myPage).replace(/\/([^\/]*)$/, "");
    if(!path.startsWith("/")){
        console.log("before: ", path);
        path = "/"+path;
        console.log("after: ", path);
    }
    let pageEnding = myPage.substring(myPage.search(/\/([^\/]*)$/, ""));

    // parentFolder is the fullpath of the current file, just without 
    // the file extension (.md, .html)
    // this appends our file to the path (/path/to/foo.txt -> /path/to/file/foo/)
    let parentFolder = path+(pageEnding.replace(/\..+$/, ""));
    // if we're on an index page, we use its parent instead 
    // (/path/to/index.md -> /path/to/)
    if(myPage.endsWith("index.md")){
        parentFolder = path;
    }
    if(parentFolder == "/"){
        parentFolder = "";
    }

    console.log("parentFolder: ", parentFolder);

    // this performs a fetch and creates the page
    createPage(parentFolder, "md").then(function(){
        if(myPage.endsWith("index.md")){
            handleFileIndex();
        }
        //move the parent to be the index of the new folder
        else{
            let parentFile = myPage;
            let destination = parentFolder+"/index.md";
            //move 'parentFile' to be called 'destination'
            api_move_page(parentFile, destination)
            .then(function(response){
                handleFileIndex(parentFile, destination);
            });
        }
    });
}
window.createChildPage = createChildPage;

function createPage(path, extension=null){
    let filename = window.prompt("Please enter a filename, including file extension (.md, .html, etc)");
    if (filename == null) {
        return;
    }
    // append the extension if the user didn't include one
    if(extension && !filename.match(/\..+$/)){
        filename += "."+extension;
    }

    let frontMatter = "";
    if(filename.endsWith(".md")){
        frontMatter = "title: myPage\nlayout: default.html\n";
    }
    let data = {"content": "", "frontMatter": frontMatter};

    console.log("full: ", site+path+"/"+filename);
    console.log("site: ", site);
    console.log("path: ", path);

    return api_create_page(path+"/"+filename, data);
}

function handleFileIndex(){
    getFileIndex_andApply();
}

function getFileIndex_andApply(){
    api_get_index()
    .then(function(data){
        startingVals["fileIndex"] = data;
        return applyFileIndex(data);
    });
}

function applyFileIndex(index){
    let fileExplorer = document.getElementById("file_explorer_list");
    // first clear out the existing index
    fileExplorer.innerHTML = "";
    applyFileIndex_recursive(index, fileExplorer);
}

function applyFileIndex_recursive(index, ul){
    for (var file in index) {
        let cleanFile = file.substring(1);
        // if cleanFile is one of the hidden files/dirs, skip this file
        if (["eleventy.config.js", "_data", "_includes", "_demo.md", ".trash"].includes(cleanFile)){
            continue;
        }
        let li = document.createElement("li");
        li.setAttribute("onclick", "switchPage('"+cleanFile+"');");
        li.innerHTML = file.substring(file.search(/\/([^\/]*)$/) + 1);
        //highlight it if this is the active file
        if(cleanFile == currentPage){
            li.style = "background-color: var(--selected-file-color)";
        }
        ul.appendChild(li);
        // if the file is actually a directory, append its contents
        if (index[file] != null) {
            //highlight it if this is the direct parent folder of the active file
            if(currentPage.replace(/\/.+$/, "") == cleanFile){
                li.style = "background-color: var(--selected-file-color)";
            }
            li.setAttribute("onclick", "switchPage('"+cleanFile+"/index.md');");
            let sub_ul = document.createElement("ul");
            ul.appendChild(sub_ul);
            applyFileIndex_recursive(index[file], sub_ul);
        }
    }
}