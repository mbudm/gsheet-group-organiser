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
  var spreadsheet = SpreadsheetApp.getActive()
  var namedSheet = spreadsheet.getSheetByName(sheetName);
  namedSheet.activate();
  const values = namedSheet.getDataRange().getValues();
  return values.slice(1); // remove header row
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

  const range = newSheet.getRange(1, 1, paddedData.length, paddedData[0].length);
  range.setValues(paddedData);

  // protect all sheets by default
  const sheetProtection = newSheet.protect().setDescription('Default generated sheet protection');
  protections.forEach((user) => {
    if(typeof user === 'string'){
      sheetProtection.addEditor(user);
    }else{
      // protect a range
      // eg  { email: '', range: [2, 4, 4] },
      const range = newSheet.getRange(user.range[0], user.range[1], user.range[2]);
      const rangeProtection = range.protect().setDescription('Range protected for specific users');
      rangeProtection.addEditor(user.email);
    }
  });
}


// menu event handlers

function createInvoices_(){
    const orderFormData = getSheetData(ORDER_FORM_SHEET_NAME);
    const invoiceFooterData = getSheetData(INVOICE_FOOTER_SHEET_NAME);
    const buyerData = getSheetData(BUYERS_SHEET_NAME);
    const invoicesData = createInvoiceData(orderFormData, invoiceFooterData, buyerData);
    const admins = getSheetData(ADMINS_SHEET_NAME);
    // write a new sheet for each invoice
    invoicesData.forEach((invoice) => createInvoiceSheet(invoice, admins));
}

function createOrderSheet_(){
    const itemData = getSheetData(ITEMS_SHEET_NAME);
    const buyerData = getSheetData(BUYERS_SHEET_NAME);
    const orderFormData = createOrderFormData(itemData, buyerData);
    const admins = getSheetData(ADMINS_SHEET_NAME);
    const protections = getOrderSheetProtections(admins, buyerData, itemData);
    createNewSheet(ORDER_FORM_SHEET_NAME, orderFormData, protections);
}


// Order sheet

export function getOrderSheetProtections(admin, buyers, itemData){
    const buyersWithRange = buyers.map((buyer, buyerIdx) => {
        const range = [2, orderSheetColumns.length + buyerIdx + 1, itemData.length];
        return {
            email: buyer[1],
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
