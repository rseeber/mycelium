let siteName = "exampleSite";
export default async function(eleventyConfig) {
    eleventyConfig.setOutputDirectory("../../web/"+siteName+"/");

    eleventyConfig.ignores.add("**/.trash/**");
    eleventyConfig.ignores.add("**/_demo.md");
};