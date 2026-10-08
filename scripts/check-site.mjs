import {readFile, readdir, access} from "node:fs/promises";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import {checkMarketEvidence} from "./market-policy.mjs";

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

// Check local script syntax as well as page-level inline scripts.
for(const file of (await readdir(resolve(root,"assets"))).filter(name=>name.endsWith(".js"))){
  try{new vm.Script(await readFile(resolve(root,"assets",file),"utf8"),{filename:file})}
  catch(error){failures.push(`${file}: JavaScript syntax error: ${error.message}`)}
}
const atlas=await readFile(resolve(root,"the-atlas-scatter.html"),"utf8");
const verified=atlas.match(/data-market-verified="([^"]+)"/)?.[1];
const status=atlas.match(/data-market-status="([^"]+)"/)?.[1]||"live";
const noticeMatch=atlas.match(/<([a-z0-9]+)[^>]*data-market-notice="archived"[^>]*>([\s\S]*?)<\/\1>/i);
const notice=noticeMatch?.[2].replace(/<[^>]+>/g," ")||"";
if(noticeMatch){
  const preceding=atlas.slice(0,noticeMatch.index);
  const unclosedDetails=(preceding.match(/<details\b/g)||[]).length-(preceding.match(/<\/details>/g)||[]).length;
  if(unclosedDetails>0||/\bhidden\b|aria-hidden="true"/.test(noticeMatch[0].split(">",1)[0]))failures.push("market archive notice must be visible without opening a disclosure");
}
failures.push(...checkMarketEvidence({verified,status,notice}).map(error=>`the-atlas-scatter.html: ${error}`));

if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`Checked ${files.length} HTML pages: metadata, landmarks, local links, all JavaScript syntax, and market evidence policy passed.`);
if(status==="archived")console.log(`Price atlas is explicitly archived. Original verification date: ${verified}.`);
