function handleManagerBootstrap(params) {
  const user = requireManagerAuth_(params);
  const districts = getSheetData(UBNUX_CONFIG.SHEETS.DISTRICTS).filter(r=>String(r.Active||"true").toLowerCase()!=="false");
  const categories = getSheetData(UBNUX_CONFIG.SHEETS.CATEGORIES).filter(r=>String(r.Active||"true").toLowerCase()!=="false");
  return {success:true,user:user,districts:districts,categories:categories};
}

function handleManagerBusinesses(params) {
  requireManagerAuth_(params); params=params||{};
  const search=String(params.search||"").trim().toLowerCase();
  const districtId=String(params.districtId||"").trim();
  const categoryId=String(params.categoryId||"").trim();
  const limit=Math.min(Math.max(parseInt(params.limit,10)||200,1),1000);
  const districts=getSheetData(UBNUX_CONFIG.SHEETS.DISTRICTS);
  const categories=getSheetData(UBNUX_CONFIG.SHEETS.CATEGORIES);
  const categoryById={}; categories.forEach(c=>categoryById[String(c.CategoryID||"").trim()]=c);
  const rows=[];
  districts.forEach(district=>{
    const did=String(district.DistrictID||"").trim(); if (districtId&&did!==districtId) return;
    let sheetName,businesses; try{sheetName=getBusinessSheetNameFromDistrict(district);businesses=getSheetData(sheetName)}catch(e){return}
    businesses.forEach(b=>{
      if (categoryId&&String(b.CategoryID||"").trim()!==categoryId) return;
      if (search){const hay=[b.BusinessID,b.BusinessName,b.OwnerName,b.Mobile,b.WhatsApp,b.Email,b.Area,b.Address,b.Slug].join(" ").toLowerCase();if(!hay.includes(search))return}
      const c=categoryById[String(b.CategoryID||"").trim()];
      rows.push(Object.assign({},sanitizeBusiness(b),{DistrictName:district.DistrictName||"",CategoryName:c?c.CategoryName:"",_SheetName:sheetName}));
    });
  });
  rows.sort((a,b)=>new Date(b.UpdatedAt||b.CreatedAt||0)-new Date(a.UpdatedAt||a.CreatedAt||0));
  const activeCount=rows.filter(b=>String(b.BusinessStatus||"").toLowerCase()==="active").length;
  const verifiedCount=rows.filter(b=>["true","yes","1"].includes(String(b.Verified||"").toLowerCase())).length;
  const slugCount=rows.filter(b=>String(b.Slug||"").trim()).length;
  return {success:true,total:rows.length,activeCount:activeCount,verifiedCount:verifiedCount,slugCount:slugCount,businesses:rows.slice(0,limit)};
}

function handleManagerBusiness(params) {
  requireManagerAuth_(params);
  const businessId=String(params.businessId||"").trim();
  if(!businessId)return{success:false,message:"Business ID is required."};
  const found=findManagerBusinessById_(businessId);
  if(!found)return{success:false,message:"Business not found."};
  return{success:true,business:sanitizeBusiness(found.business),district:found.district,sheetName:found.sheetName};
}

function handleManagerSaveBusiness(payload) {
  const user=requireManagerAuth_(payload); const input=payload.business||{};
  const businessName=String(input.BusinessName||"").trim(),districtId=String(input.DistrictID||"").trim(),categoryId=String(input.CategoryID||"").trim(),slug=normalizeCustomSlug_(input.Slug);
  if(!businessName)return{success:false,message:"Business name is required."};
  if(!districtId)return{success:false,message:"District is required."};
  if(!categoryId)return{success:false,message:"Category is required."};
  if(!slug||slug.length<3)return{success:false,message:"A valid custom URL is required."};
  if(isReservedCustomSlug_(slug))return{success:false,message:"This custom URL is reserved."};
  const lock=LockService.getScriptLock(); if(!lock.tryLock(20000))return{success:false,message:"System is busy. Please try again."};
  try{
    const districts=getSheetData(UBNUX_CONFIG.SHEETS.DISTRICTS); let district=null;
    for(let i=0;i<districts.length;i++)if(String(districts[i].DistrictID||"").trim()===districtId){district=districts[i];break}
    if(!district)return{success:false,message:"District not found."};
    const sheetName=getBusinessSheetNameFromDistrict(district),ss=SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID),sheet=ss.getSheetByName(sheetName);
    if(!sheet)return{success:false,message:"Business sheet not found: "+sheetName};
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>String(h).trim());
    const businessId=String(input.BusinessID||"").trim()||generateUBnuxBusinessId_();
    const existing=findManagerBusinessById_(businessId); const previousSlug=existing?String(existing.business.Slug||"").trim():"";
    const slugMatch=findSlugRegistryRow_(slug);
    if(slugMatch&&String(slugMatch.row.BusinessID||"").trim()!==businessId&&String(slugMatch.row.Status||"Active").toLowerCase()==="active")return{success:false,message:"This custom URL is already taken."};
    const now=new Date(); const saved=Object.assign({},existing?existing.business:{},input,{BusinessID:businessId,DistrictID:districtId,CategoryID:categoryId,BusinessName:businessName,Slug:slug,UpdatedAt:now});
    if(!saved.CreatedAt)saved.CreatedAt=now;if(!saved.BusinessStatus)saved.BusinessStatus="Active";
    let targetRow=(existing&&existing.sheetName===sheetName)?existing.rowNumber:-1;
    if(existing&&existing.sheetName!==sheetName){const old=ss.getSheetByName(existing.sheetName);if(old)old.deleteRow(existing.rowNumber)}
    const values=headers.map(h=>saved[h]!==undefined?saved[h]:"");
    if(targetRow>0)sheet.getRange(targetRow,1,1,values.length).setValues([values]);else sheet.appendRow(values);
    if(previousSlug&&normalizeCustomSlug_(previousSlug)!==slug)deactivateBusinessSlug_(previousSlug,businessId);
    reserveBusinessSlug_(slug,businessId,districtId,sheetName,previousSlug&&normalizeCustomSlug_(previousSlug)!==slug?previousSlug:"");
    return{success:true,message:existing?"Business updated.":"Business created.",business:sanitizeBusiness(saved),updatedBy:user.UserID||""};
  }finally{lock.releaseLock()}
}

function handleManagerDeleteBusiness(payload) {
  requireManagerAuth_(payload); const businessId=String(payload.businessId||"").trim();
  if(!businessId)return{success:false,message:"Business ID is required."};
  const found=findManagerBusinessById_(businessId); if(!found)return{success:false,message:"Business not found."};
  const ss=SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID),sheet=ss.getSheetByName(found.sheetName); if(!sheet)return{success:false,message:"Business sheet not found."};
  sheet.deleteRow(found.rowNumber); if(found.business.Slug)deactivateBusinessSlug_(found.business.Slug,businessId); return{success:true};
}

function findManagerBusinessById_(businessId) {
  businessId=String(businessId||"").trim(); if(!businessId)return null;
  const districts=getSheetData(UBNUX_CONFIG.SHEETS.DISTRICTS),ss=SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  for(let d=0;d<districts.length;d++){
    const district=districts[d];let sheetName;try{sheetName=getBusinessSheetNameFromDistrict(district)}catch(e){continue}
    const sheet=ss.getSheetByName(sheetName);if(!sheet||sheet.getLastRow()<2)continue;
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(h=>String(h).trim()),idColumn=headers.indexOf("BusinessID")+1;if(!idColumn)continue;
    const cell=sheet.getRange(2,idColumn,sheet.getLastRow()-1,1).createTextFinder(businessId).matchEntireCell(true).matchCase(false).findNext();if(!cell)continue;
    const values=sheet.getRange(cell.getRow(),1,1,headers.length).getValues()[0],business={};headers.forEach((h,i)=>business[h]=values[i]);
    return{business:business,district:district,sheetName:sheetName,rowNumber:cell.getRow()};
  }
  return null;
}

function generateUBnuxBusinessId_(){const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||"Asia/Kolkata","yyMMddHHmmss"),random=Math.floor(1000+Math.random()*9000);return"B"+stamp+random}
