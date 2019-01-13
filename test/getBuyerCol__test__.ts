import * as test from "tape";
import {
  getBuyerCol,
  orderSheetColumns,
} from "../src/buyingGroup";

const buyers = [
  ["b1", "Madam B", "buyer1@there.com"],
  ["b2", "Mssr B", "buyerTwo@here.com"],
];

test("getBuyerCol - first buyer", (t) => {
  const result = getBuyerCol(buyers, buyers[0]);
  t.deepEqual(result, orderSheetColumns.length);
  t.end();
});

test("getBuyerCol - second buyer", (t) => {
  const result = getBuyerCol(buyers, buyers[1]);
  t.deepEqual(result, orderSheetColumns.length + 1);
  t.end();
});
