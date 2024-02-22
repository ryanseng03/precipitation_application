import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormatData, Station, StationMetadata } from 'src/app/models/Stations';

@Component({
  selector: 'app-station-filter',
  templateUrl: './station-filter.component.html',
  styleUrls: ['./station-filter.component.scss']
})
export class StationFilterComponent implements OnInit {
  private _stations: Station[];
  private _filteredStations: Station[];
  @Input() set stations(stations: Station[]) {
    this._stations = stations;
    this.filterStations(stations, this.getFilters());
  }
  @Input() set metadata(metadata: StationMetadata[]) {
    let fieldData = {};
    let valueData: {[field: string]: {display: string, value: string}[]} = {};
    //add in numeric filters by range, for now just handle string filters
    for(let item of metadata) {
      let formatData = item.format.formatData;
      for(let formatItem of formatData) {
        if(typeof formatItem.value == "string" && formatItem.value.trim() !== "") { // Check if value is not empty
          fieldData[formatItem.field] = formatItem;
          let fieldValueData = valueData[formatItem.field];
          if(fieldValueData === undefined) {
            fieldValueData = [];
            valueData[formatItem.field] = fieldValueData;
          }
          // Check to if an item already exists, then proceeds to push to array if not.
          if(!fieldValueData.some(existingItem => existingItem.value.toLowerCase() === formatItem.value.toLowerCase())) { // Convert to lowercase
          fieldValueData.push({
            display: formatItem.formattedValue,
            value: formatItem.value
          });}
        }
      }
    }
    this.fields = Object.values(fieldData);
    this.values = valueData;
  }
  @Output() filtered: EventEmitter<Station[]> = new EventEmitter<Station[]>();
  
  filterData: FilterData[];
  fields: FormatData[];
  values: {[field: string]: {display: string, value: string}[]};

  constructor() {
    this.filterData = [];
    this.fields = [];
    this.values = {};
    this.addFilter();
  }

  ngOnInit() {
  }

  private filterStations(stations: Station[], filters: StationFilter[]) {
    this._filteredStations = stations.filter((station: Station) => {
      let include = true;
      for(let filter of filters) {
        if(!filter.match(station)) {
          include = false;
          break;
        }
      }
      return include;
    });
    this.filtered.next(this._filteredStations);
  }

  private filterAll() {
    let filters = this.filterData.reduce((acc: StationFilter[], data: FilterData) => {
      if(data.filter !== null) {
        acc.push(data.filter);
      }
      return acc;
    }, []);
    this.filterStations(this._stations, filters);
  }

  addFilter() {
    let filterData: FilterData = {
      fieldControl: new FormControl(null),
      valueControl: new FormControl([]),
      fieldSub: null,
      valueSub: null,
      filter: null
    };
    
    filterData.fieldSub = filterData.fieldControl.valueChanges.subscribe((field: string) => {
      filterData.valueControl.setValue([]);
      if(filterData.filter !== null) {
        filterData.filter.field = field;
      }
    });
    filterData.valueSub = filterData.valueControl.valueChanges.subscribe((values: string[]) => {
      if(filterData.filter === null && values.length > 0) {
        filterData.filter = new StationFilter(filterData.fieldControl.value, values);
        this.filterStations(this._filteredStations, [filterData.filter]);
      }
      else if(values.length == 0) {
        filterData.filter = null;
        this.filterAll();
      }
      else {
        filterData.filter.values = values;
        this.filterAll();
      }
    });
    this.filterData.push(filterData);
  }

  removeFilter(index: number) {
    //cleanup subs
    this.filterData[index].fieldSub.unsubscribe();
    this.filterData[index].valueSub.unsubscribe();
    //delete filter data
    this.filterData.splice(index, 1);
    //add init filter if none remaining
    if(this.filterData.length < 1) {
      this.addFilter();
    }
    this.filterAll();
  }

  clearFilters() {
    //cleanup subs
    for(let filter of this.filterData) {
      filter.fieldSub.unsubscribe();
      filter.valueSub.unsubscribe();
    }
    //reset filter data
    this.filterData = [];
    //add an intial filter form
    this.addFilter();
    this.filterAll();
  }

  private getFilters(): StationFilter[] {
    let filters: StationFilter[] = this.filterData.reduce((acc: StationFilter[], filterData: FilterData) => {
      if(filterData.filter !== null) {
        acc.push(filterData.filter);
      }
      return acc;
    }, []);
    return filters;
  }
}

interface FilterData {
  fieldControl: FormControl,
  valueControl: FormControl,
  fieldSub: Subscription,
  valueSub: Subscription,
  filter: StationFilter
}

class StationFilter {
  private _values: Set<string>;
  private _field: string;

  constructor(field: string, values: string[]) {
    this._field = field;
    this._values = new Set<string>(values);
  }

  set field(field: string) {
    this._field = field;
  }

  set values(values: string[]) {
    this._values = new Set<string>(values);
  }

  match(station: Station): boolean {
    let value = <string>station.metadata.getValue(this._field);
    return this._values.has(value);
  }
}