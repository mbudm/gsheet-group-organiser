import * as test from "tape";
import {
  getOrderSheetValidations,
} from "../src/buyingGroup";
import { IValidation } from "../src/types";

const buyers = [
  ["b1", "Madam B", "buyer1@there.com"],
  ["b2", "Mssr B", "buyerTwo@here.com"],
];
const itemData = [
  [1, "Apricots", "5kg", "74.75", "1kg", "14.95", "5"],
  [2, "Cherries", "5kg", "112.50", "500gm", "11.25", "10"],
];

test("getOrderSheetValidations", (t) => {
  const result = getOrderSheetValidations(itemData, buyers);

  const expected: IValidation[] = [{
    formula: "=GTE(G2,H2)",
    helpText: "Apricots has a max of 5 shares",
    range: [2, 9, 1, 2],
  }, {
    formula: "=GTE(G3,H3)",
    helpText: "Cherries has a max of 10 shares",
    range: [3, 9, 1, 2],
  }];

  t.deepEqual(result, expected);
  t.end();
});
