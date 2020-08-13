import { Component, OnInit } from '@angular/core';
import {EventParamRegistrarService} from "src/app/services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';
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

  testData;

  state = "collapsed";
  labelL = "Expand";
  labelR = "\u25BE";

  constructor(private paramService: EventParamRegistrarService) {
    this.siteIndex = SiteInfo.getFields();
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      
      this.site = site;
    });

    this.createTestData();
  }

  createTestData() {
    this.testData = [];
    let current = [];
    for(let i = 0; i < 200; i++) {
      if(i % 2 == 0) {
        current = [];
        this.testData.push(current);
      }
      current.push(i.toString());
    }
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
