import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import Moment from 'moment';
import {MatIconRegistry} from "@angular/material/icon";
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { TimeseriesData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  _timeseriesData: TimeseriesData;
  @Input() set timeseriesData(data: TimeseriesData) {
    this._timeseriesData = data;
    //trigger recompute
    if(this.controlDate) {
      this.controlDate = this.setDate.clone();
    }
  };
  @Input() initValue: Moment.Moment;
  @Output() dateChange: EventEmitter<Moment.Moment> = new EventEmitter<Moment.Moment>();

  //decouple to prevent rebound when date corrected in date component
  setDate: Moment.Moment;
  controlDate: Moment.Moment;

  controls = null;

  //NEED TO UPDATE THIS TO USE PERIODS, E.G. MOVE ONE PERIOD FOR FIRST, ONE NEXT PERIOD UP FOR SECOND (should we extend this for lower time periods?)
  //timeseriesData has all the stuff in it for validation and whatnot, need to implement using all this
  controlData = {
    month: {
      forward: [
        {
          tooltip: "Move forward one month",
          icon: "fr",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.end);
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
            return this.setDate.isSame(this._timeseriesData.end);
          },
          trigger: () => {
            console.log("year");
            this.moveDate(1, "year");
          }
        },
        {
          tooltip: "Skip to last month in range",
          icon: "er",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.end);
          },
          trigger: () => {
            this.controlDate = this._timeseriesData.end.clone();
          }
        }
      ],
      back: [
        {
          tooltip: "Skip to first month in range",
          icon: "el",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.start);
          },
          trigger: () => {
            this.controlDate = this._timeseriesData.start.clone();
          }
        },
        {
          tooltip: "Move back one year",
          icon: "ffl",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.start);
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
            return this.setDate.isSame(this._timeseriesData.start);
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
            return this.setDate.isSame(this._timeseriesData.end);
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
            return this.setDate.isSame(this._timeseriesData.end);
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
            return this.setDate.isSame(this._timeseriesData.end);
          },
          trigger: () => {
            this.controlDate = this._timeseriesData.end.clone();
          }
        }
      ],
      back: [
        {
          tooltip: "Skip to first day in range",
          icon: "el",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.start);
          },
          trigger: () => {
            this.controlDate = this._timeseriesData.start.clone();
          }
        },
        {
          tooltip: "Move back one month",
          icon: "ffl",
          disabled: false,
          checkDisabled: () => {
            return this.setDate.isSame(this._timeseriesData.start);
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
            return this.setDate.isSame(this._timeseriesData.start);
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
    let initDate = this.initValue ? this.initValue : this._timeseriesData.defaultValue;
    this.setDate = initDate;
    this.controlDate = initDate;
  }

  dateChanged(date: Moment.Moment) {
    this.setDate = date;
    //check if any controls are disabled
    this.setDisabled();
    //delay so change goes through
    setTimeout(() => {
      this.dateChange.emit(date);
    }, 0);
  }

  setDisabled() {
    let period = this._timeseriesData.period.unit;
    let controlData = this.controlData[period];
    let directions = ["forward", "back"];
    for(let direction of directions) {
      for(let control of controlData[direction]) {
        control.disabled = control.checkDisabled();
      }
    }
  }

  moveDate(change: number, unit: Moment.unitOfTime.DurationConstructor) {
    let newDate = this.setDate.clone();
    newDate.add(change, unit);
    this.controlDate = newDate;
  }

}
