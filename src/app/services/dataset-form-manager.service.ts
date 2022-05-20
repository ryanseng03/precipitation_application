import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {

  constructor() {

  }
}

type DatasetFormCategory = "general" | "raster" | "stations";

class DatasetFormNode {
  private _control: FormControl;
  private _description: string;
  private _category: DatasetFormCategory;
  constructor(description: string, defaultValue: string, category: DatasetFormCategory) {
    let control = new FormControl(defaultValue);
    this._control = control;
    this._description = description;
    this._category = category;
  }

  public get control(): FormControl {
      return this._control;
  }

  public get description(): string {
      return this._description;
  }

  public get category(): DatasetFormCategory {
    return this._category;
  }
}

class DatasetDisplayNode {
  includeStations: boolean;
  includeRaster: boolean;
  constructor(includeStations: boolean, includeRaster: boolean, stationForm: DatasetFormNode) {
    this.includeStations = includeStations;
    this.includeRaster = includeRaster;
  }
}

// unit: "mm",
//         dataRange: [0, 20],
//         rangeAbsolute: [true, false],
class DatasetPropertiesNode {
  constructor(unit: string, dateRange: [number, number], rangeAbsolute: [boolean, boolean]) {

  }
}

class FormValueNode {
  constructor(description: string, value: string, next: DatasetFormNode | DatasetDisplayNode | DatasetPropertiesNode) {

  }
}
