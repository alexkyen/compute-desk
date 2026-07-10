#!/usr/bin/env python3
"""Consolidate the compute-desk instruments into a single deliverable HTML file.

Usage: python3 consolidate.py
Add future instruments by appending (filename, anchor, label, title) to INSTRUMENTS
and rerunning. Source files are embedded as isolated srcdoc iframes, so their
scripts and element IDs never collide.
"""

import html, pathlib

SRC = pathlib.Path("/mnt/user-data/outputs")
OUT = SRC / "compute-desk.html"

INSTRUMENTS = [
    ("gpu-supply-book.html", "i01", "01", "The supply book"),
    ("silicon-ladder.html",  "i02", "02", "The silicon ladder"),
    ("the-fabric.html",      "i03", "03", "The fabric"),
    ("sla-anatomy.html",     "i04", "04", "SLA anatomy"),
]

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The compute desk — a buyer's field manual for GPUs</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<style>
:root{--paper:#F6F7F3;--panel:#FDFDFB;--ink:#15201A;--ink-2:#4A574F;--ink-3:#8A968E;
--rule:#DDE2DB;--teal:#117758;--mono:"IBM Plex Mono",ui-monospace,monospace;--serif:"Newsreader",Georgia,serif;}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--paper);scroll-behavior:smooth}
body{font-family:var(--serif);color:var(--ink);line-height:1.6}
.nav{position:sticky;top:0;z-index:10;background:var(--paper);border-bottom:1px solid var(--rule);
display:flex;gap:4px 22px;flex-wrap:wrap;justify-content:center;padding:12px 20px}
.nav a{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;
color:var(--ink-3);text-decoration:none;cursor:pointer}
.nav a:hover,.nav a:focus-visible{color:var(--teal);outline:none}
.nav a b{font-weight:500;color:var(--ink-2)}
.cover{max-width:880px;margin:0 auto;padding:72px 20px 28px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3)}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:clamp(38px,6vw,58px);
line-height:1.05;margin:10px 0 14px;letter-spacing:-.01em}
.dek{font-size:18px;color:var(--ink-2);max-width:62ch}
.toc{margin-top:34px;border-top:1px solid var(--rule)}
.toc a{display:flex;gap:16px;align-items:baseline;padding:13px 2px;border-bottom:1px solid var(--rule);
text-decoration:none;color:var(--ink);cursor:pointer}
.toc a:focus-visible .t{color:var(--teal)}
.toc a:hover .t{color:var(--teal)}
.toc .n{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.1em}
.toc .t{font-family:var(--serif);font-style:italic;font-size:19px}
.toc .d{font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-left:auto;text-align:right}
section{scroll-margin-top:56px;border-top:1px solid var(--rule)}
section:first-of-type{border-top:none}
iframe{display:block;width:100%;border:none;height:1200px}
.colophon{max-width:880px;margin:0 auto;padding:34px 20px 60px;border-top:1px solid var(--rule);
font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.03em;line-height:1.9}
@media(max-width:560px){.toc .d{display:none}}
</style>
</head>
<body>
"""

TAIL = """<script>
function fit(f){try{var d=f.contentDocument;if(!d||!d.documentElement)return;
var h=d.documentElement.scrollHeight+2;
var cur=parseFloat(f.style.height)||0;
if(Math.abs(cur-h)>2){f.style.height=h+"px";}}catch(e){}}
function fitAll(){document.querySelectorAll("iframe").forEach(fit)}
document.querySelectorAll("iframe").forEach(function(f){
  f.addEventListener("load",function(){fit(f)});
});
fitAll();
setInterval(fitAll,250);
window.addEventListener("resize",fitAll);
function go(el){var t=document.getElementById(el.getAttribute("data-target"));
if(t){t.scrollIntoView({behavior:"smooth",block:"start"});}}
document.querySelectorAll("[data-target]").forEach(function(a){
  a.addEventListener("click",function(){go(this)});
  a.addEventListener("keydown",function(e){
    if(e.key==="Enter"||e.key===" "){e.preventDefault();go(this);}
  });
});
</script>
</body>
</html>
"""

def build():
    parts = [HEAD]

    parts.append('<nav class="nav">')
    for _, anchor, num, title in INSTRUMENTS:
        parts.append('<a data-target="%s" role="link" tabindex="0"><b>%s</b> %s</a>' % (anchor, num, html.escape(title)))
    parts.append("</nav>")

    descriptions = {
        "i01": "how much capacity to commit",
        "i02": "what you are buying, and its clock",
        "i03": "what the wiring does to the price",
        "i04": "what the paper actually protects",
    }

    parts.append('<div class="cover">')
    parts.append('<p class="eyebrow">Compute desk</p>')
    parts.append("<h1>A buyer&rsquo;s field manual for GPUs</h1>")
    parts.append('<p class="dek">Four interactive instruments on the economics of GPU procurement: '
                 "how much capacity to commit and at what duration, what each silicon generation is "
                 "actually worth, what cluster wiring does to effective price, and what an SLA "
                 "does and does not protect. Every instrument ends where a buyer should: with the "
                 "questions to ask a supplier.</p>")
    parts.append('<div class="toc">')
    for _, anchor, num, title in INSTRUMENTS:
        parts.append('<a data-target="%s" role="link" tabindex="0"><span class="n">%s</span><span class="t">%s</span>'
                     '<span class="d">%s</span></a>'
                     % (anchor, num, html.escape(title), descriptions.get(anchor, "")))
    parts.append("</div></div>")

    for fname, anchor, num, title in INSTRUMENTS:
        doc = (SRC / fname).read_text(encoding="utf-8")
        escaped = doc.replace("&", "&amp;").replace('"', "&quot;")
        parts.append('<section id="%s"><iframe srcdoc="%s" title="%s" scrolling="no"></iframe></section>'
                     % (anchor, escaped, html.escape(title)))

    parts.append('<p class="colophon">the compute desk · four instruments, one document · '
                 "load-duration &amp; newsvendor framing after Modal, &ldquo;How to price serverless&rdquo; "
                 "· compiled July 2026</p>")
    parts.append(TAIL)

    OUT.write_text("".join(parts), encoding="utf-8")
    print("wrote %s (%d bytes, %d instruments)" % (OUT, OUT.stat().st_size, len(INSTRUMENTS)))

if __name__ == "__main__":
    build()
