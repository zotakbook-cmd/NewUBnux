/* UBnux Categories v7.0.0 - stable dropdown controller */
(function(window,document){
  "use strict";
  var cache=[];
  function clean(v){return String(v==null?"":v).trim();}
  function first(o,keys){o=o||{};for(var i=0;i<keys.length;i++){if(o[keys[i]]!=null&&clean(o[keys[i]])!=="")return o[keys[i]];}return "";}
  function rows(x){
    if(Array.isArray(x))return x;
    if(!x||typeof x!=="object")return[];
    if(Array.isArray(x.categories))return x.categories;
    if(Array.isArray(x.data))return x.data;
    if(Array.isArray(x.items))return x.items;
    if(Array.isArray(x.results))return x.results;
    if(x.payload&&typeof x.payload==="object")return rows(x.payload);
    return[];
  }
  function value(c){return clean(first(c,["Slug","slug","CategoryID","categoryId","ID","id","CategoryName","categoryName","Name","name"]));}
  function name(c){return clean(first(c,["CategoryName","categoryName","Name","name","Slug","slug"]));}
  function icon(c){return clean(first(c,["Icon","icon"]))||"🏪";}
  function slug(v){return clean(v).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
  function getMenu(){return document.getElementById("categoryDropdownMenu");}
  function getButton(){return document.getElementById("categoryDropdownButton");}
  function open(){
    var m=getMenu(),b=getButton();
    if(b&&b.disabled)return;
    if(m){m.hidden=false;m.removeAttribute("hidden");m.classList.add("open");}
    if(b){b.setAttribute("aria-expanded","true");}
  }
  function close(){
    var m=getMenu(),b=getButton();
    if(m){m.hidden=true;m.setAttribute("hidden","");m.classList.remove("open");}
    if(b)b.setAttribute("aria-expanded","false");
    var s=document.getElementById("categorySearchInput");
    if(s)s.value="";
    var empty=document.getElementById("categoryEmptyState");
    if(empty)empty.hidden=true;
    var box=document.getElementById("categoryOptions");
    if(box)box.querySelectorAll(".category-option").forEach(function(x){x.hidden=false;});
  }
  function setEnabled(v){
    var b=getButton();
    if(b)b.disabled=!v;
    if(!v)close();
  }
  function selectedText(c){
    var t=document.getElementById("selectedCategoryText"),i=document.getElementById("selectedCategoryIcon");
    if(t)t.textContent=c?name(c):"Select Business Category";
    if(i)i.textContent=c?icon(c):"🏪";
  }
  function setCategory(v){
    v=clean(v);
    var c=cache.find(function(x){return clean(value(x)).toLowerCase()===v.toLowerCase()||slug(name(x))===slug(v)||slug(value(x))===slug(v);});
    if(!c)return false;
    if(window.UBnuxState&&window.UBnuxState.state){
      window.UBnuxState.state.selectedCategory=value(c);
      window.UBnuxState.state.selected.category=value(c);
      window.UBnuxState.state.selected.categoryName=name(c);
    }
    selectedText(c);close();
    return true;
  }
  function clearCategory(){
    if(window.UBnuxState&&window.UBnuxState.state){
      window.UBnuxState.state.selectedCategory="";
      window.UBnuxState.state.selected.category="";
      window.UBnuxState.state.selected.categoryName="";
    }
    selectedText(null);close();
  }
  function render(list){
    var box=document.getElementById("categoryOptions"),search=document.getElementById("categorySearchInput"),empty=document.getElementById("categoryEmptyState");
    if(!box)return;
    cache=rows(list).filter(function(c){return c&&c.Active!==false&&c.active!==false;}).sort(function(a,b){return Number(a.SortOrder||9999)-Number(b.SortOrder||9999)||name(a).localeCompare(name(b));});
    box.innerHTML="";
    cache.forEach(function(c){
      var b=document.createElement("button");
      b.type="button";b.className="category-option";b.dataset.value=value(c);
      var i=document.createElement("span"),n=document.createElement("span");
      i.textContent=icon(c);n.textContent=name(c);b.appendChild(i);b.appendChild(n);
      b.addEventListener("click",function(e){
        e.preventDefault();e.stopPropagation();
        if(setCategory(b.dataset.value)&&window.UBnuxApp&&typeof window.UBnuxApp.applyFilters==="function")window.UBnuxApp.applyFilters({updateSEO:true});
      });
      box.appendChild(b);
    });
    if(search&&!search.dataset.ubnuxBound){
      search.dataset.ubnuxBound="1";
      search.addEventListener("input",function(){
        var q=clean(search.value).toLowerCase(),count=0;
        box.querySelectorAll(".category-option").forEach(function(b){var show=!q||clean(b.textContent).toLowerCase().indexOf(q)>=0;b.hidden=!show;if(show)count++;});
        if(empty)empty.hidden=count>0;
      });
      search.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
      search.addEventListener("click",function(e){e.stopPropagation();});
    }
    var current=window.UBnuxState&&window.UBnuxState.state?window.UBnuxState.state.selectedCategory:"";
    var c=cache.find(function(x){return clean(value(x)).toLowerCase()===clean(current).toLowerCase()||slug(value(x))===slug(current);});
    selectedText(c||null);
  }
  function getJSON(url){
    if(window.UBnuxStaticCache&&typeof window.UBnuxStaticCache.getJSON==="function")return window.UBnuxStaticCache.getJSON(url);
    return fetch(url,{cache:"no-cache",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();});
  }
  function load(){
    var u=(window.UBNUX_CONFIG||{}).CATEGORIES_JSON_URL||"/assets/data/categories.json";
    return getJSON(u).then(function(x){var a=rows(x);cache=a;if(window.UBnuxState)window.UBnuxState.setCategories(a);render(a);return a;});
  }
  document.addEventListener("click",function(e){var root=document.getElementById("categoryDropdown");if(root&&!root.contains(e.target))close();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")close();});
  window.UBnuxCategories={version:"7.0.0",load:load,render:render,open:open,close:close,setEnabled:setEnabled,setCategory:setCategory,clearCategory:clearCategory,getCategoryName:function(v){var c=cache.find(function(x){return clean(value(x)).toLowerCase()===clean(v).toLowerCase()||slug(name(x))===slug(v);});return c?name(c):clean(v);},getCategorySlug:function(v){var c=cache.find(function(x){return clean(value(x)).toLowerCase()===clean(v).toLowerCase();});return c?slug(first(c,["Slug","slug","CategoryName","categoryName"])):slug(v);},getAll:function(){return cache.slice();}};
})(window,document);
