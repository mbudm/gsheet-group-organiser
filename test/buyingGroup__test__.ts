import * as test from "tape";
import * as buyingGroup from "../src/buyingGroup";

const itemData = [
  [1, "Apricots", "5kg", "74.75", "1kg", "14.95", "5"],
  [2, "Cherries", "5kg", "112.50", "500gm", "11.25", "10"],
];

const buyerData = [
  ["friendly name", "Full Name", "full.name@email.com", "+6143 212 345"],
  ["another buyer", "Ms A. Buyer, esq.", "a.buyer@email.com", "6143123456"],
];

const orderDataEmpty = {
  formulas: [
    {
      formulaValues: [
        [
          "=DOLLAR(SUMPRODUCT(R[-2]C[-3]:R[-1]C[-3], R[-2]C[0]:R[-1]C[0]))",
          "=DOLLAR(SUMPRODUCT(R[-2]C[-4]:R[-1]C[-4], R[-2]C[0]:R[-1]C[0]))",
        ],
      ],
      range: [4, 9, 1, 2],
    },
    {
      formulaValues: [
        ["=SHARES_REMAINING(R[0]C[-1]:R[0]C[2])"],
        ["=SHARES_REMAINING(R[0]C[-1]:R[0]C[2])"],
      ],
      range: [2, 8, 2],
    },
  ],
  values: [
    [...buyingGroup.orderSheetColumns, buyerData[0][0], buyerData[1][0]],
    ...itemData,
  ],
};

const orderDataPurchases = [
  [...orderDataEmpty.values[0]],
  [...itemData[0], "5", "3", "2"],
  [...itemData[1], "10", "8", "2"],
  ["fake total row"],
];

const invoiceFooterData = [
  ["Thank you for being a part of our Fabulous Fair Food Buying Group!"],
  ["Please pay amount due by 3pm, Wednesday, 14th December by calling our Customer Service Team on:"],
  ["Ph: 8673 6288"],
];

const invoiceData = [
  {
    formulas: [
      {
        formulaValues: [["=R[0]C[-1] * R[0]C[-2]"], ["=R[0]C[-1] * R[0]C[-2]"]],
        range: [3, 5, 2, 1],
      },
      {
        formulaValues: [["=SUM(R[-2]C[0]:R[-1]C[0])"]],
        range: [5, 5, 1, 1],
      },
    ],
    validation: [],
    values: [
      [buyerData[0][1], buyerData[0][2]],
      [...buyingGroup.invoiceColumns],
      ["Apricots", "1kg", "14.95", "3"],
      ["Cherries", "500gm", "11.25", "8"],
      ["", "", "", "Total Due"],
      ...invoiceFooterData,
    ],
  },
  {
    formulas: [
      {
        formulaValues: [[""], [""]],
        range: [],
      },
      {
        formulaValues: [[""]],
        range: [],
      },
    ],
    validation: [],
    values: [
      [buyerData[1][1], buyerData[1][2]],
      [...buyingGroup.invoiceColumns],
      ["Apricots", "1kg", "14.95", "2"],
      ["Cherries", "500gm", "11.25", "2"],
      ["", "", "", "Total Due"],
      ...invoiceFooterData,
    ],
  },
];

test("createOrderFormData", (t) => {
  const result = buyingGroup.createOrderFormData(itemData, buyerData);
  t.deepEqual(result.values, orderDataEmpty.values);
  t.deepEqual(result.formulas, orderDataEmpty.formulas);
  t.end();
});

test("getBuyerItems - 1st buyer", (t) => {
  const result = buyingGroup.getBuyerItems(
    orderDataPurchases,
    buyingGroup.orderSheetColumns.length,
  );
  const expected = invoiceData[0].values.slice(2);
  t.equal(result.length, 2);
  t.deepEqual(result[0], expected[0]);
  t.deepEqual(result[1], expected[1]);
  t.end();
});

test("getBuyerItems - 2nd buyer", (t) => {
  const result = buyingGroup.getBuyerItems(
    orderDataPurchases,
    buyingGroup.orderSheetColumns.length + 1,
  );
  const expected = invoiceData[1].values.slice(2);
  t.equal(result.length, 2);
  t.deepEqual(result[0], expected[0]);
  t.deepEqual(result[1], expected[1]);
  t.end();
});

test("createInvoiceData", (t) => {
  const result = buyingGroup.createInvoiceData(
    orderDataPurchases,
    invoiceFooterData,
    buyerData,
  );
  t.deepEqual(result[0].formulas[0], invoiceData[0].formulas[0]);
  t.deepEqual(result[0].formulas[1], invoiceData[0].formulas[1]);
  t.deepEqual(result[0].values, invoiceData[0].values);
  t.end();
});
