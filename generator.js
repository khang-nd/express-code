const fs = require("fs");
let iPath = "";
let oPath = __dirname + "/src/data";

// generate snippets.json
iPath = __dirname + "/src/snippets";
const snippets = fs.readdirSync(iPath).map((file) => {
  const name = file.split(".");
  return {
    language: name.pop(),
    author: name.join(),
    content: fs.readFileSync(`${iPath}/${file}`, "utf-8"),
  };
});
fs.writeFile(oPath + "/snippets.json", JSON.stringify(snippets), () => {});

// generate modes.json + themes.json
iPath = __dirname + "/public/vendors/codemirror";
const themes = fs.readdirSync(iPath + "/theme").map((dir) => dir);
const modes = fs
  .readdirSync(iPath + "/mode", { withFileTypes: true })
  .filter((dir) => dir.isDirectory())
  .map((dir) => dir.name);
fs.writeFile(oPath + "/themes.json", JSON.stringify(themes), () => {});
fs.writeFile(oPath + "/modes.json", JSON.stringify(modes), () => {});
