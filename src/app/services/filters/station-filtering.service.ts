import { Injectable } from '@angular/core';
import { stat } from 'fs';
import { Observable, Subject } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class StationFilteringService {

  private filteredStations: Subject<FilteredStations>;

  //can add filter prioritizations later, for now have a default behavior
  //to be included must pass through all filters

  // & filters and | filters, any filters added should be or filters, internally filters can be and, assume filters are include (exclude handled internally), so if an item MATCHES ANY filter INCLUDE it
  // filter groups handled within filter functions, if filter DOES NOT MATCH ANY filter EXCLUDE it

  //filter interface add properties in form list like had at top, add AND/OR field

  //instead do: no duplicate properties, can add additional groups to property (only OR, since and doesn't make sense for multiple filters on same property) WRONG, ONLY TRUE FOR INCLUDE MULTIPLES, EXCLUDE REVERSED

  //duplicate property default to or, else default and
  //first show properties, then create rest of interface once chosen



  //filteredStations: Subject<>;
  //set of filtered stations before appling
  preFilteredStations: Set<StationMetadata>;
  toggledStations: Set<StationMetadata>;

  stations: StationMetadata[];


  //NOTE THAT THE OUTER OR GROUP DOES NOT WORK WELL FOR GEOGRAPHIC FILTERS (or for shapes, and for others)
  //shouldn't have to worry too much about the interface (it'll just get convoluted if you add more)
  //create extra outer and group for geographic map filters

  groupData: {
    wrapper: FilterGroup<StationMetadata>,
    geographicGroup: FilterGroup<StationMetadata>,
    propertyGroup: FilterGroup<StationMetadata>,

  }

  propertyOuterGroupType: FilterType;
  propertyInnerGroupType: FilterType;



  constructor() {
    this.filteredStations = new Subject<FilteredStations>();
    this.propertyOuterGroupType = "or";
    this.propertyInnerGroupType = "and";
  }

  stationToggle(station: StationMetadata) {
    if(this.toggledStations.has(station)) {
      this.toggledStations.delete(station);
    }
    else {
      this.toggledStations.add(station);
    }
  }

  addPropertyFilter(filterF: FilterF) {

  }

  addPropertyFilter(options: PropertyFilterOptions) {
    let filterF = (station: StationMetadata) => {
      let filterProp = options.property;
      let val = station[filterProp];
      if(val === undefined) {
        val = station.add[filterProp]
      }
      if(options.type == "discreet") {

      }
    }
  }


  //return tag to reference group for abstraction
  addPropertyGroup(): string {
    let group = this.groupData.propertyGroup.addGroup(this.propertyInnerGroupType);
  }

  addGeographicFilter() {
    this.groupData.geographicGroup.addFilter();
  }

  removeFilter(filter: Filter<StationMetadata>) {

  }

  //getting the filtered stations observer then calling this will trigger an initial list to be pushed with current filters
  setStations(stations: StationMetadata[]) {

  }

  getFilteredStationsObserver(): Observable<FilteredStations> {
    return this.filteredStations.asObservable();
  }

  private update() {
    this.outerGroup
  }
}

//let's not worry about layers and stuff for now
abstract class FilterBase<T> {
  abstract filter(item: T): boolean;
}


class FilterGroup<T> extends FilterBase<T> {
  type: FilterType
  filters: FilterBase<T>[]

  constructor(type: FilterType) {
    super();
    this.type = type;
  }

  setType(type: FilterType) {
    this.type = type;
  }

  addGroup(type: FilterType, position?: number): FilterGroup<T> {
    let group = new FilterGroup<T>(type);
    this.add(group, position);
    return group;
  }

  addFilter(filterF: (item: T) => boolean, position?: number): Filter<T> {
    let filter = new Filter<T>(filterF);
    this.add(filter, position);
    return filter;
  }

  private add(filter: FilterBase<T>, position?: number) {
    let insertPos = position;
    if(position === undefined || position > this.filters.length) {
      insertPos = this.filters.length;
    }
    else if(position < 0) {
      insertPos = 0;
    }
    this.filters.splice(insertPos, 0, filter);
  }

  filter(item: T): boolean {
    let match: boolean;

    if(this.type == "or") {
      match = false;
      for(let filter of this.filters) {
        match = filter.filter(item);
        //if a match was found then break (only one has to match for 'or' type)
        if(match) {
          break;
        }
      }
    }
    else {
      match = true;
      for(let filter of this.filters) {
        match = filter.filter(item);
        //if filter did not match break (all have to match for 'and' type)
        if(!match) {
          break;
        }
      }
    }
    return match;
  }
}

export class Filter<T> extends FilterBase<T> {
  filter: (item: T) => boolean;

  constructor(filterF: (item: T) => boolean) {
    super();
    this.filter = filterF;

  }
}

type FilterF = (station: StationMetadata) => boolean;

// export interface FilterData {
//   function: (station: StationMetadata) => boolean,
//   inverted: boolean
// }

export abstract class PropertyFilterOptions {
  readonly property: string;
  readonly inverted: boolean;
  readonly type: PropertyType;
  readonly values: any;

  constructor(property: string, values: any, inverted: boolean, type: PropertyType) {
    this.property = property;
    this.inverted = inverted;
    this.type = type;
    this.values = values;
  }


}

export class DiscreetFilterOptions extends PropertyFilterOptions {
  constructor(property: string, values: string[], inverted: boolean) {
    super(property, values, inverted, "discreet");
  }
}

export class RangeFilterOptions extends PropertyFilterOptions {
  constructor(property: string, range: [number, number], inverted: boolean) {
    super(property, range, inverted, "range");
  }
}

export interface FilteredStations {
  included: StationMetadata[],
  excluded: StationMetadata[]
}

export interface StationMetadata {
  name: string,
  id: string,
  location: L.LatLng,
  add: {[prop: string]: string}
}

type FilterType = "and" | "or";
export type PropertyType = "discreet" | "range";

//type Filter = (metadta: StationMetadata) => boolean;
