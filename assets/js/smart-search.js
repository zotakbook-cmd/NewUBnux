/* UBnux Smart Search v5.0.1 - static index, resilient errors, pagination */
(function(window,document){
"use strict";
var C=window.UBNUX_CONFIG||{};
var st={active:false,q:"",matches:[],page:1,pageSize:Number(C.BUSINESS_PAGE_SIZE||18)};
function clean(v){return String(v==null?"":v).trim().toLowerCase();}
function slug(v){return clean(v).replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
function hay(b){return [b.name,b.slug,b.state,b.district,b.category,b.categoryId,b.short,b.area].map(clean).join(" ");}
function score(b,q){var h=hay(b),s=0;if(clean(b.name)===q)s+=100;if(clean(b.name).indexOf(q)>=0)s+=50;if(clean(b.category)===q)s+=40;if(clean(b.district)===q)s+=35;if(clean(b.state)===q)s+=30;if(h.indexOf(q)>=0)s+=10;if(b.featured)s+=3;if(b.verified)s+=2;return s;}
function getIndex(){return window.UBnuxStaticCache.getJSON(C.BUSINESS_INDEX_JSON_URL||"/assets/data/business-index.json").then(function(x){return Array.isArray(x)?x:(x.businesses||x.data||[]);});}
function render(){
 var to=Math.min(st.matches.length,st.page*st.pageSize);
 window.UBnuxBusinesses.render(st.matches.slice(0,to),st.matches.length);
 var title=document.getElementById("businessSectionTitle");if(title)title.textContent=st.q?'Search results for "'+st.q+'"':"Local businesses";
}
function search(q,opts){
 opts=opts||{};q=String(q||"").trim();if(!q)return Promise.resolve([]);
 st.active=true;st.q=q;st.page=1;
 return getIndex().then(function(index){
  var n=clean(q);st.matches=index.map(function(b){return{b:b,s:score(b,n)};}).filter(function(x){return x.s>0;}).sort(function(a,b){return b.s-a.s||Number(b.b.featured)-Number(a.b.featured)||clean(a.b.name).localeCompare(clean(b.b.name));}).map(function(x){return x.b;});
  render();
  if(!opts.noHistory){var path="/"+slug(q)+"/";try{history.pushState({ubnuxSearch:q},"",path);}catch(e){}}
  return st.matches;
 }).catch(function(e){console.error("UBnux Smart Search failed",e);st.matches=[];window.UBnuxBusinesses.render([],0);var msg=document.getElementById("selectionMessage");if(msg)msg.textContent="Search data could not load. Please retry.";return [];});
}
function init(){
 var form=document.getElementById("ubnuxSmartSearchForm"),input=document.getElementById("ubnuxSmartSearchInput");
 if(form&&input&&!form.dataset.ubnuxSearchBound){form.dataset.ubnuxSearchBound="1";form.addEventListener("submit",function(e){e.preventDefault();search(input.value);});}
 var more=document.getElementById("loadMoreButton");if(more&&!more.dataset.ubnuxMoreBound){more.dataset.ubnuxMoreBound="1";more.addEventListener("click",function(){if((st.page*st.pageSize)<st.matches.length){st.page++;render();}});}
 window.addEventListener("popstate",function(){var p=(location.pathname||"/").split("/").filter(Boolean);if(p.length===1&&p[0])search(decodeURIComponent(p[0].replace(/-/g," ")),{noHistory:true});});
}
window.UBnuxSmartSearch={version:"5.0.1",state:st,search:search,init:init,loadIndex:getIndex};
})(window,document);
