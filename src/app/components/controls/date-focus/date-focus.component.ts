import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import Moment from 'moment';
import {MatIconRegistry} from "@angular/material/icon";
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
  @Output() dateChange: EventEmitter<Moment.Moment> = new EventEmitter<Moment.Moment>();

  controls = null;

  controlData = {
    month: {
      forward: [
        {
          tooltip: "Move forward one month",
          icon: "fr",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        {
          tooltip: "Move forward one year",
          icon: "ffr",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "year");
          }
        },
        {
          tooltip: "Skip to last month in range",
          icon: "er",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.setDate(this.upper.clone());
          }
        }
      ],
      back: [
        {
          tooltip: "Skip to first month in range",
          icon: "el",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.setDate(this.lower.clone());
          }
        },
        {
          tooltip: "Move back one year",
          icon: "ffl",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "year");
          }
        },
        {
          tooltip: "Move back one month",
          icon: "fl",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        }
      ]
    },
    day: {
      forward: [
        {
          tooltip: "Move forward one day",
          icon: "fr",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "day");
          }
        },
        {
          tooltip: "Move forward one month",
          icon: "ffr",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.moveDate(1, "month");
          }
        },
        {
          tooltip: "Skip to last day in range",
          icon: "er",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.upper);
          },
          trigger: () => {
            this.setDate(this.upper.clone());
          }
        }
      ],
      back: [
        {
          tooltip: "Skip to first day in range",
          icon: "el",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.setDate(this.lower.clone());
          }
        },
        {
          tooltip: "Move back one month",
          icon: "ffl",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "month");
          }
        },
        {
          tooltip: "Move back one day",
          icon: "fl",
          disabled: false,
          checkDisabled: () => {
            return this.date.isSame(this.lower);
          },
          trigger: () => {
            this.moveDate(-1, "day");
          }
        }
      ]
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

  dateChanged(date: Moment.Moment) {
    this.dateChange.emit(date);
    //check if any controls are disabled
    this.setDisabled();
  }

  setDisabled() {
    let period = this.period;
    let controlData = this.controlData[period];
    let directions = ["forward", "back"];
    for(let direction of directions) {
      for(let control of controlData[direction]) {
        control.disabled = control.checkDisabled();
      }
    }
  }

  //should move this to param thing so dont have to pass through map
  setDate(date: Moment.Moment) {
    this.date = date;
  }

  moveDate(change: number, unit: Moment.unitOfTime.DurationConstructor) {
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

    this.setDate(newDate);
  }

}