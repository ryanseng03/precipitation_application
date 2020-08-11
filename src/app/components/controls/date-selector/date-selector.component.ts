import { Component, OnInit, ViewChild, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService, DateUnit} from "../../../services/controlHelpers/date-format-helper.service";
import {Platform} from '@angular/cdk/platform';
import {FormControl, Validators, AbstractControl} from '@angular/forms';
import {MatCalendarHeader, MatDatepicker, MatDatepickerInput, MatDatepickerModule} from "@angular/material/datepicker";
import Moment from "moment";
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';


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

  private _min: Moment.Moment = null;
  private _max: Moment.Moment = null;

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
    console.log("!!!");
    this.dateControl.setValue(date);
  }
  @Output() dateChange: Observable<Moment.Moment>;

  @Input() timestep: string;

  @Input() initDate: Moment.Moment = null;

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

    // this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.timestep, (timestep: string) => {
    //   this.timeGranularity = timestep;
    //   let unit: DateUnit = this.getUnit();
    //   this.dateFormat.setDateMinUnit(unit);
    // });

    //dateChange event doesn't trigger on form field when closed early, so use this to monitor changes
    //use map pipe to send null if invalid date
    this.dateChange = this.dateControl.valueChanges.pipe(map((date: Moment.Moment) => {
      console.log(date)
      if(this.dateControl.valid) {
        return date;
      }
      else {
        return null;
      }
    }));
  }

  ngOnChanges(changes: SimpleChanges) {
    //if timestep changed, run filter update
    if(changes.timestep) {
      this.setFormatUnit();
      //trigger value change so formatting updates current input
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
    let unit: DateUnit = this.getUnit();
    this.dateFormat.setDateMinUnit(unit);
  }

  getUnit(): DateUnit {
    switch(this.timestep) {
      case "daily": {
        return "day";
      }
      case "monthly": {
        return "month";
      }
      default: {
        return null;
      }
    }
  }

  getDefaultView() {
    switch(this.timestep) {
      case "daily": {
        return "month";
      }
      case "monthly": {
        return "year";
      }
      default: {
        return null;
      }
    }
  }

  ngOnInit() {
    //set value to initial date input value
    this.dateControl.setValue(this.initDate);
    this.setFormatUnit();
  }

  monthSelectHandler(event: Moment.Moment) {
    if(this.timestep == "monthly") {
      //event is a moment object for the selected date, set form control
      this.dateControl.setValue(event);
      this.datePicker.close();
    }
  }

  // updateHandler(e) {
  //   console.log(e);
  // }

  // dateInputValidator(control: AbstractControl) {
  //   let df = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
  //   return null;
  //   //return forbidden ? {'forbiddenName': {value: control.value}} : null;
  // }

}



