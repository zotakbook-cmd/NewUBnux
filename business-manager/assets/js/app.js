/* =========================================================
   UBnux Business Manager
   File: assets/js/app.js
   Version: 3.0.0

   Responsibilities:
   - Application bootstrap
   - Login success handling
   - Session restore
   - Dashboard initialization
   - Navigation
   - Business loading
   - Logout
   - View management
   ========================================================= */

(function (window, document) {

  "use strict";


  /* =======================================================
     DEPENDENCIES
  ======================================================= */

  const Config =
    window.UBnuxManagerConfig;

  const Auth =
    window.UBnuxManagerAuth;

  const API =
    window.UBnuxManagerAPI;

  const Businesses =
    window.UBnuxBusinesses;

  const Dashboard =
    window.UBnuxDashboard;


  if (!Config) {

    console.error(
      "UBnux Manager: Config is missing."
    );

    return;

  }


  if (!Auth) {

    console.error(
      "UBnux Manager: Auth module is missing."
    );

    return;

  }


  if (!API) {

    console.error(
      "UBnux Manager: API module is missing."
    );

    return;

  }


  /* =======================================================
     STATE
  ======================================================= */

  const state = {

    initialized:
      false,

    booting:
      false,

    loggedIn:
      false,

    currentView:
      "dashboard",

    loadingBusinesses:
      false

  };


  /* =======================================================
     DOM
  ======================================================= */

  function el(
    id
  ) {

    return document.getElementById(
      id
    );

  }


  /* =======================================================
     LOG
  ======================================================= */

  function log(
    ...args
  ) {

    console.log(
      "[UBnux Manager]",
      ...args
    );

  }


  /* =======================================================
     TOAST
  ======================================================= */

  function toast(
    message,
    type
  ) {

    const host =
      el(
        "toastHost"
      );


    if (!host) {

      return;

    }


    const item =
      document.createElement(
        "div"
      );


    item.className =
      "toast " +
      (
        type ||
        "info"
      );


    item.textContent =
      String(
        message || ""
      );


    host.appendChild(
      item
    );


    requestAnimationFrame(
      function () {

        item.classList.add(
          "show"
        );

      }
    );


    setTimeout(
      function () {

        item.classList.remove(
          "show"
        );


        setTimeout(
          function () {

            item.remove();

          },
          250
        );

      },
      3000
    );

  }


  /* =======================================================
     SHOW LOGIN
  ======================================================= */

  function showLogin() {

    const loginView =
      el(
        "loginView"
      );

    const appView =
      el(
        "appView"
      );


    if (loginView) {

      loginView.hidden =
        false;

      loginView.style.display =
        "";

    }


    if (appView) {

      appView.hidden =
        true;

      appView.style.display =
        "none";

    }


    state.loggedIn =
      false;

  }


  /* =======================================================
     SHOW APP
  ======================================================= */

  function showApp() {

    const loginView =
      el(
        "loginView"
      );

    const appView =
      el(
        "appView"
      );


    if (loginView) {

      loginView.hidden =
        true;

      loginView.style.display =
        "none";

    }


    if (appView) {

      appView.hidden =
        false;

      appView.removeAttribute(
        "hidden"
      );

      appView.style.display =
        "";

    }


    state.loggedIn =
      true;


    log(
      "Application view displayed."
    );

  }


  /* =======================================================
     ADMIN INFO
  ======================================================= */

  function updateAdminInfo(
    user
  ) {

    user =
      user || {};


    const name =
      String(
        user.UserID ||
        user.userId ||
        user.Name ||
        user.name ||
        "Admin"
      ).trim();


    const role =
      String(
        user.Role ||
        user.role ||
        "Administrator"
      ).trim();


    const nameElement =
      el(
        "adminName"
      );


    const roleElement =
      el(
        "adminRole"
      );


    if (nameElement) {

      nameElement.textContent =
        name;

    }


    if (roleElement) {

      roleElement.textContent =
        role;

    }

  }


  /* =======================================================
     PAGE TITLE
  ======================================================= */

  const VIEW_META = {

    dashboard: {

      title:
        "Dashboard",

      subtitle:
        "UBnux marketplace overview"

    },


    businesses: {

      title:
        "Businesses",

      subtitle:
        "Search, edit and manage listings."

    },


    editor: {

      title:
        "Add Business",

      subtitle:
        "Create or update a UBnux business listing."

    }

  };


  function updatePageHeader(
    view
  ) {

    const meta =
      VIEW_META[
        view
      ] ||
      VIEW_META.dashboard;


    const title =
      el(
        "pageTitle"
      );


    const sub =
      el(
        "pageSub"
      );


    if (title) {

      title.textContent =
        meta.title;

    }


    if (sub) {

      sub.textContent =
        meta.subtitle;

    }

  }


  /* =======================================================
     SHOW VIEW
  ======================================================= */

  function showView(
    view
  ) {

    view =
      String(
        view || "dashboard"
      ).trim();


    const allowedViews = [

      "dashboard",
      "businesses",
      "editor"

    ];


    if (
      !allowedViews.includes(
        view
      )
    ) {

      view =
        "dashboard";

    }


    state.currentView =
      view;


    /*
     * Hide all views.
     */

    document
      .querySelectorAll(
        ".view"
      )
      .forEach(
        function (
          section
        ) {

          section.hidden =
            true;

          section.style.display =
            "none";

        }
      );


    /*
     * Show selected view.
     */

    const selected =
      el(
        "view-" +
        view
      );


    if (selected) {

      selected.hidden =
        false;

      selected.removeAttribute(
        "hidden"
      );

      selected.style.display =
        "";

    }


    /*
     * Navigation state.
     */

    document
      .querySelectorAll(
        ".nav-btn"
      )
      .forEach(
        function (
          button
        ) {

          const buttonView =
            button.getAttribute(
              "data-view"
            );


          button.classList.toggle(
            "active",
            buttonView ===
            view
          );

        }
      );


    updatePageHeader(
      view
    );


    /*
     * View-specific actions.
     */

    if (
      view ===
      "businesses"
    ) {

      if (
        Businesses &&
        typeof Businesses.loadBusinesses ===
        "function"
      ) {

        Businesses.loadBusinesses();

      }

    }


    if (
      view ===
      "dashboard"
    ) {

      if (
        Dashboard &&
        typeof Dashboard.refresh ===
        "function"
      ) {

        Dashboard.refresh();

      }

    }


    if (
      view ===
      "editor"
    ) {

      updatePageHeader(
        "editor"
      );

    }


    log(
      "View:",
      view
    );

  }


  /* =======================================================
     LOAD BUSINESSES
  ======================================================= */

  async function loadBusinesses() {

    if (!Businesses) {

      console.error(
        "UBnux Businesses module missing."
      );

      return null;

    }


    if (
      state.loadingBusinesses
    ) {

      return null;

    }


    state.loadingBusinesses =
      true;


    try {

      const response =
        await Businesses.loadBusinesses();


      if (
        !response ||
        response.success !==
        true
      ) {

        /*
         * Don't immediately logout here.
         * API errors should remain visible.
         */

        log(
          "Business loading failed:",
          response
        );


        return response;

      }


      /*
       * Dashboard gets updated automatically
       * through ubnux:businesses-loaded event.
       */

      if (
        Dashboard &&
        typeof Dashboard.refresh ===
        "function"
      ) {

        Dashboard.refresh();

      }


      return response;


    } catch (error) {

      console.error(
        "Business loading error:",
        error
      );


      toast(
        error.message ||
        "Unable to load businesses.",
        "error"
      );


      return {

        success:
          false,

        message:
          error.message

      };


    } finally {

      state.loadingBusinesses =
        false;

    }

  }


  /* =======================================================
     AFTER LOGIN
  ======================================================= */

  async function handleLoginSuccess(
    result
  ) {

    log(
      "Login successful:",
      result
    );


    /*
     * Determine logged-in user.
     */

    let user =
      null;


    if (
      result &&
      result.user
    ) {

      user =
        result.user;

    }


    if (!user) {

      user =
        Auth.getUser();

    }


    /*
     * IMPORTANT:
     * Show app immediately.
     */

    showApp();


    updateAdminInfo(
      user
    );


    /*
     * Start dashboard.
     */

    showView(
      "dashboard"
    );


    toast(
      "Login successful.",
      "success"
    );


    /*
     * Load business data.
     */

    await loadBusinesses();


    /*
     * Mark initialized.
     */

    state.initialized =
      true;


    log(
      "Manager initialized after login."
    );

  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {

    try {

      await Auth.logout();

    } catch (error) {

      console.warn(
        "Logout error:",
        error
      );

    }


    state.initialized =
      false;

    state.loggedIn =
      false;


    showLogin();


    /*
     * Reset editor if available.
     */

    if (
      Businesses &&
      typeof Businesses.resetForm ===
      "function"
    ) {

      Businesses.resetForm();

    }


    toast(
      "Logged out.",
      "success"
    );

  }


  /* =======================================================
     NAVIGATION BIND
  ======================================================= */

  function bindNavigation() {

    /*
     * Sidebar buttons
     */

    document
      .querySelectorAll(
        "[data-view]"
      )
      .forEach(
        function (
          element
        ) {

          if (
            element.dataset.ubnuxViewBound ===
            "true"
          ) {

            return;

          }


          element.dataset.ubnuxViewBound =
            "true";


          element.addEventListener(
            "click",
            function (
              event
            ) {

              /*
               * Only navigation elements.
               */

              const view =
                element.getAttribute(
                  "data-view"
                );


              if (!view) {

                return;

              }


              event.preventDefault();


              /*
               * Add Business button
               * should reset form.
               */

              if (
                view ===
                "editor"
              ) {

                if (
                  Businesses &&
                  typeof Businesses.resetForm ===
                  "function"
                ) {

                  Businesses.resetForm();

                }

              }


              showView(
                view
              );

            }
          );

        }
      );

  }


  /* =======================================================
     LOGOUT BIND
  ======================================================= */

  function bindLogout() {

    const button =
      el(
        "logoutBtn"
      );


    if (!button) {

      return;

    }


    if (
      button.dataset.ubnuxLogoutBound ===
      "true"
    ) {

      return;

    }


    button.dataset.ubnuxLogoutBound =
      "true";


    button.addEventListener(
      "click",
      function () {

        logout();

      }
    );

  }


  /* =======================================================
     AUTH EVENT
  ======================================================= */

  function bindAuthEvents() {

    window.addEventListener(
      "ubnux:auth",
      function (
        event
      ) {

        const detail =
          event &&
          event.detail
            ? event.detail
            : {};


        if (
          detail.type ===
          "login"
        ) {

          handleLoginSuccess(
            detail.data ||
            {}
          );

        }


        if (
          detail.type ===
          "logout"
        ) {

          showLogin();

        }

      }
    );

  }


  /* =======================================================
     RESTORE SESSION
  ======================================================= */

  async function restoreSession() {

    const token =
      Auth.getToken();


    if (!token) {

      showLogin();

      return false;

    }


    log(
      "Existing session found. Verifying..."
    );


    /*
     * Temporarily show login.
     * We switch to app only after verification.
     */

    showLogin();


    try {

      const result =
        await Auth.verifySession();


      if (
        !result ||
        result.success !==
        true
      ) {

        log(
          "Session invalid."
        );


        showLogin();

        return false;

      }


      const user =
        Auth.getUser();


      showApp();


      updateAdminInfo(
        user
      );


      state.loggedIn =
        true;


      showView(
        "dashboard"
      );


      await loadBusinesses();


      state.initialized =
        true;


      log(
        "Session restored successfully."
      );


      return true;


    } catch (error) {

      console.error(
        "Session restore failed:",
        error
      );


      Auth.clearSession();


      showLogin();


      return false;

    }

  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  async function initialize() {

    if (
      state.booting
    ) {

      return;

    }


    state.booting =
      true;


    log(
      "Starting Business Manager..."
    );


    /*
     * Make sure initial UI state is correct.
     */

    showLogin();


    bindNavigation();

    bindLogout();

    bindAuthEvents();


    /*
     * Auth.js already binds the login form.
     *
     * IMPORTANT:
     * Register our success callback before
     * user can submit the form.
     */

    Auth.onLoginSuccess =
      handleLoginSuccess;


    /*
     * Restore previous session.
     */

    await restoreSession();


    state.booting =
      false;


    log(
      "Business Manager ready."
    );

  }


  /* =======================================================
     PUBLIC API
  ======================================================= */

  window.UBnuxManagerApp = {

    version:
      "3.0.0",

    state:
      state,

    initialize:
      initialize,

    showLogin:
      showLogin,

    showApp:
      showApp,

    showView:
      showView,

    loadBusinesses:
      loadBusinesses,

    logout:
      logout,

    updateAdminInfo:
      updateAdminInfo

  };


  /*
   * Backward-compatible aliases.
   */

  window.UBnuxBusinessManager =
    window.UBnuxManagerApp;


  /* =======================================================
     START
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


  console.log(
    "UBnux Manager App v3.0.0 initialized."
  );


})(window, document);
