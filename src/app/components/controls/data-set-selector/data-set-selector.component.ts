import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-data-set-selector',
  templateUrl: './data-set-selector.component.html',
  styleUrls: ['./data-set-selector.component.scss']
})
export class DataSetSelectorComponent implements OnInit {

  @ViewChild("testButton") testButton;

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
