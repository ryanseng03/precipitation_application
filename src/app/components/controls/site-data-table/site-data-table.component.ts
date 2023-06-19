import { Component, Input, OnInit } from '@angular/core';
import { FormatData, MapLocation } from 'src/app/models/Stations';

@Component({
  selector: 'app-site-data-table',
  templateUrl: './site-data-table.component.html',
  styleUrls: ['./site-data-table.component.scss']
})
export class SiteDataTableComponent implements OnInit {
  title: string;
  data: FormatData[]
  @Input() set selected(selected: MapLocation) {
    if(selected) {
      this.data = selected.format.formatData;
    }
  };


  constructor() {

  }


  ngOnInit() {
  }

  

}
