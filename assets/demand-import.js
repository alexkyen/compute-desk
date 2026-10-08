/* Shared by the browser tool and its regression checks. No file leaves the browser. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ComputeDeskDemand=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function fieldsOf(row,line){
    var delimiter=null,quoted=false;
    for(var i=0;i<row.length;i++){
      if(row[i]==='"')quoted=!quoted;
      else if(!quoted&&/[;,\t]/.test(row[i])){delimiter=row[i];break}
    }
    if(!delimiter&&row.indexOf('"')===-1)return row.trim().split(/\s+/);
    var fields=[],field='',inside=false;
    for(var j=0;j<row.length;j++){
      var ch=row[j];
      if(ch==='"'){
        if(inside&&row[j+1]==='"'){field+='"';j++}
        else inside=!inside;
      }else if(ch===delimiter&&!inside){fields.push(field.trim());field=''}
      else field+=ch;
    }
    if(inside)throw new Error('Row '+line+': close the quoted field before importing.');
    fields.push(field.trim());
    return fields;
  }
  function isHeader(fields){
    var label=fields[fields.length-1].toLowerCase().replace(/[^a-z]/g,'');
    return /^(demand|demandgpus|demandgpu|gpudemand|gpus|gpu|gpucount|gpusrequired|count|value|load|capacity|usage|gpuusage|numberofgpus|observedhourlydemand|hourlydemand)$/.test(label);
  }
  function parse(text){
    var values=[],seenRow=false;
    String(text).replace(/^\uFEFF/,'').split(/\r\n?|\n/).forEach(function(row,index){
      if(!row.trim())return;
      var fields=fieldsOf(row,index+1),last=fields[fields.length-1];
      if(!seenRow&&isHeader(fields)){seenRow=true;return}
      seenRow=true;
      // Validate the intended demand column first. Never fall back to a timestamp or index.
      if(last===''||!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(last)||!Number.isFinite(Number(last))){
        throw new Error('Row '+(index+1)+': the final field must be a non-negative demand number. Check missing, invalid, or negative values.');
      }
      values.push(Number(last));
    });
    if(values.length<2)throw new Error('Add at least two demand observations. An optional first-row header can end in demand, GPUs, or value.');
    if(!values.some(function(v){return v>0}))throw new Error('Include at least one demand observation above zero. Zero-demand hours can remain.');
    return values;
  }
  function cost(values,k,reserved,elastic){
    return reserved*k+elastic*values.reduce(function(total,value){return total+Math.max(0,value-k)/values.length},0);
  }
  function bestCommitment(values,reserved,elastic){
    if(reserved>=elastic)return 0;
    var sorted=values.slice().sort(function(a,b){return a-b});
    // The empirical distribution is discrete. At exact breakeven, prefer the smaller commitment.
    var position=Math.max(0,Math.ceil(sorted.length*(1-reserved/elastic)-1e-12)-1);
    var continuous=sorted[position],lo=Math.floor(continuous),hi=Math.ceil(continuous);
    return cost(values,hi,reserved,elastic)<cost(values,lo,reserved,elastic)-1e-9?hi:lo;
  }
  function clampCommitment(value,peak){return Math.max(0,Math.min(Math.ceil(peak),Math.round(value)))}
  return {parse:parse,bestCommitment:bestCommitment,clampCommitment:clampCommitment};
});
