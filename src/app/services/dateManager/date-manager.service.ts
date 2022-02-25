import { Injectable } from '@angular/core';
import { Moment } from "moment";
import { Period } from 'src/app/models/types';

@Injectable({
  providedIn: 'root'
})
export class DateManagerService {
  private formats = [{
    second: "YYYY-MM-DD[T]HH:mm:ss",
    minute: "YYYY-MM-DD[T]HH:mm",
    hour: "YYYY-MM-DD[T]HH",
    day: "YYYY-MM-DD",
    month: "YYYY-MM",
    year: "YYYY"
  },
  {
    second: "MMMM DD YYYY h:mm:ss a",
    minute: "MMMM DD YYYY h:mm a",
    hour: "MMMM DD YYYY h a",
    day: "MMMM DD YYYY",
    month: "MMMM YYYY",
    year: "YYYY"
  }];

  private periodPrecedent = ["second", "minute", "hour", "day", "month", "year"]

  getPeriodOffset(period: Period, offset: number) {
    let offsetPeriod = null;
    let periodIndex = this.periodPrecedent.indexOf(period);
    let offsetIndex = periodIndex + offset;
    if(periodIndex >= 0 && offsetIndex < this.periodPrecedent.length) {
      offsetPeriod = this.periodPrecedent[offsetIndex];
    }
    return offsetPeriod;
  }

  getHigherPeriods(period: Period) {
    let higherPeriods = [];
    let periodIndex = this.periodPrecedent.indexOf(period);
    if(periodIndex >= 0) {
      higherPeriods = this.periodPrecedent.slice(periodIndex + 1);
    }
    return higherPeriods;
  }

  dateToString(date: Moment, period: Period, fancy: boolean = false): string {
    let format = this.periodToFormat(period, fancy);
    return date.format(format);
  }

  periodToFormat(period: Period, fancy: boolean = false): string {
    let index = 0;
    if(fancy) {
      index = 1;
    }
    return this.formats[index][period];
  }

  //inclusive
  expandDates(start: Moment, end: Moment, period: Period): Moment[] {
    let date = start.clone();
    let dates = [];
    while(date.isSameOrBefore(end)) {
      dates.push(date.clone());
      date.add(1, period);
    }
    return dates;
  }

  datesBetween(start: Moment, end: Moment, period: Period): number {
    let date = start.clone();
    let num = 0;
    while(date.isSameOrBefore(end)) {
      num++;
      date.add(1, period);
    }
    return num;
  }

  constructor() { }
}
