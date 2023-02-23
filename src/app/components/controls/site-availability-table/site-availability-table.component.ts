import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, AfterContentInit, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';
import { ScrollbarWidthCalcService } from 'src/app/services/scrollbar-width-calc.service';

@Component({
  selector: 'app-site-availability-table',
  templateUrl: './site-availability-table.component.html',
  styleUrls: ['./site-availability-table.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteAvailabilityTableComponent implements AfterViewInit, AfterContentInit {

  @ViewChildren("dataRows") dataRows: QueryList<ElementRef>;
  @ViewChild("tbody") tbody: ElementRef;

  islandNameMap = {
    BI: "Big Island",
    OA: "Oʻahu",
    MA: "Maui",
    KA: "Kauai",
    MO: "Molokaʻi",
    KO: "Kahoʻolawe"
  }

  @Input() set stations(stations: any[]) {
    this.tableData.rows = [];
    for(let station of stations) {
      let values = [];
      values.push(station.name);
      values.push(station[station.id_field]);
      let island = this.islandNameMap[station.island];
      values.push(island);
      this.tableData.rows.push({
        station: station,
        element: null,
        selected: false,
        values: values
      });
    }
    //delay to give element refs time to update, then trigger station select in table if it exists
    setTimeout(() => {
      this.selected = this.selectedStation;
    }, 0);

  }

  selectedStation = null;
  @Input() set selected(station: SiteInfo) {
    this.selectedStation = station;
    if(station) {
      let index = this.siteMap.get(station);
      //only select if station exists in table
      if(index !== undefined) {
        this.selectFromTable(index);
        this.cdr.detectChanges();
      }
    }
    else {
      if(this.selectedRef !== undefined) {
        this.selectedRef.selected = false;
      }
      this.selectedRef = undefined;
    }

  }
  @Output() selectedChange: EventEmitter<SiteInfo> = new EventEmitter<SiteInfo>();


  tableData: TableFormat;
  siteMap: Map<SiteInfo, number>;
  selectedRef: RowRef;
  scrollbarWidth: string;

  constructor(private cdr: ChangeDetectorRef, scrollWidthService: ScrollbarWidthCalcService) {
    this.scrollbarWidth = scrollWidthService.getScrollbarWidth() + "px";
    this.siteMap = new Map<SiteInfo, number>();
    this.tableData = {
      header: ["Name", "Station ID", "Island"],
      rows: []
    }

  }

  generateRowMap(rows: QueryList<ElementRef>) {
    this.siteMap.clear();
    rows.forEach((row: ElementRef, i: number) => {
      let rowRef = this.tableData.rows[i];
      rowRef.element = row;
      this.siteMap.set(rowRef.station, i);
    });
  }

  ngAfterViewInit() {
    this.generateRowMap(this.dataRows);
    this.dataRows.changes.subscribe((rows: QueryList<ElementRef>) => {
      this.generateRowMap(rows);
    });


  }

  ngAfterContentInit() {

  }

  setSelected(selected: ElementRef, i: number) {
    let station = this.tableData.rows[i].station;
    // this.paramService.pushSiteSelect(site);
    this.selectedChange.emit(station);
  }

  selectFromTable(rowIndex: number) {
    if(this.selectedRef !== undefined) {
      this.selectedRef.selected = false;
    }

    this.selectedRef = this.tableData.rows[rowIndex];
    let selectedEl = this.selectedRef.element.nativeElement;
    let position = selectedEl.offsetTop - 30;
    let tbodyEl = this.tbody.nativeElement;
    let viewRange = [tbodyEl.scrollTop, tbodyEl.scrollTop + tbodyEl.offsetHeight];
    if(position < viewRange[0] || position >= viewRange[1]) {
      tbodyEl.scrollTo(0, position);
    }
    this.selectedRef.selected = true;
  }

}

interface TableFormat {
  header: string[],
  rows: RowRef[]
}

interface RowRef {
  station: SiteInfo,
  element: ElementRef,
  selected: boolean,
  values: string[]
}

//class Two
