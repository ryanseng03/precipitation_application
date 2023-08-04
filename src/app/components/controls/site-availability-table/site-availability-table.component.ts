import { Component, AfterViewInit, ViewChildren, QueryList, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { ScrollbarWidthCalcService } from 'src/app/services/scrollbar-width-calc.service';
import { MapLocation, Station } from 'src/app/models/Stations';

@Component({
  selector: 'app-site-availability-table',
  templateUrl: './site-availability-table.component.html',
  styleUrls: ['./site-availability-table.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteAvailabilityTableComponent implements AfterViewInit {

  @ViewChildren("dataRows") dataRows: QueryList<ElementRef>;
  @ViewChild("tbody", {static: false}) tbody: ElementRef;

  @Input() set stations(stations: Station[]) {
    this.tableData.rows = [];
    for(let station of stations) {
      let formatValues = [
        station.format.getFieldFormat("name").formattedValue,
        station.format.getFieldFormat(station.metadata.idField).value,
        station.format.getFieldFormat("island").formattedValue
      ];
      this.tableData.rows.push({
        station: station,
        element: null,
        selected: false,
        values: formatValues
      });
    }
    //delay to give element refs time to update, then trigger station select in table if it exists
    setTimeout(() => {
      this.selected = this.location;
    }, 0);
  }

  location: MapLocation = null;
  @Input() set selected(location: MapLocation) {
    this.location = location;
    if(location && location.type == "station") {
      //the location is a station
      let station = <Station>location;
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
  @Output() selectedChange: EventEmitter<Station> = new EventEmitter<Station>();


  tableData: TableFormat;
  siteMap: Map<Station, number>;
  selectedRef: RowRef;
  scrollbarWidth: string;

  constructor(private cdr: ChangeDetectorRef, scrollWidthService: ScrollbarWidthCalcService) {
    this.scrollbarWidth = scrollWidthService.getScrollbarWidth() + "px";
    this.siteMap = new Map<Station, number>();
    this.tableData = {
      header: ["Name", "Station ID", "Island"],
      sortOrder: [true, true, true],
      sorted: -1,
      rows: []
    }
  }

  getSortSymbol(i: number): string {
    let symbol = "";
    if(i == this.tableData.sorted) {
      symbol = this.tableData.sortOrder[i] ? "▾" : "▴";
    }
    return symbol;
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

  sort(i: number) {
    this.tableData.rows.sort((a: RowRef, b: RowRef) => {
      let order = this.tableData.sortOrder[i];
      let sort: number = 1;
      if(a.values[i] < b.values[i]) {
        sort = -1;
      }
      if(!order) {
        sort *= -1;
      }
      return sort;
    });
    this.tableData.sortOrder[i] = !this.tableData.sortOrder[i];
    this.tableData.sorted = i;
  }
}

interface TableFormat {
  header: string[],
  sortOrder: boolean[],
  sorted: number,
  rows: RowRef[]
}

interface RowRef {
  station: Station,
  element: ElementRef,
  selected: boolean,
  values: string[]
}
