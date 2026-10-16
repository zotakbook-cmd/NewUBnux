/* UBnux Static JSON Cache Controller v5.0.0 */
(function(window){
  "use strict";
  var C=window.UBNUX_CONFIG||{};
  var manifestPromise=null;
  var jsonPromises={};
  function clean(v){return String(v==null?"":v).trim();}
  function withVersion(url, version){
    var sep=url.indexOf("?")>=0?"&":"?";
    return url+sep+"v="+encodeURIComponent(version||Date.now());
  }
  function fetchManifest(){
    if(manifestPromise) return manifestPromise;
    var u=(C.STATIC_DATA_MANIFEST_URL||"/assets/data/business-manifest.json")+"?__ubnux_manifest="+Date.now();
    manifestPromise=fetch(u,{cache:"no-cache",credentials:"same-origin",headers:{Accept:"application/json","Cache-Control":"no-cache"}})
      .then(function(r){if(!r.ok)throw new Error("Manifest HTTP "+r.status);return r.json();})
      .then(function(m){window.UBnuxDataVersion=clean(m.generatedAt||m.version)||String(Date.now());return m;})
      .catch(function(e){manifestPromise=null;window.UBnuxDataVersion=String(Date.now());return {generatedAt:window.UBnuxDataVersion,version:"fallback"};});
    return manifestPromise;
  }
  function getJSON(url, opts){
    opts=opts||{};
    var key=url+(opts.forceRefresh?"|force":"");
    if(!opts.forceRefresh && jsonPromises[key]) return jsonPromises[key];
    var p=fetchManifest().then(function(m){
      var v=clean(m.generatedAt||m.version)||window.UBnuxDataVersion||String(Date.now());
      var finalUrl=withVersion(url,v);
      return fetch(finalUrl,{cache:"no-cache",credentials:"same-origin",headers:{Accept:"application/json","Cache-Control":"no-cache"}})
        .then(function(r){if(!r.ok)throw new Error("Static JSON HTTP "+r.status+": "+url);return r.json();});
    });
    if(!opts.forceRefresh) jsonPromises[key]=p;
    return p;
  }
  function invalidate(){manifestPromise=null;Object.keys(jsonPromises).forEach(function(k){delete jsonPromises[k];});}
  window.UBnuxStaticCache={version:"5.0.0",getManifest:fetchManifest,getJSON:getJSON,invalidate:invalidate,versionedURL:function(url){return fetchManifest().then(function(m){return withVersion(url,clean(m.generatedAt||m.version)||Date.now());});}};
  window.UBnuxStaticCacheFixed=true;
})(window);
