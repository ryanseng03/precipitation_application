import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormNode, FormValue, TimeSelectorData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-date-group-selector',
  templateUrl: './date-group-selector.component.html',
  styleUrls: ['./date-group-selector.component.scss']
})
export class DateGroupSelectorComponent implements OnInit {

  @Input() timeSelectorData: TimeSelectorData;
  @Input() initValue: FormValue;
  @Output() selectionChange: EventEmitter<FormValue> = new EventEmitter<FormValue>();

  control: FormControl;

  constructor() {
    this.control = new FormControl();
    this.control.valueChanges.subscribe((value: FormValue) => {
      this.selectionChange.next(value);
    });
  }

  ngOnInit() {
    let initValue = this.initValue ? this.initValue : this.timeSelectorData.defaultValue;
    this.control.setValue(initValue);
  }

}
