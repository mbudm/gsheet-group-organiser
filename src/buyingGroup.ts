import { IProtection, IRangeEditors, ISheetData } from "./types";

export const itemsColumns = [
    'Supplier Code',
    'Item',
    'Qty it comes in',
    'Bulk retail cost',
    'Share size',
    'Share cost',
    'Shares offered'
];

export const buyersColumns = [
    'Friendly Name',
    'Full name',
    'Email',
    'Mobile'
];

export const invoiceColumns = [
    'Item',
    'Share size',
    'Share cost',
    'Purchased',
    'Totals'
]

export const orderSheetColumns = [
  ...itemsColumns,
  'Shares remaining'
];

const ORDER_FORM_SHEET_NAME = 'Order Form';
const ITEMS_SHEET_NAME = 'Items';
const BUYERS_SHEET_NAME = 'Buyers';
const ADMINS_SHEET_NAME = 'Admin users';
const INVOICE_FOOTER_SHEET_NAME = 'Invoice footer';

// sheet helpers


export function getSheetData(sheetName){
  try {
    console.log('getSheetData', sheetName);
    const spreadsheet = SpreadsheetApp.getActive()
    const namedSheet = spreadsheet.getSheetByName(sheetName);
    namedSheet.activate();
    const values = namedSheet.getDataRange().getValues();
    return values.slice(1); // remove header row
  } catch(e) {
    console.error(e, sheetName);
  }
}

export function padRow(arr, len){
  while(true){
      if(arr.push('') >= len)
      break;
  }
  return arr;
}
export function padData(data){
  const maxWidth = data.reduce((acc, row) => Math.max(acc, row.length), 0);
  return data.map(row => row.length === maxWidth ? row : padRow(row, maxWidth));
}

export function createNewSheet(name, data: ISheetData, protections: IProtection){
  // create sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const newSheet = ss.insertSheet(name);

  // add values
  const paddedValues = padData(data.values);
  console.log('creating a sheet with values:', paddedValues.length, paddedValues[0].length);
  console.log(paddedValues);

  const rangeForValues = newSheet.getRange(1, 1, paddedValues.length, paddedValues[0].length);
  rangeForValues.setValues(paddedValues);

  // add formulas
  data.formulas.forEach(formulaData => {
    let formulaRange;
    if(formulaData.range.length === 3){
      formulaRange = newSheet.getRange(formulaData.range[0], formulaData.range[1], formulaData.range[2]);
    }else{
      formulaRange = newSheet.getRange(formulaData.range[0], formulaData.range[1], formulaData.range[2], formulaData.range[3]);
    }
    console.log('adding formulas to range:', formulaData.range);
    console.log(formulaData.formulaValues);
    formulaRange.setFormulasR1C1(formulaData.formulaValues);
  });

  // protect all sheets by default
  const sheetProtection = newSheet.protect().setDescription('Default generated sheet protection');
  // remove all editors as they get added to new sheets by default
  sheetProtection.removeEditors(sheetProtection.getEditors().map(user => user.getEmail()));

  // add all sheet editors
  protections.sheetEditors.forEach((editor) => {
    ss.addEditors([editor]);
    sheetProtection.addEditor(editor);
  });

  // add all range protection
  protections.rangeEditors.forEach((rangeEditors) =>{
    let range: GoogleAppsScript.Spreadsheet.Range;
    if(rangeEditors.range.length === 3){
      range = newSheet.getRange(rangeEditors.range[0], rangeEditors.range[1], rangeEditors.range[2]);
    }else{
      range = newSheet.getRange(rangeEditors.range[0], rangeEditors.range[1], rangeEditors.range[2], rangeEditors.range[3]);
    }
    const rangeProtection = range.protect().setDescription(rangeEditors.name);

    // associate with a name for easier debugging
    ss.setNamedRange(rangeEditors.name, range);
    rangeProtection.setRangeName(rangeEditors.name);

    // clear all editors, existing seem to get added by default
    rangeProtection.removeEditors(rangeProtection.getEditors().map(user => user.getEmail()));
    rangeProtection.addEditors(rangeEditors.editors);


    // check it all worked
    const rangeNotation = range.getA1Notation();
    const rangeDescription = rangeProtection.getDescription();
    const rangeEditorEmails = rangeProtection.getEditors();
    const rangeProtectionType = rangeProtection.getProtectionType();
    console.log('range protection details', rangeNotation, rangeDescription, rangeEditorEmails, rangeProtectionType);
  });
}


// menu event handlers

function createInvoices_(){
    const orderFormData = getSheetData(ORDER_FORM_SHEET_NAME);
    const invoiceFooterData = getSheetData(INVOICE_FOOTER_SHEET_NAME);
    const buyerData = getSheetData(BUYERS_SHEET_NAME);
    const invoicesData = createInvoiceData(orderFormData, invoiceFooterData, buyerData);
    const admins = getAdminEmails();
    // write a new sheet for each invoice
    invoicesData.values.forEach((invoice) => createInvoiceSheet(invoice, admins));
}

function createOrderSheet_(){
    const itemData = getSheetData(ITEMS_SHEET_NAME);
    const buyerData = getSheetData(BUYERS_SHEET_NAME);
    const orderFormData = createOrderFormData(itemData, buyerData);
    const admins = getAdminEmails();
    const protections = getOrderSheetProtections(admins, buyerData, itemData);
    createNewSheet(ORDER_FORM_SHEET_NAME, orderFormData, protections);
}

// admins
function getAdminEmails(){
  const adminData = getSheetData(ADMINS_SHEET_NAME);
  return adminData.reduce((acc, val) => acc.concat(val), []);
}

// Order sheet

export function getRangeName(str): string{
  return str.replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ");
}

export function getOrderSheetProtections(admin, buyers, itemData): IProtection {
  const rangeEditors: IRangeEditors[] = buyers.map((buyer, buyerIdx) => {
    const range = [2, orderSheetColumns.length + buyerIdx + 1, itemData.length];
    return {
      range,
      editors: [...admin, buyer[2]],
      name: getRangeName(buyer[2])
    }
  });

  const totalRow: IRangeEditors = {
    range: [1, itemData.length + 2, 1, orderSheetColumns.length + buyers.length],
    editors: [...admin],
    name: 'totalRow'
  }
  const headingRow = {
    range: [1, 1, 1, orderSheetColumns.length + buyers.length],
    editors: [...admin],
    name: "headingRow"
  }
  const itemsRange = {
    range: [2, 1, itemData.length, orderSheetColumns.length],
    editors: [...admin],
    name: "itemsRange"
  }

  return {
    sheetEditors: [...admin, ...buyers.map(b => b[2])],
    rangeEditors: rangeEditors.concat([totalRow, headingRow, itemsRange]),
  }
}

export function createOrderFormData(itemData, buyerData): ISheetData{
  const buyerHeadings = buyerData.map(buyer => buyer[0]);
  const headings = [...orderSheetColumns, ...buyerHeadings];
  const totals = [];
  buyerData.forEach((b, idx) => {
    const col = idx + 3; // relative to share cost
    totals.push(`=SUMPRODUCT(R[-${itemData.length}]C[-${col}]:R[-1]C[-${col}], R[-${itemData.length}]C[0]:R[-1]C[0])`);
  });

  const sharesRemaining = [];
  itemData.forEach(() => {
    sharesRemaining.push([`=IF(ISNUMBER(R[0]C[-1]),R[0]C[-1] - SUM(R[0]C[1]:R[0]C[${buyerData.length}]), "n/a")`]);
  })
  return {
    values: [
      headings,
      ...itemData,
    ],
    formulas: [
      {
        range: [itemData.length + 2, orderSheetColumns.length + 1, 1, buyerData.length],
        formulaValues: [[...totals]]
      },
      {
        range: [2, orderSheetColumns.length, itemData.length],
        formulaValues: [...sharesRemaining]
      }
    ]
  };
}



// invoice sheet

function createInvoiceSheet(invoice, admins){
    const users = admins.concat(invoice[0][1]);
    const name = `Invoice' ${invoice[0][0]}`;
    createNewSheet(name, invoice, users);
}

function getItemTotal(purchased, shareCost){
  const result = Math.round( (purchased * shareCost) * 100 )/ 100;
  console.log('getItemTotal', purchased, shareCost, result);
  return result;
}

export function getBuyerItems(orderFormData, buyerIdx){
    return orderFormData.filter((row, idx) => {
        return idx > 0 && parseInt(row[buyerIdx]) > 0;
    }).map((r) => {
        const itemTotal = getItemTotal(r[buyerIdx], r[5]);
        return [
            r[1], // 'Item',
            r[4], // 'Share size',
            r[5], // 'Share cost'
            r[buyerIdx], // 'Purchased',
            itemTotal // 'Totals'
        ];
    });
}

function getTotalRow(buyerItems){
  const total = buyerItems.reduce((total, item) => total + item[4], 0)
  return [
    "",
    "",
    "",
    "Total Due",
    total
  ];
}

export function createInvoiceData(orderFormData, invoiceFooterData, buyerData): ISheetData{
    const invoices = buyerData.filter((b, bIdx) => {
        const bOrderColIdx = orderSheetColumns.length + bIdx;
        const bItems = getBuyerItems(orderFormData, bOrderColIdx);

        console.log('buyer filter:', bIdx, bItems.length, b[0]);
        return bItems.length > 0;
      })
      .map((buyer, buyerIdx) => {
        const buyerOrderColIdx = orderSheetColumns.length + buyerIdx;
        const buyerItems = getBuyerItems(orderFormData, buyerOrderColIdx);
        const totalRow = getTotalRow(buyerItems);
        return [
            buyer.slice(1,3),
            [...invoiceColumns],
            ...buyerItems,
            totalRow,
            ...invoiceFooterData
        ];
    })
    return {
      values: invoices,
      formulas: []
    }
}
