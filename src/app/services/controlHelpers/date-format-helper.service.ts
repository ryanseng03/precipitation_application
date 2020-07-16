import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatHelperService {

  dateUnit: DateUnit;

  constructor() {
    this.dateUnit = "day";
  }

  format = {
    parse: {
      dateInput: 'MM/DD/YYYY'
    },
    display: {
      dateInput: 'MM/DD/YYYY',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY',
    },
  }

  monthFormat = {
    parse: {
      dateInput: 'MM/YYYY',
    },
    display: {
      dateInput: 'MM/YYYY',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY',
    },
  };

  dayFormat = {
    parse: {
      dateInput: 'MM/DD/YYYY'
    },
    display: {
      dateInput: 'MM/DD/YYYY',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY',
    },
  }

  getDateFormat() {
    return this.format;
  }

  setDateMinUnit(unit: DateUnit) {
    this.dateUnit = unit;
    switch(unit) {
      case "day": {
        this.setAllProperties(this.dayFormat, this.format);
        break;
      }
      case "month": {
        this.setAllProperties(this.monthFormat, this.format);
        break;
      }
    }
  }

  setAllProperties(source: Object, dest: Object) {
    for(let key in source) {
      dest[key] = source[key];
    }
  }

}

export type DateUnit = "day" | "month";
