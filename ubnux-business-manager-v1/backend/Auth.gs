const UBNUX_MANAGER_AUTH = {
  ADMIN_SHEET:"00_Admins",
  SESSION_PREFIX:"UBNUX_MANAGER_SESSION_",
  SESSION_SECONDS:21600
};

function handleManagerLogin(payload) {
  payload = payload || {};
  const userId = String(payload.userId||"").trim().toLowerCase();
  const password = String(payload.password||"");
  if (!userId || !password) return {success:false,message:"User ID and password are required."};

  const admins = getSheetData(UBNUX_MANAGER_AUTH.ADMIN_SHEET);
  const passwordHash = hashUBnuxPassword_(password);
  let admin = null;
  for (let i=0;i<admins.length;i++) {
    const r = admins[i];
    const active = String(r.Active||"").trim().toLowerCase();
    if (["false","no","0"].includes(active)) continue;
    if (String(r.UserID||"").trim().toLowerCase()===userId && String(r.PasswordHash||"").trim()===passwordHash) {
      admin = r; break;
    }
  }
  if (!admin) return {success:false,message:"Invalid User ID or password."};

  const token = Utilities.getUuid().replace(/-/g,"") + Utilities.getUuid().replace(/-/g,"");
  const session = {UserID:admin.UserID,Name:admin.Name,Role:admin.Role||"Administrator",Email:admin.Email||"",createdAt:new Date().toISOString()};
  CacheService.getScriptCache().put(UBNUX_MANAGER_AUTH.SESSION_PREFIX+token,JSON.stringify(session),UBNUX_MANAGER_AUTH.SESSION_SECONDS);
  return {success:true,token:token,expiresAt:new Date(Date.now()+UBNUX_MANAGER_AUTH.SESSION_SECONDS*1000).toISOString(),user:session};
}

function handleManagerLogout(payload) {
  const token = getManagerToken_(payload);
  if (token) CacheService.getScriptCache().remove(UBNUX_MANAGER_AUTH.SESSION_PREFIX+token);
  return {success:true};
}

function requireManagerAuth_(payload) {
  const token = getManagerToken_(payload);
  if (!token) throw new Error("Unauthorized: session token is required.");
  const raw = CacheService.getScriptCache().get(UBNUX_MANAGER_AUTH.SESSION_PREFIX+token);
  if (!raw) throw new Error("Unauthorized: session expired.");
  CacheService.getScriptCache().put(UBNUX_MANAGER_AUTH.SESSION_PREFIX+token,raw,UBNUX_MANAGER_AUTH.SESSION_SECONDS);
  return JSON.parse(raw);
}

function getManagerToken_(payload) {
  payload = payload || {};
  return String(payload.token || payload.sessionToken || "").trim();
}

function hashUBnuxPassword_(password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(password||""),Utilities.Charset.UTF_8);
  return bytes.map(b=>{const v=b<0?b+256:b;return ("0"+v.toString(16)).slice(-2)}).join("");
}
