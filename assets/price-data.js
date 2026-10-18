/* GPU rental prices, checked 18 October 2026. Every price comes from the seller's own public
   price page or price API on that date; the Ornn index row is its 17 October settlement. A
   per-GPU price is the instance price divided by its GPU count, US regions unless noted.
   Each priced cell keeps its display value (v), the number the board plots and sorts (n: the
   list price, the midpoint of a published range, a marketplace median, or a spot floor), a
   note with the raw figures (t), and a source id (src).
   cell states: p = priced, q = sold but no public price. A cell left out is not listed. */
(function () {
var SOURCES=[
 {id:"S1",label:"AWS EC2 Capacity Blocks pricing",url:"https://aws.amazon.com/ec2/capacityblocks/pricing/",note:"rates in effect 18 Oct 2026; AWS reprices next in January 2027"},
 {id:"S2",label:"AWS EC2 on-demand pricing",url:"https://aws.amazon.com/ec2/pricing/on-demand/",note:"US East (N. Virginia), Linux, 18 Oct 2026"},
 {id:"S3",label:"AWS EC2 Spot pricing",url:"https://aws.amazon.com/ec2/spot/pricing/",note:"lowest price per instance type in US East (N. Virginia, Ohio) and US West (Oregon), Linux, 18 Oct 2026"},
 {id:"S4",label:"AWS EC2 P6 instances (P6e-GB300 UltraServers)",url:"https://aws.amazon.com/ec2/instance-types/p6/",note:"offered; no public price"},
 {id:"S5",label:"Microsoft Azure Linux VM pricing",url:"https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/",note:"pay-as-you-go, spot, and reservation rates from the Azure Retail Prices API, East US and East US 2, 18 Oct 2026"},
 {id:"S6",label:"Azure ND GB300 v6 series",url:"https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-gb300-v6-series",note:"documented; not in the retail price list"},
 {id:"S7",label:"Google Cloud accelerator-optimized VM pricing",url:"https://cloud.google.com/products/compute/pricing/accelerator-optimized",note:"Iowa (us-central1): on-demand, spot, Dynamic Workload Scheduler, and committed-use rates, 18 Oct 2026"},
 {id:"S8",label:"Google Cloud accelerator-optimized machines (A4X, A4X Max)",url:"https://cloud.google.com/compute/docs/accelerator-optimized-machines",note:"documented; no public price"},
 {id:"S9",label:"Oracle Cloud price list",url:"https://www.oracle.com/cloud/price-list/",note:"pay-as-you-go per GPU-hour, from Oracle's price-list API, 18 Oct 2026"},
 {id:"S10",label:"CoreWeave pricing",url:"https://www.coreweave.com/pricing",note:"North America, instance price ÷ GPUs, 18 Oct 2026"},
 {id:"S11",label:"Nebius prices",url:"https://nebius.com/prices",note:"18 Oct 2026"},
 {id:"S12",label:"Lambda pricing",url:"https://lambda.ai/pricing",note:"18 Oct 2026"},
 {id:"S13",label:"Lambda homepage (GB300 NVL72, HGX B300, H200)",url:"https://lambda.ai/",note:"offered; not on the public price page"},
 {id:"S14",label:"Crusoe Cloud pricing",url:"https://crusoe.ai/cloud/pricing",note:"18 Oct 2026"},
 {id:"S15",label:"Verda (formerly DataCrunch) pricing",url:"https://verda.com/pricing",note:"on-demand, spot, and published commitment discounts, 18 Oct 2026"},
 {id:"S16",label:"Nscale press release: about 200,000 GB300 GPUs contracted to Microsoft",url:"https://www.nscale.com/press-releases/nscale-microsoft-2025",note:"15 Oct 2025; wholesale, no public price"},
 {id:"S17",label:"SF Compute instance types",url:"https://docs.sfcompute.com/current/instance-types",note:"H100 and H200 on its market; prices shown only after sign-in"},
 {id:"S18",label:"Vast.ai live GPU prices",url:"https://vast.ai/pricing",note:"lowest and median on-demand offer, 18 Oct 2026; interruptible bids from Vast's public offer search the same day"},
 {id:"S19",label:"Ornn Compute Price Index (OCPI)",url:"https://data.ornn.com/",note:"settled 17 Oct 2026; volume-weighted average of paid on-demand rentals; methodology at data.ornn.com/methodology"}
];
var PROV=[
 {id:"aws",ab:"AWS",name:"AWS",band:"Hyperscalers",g:"hyp",arch:"hyperscaler"},
 {id:"azr",ab:"AZR",name:"Microsoft Azure",band:"Hyperscalers",g:"hyp",arch:"hyperscaler"},
 {id:"gcp",ab:"GCP",name:"Google Cloud",band:"Hyperscalers",g:"hyp",arch:"hyperscaler"},
 {id:"oci",ab:"OCI",name:"Oracle (OCI)",band:"Hyperscalers",g:"hyp",arch:"levered hyperscaler"},
 {id:"crw",ab:"CRW",name:"CoreWeave",band:"Neoclouds",g:"neo",arch:"public neocloud"},
 {id:"neb",ab:"NEB",name:"Nebius",band:"Neoclouds",g:"neo",arch:"public neocloud"},
 {id:"lmb",ab:"LMB",name:"Lambda",band:"Neoclouds",g:"neo",arch:"private neocloud"},
 {id:"cru",ab:"CRU",name:"Crusoe",band:"Neoclouds",g:"neo",arch:"energy-first builder"},
 {id:"vrd",ab:"VRD",name:"Verda",band:"Neoclouds",g:"neo",arch:"neocloud"},
 {id:"fld",ab:"FLD",name:"Fluidstack",band:"Neoclouds",g:"neo",arch:"builder and operator"},
 {id:"nsc",ab:"NSC",name:"Nscale",band:"Neoclouds",g:"neo",arch:"sovereign wholesale"},
 {id:"sfc",ab:"SFC",name:"SF Compute",band:"Marketplaces",g:"mkt",arch:"cluster market"},
 {id:"vst",ab:"VST",name:"Vast.ai",band:"Marketplaces",g:"mkt",arch:"p2p marketplace"},
 {id:"orn",ab:"ORN",name:"Ornn index",band:"Price index",g:"idx",arch:"index of paid rentals"}
];
var SKUS=[
 {id:"gb300",l:"GB300 NVL72",s:"Blackwell Ultra rack"},
 {id:"gb200",l:"GB200 NVL72",s:"Blackwell rack"},
 {id:"b300",l:"B300",s:"HGX 8-GPU"},
 {id:"b200",l:"B200",s:"HGX 8-GPU"},
 {id:"h200",l:"H200",s:"SXM 141GB"},
 {id:"h100",l:"H100",s:"SXM 80GB"},
 {id:"a100",l:"A100",s:"80GB class"},
 {id:"l40s",l:"L40S / RTX",s:"inference class"}
];
function P(v,n,t,src){return{v:v,n:n,s:"p",t:t,src:src}}
function Q(v,t,src){return{v:v||"quote",s:"q",t:t,src:src}}
var CH=[{id:"od",l:"Pay as you go"},{id:"sp",l:"Can be interrupted"},{id:"co",l:"Commit ahead"}];
var M={od:{},sp:{},co:{}};
function put(ch,sku,prov,cell){ M[ch][sku]=M[ch][sku]||{}; M[ch][sku][prov]=cell; }

/* ---------- AWS ---------- */
put("od","b300","aws",P("17.80",17.80,"p6-b300.48xlarge $142.42/hr ÷ 8","S2"));
put("co","b300","aws",P("16.15",16.15,"Capacity Block, p6-b300 $129.17/hr ÷ 8, paid up front","S1"));
put("od","b200","aws",P("14.24",14.24,"p6-b200.48xlarge $113.93/hr ÷ 8","S2"));
put("co","b200","aws",P("14.21",14.21,"Capacity Block, p6-b200 $113.67/hr ÷ 8, paid up front","S1"));
put("co","gb200","aws",P("10.58",10.58,"Capacity Block, P6e-GB200 UltraServer $761.90/hr ÷ 72 · Dallas Local Zone only","S1"));
put("co","gb300","aws",Q("quote","P6e-GB300 UltraServers offered · no public price","S4"));
put("od","h200","aws",P("7.91",7.91,"p5en.48xlarge $63.30/hr ÷ 8","S2"));
put("co","h200","aws",P("6.87–7.90",7.38,"Capacity Blocks: p5e $6.87, p5en $7.90 per GPU","S1"));
put("od","h100","aws",P("6.88",6.88,"p5.48xlarge $55.04/hr ÷ 8 · p5.4xlarge (1 GPU) also $6.88","S2"));
put("co","h100","aws",P("5.97",5.97,"Capacity Block, p5.48xlarge $47.76/hr ÷ 8","S1"));
put("sp","h100","aws",P("2.85–3.61",3.23,"p5.48xlarge spot ÷ 8, lowest in each region: Ohio $2.85, N. Virginia $3.51, Oregon $3.61 · 1-GPU p5.4xlarge from $2.63","S3"));
put("sp","h200","aws",P("3.32–5.80",4.56,"spot ÷ 8, lowest in each region: p5e $3.32–4.42, p5en $3.57–5.80","S3"));
put("sp","b200","aws",P("5.68–10.19",7.94,"p6-b200 spot ÷ 8, lowest in each region: Oregon $5.68, Ohio $8.40, N. Virginia $10.19","S3"));
put("sp","b300","aws",P("7.13–8.12",7.63,"p6-b300 spot ÷ 8: N. Virginia $7.13, Oregon $8.12","S3"));
put("sp","a100","aws",P("1.95–2.57",2.26,"p4de (80GB) spot ÷ 8: Oregon $1.95, N. Virginia $2.57","S3"));
put("sp","l40s","aws",P("1.65–1.75",1.70,"g6e.xlarge spot, 1 L40S, lowest in each region","S3"));
put("od","a100","aws",P("3.43",3.43,"p4de.24xlarge (80GB) $27.45/hr ÷ 8 · p4d (40GB) $2.74","S2"));
put("co","a100","aws",P("2.55",2.55,"Capacity Block, p4de (80GB) $20.37/hr ÷ 8 · p4d (40GB) $1.70","S1"));
put("od","l40s","aws",P("1.86",1.86,"g6e.xlarge, 1 L40S · g6e.48xlarge works out to $3.77 per GPU","S2"));

/* ---------- Microsoft Azure ---------- */
put("od","gb300","azr",Q("quote","ND GB300 v6 documented · not in the retail price list","S6"));
put("od","gb200","azr",P("27.04",27.04,"ND128isr GB200 v6 $108.16/hr ÷ 4 GPUs · East US","S5"));
put("co","gb200","azr",P("11.90–17.31",14.61,"reservation ÷ 4: 3-year $11.90, 1-year $17.31 · East US 2","S5"));
put("sp","gb200","azr",P("27.04",27.04,"spot meter listed at the full pay-as-you-go rate in US regions","S5"));
put("od","h200","azr",P("10.60",10.60,"ND96isr H200 v5 $84.80/hr ÷ 8 · East US 2","S5"));
put("co","h200","azr",P("5.28–5.82",5.55,"reservation ÷ 8: 3-year $5.28, 1-year $5.82 · East US 2","S5"));
put("sp","h200","azr",P("10.60",10.60,"spot meter listed at the full pay-as-you-go rate in US regions","S5"));
put("od","h100","azr",P("6.98–12.29",9.64,"NC40ads H100 v5 (1 H100 NVL) $6.98 · ND96isr H100 v5 (8 SXM) $98.32 ÷ 8 = $12.29 · East US","S5"));
put("co","h100","azr",P("5.40–7.87",6.64,"ND96isr reservation ÷ 8: 3-year $5.40, 1-year $7.87 · East US 2","S5"));
put("sp","h100","azr",P("2.27–2.95",2.61,"ND96isr spot ÷ 8 across US regions, East US lowest","S5"));
put("od","a100","azr",P("3.67–4.10",3.89,"NC24ads A100 v4 (1 GPU) $3.67 · ND96amsr A100 v4 $32.77 ÷ 8 = $4.10 · East US","S5"));
put("co","a100","azr",P("1.80–2.62",2.21,"ND96amsr reservation ÷ 8: 3-year $1.80, 1-year $2.62 · East US 2","S5"));
put("sp","a100","azr",P("0.95–1.37",1.16,"ND96amsr spot ÷ 8 across US regions; East US $1.06","S5"));

/* ---------- Google Cloud ---------- */
put("od","gb300","gcp",Q("quote","A4X Max documented · no public price","S8"));
put("od","gb200","gcp",Q("quote","A4X documented · no public price","S8"));
put("od","b200","gcp",P("8.06",8.06,"a4-highgpu-8g $64.44/hr ÷ 8 via Dynamic Workload Scheduler flex-start (queued start); no standard on-demand rate","S7"));
put("co","b200","gcp",P("7.09–11.12",9.10,"committed use ÷ 8: 3-year $7.09, 1-year $11.12 · calendar-mode reservation $11.28","S7"));
put("sp","b200","gcp",P("4.95",4.95,"a4-highgpu-8g spot $39.63/hr ÷ 8","S7"));
put("od","h200","gcp",P("10.60",10.60,"a3-ultragpu-8g $84.81/hr ÷ 8 · flex-start $5.30","S7"));
put("co","h200","gcp",P("4.65–7.31",5.98,"committed use ÷ 8: 3-year $4.65, 1-year $7.31 · calendar mode $7.42","S7"));
put("sp","h200","gcp",P("6.35",6.35,"a3-ultragpu-8g spot $50.80/hr ÷ 8","S7"));
put("od","h100","gcp",P("11.06",11.06,"a3-highgpu-8g $88.49/hr ÷ 8 · a3-megagpu $11.68 · flex-start $4.79","S7"));
put("co","h100","gcp",P("4.86–7.67",6.27,"a3-highgpu committed use ÷ 8: 3-year $4.86, 1-year $7.67 · calendar mode $5.20","S7"));
put("sp","h100","gcp",P("6.60",6.60,"a3-highgpu-8g spot $52.79/hr ÷ 8","S7"));
put("od","a100","gcp",P("5.07",5.07,"a2-ultragpu-1g (A100 80GB) · flex-start $2.40","S7"));
put("co","a100","gcp",P("3.50–4.20",3.85,"a2-ultragpu-1g committed use: 3-year $3.50, 1-year $4.20","S7"));
put("sp","a100","gcp",P("3.04",3.04,"a2-ultragpu-1g spot","S7"));
put("od","l40s","gcp",P("4.50",4.50,"g4-standard-48, 1 RTX PRO 6000 (no L40S offered) · flex-start $2.25","S7"));
put("co","l40s","gcp",P("1.98–3.11",2.55,"g4-standard-48 committed use: 3-year $1.98, 1-year $3.11","S7"));
put("sp","l40s","gcp",P("1.63",1.63,"g4-standard-48 spot, 1 RTX PRO 6000","S7"));

/* ---------- Oracle (OCI): one pay-as-you-go list price per GPU ---------- */
put("od","gb300","oci",P("18.00",18.00,"GPU – GB300 list · BM.GPU.GB300.4 shape","S9"));
put("od","gb200","oci",P("16.00",16.00,"GPU – GB200 list · BM.GPU.GB200.4 shape","S9"));
put("od","b300","oci",P("15.00",15.00,"GPU – B300 list · BM.GPU.B300.8","S9"));
put("od","b200","oci",P("14.00",14.00,"GPU – B200 list · BM.GPU.B200.8","S9"));
put("od","h200","oci",P("10.00",10.00,"GPU – H200 list · BM.GPU.H200.8","S9"));
put("od","h100","oci",P("10.00",10.00,"GPU – H100 list · BM.GPU.H100.8","S9"));
put("od","a100","oci",P("4.00",4.00,"GPU – A100 v2 (80GB) list · BM.GPU.A100-v2.8","S9"));
put("od","l40s","oci",P("3.50",3.50,"GPU – L40S list · RTX PRO 6000 $4.50","S9"));
["gb300","gb200","b300","b200","h200","h100","a100","l40s"].forEach(function(sk){
  put("co",sk,"oci",Q("quote","negotiated rates under Universal Credits; no public committed price","S9"));
});

/* ---------- CoreWeave (North America; committed use up to 60% below on-demand) ---------- */
put("od","gb300","crw",Q("quote","GB300 NVL72 · contact sales","S10"));
put("od","gb200","crw",P("10.50",10.50,"GB200 NVL72 instance (4 GPUs) $42.00/hr ÷ 4 · no spot","S10"));
put("od","b300","crw",Q("quote","HGX B300 on-demand · contact sales","S10"));
put("sp","b300","crw",P("4.48",4.48,"HGX B300 spot $35.84/hr ÷ 8","S10"));
put("od","b200","crw",P("8.60",8.60,"HGX B200 $68.80/hr ÷ 8","S10"));
put("sp","b200","crw",P("4.26",4.26,"HGX B200 spot $34.11/hr ÷ 8","S10"));
put("od","h200","crw",P("6.31",6.31,"HGX H200 $50.44/hr ÷ 8","S10"));
put("sp","h200","crw",P("2.62",2.62,"HGX H200 spot $20.93/hr ÷ 8","S10"));
put("od","h100","crw",P("6.16",6.16,"HGX H100 $49.24/hr ÷ 8","S10"));
put("sp","h100","crw",P("2.46",2.46,"HGX H100 spot $19.71/hr ÷ 8","S10"));
put("od","a100","crw",P("2.70",2.70,"A100 80GB $21.60/hr ÷ 8","S10"));
put("sp","a100","crw",P("1.21",1.21,"A100 spot $9.65/hr ÷ 8","S10"));
put("od","l40s","crw",P("2.25",2.25,"L40S $18.00/hr ÷ 8 · RTX PRO 6000 $2.50","S10"));
put("sp","l40s","crw",P("0.99",0.99,"L40S spot $7.88/hr ÷ 8 · RTX PRO 6000 $1.39","S10"));
["gb300","gb200","b300","b200","h200","h100","a100","l40s"].forEach(function(sk){
  put("co",sk,"crw",Q("up to −60%","committed usage up to 60% below on-demand · by quote","S10"));
});

/* ---------- Nebius (spot floats between the floor and one cent under on-demand) ---------- */
put("od","gb300","neb",Q("quote","GB300 NVL72 · contact us","S11"));
put("od","gb200","neb",Q("quote","GB200 NVL72 · contact us","S11"));
put("od","b300","neb",P("9.50",9.50,"HGX B300","S11"));
put("sp","b300","neb",P("0.99–9.49",0.99,"spot from $0.99, capped one cent under on-demand","S11"));
put("od","b200","neb",P("8.50",8.50,"HGX B200","S11"));
put("sp","b200","neb",P("0.99–8.49",0.99,"spot from $0.99, capped one cent under on-demand","S11"));
put("od","h200","neb",P("5.40",5.40,"HGX H200","S11"));
put("sp","h200","neb",P("0.79–5.39",0.79,"spot from $0.79, capped one cent under on-demand","S11"));
put("od","h100","neb",P("4.50",4.50,"HGX H100","S11"));
put("sp","h100","neb",P("0.79–4.49",0.79,"spot from $0.79, capped one cent under on-demand","S11"));
put("od","l40s","neb",P("1.55",1.55,"L40S with Intel CPU, from $1.55 · RTX PRO 6000 $1.80","S11"));
put("sp","l40s","neb",P("0.74",0.74,"L40S preemptible, flat rate · RTX PRO 6000 spot from $0.79","S11"));
["gb300","gb200","b300","b200","h200","h100","l40s"].forEach(function(sk){
  put("co",sk,"neb",Q("up to −35%","reserved clusters up to 35% below on-demand · by quote","S11"));
});

/* ---------- Lambda ---------- */
put("od","b200","lmb",P("6.69–6.99",6.84,"B200 SXM6 instances: 8 GPUs $6.69, 1 GPU $6.99","S12"));
put("co","b200","lmb",P("8.87–9.86",9.37,"1-Click Clusters with InfiniBand, 2 weeks to 1 year: 256+ GPUs $8.87, 16 GPUs $9.86","S12"));
put("od","h100","lmb",P("3.99–4.29",4.14,"H100 SXM instances: 8 GPUs $3.99, 1 GPU $4.29","S12"));
put("co","h100","lmb",P("5.54–6.16",5.85,"1-Click Clusters with InfiniBand, 2 weeks to 1 year: 256 GPUs $5.54, 16 GPUs $6.16","S12"));
put("od","a100","lmb",P("2.79",2.79,"A100 SXM 80GB, 8 GPUs","S12"));
put("co","gb300","lmb",Q("quote","single-tenant GB300 NVL72 clusters · by quote","S13"));
put("co","b300","lmb",Q("quote","HGX B300 · by quote","S13"));
put("co","h200","lmb",Q("quote","H200 · by quote","S13"));

/* ---------- Crusoe ---------- */
put("od","gb200","cru",Q("quote","GB200 NVL72 · contact sales","S14"));
put("od","b300","cru",P("9.90",9.90,"HGX B300","S14"));
put("od","b200","cru",P("8.50",8.50,"HGX B200","S14"));
put("od","h200","cru",P("5.40",5.40,"HGX H200","S14"));
put("od","h100","cru",P("4.50",4.50,"HGX H100","S14"));
put("od","a100","cru",P("2.00–2.30",2.15,"A100 80GB: PCIe $2.00, SXM $2.30","S14"));
put("od","l40s","cru",P("1.50",1.50,"L40S 48GB","S14"));
["gb200","b300","b200","h200","h100","a100","l40s"].forEach(function(sk){
  put("co",sk,"cru",Q("quote","reserved capacity · contact sales","S14"));
  if(sk!=="gb200")put("sp",sk,"cru",Q("quote","current spot price · contact sales","S14"));
});

/* ---------- Verda: committed = 25% off on-demand for 2 years (8% for 1 year) ---------- */
[["gb300",11.71,5.854,"GB300 SXM6 288GB"],["b300",10.18,5.090,"B300 SXM6 268GB"],["b200",8.029,4.015,"B200 SXM6 180GB"],
 ["h200",5.602,2.801,"H200 SXM5 141GB"],["h100",4.296,2.148,"H100 SXM5 80GB"],["a100",2.056,1.028,"A100 SXM4 80GB"],
 ["l40s",1.755,0.8775,"L40S 48GB · RTX PRO 6000 $2.37"]].forEach(function(r){
  var cents=function(x){return Number(Math.round(x+'e2')+'e-2')}; // decimal rounding: $4.015 → $4.02
  var od=cents(r[1]),sp=cents(r[2]),co=cents(r[1]*0.75);
  put("od",r[0],"vrd",P(od.toFixed(2),od,r[3]+" · $"+r[1]+"/hr per GPU","S15"));
  put("sp",r[0],"vrd",P(sp.toFixed(2),sp,r[3]+" spot · $"+r[2]+"/hr","S15"));
  put("co",r[0],"vrd",P(co.toFixed(2),co,"2-year term at the published 25% discount (1 year: 8%)","S15"));
});

/* ---------- Nscale and SF Compute: sold, but no public price ---------- */
put("co","gb300","nsc",Q("wholesale","about 200,000 GB300 GPUs contracted to Microsoft · no public price","S16"));
put("co","h200","sfc",Q("sign-in","H200 blocks traded on its market · price shown after sign-in","S17"));
put("co","h100","sfc",Q("sign-in","H100 blocks traded on its market · price shown after sign-in","S17"));

/* ---------- Vast.ai: lowest–median of live offers; interruptible = lowest–median minimum bid ---------- */
[["b300","9.86",9.86,"lowest and median offer both $9.86, 6 offers","5.00–7.50",7.50,6],
 ["b200","6.25–9.25",9.25,"lowest to median of 7 offers","5.94–7.12",7.12,7],
 ["h200","4.34–4.80",4.80,"lowest to median of 8 offers","3.30–3.63",3.63,8],
 ["h100","1.33–2.40",2.40,"H100 SXM, lowest to median of 20 offers","0.69–1.90",1.90,14],
 ["a100","0.40–0.80",0.80,"A100 SXM4 80GB, lowest to median of live offers","0.13–0.55",0.55,32],
 ["l40s","0.43–0.64",0.64,"L40S, lowest to median · RTX PRO 6000 Server $1.27–1.33","0.37–0.53",0.53,11]].forEach(function(r){
  put("od",r[0],"vst",P(r[1],r[2],r[3]+" · host-set, dot at the median","S18"));
  put("sp",r[0],"vst",P(r[4],r[5],"lowest to median minimum bid across "+r[6]+" interruptible offers","S18"));
  put("co",r[0],"vst",Q("quote","reserved 1, 3, or 6 months, up to 50% off · contact sales","S18"));
});

/* ---------- Ornn Compute Price Index: what on-demand renters actually paid ---------- */
put("od","b200","orn",P("8.48",8.48,"OCPI-B200, settled 17 Oct 2026","S19"));
put("od","h200","orn",P("6.39",6.39,"OCPI-H200, settled 17 Oct 2026","S19"));
put("od","h100","orn",P("2.78",2.78,"OCPI-H100 (H100 SXM), settled 17 Oct 2026","S19"));
put("od","a100","orn",P("0.97",0.97,"OCPI-A100 (A100 SXM4), settled 17 Oct 2026","S19"));

var DOS={
 aws:{strip:["hyperscaler","public and enterprise channels","fabric: EFA / SRD"],buy:"Public on-demand and Capacity Blocks sit alongside Savings Plans and privately negotiated enterprise pricing. GPU availability, minimum size, payment timing, and delivery commitment differ by mechanism.",ask:"For this configuration and term, what capacity is contractually committed, what is only quota, and what measured collective performance is available at our job size?"},
 azr:{strip:["hyperscaler","enterprise allocation","InfiniBand on selected SKUs"],buy:"Public on-demand, spot, reservations, and enterprise capacity commitments are sold through different commercial paths. Confirm whether the quoted product includes allocation, a named region, and a specific fabric-enabled SKU.",ask:"Which region, VM shape, fabric, start date, and delivery remedy are attached to this quote—not just the account quota?"},
 gcp:{strip:["hyperscaler","quota and reservation managed","GPU and TPU options"],buy:"On-demand, spot, committed-use discounts, reservations, and Dynamic Workload Scheduler address different combinations of price and availability. GPU and TPU proposals require separate workload validation.",ask:"Quote the viable GPU and TPU configurations side by side, including reservation mechanics, measured workload results, and migration work."},
 oci:{strip:["hyperscaler","bare metal and VM","fabric: RoCEv2"],buy:"Public list pricing and Universal Credits can be paired with privately negotiated capacity reservations. Confirm the exact cluster shape, delivery schedule, network, and egress treatment.",ask:"How is the proposed capacity isolated, what completion and performance commitments apply, and which charges sit outside the normalized GPU-hour?"},
 crw:{strip:["neocloud","committed-capacity emphasis","InfiniBand by cluster"],buy:"Public on-demand configurations coexist with longer reserved and dedicated-capacity agreements. Commercial terms can include minimum spend, prepayment, delivery tranches, and provider-managed cluster operations.",ask:"Name the site, cluster configuration, delivery tranches, acceptance test, support model, and remedies behind the proposed committed capacity."},
 neb:{strip:["neocloud","self-serve and enterprise","fabric varies by offer"],buy:"A public rate card supports initial benchmarking; larger deployments move to reserved enterprise terms. Verify region, host and accelerator form factor, storage, fabric, support, and availability.",ask:"What is energized and orderable today at the quoted rate, and what requires a future site or delivery milestone?"},
 lmb:{strip:["neocloud","self-serve to private cloud","InfiniBand by cluster"],buy:"Self-serve instances, short-duration clusters, and negotiated private-cloud capacity have different minimums and operational commitments. Do not carry a self-serve price into a cluster comparison without matching the configuration.",ask:"Which tier supplies the quoted capacity, what is its minimum duration, and what network, storage, replacement, and support commitments are included?"},
 cru:{strip:["neocloud and datacenter developer","public and enterprise channels","fabric varies by site"],buy:"Public instance pricing covers a subset of products; larger or newer deployments are sales-led and may be tied to a named site or buildout. Separate operating capacity from planned capacity.",ask:"Which site and power source serve this quote, what is live today, and which delivery and acceptance milestones are contractual?"},
 vrd:{strip:["self-serve on-demand and spot","published term discounts","InfiniBand on instant clusters"],buy:"Verda, formerly DataCrunch, publishes per-GPU prices for single instances, spot, and self-serve multi-node clusters, including GB300, with fixed discounts for terms from one month to two years. Larger or custom clusters are quoted.",ask:"Is the GB300 capacity a full 72-GPU NVLink domain or part of a shared rack, where is it located, and what does the commitment discount require up front?"},
 fld:{strip:["builder and operator","bespoke contracts","no public catalog"],buy:"Fluidstack no longer publishes a GPU catalog or price list; its site describes building and operating large clusters under long-term contracts. Treat any offer as a custom build in which the facility, delivery schedule, and operator matter as much as the rate.",ask:"Which facility, operator, and delivery schedule sit behind the offer, and what acceptance tests, replacement terms, and delay remedies apply?"},
 nsc:{strip:["enterprise wholesale","sales-gated","site-specific design"],buy:"Capacity is negotiated as enterprise blocks rather than public self-serve instances. Pricing should be evaluated together with the named site, energy and data-residency attributes, delivery schedule, and financing conditions.",ask:"Where does this capacity sit, when is it energized, and what priority, acceptance, substitution, and delay remedies are written into the agreement?"},
 sfc:{strip:["cluster market","market-priced blocks","resale of unused time"],buy:"Buyers order H100 and H200 blocks by size and duration on SF Compute's market and can resell reserved time they do not use. Prices are shown only after sign-in, so this board carries no public price for it.",ask:"For this block, who operates the hardware, which node class and fabric apply, and what happens if capacity is interrupted or fails acceptance?"},
 vst:{strip:["peer-to-peer marketplace","host-set pricing","fabric not guaranteed"],buy:"Hosts set prices for interruptible and on-demand machines. Treat each listing as a distinct host and reliability profile rather than uniform institutional capacity.",ask:"Can the search be restricted to verified datacenter hosts with uptime history, consistent networking, replacement terms, and the compliance controls this workload requires?"},
 orn:{strip:["price index","paid on-demand rentals","settles daily"],buy:"Ornn sells no compute. Its index is the volume-weighted average of on-demand rental prices actually paid across contributing providers, settled daily for the H100, H200, B200, and A100. Reserved and long-term contracts are excluded, and Ornn discloses that its affiliates trade physical compute.",ask:"How does your quote compare with the latest settled index for this GPU, and will you price a term contract against it?"}
};
var PROVREF={
 aws:[["pricing","https://aws.amazon.com/ec2/pricing/"],["investor relations","https://ir.aboutamazon.com/"]],
 azr:[["pricing","https://azure.microsoft.com/en-us/pricing/"],["Microsoft investor relations","https://www.microsoft.com/en-us/Investor"]],
 gcp:[["pricing","https://cloud.google.com/pricing"],["Alphabet investor relations","https://abc.xyz/investor/"]],
 oci:[["price list","https://www.oracle.com/cloud/price-list/"],["Oracle investor relations","https://investor.oracle.com/"]],
 crw:[["pricing","https://www.coreweave.com/pricing"],["investor relations","https://investors.coreweave.com/"]],
 neb:[["pricing","https://nebius.com/prices"],["investor relations","https://nebius.com/investor-hub"]],
 lmb:[["pricing","https://lambda.ai/pricing"],["company updates","https://lambda.ai/blog"]],
 cru:[["pricing","https://crusoe.ai/cloud/pricing"],["company updates","https://www.crusoe.ai/resources/newsroom"]],
 vrd:[["pricing","https://verda.com/pricing"]],
 fld:[["company site","https://www.fluidstack.io/"]],
 nsc:[["company site","https://www.nscale.com/"],["Microsoft contract","https://www.nscale.com/press-releases/nscale-microsoft-2025"]],
 sfc:[["instance types","https://docs.sfcompute.com/current/instance-types"]],
 vst:[["live prices","https://vast.ai/pricing"]],
 orn:[["index","https://data.ornn.com/"],["methodology","https://data.ornn.com/methodology"]]
};
window.PriceData={verified:"2026-10-18",SOURCES:SOURCES,PROV:PROV,SKUS:SKUS,DOS:DOS,CH:CH,M:M,PROVREF:PROVREF};
})();
