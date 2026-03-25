const fs = require("fs");

function checkPage(htmlFile, jsFile, elVar) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const js   = fs.readFileSync(jsFile, "utf8");

  const htmlIds = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), m => m[1]));

  const pattern = new RegExp(`${elVar}\\.(\\w+)`, "g");
  const jsIds   = new Set(Array.from(js.matchAll(pattern), m => m[1]));

  const missing = [...jsIds].filter(id => !htmlIds.has(id) && id !== "length" && id !== "value" && id !== "files" && id !== "required" && id !== "checked" && id !== "style" && id !== "innerHTML" && id !== "textContent" && id !== "className" && id !== "classList" && id !== "dataset" && id !== "reset" && id !== "scrollIntoView" && id !== "focus" && id !== "addEventListener" && id !== "closest" && id !== "querySelectorAll" && id !== "forEach" && id !== "join" && id !== "map" && id !== "filter" && id !== "find" && id !== "sort" && id !== "split" && id !== "trim" && id !== "toLowerCase" && id !== "includes" && id !== "replace" && id !== "slice" && id !== "push" && id !== "pop" && id !== "shift" && id !== "unshift" && id !== "concat" && id !== "indexOf" && id !== "keys" && id !== "values" && id !== "entries" && id !== "fromEntries" && id !== "assign" && id !== "create" && id !== "keys" && id !== "values" && id !== "entries" && id !== "target" && id !== "preventDefault" && id !== "stopPropagation" && id !== "location" && id !== "href" && id !== "open" && id !== "close" && id !== "setTimeout" && id !== "clearTimeout" && id !== "display");

  if (missing.length) {
    console.log(`MISSING IDs in ${htmlFile}:`, missing.join(", "));
    return false;
  }
  console.log(`OK: ${htmlFile} — all ${jsIds.size} element refs found`);
  return true;
}

let ok = true;
ok = checkPage("public/dashboard.html", "public/dashboard.js", "el") && ok;
ok = checkPage("public/settings.html",  "public/settings.js",  "settings") && ok;

process.exit(ok ? 0 : 1);
