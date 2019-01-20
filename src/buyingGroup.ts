import { IProtection, IRangeEditors, ISheetData, IValidation } from "./types";

export const itemsColumns = [
    "Supplier Code",
    "Item",
    "Qty it comes in",
    "Bulk retail cost",
    "Share size",
    "Share cost",
    "Shares offered",
];

export const buyersColumns = [
    "Friendly Name",
    "Full name",
    "Email",
    "Mobile",
];

export const invoiceColumns = [
    "Item",
    "Share size",
    "Share cost",
    "Purchased",
    "Totals",
];

export const orderSheetColumns = [
  ...itemsColumns,
  "Shares remaining",
];

const ORDER_FORM_SHEET_NAME = "Order Form";
const ITEMS_SHEET_NAME = "Items";
const BUYERS_SHEET_NAME = "Buyers";
const ADMINS_SHEET_NAME = "Admin users";
const INVOICE_FOOTER_SHEET_NAME = "Invoice footer";

// event handlers

function onOpen() {
  // ensure base sheets are restricted to admins
  updateBaseSheetProtections();

  if (isAdminUser()) {
    const spreadsheet = SpreadsheetApp.getActive();
    const menuItems = [
        {name: "Create Order Sheet", functionName: "createOrderSheet_"},
        {name: "Generate Invoices", functionName: "createInvoices_"},
    ];
    spreadsheet.addMenu("Buying Group", menuItems);
  }
}

function onInstall(e) {
  onOpen();
}

// admins

function getAdminEmails() {
  const adminData = getSheetData(ADMINS_SHEET_NAME);
  return adminData.reduce((acc, val) => acc.concat(val), []);
}

export function isAdminUser() {
  const spreadsheet = SpreadsheetApp.getActive();
  const admins = getAdminEmails();
  try {
    // throws an exception if user is not an editor
    const editors =  spreadsheet.getEditors();
    // this user is an editor, are they also an admin?
    const userEmail = Session.getActiveUser().getEmail();

    return admins.indexOf(userEmail) >= 0;
  } catch (e) {
    console.error("isAdminUser error", e);
    return false;
  }
}

// menu event handlers

function createInvoices_() {
  const orderFormData = getSheetData(ORDER_FORM_SHEET_NAME);
  const invoiceFooterData = getSheetData(INVOICE_FOOTER_SHEET_NAME);
  const buyerData = getSheetData(BUYERS_SHEET_NAME);
  const invoicesData = createInvoiceData(orderFormData, invoiceFooterData, buyerData);
  const admins = getAdminEmails();
  // write a new sheet for each invoice
  invoicesData.forEach((invoice) => createInvoiceSheet(invoice, admins));
}

function createOrderSheet_() {
  const itemData = getSheetData(ITEMS_SHEET_NAME);
  const buyerData = getSheetData(BUYERS_SHEET_NAME);
  const orderFormData = createOrderFormData(itemData, buyerData);
  const admins = getAdminEmails();
  const protections = getOrderSheetProtections(admins, buyerData, itemData);
  createNewSheet(ORDER_FORM_SHEET_NAME, orderFormData, protections);
}

// sheet helpers

export function getSheetData(sheetName: string): string[][] {
  try {
    console.log("getSheetData", sheetName);
    const spreadsheet = SpreadsheetApp.getActive();
    const namedSheet = spreadsheet.getSheetByName(sheetName);
    namedSheet.activate();
    const values = namedSheet.getDataRange().getDisplayValues();
    return values.slice(1); // remove header row
  } catch (e) {
    console.error(e, sheetName);
  }
}

export function padRow(arr, len) {
  while (true) {
      if (arr.push("") >= len) {
      break;
      }
  }
  return arr;
}
export function padData(data: Array<Array<string | number>>) {
  const maxWidth = data.reduce((acc, row) => Math.max(acc, row.length), 0);
  return data.map((row) => row.length === maxWidth ? row : padRow(row, maxWidth));
}

// surely a way to ...spread this in typescript but havent figured it out yet
export function getRangeFromArray(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  arr: number[]): GoogleAppsScript.Spreadsheet.Range {
  return arr.length === 3 ?
    sheet.getRange(arr[0], arr[1], arr[2]) :
    sheet.getRange(
      arr[0],
      arr[1],
      arr[2],
      arr[3]);
}

export function arrayIndexToLetter(idx) {
  const remainder = (idx) % 26;
  return idx < 26 ?
    String.fromCharCode(idx + 65) :
    `${String.fromCharCode(((idx - remainder - 1) / 26) + 65)}${String.fromCharCode(((idx) % 26) + 65)}`;
}

export function createNewSheet(name: string, data: ISheetData, protections: IProtection) {
  // create sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const newSheet = ss.insertSheet(name);

  // add values
  console.log(`creating sheet: ${name} raw values:`, data.values);
  const paddedValues = padData(data.values);
  console.log("- padded values:", paddedValues.length, paddedValues[0].length);
  console.log(paddedValues);

  const rangeForValues = newSheet.getRange(1, 1, paddedValues.length, paddedValues[0].length);
  rangeForValues.setValues(paddedValues);

  // add formulas
  console.log("adding formulas rules:", data.formulas);
  data.formulas.forEach((formulaData) => {
    const formulaRange = getRangeFromArray(newSheet, formulaData.range);

    console.log("adding formulas to range:", formulaData.range);
    console.log(formulaData.formulaValues);
    formulaRange.setFormulasR1C1(formulaData.formulaValues);
  });

  // validation rules
  console.log("adding validation rules:", data.validation);
  data.validation.forEach((validationData) => {
    const validationRange = getRangeFromArray(newSheet, validationData.range);
    const rule = SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied(validationData.formula)
      .setAllowInvalid(true) // false prevents edit after the rule has been broken so buyer cant fix it...
      .setHelpText(validationData.helpText)
      .build();
    validationRange.setDataValidation(rule);
  });

  // protect all sheets by default
  addSheetProtection(newSheet, `${name} sheet protection`, protections.sheetEditors, ss);

  // add all range protection
  console.log("adding range editors:", protections.rangeEditors);
  protections.rangeEditors.forEach((rangeEditors) => {
    const range = getRangeFromArray(newSheet, rangeEditors.range);
    const rangeProtection = range.protect().setDescription(rangeEditors.name);

    // associate with a name for easier debugging
    ss.setNamedRange(rangeEditors.name, range);
    rangeProtection.setRangeName(rangeEditors.name);

    // clear all editors, existing seem to get added by default
    rangeProtection.removeEditors(rangeProtection.getEditors().map((user) => user.getEmail()));
    rangeProtection.addEditors(rangeEditors.editors);

    // check it all worked
    const rangeNotation = range.getA1Notation();
    const rangeDescription = rangeProtection.getDescription();
    const rangeEditorEmails = rangeProtection.getEditors();
    const rangeProtectionType = rangeProtection.getProtectionType();
    console.log("range protection details", rangeNotation, rangeDescription, rangeEditorEmails, rangeProtectionType);
  });

  newSheet.autoResizeColumns(1, paddedValues[0].length);
}

function addSheetProtection(sheet, desc, editors, ss) {
  const sheetProtection = sheet.protect().setDescription(desc);
  // remove all editors as they get added to new sheets by default
  sheetProtection.removeEditors(sheetProtection.getEditors().map((user) => user.getEmail()));

  // add all sheet editors
  console.log("adding sheet editors:", editors, desc);
  editors.forEach((editor) => {
    ss.addEditors([editor]);
    sheetProtection.addEditor(editor);
  });
}

// base sheets

function updateBaseSheetProtections() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const admins = getAdminEmails();
  try {
    [
      ITEMS_SHEET_NAME,
      BUYERS_SHEET_NAME,
      ADMINS_SHEET_NAME,
      INVOICE_FOOTER_SHEET_NAME,
    ].forEach((sheetName) => {
      const baseSheet = ss.getSheetByName(sheetName);
      const protection = baseSheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)[0];
      if (protection) {
        const editors = protection.getEditors();
        editors.forEach((editor) => {
           if (admins.indexOf(editor.getEmail()) === -1) {
            console.log(`Removing ${editor.getEmail()} - not an admin ${admins}`);
            protection.removeEditor(editor);
          }
        });
        protection.addEditors(admins);
      } else {
        console.log(`Add protection for ${sheetName} with admins ${admins}`);
        addSheetProtection(baseSheet, `${sheetName} protection`, admins, ss);
      }
    });
  } catch (e) {
    console.error("updateBaseSheetProtections", e);
  }
}

// Order sheet

export function getRangeName(str): string {
  return str.replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ");
}

export function getOrderSheetProtections(admin, buyers, itemData): IProtection {
  const rangeEditors: IRangeEditors[] = buyers.map((buyer, buyerIdx) => {
    const range = [2, orderSheetColumns.length + buyerIdx + 1, itemData.length];
    return {
      editors: [...admin, buyer[2]],
      name: getRangeName(buyer[2]),
      range,
    };
  });
  // I'm always forgetting the getRange signature - row, col, numrows, numcols
  const totalRow: IRangeEditors = {
    editors: [...admin],
    name: "totalRow",
    range: [itemData.length + 2, 1, 1, orderSheetColumns.length + buyers.length],
  };
  const headingRow = {
    editors: [...admin],
    name: "headingRow",
    range: [1, 1, 1, orderSheetColumns.length + buyers.length],
  };
  const itemsRange = {
    editors: [...admin],
    name: "itemsRange",
    range: [2, 1, itemData.length, orderSheetColumns.length],
  };

  return {
    rangeEditors: rangeEditors.concat([totalRow, headingRow, itemsRange]),
    sheetEditors: [...admin, ...buyers.map((b) => b[2])],
  };
}

export function getOrderSheetValidations(itemData, buyerData): IValidation[] {
  const sharesRemainCol = arrayIndexToLetter(orderSheetColumns.length - 1);
  return itemData.map((item, idx) => {
    const row = idx + 2;
    const formula = `=GTE($${sharesRemainCol}${row},0)`;
    return {
      formula,
      helpText: `${item[1]} has a max of ${item[orderSheetColumns.length - 2]} shares`,
      range: [row, orderSheetColumns.length + 1, 1, buyerData.length],
    };
  });
}

export function createOrderFormData(itemData, buyerData): ISheetData {
  const buyerHeadings = buyerData.map((buyer) => buyer[0]);
  const headings = [...orderSheetColumns, ...buyerHeadings];
  const validation = getOrderSheetValidations(itemData, buyerData);
  const totals = [];
  buyerData.forEach((b, idx) => {
    const col = idx + 3; // relative to share cost
    // tslint:disable-next-line:max-line-length
    totals.push(`=DOLLAR(SUMPRODUCT(R[-${itemData.length}]C[-${col}]:R[-1]C[-${col}], R[-${itemData.length}]C[0]:R[-1]C[0]))`);
  });

  const sharesRemaining = [];
  itemData.forEach(() => {
    // tslint:disable-next-line:max-line-length
    sharesRemaining.push([`=IF(ISNUMBER(R[0]C[-1]), SHARES_REMAINING(R[0]C[-1],R[0]C[1]:R[0]C[${buyerData.length}]), "n/a")`]);
  });
  return {
    formulas: [
      {
        formulaValues: [[...totals]],
        range: [itemData.length + 2, orderSheetColumns.length + 1, 1, buyerData.length],
      },
      {
        formulaValues: [...sharesRemaining],
        range: [2, orderSheetColumns.length, itemData.length],
      },
    ],
    validation,
    values: [
      headings,
      ...itemData,
    ],
  };
}

export function SHARES_REMAINING(sharesAvailable, buyerShares) {
  const negativeSharesCheck = buyerShares[0].some( (val) => parseInt(val, 10) < 0 );
  if (negativeSharesCheck) {
    return "Error: Negative amount found";
  }
  const sharesSold = buyerShares[0].reduce(add, 0);
  const sharesRemaining = sharesAvailable - sharesSold;
  if (sharesRemaining === 0) {
    return "Sold";
  } else if (sharesRemaining < 0) {
    return "Error: Over limit!";
  } else if (sharesRemaining % 1 !== 0) {
    return "Error: Portions not possible";
  } else {
    return sharesRemaining;
  }
}

function add(sum, b) {
  const parsed = parseFloat(b);
  return isNaN(parsed) ? sum  : sum + parsed;
}

// invoice sheet

function createInvoiceSheet(invoice: ISheetData, admins) {
    const protections: IProtection = {
      rangeEditors: [],
      sheetEditors: [...admins],
    };
    const name = `Invoice ${invoice.values[0][0]}`;
    createNewSheet(name, invoice, protections);
}

const isItemRow = (idx, orderFormData) => idx > 0 && idx < orderFormData.length - 1;
const hasPurchases = (row, buyerIdx) => parseInt(row[buyerIdx], 10) > 0;

export function getBuyerItems(orderFormData, buyerIdx) {
    return orderFormData.filter((row, idx) => {
        return isItemRow(idx, orderFormData) && hasPurchases(row, buyerIdx);
    }).map((r) => {
        return [
            r[1], // 'Item',
            r[4], // 'Share size',
            r[5], // 'Share cost'
            r[buyerIdx], // 'Purchased',
        ];
    });
}

function getTotalRow() {
  return [
    "",
    "",
    "",
    "Total Due",
  ];
}
export function getBuyerCol(buyerIdx) {
  return orderSheetColumns.length + buyerIdx;
}

export function createInvoiceData(orderFormData, invoiceFooterData, buyerData): ISheetData[] {
    const invoices: ISheetData[] = buyerData.map((buyer, buyerIdx): ISheetData  => {
        const buyerOrderColIdx = getBuyerCol(buyerIdx);
        const buyerItems = getBuyerItems(orderFormData, buyerOrderColIdx);
        console.log("buyer map:", buyerIdx, buyerItems.length, buyer[0]);
        const itemTotals = buyerItems.map(() => {
          return [`=R[0]C[-1] * R[0]C[-2]`];
        });
        const totalRow = getTotalRow();
        const invoiceTotal = [`=SUM(R[-${buyerItems.length}]C[0]:R[-1]C[0])`];
        return {
          formulas: [{
            formulaValues: [...itemTotals],
            range: [3, invoiceColumns.length, buyerItems.length, 1],
          }, {
            formulaValues: [invoiceTotal],
            range: [buyerItems.length + 3, invoiceColumns.length, 1, 1],
          }],
          validation: [],
          values: buyerItems.length > 0 ? [
            buyer.slice(1, 3),
            [...invoiceColumns],
            ...buyerItems,
            totalRow,
            ...invoiceFooterData,
          ] : [],
        };
    })
    .filter((buyerInvoiceData, bIdx) => {
      console.log("buyer filter:", bIdx, buyerInvoiceData.values.length, buyerData[bIdx][0]);
      return buyerInvoiceData.values.length > 0;
    });
    return invoices;
}
