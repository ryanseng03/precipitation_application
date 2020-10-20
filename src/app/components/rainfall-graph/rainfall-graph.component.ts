import { Component, OnInit } from '@angular/core';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteValue, SiteInfo } from 'src/app/models/SiteMetadata';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-rainfall-graph',
  templateUrl: './rainfall-graph.component.html',
  styleUrls: ['./rainfall-graph.component.scss']
})
export class RainfallGraphComponent implements OnInit {

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
      title: 'Rainfall Site Data'
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

    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date, (date: string) => {
      this.focusedMonth = date.substring(0, 7);
      this.focusedYear = date.substring(0, 4);
      //this.setFocusedSiteFilter();
    });

    // this.siteIndex = SiteInfo.getFields();
    // paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
    //   this.focusedSiteValues = [];
    //   this.filteredFocusedSiteValues = [];
    //   this.site = site;
    // });

    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      this.graph.data[0].x = [];
      this.graph.data[0].y = [];
      this.value = null;
    });

    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSiteTimeSeries, (siteValues: SiteValue[]) => {
      //let dateFormat = /[0-9]{4}-([0-9]{2})-[0-9]{2}/;
      //filter by current selected month

      
      this.value = siteValues;
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
