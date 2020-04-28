import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, RootRenderer } from '@angular/core';
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';

@Component({
  selector: 'app-site-availability-table',
  templateUrl: './site-availability-table.component.html',
  styleUrls: ['./site-availability-table.component.scss']
})
export class SiteAvailabilityTableComponent implements AfterViewInit {

  @ViewChildren("dataRows") dataRows: QueryList<HTMLElement>;

  sites: TableFormat;
  siteMap: Map<SiteInfo, number>;
  selected: RowRef;

  constructor(private paramService: EventParamRegistrarService) {
    this.siteMap = new Map<SiteInfo, number>();
    this.sites = {
      header: ["Site Name", "Site Network", "Site Island"],
      rows: []
    }
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites, (sites: SiteInfo[]) => {
      for(let site of sites) {
        let values = [];
        values.push(site.name);
        values.push(site.network);
        values.push(site.island);
        this.sites.rows.push({
          site: site,
          element: null,
          selected: false,
          values: values
        });
      }
    });
  }

  ngAfterViewInit() {
    this.dataRows.changes.subscribe((rows: QueryList<HTMLElement>) => {
      this.siteMap.clear();
      rows.forEach((row: HTMLElement, i: number) => {
        let rowRef = this.sites.rows[i];
        rowRef.element = row;
        this.siteMap.set(rowRef.site, i);
      });
    });

    this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      let index = this.siteMap.get(site);
      //can unfiltered elements be selected? if so remove error and just ignore
      if(index === undefined) {
        console.error(`No mapping for selected site in site table.`);
      }
      console.log("!!!");
      this.selectFromTable(index);
    });
  }

  setSelected(selected: HTMLElement, i: number) {
    let site = this.sites.rows[i].site;
    this.paramService.pushSiteSelect(site);
  }

  selectFromTable(rowIndex: number) {
    if(this.selected !== undefined) {
      this.selected.selected = false;
    }
    
    this.selected = this.sites.rows[rowIndex];
    this.selected.selected = true;
  }

}

interface TableFormat {
  header: string[],
  rows: RowRef[]
}

interface RowRef {
  site: SiteInfo,
  element: HTMLElement,
  selected: boolean,
  values: string[]
}

//class Two
