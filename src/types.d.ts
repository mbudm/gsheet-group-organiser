export interface IProtection {
  sheetEditors: string[];
  rangeEditors: IRangeEditors[];
}
export interface IRangeEditors {
  range: number[];
  editors: string[];
  name: string;
}
export interface ISheetData {
  values: Array<Array<number | string>>;
  formulas: IFormulas[];
}

export interface IFormulas {
  range: number[];
  formulaValues: string[][];
}
