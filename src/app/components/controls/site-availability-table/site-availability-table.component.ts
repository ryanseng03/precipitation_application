import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, RootRenderer, ChangeDetectionStrategy, AfterContentChecked, AfterContentInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';

@Component({
  selector: 'app-site-availability-table',
  templateUrl: './site-availability-table.component.html',
  styleUrls: ['./site-availability-table.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteAvailabilityTableComponent implements AfterViewInit, AfterContentInit {

  @ViewChildren("dataRows") dataRows: QueryList<ElementRef>;
  @ViewChild("tbody") tbody: ElementRef;

  sites: TableFormat;
  siteMap: Map<SiteInfo, number>;
  selected: RowRef;

  constructor(private paramService: EventParamRegistrarService, private cdr: ChangeDetectorRef) {
    this.siteMap = new Map<SiteInfo, number>();
    this.sites = {
      header: ["Site Name", "Site Network", "Site Island"],
      rows: []
    }
    paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.filteredSites, (sites: SiteInfo[]) => {
      this.sites.rows = [];
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

  generateRowMap(rows: QueryList<ElementRef>) {
    this.siteMap.clear();
    rows.forEach((row: ElementRef, i: number) => {
      let rowRef = this.sites.rows[i];
      rowRef.element = row;
      this.siteMap.set(rowRef.site, i);
    });
  }

  ngAfterViewInit() {
    console.log("viewinit");
    this.generateRowMap(this.dataRows);
    this.dataRows.changes.subscribe((rows: QueryList<ElementRef>) => {
      console.log(rows);
      this.generateRowMap(rows);
    });
    this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
      let index = this.siteMap.get(site);
      //can unfiltered elements be selected? if so remove error and just ignore
      if(index === undefined) {
        console.error(`No mapping for selected site in site table.`);
      }
      else {
        this.selectFromTable(index);
        this.cdr.detectChanges();
      }

    });
  }

  ngAfterContentInit() {

  }

  setSelected(selected: ElementRef, i: number) {
    let site = this.sites.rows[i].site;
    this.paramService.pushSiteSelect(site);
  }

  selectFromTable(rowIndex: number) {
    if(this.selected !== undefined) {
      this.selected.selected = false;
    }

    this.selected = this.sites.rows[rowIndex];
    let selectedEl = this.selected.element.nativeElement;
    let position = selectedEl.offsetTop - 30;
    let tbodyEl = this.tbody.nativeElement;
    let viewRange = [tbodyEl.scrollTop, tbodyEl.scrollTop + tbodyEl.offsetHeight];
    console.log(viewRange);
    if(position < viewRange[0] || position >= viewRange[1]) {
      tbodyEl.scrollTo(0, position);
    }
    console.log(this.selected);
    this.selected.selected = true;
  }

}

interface TableFormat {
  header: string[],
  rows: RowRef[]
}

interface RowRef {
  site: SiteInfo,
  element: ElementRef,
  selected: boolean,
  values: string[]
}

//class Two
