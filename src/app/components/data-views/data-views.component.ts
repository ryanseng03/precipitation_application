import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Moment } from 'moment';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import { VisDatasetItem, FocusData } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-data-views',
  templateUrl: './data-views.component.html',
  styleUrls: ['./data-views.component.scss']
})
export class DataViewsComponent implements OnInit {

  loading = true;
  stations: SiteInfo[] = null;
  selectedStation: any;
  unit: string;

  filterControl: FormControl = new FormControl([]);
  fieldControl: FormControl = new FormControl(null);
  field2label = {
    skn: "SKN",
    name: "Name",
    observer: "Observer",
    network: "Network",
    island: "Island",
    ncei_id: "NCEI ID",
    nws_id: "NWS ID",
    scan_id: "Scan ID",
    smart_node_rf_id: "Smart Node RFID"
  }
  islandNameMap = {
    BI: "Big Island",
    OA: "Oʻahu",
    MA: "Maui",
    KA: "Kauai",
    MO: "Molokaʻi",
    KO: "Kahoʻolawe"
  }
  fieldData = [];
  field2Data = {
    skn: new Set<string>(),
    name: new Set<string>(),
    observer: new Set<string>(),
    network: new Set<string>(),
    island: new Set<string>(),
    ncei_id: new Set<string>(),
    nws_id: new Set<string>(),
    scan_id: new Set<string>(),
    smart_node_rf_id: new Set<string>()
  }
  unfilteredStations: SiteInfo[] = null;
  values: string[] = [];


  getFieldData(field: string) {
    let data = [];
    if(field) {
      data = Array.from(this.field2Data[field]);
      data = data.map((value: string) => {
        let label = value;
        if(field == "island") {
          label = this.islandNameMap[value];
        }
        return {
          value: value,
          display: label
        }
      });
    }
    return data;
  }

  clearFilter() {
    this.fieldControl.setValue(null);
  }

  filterStations() {
    let values: string = this.filterControl.value;
    let filteredStations = this.unfilteredStations;
    let field = this.fieldControl.value;
    if(values.length > 0 && field) {
      filteredStations = this.unfilteredStations.filter((station: SiteInfo) => {
        let value = station[field];
        let inFilter = values.includes(value);
        return inFilter;
      });
    }
    this.paramService.pushFilteredStations(filteredStations);
  }

  constructor(private paramService: EventParamRegistrarService) {
    for(let field in this.field2label) {
      let fieldData = {
        label: this.field2label[field],
        value: field
      };
      this.fieldData.push(fieldData);
    }
    //reset
    this.fieldData.push({
      label: "",
      value: null
    });

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: SiteInfo[]) => {
      if(stations) {
        this.unfilteredStations = stations;
        for(let field in this.field2Data) {
          this.field2Data[field] = new Set<string>();
          for(let station of stations) {
            let value = station[field];
            if(value) {
              this.field2Data[field].add(value);
            }
          }
        }
        this.filterStations();
      }
      else {
        //propogate null to filtered stations if no station data available
        this.paramService.pushFilteredStations(null);
      }
    });





    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: SiteInfo[]) => {
      this.loading = false;
      this.stations = stations;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: SiteInfo) => {
      this.selectedStation = station;
    });

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        this.unit = dataset.unitsShort;
        this.clearFilter();
      }
    });

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, (focus: FocusData<unknown>) => {
      this.loading = true;
    });
  }

  ngOnInit() {
    this.fieldControl.valueChanges.subscribe((value: string) => {
      this.filterControl.setValue([]);
      this.values = this.getFieldData(value);
    });
    this.filterControl.valueChanges.subscribe((values: string[]) => {
      this.filterStations();
    });
  }

  selectStation(station: SiteInfo) {
    this.paramService.pushSelectedStation(station);
  }


}
