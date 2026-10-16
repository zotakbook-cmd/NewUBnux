/* UBnux State v7.0.0 */
(function(window){"use strict";
  var state={states:[],districts:[],categories:[],selected:{state:"",district:"",category:"",stateName:"",districtName:"",categoryName:""},selectedCategory:"",sort:"featured"};
  window.UBnuxState={state:state,setStates:function(x){state.states=Array.isArray(x)?x:[];},setDistricts:function(x){state.districts=Array.isArray(x)?x:[];},setCategories:function(x){state.categories=Array.isArray(x)?x:[];},resetBusinesses:function(){},get:function(){return state;}};
})(window);
