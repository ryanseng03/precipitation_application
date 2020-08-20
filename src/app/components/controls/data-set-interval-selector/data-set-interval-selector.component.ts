import { Component, EventEmitter, OnInit, Output, ViewChildren, AfterViewInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
//import {MatSelect} from "@angular/material/select";
import {ClassModificationService} from "../../../services/controlHelpers/class-modification.service";
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import Moment from "moment";

export type Timestep = "monthly" | "daily";

@Component({
  selector: 'app-data-set-interval-selector',
  templateUrl: './data-set-interval-selector.component.html',
  styleUrls: ['./data-set-interval-selector.component.scss']
})
export class DataSetIntervalSelectorComponent implements OnInit {

  @ViewChild("timeGranularityOptions", {read: ElementRef}) timeGranularityOptions: ElementRef;
  @ViewChild("setTypeOptions", {read: ElementRef}) setTypeOptions: ElementRef;
  @ViewChild("fillOptions", {read: ElementRef}) fillOptions: ElementRef;

  @Output() setTimestep: EventEmitter<Timestep>;
  @Output() setDateRange: EventEmitter<[Moment.Moment, Moment.Moment]>;
  @Output() setType: EventEmitter<string>;
  @Output() setFill: EventEmitter<string>;

  //dataSets: DataSetInfoBuilder[];
  readonly initDataSet: DataSetComponents = {
    timeGranularity: "monthly",
    setType: "rainfall_1920_present",
    fill: "partial"
  };
  formValues: ValidValues;
  setCoordinator: DataSetCoordinator;
  state: DataSetComponents;
  dateRangeMap: Map<string, [Moment.Moment, Moment.Moment]>;

  constructor(private classModifier: ClassModificationService) {

    this.setTimestep = new EventEmitter<Timestep>();
    this.setDateRange = new EventEmitter<[Moment.Moment, Moment.Moment]>();
    this.setType = new EventEmitter<string>();
    this.setFill = new EventEmitter<string>();

    //create date range mapping
    this.dateRangeMap = new Map<string, [Moment.Moment, Moment.Moment]>();
    this.generateDateRangeMap();

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

    //set state to setcoordinator state in case invalid or undefined init state
    this.state = this.setCoordinator.state;
  }

  ngOnInit() {
    this.updateOutput();
  }

  setAttributes(element: ElementRef) {
    //move to back of queue so dom finished setting up and doesn't get overwritten
    setTimeout(() => {
      this.classModifier.setAttributesInAncestorWithClass(element.nativeElement, "mat-select-panel", {
        minWidth: {
          value: "180px",
        }
      });
    }, 0);

  }

  //again, time zone? All hard coded dates can be utc as long as tz set to utc
  //current date is an issue though (could be ahead)
  //lets use local timezone for current date, most user friendly
  //then just utc time and tz if hard coded for a specific time
  private generateDateRangeMap() {
    let present = Moment();

    this.dateRangeMap.set("rainfall_1990_present", [Moment("1990-01-01T00:00:00.000Z").tz("utc"), present]);
    this.dateRangeMap.set("rainfall_1920_present", [Moment("1920-01-01T00:00:00.000Z").tz("utc"), present]);

    this.dateRangeMap.set("average_temperature_1899_present", [Moment("1899-01-01T00:00:00.000Z").tz("utc"), present]);
    this.dateRangeMap.set("maximum_temperature_1899_present", [Moment("1899-01-01T00:00:00.000Z").tz("utc"), present]);
    this.dateRangeMap.set("minimum_temperature_1899_present", [Moment("1899-01-01T00:00:00.000Z").tz("utc"), present]);

  }

  private getDateRange(value: string): [Moment.Moment, Moment.Moment] {
    return value === null ? null : this.dateRangeMap.get(value);
  }

  valueSet(e: any, component: keyof DataSetComponents) {
    let setValue = e.value === undefined ? null : e.value;
    if(!this.setCoordinator.setComponent(component, setValue)) {
      //set internal state to match coordinator state for consistency and print error (should never happen)
      this.state = this.setCoordinator.state;
      console.error(`Invalid value set for component ${component}`);
    }
    // if(component == "timeGranularity") {
    //   //if null just set to daily (lowest timestep, unrestrict selection)
    //   this.setTimestep.emit(setValue);
    // }
    // if(component == "setType") {
    //   let range = this.getDateRange(setValue);
    //   this.setDateRange.emit(range);
    // }
    this.updateOutput(component);
  }

  private updateOutput(component?: keyof DataSetComponents) {
    if(component) {
      if(component == "timeGranularity") {
        this.setTimestep.emit(this.state.timeGranularity);
      }
      else if(component == "setType") {
        let range = this.getDateRange(this.state.setType);
        this.setDateRange.emit(range);
        this.setType.emit(this.state.setType);
      }
      else if(component == "fill") {
        this.setFill.emit(this.state.fill);
      }
    }
    else {
      this.setTimestep.emit(this.state.timeGranularity);
      let range = this.getDateRange(this.state.setType);
      this.setDateRange.emit(range);
      this.setFill.emit(this.state.fill);
      this.setType.emit(this.state.setType);
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
  timeGranularity: Timestep,
  setType: string,
  fill: string
}















class DataSetCoordinator {

  validValueSubjects: {
    timeGranularity: BehaviorSubject<Set<string>>,
    setType: BehaviorSubject<Set<string>>,
    fill: BehaviorSubject<Set<string>>
  }

  indexOrder = ["timeGranularity", "setType", "fill"];
  definitions: IndexedComponents;

  setValues: DataSetComponents;

  constructor(validComponents: DataSetComponents[], defaultValues?: DataSetComponents) {
    this.definitions = {};
    this.addDefinitions(validComponents);


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
    return this.validateRecursive(this.definitions, 0);
  }

  private validateRecursive(root: IndexedComponents, level: number) {
    //root doesn't exist, return false
    if(root == undefined) {
      return false;
    }
    //assign root to any type to avoid method conflicts
    let typedRoot: any = root;
    let component = this.indexOrder[level];
    let value = this.setValues[component];
    //at index leaf, root should be a set, check for existence or wildcard (null)
    if(level == this.indexOrder.length - 1) {
      return value == null || typedRoot.has(value);
    }

    if(value == null) {
      //value can be anything, chack if some path is valid
      for(value in typedRoot) {
        let next = typedRoot[value];
        if(this.validateRecursive(next, level + 1)) {
          return true;
        }
      }
      //no path was valid
      return false;
    }
    else {
      //get next root
      let next = typedRoot[value];
      return this.validateRecursive(next, level + 1);
    }
  }

  addDefinition(validComponents: DataSetComponents): void {
    this.addDefinitionRecursive(this.definitions, 0, validComponents);
  }


  addDefinitionRecursive(root: IndexedComponents, level: number, validComponents: DataSetComponents) {
    let typedRoot: any = root;
    let component = this.indexOrder[level];
    let value = validComponents[component];
    if(level < this.indexOrder.length - 2) {
      if(typedRoot[value] === undefined) {
        typedRoot[value] = {};
      }
      this.addDefinitionRecursive(typedRoot[value], level + 1, validComponents);
    }
    else if(level == this.indexOrder.length - 2) {
      if(typedRoot[value] === undefined) {
        typedRoot[value] = new Set<string>();
      }
      this.addDefinitionRecursive(typedRoot[value], level + 1, validComponents);
    }
    else {
      typedRoot.add(value);
    }
  }


  addDefinitions(validComponents: DataSetComponents[]): void {
    for(let item of validComponents) {
      this.addDefinition(item);
    }
  }

  setComponent(component: string, value: string | Timestep): boolean {
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
      timeGranularity: null,
      setType: null,
      fill: null
    };

    //current focus component
    for(let focusComponent in validValues) {
      validValues[focusComponent] = this.getValidValues(focusComponent);
    }

    return validValues;
  }

  private getValidValues(focusComponent: string): Set<string> {
    let validSet = new Set<string>();
    this.getValidValuesRecursive(this.definitions, 0, focusComponent, validSet);
    return validSet;
  }

  //go down path to the focused component then validate remainder of path and get valid focued component values
  //pass valid set as parameter ref because concatenating sets is weird
  private getValidValuesRecursive(root: IndexedComponents, level: number, focusComponent: string, validSet: Set<string>): void {
    //console.log(this.setValues);
    //root doesn't exist, path isn't valid so no valid values on path
    if(root == undefined) {
      return;
    }

    let typedRoot: any = root;
    let component = this.indexOrder[level];
    //let value = this.setValues[component];
    if(component == focusComponent) {
      //this is the last part of the index, no remaining path to validate, all items in the set are valid
      if(level == this.indexOrder.length - 1) {
        //root should be a set, add all values to valid set
        //note, for of loops may not work with sets
        typedRoot.forEach((value) => {
          validSet.add(value);
        });
      }
      //otherwise add any value with valid paths
      else {
        for(let value in typedRoot) {
          let next = typedRoot[value];
          if(this.validatePathsRecursive(next, level + 1)) {
            validSet.add(value);
          }
        }
      }
    }
    else {
      let value = this.setValues[component];
      //check if wildcard value and concat results of all paths if it is
      if(value === null) {
        for(value in typedRoot) {
          let next = typedRoot[value];
          this.getValidValuesRecursive(next, level + 1, focusComponent, validSet);
        }
      }
      else {
        let next = typedRoot[value];
        this.getValidValuesRecursive(next, level + 1, focusComponent, validSet);
      }
    }
  }


  private validatePathsRecursive(root: IndexedComponents, level: number): boolean {
    //root doesnt exist, path not valid
    if(root === undefined) {
      return false;
    }

    let typedRoot: any = root;
    let component = this.indexOrder[level];
    let value = this.setValues[component];
    let valid = true;
    //at the last part of the hierarchy, root is a set
    if(level == this.indexOrder.length - 1) {
      //console.log(typedRoot);
      //if wildcard then path is valid (valid set true by default), otherwise check that the set contains the current value
      if(value !== null) {
        valid = typedRoot.has(value);
      }
    }
    //recurse down the path
    else {
      if(value === null) {
        valid = false;
        //if value is null, then path is valid if any subpath is valid
        for(value in typedRoot) {
          let next = typedRoot[value];
          //if the path is valid then set true and break out of loop (no need to validate the rest)
          if(this.validatePathsRecursive(next, level + 1)) {
            valid = true;
            break;
          }
        }
      }
      else {
        valid = this.validatePathsRecursive(typedRoot[value], level + 1);
      }
    }
    return valid;
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





interface IndexedComponents {
  [validValues: string]: IndexedComponents | Set<string>
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


