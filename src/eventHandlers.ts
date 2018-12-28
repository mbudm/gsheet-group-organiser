function onOpen() {
    var spreadsheet = SpreadsheetApp.getActive();
    var menuItems = [
        {name: 'Create Order Sheet', functionName: 'createOrderSheet_'},
        {name: 'Generate Invoices', functionName: 'createInvoices_'}
    ];
    spreadsheet.addMenu('Buying Group', menuItems);
}
