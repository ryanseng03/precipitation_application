import { Component, OnInit, Input } from '@angular/core';
import { SiteInfo, SiteValue } from 'src/app/models/SiteMetadata';
import Moment from "moment";
import { EventParamRegistrarService, LoadingData } from 'src/app/services/inputManager/event-param-registrar.service';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss']
})
export class TimeSeriesComponent implements OnInit {

  @Input() width: number;

  selectedStation = null;
  complete = false;

  selected: SiteInfo;
  source: Subject<any>;
  date: Moment.Moment;

  constructor(private paramService: EventParamRegistrarService) {
    this.source = new Subject<any>();
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: any) => {
      this.selectedStation = station;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.loading, (loadData: LoadingData) => {
      if(loadData && loadData.tag == "timeseries") {
        this.complete = !loadData.loading;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stationTimeseries, (data: any) => {
      if(data) {
        this.source.next(data);
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.date, (date: Moment.Moment) => {
      if(date) {
        date = date.clone()
        this.date = date;
      }
    });
  }

  ngOnInit() {
  }

}
