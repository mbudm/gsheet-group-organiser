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

export function createNewSheet(name, data, protections){
  /*
  prompt to overwrite if sheet exists?
  */
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const newSheet = ss.insertSheet(name);
  const paddedData = padData(data);
  console.log('creating a sheet with data:', paddedData.length, paddedData[0].length);
  console.log(paddedData);

  const rangeForValues = newSheet.getRange(1, 1, paddedData.length, paddedData[0].length);
  rangeForValues.setValues(paddedData);

  // protect all sheets by default
  const sheetProtection = newSheet.protect().setDescription('Default generated sheet protection');
  protections.forEach((user) => {
    if(typeof user === 'string'){
      sheetProtection.addEditor(user);
    } else {
      console.log('protecting a range for', user)
      // protect a range
      // user shape eg  { email: '', range: [2, 4, 4] },
      const rangeForProtecting = newSheet.getRange(user.range[0], user.range[1], user.range[2]);
      const rangeProtection = rangeForProtecting.protect().setDescription(`Range for user: ${user.email}`);

      // associate with a name for easier debugging
      const name = `range_${user.email}`.replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ");
      ss.setNamedRange(name, rangeForProtecting);
      rangeProtection.setRangeName(name);

      // From the docs (Protection.addEditor(user)):
      // This method does not automatically give the user permission to edit the
      // spreadsheet itself; to do that in addition, call Spreadsheet.addEditor(user).
      ss.addEditors([user.email]);
      // clear all editors, existing seem to get added by default
      rangeProtection.removeEditors(rangeProtection.getEditors().map(user => user.getEmail()));
      rangeProtection.addEditor(user.email);

      // check it all worked
      const rangeNotation = rangeForProtecting.getA1Notation();
      const rangeDescription = rangeProtection.getDescription();
      const rangeEditors = rangeProtection.getEditors();
      const rangeProtectionType = rangeProtection.getProtectionType();
      console.log('range pretection details', rangeNotation, rangeDescription, rangeEditors, rangeProtectionType);
    }
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
    invoicesData.forEach((invoice) => createInvoiceSheet(invoice, admins));
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

export function getOrderSheetProtections(admin, buyers, itemData){
    const buyersWithRange = buyers.map((buyer, buyerIdx) => {
        const range = [2, orderSheetColumns.length + buyerIdx + 1, itemData.length];
        return {
            email: buyer[2],
            range
        }
    });
    return [
        ...admin,
        ...buyersWithRange
    ];
}

export function createOrderFormData(itemData, buyerData){
  const buyerHeadings = buyerData.map(buyer => buyer[0]);
  const headings = [...orderSheetColumns, ...buyerHeadings];
  return [
      headings,
      ...itemData
  ];
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

export function createInvoiceData(orderFormData, invoiceFooterData, buyerData){
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
    return invoices;
}
