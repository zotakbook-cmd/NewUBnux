/* UBnux Router v5.1.0 */
(function(window){"use strict";
function clean(v){return String(v==null?"":v).trim();}
function dec(v){try{return decodeURIComponent(clean(v));}catch(e){return clean(v);}}
function parts(){return String(window.location.pathname||"/").split("/").map(dec).filter(Boolean).map(function(x){return x.toLowerCase();});}
function isBusiness(){var p=parts();return p.length===5&&p[0]==="in"&&!!p[1]&&!!p[2]&&!!p[3]&&!!p[4];}
function businessRoute(){if(!isBusiness())return null;var p=parts();return{state:p[1],district:p[2],category:p[3],slug:p[4],path:"/in/"+p[1]+"/"+p[2]+"/"+p[3]+"/"+p[4]+"/"};}
function isSearchRoute(){var p=parts();return p.length===1&&p[0]!=="in"&&!!p[0];}
function searchQuery(){return isSearchRoute()?parts()[0]:"";}
function isHome(){return parts().length===0;}
function getRoute(){if(isBusiness())return{type:"business",params:businessRoute()};if(isSearchRoute())return{type:"search",query:searchQuery()};if(isHome())return{type:"home",params:{}};return{type:"other",params:{}};}
window.UBnuxRouter={version:"5.1.0",parts:parts,isBusinessRoute:isBusiness,businessRoute:businessRoute,isSearchRoute:isSearchRoute,searchQuery:searchQuery,isHome:isHome,getRoute:getRoute};
})(window);
