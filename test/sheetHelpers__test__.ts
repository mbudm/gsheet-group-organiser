import * as test from "tape";
import {
  arrayIndexToLetter,
  padData,
  padRow,
} from "../src/buyingGroup";

test("arrayIndexToLetter - A", (t) => {
  const result = arrayIndexToLetter(0);
  t.equal(result, "A");
  t.end();
});
test("arrayIndexToLetter - Z", (t) => {
  const result = arrayIndexToLetter(25);
  t.equal(result, "Z");
  t.end();
});
test("arrayIndexToLetter - AA", (t) => {
  const result = arrayIndexToLetter(26);
  t.equal(result, "AA");
  t.end();
});
test("arrayIndexToLetter - ZZ", (t) => {
  const result = arrayIndexToLetter((26 * 26) + 25);
  t.equal(result, "ZZ");
  t.end();
});

test("padRow", (t) => {
  const arr = ["some", "vals", "short"];
  const result = padRow(arr, 5);
  t.deepEqual(arr.length, 5);
  t.end();
});

test("padData", (t) => {
  const arr = [
    ["hai", "kus", "are", "eas", "y"],
    ["but", "some", "times", "they", "don't", "make", "sense"],
    ["re", "frig", "er", "a", "tor"],
  ];
  const result = padData(arr);
  t.deepEqual(result[0].length, result[1].length);
  t.deepEqual(result[2].length, result[1].length);
  t.end();
});
