import { Component, OnInit } from '@angular/core';
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

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites, (stations: SiteInfo[]) => {
      this.loading = false;
      this.stations = stations
    });
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (station: SiteInfo) => {
      this.selectedStation = station;
    });
  }

  ngOnInit() {
  }

  selectStation(station: SiteInfo) {
    this.paramService.pushSiteSelect(station);
  }

}
