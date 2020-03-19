import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-data-set-selector',
  templateUrl: './data-set-selector.component.html',
  styleUrls: ['./data-set-selector.component.scss']
})
export class DataSetSelectorComponent implements OnInit {

  dataSets: string[];

  constructor() {
    this.dataSets = [
      "Daily",
      "Monthly"
    ];
  }

  ngOnInit() {
  }

}
