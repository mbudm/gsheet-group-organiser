import * as test from "tape";
import * as buyingGroup from '../src/buyingGroup';

const itemData = [
  [1, "Apricots", "5kg", "74.75", "14.95", "1kg", "5"],
  [2, "Cherries", "5kg", "112.50", "11.25", "500gm", "10"]
];

const buyerData = [
  [
    "friendly name",
    "Full Name",
    "full.name@email.com",
    "+6143 212 345",
  ],
  [
    "another buyer",
    "Ms A. Buyer, esq.",
    "a.buyer@email.com",
    "6143123456",
  ],
]

const orderDataEmpty = [
  [...buyingGroup.itemsColumns, buyerData[0][0], buyerData[1][0]],
  ...itemData
]

const orderDataPurchases = [
  [...orderDataEmpty[0]],
  [...itemData[0], "3", "2"],
  [...itemData[1], "8", "2"]
]



const invoiceFooterData = [
  ["Thank you for being a part of our Fabulous Fair Food Buying Group!"],
  ["Please pay amount due by 3pm, Wednesday, 14th December by calling our Customer Service Team on:"],
  ["Ph: 8673 6288"]
]

const invoiceData = [
  [
    [buyerData[0][0]],
    [...buyingGroup.invoiceColumns],
    ["Apricots", "1kg", "14.95", "3", 44.85],
    ["Cherries", "500gm", "11.25", "8", 90],
    ["", "", "", "Total Due", 134.85],
    ...invoiceFooterData
  ],
  [
    [buyerData[1][0]],
    [...buyingGroup.invoiceColumns],
    ["Apricots", "1kg", "14.95", "2", 29.90],
    ["Cherries", "500gm", "11.25", "2", 22.50],
    ["", "", "", "Total Due", 52.40],
    ...invoiceFooterData
  ]
]

test("createOrderFormData", (t) => {
  const result = buyingGroup.createOrderFormData(itemData, buyerData);
  t.deepEqual(result, orderDataEmpty);
  t.end();
});

test("getBuyerItems", (t) => {
  const result = buyingGroup.getBuyerItems(orderDataPurchases, buyingGroup.itemsColumns.length);
  const expected = invoiceData[0].slice(2);
  t.deepEqual(result[0], expected[0]);
  t.deepEqual(result[1], expected[1]);
  t.deepEqual(result[2], expected[2]);
  t.end();
});

test("createInvoiceData", (t) => {
  const result = buyingGroup.createInvoiceData(orderDataPurchases, invoiceFooterData);
  t.deepEqual(result, invoiceData);
  t.end();
});