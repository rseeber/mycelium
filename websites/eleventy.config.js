export default async function(eleventyConfig) {

    eleventyConfig.ignores.add("**/.trash/**");
    eleventyConfig.ignores.add("**/_demo.md");
    eleventyConfig.addPassthroughCopy("css/*.css");
};