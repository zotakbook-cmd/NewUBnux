(function(window,document){
  "use strict";
  const CONFIG={NAME:"restaurant",VERSION:"1.0.0"};
  let business=null,isInitialized=false,handlers=[],templateRoot=null;
  const FALLBACKS=[
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85"
  ];
  function qsa(s){return Array.prototype.slice.call((templateRoot||document).querySelectorAll(s));}
  function qs(s){return (templateRoot||document).querySelector(s);}
  function clean(v){return v===null||v===undefined?"":String(v).trim();}
  function first(){for(let i=0;i<arguments.length;i++){if(clean(arguments[i]))return arguments[i];}return "";}
  function normalize(){
    if(!business)business={};
    business.BusinessName=first(business.BusinessName,business.Name,"Restaurant");
    business.ShortDescription=first(business.ShortDescription,business.Description,"Good food, warm hospitality and memorable moments.");
    business.LongDescription=first(business.LongDescription,business.Description,business.ShortDescription);
    business.Rating=first(business.Rating,"—"); business.ReviewCount=first(business.ReviewCount,"0");
    business.OpeningTime=first(business.OpeningTime,"—"); business.ClosingTime=first(business.ClosingTime,"—");
    business.WorkingDays=first(business.WorkingDays,"—"); business.Address=first(business.Address,"Address not available");
    business.Area=first(business.Area,"Local Area"); business.Mobile=first(business.Mobile,business.Phone,"");
  }
  function bind(selector,value){qsa(selector).forEach(el=>{el.textContent=clean(value);});}
  function image(el,url,fallback){if(!el)return;const source=first(url,fallback);if(!source){el.style.display="none";return;}el.src=source;el.onerror=function(){if(fallback&&el.src!==fallback){el.src=fallback;}else{el.style.display="none";}};}
  function bindData(){
    normalize();
    bind("[data-business-name]",business.BusinessName);bind("[data-business-short-description]",business.ShortDescription);
    bind("[data-business-long-description]",business.LongDescription);bind("[data-business-address]",business.Address);bind("[data-business-area]",business.Area);
    bind("[data-business-mobile]",business.Mobile);bind("[data-business-owner]",first(business.OwnerName,"Restaurant Team"));bind("[data-business-opening-time]",business.OpeningTime);
    bind("[data-business-closing-time]",business.ClosingTime);bind("[data-business-working-days]",business.WorkingDays);bind("[data-business-rating]",business.Rating);bind("[data-business-review-count]",business.ReviewCount);
    bind("[data-business-established-year]",first(business.EstablishedYear,"—"));bind("[data-business-initial]",business.BusinessName.charAt(0).toUpperCase());
    qsa("[data-business-logo]").forEach(img=>{if(business.LogoURL){image(img,business.LogoURL,"");}else{img.style.display="none";}});
    image(qs("[data-hero-image]"),business.CoverURL,FALLBACKS[0]);
    image(qs("[data-about-image]"),business.CoverURL,FALLBACKS[1]);
    image(qs("[data-contact-image]"),business.CoverURL,FALLBACKS[0]);
    qsa("[data-gallery-image]").forEach((img,i)=>image(img,[business.CoverURL,business.LogoURL,FALLBACKS[(i+1)%FALLBACKS.length]][i],FALLBACKS[i]));
  }
  function setLinks(){
    const mobile=clean(business.WhatsApp||business.Mobile).replace(/\D/g,"");
    const phone=clean(business.Mobile).replace(/\D/g,"");
    qsa("[data-call]").forEach(a=>{if(phone)a.href="tel:"+phone;else a.href="#contact";});
    qsa("[data-whatsapp]").forEach(a=>{if(mobile)a.href="https://wa.me/"+mobile+"?text="+encodeURIComponent("Hello, I would like to enquire about "+business.BusinessName+".");else a.href="#contact";a.target="_blank";a.rel="noopener";});
    qsa("[data-website]").forEach(a=>{a.href=clean(business.WebsiteURL)||"#contact";if(business.WebsiteURL){a.target="_blank";a.rel="noopener";}});
    ["instagram","facebook","youtube"].forEach(name=>qsa("[data-"+name+"]").forEach(a=>{const url=clean(business[name.charAt(0).toUpperCase()+name.slice(1)+"URL"]);a.href=url||"#contact";if(url){a.target="_blank";a.rel="noopener";}}));
    qsa("[data-google-place]").forEach(a=>{const url=clean(business.GooglePlaceURL);a.href=url||"#contact";if(url){a.target="_blank";a.rel="noopener";}});
    qsa("[data-home-link]").forEach(a=>{a.href="#top";});
  }
  function setupMenu(){
    const button=qs(".restaurant-menu-btn"),menu=qs(".restaurant-mobile-nav"); if(!button||!menu)return;
    const toggle=function(){const open=menu.hidden;menu.hidden=!open;button.setAttribute("aria-expanded",String(open));};
    button.addEventListener("click",toggle);handlers.push([button,"click",toggle]);
    qsa(".restaurant-mobile-nav a").forEach(a=>{const fn=function(){menu.hidden=true;button.setAttribute("aria-expanded","false");};a.addEventListener("click",fn);handlers.push([a,"click",fn]);});
  }
  function setupYear(){const y=qs("#restaurantYear");if(y)y.textContent=new Date().getFullYear();}
  function init(options){
    templateRoot=document.querySelector('[data-ubnux-template-root="restaurant"]')||document;
    if(isInitialized)return {name:CONFIG.NAME,version:CONFIG.VERSION,business:business};
    business=(options&&options.business)||business||{};normalize();bindData();setLinks();setupMenu();setupYear();isInitialized=true;
    return {name:CONFIG.NAME,version:CONFIG.VERSION,business:business};
  }
  function destroy(){handlers.forEach(h=>{try{h[0].removeEventListener(h[1],h[2]);}catch(e){}});handlers=[];isInitialized=false;business=null;templateRoot=null;}
  window.UBnuxBusinessSite={name:CONFIG.NAME,version:CONFIG.VERSION,init:init,initialize:init,destroy:destroy,getBusiness:function(){return business;},getState:function(){return {initialized:isInitialized,version:CONFIG.VERSION,business:business};}};
})(window,document);
