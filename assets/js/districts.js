/* =========================================================
   UBnux District Manager
   File: assets/js/districts.js
========================================================= */

(function (window, document) {

  "use strict";


  const state =
    window.UBnuxState.state;


  const stateFilter =
    document.getElementById(
      "stateFilter"
    );


  const districtFilter =
    document.getElementById(
      "districtFilter"
    );


  function clearDistricts() {

    districtFilter.innerHTML =
      '<option value="">Select Your District</option>';

    districtFilter.disabled =
      true;

  }


  function renderStates(
    states
  ) {

    state.states =
      Array.isArray(states)
        ? states
        : [];


    stateFilter.innerHTML =
      '<option value="">Select Your State</option>';


    state.states
      .forEach(function (item) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          item.StateCode;


        option.textContent =
          item.State;


        stateFilter.appendChild(
          option
        );

      });


    stateFilter.disabled =
      false;

  }


  async function loadDistricts(
    stateCode
  ) {

    clearDistricts();


    if (!stateCode) {

      return;

    }


    districtFilter.innerHTML =
      '<option value="">Loading districts...</option>';


    try {

      const response =
        await window.UBnuxAPI
          .getDistricts(
            stateCode
          );


      state.districts =
        Array.isArray(
          response.data
        )
          ? response.data
          : [];


      districtFilter.innerHTML =
        '<option value="">Select Your District</option>';


      state.districts
        .forEach(function (item) {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            item.DistrictCode;


          option.textContent =
            item.DistrictName;


          districtFilter.appendChild(
            option
          );

        });


      districtFilter.disabled =
        false;


    } catch (error) {

      console.error(
        "District loading error:",
        error
      );


      districtFilter.innerHTML =
        '<option value="">Unable to load districts</option>';


      districtFilter.disabled =
        true;

    }

  }


  function getDistrictName(
    code
  ) {

    const item =
      state.districts.find(
        function (district) {

          return String(
            district.DistrictCode
          ) === String(code);

        }
      );


    return item
      ? item.DistrictName
      : "";

  }


  window.UBnuxDistricts = {

    renderStates,

    loadDistricts,

    getDistrictName,

    clearDistricts

  };


})(window, document);