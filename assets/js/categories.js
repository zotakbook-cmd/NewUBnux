/* UBnux Categories v5.1.2 - stable dropdown + static/API fallback */
(function (window, document) {
  "use strict";

  function clean(v) {
    return String(v == null ? "" : v).trim();
  }

  function rows(x) {
    if (Array.isArray(x)) return x;
    if (!x || typeof x !== "object") return [];
    return (
      (Array.isArray(x.categories) && x.categories) ||
      (Array.isArray(x.data) && x.data) ||
      (Array.isArray(x.items) && x.items) ||
      (Array.isArray(x.results) && x.results) ||
      []
    );
  }

  function slug(v) {
    return clean(v).toLowerCase().replace(/\s+/g, "-");
  }

  function categoryValue(c) {
    c = c || {};
    return clean(
      c.Slug ||
      c.slug ||
      c.CategoryID ||
      c.categoryId ||
      c.ID ||
      c.id ||
      c.CategoryName ||
      c.name
    );
  }

  function categoryName(c) {
    c = c || {};
    return clean(
      c.CategoryName ||
      c.categoryName ||
      c.Name ||
      c.name ||
      c.Slug ||
      c.slug
    );
  }

  var categoriesCache = [];

  function categoryIcon(c) {
    c = c || {};
    return clean(c.Icon || c.icon || "▦");
  }

  function closeMenu() {
    var menu = document.getElementById("categoryDropdownMenu");
    var button = document.getElementById("categoryDropdownButton");

    if (!menu) return;

    menu.classList.remove("open");
    menu.hidden = true;
    menu.setAttribute("hidden", "");

    if (button) {
      button.setAttribute("aria-expanded", "false");
    }
  }

  function openMenu() {
    var menu = document.getElementById("categoryDropdownMenu");
    var button = document.getElementById("categoryDropdownButton");

    if (!menu) return;

    menu.hidden = false;
    menu.removeAttribute("hidden");
    menu.classList.add("open");

    if (button) {
      button.setAttribute("aria-expanded", "true");
    }
  }

  function setSelected(c) {
    var text = document.getElementById("selectedCategoryText");
    var icon = document.getElementById("selectedCategoryIcon");

    if (text) text.textContent = categoryName(c) || "Select Business Category";
    if (icon) icon.textContent = categoryIcon(c) || "🏪";
  }

  function render(list) {
    var opts = document.getElementById("categoryOptions");
    var search = document.getElementById("categorySearchInput");
    var empty = document.getElementById("categoryEmptyState");

    if (!opts) return;

    list = rows(list)
      .filter(function (x) {
        return x && x.Active !== false && x.active !== false;
      })
      .sort(function (a, b) {
        return (
          Number(a.SortOrder || a.sortOrder || 9999) -
            Number(b.SortOrder || b.sortOrder || 9999) ||
          categoryName(a).localeCompare(categoryName(b))
        );
      });

    categoriesCache = list.slice();
    opts.innerHTML = "";

    list.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "category-option";

      var icon = document.createElement("span");
      icon.textContent = categoryIcon(c);

      var label = document.createElement("span");
      label.textContent = categoryName(c);

      b.appendChild(icon);
      b.appendChild(label);

      b.dataset.value = categoryValue(c);

      b.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if (window.UBnuxState && window.UBnuxState.state) {
          window.UBnuxState.state.selectedCategory = b.dataset.value;
          if (!window.UBnuxState.state.selected) {
            window.UBnuxState.state.selected = {};
          }
          window.UBnuxState.state.selected.category = b.dataset.value;
          window.UBnuxState.state.selected.categoryName = categoryName(c);
        }

        setSelected(c);
        closeMenu();

        if (search) search.value = "";

        opts.querySelectorAll(".category-option").forEach(function (x) {
          x.hidden = false;
        });

        if (empty) empty.hidden = true;

        if (
          window.UBnuxApp &&
          typeof window.UBnuxApp.applyFilters === "function"
        ) {
          window.UBnuxApp.applyFilters();
        }
      });

      opts.appendChild(b);
    });

    if (search && !search.dataset.ubnuxBound) {
      search.dataset.ubnuxBound = "1";

      search.addEventListener("input", function () {
        var q = clean(search.value).toLowerCase();
        var visible = 0;

        opts.querySelectorAll(".category-option").forEach(function (x) {
          var show =
            !q ||
            clean(x.textContent).toLowerCase().indexOf(q) !== -1;

          x.hidden = !show;
          if (show) visible++;
        });

        if (empty) empty.hidden = visible !== 0;
      });

      search.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });
    }

    var selected = null;
    var selectedValue =
      window.UBnuxState &&
      window.UBnuxState.state
        ? clean(window.UBnuxState.state.selectedCategory)
        : "";

    if (selectedValue) {
      selected = list.find(function (c) {
        return (
          clean(categoryValue(c)).toLowerCase() ===
          selectedValue.toLowerCase()
        );
      });
    }

    if (selected) {
      setSelected(selected);
    }
  }

  function getJSON(url) {
    if (
      window.UBnuxStaticCache &&
      typeof window.UBnuxStaticCache.getJSON === "function"
    ) {
      return window.UBnuxStaticCache.getJSON(url);
    }

    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Category data HTTP " + r.status);
      return r.json();
    });
  }

  function load() {
    var cfg = window.UBNUX_CONFIG || {};
    var url = cfg.CATEGORIES_JSON_URL || "/assets/data/categories.json";

    return getJSON(url).then(function (data) {
      var list = rows(data);

      if (window.UBnuxState && typeof window.UBnuxState.setCategories === "function") {
        window.UBnuxState.setCategories(list);
      }

      render(list);
      return list;
    });
  }

  function setEnabled(enabled) {
    var button = document.getElementById("categoryDropdownButton");
    if (button) button.disabled = enabled === false;
  }

  function clearCategory() {
    if (window.UBnuxState && window.UBnuxState.state) {
      window.UBnuxState.state.selectedCategory = "";
      if (!window.UBnuxState.state.selected) {
        window.UBnuxState.state.selected = {};
      }
      window.UBnuxState.state.selected.category = "";
      window.UBnuxState.state.selected.categoryName = "";
    }
    setSelected(null);
    closeMenu();
  }

  function setCategory(value) {
    var target = clean(value).toLowerCase();
    if (!target) {
      clearCategory();
      return true;
    }

    var item = categoriesCache.find(function(c) {
      return clean(categoryValue(c)).toLowerCase() === target ||
             clean(categoryName(c)).toLowerCase() === target;
    });

    if (!item) return false;

    if (window.UBnuxState && window.UBnuxState.state) {
      window.UBnuxState.state.selectedCategory = categoryValue(item);
      if (!window.UBnuxState.state.selected) window.UBnuxState.state.selected = {};
      window.UBnuxState.state.selected.category = categoryValue(item);
      window.UBnuxState.state.selected.categoryName = categoryName(item);
    }
    setSelected(item);
    return true;
  }

  function getCategoryName(value) {
    var target = clean(value).toLowerCase();
    var item = categoriesCache.find(function(c) {
      return clean(categoryValue(c)).toLowerCase() === target ||
             clean(categoryName(c)).toLowerCase() === target;
    });
    return item ? categoryName(item) : "";
  }

  function refreshFromAPI() {
    if (
      !window.UBnuxAPI ||
      typeof window.UBnuxAPI.get !== "function"
    ) {
      return Promise.reject(new Error("UBnuxAPI.get unavailable"));
    }

    return window.UBnuxAPI.get("categories", {}).then(function (r) {
      var list = rows(r);

      if (window.UBnuxState && typeof window.UBnuxState.setCategories === "function") {
        window.UBnuxState.setCategories(list);
      }

      render(list);
      return list;
    });
  }

  /* One delegated global handler; does not fight app.js. */
  document.addEventListener("click", function (ev) {
    var button = document.getElementById("categoryDropdownButton");
    var dropdown = document.getElementById("categoryDropdown");
    var menu = document.getElementById("categoryDropdownMenu");

    if (!button || !dropdown || !menu) return;

    if (button.contains(ev.target)) return;

    if (!dropdown.contains(ev.target)) {
      closeMenu();
    }
  });

  window.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeMenu();
  });

  window.UBnuxCategories = {
    load: load,
    render: render,
    open: openMenu,
    close: closeMenu,
    refreshFromAPI: refreshFromAPI,
    setEnabled: setEnabled,
    clearCategory: clearCategory,
    setCategory: setCategory,
    getCategoryName: getCategoryName
  };
})(window, document);
