/* UBnux Districts v8.0.0 - independent dropdown data controller */
(function(window,document){"use strict";
  var list=[],byState=Object.create(null);
  function clean(v){return String(v==null?"":v).trim();}
  function norm(v){return clean(v).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
  function first(o,keys){o=o||{};for(var i=0;i<keys.length;i++)if(o[keys[i]]!=null&&clean(o[keys[i]])!=="")return o[keys[i]];return "";}
  function rows(x){if(Array.isArray(x))return x;if(!x||typeof x!=="object")return[];return Array.isArray(x.districts)?x.districts:Array.isArray(x.data)?x.data:Array.isArray(x.items)?x.items:Array.isArray(x.results)?x.results:[];}
  function stateOf(d){return norm(first(d,["State","state","StateName","stateName","StateSlug","stateSlug","StateCode","stateCode"]));}
  function idOf(d){return clean(first(d,["DistrictID","districtId","DistrictCode","districtCode","id","ID","Slug","slug"]));}
  function nameOf(d){return clean(first(d,["DistrictName","districtName","Name","name","Slug","slug"]));}
  function slugOf(d){return clean(first(d,["Slug","slug","DistrictSlug","districtSlug"]))||norm(nameOf(d));}
  function getJSON(url){if(window.UBnuxStaticCache&&typeof window.UBnuxStaticCache.getJSON==="function")return window.UBnuxStaticCache.getJSON(url).catch(function(){return fetch(url,{cache:"no-store",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();});});return fetch(url,{cache:"no-store",headers:{Accept:"application/json"}}).then(function(r){if(!r.ok)throw Error("HTTP "+r.status);return r.json();});}
  function clearDistricts(){var d=document.getElementById("districtFilter");if(!d)return;d.innerHTML='<option value="">All Districts</option>';d.disabled=true;}
  function render(stateValue){
    var d=document.getElementById("districtFilter");if(!d)return;
    var s=norm(stateValue),arr=byState[s]||[];
    d.innerHTML='<option value="">All Districts</option>';
    arr.filter(function(x){return x.Active!==false&&x.active!==false;}).sort(function(a,b){return Number(a.SortOrder||9999)-Number(b.SortOrder||9999)||nameOf(a).localeCompare(nameOf(b));}).forEach(function(x){var o=document.createElement("option");o.value=idOf(x);o.textContent=nameOf(x);o.dataset.slug=slugOf(x);d.appendChild(o);});
    d.disabled=!s;
  }
  function load(){
    var url=(window.UBNUX_CONFIG||{}).DISTRICTS_JSON_URL||"/assets/data/districts.json";
    return getJSON(url).then(function(x){list=rows(x);byState=Object.create(null);list.forEach(function(d){var s=stateOf(d);(byState[s]||(byState[s]=[])).push(d);});if(window.UBnuxState)window.UBnuxState.setDistricts(list);return list;});
  }
  function loadDistricts(stateValue){render(stateValue);return Promise.resolve(byState[norm(stateValue)]||[]);}
  function getDistrict(id){var v=clean(id).toLowerCase();return list.find(function(d){return clean(idOf(d)).toLowerCase()===v||norm(slugOf(d))===norm(v)||norm(nameOf(d))===norm(v);})||null;}
  function getDistrictName(id){var d=getDistrict(id);return d?nameOf(d):"";}
  function getDistrictSlug(id){var d=getDistrict(id);return d?slugOf(d):clean(id);}
  window.UBnuxDistricts={version:"7.0.0",load:load,loadDistricts:loadDistricts,render:render,clearDistricts:clearDistricts,getDistrict:getDistrict,getDistrictName:getDistrictName,getDistrictSlug:getDistrictSlug,getAll:function(){return list.slice();}};
})(window,document);
