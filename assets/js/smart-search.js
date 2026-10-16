/* UBnux Smart Search v6.5.0
 * Entity-first search:
 * 1) District name -> complete district chunk
 * 2) Category name -> all matching businesses
 * 3) Business name -> exact/partial/fuzzy business matches
 * 4) District + Category -> complete district chunk filtered by exact category
 * 5) District + Business -> complete district chunk filtered by business
 * 6) Unknown keywords -> approximate all-field search
 */
(function(window, document){
  "use strict";

  var C = window.UBNUX_CONFIG || {};
  var state = {active:false, q:"", matches:[], intent:null};
  var indexPromise = null;
  var districtIndexPromise = null;
  var districtChunkCache = Object.create(null);
  var categoryPromise = null;

  function text(v){ return String(v == null ? "" : v).trim(); }
  function norm(v){
    return text(v).toLowerCase()
      .replace(/&/g," and ")
      .replace(/[^a-z0-9\u0900-\u097f]+/g," ")
      .replace(/\s+/g," ").trim();
  }
  function slug(v){ return norm(v).replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,""); }
  function tokens(v){ return norm(v).split(" ").filter(Boolean); }
  function first(o, keys){
    o = o || {};
    for(var i=0;i<keys.length;i++){
      if(o[keys[i]] != null && text(o[keys[i]]) !== "") return o[keys[i]];
    }
    return "";
  }
  function rows(x, key){
    if(Array.isArray(x)) return x;
    if(!x || typeof x !== "object") return [];
    if(key && Array.isArray(x[key])) return x[key];
    var keys = ["businesses","results","items","records","list","districts","categories"];
    for(var i=0;i<keys.length;i++){
      if(Array.isArray(x[keys[i]])) return x[keys[i]];
    }
    if(x.data){
      if(Array.isArray(x.data)) return x.data;
      if(typeof x.data === "object") {
        if(key && Array.isArray(x.data[key])) return x.data[key];
        for(var j=0;j<keys.length;j++) if(Array.isArray(x.data[keys[j]])) return x.data[keys[j]];
      }
    }
    if(x.payload && typeof x.payload === "object") return rows(x.payload,key);
    return [];
  }
  function unique(list){
    var seen=Object.create(null), out=[];
    (list||[]).forEach(function(b,i){
      if(!b || typeof b!=="object") return;
      var k=norm(first(b,["BusinessID","businessId","id","SEOPath","seoPath","Slug","slug","BusinessName","name"])) || ("_"+i);
      if(!seen[k]){ seen[k]=1; out.push(b); }
    });
    return out;
  }
  function fetchJSONDirect(url){
    var u=text(url);
    if(!u) return Promise.reject(Error("Empty JSON URL"));
    var sep=u.indexOf("?")>=0 ? "&" : "?";
    u=u+sep+"ubnux_cb="+Date.now();
    return fetch(u,{cache:"no-store",credentials:"same-origin",headers:{Accept:"application/json,text/plain,*/*"}}).then(function(r){
      return r.text().then(function(body){
        if(!r.ok) throw Error("HTTP "+r.status+" for "+url);
        var t=(body||"").trim();
        if(!t) throw Error("Empty response for "+url);
        if(/^<!doctype html/i.test(t) || /^<html/i.test(t) || t.charAt(0)==="<") {
          throw Error("HTML received instead of JSON for "+url);
        }
        try { return JSON.parse(t); }
        catch(e){ throw Error("Invalid JSON for "+url+": "+e.message); }
      });
    });
  }

  function rawGithubURL(fileOrSlug){
    var f=text(fileOrSlug);
    var ds="";
    var m=f.match(/\/businesses\/([^/?#]+)\.json/i);
    if(m) ds=slug(m[1]);
    if(!ds && /\.json(?:[?#].*)?$/i.test(f)) ds=slug(f.split("/").pop().split("?")[0].replace(/\.json$/i,""));
    if(!ds) ds=slug(f);
    if(!ds) return "";
    return "https://raw.githubusercontent.com/zotakbook-cmd/NewUBnux/main/assets/data/businesses/"+ds+".json";
  }

  function localDistrictURL(district){
    var ds=slug(districtDisplay(district)||districtName(district));
    return ds ? "/assets/data/businesses/"+ds+".json" : "";
  }

  function districtDataCandidates(district,file){
    var out=[];
    var raw=rawGithubURL(file || localDistrictURL(district));
    var local=localDistrictURL(district);
    if(raw) out.push(raw);                 // source-of-truth fallback first
    if(local) out.push(local);             // Cloudflare static copy
    var f=text(file);
    if(f){
      if(/^https?:\/\//i.test(f)) out.push(f);
      else {
        var u=f.replace(/^\/+/,"");
        if(u.indexOf("assets/")===0) out.push("/"+u);
        else if(u.indexOf("businesses/")===0) out.push("/assets/data/"+u);
        else out.push("/assets/data/"+u.replace(/^\.\//,""));
      }
    }
    return out.filter(function(v,i,a){return v && a.indexOf(v)===i;});
  }
  function getJSONRawFirst(url){
    return fetchJSONDirect(url).catch(function(firstErr){
      var raw=rawGithubURL(url);
      if(!raw) throw firstErr;
      return fetchJSONDirect(raw).catch(function(){ throw firstErr; });
    });
  }
  function getJSON(url){
    if(window.UBnuxStaticCache && typeof window.UBnuxStaticCache.getJSON==="function"){
      return window.UBnuxStaticCache.getJSON(url).catch(function(){
        return fetchJSONDirect(url);
      });
    }
    return fetchJSONDirect(url);
  }
  function indexURL(){ return C.BUSINESS_INDEX_JSON_URL || "/assets/data/business-index.json"; }
  function districtIndexURL(){ return C.DISTRICT_INDEX_JSON_URL || "/assets/data/district-index.json"; }
  function categoryURL(){ return C.CATEGORIES_JSON_URL || "/assets/data/categories.json"; }

  function loadIndex(){
    if(!indexPromise){
      indexPromise=getJSON(indexURL()).then(function(x){
        var a=unique(rows(x,"businesses"));
        if(!a.length) throw Error("business-index.json is empty");
        return a;
      });
    }
    return indexPromise;
  }

  function loadDistrictIndex(){
    if(!districtIndexPromise){
      districtIndexPromise=getJSON(districtIndexURL()).then(function(x){
        var a=rows(x,"districts");
        if(!a.length) throw Error("district-index.json contains no districts");
        return a;
      });
    }
    return districtIndexPromise;
  }

  function loadCategories(){
    if(!categoryPromise){
      categoryPromise=getJSON(categoryURL()).then(function(x){
        return rows(x,"categories");
      }).catch(function(){ return []; });
    }
    return categoryPromise;
  }

  function districtName(d){
    return norm(first(d,[
      "DistrictName","districtName","Name","name",
      "DistrictSlug","districtSlug","Slug","slug",
      "DistrictID","districtId","DistrictCode","districtCode","district"
    ]));
  }
  function districtDisplay(d){
    return text(first(d,["DistrictName","districtName","Name","name","DistrictSlug","districtSlug","Slug","slug"]));
  }
  function districtFile(d){
    return first(d,["file","File","dataFile","DataFile","businessFile","BusinessFile","url","URL"]);
  }
  function categoryName(c){
    return norm(first(c,[
      "CategoryName","categoryName","Name","name",
      "CategorySlug","categorySlug","Slug","slug",
      "CategoryID","categoryId","CategoryCode","categoryCode","category"
    ]));
  }
  function categoryDisplay(c){
    return text(first(c,["CategoryName","categoryName","Name","name","CategorySlug","categorySlug","Slug","slug"]));
  }
  function businessName(b){
    return norm(first(b,["BusinessName","businessName","name","Name","BusinessSlug","businessSlug","Slug","slug"]));
  }
  function businessFields(b){
    var vals=[];
    Object.keys(b||{}).forEach(function(k){
      var v=b[k];
      if(v==null) return;
      if(typeof v==="object"){ try{ vals.push(JSON.stringify(v)); }catch(e){} }
      else vals.push(String(v));
    });
    return norm(vals.join(" "));
  }
  function categoryOf(b){
    return norm(first(b,["CategoryName","categoryName","category","Category","CategorySlug","categorySlug","CategoryID","categoryId","CategoryCode","categoryCode"]));
  }
  function districtOf(b){
    return norm(first(b,["DistrictName","districtName","district","District","DistrictSlug","districtSlug","DistrictID","districtId","DistrictCode","districtCode"]));
  }
  function stateOf(b){
    return norm(first(b,["StateName","stateName","state","State","StateSlug","stateSlug","StateCode","stateCode"]));
  }

  function eqEntity(value, entity){
    value=norm(value); entity=norm(entity);
    return !!value && !!entity && (value===entity || slug(value)===slug(entity));
  }
  function containsEntity(value, entity){
    value=norm(value); entity=norm(entity);
    return !!value && !!entity && (value.indexOf(entity)>=0 || entity.indexOf(value)>=0);
  }

  function editDistance(a,b){
    a=norm(a); b=norm(b);
    if(a===b) return 0;
    if(!a||!b) return 999;
    var p=[],c=[],i,j;
    for(j=0;j<=b.length;j++) p[j]=j;
    for(i=1;i<=a.length;i++){
      c=[i];
      for(j=1;j<=b.length;j++){
        c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));
      }
      p=c;
    }
    return p[b.length];
  }
  function fuzzy(a,b){
    a=norm(a); b=norm(b);
    if(!a||!b) return 0;
    if(a===b) return 1000;
    if(a.indexOf(b)>=0 || b.indexOf(a)>=0) return 650;
    var d=editDistance(a,b);
    var lim=Math.max(1,Math.floor(Math.max(a.length,b.length)*0.30));
    return d<=lim ? 220 : 0;
  }

  /*
   * Entity recognition is done against MASTER district/category lists,
   * not against the compact business index. This is critical: a district
   * can have many businesses while only a subset may appear in the compact
   * index used for search.
   */
  function recognizeEntity(q, type){
    var ts=tokens(q), best=null, bestScore=0;
    if(type==="district"){
      return loadDistrictIndex().then(function(list){
        list.forEach(function(d){
          var name=districtName(d), display=districtDisplay(d), s=0, all=true;
          if(!name) return;
          var joined=norm(display+" "+name);
          ts.forEach(function(t){
            var z=fuzzy(t,joined);
            if(!z) all=false;
            s+=z;
          });
          if(norm(q)===name || norm(q)===slug(name)) s+=3000;
          if(ts.length===1 && name===ts[0]) s+=2500;
          if(all && s>bestScore){bestScore=s;best=d;}
        });
        return bestScore>=900 ? best : null;
      });
    }
    if(type==="category"){
      return loadCategories().then(function(list){
        list.forEach(function(c){
          var name=categoryName(c), display=categoryDisplay(c), s=0, all=true;
          if(!name) return;
          var joined=norm(display+" "+name);
          ts.forEach(function(t){
            var z=fuzzy(t,joined);
            if(!z) all=false;
            s+=z;
          });
          if(norm(q)===name || norm(q)===slug(name)) s+=3000;
          if(ts.length===1 && name===ts[0]) s+=2500;
          if(all && s>bestScore){bestScore=s;best=c;}
        });
        return bestScore>=900 ? best : null;
      });
    }
    return loadIndex().then(function(list){
      list.forEach(function(b){
        var name=businessName(b), s=0;
        if(!name) return;
        if(name===norm(q)) s=4000;
        else if(name.indexOf(norm(q))>=0) s=2200;
        else {
          tokens(q).forEach(function(t){ s+=fuzzy(t,name); });
        }
        if(s>bestScore){bestScore=s;best=b;}
      });
      return bestScore>=1200 ? best : null;
    });
  }

  function safeRecognize(q,type){
    return recognizeEntity(q,type).catch(function(e){
      console.warn("UBnux entity recognition skipped:",type,e);
      return null;
    });
  }

  function detectIntent(q){
    /* One broken/empty compact index must NEVER kill a valid district search. */
    return Promise.all([
      safeRecognize(q,"district"),
      safeRecognize(q,"category"),
      safeRecognize(q,"business")
    ]).then(function(x){
      return {district:x[0],category:x[1],business:x[2]};
    });
  }

  function businessMatches(b, wanted){
    if(!wanted) return true;
    var q=norm(wanted), n=businessName(b), h=businessFields(b);
    return n===q || n.indexOf(q)>=0 || h.indexOf(q)>=0;
  }
  function categoryMatches(b, c){
    if(!c) return true;
    var wanted=categoryName(c);
    return eqEntity(categoryOf(b),wanted) || containsEntity(categoryOf(b),wanted);
  }
  function districtMatches(b, d){
    if(!d) return true;
    var wanted=districtName(d);
    return eqEntity(districtOf(b),wanted) || containsEntity(districtOf(b),wanted);
  }

  function chunkURL(file, district){
    var candidates=[];
    var f=text(file);
    if(f){
      if(/^https?:\/\//i.test(f)) candidates.push(f);
      else {
        var u=f.replace(/^\/+/,"");
        if(u.indexOf("assets/data/")===0) candidates.push("/"+u);
        else if(u.indexOf("assets/")===0) candidates.push("/"+u);
        else if(u.indexOf("businesses/")===0) candidates.push("/assets/data/"+u);
        else candidates.push("/assets/data/"+u.replace(/^\.\//,""));
      }
    }
    var ds=slug(districtDisplay(district)||districtName(district));
    if(ds){
      candidates.push("/assets/data/businesses/"+ds+".json");
      candidates.push("/assets/data/"+ds+".json");
    }
    return candidates.filter(function(v,i,a){return v && a.indexOf(v)===i;});
  }

  function loadDistrictBySlug(stateSlug,districtSlug){
    var ds=slug(districtSlug);
    if(!ds) return Promise.resolve([]);
    return loadDistrictIndex().then(function(list){
      var rec=list.find(function(x){
        var xslug=slug(first(x,["slug","Slug","DistrictSlug","districtSlug","DistrictName","districtName"]));
        var xstate=slug(first(x,["stateSlug","StateSlug","StateName","stateName","State","state"]));
        return xslug===ds && (!stateSlug || !xstate || xstate===slug(stateSlug));
      });
      if(!rec){
        rec=list.find(function(x){ return slug(districtName(x))===ds || slug(districtDisplay(x))===ds; });
      }
      rec=rec || {DistrictName:districtSlug,Slug:ds,stateSlug:stateSlug,file:"/assets/data/businesses/"+ds+".json"};
      return loadDistrictChunk(rec);
    }).catch(function(e){
      console.warn("UBnux direct district index unavailable; loading source chunk",e);
      var pseudo={DistrictName:districtSlug,Slug:ds,stateSlug:stateSlug,file:"/assets/data/businesses/"+ds+".json"};
      return loadDistrictChunk(pseudo);
    });
  }
  function loadDistrictChunk(d){
    if(!d) return Promise.resolve([]);
    var files=districtDataCandidates(d,districtFile(d));
    if(!files.length) return Promise.resolve([]);
    var key=files.join("|");
    if(districtChunkCache[key]) return districtChunkCache[key];

    function tryOne(i){
      if(i>=files.length) return Promise.resolve([]);
      return fetchJSONDirect(files[i]).then(function(x){
        var a=unique(rows(x,"businesses"));
        if(a.length) return a;
        return tryOne(i+1);
      }).catch(function(err){
        console.warn("UBnux district source failed:",files[i],err.message||err);
        return tryOne(i+1);
      });
    }
    districtChunkCache[key]=tryOne(0).then(function(a){
      if(!a.length) console.error("UBnux: no district businesses loaded for",districtName(d),files);
      return a;
    });
    return districtChunkCache[key];
  }

  function rankGeneric(list,q){
    var nq=norm(q), ts=tokens(q);
    return unique(list.map(function(b){
      var h=businessFields(b), n=businessName(b), c=categoryOf(b), d=districtOf(b), s=stateOf(b), score=0, hit=0;
      ts.forEach(function(t){
        var z=0;
        if(n===t) z+=1800;
        else if(n.indexOf(t)>=0) z+=700;
        if(c===t) z+=900; else if(c.indexOf(t)>=0) z+=300;
        if(d===t) z+=850; else if(d.indexOf(t)>=0) z+=280;
        if(s===t) z+=700; else if(s.indexOf(t)>=0) z+=220;
        if(h.indexOf(t)>=0){z+=80;hit++;}
        if(z) score+=z;
      });
      if(h.indexOf(nq)>=0) score+=1000;
      if(hit===ts.length) score+=500;
      return {b:b,s:score};
    }).filter(function(x){return x.s>0;}).sort(function(a,b){
      return b.s-a.s || businessName(a.b).localeCompare(businessName(b.b));
    }).map(function(x){return x.b;}));
  }

  function pathFor(q,intent,list){
    var state="", district="", category="";

    /*
     * DISTRICT SEO MUST COME FROM THE DISTRICT MASTER RECORD.
     * Do not depend on the returned business list: the list can be empty
     * during the first render, and compact business-index.json can also be
     * incomplete by design.
     */
    if(intent && intent.district){
      district=districtName(intent.district);
      state=stateOf(intent.district);

      /* stateSlug is the authoritative SEO state when available. */
      if(!state){
        state=first(intent.district,[
          "StateName","stateName","State","state",
          "StateSlug","stateSlug","StateCode","stateCode"
        ]);
      }

      /* Last fallback: inspect a returned business only. */
      if(!state && Array.isArray(list)){
        var row=list.find(function(b){
          return districtMatches(b,intent.district);
        });
        if(row) state=stateOf(row);
      }
    }

    if(intent && intent.category) category=categoryName(intent.category);

    if(intent && intent.business && !district && !category){
      var b=intent.business;
      state=stateOf(b);
      district=districtOf(b);
      category=categoryOf(b);
      if(state&&district&&category&&businessName(b)){
        return "/in/"+slug(state)+"/"+slug(district)+"/"+slug(category)+"/"+slug(businessName(b))+"/";
      }
    }

    if(state&&district&&category) return "/in/"+slug(state)+"/"+slug(district)+"/"+slug(category)+"/";
    if(state&&district) return "/in/"+slug(state)+"/"+slug(district)+"/";
    if(state&&category) return "/in/"+slug(state)+"/all/"+slug(category)+"/";

    return "/search/"+slug(q)+"/";
  }

  function updateSEO(path,q){
    try{history.replaceState({ubnuxSearch:q},"",path);}catch(e){}
    var canonical=document.querySelector('link[rel="canonical"]');
    if(canonical) canonical.href=location.origin+path;
    document.title="UBnux Search - "+q;
    var meta=document.querySelector('meta[name="description"]');
    if(meta) meta.content="Search local businesses for "+q+" on UBnux.";
  }

  function render(list,q){
    state.matches=unique(list||[]);
    if(window.UBnuxBusinesses && typeof window.UBnuxBusinesses.render==="function"){
      window.UBnuxBusinesses.render(state.matches,state.matches.length);
    }
    var title=document.getElementById("businessSectionTitle");
    if(title) title.textContent='Search results for "'+q+'"';
    var msg=document.getElementById("selectionMessage");
    if(msg) msg.textContent=state.matches.length+" businesses found";
  }

  function directoryRoute(){
    var p=(location.pathname||"/").split("/").filter(Boolean).map(function(x){
      try{return decodeURIComponent(x).toLowerCase();}catch(e){return String(x).toLowerCase();}
    });
    if(p.length===3 && p[0]==="in") return {stateSlug:p[1],districtSlug:p[2]};
    if(p.length===4 && p[0]==="in") return {stateSlug:p[1],districtSlug:p[2],categorySlug:p[3]};
    return null;
  }

  function runDirectoryRoute(route,opts){
    opts=opts||{};
    var q=route.districtSlug.replace(/-/g," ");
    if(route.categorySlug) q += " "+route.categorySlug.replace(/-/g," ");
    var input=document.getElementById("ubnuxSmartSearchInput");
    if(input) input.value=q;
    return loadDistrictBySlug(route.stateSlug,route.districtSlug).then(function(full){
      var result=unique(full);
      if(route.categorySlug){
        var cs=slug(route.categorySlug);
        result=result.filter(function(b){
          return slug(first(b,["categorySlug","CategorySlug","categoryName","CategoryName","category","Category"],""))===cs;
        });
        if(!result.length){
          result=unique(full).filter(function(b){
            return slug(categoryOf(b))===cs || categoryOf(b).indexOf(norm(route.categorySlug.replace(/-/g," ")))>=0;
          });
        }
      }
      render(result,q);
      return result;
    }).catch(function(e){
      console.error("UBnux directory route failed:",e);
      render([],q);
      return [];
    });
  }

  function run(q,opts){
    opts=opts||{};
    q=text(q).replace(/\s+/g," ");
    var input=document.getElementById("ubnuxSmartSearchInput");
    if(input) input.value=q;
    if(!q){
      state.active=false; state.q=""; state.matches=[]; state.intent=null;
      render([],"");
      return Promise.resolve([]);
    }

    state.active=true; state.q=q;

    /* When init supplied a parsed SEO route, use the URL slugs directly.
       Do not depend on entity recognition or the compact business index. */
    if(opts.route && opts.route.districtSlug){
      return runDirectoryRoute(opts.route,{noHistory:true});
    }

    /* SEO directory URLs are authoritative. Load the exact district chunk
       directly instead of trying to infer the district from the compact
       business index. */
    if(opts.route && opts.route.districtSlug){
      return runDirectoryRoute(opts.route,opts);
    }

    return detectIntent(q).then(function(intent){
      state.intent=intent;

      /*
       * CASE 1: District keyword.
       * NEVER rank/filter the compact index for this case.
       * Load the complete district chunk and show every business in it.
       */
      if(intent.district){
        /*
         * QUICK SEARCH FIX: when a user searches from the homepage, the
         * browser URL is changed with history.replaceState only after the
         * data render. The homepage bootstrap can then run/apply filters
         * and overwrite that render with 0 results.
         *
         * The SEO directory route is already the authoritative data route,
         * and we know the exact district + state from the master record.
         * Navigate to it immediately. The normal SEO-route loader then
         * loads the complete district chunk exactly like a manual refresh.
         */
        if(!opts.noHistory && !opts.route){
          var districtPath=pathFor(q,intent,[]);
          if(/^\/in\//.test(districtPath)){
            try{
              window.location.assign(districtPath);
            }catch(navErr){
              console.error("UBnux district search navigation failed:",navErr);
            }
            return Promise.resolve([]);
          }
        }

        return loadDistrictChunk(intent.district).then(function(full){
          var result=unique(full);
          if(intent.category) result=result.filter(function(b){return categoryMatches(b,intent.category);});
          if(intent.business) result=result.filter(function(b){return businessMatches(b,intent.business);});
          if(!result.length){
            /* If chunk is unavailable, fall back to index but keep entity filtering. */
            return loadIndex().then(function(index){
              var fallback=index.filter(function(b){
                return districtMatches(b,intent.district) &&
                  categoryMatches(b,intent.category) &&
                  businessMatches(b,intent.business);
              });
              result=unique(fallback);
              render(result,q);
              if(!opts.noHistory) updateSEO(pathFor(q,intent,result),q);
              return result;
            });
          }
          render(result,q);
          if(!opts.noHistory) updateSEO(pathFor(q,intent,result),q);
          return result;
        });
      }

      /*
       * CASE 2: Category keyword.
       * Search the entire business index and keep ALL businesses whose
       * category matches the recognized category.
       */
      if(intent.category){
        return loadIndex().then(function(index){
          var result=index.filter(function(b){
            return categoryMatches(b,intent.category) &&
              businessMatches(b,intent.business);
          });
          result=unique(result);
          if(!result.length) result=rankGeneric(index,q);
          render(result,q);
          if(!opts.noHistory) updateSEO(pathFor(q,intent,result),q);
          return result;
        });
      }

      /*
       * CASE 3: Business name keyword.
       * Exact/partial/fuzzy business-name preference, then all-field fallback.
       */
      if(intent.business){
        return loadIndex().then(function(index){
          var qn=norm(q), result=index.filter(function(b){
            var n=businessName(b);
            return n===qn || n.indexOf(qn)>=0 || businessFields(b).indexOf(qn)>=0;
          });
          if(!result.length) result=rankGeneric(index,q);
          result=unique(result);
          render(result,q);
          if(!opts.noHistory) updateSEO(pathFor(q,intent,result),q);
          return result;
        });
      }

      /*
       * CASE 4: No recognized entity -> approximate/exact all-field search.
       */
      return loadIndex().then(function(index){
        var result=rankGeneric(index,q);
        render(result,q);
        if(!opts.noHistory) updateSEO(pathFor(q,intent,result),q);
        return result;
      });
    }).catch(function(e){
      console.error("UBnux Smart Search failed:",e);
      state.matches=[];
      render([],q);
      return [];
    });
  }

  function bind(){
    var form=document.getElementById("ubnuxSmartSearchForm");
    var input=document.getElementById("ubnuxSmartSearchInput");
    if(form && !form.dataset.ubnuxBound){
      form.dataset.ubnuxBound="1";
      form.addEventListener("submit",function(e){
        e.preventDefault(); e.stopImmediatePropagation();
        run(input?input.value:"");
        return false;
      },true);
    }
    document.querySelectorAll("[data-smart-query]").forEach(function(btn){
      if(btn.dataset.ubnuxBound) return;
      btn.dataset.ubnuxBound="1";
      btn.addEventListener("click",function(e){
        e.preventDefault(); e.stopImmediatePropagation();
        run(btn.getAttribute("data-smart-query") || btn.textContent || "");
        return false;
      },true);
    });
  }

  function init(){
    bind();
    setTimeout(bind,0);
    setTimeout(bind,250);

    try{
      var parts=(location.pathname||"/").split("/").filter(Boolean).map(function(x){
        try{return decodeURIComponent(x).toLowerCase();}catch(e){return x.toLowerCase();}
      });
      var q="", route=null;
      if(parts.length===2 && parts[0]==="search"){
        q=parts[1].replace(/-/g," ").trim();
      }else if(parts.length===3 && parts[0]==="in"){
        route={stateSlug:parts[1],districtSlug:parts[2]};
        q=parts[2].replace(/-/g," ").trim();
      }else if(parts.length===4 && parts[0]==="in"){
        route={stateSlug:parts[1],districtSlug:parts[2],categorySlug:parts[3]};
        q=(parts[2]+" "+parts[3]).replace(/-/g," ").trim();
      }
      if(q){
        var input=document.getElementById("ubnuxSmartSearchInput");
        if(input) input.value=q;
        /* App/bootstrap can still be loading. Repeat the authoritative route
           load after startup so a late homepage render cannot leave 0 results. */
        setTimeout(function(){ run(q,{noHistory:true,route:route}); },0);
        setTimeout(function(){ run(q,{noHistory:true,route:route}); },350);
        setTimeout(function(){ run(q,{noHistory:true,route:route}); },900);
      }
    }catch(e){
      console.warn("UBnux direct SEO search initialization failed",e);
    }
  }

  window.UBnuxSmartSearch={
    version:"6.6.0",
    state:state,
    init:init,
    bind:bind,
    search:run,
    run:run,
    loadIndex:loadIndex,
    getIndex:loadIndex,
    loadDistrictBySlug:loadDistrictBySlug,
    isDirectorySearchRoute:function(){
      var p=(location.pathname||"/").split("/").filter(Boolean);
      return (p.length===2 && p[0]==="search") || (p.length===3 && p[0]==="in") || (p.length===4 && p[0]==="in");
    }
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

})(window,document);
