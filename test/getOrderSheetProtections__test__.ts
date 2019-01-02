import * as test from "tape";
import {
  orderSheetColumns,
  getOrderSheetProtections
} from "../src/buyingGroup";
import { IProtection } from "../src/types";

const admin = ["fred@there.com"];
const buyers = [
  ["b1", "Madam B", "buyer1@there.com"],
  ["b2", "Mssr B", "buyerTwo@here.com"]
];
const itemData = ["item 1", "item 2"];

test("getOrderSheetProtections", t => {
  const result = getOrderSheetProtections(admin, buyers, itemData);

  const expected: IProtection = {
    sheetEditors: ["fred@there.com", "buyer1@there.com", "buyerTwo@here.com"],
    rangeEditors: [
      {
        range: [2, 9, 2],
        editors: ["fred@there.com", "buyer1@there.com"],
        name: "buyer1therecom"
      },
      {
        range: [2, 10, 2],
        editors: ["fred@there.com", "buyerTwo@here.com"],
        name: "buyerTwoherecom"
      },
      { range: [1, 4, 10], editors: ["fred@there.com"], name: "totalRow" },
      { range: [1, 1, 10], editors: ["fred@there.com"], name: "headingRow" },
      { range: [2, 1, 2, 8], editors: ["fred@there.com"], name: "itemsRange" }
    ]
  };

  t.deepEqual(result, expected);
  t.end();
});
