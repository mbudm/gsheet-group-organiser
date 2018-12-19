const itemsColumnMap = {
    'A': 'Supplier Code',
    'B': 'Item',
    'C': 'Qty it comes in',
    'D': 'Bulk retail cost',
    'E': 'Share size',
    'F': 'Shares offered'
}

const buyersColumnMap = {
    'A': 'Friendly Name',
    'B': 'Full name',
    'C': 'Email',
    'D': 'Mobile'
}

const ORDER_FORM_SHEET_NAME = 'Order Form';
const ITEMS_SHEET_NAME = 'Items';
const BUYERS_SHEET_NAME = 'Buyers';

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
    const invoices = createInvoiceData(orderFormData);
}

function createOrderSheet_(){
    var sheet = SpreadsheetApp.getActiveSheet();
    sheet.getRange('A1').setValues([['createInvoices_ called']]);
}

function getSheetData(sheetName){
    var spreadsheet = SpreadsheetApp.getActive()
    var namedSheet = spreadsheet.getSheetByName(sheetName);
    namedSheet.activate();
    return namedSheet.getDataRange()
}

export function createInvoiceData(orderFormData){
    return orderFormData;
}