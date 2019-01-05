function onOpen() {
    const spreadsheet = SpreadsheetApp.getActive();
    const menuItems = [
        {name: "Create Order Sheet", functionName: "createOrderSheet_"},
        {name: "Generate Invoices", functionName: "createInvoices_"},
    ];
    spreadsheet.addMenu("Buying Group", menuItems);
}
