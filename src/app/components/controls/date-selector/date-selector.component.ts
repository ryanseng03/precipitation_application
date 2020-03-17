import { Component, OnInit, ViewChild } from '@angular/core';
import {MAT_DATE_FORMATS} from '@angular/material/core';
import {DateFormatHelperService} from "../../../services/controlHelpers/date-format-helper.service";
import {Platform} from '@angular/cdk/platform';
import {FormControl, Validators} from '@angular/forms';


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

  //https://angular.io/guide/form-validation
  testFormControl = new FormControl('a', [
    Validators.required,
    Validators.email,
  ])

  constructor(private dateFormat: DateFormatHelperService) {

    
    
    setTimeout(() => {
      this.startDateInput.nativeElement.value = "dsda";
      this.startDatePicker.monthSelected.subscribe((value) => {
        console.log(value);
      });
      this.startDatePicker.openedStream.subscribe((value) => {
        console.log(value);
      });
      this.startDatePicker.closedStream.subscribe((value) => {
        console.log(value);
      });
      console.log(this.startCalendar);
      console.log("set");
      dateFormat.setDateMinUnit("month");
    }, 1000);
    
  }

  ngOnInit() {
  }

  monthSelectHandler() {
    if(this.dateConfig.view == "year") {
      this.startDatePicker.close();
    }
  }

}



