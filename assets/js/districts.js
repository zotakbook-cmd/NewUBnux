/* =========================================================
   UBnux District Manager
   File: assets/js/districts.js
   Version: 4.0.0

   STATIC-FIRST ARCHITECTURE
   ---------------------------------------------------------
   Primary source:
     /assets/data/districts.json

   API:
     Used ONLY when explicitly requested through
     refreshFromAPI().

   IMPORTANT:
   ---------------------------------------------------------
   - No API request during initial page load
   - No Google Sheets request during initial page load
   - District data is loaded from static JSON
   - State filtering happens locally
   - Existing application APIs remain compatible
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     VERSION / CONFIG
  ======================================================= */

  var VERSION = "4.0.0";

  var config = window.UBNUX_CONFIG || {};

  var STATIC_URL =
    config.DISTRICTS_JSON_URL ||
    "/assets/data/districts.json";


  /* =======================================================
     DOM
  ======================================================= */

  var districtFilter =
    document.getElementById("districtFilter");

  var stateFilter =
    document.getElementById("stateFilter");


  /* =======================================================
     INTERNAL STATE
  ======================================================= */

  var districts = [];

  var allDistricts = [];

  var staticLoaded = false;

  var staticLoadPromise = null;


  /* =======================================================
     HELPERS
  ======================================================= */

  function clean(value) {

    return value === null ||
           value === undefined
      ? ""
      : String(value).trim();

  }


  function slugify(value) {

    return clean(value)

      .toLowerCase()

      .replace(/&/g, " and ")

      .replace(/[^a-z0-9]+/g, "-")

      .replace(/^-+|-+$/g, "");

  }


  function identity(value) {

    return clean(value)
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  }


  /* =======================================================
     DISTRICT FIELD HELPERS
  ======================================================= */

  function getDistrictCode(item) {

    return clean(
      item && (
        item.DistrictCode ||
        item.districtCode ||
        item.Code ||
        item.code
      )
    );

  }


  function getDistrictID(item) {

    return clean(
      item && (
        item.DistrictID ||
        item.districtID ||
        item.id
      )
    );

  }


  function getDistrictName(item) {

    return clean(
      item && (
        item.DistrictName ||
        item.districtName ||
        item.Name ||
        item.name
      )
    );

  }


  function getDistrictSlug(item) {

    return slugify(
      item && (
        item.Slug ||
        item.DistrictSlug ||
        item.districtSlug ||
        getDistrictName(item)
      )
    );

  }


  /* =======================================================
     NORMALIZE DISTRICT
  ======================================================= */

  function normalizeItem(item) {

    item = item || {};

    var slug =
      getDistrictSlug(item);

    return Object.assign({}, item, {

      DistrictID:
        getDistrictID(item),

      DistrictName:
        getDistrictName(item),

      DistrictCode:
        getDistrictCode(item),

      Slug:
        slug,

      DistrictSlug:
        slug,

      StateCode:
        clean(
          item.StateCode ||
          item.stateCode ||
          ""
        ).toUpperCase(),

      State:
        clean(
          item.State ||
          item.StateName ||
          item.state ||
          ""
        )

    });

  }


  /* =======================================================
     RESPONSE NORMALIZER
     
     Supports:
       []
       { data: [] }
       { data: { districts: [] } }
       { districts: [] }
  ======================================================= */

  function extractRows(response) {

    if (Array.isArray(response)) {

      return response;

    }


    if (
      response &&
      Array.isArray(response.data)
    ) {

      return response.data;

    }


    if (
      response &&
      response.data &&
      Array.isArray(response.data.districts)
    ) {

      return response.data.districts;

    }


    if (
      response &&
      Array.isArray(response.districts)
    ) {

      return response.districts;

    }


    return [];

  }


  /* =======================================================
     STATE MATCH
  ======================================================= */

  function isSameState(item, stateInput) {

    var target =
      clean(stateInput);

    if (!target) {

      return true;

    }


    var candidates = [

      item.StateCode,

      item.State,

      item.StateName,

      item.StateSlug

    ];


    return candidates.some(
      function (candidate) {

        candidate =
          clean(candidate);

        if (!candidate) {

          return false;

        }


        return (

          slugify(candidate) ===
          slugify(target)

        ) || (

          identity(candidate) ===
          identity(target)

        );

      }
    );

  }


  /* =======================================================
     SORT
  ======================================================= */

  function sortDistricts(list) {

    return list.sort(
      function (a, b) {

        var ao =
          Number(a.SortOrder || 999999);

        var bo =
          Number(b.SortOrder || 999999);


        if (ao !== bo) {

          return ao - bo;

        }


        return getDistrictName(a)
          .localeCompare(
            getDistrictName(b)
          );

      }
    );

  }


  /* =======================================================
     FIND DISTRICT
  ======================================================= */

  function findDistrict(input) {

    var target =
      clean(input);

    if (!target) {

      return null;

    }


    var targetSlug =
      slugify(target);

    var targetIdentity =
      identity(target);


    return districts.find(
      function (item) {

        var candidates = [

          getDistrictCode(item),

          getDistrictID(item),

          getDistrictName(item),

          getDistrictSlug(item),

          item.DistrictSlug,

          item.Code,

          item.Name

        ];


        return candidates.some(
          function (candidate) {

            candidate =
              clean(candidate);

            if (!candidate) {

              return false;

            }


            return (

              slugify(candidate) ===
              targetSlug

            ) || (

              identity(candidate) ===
              targetIdentity

            );

          }
        );

      }
    ) || null;

  }


  /* =======================================================
     RENDER DISTRICT DROPDOWN
  ======================================================= */

  function render(list, stateCode) {

    if (!districtFilter) {

      return;

    }


    var current =
      clean(districtFilter.value);


    districtFilter.innerHTML = "";


    var placeholder =
      document.createElement("option");


    placeholder.value = "";

    placeholder.textContent =
      "Select District";


    districtFilter.appendChild(
      placeholder
    );


    list.forEach(
      function (raw) {

        var item =
          normalizeItem(raw);


        var option =
          document.createElement("option");


        option.value =
          getDistrictCode(item) ||
          getDistrictID(item) ||
          getDistrictSlug(item);


        option.textContent =
          getDistrictName(item) ||
          getDistrictCode(item);


        option.dataset.districtCode =
          getDistrictCode(item);


        option.dataset.districtId =
          getDistrictID(item);


        option.dataset.districtName =
          getDistrictName(item);


        option.dataset.slug =
          getDistrictSlug(item);


        option.dataset.stateCode =
          clean(
            item.StateCode ||
            stateCode
          ).toUpperCase();


        districtFilter.appendChild(
          option
        );

      }
    );


    if (current) {

      var match =
        findDistrict(current);


      if (match) {

        districtFilter.value =
          getDistrictCode(match) ||
          getDistrictID(match) ||
          getDistrictSlug(match);

      }

    }


    districtFilter.disabled =
      list.length === 0;

  }


  /* =======================================================
     LOAD STATIC DISTRICTS
     
     IMPORTANT:
     This is the PRIMARY loading method.
     
     Browser:
       /assets/data/districts.json

     No Apps Script call.
  ======================================================= */

  async function loadStaticDistricts() {

    if (staticLoaded) {

      return allDistricts.slice();

    }


    if (staticLoadPromise) {

      return staticLoadPromise;

    }


    staticLoadPromise =
      fetch(
        STATIC_URL,
        {
          method: "GET",
          cache: "force-cache",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json"
          }
        }
      )

      .then(
        function (response) {

          if (!response.ok) {

            throw new Error(
              "District JSON HTTP " +
              response.status
            );

          }


          return response.json();

        }
      )

      .then(
        function (response) {

          var rows =
            extractRows(response)


              .map(normalizeItem)


              .filter(
                function (item) {

                  /*
                   * Respect Active when supplied.
                   *
                   * If Active does not exist,
                   * keep the district.
                   */

                  if (
                    item.Active === undefined ||
                    item.Active === null ||
                    item.Active === ""
                  ) {

                    return true;

                  }


                  var value =
                    String(
                      item.Active
                    ).toLowerCase();


                  return !(
                    value === "false" ||
                    value === "0" ||
                    value === "no" ||
                    value === "inactive"
                  );

                }
              );


          sortDistricts(rows);


          allDistricts =
            rows.slice();


          districts =
            rows.slice();


          staticLoaded = true;


          /*
           * Also expose static data to
           * UBnuxState when available.
           */

          if (
            window.UBnuxState &&
            typeof window.UBnuxState.setDistricts ===
              "function"
          ) {

            window.UBnuxState.setDistricts(
              allDistricts
            );

          }


          return allDistricts.slice();

        }
      )

      .catch(
        function (error) {

          /*
           * Do NOT automatically call the API here.
           *
           * This is intentional.
           *
           * Static-first architecture means
           * homepage opening must remain API-free.
           */

          staticLoadPromise =
            null;


          console.error(
            "[UBnuxDistricts] Static district data failed:",
            error
          );


          throw error;

        }
      );


    return staticLoadPromise;

  }


  /* =======================================================
     LOAD DISTRICTS BY STATE
     
     Existing application API remains:
       loadDistricts(stateCode)

     But now it uses local static data.
  ======================================================= */

  async function loadDistricts(stateCode) {

    var key =
      identity(stateCode);


    if (!key) {

      clearDistricts();

      return [];

    }


    /*
     * Ensure static JSON is available.
     */

    await loadStaticDistricts();


    /*
     * Filter locally.
     */

    var rows =
      allDistricts
        .filter(
          function (item) {

            return isSameState(
              item,
              stateCode
            );

          }
        )
        .map(normalizeItem);


    sortDistricts(rows);


    districts =
      rows.slice();


    render(
      districts,
      stateCode
    );


    /*
     * Keep state manager synchronized.
     */

    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setDistricts ===
        "function"
    ) {

      window.UBnuxState.setDistricts(
        districts
      );

    }


    return districts.slice();

  }


  /* =======================================================
     EXPLICIT API REFRESH
     
     API is NOT used automatically.
     
     This method can be called by:
       Admin refresh
       Manual sync
       Debugging
       Future background update
  ======================================================= */

  async function refreshFromAPI(stateCode) {

    if (
      !window.UBnuxAPI ||
      typeof window.UBnuxAPI.getDistricts !==
        "function"
    ) {

      throw new Error(
        "UBnux API district method is not available."
      );

    }


    var response =
      await window.UBnuxAPI.getDistricts(
        stateCode || ""
      );


    var rows =
      extractRows(response)

        .map(normalizeItem)

        .filter(
          function (item) {

            return isSameState(
              item,
              stateCode
            );

          }
        );


    sortDistricts(rows);


    /*
     * If a state was requested,
     * update only that state.
     *
     * Otherwise replace complete data.
     */

    if (stateCode) {

      var target =
        clean(stateCode);


      allDistricts =
        allDistricts.filter(
          function (item) {

            return !isSameState(
              item,
              target
            );

          }
        );


      allDistricts =
        allDistricts.concat(rows);

      sortDistricts(allDistricts);

    } else {

      allDistricts =
        rows.slice();

    }


    staticLoaded = true;


    districts =
      stateCode
        ? rows.slice()
        : allDistricts.slice();


    render(
      districts,
      stateCode
    );


    if (
      window.UBnuxState &&
      typeof window.UBnuxState.setDistricts ===
        "function"
    ) {

      window.UBnuxState.setDistricts(
        districts
      );

    }


    return districts.slice();

  }


  /* =======================================================
     CLEAR
  ======================================================= */

  function clearDistricts() {

    districts = [];


    if (!districtFilter) {

      return;

    }


    districtFilter.innerHTML =
      "<option value=\"\">Select District</option>";


    districtFilter.value = "";

    districtFilter.disabled = true;

  }


  /* =======================================================
     GET SELECTED DISTRICT
  ======================================================= */

  function getSelectedDistrict() {

    if (!districtFilter) {

      return null;

    }


    return findDistrict(
      districtFilter.value
    );

  }


  /* =======================================================
     GET SELECTED STATE
  ======================================================= */

  function getSelectedState() {

    return stateFilter
      ? clean(stateFilter.value)
      : "";

  }


  /* =======================================================
     INITIAL STATIC PRELOAD
     
     IMPORTANT:
     Loading a small static JSON is allowed.
     
     It does NOT contact Apps Script.
  ======================================================= */

  function preload() {

    /*
     * Do not force an API request.
     *
     * Static JSON can be loaded quietly.
     */

    loadStaticDistricts()
      .catch(
        function () {

          /*
           * Keep homepage usable even if
           * district JSON is temporarily unavailable.
           *
           * We intentionally do not call API.
           */

        }
      );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.UBnuxDistricts = {

    VERSION: VERSION,


    state: {

      get districts() {

        return districts.slice();

      },

      get allDistricts() {

        return allDistricts.slice();

      },

      get staticLoaded() {

        return staticLoaded;

      }

    },


    loadDistricts:
      loadDistricts,


    loadStaticDistricts:
      loadStaticDistricts,


    refreshFromAPI:
      refreshFromAPI,


    clearDistricts:
      clearDistricts,


    findDistrict:
      findDistrict,


    getDistrict:
      findDistrict,


    getDistrictCode:
      function (input) {

        var item =
          typeof input === "object"
            ? input
            : findDistrict(input);


        return item
          ? getDistrictCode(item)
          : "";

      },


    getDistrictID:
      function (input) {

        var item =
          typeof input === "object"
            ? input
            : findDistrict(input);


        return item
          ? getDistrictID(item)
          : "";

      },


    getDistrictName:
      function (input) {

        var item =
          typeof input === "object"
            ? input
            : findDistrict(input);


        return item
          ? getDistrictName(item)
          : "";

      },


    getDistrictSlug:
      function (input) {

        var item =
          typeof input === "object"
            ? input
            : findDistrict(input);


        return item
          ? getDistrictSlug(item)
          : "";

      },


    getSelectedDistrict:
      getSelectedDistrict,


    getSelectedState:
      getSelectedState,


    getAll:
      function () {

        return districts.slice();

      },


    getAllDistricts:
      function () {

        return allDistricts.slice();

      }

  };


  /* =======================================================
     START STATIC LOAD
     
     This only fetches:
       /assets/data/districts.json
     
     It does NOT call Apps Script.
  ======================================================= */

  preload();


})(window, document);
