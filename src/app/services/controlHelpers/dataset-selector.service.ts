import { Injectable } from '@angular/core';
import {FormControl} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class DatasetSelectorService {

  constructor() { }

//   export interface DatasetConfig {
//     initialSetIndex: number,
//     datasets: any[]
// }

config: any = {
    initialSetIndex: 0,
    //categorized by type
    datasets: {
        rainfall: {
            range: {
                start: "1990-01-01",
                end: "2019-12-31"
            },
            //subclass selected automatically based on selected time range, should show what type of data will be displayed though (description of ranges)
            //if overlap then have option of which to use as default
            subclasses: {
              //used for overlap
              default: "new",
              values: {
                new: {
                  range: {
                    start: "1990-01-01",
                    end: "2019-12-31"
                  }
                },
                //what should the range on this actually be?
                legacy: {
                  range: {
                    start: "1990-01-01",
                    end: "2019-12-31"
                  }
                }
              }
            },
            controls
            timesteps: ["monthly"],
            methods: ["new"],
            timestepsAvailable: ["monthly", "daily"],
            fillTypes: ["filled", "partial", "unfilled"]
        }
    }
}

// let selectors = [];

// //generate discreet sets
// for(let dataset of config.datasets) {
//     let base = {

//     }
// }

  getDatasets(): string[] {
      return Object.keys(this.config);
  }
}

abstract class AbstractControlData {
  type: string
  control: FormControl;
  defaultValue: any;
  label: string;
  info: string;

  constructor(label: string, type: string, defaultValue: any, info?: string) {
    this.type = type;
    this.control = new FormControl();
    this.info = info;
  }
}

class SelectControl extends AbstractControlData {
  defaultValue: string;
  values: SelectorValues[];
  allowBlank: boolean;

  constructor(label: string, defaultValue: string, values: SelectorValues[], allowBlank: boolean = true, info?: string) {
    let type = "select"
    super(label, type, defaultValue, info)
    this.values = values;
    this.allowBlank = allowBlank;
  }
}

class ToggleControl extends AbstractControlData {
  defaultValue: boolean

  constructor(label: string, defaultValue: boolean, info?: string) {
    let type = "toggle"
    super(label, type, defaultValue, info)
  }
}


interface SelectorValues {
  value: string,
  label: string
}