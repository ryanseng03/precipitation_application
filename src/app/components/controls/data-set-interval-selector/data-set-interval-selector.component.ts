import { Component, EventEmitter, OnInit, Output, ViewChildren, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
//import {MatSelect} from "@angular/material/select";
import {ClassModificationService} from "../../../services/controlHelpers/class-modification.service";
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-data-set-interval-selector',
  templateUrl: './data-set-interval-selector.component.html',
  styleUrls: ['./data-set-interval-selector.component.scss']
})
export class DataSetIntervalSelectorComponent implements AfterViewInit {

  @ViewChild("timeGranularityOptions", {read: ElementRef}) timeGranularityOptions: ElementRef;
  @ViewChild("setTypeOptions", {read: ElementRef}) setTypeOptions: ElementRef;
  @ViewChild("fillOptions", {read: ElementRef}) fillOptions: ElementRef;

  //dataSets: DataSetInfoBuilder[];
  readonly initDataSet: DataSetComponents = {
    timeGranularity: "monthly",
    setType: "rainfall_1920_present",
    fill: "partial_filled"
  };
  formValues: ValidValues;
  setCoordinator: DataSetCoordinator;
  state: DataSetComponents;

  constructor(private classModifier: ClassModificationService) {
    this.formValues = {
      timeGranularity: null,
      setType: null,
      fill: null
    };

    let definitions: DataSetComponents[] = [];

    for(let fillType of ["filled", "partial_filled", "not_filled"]) {
      definitions.push({
        timeGranularity: "daily",
        setType: "rainfall_1990_present",
        fill: fillType
      });
    }
    for(let fillType of ["filled", "partial_filled"]) {
      definitions.push({
        timeGranularity: "monthly",
        setType: "rainfall_1920_present",
        fill: fillType
      });
    }

    definitions.push({
      timeGranularity: "monthly",
      setType: "rainfall_1990_present",
      fill: "not_filled"
    });

    for(let fillType of ["filled", "not_filled"]) {
      definitions.push({
        timeGranularity: "monthly",
        setType: "average_temperature_1899_present",
        fill: fillType
      });
    }
    for(let fillType of ["filled", "not_filled"]) {
      definitions.push({
        timeGranularity: "monthly",
        setType: "maximum_temperature_1899_present",
        fill: fillType
      });
    }
    for(let fillType of ["filled", "not_filled"]) {
      definitions.push({
        timeGranularity: "monthly",
        setType: "minimum_temperature_1899_present",
        fill: fillType
      });
    }

    this.setCoordinator = new DataSetCoordinator(definitions, this.initDataSet);
    let validValuesObservables: ValidValuesObservables = this.setCoordinator.getValidValuesObservables();
    for(let component in validValuesObservables) {
      validValuesObservables[component].subscribe((values: string[]) => {
        this.formValues[component] = values;
      });
    }

    //set state to setcoorrdinator state in case invalid or undefined init state
    this.state = this.setCoordinator.state;
  }

  ngAfterViewInit() {
    
  }

  setAttributes(element: ElementRef) {
    console.log(element);
    //move to back of queue so dom finished setting up and doesn't get overwritten
    setTimeout(() => {
      console.log(this.classModifier.setAttributesInAncestorWithClass(element.nativeElement, "mat-select-panel", {
        minWidth: {
          value: "180px",
        }
      }));
    }, 0);
    
  }


  valueSet(e: any, component: keyof DataSetComponents) {
    let setValue = e.value === undefined ? null : e.value;
    if(!this.setCoordinator.setComponent(component, setValue)) {
      //set internal state to match coordinator state for consistency and print error (should never happen)
      this.state = this.setCoordinator.state;
      console.error(`Invalid value set for component ${component}`);
    }

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
    timeGranularity: BehaviorSubject<Set<string>>,
    setType: BehaviorSubject<Set<string>>,
    fill: BehaviorSubject<Set<string>>
  }

  definitions: DataSetComponents[];

  setValues: DataSetComponents;

  constructor(validComponents: DataSetComponents[], defaultValues?: DataSetComponents) {
    
    this.definitions = validComponents;

    let nulledValues: DataSetComponents = {
      timeGranularity: null,
      setType: null,
      fill: null
    }
    //set to nulled values if no default set
    if(defaultValues == undefined) {
      this.setValues = nulledValues;
    }
    else {
      //copy the object to avoid issues
      this.setValues = JSON.parse(JSON.stringify(defaultValues));
      console.log(this.setValues);
      //validate and set to null if invalid (no rule specified for default state)
      if(!this.validate()) {
        this.setValues = nulledValues;
      }
    }

    //get valid component values based on provided definitions
    let initValid: ValidValues = this.getValidComponents();
    //initialize emitters with the current set of valid values based on initialization
    this.validValueSubjects = {
      timeGranularity: new BehaviorSubject<Set<string>>(initValid.timeGranularity),
      setType: new BehaviorSubject<Set<string>>(initValid.setType),
      fill: new BehaviorSubject<Set<string>>(initValid.fill)
    };
    
  }

  get state(): DataSetComponents {
    return JSON.parse(JSON.stringify(this.setValues));
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
      for(let def of this.definitions) {
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
    let validValues: ValidValues = {
      timeGranularity: new Set<string>(),
      setType: new Set<string>(),
      fill: new Set<string>()
    };

    //get non-null components in current set
    let nonNull = [];
    for(let component in this.setValues) {
      if(this.setValues[component] !== null) {
        nonNull.push(component);
      }
    }

    for(let definition of this.definitions) {
      //compare each component in the definition to the others in the current set to see if this definition is valid for the current set
      for(let component in definition) {
        let definitionValid = true;
        //only need to compare if non-null components
        for(let componentPair of nonNull) {
          //matches only validate for pairings with other components, not the identity component
          if(component != componentPair) {
            //check if component pairing matches in the definition and the current value set
            if(definition[componentPair] != this.setValues[componentPair]) {
              //definition isn't valid for this component, break out of pair comparitor loop
              definitionValid = false;
              break;
            }
    
          }
        }
        //if component pairs all matched then add the component value for this def to the valid set
        if(definitionValid) {
          validValues[component].add(definition[component]);
        }
      }
    }
    

    return validValues;
  }

  private emitValidComponents(validComponents: ValidValues): void {
    //let values: any = {};
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
      let observable = this.validValueSubjects[subject].asObservable();
      observables[subject] = observable;
    }
    return observables;
  }
}

interface ValidValues {
  timeGranularity: Set<string>,
  setType: Set<string>,
  fill: Set<string>
}

interface ValidValuesObservables {
  timeGranularity: Observable<string[]>,
  setType: Observable<string[]>,
  fill: Observable<string[]>
}

// class DataSetInfoBuilder {
//   private _components: DataSetComponents;
//   private _label: string

//   constructor(components: DataSetComponents) {
//     this._components = components;
//     this._label = this.buildLabel();
//   }

//   private buildLabel(): string {
//     let replacement = (noCap?: Set<string>) => {
//       return (match: string, boundary: string, word: string, first: string, rest: string) => {
//         let replace = match;
//         if(noCap === undefined || !noCap.has(word.toLowerCase())) {
//           replace = `${boundary}${first.toUpperCase()}${rest}`;
//         }
//         return replace;
//       }
//     };
//     let prettifyString = (s: string, noCap?: Set<string>) => {
//       let pretty = s;
//       pretty = pretty.replace(/_/g, " ");
//       pretty = pretty.replace(/(\b)((\w)(\w*))/g, replacement(noCap));
//       console.log(pretty);
//       return pretty;
//     };
//     return prettifyString(`${this._components.valueType} ${this._components.setType} (${this._components.timeRange[0]}-${this._components.timeRange[1]}), ${this._components.fill}`);
//   }

//   get label(): string {
//     return this._label;
//   }

//   get components(): DataSetComponents {
//     return JSON.parse(JSON.stringify(this._components));
//   }
// }