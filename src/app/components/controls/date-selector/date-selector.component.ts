import { Component, OnInit, ViewChild, Input, Output } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService, DateUnit} from "../../../services/controlHelpers/date-format-helper.service";
import {Platform} from '@angular/cdk/platform';
import {FormControl, Validators, AbstractControl} from '@angular/forms';
import {MatCalendarHeader, MatDatepicker, MatDatepickerInput, MatDatepickerModule} from "@angular/material/datepicker";
import {EventParamRegistrarService} from ".././../../services/inputManager/event-param-registrar.service";
import Moment from "moment";
import "moment-timezone";


let dateFormatFactory = (formatHelper: DateFormatHelperService) => {
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
export class DateSelectorComponent implements OnInit {
  
  @ViewChild("datePicker") datePicker; 

  //how to deal with time zones? should it all be HST? local? UTC?
  //this does affect what day it is, for now use utc, probably should change
  private static readonly DATE_LIMIT = {
    min:  Moment("1990-05-10T00:00:00.000Z"),
    max: Moment().tz("utc")
  }
  private _min: Moment.Moment = DateSelectorComponent.DATE_LIMIT.min;
  private _max: Moment.Moment = DateSelectorComponent.DATE_LIMIT.max;

  @Input() label: string;
  @Input()
  set min(date: Moment.Moment) {
    this._min = date ? date : DateSelectorComponent.DATE_LIMIT.min;
  }
  @Input()
  set max(date: Moment.Moment) {
    this._max = date ? date : DateSelectorComponent.DATE_LIMIT.max;
  }
  @Output() setDate;

  private timeGranularity: string;
  
  dateControl = new FormControl("");

  constructor(private dateFormat: DateFormatHelperService, private paramService: EventParamRegistrarService) {
    let gmin =  Moment("1990-05-10T00:00:00.000Z");
    let gmax = Moment().tz("utc");

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
    
    this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.timestep, (timestep: string) => {
      this.timeGranularity = timestep;
      let unit: DateUnit = this.getUnit();
      this.dateFormat.setDateMinUnit(unit);
    });
    
    //dateChange event doesn't trigger on form field when closed early, so use this to monitor changes
    this.setDate = this.dateControl.valueChanges;
  }

  getUnit(): DateUnit {
    switch(this.timeGranularity) {
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
    switch(this.timeGranularity) {
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
  }

  monthSelectHandler(event: Moment.Moment) {
    if(this.timeGranularity == "monthly") {
      //event is a moment object for the selected date, set form control
      this.dateControl.setValue(event);
      this.datePicker.close();
    }
  }

  updateHandler(e) {
    console.log(e);
  }

  // dateInputValidator(control: AbstractControl) {
  //   let df = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
  //   return null;
  //   //return forbidden ? {'forbiddenName': {value: control.value}} : null;
  // }

}



