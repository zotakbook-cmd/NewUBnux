/* =========================================================
   UBnux - Business Template Registry
   File:
   assets/js/seo/business/template-registry.js

   Version:
   1.0.0
   ========================================================= */

(function (window) {

  "use strict";


  var Root =
    window.UBnuxBusinessTemplates =
    window.UBnuxBusinessTemplates || {};


  var registry =
    {};


  var aliases =
    {};


  /* =======================================================
     REGISTER
     ======================================================= */

  function register(
    name,
    template
  ) {

    name =
      String(
        name || ""
      )
        .trim()
        .toLowerCase();


    if (!name) {

      throw new Error(
        "Business template name is required."
      );

    }


    if (
      !template ||
      typeof template.render !==
      "function"
    ) {

      throw new Error(
        "Business template must contain render()."
      );

    }


    registry[name] =
      template;

  }


  /* =======================================================
     ALIAS
     ======================================================= */

  function registerAlias(
    categorySlug,
    templateName
  ) {

    categorySlug =
      String(
        categorySlug || ""
      )
        .trim()
        .toLowerCase();


    templateName =
      String(
        templateName || ""
      )
        .trim()
        .toLowerCase();


    if (
      categorySlug &&
      templateName
    ) {

      aliases[categorySlug] =
        templateName;

    }

  }


  /* =======================================================
     RESOLVE TEMPLATE NAME
     ======================================================= */

  function resolveTemplateName(
    business,
    route
  ) {

    business =
      business || {};


    route =
      route || {};


    /*
       First priority:
       Sheet/API BusinessTemplate
    */

    var explicit =
      String(
        business.BusinessTemplate ||
        business.businessTemplate ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      explicit &&
      registry[explicit]
    ) {

      return explicit;

    }


    /*
       Second:
       category slug alias.
    */

    var categorySlug =
      String(
        business.CategorySlug ||
        business.categorySlug ||
        route.categorySlug ||
        ""
      )
        .trim()
        .toLowerCase();


    if (
      aliases[categorySlug]
    ) {

      return aliases[
        categorySlug
      ];

    }


    /*
       Direct template name match.
    */

    if (
      registry[
        categorySlug
      ]
    ) {

      return categorySlug;

    }


    return "default";

  }


  /* =======================================================
     GET TEMPLATE
     ======================================================= */

  function get(
    business,
    route
  ) {

    var templateName =
      resolveTemplateName(
        business,
        route
      );


    return (
      registry[
        templateName
      ] ||
      registry.default ||
      null
    );

  }


  /* =======================================================
     DEFAULT ALIASES
     ======================================================= */

  registerAlias(
    "restaurants",
    "restaurant"
  );

  registerAlias(
    "restaurant",
    "restaurant"
  );

  registerAlias(
    "food-and-restaurants",
    "restaurant"
  );

  registerAlias(
    "clothing-and-fashion",
    "clothing"
  );

  registerAlias(
    "fashion",
    "clothing"
  );

  registerAlias(
    "clothing",
    "clothing"
  );

  registerAlias(
    "hotels",
    "hotel"
  );

  registerAlias(
    "hotel",
    "hotel"
  );

  registerAlias(
    "salons",
    "salon"
  );

  registerAlias(
    "beauty-and-salon",
    "salon"
  );

  registerAlias(
    "beauty-salon",
    "salon"
  );

  registerAlias(
    "hospitals",
    "hospital"
  );

  registerAlias(
    "hospital",
    "hospital"
  );

  registerAlias(
    "healthcare",
    "hospital"
  );

  registerAlias(
    "coaching",
    "coaching"
  );

  registerAlias(
    "coaching-institute",
    "coaching"
  );

  registerAlias(
    "education",
    "coaching"
  );

  registerAlias(
    "real-estate",
    "realestate"
  );

  registerAlias(
    "property-dealers",
    "realestate"
  );

  registerAlias(
    "property",
    "realestate"
  );

  registerAlias(
    "automobile",
    "automobile"
  );

  registerAlias(
    "automobiles",
    "automobile"
  );

  registerAlias(
    "car-and-bike",
    "automobile"
  );

  registerAlias(
    "electronics",
    "electronics"
  );

  registerAlias(
    "electronics-and-mobile",
    "electronics"
  );

  registerAlias(
    "mobile-shops",
    "electronics"
  );

  registerAlias(
    "grocery",
    "grocery"
  );

  registerAlias(
    "grocery-stores",
    "grocery"
  );

  registerAlias(
    "general-store",
    "grocery"
  );

  registerAlias(
    "services",
    "service"
  );

  registerAlias(
    "professional-services",
    "service"
  );


  /* =======================================================
     EXPORT
     ======================================================= */

  Root.register =
    register;

  Root.registerAlias =
    registerAlias;

  Root.resolveTemplateName =
    resolveTemplateName;

  Root.get =
    get;

  Root.registry =
    registry;


})(window);
