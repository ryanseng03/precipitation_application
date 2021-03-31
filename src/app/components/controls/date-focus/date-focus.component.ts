import { Component, OnInit, Input } from '@angular/core';
import Moment from 'moment';
import {Dataset, Timestep, FillType} from "../../../models/dataset";
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

  @Input() dataset: Dataset;
  @Input() map: MapComponent;

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

  constructor(private dataManager: DataManagerService, private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.matIconRegistry.addSvgIcon("fl", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/fl_m.svg"));
    this.matIconRegistry.addSvgIcon("ffl", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/ffl_m.svg"));
    this.matIconRegistry.addSvgIcon("el", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/el_m.svg"));
    this.matIconRegistry.addSvgIcon("fr", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/fr_m.svg"));
    this.matIconRegistry.addSvgIcon("ffr", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/ffr_m.svg"));
    this.matIconRegistry.addSvgIcon("er", this.domSanitizer.bypassSecurityTrustResourceUrl("/assets/icons/er_m.svg"));
  }

  ngOnInit() {
    this.focusedDate = this.dataset.endDate;
  }

  //should move this to param thing so dont have to pass through map
  setDate(date: Moment.Moment, movementInfo?: MovementVector) {
    if(movementInfo == undefined) {
      movementInfo = {
        baseGranularity: this.dataset.timestep,
        magnitude: null
      }
    }
    this.focusedDate = date;
    //time zone things
    date.set({
      hour: 0,
      minute:0,
      second:0,
      millisecond:0
    });
    date.utcOffset(0);
    //this.broadcast(date, movementInfo);
  }

  broadcast(date: Moment.Moment, movementInfo: MovementVector) {
    //the loading mechanism here is sketch at best, fix this
    //note can't do loading here because of throttle, should create more robust loading and retreival cancel mechanisms (should also cancel old requests if a new one is submitted before load complete, just cache but don't emit)
    this.dataManager.getData(date, movementInfo);
  }

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
    let movementInfo: MovementVector = {
      baseGranularity: this.dataset.timestep,
      magnitude: magnitude
    }
    //add mutates date and returns old date (what a weird way of doing this)
    //doesn't work with binding properly since same object so clone, modify, then set
    let newDate = this.focusedDate.clone();
    newDate.add(change, unit);
    //verify bounds of new time and adjust to min or max
    if(newDate.diff(this.dataset.startDate) < 0) {
      newDate = this.dataset.startDate;
    }
    else if(this.dataset.endDate.diff(newDate) < 0) {
      newDate = this.dataset.endDate;
    }

    this.setDate(newDate, movementInfo);
  }

}
