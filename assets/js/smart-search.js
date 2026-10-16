/* UBnux Smart Search v5.3.0 - fuzzy all-field search + district/category intent */
(function(window, document){
  "use strict";
  var C=window.UBNUX_CONFIG||{};
  var indexPromise=null,districtIndexPromise=null,categoryPromise=null,statePromise=null;
  var districtCache=Object.create(null),stateCache=Object.create(null);
  var st={active:false,q:"",matches:[],pageSize:Number(C.BUSINESS_PAGE_SIZE||18),index:[]};
  function text(v){return String(v==null?"":v).trim();}
  function norm(v){return text(v).toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[\u201C\u201D]/g,'"').replace(/&/g," and ").replace(/[^a-z0-9\u0900-\u097f]+/g," ").replace(/\s+/g," ").trim();}
  function slug(v){return norm(v).replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
  function tokens(v){return norm(v).split(" ").filter(Boolean);}
  function first(o,keys){o=o||{};for(var i=0;i<keys.length;i++)if(o[keys[i]]!==undefined&&o[keys[i]]!==null&&text(o[keys[i]])!=="")return o[keys[i]];return "";}
  function arr(x,key){if(Array.isArray(x))return x;if(!x||typeof x!=="object")return [];if(key&&Array.isArray(x[key]))return x[key];var ks=["businesses","districts","categories","states","results","items","data","records","list"];for(var i=0;i<ks.length;i++)if(Array.isArray(x[ks[i]]))return x[ks[i]];return [];}
  function unique(list){var seen=Object.create(null),out=[];(Array.isArray(list)?list:[]).forEach(function(b,i){if(!b||typeof b!=="object")return;var k=text(first(b,["BusinessID","businessId","id","SEOPath","seoPath","Slug","slug"])).toLowerCase();if(!k)k=norm(first(b,["BusinessName","name","Name"]))+"|"+norm(first(b,["DistrictID","DistrictName","district"]))+"|"+i;if(!seen[k]){seen[k]=1;out.push(b);}});return out;}
  function getJSON(url){if(window.UBnuxStaticCache&&typeof window.UBnuxStaticCache.getJSON==="function")return window.UBnuxStaticCache.getJSON(url);return fetch(url,{cache:"no-cache",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();});}
  function loadIndex(){if(!indexPromise)indexPromise=getJSON(C.BUSINESS_INDEX_JSON_URL||"/assets/data/business-index.json").then(function(x){var a=unique(arr(x,"businesses"));if(!a.length)throw new Error("business-index.json is empty");st.index=a;return a;});return indexPromise;}
  function loadDistrictIndex(){if(!districtIndexPromise)districtIndexPromise=getJSON(C.DISTRICT_INDEX_JSON_URL||"/assets/data/district-index.json").then(function(x){return arr(x,"districts");});return districtIndexPromise;}
  function loadCategories(){if(!categoryPromise)categoryPromise=getJSON(C.CATEGORIES_JSON_URL||"/assets/data/categories.json").then(function(x){return arr(x,"categories");});return categoryPromise;}
  function loadStates(){if(!statePromise)statePromise=getJSON(C.STATES_JSON_URL||"/assets/data/states.json").then(function(x){return arr(x,"states");});return statePromise;}
  function dfile(d){return first(d,["file","File","url","URL","dataFile","DataFile","businessFile","BusinessFile"]);}
  function dtext(d){return norm([first(d,["DistrictName","districtName","District","district"]),first(d,["Slug","slug","DistrictSlug","districtSlug"]),first(d,["DistrictID","districtId"]),first(d,["DistrictCode","districtCode"])].join(" "));}
  function ctext(c){return norm([first(c,["CategoryName","categoryName","Name","name"]),first(c,["Slug","slug"]),first(c,["CategoryID","categoryId"])].join(" "));}
  function stext(s){return norm([first(s,["StateName","stateName","Name","name"]),first(s,["Slug","slug"]),first(s,["StateCode","stateCode"])].join(" "));}
  function lev(a,b){a=norm(a);b=norm(b);if(a===b)return 0;if(!a||!b)return 99;var m=a.length,n=b.length;if(Math.abs(m-n)>4)return 99;var prev=[],cur=[],i,j;for(j=0;j<=n;j++)prev[j]=j;for(i=1;i<=m;i++){cur=[i];for(j=1;j<=n;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));prev=cur;}return prev[n];}
  function entityScore(qText,candText){
    var q=norm(qText),c=norm(candText),qt=tokens(q),ct=tokens(c),s=0,matched=0;
    if(!q||!c)return 0;if(q===c)return 1000;if(c.indexOf(q)>=0||q.indexOf(c)>=0)s+=500;
    qt.forEach(function(t){var best=0;ct.forEach(function(u){if(t===u)best=Math.max(best,300);else if(u.indexOf(t)>=0||t.indexOf(u)>=0)best=Math.max(best,180);else{var d=lev(t,u),max=Math.max(2,Math.floor(Math.max(t.length,u.length)*0.34));if(d<=max)best=Math.max(best,100);}});if(best){matched++;s+=best;}});
    return matched===qt.length?s:(matched?s*0.35:0);
  }
  function detect(q){
    return Promise.all([loadDistrictIndex(),loadCategories(),loadStates()]).then(function(all){
      var ds=all[0],cs=all[1],ss=all[2],bestD=null,bestC=null,bestS=null,bd=0,bc=0,bs=0;
      ds.forEach(function(d){var s=entityScore(q,dtext(d));if(s>bd){bd=s;bestD=d;}});
      cs.forEach(function(c){var s=entityScore(q,ctext(c));if(s>bc){bc=s;bestC=c;}});
      ss.forEach(function(s){var z=entityScore(q,stext(s));if(z>bs){bs=z;bestS=s;}});
      return {district:bd>=100?bestD:null,category:bc>=100?bestC:null,state:bs>=100?bestS:null,districtScore:bd,categoryScore:bc,stateScore:bs};
    }).catch(function(){return {district:null,category:null,state:null,districtScore:0,categoryScore:0,stateScore:0};});
  }
  function loadDistrict(d){var f=dfile(d);if(!f)return Promise.resolve([]);if(districtCache[f])return districtCache[f];districtCache[f]=getJSON(f).then(function(x){return unique(arr(x,"businesses"));});return districtCache[f];}
  function loadState(s){var key=norm(first(s,["Slug","StateSlug","StateName","StateCode","StateCode"]));if(stateCache[key])return stateCache[key];return loadDistrictIndex().then(function(ds){var selected=ds.filter(function(d){var st=norm(first(d,["state","State","stateName","StateName","stateSlug","StateSlug","StateCode","stateCode"]));return st===key||st.indexOf(key)>=0;});return Promise.all(selected.map(loadDistrict)).then(function(parts){var out=[];parts.forEach(function(p){out=out.concat(p);});return unique(out);});}).then(function(x){stateCache[key]=x;return x;});}
  function fieldHay(b){
    /* Search every value in business-index.json, not only a fixed field list. */
    var parts=[];Object.keys(b||{}).forEach(function(k){var v=b[k];if(v===null||v===undefined)return;if(typeof v==="object"){try{parts.push(JSON.stringify(v));}catch(e){}}else parts.push(String(v));});return norm(parts.join(" "));
  }
  function fields(b){return{state:norm(first(b,["State","state","StateName","stateName","StateSlug","stateSlug","StateCode"])),district:norm(first(b,["DistrictName","districtName","DistrictSlug","districtSlug","district","District","DistrictID"])),category:norm(first(b,["CategoryName","categoryName","CategorySlug","categorySlug","category","Category","CategoryID"])),name:norm(first(b,["BusinessName","name","Name","Slug","slug"]))};}
  function fuzzyToken(t,h){if(h.indexOf(t)>=0)return 40;var words=h.split(" "),best=0;words.forEach(function(w){var d=lev(t,w),max=Math.max(2,Math.floor(Math.max(t.length,w.length)*0.34));if(d<=max)best=Math.max(best,18);});return best;}
  function searchScore(b,q){var f=fields(b),h=fieldHay(b),ts=tokens(q),score=0,matched=0;ts.forEach(function(t){var m=fuzzyToken(t,h);if(m){matched++;score+=m;}if(f.name===t)score+=900;else if(f.name.indexOf(t)>=0)score+=220;if(f.category===t)score+=500;else if(f.category.indexOf(t)>=0)score+=130;if(f.district===t)score+=450;else if(f.district.indexOf(t)>=0)score+=120;if(f.state===t)score+=400;});if(norm(q)&&h.indexOf(norm(q))>=0)score+=260;if(matched===ts.length)score+=220;else score=Math.floor(score*0.35);if(b.Featured===true||b.featured===true)score+=5;return score;}
  function filterExact(list,entity){return unique(list).filter(function(b){var f=fields(b);return !entity.state||f.state.indexOf(norm(first(entity.state,["StateName","stateName","Slug","slug","StateCode"])) )>=0;}).filter(function(b){return !entity.district||fields(b).district.indexOf(norm(first(entity.district,["DistrictName","districtName","Slug","slug","DistrictID"])))>=0;}).filter(function(b){return !entity.category||fields(b).category.indexOf(norm(first(entity.category,["CategoryName","categoryName","Slug","slug","CategoryID"])))>=0;});}
  function render(matches,q){if(window.UBnuxBusinesses&&typeof window.UBnuxBusinesses.render==="function")window.UBnuxBusinesses.render(matches,matches.length);var t=document.getElementById("businessSectionTitle");if(t)t.textContent='Search results for "'+q+'"';}
  function message(v){var m=document.getElementById("selectionMessage");if(m)m.textContent=v;}
  function updateURL(q){try{history.pushState({ubnuxSearch:q},"","/"+slug(q)+"/");}catch(e){}}
  function deactivate(){st.active=false;st.q="";st.matches=[];}
  function resetDropdownsForSearch(){
    if(window.UBnuxApp&&typeof window.UBnuxApp.resetDropdowns==="function")window.UBnuxApp.resetDropdowns();
    if(window.UBnuxApp&&typeof window.UBnuxApp.clearSearchInput==="function"){};
  }
  function search(q,opts){
    opts=opts||{};q=text(q);if(!q){deactivate();if(window.UBnuxApp&&typeof window.UBnuxApp.resetDropdowns==="function")window.UBnuxApp.resetDropdowns();if(window.UBnuxBusinesses)window.UBnuxBusinesses.render([],0);message("Please select your state to continue.");return Promise.resolve([]);}
    st.active=true;st.q=q;resetDropdownsForSearch();
    return detect(q).then(function(intent){
      var sourcePromise;
      if(intent.district)sourcePromise=loadDistrict(intent.district);
      else if(intent.state)sourcePromise=loadState(intent.state);
      else sourcePromise=loadIndex();
      return sourcePromise.then(function(source){
        var exact=filterExact(source,intent),useExact=!!(intent.district||intent.category||intent.state),pool=useExact?exact:source;
        if(!useExact)pool=unique(source);
        var scored=pool.map(function(b){return{b:b,s:searchScore(b,q)};}).filter(function(x){return x.s>0;}).sort(function(a,b){return b.s-a.s||fields(a.b).name.localeCompare(fields(b.b).name);}).map(function(x){return x.b;});
        /* District-only and state-only queries must show the complete location data, not only keyword matches. */
        if(intent.district&&!intent.category&&!intent.state)scored=exact;
        if(intent.state&&!intent.district&&!intent.category)scored=exact;
        st.matches=unique(scored);render(st.matches,q);message(st.matches.length?st.matches.length+" businesses found":'No businesses found for "'+q+'"');if(!opts.noHistory)updateURL(q);return st.matches;
      });
    }).catch(function(e){console.error("UBnux Smart Search failed",e);st.matches=[];if(window.UBnuxBusinesses)window.UBnuxBusinesses.render([],0);message("Search data could not load. Please try again.");return [];});
  }
  function init(){
    var form=document.getElementById("ubnuxSmartSearchForm"),input=document.getElementById("ubnuxSmartSearchInput");
    if(form&&input&&!form.dataset.ubnuxSearchBound){form.dataset.ubnuxSearchBound="1";form.addEventListener("submit",function(e){e.preventDefault();search(input.value);});}
    document.querySelectorAll("[data-smart-query]").forEach(function(btn){if(btn.dataset.ubnuxSmartQueryBound)return;btn.dataset.ubnuxSmartQueryBound="1";btn.addEventListener("click",function(){var q=text(btn.getAttribute("data-smart-query")||"");if(input)input.value=q;if(q)search(q);});});
    if(window.UBnuxRouter&&window.UBnuxRouter.isSearchRoute&&window.UBnuxRouter.isSearchRoute()){var q=window.UBnuxRouter.searchQuery();if(input)input.value=q.replace(/-/g," ");search(q.replace(/-/g," "),{noHistory:true});}
  }
  window.UBnuxSmartSearch={version:"5.3.0",state:st,search:search,init:init,loadIndex:loadIndex,getIndex:loadIndex,deactivate:deactivate};
})(window,document);
