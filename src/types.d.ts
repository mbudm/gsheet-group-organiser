export interface IProtection {
  sheetEditors: Array<string>;
  rangeEditors: Array<IRangeEditors>;
}
export interface IRangeEditors {
  range: Array<number>;
  editors: Array<string>;
  name: string;
}
export interface ISheetData {
  values: Array<Array<number | string>>;
  formulas: Array<IFormulas>;
}

export interface IFormulas {
  range: Array<number>;
  formulaValues: string[][];
}
