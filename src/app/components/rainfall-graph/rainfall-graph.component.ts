import { Component, OnInit, Input } from '@angular/core';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteValue, SiteInfo } from 'src/app/models/SiteMetadata';
import { FormControl } from '@angular/forms';
import Moment  from 'moment';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {
  loading: boolean = false;

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

  public graph = {
    data: [
        {
          x: [],
          y: [],
          type: 'scatter',
          mode: 'lines+points',
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

}
