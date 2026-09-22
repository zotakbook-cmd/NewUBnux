const UBNUX_SLUG_REGISTRY_SHEET = "04_SlugRegistry";
const UBNUX_RESERVED_SLUGS = ["admin","api","search","about","contact","login","privacy","terms","business","in","assets","functions","favicon.ico","robots.txt","sitemap.xml","business-manager","manager"];

function handleManagerCheckSlug(params) {
  requireManagerAuth_(params);
  const slug = normalizeCustomSlug_(params.slug);
  const businessId = String(params.businessId||"").trim();
  if (!slug || slug.length<3) return {success:true,available:false,slug:slug,reason:"invalid"};
  if (isReservedCustomSlug_(slug)) return {success:true,available:false,slug:slug,reason:"reserved"};
  const match = findSlugRegistryRow_(slug);
  if (!match) return {success:true,available:true,slug:slug};
  if (businessId && String(match.row.BusinessID||"").trim()===businessId && String(match.row.Status||"Active").toLowerCase()==="active") {
    return {success:true,available:true,slug:slug,ownedByCurrentBusiness:true};
  }
  return {success:true,available:false,slug:slug,reason:"taken"};
}

function normalizeCustomSlug_(value) {
  return String(value||"").trim().toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").replace(/-{2,}/g,"-").substring(0,80);
}
function isReservedCustomSlug_(slug) { return UBNUX_RESERVED_SLUGS.indexOf(String(slug||"").toLowerCase())!==-1; }

function findSlugRegistryRow_(slug) {
  const ss = SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(UBNUX_SLUG_REGISTRY_SHEET);
  if (!sheet || sheet.getLastRow()<2) return null;
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const slugColumn = headers.indexOf("Slug")+1;
  if (!slugColumn) throw new Error("Slug column missing in "+UBNUX_SLUG_REGISTRY_SHEET);
  const cell = sheet.getRange(2,slugColumn,sheet.getLastRow()-1,1).createTextFinder(String(slug)).matchEntireCell(true).matchCase(false).findNext();
  if (!cell) return null;
  const values = sheet.getRange(cell.getRow(),1,1,headers.length).getValues()[0];
  const row = {}; headers.forEach((h,i)=>row[h.trim()]=values[i]);
  return {rowNumber:cell.getRow(),row:row,headers:headers};
}

function reserveBusinessSlug_(slug,businessId,districtId,sheetName,previousSlug) {
  slug = normalizeCustomSlug_(slug);
  if (!slug || slug.length<3) throw new Error("Invalid custom URL.");
  if (isReservedCustomSlug_(slug)) throw new Error("This custom URL is reserved by UBnux.");
  const existing = findSlugRegistryRow_(slug);
  if (existing && String(existing.row.BusinessID||"").trim()!==String(businessId||"").trim() && String(existing.row.Status||"Active").toLowerCase()==="active") {
    throw new Error("This custom URL is already taken.");
  }
  const ss = SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(UBNUX_SLUG_REGISTRY_SHEET);
  if (!sheet) throw new Error(UBNUX_SLUG_REGISTRY_SHEET+" does not exist. Run setupUBnuxBusinessManager() first.");
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const now = new Date();
  const obj = existing ? Object.assign({},existing.row) : {};
  Object.assign(obj,{Slug:slug,BusinessID:businessId,DistrictID:districtId,SheetName:sheetName,Status:"Active",UpdatedAt:now,PreviousSlug:previousSlug||obj.PreviousSlug||""});
  if (!obj.CreatedAt) obj.CreatedAt=now;
  const values = headers.map(h=>obj[h.trim()]!==undefined?obj[h.trim()]:"");
  if (existing) sheet.getRange(existing.rowNumber,1,1,values.length).setValues([values]);
  else sheet.appendRow(values);
}

function deactivateBusinessSlug_(slug,businessId) {
  const match = findSlugRegistryRow_(normalizeCustomSlug_(slug));
  if (!match) return;
  if (businessId && String(match.row.BusinessID||"").trim()!==String(businessId).trim()) return;
  const ss = SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(UBNUX_SLUG_REGISTRY_SHEET);
  match.row.Status="Inactive"; match.row.UpdatedAt=new Date();
  const values = match.headers.map(h=>match.row[h.trim()]!==undefined?match.row[h.trim()]:"");
  sheet.getRange(match.rowNumber,1,1,values.length).setValues([values]);
}

function handleBusinessByCustomSlug(params) {
  const slug = normalizeCustomSlug_(params.slug);
  if (!slug) return {success:false,message:"Slug is required."};
  const match = findSlugRegistryRow_(slug);
  if (!match || String(match.row.Status||"").toLowerCase()!=="active") return {success:false,message:"Business not found."};
  const sheetName = String(match.row.SheetName||"").trim();
  const businessId = String(match.row.BusinessID||"").trim();
  const businesses = getSheetData(sheetName);
  let business=null;
  for (let i=0;i<businesses.length;i++) if (String(businesses[i].BusinessID||"").trim()===businessId) { business=businesses[i]; break; }
  if (!business) return {success:false,message:"Business record not found."};
  const districts=getSheetData(UBNUX_CONFIG.SHEETS.DISTRICTS), categories=getSheetData(UBNUX_CONFIG.SHEETS.CATEGORIES);
  let district=null,category=null;
  for (let d=0;d<districts.length;d++) if (String(districts[d].DistrictID||"").trim()===String(business.DistrictID||"").trim()) {district=districts[d];break;}
  for (let c=0;c<categories.length;c++) if (String(categories[c].CategoryID||"").trim()===String(business.CategoryID||"").trim()) {category=categories[c];break;}
  const sanitized=sanitizeBusiness(business);
  return {success:true,business:Object.assign({},sanitized,{StateSlug:normalizeSlug((district&&district.State)||""),DistrictSlug:normalizeSlug((district&&(district.Slug||district.DistrictName))||""),CategorySlug:normalizeSlug((category&&(category.Slug||category.CategoryName))||""),Slug:String(business.Slug||"").trim()}),district:district,category:category};
}
