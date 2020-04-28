import { Component, OnInit } from '@angular/core';
import {EventParamRegistrarService} from "src/app/services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';

@Component({
  selector: 'app-site-data-table',
  templateUrl: './site-data-table.component.html',
  styleUrls: ['./site-data-table.component.scss']
})
export class SiteDataTableComponent implements OnInit {
  site: SiteInfo;
  siteIndex: string[];

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      this.site = site;
      this.siteIndex = site.getFields();
      console.log(site);
    });
  }

  ngOnInit() {
  }

}
