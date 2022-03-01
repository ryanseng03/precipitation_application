import { Injectable } from '@angular/core';
import { stat } from 'fs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class StationFilteringService {

  private filteredStations: BehaviorSubject<FilteredStations>;

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
  // preFilteredStations: Set<StationMetadata>;
  // toggledStations: Set<StationMetadata>;

  stations: StationMetadata[];


  //NOTE THAT THE OUTER OR GROUP DOES NOT WORK WELL FOR GEOGRAPHIC FILTERS (or for shapes, and for others)
  //shouldn't have to worry too much about the interface (it'll just get convoluted if you add more)
  //create extra outer and group for geographic map filters

  private group: FilterGroup<StationMetadata>;

  constructor() {
    this.filteredStations = new BehaviorSubject<FilteredStations>({
      included: [],
      excluded: []
    });
    this.group = new FilterGroup<StationMetadata>("and");
  }

  //what's the best way to handle this? for now just have everyone pass in what they want filtered
  setStations(stations: StationMetadata[]) {
    this.stations = stations;
    this.update();
  }

  // stationToggle(station: StationMetadata) {
  //   if(this.toggledStations.has(station)) {
  //     this.toggledStations.delete(station);
  //   }
  //   else {
  //     this.toggledStations.add(station);
  //   }
  // }

  getBaseGroup(): FilterGroup<StationMetadata> {
    return this.group;
  }


  //helper funct
  createPropertyFilter(options: PropertyFilterOptions): Filter<StationMetadata> {
    let filterF: (station: StationMetadata) => boolean;
    let filterProp = options.property;
    if(options.type == "discreet") {
      filterF = (station: StationMetadata) => {
        let match = false;
        let castOpts: DiscreetFilterOptions = options;
        let val = station[filterProp];
        if(val === undefined) {
          val = station.add[filterProp];
        }
        if(castOpts.values.includes(val) && !options.inverted) {
          match = true;
        }
        return match;
      }
    }
    else {
      filterF = (station: StationMetadata) => {
        let match = false;
        let castOpts: DiscreetFilterOptions = options;
        let val = station[filterProp];
        if(val === undefined) {
          val = station.add[filterProp];
        }
        //has to be inclusive at both ends because range capped at max value (should put a note of this in descriptor when added)
        if(val >= castOpts.values[0] && val <= castOpts.values[1] && !options.inverted) {
          match = true;
        }
        return match;
      }
    }
    return new Filter<StationMetadata>(filterF);
  }

  getFilteredStationsObserver(): Observable<FilteredStations> {
    return this.filteredStations.asObservable();
  }

  update() {
    let included = [];
    let excluded = [];
    for(let station of this.stations) {
      if(this.group.filter(station)) {
        included.push(station);
      }
      else {
        excluded.push(station);
      }
    }
    //what about toggles?
    this.filteredStations.next({
      included: included,
      excluded: excluded
    });
  }
}



//let's not worry about layers and stuff for now
//in the future if need efficiency can add change triggers that only go to higher layers for updates rather than redoing everything
export abstract class FilterBase<T> {
  abstract filter(item: T): boolean;
}


export class FilterGroup<T> extends FilterBase<T> {
  type: FilterType
  private filters: FilterBase<T>[]

  constructor(type: FilterType) {
    super();
    this.type = type;
    this.filters = [];
  }

  setType(type: FilterType) {
    this.type = type;
  }

  addGroup(type: FilterType, position?: number): FilterGroup<T> {
    let group = new FilterGroup<T>(type);
    this.addFilter(group, position);
    return group;
  }

  addFilterF(filterF: (item: T) => boolean, position?: number): Filter<T> {
    let filter = new Filter<T>(filterF);
    this.addFilter(filter, position);
    return filter;
  }

  addFilter(filter: FilterBase<T>, position?: number) {
    let insertPos = position;
    if(position === undefined || position > this.filters.length) {
      insertPos = this.filters.length;
    }
    else if(position < 0) {
      insertPos = 0;
    }
    this.filters.splice(insertPos, 0, filter);
  }

  removeFilter(filter: FilterBase<T>): boolean {
    let success = false;
    let i = this.filters.indexOf(filter);
    if(i >= 0) {
      this.filters.splice(i, 1);
    }
    return success;
  }

  filter(item: T): boolean {
    let match: boolean;

    if(this.type == "or") {
      match = true;
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
  readonly values: string[];
  constructor(property: string, values: string[], inverted: boolean) {
    super(property, values, inverted, "discreet");
  }
}

export class RangeFilterOptions extends PropertyFilterOptions {
  readonly values: [number, number]
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

export type FilterType = "and" | "or";
export type PropertyType = "discreet" | "range";

//type Filter = (metadta: StationMetadata) => boolean;
