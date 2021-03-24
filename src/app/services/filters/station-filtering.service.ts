import { Injectable } from '@angular/core';
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
  
  filterLayerMap

  //filteredStations: Subject<>;
  //set of filtered stations before appling
  preFilteredStations: Set<StationMetadata>
  toggledStations: Set<StationMetadata>

  stations: StationMetadata[]

  constructor() {
    this.filteredStations = new Subject<FilteredStations>();
  }

  stationToggle(station: StationMetadata) {
    if(this.toggledStations.has(station)) {
      this.toggledStations.delete(station);
    }
    else {
      this.toggledStations.add(station);
    }
  }

  //how to handle delete filters, list of filters have each maintain list of stations that match it

  //any stations in toggled station are in an opposite state from current, if the state of the station switches otherwise remove from toggled list (no longer bound to manual flip)
  addFilter(filter: Filter, type: "and" | "or"): Filter {
    return new Filter();
    // for(let station of this.stations) {
    //   //filter keeps station
    //   if(filter(station)) {
    //     //if wasnt already in set of prefiltered stations add it and delete from toggled stations if there (value changed, so not toggled anymore)
    //     if(!this.preFilteredStations.has(station)) {
    //       this.preFilteredStations.add(station);
    //       this.toggledStations.delete(station);
    //     }
    //   }
    //   //filter removed station
    //   else {
    //     //if in set of prefiltered stations remove it and delete from toggled stations if there (value changed, so not toggled anymore)
    //     if(this.preFilteredStations.has(station)) {
    //       this.preFilteredStations.delete(station);
    //       this.toggledStations.delete(station);
    //     }
    //   }
    // }
  }

  removeFilter(filter: Filter) {

  }

  //getting the filtered stations observer then calling this will trigger an initial list to be pushed with current filters
  setStations(stations: StationMetadata[]) {

  }
  
  getFilteredStationsObserver(): Observable<FilteredStations> {
    return this.filteredStations.asObservable();
  }
}

export class Filter {

}

export interface FilterOptions {
  group: string,
  function: (station: StationMetadata) => boolean,
  inverted: boolean
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

//type Filter = (metadta: StationMetadata) => boolean;
