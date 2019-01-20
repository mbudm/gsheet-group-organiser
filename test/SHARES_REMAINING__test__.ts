import * as test from "tape";
import {
  SHARES_REMAINING,
} from "../src/buyingGroup";

test("SHARES_REMAINING - valid empty", (t) => {
  const range = [[10, "", 2, "", 2, ""]];

  const result = SHARES_REMAINING(range);

  t.equal(result, 6);
  t.end();
});

test("SHARES_REMAINING - valid all purchased", (t) => {
  const range = [[10, "", 2, 1, 2, 1]];

  const result = SHARES_REMAINING(range);

  t.equal(result, 4);
  t.end();
});

test("SHARES_REMAINING - invalid - fraction", (t) => {
  const range = [[10, "", 2.4, 1, 2, 1]];

  const result = SHARES_REMAINING(range);

  t.equal(result, "Portions not possible");
  t.end();
});

test("SHARES_REMAINING - valid - fractions cancel each other out", (t) => {
  const range = [[10, "", 2.4, 1.6, 2, 1]];

  const result = SHARES_REMAINING(range);

  t.equal(result, 3);
  t.end();
});

test("SHARES_REMAINING - invalid - over sold", (t) => {
  const range = [[10, "", 5, 4, 2, 1]];

  const result = SHARES_REMAINING(range);

  t.equal(result, "Over sold!");
  t.end();
});

test("SHARES_REMAINING - valid - sold", (t) => {
  const range = [[10, "", 5, 4, 1, ""]];

  const result = SHARES_REMAINING(range);

  t.equal(result, "Sold");
  t.end();
});
