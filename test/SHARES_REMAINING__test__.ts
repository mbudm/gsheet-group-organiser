import * as test from "tape";
import {
  SHARES_REMAINING,
} from "../src/buyingGroup";

const sharesAvailable = 10;

test("SHARES_REMAINING - valid empty", (t) => {
  const range = [[2, "", 2, ""]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, 6);
  t.end();
});

test("SHARES_REMAINING - valid all purchased", (t) => {
  const range = [[2, 1, 2, 1]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, 4);
  t.end();
});

test("SHARES_REMAINING - invalid - fraction", (t) => {
  const range = [[2.4, 1, 2, 1]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, "Error: Portions not possible");
  t.end();
});

test("SHARES_REMAINING - valid - fractions cancel each other out", (t) => {
  const range = [[2.4, 1.6, 2, 1]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, 3);
  t.end();
});

test("SHARES_REMAINING - invalid - over sold", (t) => {
  const range = [[5, 4, 2, 1]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, "Error: Over limit!");
  t.end();
});

test("SHARES_REMAINING - valid - sold", (t) => {
  const range = [[5, 4, 1, ""]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, "Sold");
  t.end();
});

test("SHARES_REMAINING - invalid - negative", (t) => {
  const range = [[4, 1, -2, 1]];

  const result = SHARES_REMAINING(sharesAvailable, range);

  t.equal(result, "Error: Negative amount found");
  t.end();
});
