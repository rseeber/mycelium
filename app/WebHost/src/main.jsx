import React, { createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorApp_Full, EditorApp_Plaintext } from './MDXEditor'
//import './style.css'

import editor_paste_in from "./resources/editor_paste_in.html?raw"

// unused??
import floating_bar_stylesheet from "./style_visual.css?raw"
import floating_bar from "./resources/floating_bar.html?raw"

// the original stylesheet for the MDXEditor
//import MDX_stylesheet from '@mdxeditor/editor/style.css?raw'
// unused
//import MDX_stylesheet from './resources/MDXEditor_custom.css?raw'
//import { call, editorSearchCursor$ } from '@mdxeditor/editor'
// my fix that removes all styling from the editor area,
// leaving only the toolbar styled
//import MDX_stylesheet_fix from './resources/MDX_editor_fix.css?raw'

let site;
let currentPage = "index.md";
let apiStem = "http://localhost:8000";
let startingVals = {};

let editor;


// this snippet injects the MDXEditor into the web app
// unused
//const ref = createRef();
//let root;

let frame;
let frameWindow;



// init shadow root
//const shadowHost = document.getElementById('shadow_host');
//const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
//const sheet = new CSSStyleSheet();
//sheet.replaceSync(floating_bar_stylesheet);

//const host = document.querySelector("#host");

//const shadow = host.attachShadow({ mode: "open" });

//shadow.innerHTML = floating_bar;
//shadow.adoptedStyleSheets = [sheet];

//this bit is just to initialize everything
setSite();
/*
function spawnEditor_full(startingMd=""){
    let App =
        <>
            <EditorApp_Full editorRef={ref} startingMd={startingMd} />
            <button onClick={() => savePage()}>Save!</button>
        </>
    createRoot(frame.getElementById('MDXEditorWindow')).render(App);
}
function spawnEditor_plaintext(startingMd=""){
    let App =
        <>
            <EditorApp_Plaintext editorRef={ref} startingMd={startingMd} />
            <button onClick={() => savePage()}>Save!</button>
        </>;
    
    createRoot(frame.getElementById('MDXEditorWindow')).render(App);

}
*/

function setEditorValue(content, isInitial=false){

    frameWindow.editor.setValue(content, isInitial);

    frameWindow.foo = () => {
        console.log("within the iframe: ", window);
        //let elem = window.document.getElementById("editor_window");
        //console.log("inner: ", elem.innerHTML);

        /*
        let editor = new MarkdownWYSIWYG('editor_window', {
            initialValue: "## Hello World!\n\nThis is **Markdown** content.",
        });
        */


        /*
        //document.addEventListener('DOMContentLoaded', () => {
        const editor = new MarkdownWYSIWYG('editor_window', {
            initialValue: "## Hello World!\n\nThis is **Markdown** content.",
            onUpdate: (markdownContent) => {
                console.log("Updated content:", markdownContent);
            }
        });
        });
        */

    }
    //frameWindow.foo();

    
    /*
    if(currentPage.endsWith(".md")){
        spawnEditor_full(content);
    }
    else{
        spawnEditor_plaintext(content);
    }
    */
}

function getEditorValue(){
    return frameWindow.editor.getValue();
}

// set the name for the site. This function allows 
// you to swap between which site is selected. It does not rename your site.
function setSite() {
    site = document.getElementById("site").value;
    // get the current list of templates
    fetch("http://localhost:8000/meta/templates/"+site)
    .then(function(response){
        return response.json()
    }).then(function(data){
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


function switchPage(newPage){
    // if we're not changing anything, don't waste the network or compute resources
    if(newPage == currentPage){
        return;
    }
    //save current buffer
    savePage();
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
    fetch("http://localhost:8000/publish/"+site, {
        method: "PUT"
    }).then(function(response) {
        return response.json();
    })
}
window.publishSite = publishSite;   //accessible via html

function api_get_page(page){
    return fetch("http://localhost:8000/site/"+site+"/"+page)
    .then(function(response) {
        return response.json();
    });
}

// loads the HTML of the template into the iframe
function loadTemplate(){
    // get the template name
    let template = startingVals["template"];

    //now go fetch that template from the _includes folder
    return api_get_page("_includes/"+template)
    .then(function(data){
        let templateHTML = data["content"];
        // replace "{{content}}" with our paste-in code for the editor
        templateHTML = templateHTML.replace(/{{ *content *}}/, editor_paste_in);

        let myDoc = new DOMParser().parseFromString(templateHTML, "text/html");
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

        myDoc.head.appendChild(markedScript);
        myDoc.head.appendChild(editorScript);
        myDoc.head.appendChild(callScript);
        myDoc.head.appendChild(sheet);
        
        // Source - https://stackoverflow.com/a/35917295
        templateHTML = new XMLSerializer().serializeToString(myDoc);



        // now shove that modified HTML into the iframe
        let myFrame = document.createElement("iframe");
        myFrame.srcdoc = templateHTML;
        myFrame.id = "webpage_iframe";
        document.getElementById("webpage").appendChild(myFrame);

        // once the iframe is loaded, we can set the `frame` global var,
        // and return our promise
        return new Promise(function(resolve, reject){
            // Wait for the iframe to load before resolving so its document is ready.
            myFrame.addEventListener('load', function() {
                frame = myFrame.contentDocument;
                frameWindow = myFrame.contentWindow;
                //append the stylesheet for the MDXEditor
                /*
                const sheet = new frameWindow.CSSStyleSheet();
                sheet.replaceSync(MDX_stylesheet);
                frame.adoptedStyleSheets = [...frame.adoptedStyleSheets, sheet];
                */

                // give the frame access to functions it needs
                frameWindow.savePage = savePage;

                //import the script to spawn the editor
                //let script = frame.createElement("script");

                // go ask for the editor from the frame
                /*
                frameWindow.postMessage("GIMME editor", window.location.origin);
                console.log("You just sent a letter!");
                window.addEventListener("message", (event) => {
                    //if(event.origin !== window.location.origin) return;
                    console.log("You just got a response! ", event);

                    editor = event.data;
                    console.log(editor.getValue());
                })
                */

                resolve();

                /*
                // import the required scripts for the editor
                let markedScript = frame.createElement("script");
                // marked is a dependency of the editor
                markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
                let editorScript = frame.createElement("script");
                editorScript.src = "/src/editor.js";

                // this resolves our promise once both scripts are loaded
                const scriptsNeeded = 2;
                let loaded = 0;
                const checkIfFinished = () => {
                    loaded++;
                    if(loaded == scriptsNeeded){
                        resolve();
                    }
                }

                frame.head.appendChild(editorScript);
                frame.head.appendChild(markedScript);

                editorScript.onload = () => {
                    checkIfFinished();
                }
                markedScript.onload = () => {
                    checkIfFinished();
                } 
                */

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
    // (need to make this dynamic later)
    //let page = "index.md";
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

        //ref.current?.setMarkdown(content);
        //ref.current?.diffMarkdown(content);
        //ref.current?.setDiffMarkdown?.('A different older version');
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
}
window.setTemplate = setTemplate;

function loadDefaultTemplate(){
    //get the template selection box
    let defaultTemplate = document.getElementById("default_template");

    fetch(apiStem+"/meta/default_template/"+site, {
        method : "GET",
    }).then(response => response.text()
    ).then(function(data){
        data = data.replace(/"/g, "")
        defaultTemplate.value = data;
    })
}

function setDefaultTemplate(){
    //get the template selection box
    let defaultTemplate = document.getElementById("default_template").value;

    fetch(apiStem+"/meta/default_template/"+site, {
        method : "PUT",
        body: JSON.stringify({"template": defaultTemplate}),
        headers: {
            "Content-Type": "application/json"
        }
    });
}
window.setDefaultTemplate = setDefaultTemplate;

function setTitle(){
    let title = document.getElementById("title").value;
    editFrontMatter("title", title);
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
    // (this also needs to be dynamic eventually)
    //let page = "index.md";
    //send an `update_page` API to the server
    fetch("http://localhost:8000/update/"+site+"/"+currentPage, {
        method: "PUT",
        content: "application/text+json",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then(function(response){
        //fillEditor(content);
    });
}

function createChildPage(){
    // get the current scope
    // remove the file from the  overall path of where we're currently at
    let path = ("/"+currentPage).replace(/\/([^\/]*)$/, "");
    if(!path.startsWith("/")){
        path = "/"+path;
    }
    let pageEnding = currentPage.substring(currentPage.search(/\/([^\/]*)$/, ""));

    // parentFolder is the fullpath of the current file, just without 
    // the file extension (.md, .html)
    let parentFolder = path+(pageEnding.replace(/\..+$/, ""));
    if(currentPage.endsWith("index.md")){
        parentFolder = path;
    }

    console.log(parentFolder);

    // this performs a fetch and creates the page
    createPage(parentFolder).then(function(){
        if(currentPage.endsWith("index.md")){
            handleFileIndex();
        }
        //move the parent to be the index of the new folder
        else{
            let parentFile = currentPage;
            let destination = site+parentFolder+"/index.md";
            //move 'parentFile' to be called 'destination'
            fetch(apiStem+"/move/"+site+"/"+parentFile, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({"destination": destination}),
            }).then(function(response){
                
                handleFileIndex();
            })
        }
    });


}
window.createChildPage = createChildPage;

function createPage(path){
    let filename = window.prompt("Please enter a filename, including file extension (.md, .html, etc)")
    if (filename == null) {
        return;
    }

    let frontMatter = "";
    if(filename.endsWith(".md")){
        frontMatter = "title: myPage\nlayout: default.html\n";
    }
    let data = {"content": "", "frontMatter": frontMatter};

    return fetch(apiStem+"/create/"+site+path+"/"+filename, {
        method: "PUT",
        //content: "application/text+json",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }).then(function(response){
    })
}

function handleFileIndex(){
    getFileIndex_andApply();
}

function getFileIndex_andApply(){
    fetch(apiStem+"/meta/index/"+site)
    .then(function(response){
        return response.json();
    }).then(function(data){
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
        if (cleanFile == "eleventy.config.js" || cleanFile == "_data" || cleanFile == "_includes"){
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