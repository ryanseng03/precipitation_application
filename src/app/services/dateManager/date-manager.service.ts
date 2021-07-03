import { Injectable } from '@angular/core';
import { Moment } from "moment";
import { Period } from 'src/app/models/types';

@Injectable({
  providedIn: 'root'
})
export class DateManagerService {

  dateToString(date: Moment, period: Period): string {
    let format = this.periodToFormat(period);
    return date.format(format);
  }

  periodToFormat(period: Period): string {
    let dateFormat: string;
    switch(period) {
      case "second": {
        dateFormat = ":ss";
      }
      case "minute": {
        dateFormat = ":mm" + dateFormat;
      }
      case "hour": {
        //does T need to be escaped? so far not using hours, so maybe well find out in the future
        dateFormat = "THH" + dateFormat;
      }
      case "day": {
        dateFormat = "-DD" + dateFormat;
      }
      case "month": {
        dateFormat = "-MM" + dateFormat;
      }
      case "year": {
        dateFormat = "YYYY" + dateFormat;
        break;
      }
      default: {
        throw Error("Unrecognized period");
      }
    }
    return dateFormat;
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
