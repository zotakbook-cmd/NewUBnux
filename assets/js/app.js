/* UBnux App v5.0.1 - resilient static bootstrap */
(function(window,document){
"use strict";
var app={};
function el(id){return document.getElementById(id);}
function clean(v){return String(v==null?"":v).trim();}
function val(x){return clean(x).toLowerCase();}
function rows(x,key){return Array.isArray(x)?x:(x&&Array.isArray(x[key])?x[key]:[]);}
function loadStates(){
 return window.UBnuxStaticCache.getJSON(window.UBNUX_CONFIG.STATES_JSON_URL||"/assets/data/states.json").then(function(x){
  var states=rows(x,"states");window.UBnuxState.setStates(states);
  var s=el("stateFilter");
  if(s){s.innerHTML='<option value="">All States</option>';states.filter(function(x){return x.Active!==false;}).sort(function(a,b){return Number(a.SortOrder||9999)-Number(b.SortOrder||9999);}).forEach(function(x){var o=document.createElement("option");o.value=x.Slug||x.StateCode||x.StateName;o.textContent=x.StateName||x.Name||o.value;s.appendChild(o);});}
  return states;
 });
}
function applyFilters(){
 var s=val(el("stateFilter")&&el("stateFilter").value),d=val(el("districtFilter")&&el("districtFilter").value),c=val(window.UBnuxState.state.selectedCategory||"");
 return window.UBnuxSmartSearch.loadIndex().then(function(index){
  var p=index.filter(function(b){return (!s||val(b.state)===s||val(b.stateName)===s||val(b.state).indexOf(s)>=0)&&(!d||val(b.district)===d||val(b.districtName)===d)&&(!c||val(b.category)===c||val(b.categoryId)===c);});
  var sort=val(el("sortFilter")&&el("sortFilter").value)||"featured";
  p.sort(function(a,b){if(sort==="name")return val(a.name).localeCompare(val(b.name));if(sort==="rating")return Number(b.rating||0)-Number(a.rating||0);return Number(!!b.featured)-Number(!!a.featured)||val(a.name).localeCompare(val(b.name));});
  window.UBnuxBusinesses.render(p.slice(0,18),p.length);return p;
 }).catch(function(e){console.error("UBnux filter failed",e);window.UBnuxBusinesses.render([],0);return [];});
}
function bind(){
 var s=el("stateFilter"),d=el("districtFilter"),sort=el("sortFilter");
 if(s)s.addEventListener("change",function(){
  var st=window.UBnuxState.get();
  var ds=(st.districts||[]).filter(function(x){return val(x.State||x.StateName)===val(s.value)||val(x.StateCode)===val(s.value)||val(x.Slug)===val(s.value);});
  window.UBnuxDistricts.render(ds);applyFilters();
 });
 if(d)d.addEventListener("change",applyFilters);
 if(sort)sort.addEventListener("change",applyFilters);
 var cb=el("categoryDropdownButton"),menu=el("categoryDropdownMenu");
 if(cb&&menu)cb.addEventListener("click",function(){var open=menu.classList.toggle("open");cb.setAttribute("aria-expanded",open?"true":"false");});
 var catSearch=el("categorySearchInput");
 if(catSearch)catSearch.addEventListener("input",function(){var q=val(catSearch.value);document.querySelectorAll(".category-option").forEach(function(x){x.hidden=!!q&&val(x.textContent).indexOf(q)<0;});});
 var more=el("loadMoreButton");
 if(more)more.addEventListener("click",function(){window.UBnuxBusinesses.appendMore(18);});
}
function enableSelectors(){["stateFilter","districtFilter","categoryDropdownButton","sortFilter"].forEach(function(id){var e=el(id);if(e)e.disabled=false;});}
function init(){
 var y=el("currentYear");if(y)y.textContent=new Date().getFullYear();
 loadStates().then(function(){return window.UBnuxDistricts.load();}).then(function(){return window.UBnuxCategories.load();}).then(function(){
  bind();window.UBnuxSmartSearch.init();var sel=window.UBnuxStorage.getSelection()||{};
  if(sel.state&&el("stateFilter")){el("stateFilter").value=sel.state;el("stateFilter").dispatchEvent(new Event("change"));}
  enableSelectors();document.body.classList.add("ubnux-ready");
 }).catch(function(e){
  console.error("UBnux bootstrap failed",e);enableSelectors();
  if(window.UBnuxSmartSearch&&typeof window.UBnuxSmartSearch.init==="function")window.UBnuxSmartSearch.init();
  document.body.classList.add("ubnux-ready");
  var msg=el("selectionMessage");if(msg)msg.textContent="Directory data could not load. Please refresh and try again.";
 });
}
app.applyFilters=applyFilters;app.init=init;window.UBnuxApp=app;
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
