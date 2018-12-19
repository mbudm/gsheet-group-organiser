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
const ADMINS_SHEET_NAME = 'Admin users';

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
    const invoicesData = createInvoiceData(orderFormData);
    const admins = getSheetData(ADMINS_SHEET_NAME);
    // write a new sheet for each invoice
    invoicesData.forEach((invoice) => createInvoiceSheet(invoice, admins));
}

function createOrderSheet_(){
    const itemData = getSheetData(ITEMS_SHEET_NAME);
    const buyerData = getSheetData(BUYERS_SHEET_NAME);
    const orderFormData = createOrderFormData(itemData, buyerData);
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
}

function createInvoiceSheet(invoice, admins){
    const users = admins.concat(invoice[0][1]); 
    const name = invoice[0][0];
    createNewSheet(name, invoice, users);
}

export function createInvoiceData(orderFormData){
    /*
    Add friendly name and email as header
    get the column for this buyer
    for each row, 
        filter if no items
        map to Item, Share size, Share cost, Purchased, Totals
        Calc total due (validate against otal row?)
    Add footer info
    */
    return orderFormData;
}

export function createOrderFormData(itemData, buyerData){
    return { itemData, buyerData }
}