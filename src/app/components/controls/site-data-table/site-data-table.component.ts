import { Component, OnInit } from '@angular/core';
import {EventParamRegistrarService} from "src/app/services/inputManager/event-param-registrar.service";
import { SiteInfo, SiteValue } from 'src/app/models/SiteMetadata';
import {trigger, state, style, animate, transition} from "@angular/animations";

@Component({
  selector: 'app-site-data-table',
  templateUrl: './site-data-table.component.html',
  styleUrls: ['./site-data-table.component.scss'],
  animations: [
    trigger("expand", [
      state("expanded", style({
        maxHeight: "500px",
        visibility: "visible"
      })),
      state("collapsed", style({
        maxHeight: "0px",
        visibility: "hidden"
      })),
      transition('expanded <=> collapsed', [
        animate('.5s')
      ])
    ])
  ]
})
export class SiteDataTableComponent implements OnInit {
  site: SiteInfo;
  siteIndex: string[];

  focusedSiteValues: SiteValue[] = [];
  filteredFocusedSiteValues: SiteValue[] = [];
  focusedMonth: string = "";

  state = "collapsed";
  labelL = "Expand";
  labelR = "\u25BE";

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.date, (date: string) => {
      console.log(date);
      this.focusedMonth = date.substring(0, 7);
      this.setFocusedSiteFilter();
    });

    this.siteIndex = SiteInfo.getFields();
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      this.focusedSiteValues = [];
      this.filteredFocusedSiteValues = [];
      this.site = site;
    });

    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSiteTimeSeries, (siteValues: SiteValue[]) => {
      //let dateFormat = /[0-9]{4}-([0-9]{2})-[0-9]{2}/;
      //filter by current selected month
      this.focusedSiteValues = siteValues;
      this.setFocusedSiteFilter();
    });
  }

  setFocusedSiteFilter() {
    console.log(this.focusedMonth);
    console.log(this.focusedSiteValues[0]);
    this.filteredFocusedSiteValues = this.focusedSiteValues.filter((site: SiteValue) => {
      let month = site.date.substring(0, 7);
      return month == this.focusedMonth;
    });
  }


  ngOnInit() {
  }

  changeState() {
    if(this.state == "collapsed") {
      this.state = "expanded";
      this.labelL = "Collapse";
      this.labelR = "\u25B4";
    }
    else {
      this.state = "collapsed";
      this.labelL = "Expand";
      this.labelR = "\u25BE";
    }
  }

}
