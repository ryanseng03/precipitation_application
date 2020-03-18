import { Component, OnInit, ViewChild } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService} from "../../../services/controlHelpers/date-format-helper.service";
import {Platform} from '@angular/cdk/platform';
import {FormControl, Validators, AbstractControl} from '@angular/forms';
import {MatCalendarHeader} from "@angular/material/datepicker"


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
  
  @ViewChild("startDateInput") startDateInput; 
  @ViewChild("startDatePicker") startDatePicker;
  @ViewChild("startCalendar") startCalendar;

  dateConfig = {
    view: "month"
  }

  
  testFormControl = new FormControl("", []);

  constructor(private dateFormat: DateFormatHelperService) {
    console.log(MatCalendarHeader.prototype.currentPeriodClicked);
    //override the dumb default method that switches to random things and make it go up one level
    MatCalendarHeader.prototype.currentPeriodClicked = function () {
      console.log(this.calendar.currentView);
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

  ngOnInit() {
  }

  monthSelectHandler(event: any) {
    if(this.dateConfig.view == "year") {
      this.startDatePicker.close();
    }
  }

  dateInputValidator(control: AbstractControl) {
    let df = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
    console.log("called validator");
    return null;
    //return forbidden ? {'forbiddenName': {value: control.value}} : null;
  }

}



