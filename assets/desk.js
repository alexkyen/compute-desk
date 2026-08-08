(function(){
  "use strict";
  var VERSION="2026.08";

  function flash(el,message){
    var out=el&&el.closest(".tool-actions")&&el.closest(".tool-actions").nextElementSibling;
    if(out&&out.classList.contains("tool-message")){out.textContent=message;setTimeout(function(){out.textContent=""},2600)}
  }

  function copyText(text,button,message){
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){flash(button,message||"Copied")});
    }else{
      var ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";
      document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();flash(button,message||"Copied");
    }
  }

  function permalink(){return location.href}

  document.addEventListener("click",function(e){
    var copy=e.target.closest("[data-copy-link]");
    if(copy){copyText(permalink(),copy,"Scenario link copied");return}
    var print=e.target.closest("[data-print]");
    if(print){window.print();return}
    var exportButton=e.target.closest("[data-export-text]");
    if(exportButton){
      var target=document.querySelector(exportButton.getAttribute("data-export-text"));
      if(target)copyText(target.innerText.trim(),exportButton,"Summary copied");
    }
  });

  window.ComputeDesk={
    version:VERSION,
    params:function(){return new URLSearchParams(location.search)},
    setParams:function(values){
      var url=new URL(location.href);
      Object.keys(values).forEach(function(key){
        var value=values[key];
        if(value===null||value===undefined||value==="")url.searchParams.delete(key);
        else url.searchParams.set(key,String(value));
      });
      history.replaceState(null,"",url);
    },
    copyText:copyText,
    download:function(name,content,type){
      var blob=new Blob([content],{type:type||"text/plain;charset=utf-8"});
      var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},0);
    },
    announce:function(message){
      var live=document.getElementById("desk-live");
      if(!live){live=document.createElement("div");live.id="desk-live";live.className="sr-only";live.setAttribute("aria-live","polite");document.body.appendChild(live)}
      live.textContent="";setTimeout(function(){live.textContent=message},20);
    }
  };
})();
