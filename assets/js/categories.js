/* UBnux Categories v5.0.4 - robust static/API loader + safe dropdown */
(function (window, document) {
  "use strict";

  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function toArray(d) {
    if (Array.isArray(d)) return d;
    if (!d || typeof d !== "object") return [];
    return d.categories || d.data || d.items || d.results || [];
  }

  function categoryKey(c) {
    return clean(
      c && (
        c.Slug ||
        c.slug ||
        c.CategoryID ||
        c.categoryId ||
        c.id ||
        c.CategoryName ||
        c.name
      )
    );
  }

  function categoryName(c) {
    return clean(
      c && (
        c.CategoryName ||
        c.categoryName ||
        c.Name ||
        c.name
      )
    );
  }

  function isActive(c) {
    if (!c) return false;
    var v = c.Active;
    if (v === undefined) v = c.active;
    if (v === undefined || v === null || v === "") return true;
    return !(v === false || String(v).toLowerCase() === "false" || String(v) === "0");
  }

  function normalize(list) {
    var seen = Object.create(null);
    return toArray(list).filter(function (c) {
      if (!c || typeof c !== "object" || !isActive(c)) return false;
      var k = categoryKey(c).toLowerCase();
      if (!k || seen[k]) return false;
      seen[k] = true;
      return true;
    }).sort(function (a, b) {
      return (
        Number(a.SortOrder || a.sortOrder || 9999) -
        Number(b.SortOrder || b.sortOrder || 9999)
      ) || categoryName(a).localeCompare(categoryName(b));
    });
  }

  function setState(list) {
    if (window.UBnuxState && typeof window.UBnuxState.setCategories === "function") {
      try {
        window.UBnuxState.setCategories(list);
      } catch (e) {
        console.warn("UBnuxCategories: setCategories failed", e);
      }
    }
  }

  function setSelected(value, name) {
    var s = window.UBnuxState;

    if (s) {
      try {
        if (!s.state) s.state = {};
        s.state.selectedCategory = value;

        if (typeof s.setSelectedCategory === "function") {
          s.setSelectedCategory(value);
        }
      } catch (e) {
        console.warn("UBnuxCategories: state update failed", e);
      }
    }

    var text = document.getElementById("selectedCategoryText");
    if (text) text.textContent = name || "Select Category";
  }

  function closeDropdown() {
    var m = document.getElementById("categoryDropdownMenu");
    if (m) {
      m.classList.remove("open");
      m.setAttribute("aria-hidden", "true");
    }
  }

  function render(list) {
    var opts = document.getElementById("categoryOptions");
    var text = document.getElementById("selectedCategoryText");

    if (!opts) {
      console.warn("UBnuxCategories: #categoryOptions not found");
      return;
    }

    var categories = normalize(list);
    opts.innerHTML = "";

    if (!categories.length) {
      var empty = document.createElement("div");
      empty.className = "category-option-empty";
      empty.textContent = "No categories found";
      opts.appendChild(empty);
      if (text && !clean(text.textContent)) text.textContent = "Select Category";
      return;
    }

    categories.forEach(function (c) {
      var value = categoryKey(c);
      var name = categoryName(c) || value;
      var icon = clean(c.Icon || c.icon || "▦");

      var b = document.createElement("button");
      b.type = "button";
      b.className = "category-option";
      b.dataset.value = value;
      b.setAttribute("role", "option");

      var iconSpan = document.createElement("span");
      iconSpan.textContent = icon;

      var nameSpan = document.createElement("span");
      nameSpan.textContent = name;

      b.appendChild(iconSpan);
      b.appendChild(nameSpan);

      b.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        setSelected(value, name);
        closeDropdown();

        if (window.UBnuxApp && typeof window.UBnuxApp.applyFilters === "function") {
          try {
            window.UBnuxApp.applyFilters();
          } catch (err) {
            console.warn("UBnuxCategories: applyFilters failed", err);
          }
        } else if (window.UBnuxFilters && typeof window.UBnuxFilters.apply === "function") {
          try {
            window.UBnuxFilters.apply();
          } catch (err2) {
            console.warn("UBnuxCategories: filter apply failed", err2);
          }
        }
      });

      opts.appendChild(b);
    });
  }

  function fetchJSON(url) {
    return fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: { "Accept": "application/json" }
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (text) {
      if (/^\s*</.test(text)) {
        throw new Error("Expected JSON but received HTML");
      }
      return JSON.parse(text);
    });
  }

  function getStaticURL() {
    var cfg = window.UBNUX_CONFIG || {};
    return cfg.CATEGORIES_JSON_URL || "/assets/data/categories.json";
  }

  function load() {
    var url = getStaticURL();

    var promise;

    if (
      window.UBnuxStaticCache &&
      typeof window.UBnuxStaticCache.getJSON === "function"
    ) {
      promise = window.UBnuxStaticCache.getJSON(url);
    } else {
      promise = fetchJSON(url);
    }

    return promise.then(function (d) {
      var list = normalize(d);
      setState(list);
      render(list);
      return list;
    }).catch(function (err) {
      console.error("UBnuxCategories: categories load failed", err);

      /*
        Do not break the whole homepage if categories.json fails.
        Try the API only when the API module is actually available.
      */
      return refreshFromAPI().catch(function () {
        render([]);
        return [];
      });
    });
  }

  function refreshFromAPI() {
    if (
      !window.UBnuxAPI ||
      typeof window.UBnuxAPI.get !== "function"
    ) {
      return Promise.reject(new Error("UBnuxAPI.get is unavailable"));
    }

    return window.UBnuxAPI.get("categories", {}).then(function (r) {
      var list = normalize(r);
      setState(list);
      render(list);
      return list;
    });
  }

  window.UBnuxCategories = {
    load: load,
    render: render,
    refreshFromAPI: refreshFromAPI,
    get: function () {
      return window.UBnuxState &&
        Array.isArray(window.UBnuxState.categories)
        ? window.UBnuxState.categories
        : [];
    }
  };

})(window, document);
