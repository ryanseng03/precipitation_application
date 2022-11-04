import { Component, EventEmitter, OnInit, ViewChild, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService, DateUnit} from "../../../services/controlHelpers/date-format-helper.service";
import {FormControl} from '@angular/forms';
import {MatCalendarHeader} from "@angular/material/datepicker";
import Moment from "moment";

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

  @Input() label: string;
  @Input() min: Moment.Moment;
  @Input() max: Moment.Moment;

  @Input() date: Moment.Moment;
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
    else if(!value) {
      this.dateControl.setValue(this.lastValidValue);
    }
  }

  setFormatUnit() {
    let unit: DateUnit = <DateUnit>this.period;
    this.dateFormat.setDateMinUnit(unit);
    //reset value to get formatting correct
    this.dateControl.setValue(this.dateControl.value);
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
  }

  ngOnChanges(changes: SimpleChanges): void {
    let dateChanged = false;
    if(changes.date) {
      let date = changes.date.currentValue
      if(date.isBefore(this.min)) {
        date = this.min.clone();
      }
      if(date.isAfter(this.max)) {
        date = this.max.clone();
      }
      this.dateControl.setValue(date);
      dateChanged = true;
    }
    //only need to check min and max if date wasn't changed, otherwise already handled
    else if(changes.min && this.dateControl.value.isBefore(this.min)) {
      this.dateControl.setValue(this.min.clone());
      dateChanged = true;
    }
    else if(changes.max && this.dateControl.value.isAfter(this.max)) {
      this.dateControl.setValue(this.max.clone());
      dateChanged = true;
    }

    if(changes.period) {
      this.setFormatUnit();
      this.dateControl.setValue(this.dateControl.value);
    }
    if(dateChanged) {
      this.setDate();
    }
  }

  monthSelectHandler(event: Moment.Moment) {
    if(this.period == "month") {
      //event is a moment object for the selected date, set form control
      this.dateControl.setValue(event);
      this.datePicker.close();
    }
  }

}



