import { Component, OnInit, Input } from '@angular/core';
import { SiteInfo, SiteValue } from 'src/app/models/SiteMetadata';
import Moment from "moment";
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss']
})
export class TimeSeriesComponent implements OnInit {

  loading = true;

  selected: SiteInfo;
  data: SiteValue[];
  date: Moment.Moment;

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (station: SiteInfo) => {
      if(station) {
        this.loading = false;
        this.selected = station;
      }
      else {
        this.loading = true;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSiteTimeSeries, (data: SiteValue[]) => {
      //console.log(data);
      this.data = data;
    });
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date, (date: Moment.Moment) => {
      this.date = date;
    });
  }

  ngOnInit() {
  }

}
