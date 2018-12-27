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

const ORDER_FORM_SHEET_NAME = 'Order Form';
const ITEMS_SHEET_NAME = 'Items';
const BUYERS_SHEET_NAME = 'Buyers';
const ADMINS_SHEET_NAME = 'Admin users';
const INVOICE_FOOTER_SHEET_NAME = 'Invoice footer';

function onOpen() {
    var spreadsheet = SpreadsheetApp.getActive();
    var menuItems = [
        {name: 'Create Order Sheet', functionName: 'createOrderSheet_'},
        {name: 'Generate Invoices', functionName: 'createInvoices_'}
    ];
    spreadsheet.addMenu('Buying Group', menuItems);
}

function createInvoices_(){
    const orderFormData = getSheetData(ORDER_FORM_SHEET_NAME);
    const invoiceFooterData = getSheetData(INVOICE_FOOTER_SHEET_NAME);
    const invoicesData = createInvoiceData(orderFormData, invoiceFooterData);
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

function getOrderSheetProtections(admin, buyers, itemData){
    const buyersWithRange = buyers.map((buyer, buyerIdx) => {
        const range = [1, itemsColumns.length + buyerIdx, itemData.length];
        return {
            email: buyer[1],
            range
        }
    });
    return [
        ...admin,
        buyersWithRange
    ];
}

function getSheetData(sheetName){
    var spreadsheet = SpreadsheetApp.getActive()
    var namedSheet = spreadsheet.getSheetByName(sheetName);
    namedSheet.activate();
    return namedSheet.getDataRange()
}

function createNewSheet(name, data, protections){
    /*
    prompt to overwrite if sheet exists?
    */
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet(name); 
    const range = newSheet.getRange(0, 0, data.length, data[0].length);
    range.setValues(data);
}

function createInvoiceSheet(invoice, admins){
    const users = admins.concat(invoice[0][1]); 
    const name = invoice[0][0];
    createNewSheet(name, invoice, users);
}

export function getBuyerItems(orderFormData, buyerIdx){
    let runningTotal = 0;
    const buyerItems = orderFormData.filter((row, idx) => {
        return idx > 0 && parseInt(row[buyerIdx]) > 0;
    }).map((r) => {
        const itemTotal = Math.round( (r[buyerIdx] * r[4]) * 100 )/ 100;
        runningTotal += itemTotal;
        return [ 
            r[1], // 'Item',
            r[5], // 'Share size',
            r[4], // 'Share cost'
            r[buyerIdx], // 'Purchased',
            itemTotal// 'Totals'
        ];
    });
    return buyerItems.concat([[
        "",
        "",
        "",
        "Total Due",
        runningTotal
    ]]);
}

export function createInvoiceData(orderFormData, invoiceFooterData){
    const buyers = orderFormData[0].slice(itemsColumns.length);
    const invoices = buyers.map((buyer, buyerIdx) => {
        const buyerOrderColIdx = itemsColumns.length + buyerIdx;
        const buyerItems = getBuyerItems(orderFormData, buyerOrderColIdx);
        return [
            [buyer],
            [...invoiceColumns],
            ...buyerItems,
            ...invoiceFooterData
        ];
    })
    return invoices;
}

export function createOrderFormData(itemData, buyerData){
    const headings = [...itemsColumns].concat(buyerData.map(buyer => buyer[0]));
    return [
        headings,
        ...itemData
    ];
}