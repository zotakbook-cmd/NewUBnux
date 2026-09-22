function setupUBnuxBusinessManager() {
  const ss = SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  ensureUBnuxSheet_(ss, "00_Admins", [
    "UserID","Name","Role","Email","Mobile","PasswordHash","Active","CreatedAt","UpdatedAt"
  ]);
  ensureUBnuxSheet_(ss, "04_SlugRegistry", [
    "Slug","BusinessID","DistrictID","SheetName","Status","CreatedAt","UpdatedAt","PreviousSlug"
  ]);
  return "UBnux Business Manager sheets ready.";
}

function ensureUBnuxSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createUBnuxManagerAdmin() {

  const userId = "admin";

  const name = "UBnux Admin";

  const role = "Administrator";

  const email = "";

  const mobile = "";

  // YAHAN APNA ADMIN PASSWORD LIKHE
  const password = "UbNux@2026#Admin";


  if (!password || password.length < 8) {

    throw new Error(
      "Admin password must be at least 8 characters."
    );

  }


  upsertUBnuxAdmin_({

    UserID: userId,

    Name: name,

    Role: role,

    Email: email,

    Mobile: mobile,

    PasswordHash:
      hashUBnuxPassword_(password),

    Active: true

  });


  return "UBnux Admin created successfully.";

}

function upsertUBnuxAdmin_(admin) {
  const ss = SpreadsheetApp.openById(UBNUX_CONFIG.SPREADSHEET_ID);
  const sheet = ensureUBnuxSheet_(ss, "00_Admins", [
    "UserID","Name","Role","Email","Mobile","PasswordHash","Active","CreatedAt","UpdatedAt"
  ]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const map = {};
  headers.forEach((h,i)=>map[h.trim()]=i);
  const now = new Date();
  let rowIndex = -1;
  for (let r=1;r<data.length;r++) {
    if (String(data[r][map.UserID]||"").trim().toLowerCase() === String(admin.UserID||"").trim().toLowerCase()) {
      rowIndex = r+1; break;
    }
  }
  const createdAt = rowIndex>0 ? sheet.getRange(rowIndex,map.CreatedAt+1).getValue() : now;
  const row = headers.map(h => {
    const k = h.trim();
    if (k === "CreatedAt") return createdAt || now;
    if (k === "UpdatedAt") return now;
    return admin[k] !== undefined ? admin[k] : "";
  });
  if (rowIndex>0) sheet.getRange(rowIndex,1,1,row.length).setValues([row]);
  else sheet.appendRow(row);
}
