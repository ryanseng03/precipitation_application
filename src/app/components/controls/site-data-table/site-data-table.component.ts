import { Component, Input, OnInit } from '@angular/core';
import {EventParamRegistrarService} from "src/app/services/inputManager/event-param-registrar.service";
import { SiteInfo, SiteValue } from 'src/app/models/SiteMetadata';
import {trigger, state, style, animate, transition} from "@angular/animations";
import Moment from "moment";

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

  @Input() selected: SiteInfo;

  focusedSiteValues: SiteValue[] = [];
  filteredFocusedSiteValues: SiteValue[] = [];
  focusedMonth: string = "";

  state = "collapsed";
  labelL = "Expand";
  labelR = "\u25BE";

  constructor(private paramService: EventParamRegistrarService) {
  }

  setFocusedSiteFilter() {
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

  //TEMP!!
  field2label = {
    skn: "SKN",
    name: "Name",
    observer: "Observer",
    network: "Network",
    island: "Island",
    elevation: "Elevation",
    lat: "Latitude",
    lng: "Longitude",
    nceiID: "NCEI ID",
    nwsID: "NWS ID",
    scanID: "Scan ID",
    smartNodeRfID: "Smart Node RFID",
    value: "Value",
  }

  islandNameMap = {
    BI: "Big Island",
    OA: "Oʻahu",
    MA: "Maui",
    KA: "Kauai",
    MO: "Molokaʻi",
    KO: "Kahoʻolawe"
  }
  //

  selected2datamap() {
    let map = [];
    for(let field of SiteInfo.getFields()) {
      let fieldLabel = this.field2label[field];
      let value = this.selected[field];
      if(field == "island") {
        value = this.islandNameMap[value];
      }
      if(fieldLabel) {
        map.push({
          field: fieldLabel,
          value: value
        });
      }
      //console.log(field);

    }
    return map;
  }

}
