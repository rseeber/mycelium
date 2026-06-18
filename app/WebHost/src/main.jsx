import React, { createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { EditorApp_Full, EditorApp_Plaintext } from './MDXEditor'
import './style.css'

let site;
let currentPage = "index.md";
let apiStem = "http://localhost:8000";
let startingVals = {};


// this snippet injects the MDXEditor into the web app
const ref = createRef();
let root;

function spawnEditor_full(startingMd=""){
    let App =
        <>
            <EditorApp_Full editorRef={ref} startingMd={startingMd} />
            <button onClick={() => savePage()}>Save!</button>
        </>
    createRoot(document.getElementById('MDXEditorWindow')).render(App);
}
function spawnEditor_plaintext(startingMd=""){
    let App =
        <>
            <EditorApp_Plaintext editorRef={ref} startingMd={startingMd} />
            <button onClick={() => savePage()}>Save!</button>
        </>;
    
    createRoot(document.getElementById('MDXEditorWindow')).render(App);

}

function spawnEditor(content){
    if(currentPage.endsWith(".md")){
        spawnEditor_full(content);
    }
    else{
        spawnEditor_plaintext(content);
    }
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

//download the page from the server, overwritting the current local buffer
function loadPage(){
    // decide which page on the site to download
    // (need to make this dynamic later)
    //let page = "index.md";
    document.getElementById("page_title").innerHTML = currentPage;


    //fetch the page via the API
    fetch("http://localhost:8000/site/"+site+"/"+currentPage)
    .then(function(response) {
        return response.json();
    })
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

        spawnEditor(content);

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
    let content = ref.current?.getMarkdown();
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
        spawnEditor(content);
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