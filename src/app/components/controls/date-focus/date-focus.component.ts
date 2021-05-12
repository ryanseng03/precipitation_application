import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import Moment from 'moment';
import {Dataset, Timestep, FillType} from "../../../models/Dataset";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";
import {DataManagerService, MovementVector} from "../../../services/dataManager/data-manager.service";
import { MapComponent } from '../../map/map.component';

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  //@Input() dataset: Dataset;
  //@Input() map: MapComponent;
  @Input() lower: Moment.Moment;
  @Input() upper: Moment.Moment;
  @Input() timestep: string;
  @Input() initDate: Moment.Moment;
  @Output() date: EventEmitter<Moment.Moment> = new EventEmitter<Moment.Moment>();
  @Output() dateChangeInfo: EventEmitter<DateChangeInfo> = new EventEmitter<DateChangeInfo>();

  focusedDate: Moment.Moment;

  controlData = {
    monthly: {
      forward: {
        "f": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "ff": {
          tooltip: "Move forward one year",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "year", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "year");
          }
        },
        "e": {
          tooltip: "Skip to last month in range",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.setDate(this.upper);
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "ff": {
          tooltip: "Move back one year",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "year", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "year");
          }
        },
        "e": {
          tooltip: "Skip to first month in range",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "month", true) < 1;
          },
          trigger: () => {
            this.setDate(this.lower);
          }
        }
      }
    },
    daily: {
      forward: {
        "f": {
          tooltip: "Move forward one day",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "day", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "day");
          }
        },
        "ff": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "e": {
          tooltip: "Skip to last day in range",
          disabled: () => {
            return this.upper.diff(this.focusedDate, "day", true) < 1;
          },
          trigger: () => {
            this.setDate(this.upper);
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one day",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "day", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "day");
          }
        },
        "ff": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "month", true) < 1;
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "e": {
          tooltip: "Skip to first day in range",
          disabled: () => {
            return this.focusedDate.diff(this.lower, "day", true) < 1;
          },
          trigger: () => {
            this.setDate(this.lower);
          }
        }
      }
    }
  };

  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIcon("fl", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/fl_m.svg"));
    this.matIconRegistry.addSvgIcon("ffl", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/ffl_m.svg"));
    this.matIconRegistry.addSvgIcon("el", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/el_m.svg"));
    this.matIconRegistry.addSvgIcon("fr", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/fr_m.svg"));
    this.matIconRegistry.addSvgIcon("ffr", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/ffr_m.svg"));
    this.matIconRegistry.addSvgIcon("er", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/er_m.svg"));
  }

  ngOnInit() {
    this.setDate(this.initDate);
  }

  // broadcast(date: Moment.Moment, movementInfo: MovementVector) {
  //   //the loading mechanism here is sketch at best, fix this
  //   //note can't do loading here because of throttle, should create more robust loading and retreival cancel mechanisms (should also cancel old requests if a new one is submitted before load complete, just cache but don't emit)
  //   this.dataManager.getData(date, movementInfo);
  // }

  //should move this to param thing so dont have to pass through map
  setDate(date: Moment.Moment, movementInfo: MovementVector = null) {
    this.focusedDate = date;
    this.date.emit(date);
    let changeInfo: DateChangeInfo = {
      magnitude: movementInfo,
      date: date
    }
    this.dateChangeInfo.emit(changeInfo);
    //time zone things
    // date.set({
    //   hour: 0,
    //   minute:0,
    //   second:0,
    //   millisecond:0
    // });
    // date.utcOffset(0);
    //this.broadcast(date, movementInfo);
  }

  // broadcast(date: Moment.Moment, movementInfo: MovementVector) {
  //   //the loading mechanism here is sketch at best, fix this
  //   //note can't do loading here because of throttle, should create more robust loading and retreival cancel mechanisms (should also cancel old requests if a new one is submitted before load complete, just cache but don't emit)
  //   this.dataManager.getData(date, movementInfo);
  // }

  moveDate(change: number, unit: Moment.unitOfTime.DurationConstructor) {
    let magnitude = null;
    //if 0 (should never happen) just pass no magnitude (null)
    if(change != 0) {
      //note Math.sign should always return -1 or 1 unless passed a 0
      magnitude = {
        direction: <1 | -1>Math.sign(change),
        granularity: unit
      }
    }
    let movementInfo: MovementVector = magnitude;
    //add mutates date and returns old date (what a weird way of doing this)
    //doesn't work with binding properly since same object so clone, modify, then set
    let newDate = this.focusedDate.clone();
    newDate.add(change, unit);
    //verify bounds of new time and adjust to min or max
    if(newDate.diff(this.lower) < 0) {
      newDate = this.lower;
    }
    else if(this.upper.diff(newDate) < 0) {
      newDate = this.upper;
    }

    this.setDate(newDate, movementInfo);
  }

}

export interface DateChangeInfo {
  magnitude: MovementVector,
  date: Moment.Moment
}
