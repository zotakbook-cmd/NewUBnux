/* UBnux Smart Search v5.8.0 - standalone controller */
(function(window,document){"use strict";
var st={active:false,q:"",matches:[]},indexPromise=null;
function txt(v){return String(v==null?"":v).trim();}
function norm(v){return txt(v).toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9\u0900-\u097f]+/g," ").replace(/\s+/g," ").trim();}
function slug(v){return norm(v).replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
function toks(v){return norm(v).split(" ").filter(Boolean);}
function first(o,keys){o=o||{};for(var i=0;i<keys.length;i++){if(o[keys[i]]!=null&&txt(o[keys[i]])!=="")return o[keys[i]];}return "";}
function rows(x){if(Array.isArray(x))return x;if(!x||typeof x!=="object")return [];var ks=["businesses","results","items","data","records","list"];for(var i=0;i<ks.length;i++)if(Array.isArray(x[ks[i]]))return x[ks[i]];return [];}
function unique(a){var seen=Object.create(null),out=[];(a||[]).forEach(function(b,i){if(!b||typeof b!=="object")return;var k=norm(first(b,["BusinessID","businessId","id","SEOPath","seoPath","Slug","slug","BusinessName","name"]))||("_"+i);if(!seen[k]){seen[k]=1;out.push(b);}});return out;}
function getJSON(u){if(window.UBnuxStaticCache&&typeof window.UBnuxStaticCache.getJSON==="function")return window.UBnuxStaticCache.getJSON(u);return fetch(u,{cache:"no-store",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();});}
function loadIndex(){if(!indexPromise)indexPromise=getJSON((window.UBNUX_CONFIG||{}).BUSINESS_INDEX_JSON_URL||"/assets/data/business-index.json").then(function(x){var a=unique(rows(x));if(!a.length)throw Error("business-index.json empty");return a;});return indexPromise;}
function hay(b){var a=[];Object.keys(b||{}).forEach(function(k){var v=b[k];if(v==null)return;if(typeof v==="object"){try{a.push(JSON.stringify(v));}catch(e){}}else a.push(String(v));});return norm(a.join(" "));}
function field(b,keys){return norm(first(b,keys));}
function distance(a,b){a=norm(a);b=norm(b);if(a===b)return 0;if(!a||!b)return 99;var p=[],c=[],i,j;for(j=0;j<=b.length;j++)p[j]=j;for(i=1;i<=a.length;i++){c=[i];for(j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));p=c;}return p[b.length];}
function fuzzyToken(q,w){if(q===w)return 1000;if(q.indexOf(w)>=0||w.indexOf(q)>=0)return 600;var d=distance(q,w),lim=Math.max(1,Math.floor(Math.max(q.length,w.length)*.34));return d<=lim?180:0;}
function entityValue(b,type){if(type==="district")return field(b,["DistrictName","districtName","DistrictSlug","districtSlug","DistrictID","districtId","DistrictCode","districtCode","district"]);if(type==="category")return field(b,["CategoryName","categoryName","CategorySlug","categorySlug","CategoryID","categoryId","CategoryCode","categoryCode","category"]);return field(b,["StateName","stateName","StateSlug","stateSlug","StateCode","stateCode","state"]);}
function bestEntity(list,q,type){var ts=toks(q),best=null,bestScore=0;(list||[]).forEach(function(b){var v=entityValue(b,type);if(!v)return;var s=0,hit=0;ts.forEach(function(t){var z=fuzzyToken(t,v);if(z){hit++;s+=z;}});if(hit===ts.length)s+=300;if(s>bestScore){bestScore=s;best=b;}});return bestScore>=400?best:null;}
function detect(list,q){var district=bestEntity(list,q,"district"),category=bestEntity(list,q,"category"),state=bestEntity(list,q,"state");return {district:district,category:category,state:state};}
function matchesEntity(b,entity,type){if(!entity)return true;var wanted=entityValue(entity,type),v=entityValue(b,type);if(!wanted||!v)return false;return v===wanted||slug(v)===slug(wanted)||v.indexOf(wanted)>=0||wanted.indexOf(v)>=0;}
function score(b,q,intent){var ts=toks(q),h=hay(b),name=field(b,["BusinessName","name","Name","Slug","slug"]),cat=entityValue(b,"category"),dist=entityValue(b,"district"),state=entityValue(b,"state"),s=0,hit=0;
 ts.forEach(function(t){var z=0;if(h.indexOf(t)>=0)z+=30;var d=fuzzyToken(t,name);if(d)z+=d;if(t===cat)z+=550;else if(cat.indexOf(t)>=0)z+=180;if(t===dist)z+=500;else if(dist.indexOf(t)>=0)z+=180;if(t===state)z+=450;else if(state.indexOf(t)>=0)z+=160;if(z){hit++;s+=z;}});
 if(intent.district&&matchesEntity(b,intent.district,"district"))s+=1200;
 if(intent.category&&matchesEntity(b,intent.category,"category"))s+=1100;
 if(intent.state&&matchesEntity(b,intent.state,"state"))s+=1000;
 if(norm(q)&&h.indexOf(norm(q))>=0)s+=900;
 return hit===ts.length?s:(hit?s*.35:0);
}
function pathFor(q,intent,list){
 var ds=intent.district,cs=intent.category,ss=intent.state;
 var state=ss?entityValue(ss,"state"):"";
 if(ds){var row=list.find(function(b){return matchesEntity(b,ds,"district");});if(row)state=state||entityValue(row,"state");}
 var district=ds?entityValue(ds,"district"):"";
 var category=cs?entityValue(cs,"category"):"";
 if(state&&district&&category)return "/in/"+slug(state)+"/"+slug(district)+"/"+slug(category)+"/";
 if(state&&district)return "/in/"+slug(state)+"/"+slug(district)+"/";
 if(state&&category)return "/in/"+slug(state)+"/all/"+slug(category)+"/";
 return "/search/"+slug(q)+"/";
}
function updateSEO(path,q){try{history.replaceState({ubnuxSearch:q},"",path);}catch(e){}var c=document.querySelector('link[rel="canonical"]');if(c)c.href=location.origin+path;document.title="UBnux Search - "+q;var m=document.querySelector('meta[name="description"]');if(m)m.content="Search local businesses for "+q+" on UBnux.";}
function render(out,q){if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.render==="function")window.UBnuxBusinesses.render(out,out.length);var t=document.getElementById("businessSectionTitle");if(t)t.textContent='Search results for "'+q+'"';var m=document.getElementById("selectionMessage");if(m)m.textContent=out.length+" businesses found";}
function loadDistrictChunk(intent,list){
 var d=intent&&intent.district;if(!d)return Promise.resolve([]);
 var wanted=entityValue(d,"district"), idxUrl=(window.UBNUX_CONFIG||{}).DISTRICT_INDEX_JSON_URL||"/assets/data/district-index.json";
 return getJSON(idxUrl).then(function(x){
   var rows0=rows(x);
   var rec=rows0.find(function(r){var v=entityValue(r,"district")||norm(first(r,["DistrictName","districtName","DistrictSlug","districtSlug","DistrictID","districtId","DistrictCode","districtCode","district"]));return v&&(v===wanted||slug(v)===slug(wanted)||norm(v)===norm(wanted));});
   var file=rec&&first(rec,["file","File","dataFile","DataFile","businessFile","BusinessFile","url","URL"]);
   if(!file)return [];
   var base="/assets/data/"; if(/^https?:\/\//i.test(file))return getJSON(file);
   file=String(file).replace(/^\/+/,""); if(file.indexOf("assets/data/")===0)file="/"+file;else file=base+file.replace(/^\.\//,"");
   return getJSON(file).then(rows);
 }).catch(function(){return [];});
}

function run(q,opts){opts=opts||{};q=txt(q).replace(/\s+/g," ");var input=document.getElementById("ubnuxSmartSearchInput");if(input)input.value=q;if(!q){st.active=false;st.q="";st.matches=[];render([],"");return Promise.resolve([]);}st.active=true;st.q=q;
 return loadIndex().then(function(list){var intent=detect(list,q),hasD=!!intent.district,hasC=!!intent.category,hasS=!!intent.state;var pool=list.filter(function(b){return (!hasD||matchesEntity(b,intent.district,"district"))&&(!hasC||matchesEntity(b,intent.category,"category"))&&(!hasS||matchesEntity(b,intent.state,"state"));});
 /* Render the compact index immediately. If the query resolves to a district, upgrade it to the complete district chunk without waiting for the first paint. */
 var initialScored=pool.map(function(b){return {b:b,s:score(b,q,intent)};}).filter(function(x){return x.s>0;});
 initialScored.sort(function(a,b){return b.s-a.s;});
 var initialOut=unique(initialScored.map(function(x){return x.b;}));
 st.matches=initialOut;render(initialOut,q);
 if(!opts.noHistory)updateSEO(pathFor(q,intent,initialOut),q);
 if(hasD){return loadDistrictChunk(intent,list).then(function(full){
   var fullPool=unique(full||[]).filter(function(b){return matchesEntity(b,intent.district,"district")&&(!hasC||matchesEntity(b,intent.category,"category"))&&(!hasS||matchesEntity(b,intent.state,"state"));});
   var fs=fullPool.map(function(b){return {b:b,s:score(b,q,intent)};}).filter(function(x){return x.s>0;});
   fs.sort(function(a,b){return b.s-a.s||field(a.b,["BusinessName","name","Name"]).localeCompare(field(b.b,["BusinessName","name","Name"]));});
   var upgraded=unique(fs.map(function(x){return x.b;}));
   if(upgraded.length){st.matches=upgraded;render(upgraded,q);}
   return st.matches;
 });
 }
 /* For a district/category keyword, keep every exact entity match even when fuzzy score is low. */
 var scored=pool.map(function(b){return {b:b,s:score(b,q,intent)};}).filter(function(x){return x.s>0;});
 if(!scored.length)scored=list.map(function(b){return {b:b,s:score(b,q,intent)};}).filter(function(x){return x.s>0;});
 scored.sort(function(a,b){return b.s-a.s||field(a.b,["BusinessName","name","Name"]).localeCompare(field(b.b,["BusinessName","name","Name"]));});
 var out=unique(scored.map(function(x){return x.b;}));st.matches=out;render(out,q);
 if(!opts.noHistory)updateSEO(pathFor(q,intent,out),q);return out;}).catch(function(e){console.error("UBnux Smart Search failed",e);st.matches=[];render([],q);return [];});}
function bind(){var form=document.getElementById("ubnuxSmartSearchForm"),input=document.getElementById("ubnuxSmartSearchInput");if(form&&!form.dataset.ubnuxBound){form.dataset.ubnuxBound="1";form.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();run(input?input.value:"");return false;},true);}document.querySelectorAll("[data-smart-query]").forEach(function(btn){if(btn.dataset.ubnuxSearchBound)return;btn.dataset.ubnuxSearchBound="1";btn.addEventListener("click",function(e){e.preventDefault();e.stopImmediatePropagation();run(btn.getAttribute("data-smart-query")||btn.textContent||"");return false;},true);});}
function init(){bind();setTimeout(bind,0);setTimeout(bind,250);}
window.UBnuxSmartSearch={version:"5.8.0",init:init,bind:bind,search:run,run:run,loadIndex:loadIndex,state:st};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
