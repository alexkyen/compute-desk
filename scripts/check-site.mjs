import {readFile, readdir, access} from "node:fs/promises";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import vm from "node:vm";
import {checkMarketEvidence} from "./market-policy.mjs";

const require=createRequire(import.meta.url);
const redirect=require("../assets/redirect.js");
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const files=(await readdir(root)).filter(name=>name.endsWith(".html"));
const failures=[];
const pages=new Map();
for(const file of files)pages.set(file,await readFile(resolve(root,file),"utf8"));
const redirectTarget=html=>html.match(/<html\b[^>]*\bdata-redirect="([^"]+)"/)?.[1];
const exists=async path=>{try{await access(resolve(root,path));return true}catch{return false}};
const designSheets=new Set();
let forwarding=0;

for(const [file,html] of pages){
  const target=redirectTarget(html);
  if(target){
    // A forwarding page for an old URL: it must reach a real page in one hop, keep saved
    // scenarios (redirect.js), work without JavaScript, and stay out of search results.
    forwarding++;
    if(!pages.has(target))failures.push(`${file}: forwards to missing page ${target}`);
    else if(redirectTarget(pages.get(target)))failures.push(`${file}: forwards to ${target}, which forwards again`);
    if(!html.includes('src="assets/redirect.js"'))failures.push(`${file}: forwarding page must load assets/redirect.js`);
    if(!/<noscript>\s*<meta http-equiv="refresh" content="0; url=[^"]*"/.test(html)||!html.includes(`url=${target}`))failures.push(`${file}: forwarding page needs a <noscript> refresh to ${target}`);
    if(!html.includes('name="robots" content="noindex"'))failures.push(`${file}: forwarding page must be noindex`);
    if(!new RegExp(`rel="canonical" href="[^"]*/${target.replace(".","\\.")}"`).test(html))failures.push(`${file}: canonical must point to ${target}`);
    if(!html.includes("<title>"))failures.push(`${file}: missing <title>`);
    try{redirect.parseRename(html.match(/\bdata-redirect-rename="([^"]*)"/)?.[1])}
    catch(error){failures.push(`${file}: ${error.message}`)}
    continue;
  }
  for(const token of ["<title>","name=\"description\"","property=\"og:image\"","rel=\"canonical\"","<main","skip-link","favicon.svg"]){
    if(!html.includes(token))failures.push(`${file}: missing ${token}`);
  }
  const links=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]);
  for(const link of links){
    if(!link||link.includes("+")||link.startsWith("#")||/^(https?:|mailto:|data:)/.test(link))continue;
    const path=link.split(/[?#]/)[0];
    if(!await exists(path))failures.push(`${file}: broken local asset or link ${link}`);
    else if(pages.has(path)&&redirectTarget(pages.get(path)))failures.push(`${file}: links to ${path}, which now forwards to ${redirectTarget(pages.get(path))}; link there directly`);
  }
  // Pages built on the design system: every stylesheet they load follows its type rules.
  const sheets=[...html.matchAll(/<link rel="stylesheet" href="(assets\/[^"?]+\.css)"/g)].map(match=>match[1]);
  if(sheets.includes("assets/site.css"))sheets.forEach(sheet=>designSheets.add(sheet));
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

// The type system: two families and five sizes, all set in site.css. Every size is a token,
// and no token is smaller than 13px.
const SIZES=["--fs-display","--fs-title","--fs-body","--fs-ui","--fs-small"];
for(const sheet of designSheets){
  const css=(await readFile(resolve(root,sheet),"utf8")).replace(/\/\*[\s\S]*?\*\//g,"");
  for(const [,name,value] of css.matchAll(/(--fs-[a-z-]+)\s*:\s*([^;}]+)/g)){
    if(!SIZES.includes(name))failures.push(`${sheet}: ${name} is not one of the five text sizes (${SIZES.join(", ")})`);
    const smallest=Math.min(...[...value.matchAll(/([\d.]+)px/g)].map(match=>Number(match[1])));
    if(smallest<13)failures.push(`${sheet}: ${name} reaches ${smallest}px; the floor is 13px`);
  }
  for(const [declaration,property,value] of css.matchAll(/(?<![-\w])(font-size|font)\s*:\s*([^;}]+)/g)){
    if(value.trim()!=="inherit"&&!/var\(--fs-[a-z-]+\)/.test(value))failures.push(`${sheet}: "${declaration.trim()}" must use a --fs- size token`);
  }
  for(const [declaration,value] of css.matchAll(/(?<![-\w])font-family\s*:\s*([^;}]+)/g)){
    if(!/^var\(--(serif|sans)\)$/.test(value.trim()))failures.push(`${sheet}: "${declaration.trim()}" must use var(--serif) or var(--sans)`);
  }
}

// Market evidence: any page that shows prices declares when they were verified and whether
// they are live or archived. Archived prices need a dated notice outside collapsed panels.
const evidence=[];
for(const [file,html] of pages){
  const verified=html.match(/data-market-verified="([^"]+)"/)?.[1];
  if(!verified)continue;
  const status=html.match(/data-market-status="([^"]+)"/)?.[1]||"live";
  const noticeMatch=html.match(/<([a-z0-9]+)[^>]*data-market-notice="archived"[^>]*>([\s\S]*?)<\/\1>/i);
  const notice=noticeMatch?.[2].replace(/<[^>]+>/g," ")||"";
  if(noticeMatch){
    const preceding=html.slice(0,noticeMatch.index);
    const unclosedDetails=(preceding.match(/<details\b/g)||[]).length-(preceding.match(/<\/details>/g)||[]).length;
    if(unclosedDetails>0||/\bhidden\b|aria-hidden="true"/.test(noticeMatch[0].split(">",1)[0]))failures.push(`${file}: market archive notice must be visible without opening a disclosure`);
  }
  failures.push(...checkMarketEvidence({verified,status,notice}).map(error=>`${file}: ${error}`));
  evidence.push({file,verified,status});
}
if(!evidence.length)failures.push("no page declares market evidence (data-market-verified); the price pages lost their verification date");

if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log(`Checked ${pages.size} HTML pages (${forwarding} forwarding): metadata, landmarks, local links, all JavaScript syntax, ${designSheets.size} design-system stylesheet(s), and market evidence policy passed.`);
for(const {file,verified,status} of evidence)if(status==="archived")console.log(`${file} shows explicitly archived prices. Original verification date: ${verified}.`);
