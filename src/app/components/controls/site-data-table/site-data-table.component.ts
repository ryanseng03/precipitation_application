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

  private __selected = null;
  dataMap: any = [];
  @Input() set selected(selected: any) {
    this.__selected = selected;
    if(selected) {
      this.dataMap = this.selected2datamap();
    }
    else {
      this.dataMap = [];
    }
  };

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
    elevation_m: "Elevation (m)",
    lat: "Latitude",
    lng: "Longitude",
    ncei_id: "NCEI ID",
    nws_id: "NWS ID",
    nesdis_id: "NESDIS ID",
    scan_id: "Scan ID",
    smart_node_rf_id: "Smart Node RFID",
    value: "Value",
  }

  roundedFields = new Set(["elevation_m", "lat", "lng", "value"]);

  islandNameMap = {
    BI: "Big Island",
    OA: "Oʻahu",
    MA: "Maui",
    KA: "Kauai",
    MO: "Molokaʻi",
    KO: "Kahoʻolawe"
  }

  selected2datamap() {
    let map = [];
    const { id_field, location, ...properties } = this.__selected;
    for(let field in properties) {
      let fieldLabel = this.field2label[field] || field;
      if(field == id_field) {
        fieldLabel += " (Station ID)";
      }
      let value = this.__selected[field];
      if(value) {
        if(field == "island") {
          value = this.islandNameMap[value];
        }
        if(this.roundedFields.has(field)) {
          value = this.roundValue(value);
        }

        map.push({
          field: fieldLabel,
          value: value
        });
      }
    }
    return map;
  }

  roundValue(value: number) {
    let rounded = Math.round(value * 100) / 100;
    return rounded;
  }

}
