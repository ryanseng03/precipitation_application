import { Component, OnInit, Input } from '@angular/core';
import Moment from 'moment';
import {Dataset, Timestep, FillType} from "../../../models/dataset";

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  @Input() dataset: Dataset;

  focusedDate: Moment.Moment;

  controlData = {
    monthly: {
      forward: {
        "f": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "ff": {
          tooltip: "Move forward one year",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "year", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "year");
          }
        },
        "e": {
          tooltip: "Skip to last month in range",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.setDate(this.dataset.endDate);
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "ff": {
          tooltip: "Move back one year",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "year", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "year");
          }
        },
        "e": {
          tooltip: "Skip to first month in range",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "month", true) < 1;
          },
          trigger: () => {
            this.setDate(this.dataset.startDate);
          }
        }
      }
    },
    daily: {
      forward: {
        "f": {
          tooltip: "Move forward one day",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "day", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "day");
          }
        },
        "ff": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "e": {
          tooltip: "Skip to last day in range",
          disabled: () => {
            return this.dataset.endDate.diff(this.focusedDate, "day", true) < 1;
          },
          trigger: () => {
            this.setDate(this.dataset.endDate);
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one day",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "day", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "day");
          }
        },
        "ff": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "e": {
          tooltip: "Skip to first day in range",
          disabled: () => {
            return this.focusedDate.diff(this.dataset.startDate, "day", true) < 1;
          },
          trigger: () => {
            this.setDate(this.dataset.startDate);
          }
        }
      }
    }
  };

  constructor() {
    console.log(this.dataset)
  }

  ngOnInit() {
    this.focusedDate = this.dataset.endDate;
  }

  setDate(date: Moment.Moment) {
    this.focusedDate = date;
  }

  moveDate(number: Moment.DurationInputArg1, unit: Moment.unitOfTime.DurationConstructor) {
    //add mutates date and returns old date (what a weird way of doing this)
    //doesn't work with binding properly since same object so clone, modify, then set
    let newDate = this.focusedDate.clone();
    newDate.add(number, unit);
    //verify bounds of new time and adjust to min or max
    if(newDate.diff(this.dataset.startDate) < 0) {
      newDate = this.dataset.startDate;
    }
    else if(this.dataset.endDate.diff(newDate) < 0) {
      newDate = this.dataset.endDate;
    }

    this.setDate(newDate);
  }

}
