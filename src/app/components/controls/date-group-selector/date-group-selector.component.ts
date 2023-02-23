import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, SimpleChanges, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormNode, FormValue, TimeSelectorData, VisDatasetItem } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-date-group-selector',
  templateUrl: './date-group-selector.component.html',
  styleUrls: ['./date-group-selector.component.scss']
})
export class DateGroupSelectorComponent implements OnInit, OnChanges, OnDestroy {

  @Input() timeSelectorData: TimeSelectorData;
  @Input() initValue: FormValue;
  @Output() selectionChange: EventEmitter<FormValue> = new EventEmitter<FormValue>();

  control: FormControl;
  viewControl: FormControl;

  datatype: string;

  constructor(private paramService: EventParamRegistrarService) {
    this.control = new FormControl();
    this.control.valueChanges.subscribe((value: FormValue) => {
      //temp//
      let type: string = value.tag == "present" ? "direct" : this.viewControl.value;
      ////
      this._pushValue(type);
    });
  }

  private _pushValue(type: string) {
    this.paramService.pushViewType(type);
    let value = this.control.value;
    value.paramData.type = type;
    this.selectionChange.next(value);
  }

  ngOnInit() {
    this.paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        this.datatype = dataset.datatype;
        if(!this.viewControl) {
          let defaultType = this.datatype == "Rainfall" ? "percent" : "absolute";
          this.viewControl = new FormControl(defaultType);
          //temp?
          this.viewControl.valueChanges.subscribe((value: string) => {
            this._pushValue(value);
          });
        }
        else {
          if(this.datatype != "Rainfall" && this.viewControl.value == "percent") {
            this.viewControl.setValue("absolute");
          }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes.timeSelectorData) {
      this.validateForm();
    }
  }

  ngOnDestroy(): void {
      this.paramService.pushViewType("direct");
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
