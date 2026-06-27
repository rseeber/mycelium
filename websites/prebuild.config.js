//import data from "./src/exampleSite/_data/data.json" with {type: "json"};

let siteName = "exampleSite";

export default async function(eleventyConfig) {
    eleventyConfig.setOutputDirectory("../../web/"+siteName+"/");

    eleventyConfig.ignores.add("**/.trash/**");


    // == PREBUILD SPECIFIC CONFIGURATION OPTIONS ==

    //add keyable data fields
    // for each top level label
    /*
    for (let label in data._schema) {
        let item = data._schema[label];
        // this is our keyable html element we're putting in the innerHTML (text)
        item.text = '<div id="_end'+label+'"></div>';
        console.log("item: ",item);
        // append this item to our overal data for this label
        data["_"+label].push(item);
    }
    //let label = "links";
    let item = {"url": null, "text": null};
    item.text = '<div id="_endlinks"></div>';

    eleventyConfig.addGlobalData("links", [item]);

    eleventyConfig.eleventyComputed: {0}
    */

};