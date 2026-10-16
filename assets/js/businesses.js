/* UBnux Businesses v5.0.1 - contact-free cards + reliable pagination */
(function(window,document){
"use strict";
var st={items:[],allItems:[],total:0,shown:0,hasMore:false};
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function key(b){return String(b.seoPath||b.id||b.slug||"").toLowerCase();}
function pathFor(b){
 if(b.seoPath)return b.seoPath;
 var state=b.stateSlug||b.state||"",district=b.districtSlug||b.district||"",category=b.categorySlug||b.category||"",slug=b.slug||"";
 return state&&district&&category&&slug?"/in/"+[state,district,category,slug].map(function(x){return encodeURIComponent(String(x).toLowerCase());}).join("/")+"/":"";
}
function card(b){
 var a=document.createElement("a");a.className="business-card";var path=pathFor(b);
 if(path)a.href=path;else{a.removeAttribute("href");a.setAttribute("aria-disabled","true");}
 var name=b.name||b.BusinessName||"Business",short=b.short||b.ShortDescription||b.Description||"",verified=(b.verified===true||b.Verified===true);
 a.innerHTML='<div class="business-card-body"><div class="business-card-top"><span class="business-badge">'+(verified?"Verified":"Local")+'</span></div><h3>'+esc(name)+'</h3><p>'+esc(short)+'</p><div class="business-card-meta"><span>★ '+esc(b.rating||b.Rating||"0")+'</span><span>'+esc(b.district||b.DistrictName||"")+'</span><span>'+esc(b.area||b.Area||"")+'</span></div></div>';
 return a;
}
function syncMore(){var more=document.getElementById("loadMoreWrapper"),button=document.getElementById("loadMoreButton");if(more)more.hidden=!st.hasMore;if(button)button.disabled=!st.hasMore;}
function render(list,total){
 var grid=document.getElementById("businessGrid"),empty=document.getElementById("emptyState"),sum=document.getElementById("businessSummary");if(!grid)return;
 st.allItems=Array.isArray(list)?list.slice():[];st.total=Number(total==null?st.allItems.length:total);st.shown=Math.min(st.allItems.length,18);st.items=st.allItems.slice(0,st.shown);st.hasMore=st.shown<st.total;
 grid.innerHTML="";st.items.forEach(function(b){grid.appendChild(card(b));});
 if(empty)empty.classList.toggle("hidden",st.items.length>0);
 if(sum)sum.textContent=st.total+" businesses found";
 syncMore();
}
function appendMore(count){
 var grid=document.getElementById("businessGrid");if(!grid)return;
 var next=Math.min(st.allItems.length,st.shown+(count||18));if(next<=st.shown)return;
 st.allItems.slice(st.shown,next).forEach(function(b){grid.appendChild(card(b));});
 st.shown=next;st.items=st.allItems.slice(0,st.shown);st.hasMore=st.shown<st.total;syncMore();
}
window.UBnuxBusinesses={state:st,renderBusinesses:function(){render(st.allItems,st.total);},render:render,appendMore:appendMore,getKey:key};
})(window,document);
