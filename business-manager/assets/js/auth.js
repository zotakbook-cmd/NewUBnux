/* =========================================================
   UBnux Business Manager Authentication
   File: assets/js/auth.js
   Version: 2.0.0

   Responsibilities:
   - Login
   - Logout
   - Session storage
   - Session validation
   - Login form handling
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  /* =======================================================
     CONFIG
  ======================================================= */

  const Config =
    window.UBnuxManagerConfig;


  const API =
    window.UBnuxManagerAPI;


  if (!Config) {

    console.error(
      "UBnuxManagerConfig is not available."
    );

    return;

  }


  if (!API) {

    console.error(
      "UBnuxManagerAPI is not available."
    );

    return;

  }


  /* =======================================================
     AUTH OBJECT
  ======================================================= */

  const Auth = {};


  /* =======================================================
     SAVE SESSION
  ======================================================= */

  function saveSession(
    session
  ) {

    if (!session) {

      return false;

    }


    try {

      localStorage.setItem(
        Config.SESSION_KEY,
        JSON.stringify(
          session
        )
      );


      return true;

    } catch (error) {

      console.error(
        "Unable to save manager session:",
        error
      );


      return false;

    }

  }


  /* =======================================================
     GET SESSION
  ======================================================= */

  function getSession() {

    try {

      const raw =
        localStorage.getItem(
          Config.SESSION_KEY
        );


      if (!raw) {

        return null;

      }


      const session =
        JSON.parse(
          raw
        );


      if (
        !session ||
        typeof session !== "object"
      ) {

        return null;

      }


      return session;

    } catch (error) {

      clearSession();

      return null;

    }

  }


  /* =======================================================
     CLEAR SESSION
  ======================================================= */

  function clearSession() {

    try {

      localStorage.removeItem(
        Config.SESSION_KEY
      );

    } catch (error) {

      console.warn(
        "Unable to clear session:",
        error
      );

    }

  }


  /* =======================================================
     GET SESSION TOKEN
  ======================================================= */

  function getToken() {

    const session =
      getSession();


    if (!session) {

      return "";

    }


    return String(

      session.sessionToken ||

      session.token ||

      session.SessionToken ||

      ""

    ).trim();

  }


  /* =======================================================
     GET USER
  ======================================================= */

  function getUser() {

    const session =
      getSession();


    if (!session) {

      return null;

    }


    return (
      session.user ||
      session.admin ||
      null
    );

  }


  /* =======================================================
     LOGIN
  ======================================================= */

  async function login(
    userId,
    password
  ) {

    userId =
      String(
        userId || ""
      ).trim();


    password =
      String(
        password || ""
      );


    if (!userId) {

      return {

        success:
          false,

        message:
          "User ID is required."

      };

    }


    if (!password) {

      return {

        success:
          false,

        message:
          "Password is required."

      };

    }


    if (
      Auth._loggingIn
    ) {

      return {

        success:
          false,

        message:
          "Login request is already in progress."

      };

    }


    Auth._loggingIn =
      true;


    try {

      console.log(
        "UBnux Manager login:",
        userId
      );


      const response =
        await API.login(
          userId,
          password
        );


      console.log(
        "UBnux Manager login response:",
        response
      );


      if (
        !response ||
        response.success !== true
      ) {

        return {

          success:
            false,

          message:
            response &&
            response.message
              ? response.message
              : "Invalid User ID or password.",

          data:
            response || null

        };

      }


      /*
       * Save complete server response.
       */

      saveSession(
        response
      );


      /*
       * Notify app.
       */

      dispatchAuthEvent(
        "login",
        response
      );


      return response;


    } catch (error) {

      console.error(
        "Manager login error:",
        error
      );


      return {

        success:
          false,

        message:
          error &&
          error.message
            ? error.message
            : "Login failed."

      };


    } finally {

      Auth._loggingIn =
        false;

    }

  }


  /* =======================================================
     LOGOUT
  ======================================================= */

  async function logout() {

    const token =
      getToken();


    try {

      if (token) {

        await API.logout(
          token
        );

      }

    } catch (error) {

      console.warn(
        "Server logout failed:",
        error
      );

    }


    clearSession();


    dispatchAuthEvent(
      "logout",
      null
    );


    return {

      success:
        true

    };

  }


  /* =======================================================
     VERIFY SESSION
  ======================================================= */

  async function verifySession() {

    const token =
      getToken();


    if (!token) {

      return {

        success:
          false,

        authenticated:
          false,

        message:
          "No active session."

      };

    }


    try {

      const response =
        await API.bootstrap(
          token
        );


      console.log(
        "UBnux session response:",
        response
      );


      if (
        !response ||
        response.success !== true
      ) {

        clearSession();


        dispatchAuthEvent(
          "session-expired",
          response
        );


        return {

          success:
            false,

          authenticated:
            false,

          message:
            response &&
            response.message
              ? response.message
              : "Session expired."

        };

      }


      const currentSession =
        getSession() || {};


      const updatedSession =
        Object.assign(
          {},
          currentSession,
          response
        );


      saveSession(
        updatedSession
      );


      dispatchAuthEvent(
        "session-valid",
        updatedSession
      );


      return {

        success:
          true,

        authenticated:
          true,

        data:
          updatedSession

      };


    } catch (error) {

      console.error(
        "Session verification error:",
        error
      );


      return {

        success:
          false,

        authenticated:
          false,

        message:
          error &&
          error.message
            ? error.message
            : "Session verification failed."

      };

    }

  }


  /* =======================================================
     AUTH EVENT
  ======================================================= */

  function dispatchAuthEvent(
    type,
    data
  ) {

    try {

      window.dispatchEvent(

        new CustomEvent(
          "ubnux:auth",
          {

            detail: {

              type:
                type,

              data:
                data

            }

          }

        )

      );

    } catch (error) {

      console.warn(
        "Unable to dispatch auth event.",
        error
      );

    }

  }


  /* =======================================================
     LOGIN FORM
  ======================================================= */

  function bindLoginForm(
    form
  ) {

    if (!form) {

      return;

    }


    if (
      form.dataset.ubnuxAuthBound ===
      "true"
    ) {

      return;

    }


    form.dataset.ubnuxAuthBound =
      "true";


    form.addEventListener(
      "submit",
      async function (
        event
      ) {

        event.preventDefault();


        const userInput =
          form.querySelector(
            '[name="userId"],' +
            '[name="userid"],' +
            '[name="username"],' +
            '#userId,' +
            '#username'
          );


        const passwordInput =
          form.querySelector(
            '[name="password"],' +
            '#password'
          );


        const submitButton =
          form.querySelector(
            'button[type="submit"],' +
            'input[type="submit"]'
          );


        const messageElement =
          form.querySelector(
            '[data-login-message],' +
            '.login-message,' +
            '#loginMessage'
          );


        const userId =
          userInput
            ? userInput.value
            : "";


        const password =
          passwordInput
            ? passwordInput.value
            : "";


        if (submitButton) {

          submitButton.disabled =
            true;


          submitButton.dataset
            .originalText =
              submitButton.textContent;


          submitButton.textContent =
            "Signing in...";

        }


        if (messageElement) {

          messageElement.textContent =
            "Signing in...";

          messageElement.className =
            "login-message";

        }


        try {

          const result =
            await login(
              userId,
              password
            );


          if (
            result &&
            result.success === true
          ) {

            if (messageElement) {

              messageElement.textContent =
                "Login successful.";

              messageElement.className =
                "login-message success";

            }


            /*
             * app.js can handle
             * dashboard navigation.
             */

            if (
              typeof Auth.onLoginSuccess ===
              "function"
            ) {

              Auth.onLoginSuccess(
                result
              );

            }

          } else {

            if (messageElement) {

              messageElement.textContent =
                result &&
                result.message
                  ? result.message
                  : "Login failed.";

              messageElement.className =
                "login-message error";

            }

          }


        } catch (error) {

          console.error(
            "Login form error:",
            error
          );


          if (messageElement) {

            messageElement.textContent =
              "Unable to login. Please try again.";

            messageElement.className =
              "login-message error";

          }

        } finally {

          if (submitButton) {

            submitButton.disabled =
              false;


            submitButton.textContent =
              submitButton.dataset
                .originalText ||
              "Login";

          }

        }

      }
    );

  }


  /* =======================================================
     BIND ALL LOGIN FORMS
  ======================================================= */

  function bindLoginForms() {

    const forms =
      document.querySelectorAll(
        'form[data-login-form],' +
        '#loginForm,' +
        '.login-form'
      );


    forms.forEach(
      function (form) {

        bindLoginForm(
          form
        );

      }
    );

  }


  /* =======================================================
     EXPORT
  ======================================================= */

  Auth.login =
    login;

  Auth.logout =
    logout;

  Auth.getSession =
    getSession;

  Auth.getToken =
    getToken;

  Auth.getUser =
    getUser;

  Auth.isLoggedIn =
    function () {

      return !!getToken();

    };

  Auth.verifySession =
    verifySession;

  Auth.clearSession =
    clearSession;

  Auth.saveSession =
    saveSession;

  Auth.bindLoginForm =
    bindLoginForm;

  Auth.bindLoginForms =
    bindLoginForms;


  /*
   * app.js can assign this callback.
   */

  Auth.onLoginSuccess =
    null;


  /* =======================================================
     GLOBAL EXPORT
  ======================================================= */

  window.UBnuxManagerAuth =
    Auth;

  window.UBnuxAuth =
    Auth;


  console.log(
    "UBnux Manager Auth v2.0.0 initialized."
  );


  /* =======================================================
     DOM READY
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      bindLoginForms
    );

  } else {

    bindLoginForms();

  }


})(window, document);
