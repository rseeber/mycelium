import { createContainer } from "almostnode";

const { vfs, npm, runtime } = createContainer();

await npm.install("@11ty/eleventy");

console.log("okay");

const markdown = `
# Hello World

This page was rendered by Eleventy.

- one
- two
- three

**bold text**
`;

vfs.mkdirSync("/site", { recursive: true });
vfs.writeFileSync("/site/index.md", markdown);

vfs.writeFileSync(
  "/run-eleventy.js",
  `
const { Eleventy } = require("@11ty/eleventy");
const fs = require("fs");

(async () => {
  console.log("===== INPUT MARKDOWN =====");
  console.log(fs.readFileSync("/site/index.md", "utf8"));

  const elev = new Eleventy(
    "/site",
    "/dist",
    {
      configPath: false
    }
  );

  await elev.write();

  const html = fs.readFileSync(
    "/dist/index.html",
    "utf8"
  );

  console.log("\\n===== OUTPUT HTML =====");
  console.log(html);

  console.log("\\n===== DONE =====");
})();
`
);

await runtime.runFile("/run-eleventy.js");