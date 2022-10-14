import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import moment, { Moment } from 'moment';


@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {

  constructor() {

  }
}

class DatasetFormNode {
  constructor(label: string, description: string, tag: string) {

  }
}

class DatasetFormValue {
  constructor(label: string, description: string, tag: string) {

  }
}

//use arrays for state data, allow multiples with same tag so can link items with individualized descriptions if necessary (obviously each dataset can only have one of each tag though)
//this means dataset definitions must use nodes and values not text strings, can use map for this
//can query state for specific tag
class DatasetStateManager {
  private _state: FormState;
  private _stateMap: any;
  private _fields: string[];

  constructor(fields: string[], initialState: FormState) {
    this._fields = fields;
    this._state = initialState;
    this._stateMap = {};
  }


  //use returned state to get dataset info, each dataset has its own set of form elements and controls, just fit those in to form (use manager to generate all that)
  public setNodeState(nodeTag: string, valueTag: string): Dataset {
    this._state[nodeTag] = valueTag;
    let dataset = this._correctStateAndGetDataset();
    //validate and fix state
    return dataset;
  }

  private _correctStateAndGetDataset(): Dataset {
    let tree = this._stateMap;
    for(let field of this._fields) {
      let fieldState = this._state[field];
      let next = tree[fieldState];
      //if the stored state for the field is undefined, check if this field can be excluded or fix state
      if(next === undefined) {
        //check state with field excluded (special undefined value)
        next = tree["undefined"];
        //if the subtree is still undefined the state is invalid, fix
        if(next === undefined) {
          //get first valid state from subtree keys
          let validState = Object.keys(tree)[0];
          //set state to valid state value
          this._state[field] = validState;
          //get valid subtree
          next = tree[validState];
        }
        //set the returned state for the field to special undefined tag
        else {
          fieldState = "undefined";
        }
      }
      tree = next;
    }
    //leaf of tree will be the dataset
    return tree;
  }

  public addDataset(dataset: Dataset): void {
    let state = dataset.state;
    let tree = this._stateMap;
    let treeFields = this._fields.slice(0, -1);
    let leafField = this._fields[this._fields.length - 1];
    for(let field of treeFields) {
      let mapTag = state[field] || "undefined";
      let next = tree[mapTag];
      if(next === undefined) {
        next = {};
        tree[mapTag] = next;
      }
      tree = next;
    }
    let leafTag = state[leafField] || "undefined";
    tree[leafTag] = dataset;
  }
}

type FormState = {[node: string]: string};

//note this is all vis, worry about export after
class Dataset {
  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _units: string;
  private _unitsShort: string;
  private _dataRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];
  //when select date options should emit param data for date
  private _timeseriesData: TimeseriesData | string[];
  private _requestParams: {[param: string]: string};
  private _defaultFormData: FormNode[];
  private _categorizedFormData: FormCategory[];
  private _state: FormState;


  constructor() {

  }

  get state(): {[nodeTag: string]: string} {
    return this._state;
  }
}

type UnitOfTime = "year" | "month" | "day" | "hour" | "minute" | "second";

//formatting and all that here
class TimeseriesData {
  private _start: Moment;
  private _end: Moment;
  private _unit: UnitOfTime;
  private _interval: number;

  constructor(start: Moment, end: Moment, unit: UnitOfTime, interval: number) {
    this._start = start;
    this._end = end;
    this._unit = unit;
    this._interval = interval;
  }

  addInterval(initialTime: Moment, n: number = 1): Moment {
    let result = initialTime.clone();
    result.add(n * this._interval, this._unit);
    return result;
  }

  roundToInterval(time: Moment) {
    let result = time.clone();
    //result.round(this._interval, this._unit, "round");
    return result;
  }

  getFormat(time: Moment, detail: number) {
    time = this.roundToInterval(time);
    let t: any = {};


    switch(this._unit) {
      case "year": {
        let formats = ["YYYY", "YYYY", "YYYY"]
        break;
      }
      case "month": {
        let formats = ["YYYY-MM", "MMM YYYY", "MMMM YYYY"]
        break;
      }
      case "day": {
        let formats = ["YYYY-MM-DD", "MMM DD, YYYY", "MMMM DD, YYYY"]
        break;
      }
      case "hour": {
        let formats = ["YYYY-MM-DD HH:mm:ss", "MMM DD, YYYY h:mm:ss a", "MMMM DD, YYYY h:mm:ss a"]
        break;
      }
      case "minute": {
        let formats = ["YYYY-MM-DD HH:mm:ss", "MMM DD, YYYY h:mm:ss a", "MMMM DD, YYYY h:mm:ss a"]
        break;
      }
      case "second": {
        let formats = ["YYYY-MM-DD HH:mm:ss", "MMM DD, YYYY h:mm:ss a", "MMMM DD, YYYY h:mm:ss a"]
        break;
      }
    }

    return t[this._unit][detail];
  }

}


class FormCategory {
  private _description: string;
  private _label: string;
  private _nodes: FormNode[];

  constructor(description: string, label: string, nodes: FormNode[]) {
    this._description = description;
    this._label = label;
    this._nodes = nodes;
  }

  get description(): string {
    return this._description;
  }

  get label(): string {
    return this._label;
  }

  get nodes(): FormNode[] {
    return this._nodes;
  }
}

abstract class FormNode {
  private _description: string;
  private _label: string;
  private _type: string;
  private _tag: string

  constructor(description: string, label: string, tag: string, type: string) {
    this._description = description;
    this._label = label;
    this._type = type;
    this._tag = tag;
  }
}

class ToggleFormNode extends FormNode {

}

class SelectorFormNode extends FormNode {
  constructor(description: string, label: string, tag: string, values: SelectorValue[]) {
    super(description, label, tag, "selector");
  }
}

class SelectorValue {
  private _description: string;
  private _label: string;
  private _tag: string;

  constructor(description: string, label: string, tag: string) {
    this._description = description;
    this._label = label;
    this._tag = tag;
  }

  get description(): string {
    return this._description;
  }

  get label(): string {
    return this._label;
  }

  get tag(): string {
    return this._tag;
  }
}




class FocusedTimeData {
  private _requestParams: {[param: string]: string};

}
