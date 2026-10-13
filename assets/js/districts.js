/* =========================================================
   UBnux District Manager
   File: assets/js/districts.js
   Version: 3.1.0
========================================================= */

(function (window, document) {

  "use strict";


  /* =========================================================
     STATE
  ========================================================= */

  const UBnuxState =
    window.UBnuxState ||
    {};

  const state =
    UBnuxState.state ||
    {};


  /* =========================================================
     ELEMENTS
  ========================================================= */

  const stateFilter =
    document.getElementById(
      "stateFilter"
    );


  const districtFilter =
    document.getElementById(
      "districtFilter"
    );


  /* =========================================================
     SAFE HELPERS
  ========================================================= */

  function clean(value) {

    return String(
      value == null
        ? ""
        : value
    ).trim();

  }


  function normalize(value) {

    return clean(value)
      .toLowerCase()
      .replace(
        /[\s_-]+/g,
        ""
      );

  }


  function normalizeSlug(value) {

    return clean(value)
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  }


  /* =========================================================
     CLEAR DISTRICTS
  ========================================================= */

  function clearDistricts() {

    if (!districtFilter) {
      return;
    }


    districtFilter.innerHTML =
      '<option value="">Select Your District</option>';


    districtFilter.disabled =
      true;


    state.districts =
      [];

  }


  /* =========================================================
     RENDER STATES
  ========================================================= */

  function renderStates(
    states
  ) {

    if (!stateFilter) {
      return;
    }


    state.states =
      Array.isArray(states)
        ? states
        : [];


    stateFilter.innerHTML =
      '<option value="">Select Your State</option>';


    state.states
      .forEach(function (item) {

        if (!item) {
          return;
        }


        const option =
          document.createElement(
            "option"
          );


        const stateCode =
          clean(
            item.StateCode ||
            item.stateCode ||
            item.Code
          );


        const stateName =
          clean(
            item.State ||
            item.StateName ||
            item.Name
          );


        const stateSlug =
          clean(
            item.StateSlug ||
            item.Slug ||
            item.slug
          );


        /*
         * Keep StateCode as the primary value.
         * Backend already supports StateCode.
         */

        option.value =
          stateCode;


        /*
         * Extra metadata for future use.
         */

        if (stateSlug) {

          option.dataset.slug =
            stateSlug;

        }


        if (stateName) {

          option.dataset.name =
            stateName;

        }


        option.textContent =
          stateName ||
          stateCode;


        stateFilter.appendChild(
          option
        );

      });


    stateFilter.disabled =
      state.states.length === 0;

  }


  /* =========================================================
     LOAD DISTRICTS
  ========================================================= */

  async function loadDistricts(
    stateCode
  ) {

    clearDistricts();


    state.selectedState =
      clean(stateCode);


    if (!stateCode) {
      return;
    }


    if (!districtFilter) {
      return;
    }


    districtFilter.innerHTML =
      '<option value="">Loading districts...</option>';


    districtFilter.disabled =
      true;


    try {

      if (
        !window.UBnuxAPI ||
        typeof window.UBnuxAPI.getDistricts !==
          "function"
      ) {

        throw new Error(
          "UBnuxAPI.getDistricts is not available"
        );

      }


      const response =
        await window.UBnuxAPI
          .getDistricts(
            stateCode
          );


      /*
       * Support all known API response formats.
       */

      let districts = [];


      if (
        response &&
        Array.isArray(
          response.data
        )
      ) {

        districts =
          response.data;

      } else if (
        response &&
        response.data &&
        Array.isArray(
          response.data.data
        )
      ) {

        districts =
          response.data.data;

      } else if (
        response &&
        Array.isArray(
          response.districts
        )
      ) {

        districts =
          response.districts;

      }


      state.districts =
        districts;


      districtFilter.innerHTML =
        '<option value="">Select Your District</option>';


      state.districts
        .forEach(function (item) {

          if (!item) {
            return;
          }


          const option =
            document.createElement(
              "option"
            );


          const districtCode =
            clean(
              item.DistrictCode ||
              item.districtCode
            );


          const districtName =
            clean(
              item.DistrictName ||
              item.districtName ||
              item.Name
            );


          const districtSlug =
            clean(
              item.Slug ||
              item.DistrictSlug ||
              item.slug ||
              normalizeSlug(
                districtName
              )
            );


          const districtID =
            clean(
              item.DistrictID ||
              item.districtID ||
              item.ID
            );


          /*
           * Primary value remains DistrictCode
           * because existing app flow uses it.
           */

          option.value =
            districtCode ||
            districtSlug ||
            districtID;


          /*
           * Store every useful identity.
           */

          option.dataset.code =
            districtCode;


          option.dataset.slug =
            districtSlug;


          option.dataset.id =
            districtID;


          option.dataset.name =
            districtName;


          option.textContent =
            districtName ||
            districtCode ||
            districtSlug;


          districtFilter.appendChild(
            option
          );

        });


      districtFilter.disabled =
        state.districts.length === 0;


    } catch (error) {

      console.error(
        "District loading error:",
        error
      );


      state.districts =
        [];


      districtFilter.innerHTML =
        '<option value="">Unable to load districts</option>';


      districtFilter.disabled =
        true;

    }

  }


  /* =========================================================
     GET DISTRICT
  ========================================================= */

  function findDistrict(
    value
  ) {

    const target =
      clean(value);


    if (!target) {
      return null;
    }


    const targetNormalized =
      normalize(target);


    const targetSlug =
      normalizeSlug(target);


    return (
      state.districts || []
    ).find(function (district) {

      if (!district) {
        return false;
      }


      const values = [

        district.DistrictCode,

        district.DistrictName,

        district.DistrictID,

        district.Slug,

        district.DistrictSlug,

        district.Code,

        district.Name

      ];


      return values.some(
        function (candidate) {

          if (!candidate) {
            return false;
          }


          const valueNormalized =
            normalize(candidate);


          const valueSlug =
            normalizeSlug(candidate);


          return (
            valueNormalized ===
              targetNormalized ||

            valueSlug ===
              targetSlug
          );

        }
      );

    }) || null;

  }


  /* =========================================================
     GET DISTRICT NAME
  ========================================================= */

  function getDistrictName(
    code
  ) {

    const item =
      findDistrict(
        code
      );


    return item
      ? clean(
          item.DistrictName ||
          item.districtName ||
          item.Name
        )
      : "";

  }


  /* =========================================================
     GET DISTRICT OBJECT
  ========================================================= */

  function getDistrict(
    value
  ) {

    return findDistrict(
      value
    );

  }


  /* =========================================================
     GET DISTRICT SLUG
  ========================================================= */

  function getDistrictSlug(
    value
  ) {

    const item =
      findDistrict(
        value
      );


    if (!item) {
      return "";
    }


    return clean(
      item.Slug ||
      item.DistrictSlug ||
      normalizeSlug(
        item.DistrictName
      )
    );

  }


  /* =========================================================
     GET DISTRICT CODE
  ========================================================= */

  function getDistrictCode(
    value
  ) {

    const item =
      findDistrict(
        value
      );


    if (!item) {
      return "";
    }


    return clean(
      item.DistrictCode ||
      item.districtCode
    );

  }


  /* =========================================================
     GET SELECTED DISTRICT
  ========================================================= */

  function getSelectedDistrict() {

    if (
      !districtFilter ||
      !districtFilter.value
    ) {

      return null;

    }


    return findDistrict(
      districtFilter.value
    );

  }


  /* =========================================================
     GET SELECTED STATE
  ========================================================= */

  function getSelectedState() {

    if (
      !stateFilter ||
      !stateFilter.value
    ) {

      return null;

    }


    const target =
      normalize(
        stateFilter.value
      );


    return (
      state.states || []
    ).find(function (item) {

      if (!item) {
        return false;
      }


      return [

        item.StateCode,

        item.State,

        item.StateName,

        item.StateSlug,

        item.Slug

      ].some(function (value) {

        return (
          normalize(value) ===
          target
        );

      });

    }) || null;

  }


  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.UBnuxDistricts = {

    renderStates,

    loadDistricts,

    getDistrictName,

    getDistrict,

    getDistrictSlug,

    getDistrictCode,

    getSelectedDistrict,

    getSelectedState,

    clearDistricts,

    findDistrict

  };


})(window, document);
