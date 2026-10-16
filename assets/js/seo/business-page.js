/* UBnux Business Page v5.1.1 Secure Static Detail - routed shell support */
(function(window, document){
  "use strict";

  var C = window.UBNUX_CONFIG || {};

  function esc(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function safeUrl(v){
    var s = String(v == null ? "" : v).trim();
    if(!s) return "";
    try{
      var u = new URL(s, window.location.origin);
      if(u.protocol === "http:" || u.protocol === "https:") return u.href;
    }catch(e){}
    return "";
  }

  function safeTel(v){
    var s = String(v == null ? "" : v).trim();
    if(!s) return "";
    return s.replace(/[^\d+]/g,"");
  }

  function safeWhatsApp(v){
    var n = String(v == null ? "" : v).replace(/\D/g,"");
    if(!n) return "";
    return "https://wa.me/" + n;
  }

  function route(){
    if(window.UBnuxRouter &&
       typeof window.UBnuxRouter.businessRoute === "function"){
      return window.UBnuxRouter.businessRoute();
    }
    var p=String(window.location.pathname||"/").split("?")[0].split("#")[0]
      .split("/").filter(Boolean).map(function(x){
        try{return decodeURIComponent(x).trim().toLowerCase();}
        catch(e){return String(x).trim().toLowerCase();}
      });
    return p.length===5 && p[0]==="in" ? {
      state:p[1],district:p[2],category:p[3],slug:p[4]
    } : null;
  }

  function el(id){ return document.getElementById(id); }

  function setVisible(root){
    if(root) root.hidden = false;
    var home = el("homePage");
    if(home) home.hidden = true;
  }

  function rows(x, key){
    if(Array.isArray(x)) return x;
    if(x && Array.isArray(x[key])) return x[key];

    if(x && Array.isArray(x.businesses)) return x.businesses;
    if(x && Array.isArray(x.results)) return x.results;
    if(x && Array.isArray(x.items)) return x.items;
    if(x && Array.isArray(x.data)) return x.data;

    return [];
  }

  function getDistrictSlug(x){
    return String(
      x && (x.slug || x.Slug || x.districtSlug || x.DistrictSlug ||
      x.district || x.District || "")
    ).trim().toLowerCase();
  }

  function getDistrictFile(x){
    return x && (x.file || x.File || x.url || x.URL ||
      x.dataFile || x.DataFile || x.businessFile || x.BusinessFile || "");
  }

  function getBusinessSlug(x){
    return String(
      x && (x.slug || x.Slug || x.businessSlug || x.BusinessSlug || "")
    ).trim().toLowerCase();
  }

  function getBusinessId(x){
    return String(
      x && (x.BusinessID || x.businessId || x.id || x.ID || "")
    ).trim();
  }

  function loadDistrictIndex(){
    if(!window.UBnuxStaticCache ||
       typeof window.UBnuxStaticCache.getJSON !== "function"){
      return Promise.reject(new Error("UBnuxStaticCache is unavailable."));
    }

    var url = C.DISTRICT_INDEX_JSON_URL || "/assets/data/district-index.json";

    return window.UBnuxStaticCache.getJSON(url).then(function(x){
      var list = rows(x,"districts");

      /* Also support an index shaped like:
         { data: { districts: [...] } } */
      if(!list.length && x && x.data && typeof x.data === "object"){
        list = rows(x.data,"districts");
      }

      return list;
    });
  }

  function findDistrict(ds, wanted){
    var key = String(wanted || "").trim().toLowerCase();

    return ds.find(function(x){
      return getDistrictSlug(x) === key;
    }) || ds.find(function(x){
      return String(x && (x.DistrictID || x.districtId || x.id || ""))
        .trim().toLowerCase() === key;
    }) || null;
  }

  function loadBusiness(r){
    return loadDistrictIndex().then(function(ds){
      var d = findDistrict(ds, r.district);

      if(!d){
        throw new Error("District data not found: " + r.district);
      }

      var file = getDistrictFile(d);
      if(!file){
        throw new Error("District business data file is missing.");
      }

      return window.UBnuxStaticCache.getJSON(file).then(function(x){
        var arr = rows(x,"businesses");
        var slug = String(r.slug || "").trim().toLowerCase();
        var b = arr.find(function(v){ return getBusinessSlug(v) === slug; });

        if(!b){
          b = arr.find(function(v){ return getBusinessId(v) === String(r.slug || "").trim(); });
        }

        if(b) return { business:b, district:d };

        /* Last-resort lookup from the compact global index. */
        var indexURL = C.BUSINESS_INDEX_JSON_URL || "/assets/data/business-index.json";
        return window.UBnuxStaticCache.getJSON(indexURL).then(function(ix){
          var all = rows(ix,"businesses");
          var found = all.find(function(v){
            var path = String(v && (v.SEOPath || v.seoPath || "")).trim().toLowerCase();
            return path === String(r.state + "/" + r.district + "/" + r.category + "/" + r.slug).replace(/^/, "/in/").replace(/\/$/, "") + "/" ||
              (getBusinessSlug(v) === slug && String(v && (v.DistrictSlug || v.districtSlug || "")).toLowerCase() === String(r.district).toLowerCase());
          });
          if(!found) throw new Error("Business not found in static district data.");
          return { business:found, district:d };
        });
      });
    });
  }

  function loadContact(r,b){
    if(!window.UBnuxAPI ||
       typeof window.UBnuxAPI.businessContact !== "function"){
      return Promise.resolve({});
    }

    return window.UBnuxAPI.businessContact({
      state:r.state,
      district:r.district,
      category:r.category,
      slug:r.slug,
      id:getBusinessId(b)
    }).then(function(x){
      return x && x.contact ? x.contact : {};
    }).catch(function(e){
      console.warn(
        "UBnux contact endpoint unavailable; public business details still shown.",
        e
      );
      return {};
    });
  }

  function render(ctx){
    var root = el("businessPageRoot");
    var content = el("businessPageContent");
    var b = ctx.business || {};
    var c = ctx.contact || {};

    setVisible(root);

    if(!content) return;

    var name =
      b.BusinessName || b.businessName || b.name || "Business";

    var desc =
      b.SEO_Description ||
      b.SEODescription ||
      b.ShortDescription ||
      b.short ||
      b.Description ||
      "";

    var title =
      b.SEO_Title ||
      b.SEOTitle ||
      name;

    document.title = title + " | UBnux";

    if(window.UBnuxSEOMeta &&
       typeof window.UBnuxSEOMeta.apply === "function"){
      window.UBnuxSEOMeta.apply({
        title:document.title,
        description:String(desc).slice(0,320),
        canonicalURL:window.location.origin + window.location.pathname
      });
    }

    if(window.UBnuxSchema &&
       typeof window.UBnuxSchema.render === "function"){
      try{
        window.UBnuxSchema.render(b);
      }catch(e){
        console.warn("UBnux schema render failed",e);
      }
    }

    var cover = safeUrl(b.CoverURL || b.coverURL || b.cover);
    var logo = safeUrl(b.LogoURL || b.logoURL || b.logo);
    var website = safeUrl(b.WebsiteURL || b.websiteURL || b.website);
    var tel = safeTel(c.mobile || c.phone || c.telephone);
    var wa = safeWhatsApp(c.whatsapp || c.whatsApp || c.mobile);
    var email = String(c.email || "").trim();

    var area = b.Area || b.area || "";
    var districtName =
      b.DistrictName || b.districtName || b.district || "";

    var address = b.Address || b.address || "";
    var rating = b.Rating || b.rating || "0";
    var reviews = b.ReviewCount || b.reviewCount || b.reviews || 0;
    var opening = b.OpeningTime || b.openingTime || "";
    var closing = b.ClosingTime || b.closingTime || "";

    var html =
      '<section class="ubnux-generic-business">' +

        '<div class="ubnux-business-cover">' +
          (cover
            ? '<img src="' + esc(cover) + '" alt="' + esc(name) + '" loading="eager">'
            : '') +
        '</div>' +

        '<div class="ubnux-business-inner">' +

          '<div class="ubnux-business-logo">' +
            (logo
              ? '<img src="' + esc(logo) + '" alt="' + esc(name) + ' logo" loading="lazy">'
              : '<span>UB</span>') +
          '</div>' +

          '<div class="ubnux-business-main">' +

            '<div class="ubnux-business-badges">' +
              ((b.Verified === true || b.verified === true)
                ? '<span>✓ Verified</span>' : '') +
              ((b.Featured === true || b.featured === true)
                ? '<span>Featured</span>' : '') +
            '</div>' +

            '<h1>' + esc(name) + '</h1>' +

            '<p class="ubnux-business-location">' +
              esc(area) +
              (districtName ? (area ? ', ' : '') + esc(districtName) : '') +
            '</p>' +

            '<p>' +
              esc(
                b.LongDescription ||
                b.longDescription ||
                b.Description ||
                b.ShortDescription ||
                b.short ||
                ""
              ) +
            '</p>' +

            '<div class="ubnux-business-actions">' +

              (tel
                ? '<a href="tel:' + esc(tel) + '">Call</a>'
                : '') +

              (wa
                ? '<a target="_blank" rel="noopener noreferrer" href="' +
                    esc(wa) + '">WhatsApp</a>'
                : '') +

              (email
                ? '<a href="mailto:' + esc(email) + '">Email</a>'
                : '') +

              (website
                ? '<a target="_blank" rel="noopener noreferrer" href="' +
                    esc(website) + '">Website</a>'
                : '') +

            '</div>' +

          '</div>' +
        '</div>' +

        '<div class="ubnux-business-info">' +

          '<div>' +
            '<strong>Address</strong>' +
            '<span>' + esc(address) + '</span>' +
          '</div>' +

          '<div>' +
            '<strong>Rating</strong>' +
            '<span>★ ' + esc(rating) +
              ' (' + esc(reviews) + ')</span>' +
          '</div>' +

          '<div>' +
            '<strong>Hours</strong>' +
            '<span>' + esc(opening) +
              (closing ? ' - ' + esc(closing) : '') +
            '</span>' +
          '</div>' +

        '</div>' +

      '</section>';

    content.innerHTML = html;
  }

  function showError(e){
    var root = el("businessPageRoot");
    var loader = el("businessPageLoader");
    var error = el("businessPageError");

    setVisible(root);

    if(error){
      error.hidden = false;
      error.textContent =
        (e && e.message) ||
        "Unable to load business details.";
    }

    console.error("UBnux business detail failed",e);

    if(loader) loader.hidden = true;
  }

  function init(){
    var r = route();
    if(!r) return;

    var globalLoader=el("pageLoader");
    if(globalLoader){
      globalLoader.classList.add("hidden");
      globalLoader.setAttribute("aria-hidden","true");
      globalLoader.style.opacity="0";
      globalLoader.style.visibility="hidden";
      globalLoader.style.pointerEvents="none";
    }
    var home=el("homePage");
    if(home) home.hidden=true;
    var root=el("businessPageRoot");
    if(root) root.hidden=false;

    var loader = el("businessPageLoader");
    var error = el("businessPageError");

    if(loader) loader.hidden = false;

    if(error){
      error.hidden = true;
      error.textContent = "";
    }

    loadBusiness(r)
      .then(function(x){
        return loadContact(r,x.business).then(function(ct){
          x.contact = ct;
          return x;
        });
      })
      .then(render)
      .catch(showError)
      .finally(function(){
        if(loader) loader.hidden = true;
      });
  }

  window.UBnuxBusinessPage = {
    version:"5.1.1",
    init:init,
    loadBusiness:loadBusiness,
    loadContact:loadContact
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }

})(window,document);