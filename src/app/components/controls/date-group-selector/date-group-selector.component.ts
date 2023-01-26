import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormNode, FormValue, TimeSelectorData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-date-group-selector',
  templateUrl: './date-group-selector.component.html',
  styleUrls: ['./date-group-selector.component.scss']
})
export class DateGroupSelectorComponent implements OnInit, OnChanges {

  @Input() timeSelectorData: TimeSelectorData;
  @Input() initValue: FormValue;
  @Output() selectionChange: EventEmitter<FormValue> = new EventEmitter<FormValue>();

  control: FormControl;
  viewControl: FormControl;

  constructor() {
    this.viewControl = new FormControl("percent");
    this.control = new FormControl();
    this.control.valueChanges.subscribe((value: FormValue) => {
      this.selectionChange.next(value);
    });
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.timeSelectorData) {
      this.validateForm();
    }
  }

  validateForm() {
    let value: FormValue;
    //if control already has a value make sure it is valid and use that if it is
    if(this.control.value) {
      value = this.timeSelectorData.formData.values.find((value: FormValue) => {
        return value.tag == this.control.value.tag;
      });
    }
    //otherwise if there is an initial value provided make sure that is valid and use if it is
    else if(this.initValue) {
      value = this.timeSelectorData.formData.values.find((value: FormValue) => {
        return value.tag == this.initValue.tag;
      });
    }
    //if neither case is true or value set was invalid (set to undefined) use default value
    if(!value) {
      value = this.timeSelectorData.defaultValue;
    }
    //set form value
    this.control.setValue(value);
  }

}
