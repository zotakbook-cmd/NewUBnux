/* UBnux Smart Search v5.0.2 - static index, resilient search + pagination */
(function(window,document){
"use strict";

var C=window.UBNUX_CONFIG||{};

var st={
  active:false,
  q:"",
  matches:[],
  page:1,
  pageSize:Number(C.BUSINESS_PAGE_SIZE||18)
};

function clean(v){
  return String(v==null?"":v).trim().toLowerCase();
}

function slug(v){
  return clean(v)
    .replace(/&/g," and ")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/-+/g,"-")
    .replace(/^-|-$/g,"");
}

function first(b,keys){
  for(var i=0;i<keys.length;i++){
    var v=b&&b[keys[i]];
    if(v!==undefined&&v!==null&&String(v).trim()!=="") return v;
  }
  return "";
}

function hay(b){
  return [
    first(b,["name","Name","BusinessName"]),
    first(b,["slug","Slug","businessSlug","BusinessSlug"]),
    first(b,["state","State","stateName","StateName","stateSlug","StateSlug"]),
    first(b,["district","District","districtName","DistrictName","districtSlug","DistrictSlug"]),
    first(b,["category","Category","categoryName","CategoryName","categorySlug","CategorySlug","categoryId","CategoryID"]),
    first(b,["short","Short","shortDescription","ShortDescription","description","Description"]),
    first(b,["area","Area"]),
    first(b,["pincode","Pincode","PINCode"])
  ].map(clean).join(" ");
}

function score(b,q){
  var name=clean(first(b,["name","Name","BusinessName"]));
  var category=clean(first(b,["category","Category","categoryName","CategoryName","categorySlug","CategorySlug"]));
  var district=clean(first(b,["district","District","districtName","DistrictName","districtSlug","DistrictSlug"]));
  var state=clean(first(b,["state","State","stateName","StateName","stateSlug","StateSlug"]));
  var h=hay(b),s=0;

  if(name===q)s+=100;
  if(name.indexOf(q)>=0)s+=50;
  if(category===q)s+=40;
  if(district===q)s+=35;
  if(state===q)s+=30;
  if(h.indexOf(q)>=0)s+=10;

  if(b.featured===true||clean(b.featured)==="true")s+=3;
  if(b.verified===true||clean(b.verified)==="true")s+=2;

  return s;
}

function getIndex(){
  if(!window.UBnuxStaticCache ||
     typeof window.UBnuxStaticCache.getJSON!=="function"){
    return Promise.reject(
      new Error("UBnuxStaticCache.getJSON is unavailable")
    );
  }

  return window.UBnuxStaticCache
    .getJSON(
      C.BUSINESS_INDEX_JSON_URL ||
      "/assets/data/business-index.json"
    )
    .then(function(x){
      if(Array.isArray(x))return x;

      if(x&&Array.isArray(x.businesses)){
        return x.businesses;
      }

      if(x&&Array.isArray(x.data)){
        return x.data;
      }

      if(x&&Array.isArray(x.items)){
        return x.items;
      }

      return [];
    });
}

function render(){
  if(!window.UBnuxBusinesses ||
     typeof window.UBnuxBusinesses.render!=="function"){
    console.error(
      "UBnux Smart Search: UBnuxBusinesses.render unavailable"
    );
    return;
  }

  /*
   * IMPORTANT:
   * Pass ALL matched records to businesses.js.
   * businesses.js controls the visible 18-per-page UI.
   */
  window.UBnuxBusinesses.render(
    st.matches,
    st.matches.length
  );

  var title=document.getElementById("businessSectionTitle");

  if(title){
    title.textContent=st.q
      ? 'Search results for "'+st.q+'"'
      : "Local businesses";
  }
}

function setMessage(text){
  var msg=document.getElementById("selectionMessage");
  if(msg)msg.textContent=text;
}

function updateUrl(q){
  var path="/"+slug(q)+"/";

  try{
    history.pushState(
      {ubnuxSearch:q},
      "",
      path
    );
  }catch(e){
    console.warn(
      "UBnux Smart Search history update failed:",
      e
    );
  }
}

function search(q,opts){
  opts=opts||{};
  q=String(q||"").trim();

  if(!q){
    st.active=false;
    st.q="";
    st.matches=[];
    st.page=1;

    if(window.UBnuxBusinesses &&
       typeof window.UBnuxBusinesses.render==="function"){
      window.UBnuxBusinesses.render([],0);
    }

    var emptyTitle=document.getElementById("businessSectionTitle");
    if(emptyTitle)emptyTitle.textContent="Local businesses";

    return Promise.resolve([]);
  }

  st.active=true;
  st.q=q;
  st.page=1;

  return getIndex()
    .then(function(index){
      index=Array.isArray(index)?index:[];

      var n=clean(q);

      st.matches=index
        .map(function(b){
          return {
            b:b||{},
            s:score(b||{},n)
          };
        })
        .filter(function(x){
          return x.s>0;
        })
        .sort(function(a,b){
          return (
            b.s-a.s ||
            Number(!!b.b.featured)-
              Number(!!a.b.featured) ||
            clean(first(a.b,["name","Name","BusinessName"]))
              .localeCompare(
                clean(first(b.b,["name","Name","BusinessName"]))
              )
          );
        })
        .map(function(x){
          return x.b;
        });

      render();

      if(!opts.noHistory){
        updateUrl(q);
      }

      return st.matches;
    })
    .catch(function(e){
      console.error(
        "UBnux Smart Search failed:",
        e
      );

      st.matches=[];
      st.page=1;

      if(window.UBnuxBusinesses &&
         typeof window.UBnuxBusinesses.render==="function"){
        window.UBnuxBusinesses.render([],0);
      }

      setMessage(
        "Search data could not load. Please retry."
      );

      return [];
    });
}

function init(){
  var form=document.getElementById(
    "ubnuxSmartSearchForm"
  );

  var input=document.getElementById(
    "ubnuxSmartSearchInput"
  );

  if(
    form &&
    input &&
    !form.dataset.ubnuxSearchBound
  ){
    form.dataset.ubnuxSearchBound="1";

    form.addEventListener(
      "submit",
      function(e){
        e.preventDefault();
        search(input.value);
      }
    );
  }

  var more=document.getElementById(
    "loadMoreButton"
  );

  /*
   * businesses.js owns the actual Load More
   * rendering. We only keep Smart Search state
   * synchronized here.
   */
  if(
    more &&
    !more.dataset.ubnuxSearchMoreBound
  ){
    more.dataset.ubnuxSearchMoreBound="1";

    more.addEventListener(
      "click",
      function(){
        /*
         * Do not render a second competing pagination
         * layer. businesses.js handles appendMore().
         */
        return true;
      },
      true
    );
  }

  window.addEventListener(
    "popstate",
    function(){
      var p=(location.pathname||"/")
        .split("/")
        .filter(Boolean);

      if(
        p.length===1 &&
        p[0]
      ){
        search(
          decodeURIComponent(
            p[0].replace(/-/g," ")
          ),
          {noHistory:true}
        );
      }
    }
  );
}

window.UBnuxSmartSearch={
  version:"5.0.2",
  state:st,
  search:search,
  init:init,
  loadIndex:getIndex
};

})(window,document);
