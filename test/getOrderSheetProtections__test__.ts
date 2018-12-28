import * as test from "tape";
import {
  orderSheetColumns,
  getOrderSheetProtections
} from "../src/buyingGroup";

const admin = ["fred@there.com"];
const buyers = [["b1", "Madam B", "buyer1@there.com"], ["b2", "Mssr B", "buyerTwo@here.com"]];
const itemData = ["item 1", "item 2"];

test("getOrderSheetProtections", t => {
  const result = getOrderSheetProtections(admin, buyers, itemData);

  const expected = [
    ...admin,
    { email: buyers[0][2], range: [2, orderSheetColumns.length + 1, itemData.length] },
    { email: buyers[1][2], range: [2, orderSheetColumns.length + 2, itemData.length] }
  ];
  t.deepEqual(result, expected);
  t.end();
});
