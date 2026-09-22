/* =========================================================
   UBnux Business Manager Authentication
   File: auth.js
   Version: 2.1.0
   ========================================================= */

(function (
  window,
  document
) {

  "use strict";


  const Config =
    window.UBnuxManagerConfig;

  const API =
    window.UBnuxManagerAPI;


  if (!Config || !API) {

    console.error(
      "UBnux authentication dependencies are missing."
    );

    return;

  }


  const Auth = {

    _loggingIn:
      false,

    onLoginSuccess:
      null

  };


  /* =======================================================
     SESSION
  ======================================================= */

  function saveSession(
    session
  ) {

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
        "Session save failed:",
        error
      );

      return false;

    }

  }


  function getSession() {

    try {

      const raw =
        localStorage.getItem(
          Config.SESSION_KEY
        );


      if (!raw) {

        return null;

      }


      return JSON.parse(
        raw
      );

    } catch (error) {

      clearSession();

      return null;

    }

  }


  function clearSession() {

    localStorage.removeItem(
      Config.SESSION_KEY
    );

  }


  function getToken() {

    const session =
      getSession();


    if (!session) {

      return "";

    }


    return String(
      session.sessionToken ||
      session.token ||
      ""
    ).trim();

  }


  function getUser() {

    const session =
      getSession();


    return session
      ? (
          session.user ||
          session.admin ||
          null
        )
      : null;

  }


  function isLoggedIn() {

    return !!getToken();

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

        code:
          "USER_ID_REQUIRED",

        message:
          "User ID is required."

      };

    }


    if (!password) {

      return {

        success:
          false,

        code:
          "PASSWORD_REQUIRED",

        message:
          "Password is required."

      };

    }


    if (Auth._loggingIn) {

      return {

        success:
          false,

        code:
          "LOGIN_IN_PROGRESS",

        message:
          "Login request is already in progress."

      };

    }


    Auth._loggingIn =
      true;


    try {

      console.log(
        "UBnux login request:",
        userId
      );


      const response =
        await API.login(
          userId,
          password
        );


      console.log(
        "UBnux login response:",
        response
      );


      if (
        !response
      ) {

        return {

          success:
            false,

          code:
            "EMPTY_RESPONSE",

          message:
            "No response received from API."

        };

      }


      /*
       * HTML response
       */

      if (
        response.code ===
        "HTML_RESPONSE"
      ) {

        return {

          success:
            false,

          code:
            "API_HTML_RESPONSE",

          message:
            "Business Manager API returned an HTML page. Please check the Cloudflare → Apps Script connection."

        };

      }


      /*
       * Invalid JSON
       */

      if (
        response.code ===
        "INVALID_JSON"
      ) {

        return {

          success:
            false,

          code:
            "API_INVALID_JSON",

          message:
            "Business Manager API returned invalid JSON."

        };

      }


      /*
       * Network error
       */

      if (
        response.code ===
        "NETWORK_ERROR"
      ) {

        return {

          success:
            false,

          code:
            "NETWORK_ERROR",

          message:
            "Unable to connect to Business Manager API."

        };

      }


      /*
       * Actual backend credential error
       */

      if (
        response.success !==
        true
      ) {

        return {

          success:
            false,

          code:
            response.code ||
            "LOGIN_FAILED",

          message:
            response.message ||
            "Login failed.",

          data:
            response

        };

      }


      /*
       * Successful login
       */

      if (
        !response.sessionToken
      ) {

        return {

          success:
            false,

          code:
            "NO_SESSION_TOKEN",

          message:
            "Login succeeded but no session token was returned."

        };

      }


      saveSession(
        response
      );


      dispatchAuthEvent(
        "login",
        response
      );


      return response;


    } catch (error) {

      console.error(
        "UBnux login error:",
        error
      );


      return {

        success:
          false,

        code:
          "LOGIN_EXCEPTION",

        message:
          error.message ||
          "Login failed."

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
        "Logout API error:",
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
     VERIFY
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


    const response =
      await API.bootstrap(
        token
      );


    if (
      !response ||
      response.success !==
      true
    ) {

      clearSession();


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


    const oldSession =
      getSession() || {};


    saveSession(

      Object.assign(
        {},
        oldSession,
        response
      )

    );


    return {

      success:
        true,

      authenticated:
        true

    };

  }


  /* =======================================================
     EVENTS
  ======================================================= */

  function dispatchAuthEvent(
    type,
    data
  ) {

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
            "#loginUserId, [name='userId']"
          );


        const passwordInput =
          form.querySelector(
            "#loginPassword, [name='password']"
          );


        const button =
          document.getElementById(
            "loginBtn"
          );


        const message =
          document.getElementById(
            "loginMessage"
          );


        const userId =
          userInput
            ? userInput.value
            : "";


        const password =
          passwordInput
            ? passwordInput.value
            : "";


        if (button) {

          button.disabled =
            true;

          button.textContent =
            "Signing in...";

        }


        if (message) {

          message.textContent =
            "Signing in...";

          message.className =
            "message";

        }


        try {

          const result =
            await login(
              userId,
              password
            );


          if (
            result.success ===
            true
          ) {

            if (message) {

              message.textContent =
                "Login successful.";

              message.className =
                "message success";

            }


            if (
              typeof Auth.onLoginSuccess ===
              "function"
            ) {

              Auth.onLoginSuccess(
                result
              );

            }


            return;

          }


          if (message) {

            message.textContent =
              result.message ||
              "Login failed.";

            message.className =
              "message error";

          }


        } catch (error) {

          console.error(
            "Login form error:",
            error
          );


          if (message) {

            message.textContent =
              error.message ||
              "Login failed.";

            message.className =
              "message error";

          }

        } finally {

          if (button) {

            button.disabled =
              false;

            button.textContent =
              "Sign In";

          }

        }

      }
    );

  }


  function bindLoginForms() {

    document
      .querySelectorAll(
        "#loginForm, [data-login-form]"
      )
      .forEach(
        bindLoginForm
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
    isLoggedIn;

  Auth.verifySession =
    verifySession;

  Auth.saveSession =
    saveSession;

  Auth.clearSession =
    clearSession;

  Auth.bindLoginForm =
    bindLoginForm;

  Auth.bindLoginForms =
    bindLoginForms;


  window.UBnuxManagerAuth =
    Auth;

  window.UBnuxAuth =
    Auth;


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


  console.log(
    "UBnux Manager Auth v2.1.0 initialized."
  );


})(window, document);
