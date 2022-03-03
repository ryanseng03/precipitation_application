import { Injectable } from '@angular/core';
import Moment from "moment";
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

  dateToString(date: Moment.Moment, period: Period, fancy: boolean = false): string {
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
  expandDates(start: Moment.Moment, end: Moment.Moment, period: Period): Moment.Moment[] {
    let date = start.clone();
    let dates = [];
    while(date.isSameOrBefore(end)) {
      dates.push(date.clone());
      date.add(1, period);
    }
    return dates;
  }

  datesBetween(start: Moment.Moment, end: Moment.Moment, period: Period): number {
    let date = start.clone();
    let num = 0;
    while(date.isSameOrBefore(end)) {
      num++;
      date.add(1, period);
    }
    return num;
  }


  //TEMP
  getDatasetRanges() {
    let now = Moment();
    let lastMonth = now.clone().subtract(1, "month").startOf("month");
    let lastDay = now.clone().subtract(1, "day").startOf("day");
    //set end dates to previous period for everything but legacy rainfall
    let ranges = {
      rainfall: {
        day: [Moment("1990-01-01"), lastDay.clone()],
        month: [Moment("1990-01"), lastMonth.clone()]
      },
      legacy_rainfall: {
        month: [Moment("1920-01"), Moment("2012-12")]
      },
      tmin: {
        day: [Moment("1990-01-01"), lastDay.clone()],
        month: [Moment("1990-01"), Moment("2018-12")]
      },
      tmax: {
        day: [Moment("1990-01-01"), lastDay.clone()],
        month: [Moment("1990-01"), Moment("2018-12")]
      },
      tmean: {
        day: [Moment("1990-01-01"), lastDay.clone()],
        month: [Moment("1990-01"), Moment("2018-12")]
      }
    };
    return ranges;
  }

  constructor() { }
}
