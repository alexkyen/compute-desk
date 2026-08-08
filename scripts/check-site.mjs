import {readFile, readdir, access} from "node:fs/promises";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const files=(await readdir(root)).filter(name=>name.endsWith(".html"));
const failures=[];

for(const file of files){
  const html=await readFile(resolve(root,file),"utf8");
  for(const token of ["<title>","name=\"description\"","property=\"og:image\"","rel=\"canonical\"","<main","skip-link","favicon.svg"]){
    if(!html.includes(token))failures.push(`${file}: missing ${token}`);
  }
  const links=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]);
  for(const link of links){
    if(!link||link.includes("+")||link.startsWith("#")||/^(https?:|mailto:|data:)/.test(link))continue;
    const path=link.split(/[?#]/)[0];
    try{await access(resolve(root,path))}catch{failures.push(`${file}: broken local asset or link ${link}`)}
  }
  const inlineScripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  for(const [,source] of inlineScripts){
    try{new vm.Script(source,{filename:file})}
    catch(error){failures.push(`${file}: inline JavaScript syntax error: ${error.message}`)}
  }
}

const atlas=await readFile(resolve(root,"the-atlas-scatter.html"),"utf8");
const match=atlas.match(/data-market-verified="(\d{4}-\d{2}-\d{2})"/);
if(!match)failures.push("the-atlas-scatter.html: missing market verification date");
else{
  const age=(Date.now()-new Date(`${match[1]}T00:00:00Z`).getTime())/86400000;
  if(age>45)failures.push(`market data is ${Math.floor(age)} days old (limit: 45)`);
}

if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`Checked ${files.length} HTML pages: metadata, landmarks, local links, and market freshness passed.`);
