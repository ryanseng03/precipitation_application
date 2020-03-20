import { Component, EventEmitter, OnInit, Output, ViewChildren, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
//import {MatSelect} from "@angular/material/select";
import {ClassModificationService} from "../../../services/controlHelpers/class-modification.service";
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-data-set-interval-selector',
  templateUrl: './data-set-interval-selector.component.html',
  styleUrls: ['./data-set-interval-selector.component.scss']
})
export class DataSetIntervalSelectorComponent implements AfterViewInit {

  dataSets: DataSetInfoBuilder[];

  @ViewChild("options", {read: ElementRef}) options;

  //@Output() panelOpen = new EventEmitter();

  constructor(private classModifier: ClassModificationService) {
    this.dataSets = [];
    for(let fillType of ["filled", "partial_filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "daily",
        setType: "rainfall",
        timeRange: ["1990", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "partial_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "monthly",
        setType: "rainfall",
        timeRange: ["1920", "present"],
        fill: fillType
      }));
    }

    this.dataSets.push(new DataSetInfoBuilder({
      valueType: "monthly",
      setType: "rainfall",
      timeRange: ["1990", "present"],
      fill: "not_filled"
    }));

    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "average",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "maximum",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
    for(let fillType of ["filled", "not_filled"]) {
      this.dataSets.push(new DataSetInfoBuilder({
        valueType: "minimum",
        setType: "temperature",
        timeRange: ["1899", "present"],
        fill: fillType
      }));
    }
  }

  ngAfterViewInit() {
    
  }

  setAttributes() {
    //move to back of queue so dom finished setting up and doesn't get overwritten
    setTimeout(() => {
      this.classModifier.setAttributesInAncestorWithClass(this.options.nativeElement, "mat-select-panel", {
        minWidth: {
          value: "180px",
        }
      });
    }, 0);

    // setTimeout(() => {
    //   this.classModifier.setAttributesInAncestorWithClass(this.options.nativeElement, "cdk-overlay-pane", {
    //     transform: {
    //       value: "none",
    //     }
    //   });
    // }, 0);


    
  }
}

// interface DataSetComponents {
//   setType: string,
//   valueType: string,
//   fill: string,
//   timeRange: [string, string]
// }

//how to break this up?
//granularity, fill, and set (including time range and type)
interface DataSetComponents {
  timeGranularity: string,
  setType: string,
  fill: string
}



class DataSetCoordinator {

  validValueSubjects: {
    timeGranularity: Subject<string[]>,
    setType: Subject<string[]>,
    fill: Subject<string[]>
  }

  definitions: DataSetComponents[];

  setValues: DataSetComponents;

  constructor(validComponents: DataSetComponents[], defaultValues?: DataSetComponents) {
    this.validValueSubjects = {
      timeGranularity: new Subject<string[]>(),
      setType: new Subject<string[]>(),
      fill: new Subject<string[]>()
    }
    this.definitions = validComponents;

    let nulledValues: DataSetComponents = {
      timeGranularity: null,
      setType: null,
      fill: null
    }
    //set to nulled values if no default set
    this.setValues = defaultValues == undefined ? nulledValues : JSON.parse(JSON.stringify(defaultValues));
    //validate and set to null if invalid (no rule specified for default state)
    if(!this.validate()) {
      this.setValues = nulledValues;
    }
  }

  validate(): boolean {
    let nonNull = [];
    let valid = false;
    for(let component in this.setValues) {
      if(this.setValues[component] !== null) {
        nonNull.push(component);
      }
    }

    if(nonNull.length == 0) {
      valid = true;
    }
    else {
      //check that non-null component combo in state matches some rule
      for(let def in this.definitions) {
        let match = true;
        for(let component of nonNull) {
          //rule does not match, set to false and break
          if(this.setValues[component] != def[component]) {
            match = false;
            break;
          }
        }
        //if found a matching rule then set valid and break, no need to keep looking
        if(match) {
          valid = true;
          break;
        }
      }
    }

    return valid;
  }

  addDefinition(validComponent: DataSetComponents): void {
    this.definitions.push(validComponent);
  }

  addDefinitions(validComponents: DataSetComponents[]): void {
    this.definitions = this.definitions.concat(validComponents);
  }

  setComponent(component: keyof DataSetComponents, value: string): boolean {
    let valid = true;
    let temp = this.setValues[component];
    this.setValues[component] = value;
    //validate change to state
    if(!this.validate()) {
      valid = false;
      //revert change
      this.setValues[component] = temp;
    }
    else {
      //get the valid values for the current state
      let validComponents: ValidValues = this.getValidComponents();
      //emit valid values
      this.emitValidComponents(validComponents);
    }
    return valid;
  }

  private getValidComponents(): ValidValues {
    return null;
  }

  private emitValidComponents(validComponents: ValidValues): void {
    let values: any = {};
    for(let component in validComponents) {
      this.validValueSubjects[component].next(validComponents[component]);
    }
  }

  getValidValuesObservables(): ValidValuesObservables {
    let observables: ValidValuesObservables = {
      timeGranularity: null,
      setType: null,
      fill: null
    }
    for(let subject in this.validValueSubjects) {
      let observable = this.validValueSubjects[subject].toObservable();
      observables[subject] = observable;
    }
    return observables;
  }
}

interface ValidValues {
  timeGranularity: string[],
  setType: string[],
  fill: string[]
}

interface ValidValuesObservables {
  timeGranularity: Observable<string[]>,
  setType: Observable<string[]>,
  fill: Observable<string[]>
}

class DataSetInfoBuilder {
  private _components: DataSetComponents;
  private _label: string

  constructor(components: DataSetComponents) {
    this._components = components;
    this._label = this.buildLabel();
  }

  private buildLabel(): string {
    let replacement = (noCap?: Set<string>) => {
      return (match: string, boundary: string, word: string, first: string, rest: string) => {
        let replace = match;
        if(noCap === undefined || !noCap.has(word.toLowerCase())) {
          replace = `${boundary}${first.toUpperCase()}${rest}`;
        }
        return replace;
      }
    };
    let prettifyString = (s: string, noCap?: Set<string>) => {
      let pretty = s;
      pretty = pretty.replace(/_/g, " ");
      pretty = pretty.replace(/(\b)((\w)(\w*))/g, replacement(noCap));
      console.log(pretty);
      return pretty;
    };
    return prettifyString(`${this._components.valueType} ${this._components.setType} (${this._components.timeRange[0]}-${this._components.timeRange[1]}), ${this._components.fill}`);
  }

  get label(): string {
    return this._label;
  }

  get components(): DataSetComponents {
    return JSON.parse(JSON.stringify(this._components));
  }
}