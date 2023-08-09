import { Component, OnInit } from '@angular/core';
import { MapLocation, Station, StationMetadata } from 'src/app/models/Stations';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-data-views',
  templateUrl: './data-views.component.html',
  styleUrls: ['./data-views.component.scss']
})
export class DataViewsComponent implements OnInit {

  loading = true;
  stations: Station[];
  filteredStations: Station[];
  metadata: StationMetadata[];
  selected: MapLocation;


  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.metadata, (metadata: StationMetadata[]) => {
      this.metadata = metadata;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: Station[]) => {
      this.stations = stations;
      //if stations is null won't be filtered, just propogate
      if(stations === null) {
        this.pushFiltered(stations);
      }
    });

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.filteredStations, (stations: Station[]) => {
      this.filteredStations = stations;
      this.loading = false;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedLocation, (location: MapLocation) => {
      this.selected = location;
    });

    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, () => {
      this.loading = true;
    });
  }


  ngOnInit() {
  }

  selectStation(station: Station) {
    this.paramService.pushSelectedLocation(station);
  }

  pushFiltered(stations: Station[]) {
    this.paramService.pushFilteredStations(stations);
  }
}