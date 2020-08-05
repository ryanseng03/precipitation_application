import { Component, OnInit } from '@angular/core';
import Moment from 'moment';

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  dateRange = {
    min: Moment("1900-01-01T00:00:00.000Z"),
    max: Moment()
  };
  initDate = Moment("1900-02-01T00:00:00.000Z");
  timestep = "monthly";

  constructor() {
    console.log(this.initDate)
  }

  ngOnInit() {
  }

  setDate(event: any) {

  }

}
