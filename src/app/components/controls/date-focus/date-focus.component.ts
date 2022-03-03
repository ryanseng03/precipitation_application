import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import Moment from 'moment';
import {MatIconRegistry} from "@angular/material/icon";
import {MovementVector} from "../../../services/dataManager/data-manager.service";
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  @Input() lower: Moment.Moment;
  @Input() upper: Moment.Moment;
  @Input() period: string;
  @Input() date: Moment.Moment;
  @Output() dateChange: EventEmitter<DateChangeInfo> = new EventEmitter<DateChangeInfo>();



  controlData = {
    month: {
      forward: {
        "f": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "ff": {
          tooltip: "Move forward one year",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "year");
          }
        },
        "e": {
          tooltip: "Skip to last month in range",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.setDate(this.upper.clone());
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "ff": {
          tooltip: "Move back one year",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "year");
          }
        },
        "e": {
          tooltip: "Skip to first month in range",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.setDate(this.lower.clone());
          }
        }
      }
    },
    day: {
      forward: {
        "f": {
          tooltip: "Move forward one day",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "day");
          }
        },
        "ff": {
          tooltip: "Move forward one month",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        "e": {
          tooltip: "Skip to last day in range",
          disabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.setDate(this.upper.clone());
          }
        }
      },
      back: {
        "f": {
          tooltip: "Move back one day",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "day");
          }
        },
        "ff": {
          tooltip: "Move back one month",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        "e": {
          tooltip: "Skip to first day in range",
          disabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.setDate(this.lower.clone());
          }
        }
      }
    }
  };

  constructor(private matIconRegistry: MatIconRegistry, private assetService: AssetManagerService) {
    let icon = assetService.getTrustedResourceURL("/icons/fl_m.svg");
    this.matIconRegistry.addSvgIcon("fl", icon);
    icon = assetService.getTrustedResourceURL("/icons/ffl_m.svg");
    this.matIconRegistry.addSvgIcon("ffl", icon);
    icon =  assetService.getTrustedResourceURL("/icons/el_m.svg");
    this.matIconRegistry.addSvgIcon("el", icon);
    icon =  assetService.getTrustedResourceURL("/icons/fr_m.svg");
    this.matIconRegistry.addSvgIcon("fr", icon);
    icon =  assetService.getTrustedResourceURL("/icons/ffr_m.svg");
    this.matIconRegistry.addSvgIcon("ffr", icon);
    icon =  assetService.getTrustedResourceURL("/icons/er_m.svg");
    this.matIconRegistry.addSvgIcon("er", icon);
  }

  ngOnInit() {
  }

  // broadcast(date: Moment.Moment, movementInfo: MovementVector) {
  //   //the loading mechanism here is sketch at best, fix this
  //   //note can't do loading here because of throttle, should create more robust loading and retreival cancel mechanisms (should also cancel old requests if a new one is submitted before load complete, just cache but don't emit)
  //   this.dataManager.getData(date, movementInfo);
  // }

  vector: MovementVector = null;

  dateChanged(date: Moment.Moment) {
    let changeInfo: DateChangeInfo = {
      magnitude: this.vector,
      date: date
    }
    this.dateChange.emit(changeInfo);
    //consume movement vector
    this.vector = null;
  }

  //should move this to param thing so dont have to pass through map
  setDate(date: Moment.Moment, movementInfo: MovementVector = null) {
    //set movemenet vector and set date in control
    this.vector = movementInfo;
    this.date = date;
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
    let movementInfo: MovementVector = magnitude;
    //add mutates date and returns old date (what a weird way of doing this)
    //doesn't work with binding properly since same object so clone, modify, then set
    let newDate = this.date.clone();
    newDate.add(change, unit);
    //verify bounds of new time and adjust to min or max
    if(newDate.isBefore(this.lower)) {
      newDate = this.lower.clone();
    }
    else if(newDate.isAfter(this.upper)) {
      newDate = this.upper.clone();
    }

    this.setDate(newDate, movementInfo);
  }

}

export interface DateChangeInfo {
  magnitude: MovementVector,
  date: Moment.Moment
}
