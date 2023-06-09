import { Component, AfterViewInit, ViewChildren, QueryList, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { ScrollbarWidthCalcService } from 'src/app/services/scrollbar-width-calc.service';
import { Station } from 'src/app/models/Stations';

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
      let formattedFields = station.format.formattedFields;
      this.tableData.rows.push({
        station: station,
        element: null,
        selected: false,
        values: [formattedFields.name, formattedFields[station.metadata.idField], formattedFields.island]
      });
    }
    //delay to give element refs time to update, then trigger station select in table if it exists
    setTimeout(() => {
      this.selected = this.selectedStation;
    }, 0);
  }

  selectedStation = null;
  @Input() set selected(station: Station) {
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
  station: Station,
  element: ElementRef,
  selected: boolean,
  values: string[]
}
