import { Component, EventEmitter, OnInit, ViewChild, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService, DateUnit} from "../../../services/controlHelpers/date-format-helper.service";
import {FormControl} from '@angular/forms';
import {MatCalendarHeader, MatDatepicker} from "@angular/material/datepicker";
import Moment from "moment";
import { map } from 'rxjs/operators';

export let dateFormatFactory = (formatHelper: DateFormatHelperService) => {
  return formatHelper.getDateFormat();
}

@Component({
  selector: 'app-date-selector',
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.scss'],
  providers: [{
      provide: MAT_DATE_FORMATS,
      useFactory: dateFormatFactory,
      deps: [DateFormatHelperService]
    }]
})
export class DateSelectorComponent implements OnInit, OnChanges {

  @ViewChild("datePicker") datePicker;

  lastValidValue: Moment.Moment;

  _min: Moment.Moment = null;
  _max: Moment.Moment = null;

  @Input() label: string;
  @Input()
  set min(date: Moment.Moment) {
    this._min = date;
  }
  @Input()
  set max(date: Moment.Moment) {
    this._max = date;
  }

  @Input()
  set date(date: Moment.Moment) {
    this.dateControl.setValue(date);
    this.setDate();
  }
  @Output() dateChange: EventEmitter<Moment.Moment> = new EventEmitter<Moment.Moment>();

  @Input() period: string;

  @Input() readonly: boolean = false;

  //set up initial form control starting with null value
  dateControl: FormControl = new FormControl(null);

  constructor(private dateFormat: DateFormatHelperService) {
    //override the dumb default method that switches to random things and make it go up one level
    MatCalendarHeader.prototype.currentPeriodClicked = function () {
      switch(this.calendar.currentView) {
        case "year": {
          this.calendar.currentView = "multi-year";
          break;
        }
        case "month": {
          this.calendar.currentView = "year";
        }
      }
    };
  }

  setDate() {
    let value = this.dateControl.value;
    if(value) {
      this.lastValidValue = value;
      this.dateChange.emit(value);
    }
    else {
      this.dateControl.setValue(this.lastValidValue);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    //if period changed, run filter update
    if(changes.period) {
      this.setFormatUnit();
      this.dateControl.setValue(this.dateControl.value);
    }
    //set value to edge of range if out of new bounds
    if(changes.min) {
      if(this._min.isAfter(this.dateControl.value)) {
        this.dateControl.setValue(this._min);
      }
    }
    if(changes.max) {
      if(this._max.isBefore(this.dateControl.value)) {
        this.dateControl.setValue(this._max);
      }
    }
  }

  setFormatUnit() {
    let unit: DateUnit = <DateUnit>this.period;
    this.dateFormat.setDateMinUnit(unit);
  }

  getDefaultView() {
    switch(this.period) {
      case "day": {
        return "month";
      }
      case "month": {
        return "year";
      }
      default: {
        return null;
      }
    }
  }

  ngOnInit() {
    this.setFormatUnit();
  }

  monthSelectHandler(event: Moment.Moment) {
    if(this.period == "month") {
      //event is a moment object for the selected date, set form control
      this.dateControl.setValue(event);
      this.datePicker.close();
    }
  }

}



