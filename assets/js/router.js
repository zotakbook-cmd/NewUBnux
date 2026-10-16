/* UBnux Router v5.4.0 */
(function(window){"use strict";
  function clean(v){return String(v==null?"":v).trim();}
  function dec(v){try{return decodeURIComponent(clean(v));}catch(e){return clean(v);}}
  function parts(){return String(window.location.pathname||"/").split("/").filter(Boolean).map(dec).map(function(x){return x.toLowerCase();});}
  function isBusiness(){var p=parts();return p.length===5&&p[0]==="in"&&p[1]&&p[2]&&p[3]&&p[4];}
  function isDirectory(){var p=parts();return p[0]==="in"&&p.length>=2&&p.length<=4;}
  function directoryRoute(){var p=parts();return{state:p[1]||"",district:p[2]||"",category:p[3]||"",path:"/in/"+p.slice(1).join("/")+"/"};}
  function isSearchRoute(){var p=parts();return p[0]==="search"&&!!p[1];}
  function searchQuery(){var p=parts();return p[0]==="search"?p.slice(1).join(" "):"";}
  function getRoute(){var p=parts();if(isBusiness())return{type:"business",params:{state:p[1],district:p[2],category:p[3],slug:p[4]}};if(isDirectory())return{type:"directory",params:directoryRoute()};if(isSearchRoute())return{type:"search",query:searchQuery()};if(!p.length)return{type:"home",params:{}};return{type:"other",params:{}};}
  window.UBnuxRouter={version:"5.4.0",parts:parts,isBusinessRoute:isBusiness,isDirectoryRoute:isDirectory,directoryRoute:directoryRoute,isSearchRoute:isSearchRoute,searchQuery:searchQuery,getRoute:getRoute};
})(window);
