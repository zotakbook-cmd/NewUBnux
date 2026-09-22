/**
 * Add these cases to your CURRENT Code.gs dispatcher.
 * Do not replace the whole current Code.gs.
 *
 * case "manager-login":          return jsonResponse(handleManagerLogin(params));
 * case "manager-logout":         return jsonResponse(handleManagerLogout(params));
 * case "manager-bootstrap":      return jsonResponse(handleManagerBootstrap(params));
 * case "manager-businesses":     return jsonResponse(handleManagerBusinesses(params));
 * case "manager-business":       return jsonResponse(handleManagerBusiness(params));
 * case "manager-save-business":  return jsonResponse(handleManagerSaveBusiness(params));
 * case "manager-delete-business":return jsonResponse(handleManagerDeleteBusiness(params));
 * case "manager-check-slug":     return jsonResponse(handleManagerCheckSlug(params));
 * case "business-slug":          return jsonResponse(handleBusinessByCustomSlug(params));
 */

function parseUBnuxPostPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try { return JSON.parse(e.postData.contents); }
  catch (error) { return {}; }
}

/**
 * Your current doPost(e) must parse JSON and pass it to the SAME dispatcher.
 * Example only:
 *
 * function doPost(e) {
 *   const params = parseUBnuxPostPayload_(e);
 *   return routeRequest_(params); // use YOUR current dispatcher function name
 * }
 */
