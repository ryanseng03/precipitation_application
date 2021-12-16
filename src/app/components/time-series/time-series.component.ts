import { Component, OnInit, Input } from '@angular/core';
import { SiteInfo, SiteValue } from 'src/app/models/SiteMetadata';
import Moment from "moment";
import { EventParamRegistrarService, LoadingData } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss']
})
export class TimeSeriesComponent implements OnInit {

  @Input() width: number;

  loading = true;

  selected: SiteInfo;
  data: SiteValue[];
  date: Moment.Moment;

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.loading, (loadData: LoadingData) => {
      if(loadData && loadData.tag == "timeseries") {
        this.loading = loadData.loading;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stationTimeseries, (data: SiteValue[]) => {
      if(data) {
        this.data = data;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.date, (date: Moment.Moment) => {
      if(date) {
        this.date = date;
      }
    });
  }

  ngOnInit() {
  }

}
