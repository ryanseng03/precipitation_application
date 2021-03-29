import { Component, OnInit } from '@angular/core';
import { FilterOptions, StationFilteringService, StationMetadata } from 'src/app/services/filters/station-filtering.service';
import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag} from '@angular/cdk/drag-drop';
import { MetadataStoreService, SKNRefMeta } from 'src/app/services/dataLoaders/dataRequestor/auxillary/siteManagement/metadata-store.service';
// import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
// import { SiteInfo } from 'src/app/models/SiteMetadata';
import * as L from "leaflet";
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-station-property-filters',
  templateUrl: './station-property-filters.component.html',
  styleUrls: ['./station-property-filters.component.scss']
})
export class StationPropertyFiltersComponent implements OnInit {
  groupCount = 0;

  stations: StationMetadata[];

  orGroups: OrGroupData[] = [];

  //should be replaced with metadata descriptor
  //should add special field for value in objects
  propertyTypes = {
    discreet: ["skn", "name", "observer", "network", "island", "nceiID", "nwsID", "scanID", "smartNodeRfID"],
    range: ["elevation", "lat", "lng"]
  }

  availableProperties: Set<string>;
  propertyData: PropertyData;

  testMove() {
    console.log("exit!");
  }


  constructor(private filterService: StationFilteringService, private metaService: MetadataStoreService) {
    this.stations = [];
    this.availableProperties = new Set<string>();

    //TEMP--------------------------------------------------------------

    //note this is going to change
    metaService.getMetaBySKNs(null).then((metadataRef: SKNRefMeta) => {
      let properties = Object.keys(metadataRef[Object.keys(metadataRef)[0]].meta);
      console.log(properties);
      for(let skn in metadataRef) {
        let metadata = metadataRef[skn];
        let stationForm: StationMetadata = {
          id: skn,
          location: L.latLng(metadata.lat, metadata.lng),
          name: metadata.name,
          add: {}
        }
        for(let prop of properties) {
          //wow this is sketch
          if(!["lat", "lng", "skn", "name"].includes(prop)) {
            stationForm.add[prop] = metadata[prop];
          }
        }
        this.stations.push(stationForm);
      }

      // let propertySet: Property[] = [];
      // for(let prop of this.propertyTypes.discreet) {
      //   propertySet.push(new DiscreetPropertyData(prop, prop, ["test", "test2"]));
      // }
      // for(let prop of this.propertyTypes.range) {
      //   propertySet.push(new RangePropertyData(prop, prop, [1, 2]));
      // }
      // this.propertyData = new PropertyData(propertySet);

      console.log(this.stations);

      filterService.setStations(this.stations);
    });

    let propertySet: Property[] = [];
    for(let prop of this.propertyTypes.discreet) {
      propertySet.push(new DiscreetPropertyData(prop, prop, ["test", "test2"]));
    }
    for(let prop of this.propertyTypes.range) {
      propertySet.push(new RangePropertyData(prop, prop, [1, 2]));
    }
    this.propertyData = new PropertyData(propertySet);

    //------------------------------------------------------------------

    //add initial or group
    this.addOrGroup();

  }


  orGroupsAtLeastOne() : boolean{
    let allAtLeastOne = true;
    for(let orGroup of this.orGroups) {
      if(!orGroup.hasOneFilter()) {
        allAtLeastOne = false;
        break;
      }
    }
    return allAtLeastOne;
  }


  addOrGroup() {
    let groupLabel = `group_${this.groupCount++}`;
    let group = new OrGroupData(this.propertyData, groupLabel);
    //add initial filter
    group.addFilter();
    this.orGroups.push(group);
  }

  removeOrGroup(group: OrGroupData) {
    group.cleanup();
    let groupIndex = this.orGroups.indexOf(group);
    if(groupIndex >= 0) {
      this.orGroups.splice(groupIndex, 1);
    }
  }

  ngOnInit() {
  }



}

class OrGroupData {
  groupLabel: string;
  propertyData: PropertyData;
  filters: FilterFormData[];

  constructor(propertyData: PropertyData, label: string) {
    this.propertyData = propertyData;
    this.groupLabel = label;
    this.filters = [];
  }

  hasOneFilter(): boolean {
    let hasFilter = false;
    for(let filter of this.filters) {
      if(filter.propertySet()) {
        hasFilter = true;
        break;
      }
    }
    return hasFilter;
  }

  allFiltersHaveProperty(): boolean {
    let allHaveProperty = true;
    for(let filter of this.filters) {
      if(!filter.propertySet()) {
        allHaveProperty = false;
        break;
      }
    }
    return allHaveProperty
  }

  addFilter(): void {
    let filter = new FilterFormData(this.propertyData);
    this.filters.push(filter);
  }

  moveFilter(event: CdkDragDrop<FilterFormData[]>): void {
    console.log(event);
    if(event.previousContainer == event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  removeFilter(filter: FilterFormData): void {
    //!important to maintain state
    filter.cleanup();
    let index = this.filters.indexOf(filter);
    this.filters.splice(index, 1);
  }

  //NEED TO RUN THIS WHEN DELETE GROUP TO CLEANUP FILTERS
  cleanup() {
    for(let filter of this.filters) {
      filter.cleanup();
    }
  }

  predicate(): (item: CdkDrag<FilterFormData>) => boolean {
    //need to bind function to context so use return function bound to this
    let _predicate = (item: CdkDrag<FilterFormData>) => {
      let predicate = true;
      let filter = item.data;
      let selectedProperty = filter.getSelectedProperty();
      //if property hasn't been selected yet then allow transition
      if(selectedProperty) {
        let type = selectedProperty.type;
        //if range then can go anywhere, only limit discreet
        if(type == "discreet") {
          //check if current set of filters contains a filter with the same property
          for(let otherFilter of this.filters) {
            let otherProperty = otherFilter.getSelectedProperty();
            if(otherProperty && otherProperty.name == selectedProperty.name) {
              predicate = false;
              break;
            }
          }
        }
      }
      return predicate;
    }

    return _predicate.bind(this);

  }


}

class FilterFormData {
  controls: {
    propertyControl: FormControl,
    valueControl: FormControl,
    invertControl: FormControl
  };
  private propertyData: PropertyData;
  private invertState: StateInstance;
  private setProperty: Property;

  constructor(propertyData: PropertyData) {
    this.controls = {
      propertyControl: new FormControl(null),
      valueControl: new FormControl(null),
      invertControl: new FormControl(null)
    }
    this.propertyData = propertyData;
    this.invertState = null;

    this.controls.propertyControl.valueChanges.subscribe((value: Property) => {
      //cleanup filter with previous property
      this.cleanup();
      this.setProperty = value;
      //reset invertState to null to avoid triggering attempt to remove old state when setting invert control
      this.invertState = null;
      let validStates = value.validStates();
      //sanity check, this property should not be able to be set if there are no valid states
      if(validStates.length == 0) {
        throw new Error("Sanity check failed. No valid states in property");
      }
      //if only one valid state then set to that
      else if(validStates.length == 1) {
        let state = validStates[0];
        let invertValue = this.state2inverted(state);
        this.controls.invertControl.setValue(invertValue);
      }
      else {
        //default to normal (not inverted)
        this.controls.invertControl.setValue(false);
      }
      this.controls.valueControl.setValue([]);
    });

    this.controls.invertControl.valueChanges.subscribe((value: boolean) => {
      //if not null then state has been set, remove state from property since not used anymore
      if(this.invertState) {
        this.setProperty.removeState(this.invertState);
      }
      //set the new state and add to the property
      this.invertState = this.inverted2state(value);
      this.setProperty.addState(this.invertState);

      //NEED TO OUTPUT TO FILTER
    });

    this.controls.valueControl.valueChanges.subscribe((value: any[]) => {
      //what is the type for value?
      //OUTPUT TO FILTER
    });
  }

  //need full properties, this is probably useless
  // getPropertyValues(): string[] {
  //   let availableProperties = this.propertyData.getAvailableProperties();
  //   let propertyLabels = availableProperties.map((property: Property) => {
  //     return property.label;
  //   });
  //   return propertyLabels;
  // }

  getProperties(): Property[] {
    let properties = this.propertyData.getAvailableProperties();
    //if property is set and the current set property isn't available (all cases exhausted) still need to include in this list
    if(this.setProperty && !properties.includes(this.setProperty)) {
      properties.unshift(this.setProperty);
    }
    return properties;
  }

  getValues(): any {
    let values = [];
    if(this.setProperty) {
      values = this.setProperty.getValues();
    }
    return values;
  }

  propertySet(): boolean {
    return this.controls.propertyControl.value != null;
  }

  //this may change dynamically based on outside factors so need to recompute every time, though initial value enforcement is only needed when property set so can be done once
  invertControlLocked(): boolean {
    let locked = true;
    //inverted shouldn't be null if property set, but check just in case
    if(this.setProperty && this.invertState !== null) {
      let validStates = this.setProperty.validStates();
      //if any valid state exists that is not the current state then unlock
      for(let validState of validStates) {
        if(validState != this.invertState) {
          locked = false;
          break;
        }
      }
    }
    return locked;
  }

  getSelectedProperty(): Property {
    return this.controls.propertyControl.value;
  }

  //MUST CALL THIS BEFORE DELETING FILTER TO MAINTAIN VALID STATE
  cleanup() {
    if(this.setProperty && this.invertState !== null) {
      this.setProperty.removeState(this.invertState);
    }
    //ALSO NEED TO REMOVE FILTER FROM FILTER SERVICE
  }

  // getInvertState(): StateInstance {
  //   return this.controls.invertControl.value ? "inverted" : "normal";
  // }

  private state2inverted(state: StateInstance): boolean {
    return state == "inverted" ? true : false;
  }

  private inverted2state(inverted: boolean): StateInstance {
    return inverted ? "inverted" : "normal";
  }

}


class PropertyData {
  private properties: Property[];

  constructor(properties: Property[]) {
    this.properties = properties;
  }

  getAvailableProperties(): Property[] {
    let available = [];
    for(let property of this.properties) {
      if(property.hasValidState()) {
        available.push(property);
      }
    }
    return available;
  }


}

abstract class Property {
  name: string;
  type: PropertyType;
  label: string;
  values: any;

  constructor(type: PropertyType, name: string, label: string, values: any) {
    this.type = type;
    this.label = label;
    this.name = name;
    this.values = values;
  }

  abstract validStates(): StateInstance[];
  abstract hasValidState(): boolean;
  abstract addState(state: StateInstance): void;
  abstract removeState(state: StateInstance): void;
  abstract getValues(): any;
}

class DiscreetPropertyData extends Property {
  validStatesList: StateInstance[];

  constructor(name: string, label: string, values: string[]) {
    super("discreet", name, label, values);
    this.validStatesList = ["normal", "inverted"];
  }

  validStates(): StateInstance[] {
    return this.validStatesList;
  }

  hasValidState(): boolean {
    return this.validStatesList.length > 1;
  }

  addState(state: StateInstance): void {
    //can only have one from each state, so when state added remove from valid states list
    let index = this.validStatesList.indexOf(state);
    //sanity check, state should be in list
    if(index < 0) {
      throw new Error("Adding invalid state");
    }
    this.validStatesList.splice(index, 1);
  }


  removeState(state: StateInstance): void {
    console.log(this.name);
    //add back to valid state list
    //sanity check, the list should not contain the state already
    if(this.validStatesList.includes(state)) {
      throw new Error("Removing state that has not been added");
    }
    this.validStatesList.push(state);
  }

  getValues(): string[] {
    //needs to be compatible with mat-select-autocomplete, so wrap each in {name: string, value: string} objects
    let values = this.values.map((value: string) => {
      return {
        display: value,
        value: value
      };
    });
    return values;
  }
}

class RangePropertyData extends Property {

  constructor(name: string, label: string, range: [number, number]) {
    super("range", name, label, range);
  }

  validStates(): StateInstance[] {
    //always return both states
    return ["normal", "inverted"];
  }

  hasValidState(): boolean {
    //always true, can add any as many times as like
    return true;
  }

  addState(state: StateInstance): void {
    //nothing to be done, doesn't matter what states are aded
    return;
  }

  removeState(state: StateInstance): void {
    //doesn't matter
    return;
  }

  getValues(): [number, number] {
    return this.values;
  }
}

type StateInstance = "normal" | "inverted";
type PropertyType = "discreet" | "range";
