/* The archived July 2026 GPU price snapshot, verified 22 July 2026. Moved unchanged from the
   original price atlas page; historical observations, not current offers. Each priced cell keeps
   its display value (v), numeric midpoint (n), note (t), and source id (src).
   cell states: p = priced, q = sold but price gated, n = not offered. */
(function () {
// sources: one entry per distinct source; url omitted = method entry (no citable page — by design)
var SOURCES=[
 {id:"S1",label:"AWS EC2 Capacity Blocks pricing",url:"https://aws.amazon.com/ec2/capacityblocks/pricing/",note:"Jul 2026"},
 {id:"S2",label:"AWS EC2 on-demand pricing",url:"https://aws.amazon.com/ec2/pricing/on-demand/",note:"Jul 2026"},
 {id:"S3",label:"Microsoft Azure Linux VM pricing",url:"https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/",note:"NC/ND series · May 2026 prices"},
 {id:"S4",label:"Google Cloud accelerator pricing",url:"https://cloud.google.com/products/compute/pricing",note:"accelerator-optimized · 2026"},
 {id:"S5",label:"Oracle Cloud price list",url:"https://www.oracle.com/cloud/price-list/",note:"BM.GPU shapes · 2026"},
 {id:"S6",label:"CoreWeave pricing",url:"https://www.coreweave.com/pricing",note:"per-instance card · 2026"},
 {id:"S7",label:"Nebius rate card",url:"https://nebius.com/prices",note:"Jun 2026"},
 {id:"S8",label:"Lambda pricing",url:"https://lambda.ai/pricing",note:"Jul 2026"},
 {id:"S9",label:"Crusoe Cloud pricing",url:"https://crusoe.ai/cloud/pricing",note:"2026"},
 {id:"S10",label:"Fluidstack — no public rate card; prices are the aggregator's marketed index rates, cross-checked against deal reporting"},
 {id:"S11",label:"SF Compute market prices",url:"https://sfcompute.com/prices",note:"live cleared prices · Feb–Mar 2026"},
 {id:"S12",label:"Vast.ai marketplace pricing",url:"https://vast.ai/pricing",note:"live · host-set"},
 {id:"deal",label:"deal-reported: compiled from Q1–Q2 2026 earnings calls, filings, and press coverage; triangulated across sources, not from a single citable page"},
 {id:"est",label:"estimate: derived by the desk from nearby public prices; method over link by design"}
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
 {id:"fld",ab:"FLD",name:"Fluidstack",band:"Neoclouds",g:"neo",arch:"aggregator-utility"},
 {id:"nsc",ab:"NSC",name:"Nscale",band:"Neoclouds",g:"neo",arch:"sovereign wholesale"},
 {id:"sfc",ab:"SFC",name:"SF Compute",band:"Marketplaces",g:"mkt",arch:"cluster spot market"},
 {id:"vst",ab:"VST",name:"Vast.ai",band:"Marketplaces",g:"mkt",arch:"p2p marketplace"}
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
// cell: v=display, n=numeric midpoint, s: p=priced q=gated n=not offered, t=tooltip
function P(v,n,t,src){return{v:v,n:n,s:"p",t:t,src:src}}
function Q(v,t,src){return{v:v||"quote",s:"q",t:t,src:src}}
var N={s:"n"};
var D={
 gb300:{aws:Q("quote","P6e-GB300 UltraServers GA Dec 2025 · price not public · list absent","deal"),azr:Q("quote","ND GB300 v7 · first 4,608-GPU cluster Oct 2025 · negotiated","deal"),gcp:Q("quote","A4X Max · committed deals dominate","deal"),oci:Q("quote","GB300 in deployment · queued allocation","deal"),crw:Q("quote","first GB300 NVL72 deploy Jul 2025 · contract-only","deal"),neb:Q("quote","GB300 Exemplar Cloud for training · by contact","S7"),lmb:Q("quote","single-tenant GB300 NVL72 clusters incl. hydrogen-powered ECL site · negotiated","deal"),cru:N,fld:Q("pre-alloc","frontier custom builds 100% pre-allocated to anchor (Anthropic)","deal"),nsc:Q("quote","building GB300/Rubin for Microsoft and OpenAI · wholesale","deal"),sfc:N,vst:N},
 gb200:{aws:P("10.58",10.58,"Capacity Block per-GPU · Dallas Local Zone only · AWS list · Jul 26","S1"),azr:Q("quote","ND GB200 v6 · oft-cited figure implies low-teens $/GPU-hr · low confidence","est"),gcp:Q("quote","A4X · allocation-request via sales/DWS"),oci:Q("quote","GB200 NVL72 racks · quote-only at cluster scale"),crw:Q("quote","sold as 2-superchip instances · GPU pricing reserved for inference-platform customers","S6"),neb:Q("quote","GB200 NVL72 by contact · Nebius card · Jun 26","S7"),lmb:Q("quote","frontier tier negotiated","deal"),cru:Q("quote","sales-gated, limited availability"),fld:Q("quote","bespoke clusters via partner DCs"),nsc:Q("quote","wholesale only"),sfc:N,vst:N},
 b300:{aws:P("11.70",11.70,"Capacity Block per-GPU · AWS list · Jul 26 · reprice due this month","S1"),azr:N,gcp:N,oci:N,crw:Q("quote","contract-model"),neb:Q("on card","added to Nebius price list Jun 2026 · value not verified here","S7"),lmb:Q("quote","clusters"),cru:N,fld:N,nsc:Q("quote","wholesale"),sfc:Q("roadmap","listed on SFC roadmap for market trading · Q2 26"),vst:N},
 b200:{aws:P("10.30",10.30,"Capacity Block per-GPU $10.30 · on-demand p6-b200 ~$14.24 · AWS list/mkt · Jul 26","S1"),azr:N,gcp:Q("quote","A4 · committed via sales/DWS"),oci:Q("quote","B200.8 quote-only at cluster scale"),crw:P("~6.50",6.50,"contract-model access · estimate from dossier · 26","est"),neb:P("3.95–7.15",5.55,"committed $3.95 / on-demand $7.15 · Nebius rate card · Jun 26","S7"),lmb:P("6.69",6.69,"on-demand list · firmed from ~$5 as Blackwell demand rose · Jul 26","S8"),cru:Q("quote","sales-gated"),fld:Q("quote","aggregated availability varies"),nsc:Q("quote","wholesale"),sfc:N,vst:Q("rare","scarce on p2p supply · host-set","S12")},
 h200:{aws:P("4.98–6.22",5.60,"Capacity Blocks p5e/p5en range · AWS list · Jul 26 (+15% reprice this year)","S1"),azr:Q("quote","ND H200 v5 previewed late 2025 · negotiated","deal"),gcp:Q("quote","A3 Ultra (3.2 Tb/s RDMA) · quota/DWS"),oci:P("10.00",10.00,"bare-metal list, same card as H100.8 · negotiated deals far below · OCI list · 26","S5"),crw:P("6.31",6.31,"on-demand list · committed 15–60% below · CW card · 26","S6"),neb:P("2.45–4.50",3.48,"committed $2.45 / on-demand $4.50 · Nebius rate card · Jun 26","S7"),lmb:Q("quote","H200 in clusters only"),cru:P("4.29",4.29,"on-demand list, per-minute billing · Crusoe · 26","S9"),fld:P("~2.30",2.30,"aggregator index on-demand · marketed, cross-checked · 26","S10"),nsc:Q("quote","wholesale"),sfc:Q("roadmap","H200 blocks on SFC roadmap"),vst:Q("rare","thin p2p supply")},
 h100:{aws:P("3.93–6.88",4.50,"Capacity Block $3.93–4.33 · on-demand ~$6.88 post mid-2025 cuts · list/mkt · Jul 26","S1"),azr:P("6.98–12.29",9.60,"NC H100 NVL $6.98 · ND96isr $12.29 (the training SKU) · list/mkt · May 26","S3"),gcp:P("~11.06",11.06,"a3-highgpu on-demand us-central1 · spot escape hatch $2.25 · list · 26","S4"),oci:P("10.00",10.00,"bare-metal list · negotiated superclusters $2.50–4.50 (deal-reported) · 26","S5"),crw:P("6.16",6.16,"on-demand list · committed 15–60% below (~$2.5–5.2) · CW card · 26","S6"),neb:P("2.15–3.85",3.00,"committed $2.15 / on-demand $3.85 · undercuts CW list ~40%, hyperscalers 60–80% · Jun 26","S7"),lmb:P("2.49–3.44",2.99,"on-demand by config · 1-Click Clusters $3.99 (IB fabric premium) · list · 26","S8"),cru:P("3.90",3.90,"on-demand list · reserved est. high-$2s for 1yr+ · Crusoe · 26","S9"),fld:P("~2.10",2.10,"aggregator index on-demand · one of the market's true price floors · 26","S10"),nsc:P("low-$2s",2.25,"multi-year negotiated enterprise · deal-reported · no self-serve · 26","deal"),sfc:P("1.49–1.68",1.58,"cleared market average Feb–Mar 26 · zone dispersion $1.75–5.00 · SFC","S11"),vst:P("1.38–1.87",1.65,"interruptible $1.38–1.65 · on-demand tier ~$1.87 · host-set · early 26","S12")},
 a100:{aws:P("1.48",1.48,"Capacity Block per-GPU · AWS list · Jul 26","S1"),azr:P("~3.40",3.40,"ND A100 v4 on-demand · estimate from list derivations · 26","est"),gcp:P("3.28",3.28,"a2-highgpu per-GPU on-demand · tracker print · Mar 26","est"),oci:P("~4.00",4.00,"BM.GPU A100 80G bare metal list · moderate confidence · 26","S5"),crw:P("~2.21",2.21,"legacy fleet monetized down-market · historical card · 25","est"),neb:N,lmb:P("1.99–2.79",2.39,"on-demand list · 26","S8"),cru:Q("quote","offered; price via sales"),fld:Q("quote","legacy aggregated fleets · varies"),nsc:N,sfc:N,vst:P("0.6–1.0",0.80,"host-set p2p range · est · 26","est")},
 l40s:{aws:P("~1.86",1.86,"G6e (L40S) 1-GPU on-demand · list · 26","S2"),azr:N,gcp:P("0.71",0.71,"G2 (L4 — nearest class) on-demand · list · 26","S4"),oci:P("~3.74",3.74,"BM L40S.4 list · moderate confidence · 26","S5"),crw:Q("quote","down-market inventory varies"),neb:P("0.74–1.80",1.10,"L40S from $0.74 · RTX PRO 6000 $0.95/$1.80 · Nebius card · Jun 26","S7"),lmb:N,cru:Q("quote","offered via sales"),fld:P("~1.00",1.00,"aggregated L40S · est · 26","est"),nsc:N,sfc:N,vst:P("~0.67",0.67,"host-set p2p · est · 26","est")}
};
var DOS={
 aws:{strip:["hyperscaler","public and enterprise channels","fabric: EFA / SRD"],buy:"Public on-demand and Capacity Blocks sit alongside Savings Plans and privately negotiated enterprise pricing. GPU availability, minimum size, payment timing, and delivery commitment differ by mechanism.",ask:"For this configuration and term, what capacity is contractually committed, what is only quota, and what measured collective performance is available at our job size?"},
 azr:{strip:["hyperscaler","enterprise allocation","InfiniBand on selected SKUs"],buy:"Public on-demand, spot, reservations, and enterprise capacity commitments are sold through different commercial paths. Confirm whether the quoted product includes allocation, a named region, and a specific fabric-enabled SKU.",ask:"Which region, VM shape, fabric, start date, and delivery remedy are attached to this quote—not just the account quota?"},
 gcp:{strip:["hyperscaler","quota and reservation managed","GPU and TPU options"],buy:"On-demand, spot, committed-use discounts, reservations, and Dynamic Workload Scheduler address different combinations of price and availability. GPU and TPU proposals require separate workload validation.",ask:"Quote the viable GPU and TPU configurations side by side, including reservation mechanics, measured workload results, and migration work."},
 oci:{strip:["hyperscaler","bare metal and VM","fabric: RoCEv2"],buy:"Public list pricing and Universal Credits can be paired with privately negotiated capacity reservations. Confirm the exact cluster shape, delivery schedule, network, and egress treatment.",ask:"How is the proposed capacity isolated, what completion and performance commitments apply, and which charges sit outside the normalized GPU-hour?"},
 crw:{strip:["neocloud","committed-capacity emphasis","InfiniBand by cluster"],buy:"Public on-demand configurations coexist with longer reserved and dedicated-capacity agreements. Commercial terms can include minimum spend, prepayment, delivery tranches, and provider-managed cluster operations.",ask:"Name the site, cluster configuration, delivery tranches, acceptance test, support model, and remedies behind the proposed committed capacity."},
 neb:{strip:["neocloud","self-serve and enterprise","fabric varies by offer"],buy:"A public rate card supports initial benchmarking; larger deployments move to reserved enterprise terms. Verify region, host and accelerator form factor, storage, fabric, support, and availability.",ask:"What is energized and orderable today at the quoted rate, and what requires a future site or delivery milestone?"},
 lmb:{strip:["neocloud","self-serve to private cloud","InfiniBand by cluster"],buy:"Self-serve instances, short-duration clusters, and negotiated private-cloud capacity have different minimums and operational commitments. Do not carry a self-serve price into a cluster comparison without matching the configuration.",ask:"Which tier supplies the quoted capacity, what is its minimum duration, and what network, storage, replacement, and support commitments are included?"},
 cru:{strip:["neocloud and datacenter developer","public and enterprise channels","fabric varies by site"],buy:"Public instance pricing covers a subset of products; larger or newer deployments are sales-led and may be tied to a named site or buildout. Separate operating capacity from planned capacity.",ask:"Which site and power source serve this quote, what is live today, and which delivery and acceptance milestones are contractual?"},
 fld:{strip:["capacity aggregator and custom build","heterogeneous supply","fabric varies by facility"],buy:"API-accessible capacity and bespoke committed builds are different products. Aggregated supply can vary by operator, facility, topology, and service level.",ask:"Identify the underlying facilities and operators, the allowed configuration variance, the measured network results, and the replacement or refund policy."},
 nsc:{strip:["enterprise wholesale","sales-gated","site-specific design"],buy:"Capacity is negotiated as enterprise blocks rather than public self-serve instances. Pricing should be evaluated together with the named site, energy and data-residency attributes, delivery schedule, and financing conditions.",ask:"Where does this capacity sit, when is it energized, and what priority, acceptance, substitution, and delay remedies are written into the agreement?"},
 sfc:{strip:["cluster spot market","market-cleared blocks","fabric depends on node class"],buy:"Buyers choose a posted block by zone, size, and duration. The clearing price is observable, but the underlying operator, host class, fabric, interruption terms, and refund mechanics still require diligence.",ask:"For this block, who operates the hardware, which node class and fabric apply, and what happens if capacity is interrupted or fails acceptance?"},
 vst:{strip:["peer-to-peer marketplace","host-set pricing","fabric not guaranteed"],buy:"Hosts set prices for interruptible and on-demand machines. Treat each listing as a distinct host and reliability profile rather than uniform institutional capacity.",ask:"Can the search be restricted to verified datacenter hosts with uptime history, consistent networking, replacement terms, and the compliance controls this workload requires?"}
};
var CH=[{id:"od",l:"Pay as you go"},{id:"sp",l:"Can be interrupted"},{id:"co",l:"Commit ahead"}];
var M={od:{},sp:{},co:{}};
(function(){
 function put(ch,sku,prov,cell){ M[ch][sku]=M[ch][sku]||{}; M[ch][sku][prov]=cell; }
 var q=Q, p=P;
 // --- H100 ---
 put("od","h100","aws",p("6.88",6.88,"on-demand normalized, post mid-2025 cuts · mkt · 26","S2"));
 put("co","h100","aws",p("3.93–4.33",4.13,"Capacity Blocks (upfront, short-term) · Savings Plans 30–60% off 1–3yr · list · Jul 26","S1"));
 put("sp","h100","aws",q("thin","spot exists nominally 60–90% off; GPU pools shallow — not a real supply layer"));
 put("od","h100","azr",p("6.98–12.29",9.60,"NC H100 NVL $6.98 · ND96isr $12.29 · list/mkt · May 26","S3"));
 put("co","h100","azr",p("~8.0",8.0,"1yr reservation ~-35% off ND · derived est · 26","est"));
 put("sp","h100","azr",p("2.2–3.7",2.95,"70–82% off with 30-second eviction · est · 26","est"));
 put("od","h100","gcp",p("~11.06",11.06,"a3-highgpu us-central1 · list · 26","S4"));
 put("co","h100","gcp",p("5.0–7.0",6.0,"CUD 37–55% off · derived est · 26","est"));
 put("sp","h100","gcp",p("2.25",2.25,"preemptible A3 · list · 26","S4"));
 put("od","h100","oci",p("10.00",10.00,"bare-metal list · OCI · 26","S5"));
 put("co","h100","oci",p("2.50–4.50",3.50,"negotiated superclusters, deal-reported · mod confidence · H1 26","deal"));
 put("sp","h100","oci",{s:"n"});
 put("od","h100","crw",p("6.16",6.16,"published list (unusual for its class) · 26","S6"));
 put("co","h100","crw",p("2.5–5.2",3.85,"15–60% below list for committed / 6mo+ terms · derived · 26","est"));
 put("sp","h100","crw",q("new","Spot + Flex Reservations launched Q1 26 · pricing not public","deal"));
 put("od","h100","neb",p("3.85",3.85,"Nebius rate card · Jun 26","S7"));
 put("co","h100","neb",p("2.15",2.15,"committed on card · undercuts CW list ~40%, hyperscalers 60–80% · Jun 26","S7"));
 put("sp","h100","neb",q("avail","preemptible pricing available · number not published"));
 put("od","h100","lmb",p("2.49–3.44",2.99,"by config · 1CC clusters $3.99 (IB premium) · list · 26","S8"));
 put("co","h100","lmb",q("quote","Private Cloud 1–3yr negotiated","deal"));
 put("sp","h100","lmb",{s:"n"});
 put("od","h100","cru",p("3.90",3.90,"list, per-minute billing · 26","S9"));
 put("co","h100","cru",p("high-$2s",2.85,"reserved 1yr+ · dossier estimate, low-mod confidence","est"));
 put("sp","h100","cru",q("avail","spot tier exists · price via console/sales"));
 put("od","h100","fld",p("~2.10",2.10,"aggregator index · marketed, cross-checked · 26","S10"));
 put("co","h100","fld",q("quote","enterprise bespoke take-or-pay"));
 put("sp","h100","fld",p("0.6–1.5",1.05,"70–90% off list for fault-tolerant work · marketed · 26","S10"));
 put("od","h100","nsc",{s:"n"});
 put("co","h100","nsc",p("low-$2s",2.25,"multi-year enterprise, deal-reported · 26","deal"));
 put("sp","h100","nsc",{s:"n"});
 put("od","h100","sfc",{s:"n"});
 put("co","h100","sfc",q("forward","forward blocks trade at market · SFC","S11"));
 put("sp","h100","sfc",p("1.49–1.68",1.58,"cleared market avg Feb–Mar 26 · zones $1.75–5.00","S11"));
 put("od","h100","vst",p("~1.87",1.87,"on-demand tier, host-set · 26","S12"));
 put("co","h100","vst",{s:"n"});
 put("sp","h100","vst",p("1.38–1.65",1.50,"interruptible, host-set · early 26","S12"));
 // --- H200 ---
 put("od","h200","aws",q("quote","p5e/p5en on-demand exists; CB is the practical channel"));
 put("co","h200","aws",p("4.98–6.22",5.60,"Capacity Blocks · +15% reprice this year · list · Jul 26","S1"));
 put("sp","h200","aws",q("thin","shallow pools"));
 put("od","h200","azr",q("quote","ND H200 v5 · negotiated","deal")); put("co","h200","azr",q("quote","EA/MACC reservation")); put("sp","h200","azr",{s:"n"});
 put("od","h200","gcp",q("quote","A3 Ultra · quota/DWS")); put("co","h200","gcp",q("quote","CUD via sales")); put("sp","h200","gcp",q("avail","DWS flex-start between spot and OD"));
 put("od","h200","oci",p("10.00",10.00,"same list card as H100.8 · 26","S5")); put("co","h200","oci",q("quote","negotiated well below list","deal")); put("sp","h200","oci",{s:"n"});
 put("od","h200","crw",p("6.31",6.31,"list · 26","S6")); put("co","h200","crw",p("2.5–5.4",3.95,"15–60% below · derived · 26","est")); put("sp","h200","crw",q("new","Flex/Spot Q1 26","deal"));
 put("od","h200","neb",p("4.50",4.50,"rate card · Jun 26","S7")); put("co","h200","neb",p("2.45",2.45,"committed on card · Jun 26","S7")); put("sp","h200","neb",q("avail","preemptible available"));
 put("od","h200","lmb",q("quote","clusters only")); put("co","h200","lmb",q("quote","negotiated","deal")); put("sp","h200","lmb",{s:"n"});
 put("od","h200","cru",p("4.29",4.29,"list · 26","S9")); put("co","h200","cru",q("quote","reserved negotiated","deal")); put("sp","h200","cru",q("avail","spot tier"));
 put("od","h200","fld",p("~2.30",2.30,"aggregator index · 26","S10")); put("co","h200","fld",q("quote","bespoke")); put("sp","h200","fld",p("~0.7–1.6",1.15,"70–90% off · marketed","S10"));
 put("od","h200","nsc",{s:"n"}); put("co","h200","nsc",q("quote","wholesale")); put("sp","h200","nsc",{s:"n"});
 put("od","h200","sfc",{s:"n"}); put("co","h200","sfc",q("roadmap","H200 blocks on roadmap")); put("sp","h200","sfc",q("roadmap","roadmap"));
 put("od","h200","vst",q("rare","thin p2p supply")); put("co","h200","vst",{s:"n"}); put("sp","h200","vst",q("rare","thin"));
 // --- B200 ---
 put("od","b200","aws",p("~14.24",14.24,"p6-b200 on-demand list · mkt · May 26","S2"));
 put("co","b200","aws",p("10.30",10.30,"Capacity Block · list · Jul 26","S1"));
 put("sp","b200","aws",{s:"n"});
 put("od","b200","azr",{s:"n"}); put("co","b200","azr",{s:"n"}); put("sp","b200","azr",{s:"n"});
 put("od","b200","gcp",q("quote","A4 · sales/DWS")); put("co","b200","gcp",q("quote","committed dominates","deal")); put("sp","b200","gcp",q("avail","DWS"));
 put("od","b200","oci",q("quote","B200.8 quote-only")); put("co","b200","oci",q("quote","queued allocation")); put("sp","b200","oci",{s:"n"});
 put("od","b200","crw",q("quote","contract-model")); put("co","b200","crw",p("~6.50",6.50,"contract access · dossier est · 26","est")); put("sp","b200","crw",q("new","Flex/Spot Q1 26","deal"));
 put("od","b200","neb",p("7.15",7.15,"rate card · Jun 26","S7")); put("co","b200","neb",p("3.95",3.95,"committed on card · Jun 26","S7")); put("sp","b200","neb",q("avail","preemptible"));
 put("od","b200","lmb",p("6.69",6.69,"list, firmed from ~$5 as Blackwell demand rose · Jul 26","S8")); put("co","b200","lmb",q("quote","1CC/Private Cloud")); put("sp","b200","lmb",{s:"n"});
 put("od","b200","cru",q("quote","sales-gated")); put("co","b200","cru",q("quote","sales-gated")); put("sp","b200","cru",{s:"n"});
 put("od","b200","fld",q("quote","varies by facility")); put("co","b200","fld",q("quote","bespoke")); put("sp","b200","fld",q("rare","limited"));
 put("od","b200","nsc",{s:"n"}); put("co","b200","nsc",q("quote","wholesale")); put("sp","b200","nsc",{s:"n"});
 put("od","b200","sfc",{s:"n"}); put("co","b200","sfc",{s:"n"}); put("sp","b200","sfc",{s:"n"});
 put("od","b200","vst",q("rare","scarce p2p")); put("co","b200","vst",{s:"n"}); put("sp","b200","vst",q("rare","scarce"));
 // --- B300 ---
 put("od","b300","aws",q("quote","p6-b300 on-demand ~$14+ · CB is the channel","S2"));
 put("co","b300","aws",p("11.70",11.70,"Capacity Block · list · Jul 26 · reprice due this month","S1"));
 put("sp","b300","aws",{s:"n"});
 ["azr","gcp","oci","cru","vst"].forEach(function(x){put("od","b300",x,{s:"n"});put("co","b300",x,{s:"n"});put("sp","b300",x,{s:"n"});});
 put("od","b300","crw",q("quote","contract")); put("co","b300","crw",q("quote","contract")); put("sp","b300","crw",{s:"n"});
 put("od","b300","neb",q("on card","added to price list Jun 26 · value not verified here","S7")); put("co","b300","neb",q("on card","Jun 26 card","S7")); put("sp","b300","neb",{s:"n"});
 put("od","b300","lmb",q("quote","clusters")); put("co","b300","lmb",q("quote","negotiated","deal")); put("sp","b300","lmb",{s:"n"});
 put("od","b300","fld",{s:"n"}); put("co","b300","fld",q("quote","bespoke")); put("sp","b300","fld",{s:"n"});
 put("od","b300","nsc",{s:"n"}); put("co","b300","nsc",q("quote","wholesale")); put("sp","b300","nsc",{s:"n"});
 put("od","b300","sfc",{s:"n"}); put("co","b300","sfc",q("roadmap","B300 on SFC roadmap Q2 26")); put("sp","b300","sfc",q("roadmap","roadmap"));
 // --- GB200 / GB300 (rack rows: nearly all gated) ---
 SKUS.filter(function(s){return s.id==="gb200"||s.id==="gb300"}).forEach(function(s){
   PROV.forEach(function(pr){
     var base=D[s.id][pr.id]||{s:"n"};
     put("od",s.id,pr.id, base.s==="p"&&s.id==="gb200"&&pr.id==="aws"?q("quote","OD via sales; CB is the channel"):base);
     put("co",s.id,pr.id, base);
     put("sp",s.id,pr.id, base.s==="n"?{s:"n"}:q("—","no spot tier for rack-scale frontier"));
   });
 });
 // GB200 AWS committed = the CB print
 put("co","gb200","aws",p("10.58",10.58,"Capacity Block per-GPU · Dallas LZ only · list · Jul 26","S1"));
 // --- A100, L40S: use D table for OD; committed/spot mostly derived or gated ---
 ["a100","l40s"].forEach(function(sk){
   PROV.forEach(function(pr){
     var base=D[sk][pr.id]||{s:"n"};
     put("od",sk,pr.id,base);
     put("co",sk,pr.id, base.s==="p"?q("quote","commitment discounts apply; negotiated","deal"):(base.s==="q"?base:{s:"n"}));
     put("sp",sk,pr.id, {s:"n"});
   });
 });
 // A100 spot exceptions
 put("sp","a100","gcp",p("~1.15",1.15,"preemptible a2 · est · 26","est"));
 put("sp","a100","vst",p("0.4–0.8",0.60,"interruptible host-set · est","est"));
 put("sp","a100","fld",p("~0.5–0.9",0.70,"aggregated spot · est","est"));
 put("sp","l40s","vst",p("~0.45",0.45,"interruptible host-set · est","est"));
})();
var PROVREF={
 aws:[["pricing","https://aws.amazon.com/ec2/pricing/"],["investor relations","https://ir.aboutamazon.com/"]],
 azr:[["pricing","https://azure.microsoft.com/en-us/pricing/"],["Microsoft investor relations","https://www.microsoft.com/en-us/Investor"]],
 gcp:[["pricing","https://cloud.google.com/pricing"],["Alphabet investor relations","https://abc.xyz/investor/"]],
 oci:[["price list","https://www.oracle.com/cloud/price-list/"],["Oracle investor relations","https://investor.oracle.com/"]],
 crw:[["pricing","https://www.coreweave.com/pricing"],["investor relations","https://investors.coreweave.com/"]],
 neb:[["pricing","https://nebius.com/prices"],["investor relations","https://nebius.com/investor-hub"]],
 lmb:[["pricing","https://lambda.ai/pricing"],["company updates","https://lambda.ai/blog"]],
 cru:[["pricing","https://crusoe.ai/cloud/pricing"],["company updates","https://www.crusoe.ai/resources/newsroom"]],
 fld:[["company materials","https://www.fluidstack.io/"]],nsc:[["company materials","https://www.nscale.com/"]],
 sfc:[["market prices","https://sfcompute.com/prices"]],vst:[["market prices","https://vast.ai/pricing"]]
};
window.PriceData={verified:"2026-07-22",SOURCES:SOURCES,PROV:PROV,SKUS:SKUS,D:D,DOS:DOS,CH:CH,M:M,PROVREF:PROVREF};
})();
