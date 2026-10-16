/* UBnux App v5.3.0 - exact dropdown filters + full district/state loading + SEO routes */
(function(window, document){
  "use strict";

  var app = {};
  var loaderTimer = null;
  var districtIndexPromise = null;
  var districtChunkCache = Object.create(null);
  var allStateCache = Object.create(null);
  var bound = false;
  var restoringRoute = false;

  function el(id){ return document.getElementById(id); }
  function clean(v){ return String(v==null?"":v).trim(); }
  function val(v){ return clean(v).toLowerCase(); }
  function rows(x,key){
    if(Array.isArray(x)) return x;
    if(!x || typeof x!=="object") return [];
    if(key && Array.isArray(x[key])) return x[key];
    var keys=["businesses","districts","categories","states","results","items","data","records","list"];
    for(var i=0;i<keys.length;i++) if(Array.isArray(x[keys[i]])) return x[keys[i]];
    return [];
  }
  function first(o,keys){
    o=o||{};
    for(var i=0;i<keys.length;i++) if(o[keys[i]]!==undefined && o[keys[i]]!==null && clean(o[keys[i]])!=="") return o[keys[i]];
    return "";
  }
  function slugify(v){
    return clean(v).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
  }
  function unique(list){
    var seen=Object.create(null), out=[];
    (Array.isArray(list)?list:[]).forEach(function(b,i){
      if(!b || typeof b!=="object") return;
      var k=clean(first(b,["BusinessID","businessId","id","SEOPath","seoPath","Slug","slug"])).toLowerCase();
      if(!k) k=clean(first(b,["BusinessName","name","Name"])).toLowerCase()+"|"+clean(first(b,["DistrictID","DistrictName","district"])).toLowerCase()+"|"+i;
      if(seen[k]) return; seen[k]=1; out.push(b);
    });
    return out;
  }
  function hideLoader(){
    var x=el("pageLoader");
    if(x){x.classList.add("hidden");x.style.opacity="0";x.style.visibility="hidden";x.style.pointerEvents="none";x.setAttribute("aria-hidden","true");}
    if(loaderTimer){clearTimeout(loaderTimer);loaderTimer=null;}
  }
  function showLoader(){
    var x=el("pageLoader");
    if(x){x.classList.remove("hidden");x.style.opacity="";x.style.visibility="";x.style.pointerEvents="";x.removeAttribute("aria-hidden");}
  }
  function revealApp(){hideLoader();if(document.body)document.body.classList.add("ubnux-ready");}
  function startLoaderFailsafe(){if(loaderTimer)clearTimeout(loaderTimer);loaderTimer=setTimeout(revealApp,8000);}
  function getJSON(url){
    if(window.UBnuxStaticCache && typeof window.UBnuxStaticCache.getJSON==="function") return window.UBnuxStaticCache.getJSON(url);
    return fetch(url,{cache:"no-cache",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status+" "+url);return r.json();});
  }
  function cfg(name,fallback){return (window.UBNUX_CONFIG&&window.UBNUX_CONFIG[name])||fallback;}

  function loadStates(){
    return getJSON(cfg("STATES_JSON_URL","/assets/data/states.json")).then(function(x){
      var list=rows(x,"states");
      if(window.UBnuxState && typeof window.UBnuxState.setStates==="function") window.UBnuxState.setStates(list);
      var s=el("stateFilter");
      if(s){
        s.innerHTML='<option value="">All States</option>';
        list.filter(function(x){return x.Active!==false && x.active!==false;}).sort(function(a,b){return Number(a.SortOrder||9999)-Number(b.SortOrder||9999);}).forEach(function(x){
          var o=document.createElement("option");o.value=first(x,["Slug","StateCode","StateName","Name"]);o.textContent=first(x,["StateName","Name","Slug"]);s.appendChild(o);
        });
      }
      return list;
    });
  }

  function loadDistrictIndex(){
    if(!districtIndexPromise){
      districtIndexPromise=getJSON(cfg("DISTRICT_INDEX_JSON_URL","/assets/data/district-index.json")).then(function(x){return rows(x,"districts");});
    }
    return districtIndexPromise;
  }
  function districtFile(d){return first(d,["file","File","url","URL","dataFile","DataFile","businessFile","BusinessFile"]);}
  function districtState(d){return val(first(d,["state","State","stateName","StateName","StateSlug","stateSlug","StateCode","stateCode"]));}
  function districtSlug(d){return val(first(d,["Slug","slug","DistrictSlug","districtSlug","DistrictName","districtName"]));}
  function districtId(d){return val(first(d,["DistrictID","districtId","id","ID","DistrictCode","districtCode"]));}
  function sameState(d,w){
    w=val(w); if(!w)return true;
    return [d.State,d.state,d.StateName,d.stateName,d.StateSlug,d.stateSlug,d.StateCode,d.stateCode].some(function(x){return val(x)===w;});
  }
  function sameDistrict(b,w){
    w=val(w);if(!w)return true;
    return [b.DistrictID,b.districtId,b.DistrictCode,b.districtCode,b.DistrictName,b.districtName,b.DistrictSlug,b.districtSlug,b.district,b.District].some(function(x){return val(x)===w || val(x).split(" ").indexOf(w)>=0;});
  }
  function sameStateBusiness(b,w){
    w=val(w);if(!w)return true;
    return [b.State,b.state,b.StateName,b.stateName,b.StateSlug,b.stateSlug,b.StateCode,b.stateCode].some(function(x){return val(x)===w || val(x).split(" ").indexOf(w)>=0;});
  }
  function sameCategory(b,w){
    w=val(w);if(!w)return true;
    return [b.CategoryID,b.categoryId,b.CategoryName,b.categoryName,b.CategorySlug,b.categorySlug,b.category,b.Category].some(function(x){return val(x)===w || val(x).split(" ").indexOf(w)>=0;});
  }
  function chunk(d){
    var file=districtFile(d); if(!file)return Promise.resolve([]);
    if(districtChunkCache[file])return districtChunkCache[file];
    districtChunkCache[file]=getJSON(file).then(function(x){return unique(rows(x,"businesses"));});
    return districtChunkCache[file];
  }
  function allStateBusinesses(stateValue){
    var key=val(stateValue);if(allStateCache[key])return allStateCache[key];
    var promise=loadDistrictIndex().then(function(list){
      var ds=list.filter(function(d){return sameState(d,key);});
      if(!ds.length && window.UBnuxState && window.UBnuxState.state && Array.isArray(window.UBnuxState.state.districts)) ds=window.UBnuxState.state.districts.filter(function(d){return sameState(d,key);});
      return Promise.all(ds.map(chunk)).then(function(parts){return unique([].concat.apply([],parts));});
    });
    allStateCache[key]=promise;return promise;
  }
  function selected(){
    var s=el("stateFilter"),d=el("districtFilter"),c="";
    if(window.UBnuxState && window.UBnuxState.state){
      c=first(window.UBnuxState.state,["selectedCategory"]);
      if(!c && window.UBnuxState.state.selected)c=window.UBnuxState.state.selected.category;
    }
    return {state:val(s&&s.value),district:val(d&&d.value),category:val(c)};
  }
  function districtFromValue(list,v){
    v=val(v);return list.find(function(d){return districtId(d)===v||districtSlug(d)===v||val(first(d,["DistrictName","districtName","District","district"]))===v;});
  }
  function stateSlugByValue(v){
    v=val(v);var s=el("stateFilter");if(s&&s.selectedOptions&&s.selectedOptions[0]) return slugify(s.selectedOptions[0].value||s.selectedOptions[0].textContent);
    return slugify(v);
  }
  function districtSlugByValue(v){
    v=val(v);var opt=el("districtFilter")&&el("districtFilter").selectedOptions&&el("districtFilter").selectedOptions[0];return slugify(opt?opt.value||opt.textContent:v);}
  function categorySlugByValue(v){return slugify(v);}
  function syncDirectoryURL(){
    if(restoringRoute)return;
    var x=selected();if(!x.state)return;
    var stateName=el("stateFilter")&&el("stateFilter").selectedOptions&&el("stateFilter").selectedOptions[0]?clean(el("stateFilter").selectedOptions[0].textContent):x.state;
    var districtName=el("districtFilter")&&el("districtFilter").selectedOptions&&el("districtFilter").selectedOptions[0]?clean(el("districtFilter").selectedOptions[0].textContent):x.district;
    var categoryName=window.UBnuxCategories&&typeof window.UBnuxCategories.getCategoryName==="function"?(window.UBnuxCategories.getCategoryName(x.category)||x.category):x.category;
    var path="/in/"+stateSlugByValue(x.state)+"/";
    if(x.district)path+=districtSlugByValue(x.district)+"/";
    if(x.district && x.category)path+=categorySlugByValue(x.category)+"/";
    var title="UBnux - Businesses in "+stateName;
    if(x.district)title+=" | "+districtName;
    if(x.category)title+=" | "+categoryName;
    document.title=title;
    var canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=window.location.origin+path;
    var desc=document.querySelector('meta[name="description"]');if(desc)desc.content="Find local businesses in "+stateName+(x.district?", "+districtName:"")+(x.category?" for "+categoryName:"")+" with UBnux.";
    try{history.pushState({ubnuxDirectory:true},"",path);}catch(e){}
  }
  function clearSearchInput(){var i=el("ubnuxSmartSearchInput");if(i)i.value="";}
  function resetDropdowns(){
    var s=el("stateFilter"),d=el("districtFilter");
    if(s)s.value="";
    if(d){d.value="";if(window.UBnuxDistricts&&typeof window.UBnuxDistricts.clearDistricts==="function")window.UBnuxDistricts.clearDistricts();}
    if(window.UBnuxCategories&&typeof window.UBnuxCategories.clearCategory==="function")window.UBnuxCategories.clearCategory();
    if(window.UBnuxState&&window.UBnuxState.state){window.UBnuxState.state.selectedCategory="";window.UBnuxState.state.selected={state:"",district:"",category:"",stateName:"",districtName:"",categoryName:""};}
  }
  function clearResults(message){
    if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.render==="function")window.UBnuxBusinesses.render([],0);
    var t=el("businessSectionTitle");if(t)t.textContent="Businesses near you";
    var m=el("selectionMessage");if(m)m.textContent=message||"Select your state, district or category to view businesses.";
  }
  function sortList(p){
    var sort=val(el("sortFilter")&&el("sortFilter").value)||"featured";
    p.sort(function(a,b){
      if(sort==="name")return val(first(a,["name","BusinessName","Name"])).localeCompare(val(first(b,["name","BusinessName","Name"])));
      if(sort==="rating")return Number(first(b,["rating","Rating"],0))-Number(first(a,["rating","Rating"],0));
      return Number(!!first(b,["featured","Featured"]))-Number(!!first(a,["featured","Featured"])) || val(first(a,["name","BusinessName","Name"])).localeCompare(val(first(b,["name","BusinessName","Name"])));
    });return p;
  }
  function applyFilters(opts){
    opts=opts||{};
    var x=selected();
    if(!x.state){clearResults("Please select your state to continue.");return Promise.resolve([]);}
    var source;
    if(x.district){
      return loadDistrictIndex().then(function(list){
        var d=districtFromValue(list,x.district);
        if(!d && window.UBnuxState&&window.UBnuxState.state&&Array.isArray(window.UBnuxState.state.districts))d=districtFromValue(window.UBnuxState.state.districts,x.district);
        return d?chunk(d):allStateBusinesses(x.state);
      }).then(function(data){
        var p=unique(data).filter(function(b){return sameDistrict(b,x.district)&&sameStateBusiness(b,x.state)&&sameCategory(b,x.category);});
        if(p.length===0 && data.length && x.district)p=unique(data).filter(function(b){return sameDistrict(b,x.district)&&sameCategory(b,x.category);});
        p=sortList(p);
        if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.render==="function")window.UBnuxBusinesses.render(p,p.length);
        var title=el("businessSectionTitle");if(title){var stxt=el("stateFilter")&&el("stateFilter").selectedOptions&&el("stateFilter").selectedOptions[0]?el("stateFilter").selectedOptions[0].textContent:"";var dtxt=el("districtFilter")&&el("districtFilter").selectedOptions&&el("districtFilter").selectedOptions[0]?el("districtFilter").selectedOptions[0].textContent:"";title.textContent=x.category?"Businesses in "+dtxt+" — "+(window.UBnuxCategories&&typeof window.UBnuxCategories.getCategoryName==="function"?(window.UBnuxCategories.getCategoryName(x.category)||x.category):x.category):"Businesses in "+dtxt;}
        var msg=el("selectionMessage");if(msg)msg.textContent=x.category?p.length+" businesses found":"All businesses in selected district — "+p.length+" found";
        if(!opts.skipURL)syncDirectoryURL();
        return p;
      });
    }
    return allStateBusinesses(x.state).then(function(data){return sortList(unique(data).filter(function(b){return sameStateBusiness(b,x.state)&&sameCategory(b,x.category);}));})
      .then(function(p){
        if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.render==="function")window.UBnuxBusinesses.render(p,p.length);
        var t=el("businessSectionTitle");if(t)t.textContent=x.category?"Businesses in "+(el("stateFilter").selectedOptions[0].textContent):"Businesses in "+el("stateFilter").selectedOptions[0].textContent;
        var m=el("selectionMessage");if(m)m.textContent=x.category? p.length+" businesses found":"All businesses in selected state — "+p.length+" found";
        if(!opts.skipURL)syncDirectoryURL();return p;
      }).catch(function(e){console.error("UBnux filter failed",e);clearResults("Business data could not be loaded.");return [];});
  }
  function bind(){
    if(bound)return;bound=true;
    var s=el("stateFilter"),d=el("districtFilter"),sort=el("sortFilter");
    if(s)s.addEventListener("change",function(){
      var stateValue=val(s.value);clearSearchInput();
      if(window.UBnuxSmartSearch&&typeof window.UBnuxSmartSearch.deactivate==="function")window.UBnuxSmartSearch.deactivate();
      if(window.UBnuxCategories&&typeof window.UBnuxCategories.clearCategory==="function")window.UBnuxCategories.clearCategory();
      if(window.UBnuxState&&window.UBnuxState.state){window.UBnuxState.state.selectedCategory="";window.UBnuxState.state.selected.state=stateValue;window.UBnuxState.state.selected.district="";window.UBnuxState.state.selected.category="";}
      if(!stateValue){if(window.UBnuxDistricts&&typeof window.UBnuxDistricts.clearDistricts==="function")window.UBnuxDistricts.clearDistricts();clearResults("Please select your state to continue.");return;}
      if(window.UBnuxDistricts&&typeof window.UBnuxDistricts.loadDistricts==="function"){
        window.UBnuxDistricts.loadDistricts(stateValue).then(function(){if(d)d.value="";return applyFilters();});
      }else applyFilters();
    });
    if(d)d.addEventListener("change",function(){
      clearSearchInput();if(window.UBnuxSmartSearch&&typeof window.UBnuxSmartSearch.deactivate==="function")window.UBnuxSmartSearch.deactivate();
      if(window.UBnuxCategories&&typeof window.UBnuxCategories.clearCategory==="function")window.UBnuxCategories.clearCategory();
      var x=selected();if(window.UBnuxState&&window.UBnuxState.state){window.UBnuxState.state.selected.district=x.district;window.UBnuxState.state.selected.category="";}
      if(!x.district){applyFilters();return;}
      applyFilters();
    });
    if(sort)sort.addEventListener("change",function(){if(selected().state)applyFilters({skipURL:true});});
    var cb=el("categoryDropdownButton"),menu=el("categoryDropdownMenu");
    if(cb&&menu){cb.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(window.UBnuxCategories){if(menu.classList.contains("open"))window.UBnuxCategories.close();else window.UBnuxCategories.open();}});}
    var more=el("loadMoreButton");if(more)more.addEventListener("click",function(){if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.appendMore==="function")window.UBnuxBusinesses.appendMore(18);});
    var mb=el("mobileMenuButton"),nav=el("mainNav");if(mb&&nav)mb.addEventListener("click",function(){var o=nav.classList.toggle("open");mb.setAttribute("aria-expanded",o?"true":"false");});
    window.addEventListener("popstate",function(){
      var r=window.UBnuxRouter&&window.UBnuxRouter.getRoute?window.UBnuxRouter.getRoute():null;
      if(r&&r.type==="directory")restoreDirectoryRoute(r.params,true);
      else if(r&&r.type==="search"&&window.UBnuxSmartSearch)window.UBnuxSmartSearch.search(r.query,{noHistory:true});
      else if(r&&r.type==="home"){resetDropdowns();clearSearchInput();clearResults("Please select your state to continue.");}
    });
  }
  function enable(){["stateFilter","districtFilter","categoryDropdownButton","sortFilter"].forEach(function(id){var x=el(id);if(x)x.disabled=false;});}
  function setCategory(value){if(window.UBnuxCategories&&typeof window.UBnuxCategories.setCategory==="function")return window.UBnuxCategories.setCategory(value);return false;}
  function restoreDirectoryRoute(r,noHistory){
    if(!r||!r.state)return Promise.resolve(false);restoringRoute=true;
    var s=el("stateFilter"),d=el("districtFilter");
    var states=s?s.options:[];var stateOption=null;
    for(var i=0;i<states.length;i++)if(slugify(states[i].value)===slugify(r.state)||slugify(states[i].textContent)===slugify(r.state)){stateOption=states[i];break;}
    if(!stateOption){restoringRoute=false;return Promise.resolve(false);}
    if(s)s.value=stateOption.value;
    if(window.UBnuxState&&window.UBnuxState.state)window.UBnuxState.state.selected.state=val(stateOption.value);
    var p=window.UBnuxDistricts&&typeof window.UBnuxDistricts.loadDistricts==="function"?window.UBnuxDistricts.loadDistricts(stateOption.value):Promise.resolve();
    return p.then(function(){
      if(r.district&&d){var o=Array.prototype.slice.call(d.options).find(function(x){return slugify(x.value)===slugify(r.district)||slugify(x.textContent)===slugify(r.district);});if(o)d.value=o.value;}
      if(window.UBnuxState&&window.UBnuxState.state)window.UBnuxState.state.selected.district=val(d&&d.value);
      if(r.category)setCategory(r.category);
      restoringRoute=false;
      return applyFilters({skipURL:true});
    }).catch(function(e){restoringRoute=false;console.warn("UBnux directory route restore failed",e);return false;});
  }
  function init(){
    var y=el("currentYear");if(y)y.textContent=new Date().getFullYear();startLoaderFailsafe();
    var route=window.UBnuxRouter&&window.UBnuxRouter.getRoute?window.UBnuxRouter.getRoute():{type:"home"};
    if(route.type==="business"){revealApp();return;}
    Promise.resolve().then(loadStates).then(function(){
      return window.UBnuxDistricts&&typeof window.UBnuxDistricts.load==="function"?window.UBnuxDistricts.load():null;
    }).then(function(){return window.UBnuxCategories&&typeof window.UBnuxCategories.load==="function"?window.UBnuxCategories.load():null;}).then(function(){
      bind();enable();
      if(window.UBnuxSmartSearch&&typeof window.UBnuxSmartSearch.init==="function")window.UBnuxSmartSearch.init();
      if(route.type==="directory")return restoreDirectoryRoute(route.params,true);
      if(route.type==="search")return window.UBnuxSmartSearch.search(route.query,{noHistory:true});
      clearResults("Please select your state to continue.");
      clearSearchInput();resetDropdowns();
    }).catch(function(e){console.error("UBnux bootstrap failed",e);enable();clearResults("Directory data could not load. Please refresh and try again.");}).finally(revealApp);
  }
  app.applyFilters=applyFilters;app.resetDropdowns=resetDropdowns;app.clearSearchInput=clearSearchInput;app.syncDirectoryURL=syncDirectoryURL;app.restoreDirectoryRoute=restoreDirectoryRoute;app.init=init;app.hideLoader=hideLoader;app.showLoader=showLoader;
  window.UBnuxApp=app;
  window.addEventListener("error",function(e){console.error("UBnux error",e&&e.error);revealApp();});
  window.addEventListener("unhandledrejection",function(e){console.error("UBnux rejection",e&&e.reason);revealApp();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window,document);
