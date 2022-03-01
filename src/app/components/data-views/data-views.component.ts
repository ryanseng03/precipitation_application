import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-data-views',
  templateUrl: './data-views.component.html',
  styleUrls: ['./data-views.component.scss']
})
export class DataViewsComponent implements OnInit {

  loading = true;
  stations: SiteInfo[];
  selectedStation: SiteInfo;




  filterControl: FormControl = new FormControl([]);
  fieldControl: FormControl = new FormControl(null);
  field2label = {
    skn: "SKN",
    name: "Name",
    observer: "Observer",
    network: "Network",
    island: "Island",
    nceiID: "NCEI ID",
    nwsID: "NWS ID",
    scanID: "Scan ID",
    smartNodeRfID: "Smart Node RFID"
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
    nceiID: new Set<string>(),
    nwsID: new Set<string>(),
    scanID: new Set<string>(),
    smartNodeRfID: new Set<string>()
  }
  unfilteredStations: SiteInfo[];
  values: string[] = [];


  getFieldData(field: string) {
    let data = [];
    if(field) {
      //console.log(this.field2Data[field]);
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

    let filterStations = () => {
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

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: SiteInfo[]) => {
      if(stations) {
        this.unfilteredStations = stations;
        for(let field in this.field2Data) {
          this.field2Data[field] = new Set<string>();
          for(let station of stations) {
            let value = station[field];
            this.field2Data[field].add(value);
          }
        }
        setTimeout(() => {
          filterStations();
        }, 0);
      }
      else {
        //propogate null to filtered stations if no station data available
        this.paramService.pushFilteredStations(stations);
      }
    });
    this.fieldControl.valueChanges.subscribe((value: string) => {
      this.filterControl.setValue([]);
      this.values = this.getFieldData(value);
    });
    this.filterControl.valueChanges.subscribe((values: string[]) => {
      filterStations();
    });




    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: SiteInfo[]) => {
      this.loading = false;
      this.stations = stations;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: SiteInfo) => {
      this.selectedStation = station;
    });
  }

  ngOnInit() {
  }

  selectStation(station: SiteInfo) {
    this.paramService.pushSelectedStation(station);
  }


}
