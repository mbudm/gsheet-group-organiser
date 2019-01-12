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
  validation: IValidation[];
}

export interface IFormulas {
  range: number[];
  formulaValues: string[][];
}
export interface IValidation {
  range: number[];
  formula: string;
  helpText: string;
}
