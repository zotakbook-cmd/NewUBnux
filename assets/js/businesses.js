/* =========================================================
   UBnux Business Manager
   File: assets/js/businesses.js
========================================================= */

(function (window, document) {

  "use strict";


  const config =
    window.UBNUX_CONFIG;


  const state =
    window.UBnuxState.state;


  const grid =
    document.getElementById(
      "businessGrid"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  const loadMoreWrapper =
    document.getElementById(
      "loadMoreWrapper"
    );


  const loadMoreButton =
    document.getElementById(
      "loadMoreButton"
    );


  const summary =
    document.getElementById(
      "businessSummary"
    );


  function escapeHTML(
    value
  ) {

    return String(
      value || ""
    )

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }


  function imageOrPlaceholder(
    url,
    type
  ) {

    if (
      url &&
      String(url).trim()
    ) {

      return (
        '<img src="' +
        escapeHTML(url) +
        '" alt="" loading="lazy">'
      );

    }


    return (
      '<div style="' +
      'width:100%;height:100%;' +
      'display:flex;align-items:center;' +
      'justify-content:center;' +
      'font-size:32px;">' +
      (
        type === "logo"
          ? "🏪"
          : "🏢"
      ) +
      "</div>"
    );

  }


  function renderSkeletons() {

    emptyState.classList.add(
      "hidden"
    );


    loadMoreWrapper.classList.add(
      "hidden"
    );


    grid.innerHTML = "";


    for (
      let i = 0;
      i < 6;
      i++
    ) {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "skeleton-card";


      grid.appendChild(
        item
      );

    }

  }


  function renderBusinesses() {

    grid.innerHTML = "";


    if (
      !state.businesses.length
    ) {

      emptyState.classList.remove(
        "hidden"
      );

      loadMoreWrapper.classList.add(
        "hidden"
      );

      return;

    }


    emptyState.classList.add(
      "hidden"
    );


    state.businesses
      .forEach(function (business) {

        const card =
          document.createElement(
            "article"
          );


        card.className =
          "business-card";


        const rating =
          Number(
            business.Rating || 0
          );


        const verified =
          String(
            business.Verified || ""
          ).toLowerCase() ===
          "true";


        const featured =
          String(
            business.Featured || ""
          ).toLowerCase() ===
          "true";


        const location =
          [
            business.Area,
            business.Address
          ]

          .filter(Boolean)

          .join(", ");


        const businessUrl =
          "/business/" +
          encodeURIComponent(
            business.Slug ||
            business.BusinessID
          );


        card.innerHTML = `

          <div class="business-cover">

            ${imageOrPlaceholder(
              business.CoverURL,
              "cover"
            )}

          </div>


          <div class="business-body">

            ${
              featured
                ? `
                  <span class="featured-badge">
                    FEATURED
                  </span>
                `
                : ""
            }


            <div class="business-top">

              <div class="business-logo">

                ${imageOrPlaceholder(
                  business.LogoURL,
                  "logo"
                )}

              </div>


              <div>

                <h3 class="business-name">

                  ${escapeHTML(
                    business.BusinessName
                  )}

                </h3>


                <div class="business-area">

                  ${escapeHTML(
                    location
                  )}

                </div>

              </div>

            </div>


            <p class="business-description">

              ${escapeHTML(
                business.ShortDescription ||
                business.Description ||
                ""
              )}

            </p>


            <div class="business-meta">

              ${
                rating > 0
                  ? `
                    <span class="rating">
                      ★ ${rating.toFixed(1)}
                      ${
                        business.ReviewCount
                          ? `(${escapeHTML(
                              business.ReviewCount
                            )})`
                          : ""
                      }
                    </span>
                  `
                  : ""
              }


              ${
                verified
                  ? `
                    <span class="verified">
                      ✓ Verified
                    </span>
                  `
                  : ""
              }

            </div>

          </div>

        `;


        card.addEventListener(
          "click",
          function () {

            window.location.href =
              businessUrl;

          }
        );


        card.style.cursor =
          "pointer";


        grid.appendChild(
          card
        );

      });


    if (state.hasMore) {

      loadMoreWrapper.classList.remove(
        "hidden"
      );

    } else {

      loadMoreWrapper.classList.add(
        "hidden"
      );

    }


    summary.textContent =
      state.totalBusinesses +
      " business" +
      (
        state.totalBusinesses === 1
          ? ""
          : "es"
      ) +
      " found";

  }


  async function loadBusinesses(
    append
  ) {

    append =
      Boolean(append);


    if (
      !append
    ) {

      window.UBnuxState
        .resetBusinesses();

      renderSkeletons();

    }


    const selection =
      window.UBnuxState
        .getSelection();


    if (
      !selection.state ||
      !selection.district ||
      !selection.category
    ) {

      grid.innerHTML = "";

      emptyState.classList.add(
        "hidden"
      );

      loadMoreWrapper.classList.add(
        "hidden"
      );

      summary.textContent =
        "Select your location and category.";

      return;

    }


    if (append) {

      loadMoreButton.disabled =
        true;

      loadMoreButton.textContent =
        "Loading...";

    }


    try {

      const nextPage =
        append
          ? state.currentPage + 1
          : 1;


      const response =
        await window.UBnuxAPI
          .getBusinesses({

            state:
              selection.state,

            district:
              selection.district,

            category:
              selection.category,

            page:
              nextPage,

            limit:
              config.BUSINESS_PAGE_SIZE,

            sort:
              state.sort

          });


      const data =
        Array.isArray(
          response.businesses
        )
          ? response.businesses
          : [];


      if (append) {

        state.businesses =
          state.businesses.concat(
            data
          );

      } else {

        state.businesses =
          data;

      }


      state.currentPage =
        Number(
          response.page ||
          nextPage
        );


      state.totalBusinesses =
        Number(
          response.total ||
          state.businesses.length
        );


      state.hasMore =
        Boolean(
          response.hasMore
        );


      renderBusinesses();


    } catch (error) {

      console.error(
        "Business loading error:",
        error
      );


      grid.innerHTML = `

        <div class="empty-state">

          <div class="empty-icon">
            ⚠️
          </div>

          <h3>
            Unable to load businesses
          </h3>

          <p>
            Please try again.
          </p>

        </div>

      `;


      loadMoreWrapper.classList.add(
        "hidden"
      );

    } finally {

      loadMoreButton.disabled =
        false;

      loadMoreButton.textContent =
        "Load More";

    }

  }


  loadMoreButton.addEventListener(
    "click",
    function () {

      loadBusinesses(
        true
      );

    }
  );


  window.UBnuxBusinesses = {

    loadBusinesses,

    renderBusinesses,

    renderSkeletons

  };


})(window, document);