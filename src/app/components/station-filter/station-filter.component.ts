import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
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
    let valueData = {};
    //add in numeric filters by range, for now just handle string filters
    for(let item of metadata) {
      for(let field of item.fields) {
        let value = item.getValue(field);
        if(typeof value == "string") {
          fieldData[field] = value;
          let fieldValueData = valueData[field];
          if(fieldValueData === undefined) {
            fieldValueData = [];
            valueData[field] = fieldValueData;
          }
          fieldValueData.push(value);
        }
      }
    }
    fieldData = Object.values(fieldData);
  }
  @Output() filtered: EventEmitter<Station[]> = new EventEmitter<Station[]>();
  
  filterData: FilterData[];
  fields: FormatData[];
  values: {[field: string]: FormatData};

  constructor() {
    this.filterData = [];
    this.fields = [];
    this.values = {};
    this.addFilterControls();
  }

  ngOnInit() {
  }


  clearFilters() {
    this.filterData = [];
    this.filterStations(this._stations, []);
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

  //add removal stuff too
  addFilterControls() {
    let controlData = {
      fieldControl: new FormControl(null),
      valueControl: new FormControl([]),
      filter: null
    };
    this.filterData.push(controlData);
    controlData.fieldControl.valueChanges.subscribe((data: FormatData) => {
      controlData.valueControl.setValue([]);
      if(controlData.filter !== null) {
        controlData.filter.field = data;
      }
    });
    controlData.valueControl.valueChanges.subscribe((data: FormatData[]) => {
      if(controlData.filter === null && data.length > 0) {
        controlData.filter = this.createFilter(controlData.fieldControl.value, data);
        //new filter, can just run filtered stations through it
      }
      else if(controlData.filter !== null) {
        controlData.filter.values = data;
      }
    });
  }

  private createFilter(field: FormatData, values: FormatData[]): StationFilter {
    let fieldStr = field.field;
    let valuesStr = values.map((value: FormatData) => {
      return value.value;
    });
    let filter = new StationFilter(fieldStr, valuesStr);
    return filter;
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