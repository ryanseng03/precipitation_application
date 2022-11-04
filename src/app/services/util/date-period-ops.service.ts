import { Injectable } from '@angular/core';
import * as Moment from 'moment';
import { UnitOfTime } from '../dataset-form-manager.service';

@Injectable({
  providedIn: 'root'
})
export class DatePeriodOpsService {

  periodProgression: UnitOfTime[] = ["second", "minute", "hour", "day", "month", "year"];

  constructor() { }

  date2String(date: Moment.Moment, period: UnitOfTime, expand: number): string {
    let formats = [{
      year: "YYYY",
      month: "YYYY-MM",
      day: "YYYY-MM-DD",
      default: "YYYY-MM-DDThh:mm:ss"
    }, {
      year: "YYYY",
      month: "MMM YYYY",
      day: "MMM DD YYYY",
      default: "MMM DD YYYY h:mm:ss"
    }, {
      year: "YYYY",
      month: "MMMM YYYY",
      day: "MMMM DD YYYY",
      default: "MMMM DD YYYY h:mm:ss"
    }];

    let base = formats[expand];
    let format = base[period] || base.default;
    let dateString = date.format(format);
    return dateString;
  }

  getRelativePeriod(relative: UnitOfTime, diff: number): UnitOfTime {
    let newPeriod = null;
    let relativeIndex = this.periodProgression.indexOf(relative);
    let newIndex = relativeIndex + diff;
    if(newIndex >= 0 && newIndex < this.periodProgression.length) {
      newPeriod = this.periodProgression[newIndex];
    }
    return newPeriod;
  }
}

