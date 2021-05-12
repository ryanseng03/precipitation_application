import { Component, OnInit, Input } from '@angular/core';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteValue, SiteInfo } from 'src/app/models/SiteMetadata';
import { FormControl } from '@angular/forms';
import Moment  from 'moment';
import { Dataset } from 'src/app/models/Dataset';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {
  loading: boolean = false;

  @Input() set width(width: number) {
    let minWidth = 600;
    let h2wRat = 5/9;
    let w = Math.max(minWidth, width);
    let h = w * h2wRat;
    this.graph.layout.height = h;
    this.graph.layout.width = w;
  }

  @Input() set selected(station: SiteInfo) {
    if(station) {
      this.loading = true;
      this.graph.data[0].x = [];
      this.graph.data[0].y = [];
      this.value = null;
    }
  }

  @Input() set data(data: SiteValue[]) {
    if(data) {
      this.value = data;
      this.updateGraph();
      this.loading = false;
    }
  }

  @Input() set date(date: Moment.Moment) {
    let isoDate = date.toISOString();
    this.focusedMonth = isoDate.substring(0, 7);
    this.focusedYear = isoDate.substring(0, 4);
  }

  //DATASET SHOULD HAVE ASSOCIATED TIME SERIES GRANULARITIES
  //FOR NOW HARDCODE AS DAILY

  //dates
  dates = {};
  seriesPeriods: Period[] = ["day", "month"];

  //needs day time series goes to, should switch dates in dataset to be full (down to second), have
  @Input() set range(range: [Moment.Moment, Moment.Moment]) {
    let rangeGen: Moment.Moment;
    for(let period of this.seriesPeriods) {
      let format = this.period2Format(period);
      rangeGen = Moment(range[0]);
      this.dates[period] = [];
      while(rangeGen.isBefore(range[1])) {
        rangeGen.add(1, period);
        let date = rangeGen.format(format);
        this.dates[period].push(date);
      }
    }

    let lowestPeriod = "day";

    //let rangeGen = Moment(range[0]);
    //use do while, want to capture the next group (if doing something like 5 year may surpass end)
    do {
      rangeGen.add(1, "day");
      rangeGen.month();
    }
    while(rangeGen.isBefore(range[1]))
    this.graph.data[0].y = new Array().fill(null);
  }

  @Input() minDatePeriod: "second" | "minute" | "hour" | "day" | "month" | "year";

  config = {
    responsive: true
  }

  public graph = {
    data: [
        {
          x: [],
          y: [],
          type: 'scatter',
          mode: 'lines+points',
          connectgaps: false,
          marker: {
            color: 'blue'
          }
        }
    ],
    layout: {
      width: 900,
      height: 500,
      title: 'Rainfall Station Data',
      xaxis: {
        title: {
          text: 'Date',
        },
      },
      yaxis: {
        title: {
          text: 'Rainfall (mm)',
        }
      }
    }
  };

  control = new FormControl(0);

  //need to add gaps in data when no data
  //have x axis pre-populated with dates (change when focused date changes)
  public rangeOpts = [{
    display: "Current Month",
    value: 0,
    filter: (siteValues: SiteValue[]) => {
      for(let siteValue of siteValues) {
        if(this.focusedMonth == siteValue.date.substring(0, 7)) {
          this.graph.data[0].y.push(siteValue.value);
          this.graph.data[0].x.push(siteValue.date);
        }
      }
    }
  }, {
    display: "Current Year",
    value: 1,
    filter: (siteValues: SiteValue[]) => {
      console.log(this.focusedYear, siteValues[0].date.substring(0, 4));
      for(let siteValue of siteValues) {
        if(this.focusedYear == siteValue.date.substring(0, 4)) {
          this.graph.data[0].y.push(siteValue.value);
          this.graph.data[0].x.push(siteValue.date);
        }

      }
    }
  }, {
    display: "Set Range",
    value: 2,
    filter: (siteValues: SiteValue[]) => {
      for(let siteValue of siteValues) {
        this.graph.data[0].y.push(siteValue.value);
        this.graph.data[0].x.push(siteValue.date);
      }
    }
  }];



  focusedMonth: string = "";
  focusedYear: string = "";
  value: SiteValue[] = null;

  constructor(private paramService: EventParamRegistrarService) {
    this.control.valueChanges.subscribe((value: string) => {
      this.updateGraph();
    });

    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset, (dataset: Dataset) => {
      console.log(dataset);
    });
  }

  updateGraph() {
    if(this.value != null) {
      this.graph.data[0].x = [];
      this.graph.data[0].y = [];
      let index = this.control.value;
      this.rangeOpts[index].filter(this.value);
    }

  }

  ngOnInit() {
  }




  //move to a service probably

  periodProgression = ["second", "minute", "hour", "day", "month", "year"];

  period2Format(period: Period): string {
    let format: string;
    switch(period) {
      case "day": {
        format = "YYYY-MM-DD";
        break;
      }
      case "month": {
        format = "YYYY-MM";
        break;
      }
    }
    return format;
  }

}


//service
type Period = "second" | "minute" | "hour" | "day" | "month" | "year";
