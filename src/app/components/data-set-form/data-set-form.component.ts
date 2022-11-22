import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import {EventParamRegistrarService} from "../../services/inputManager/event-param-registrar.service";
import { FormControl } from '@angular/forms';
import { AllFormData, DatasetFormManagerService, FormManager, VisDatasetItem } from 'src/app/services/dataset-form-manager.service';
import { StringMap } from '@angular/compiler/src/compiler_facade_interface';

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetFormComponent implements OnInit, AfterViewInit {
  formData: AllFormData;
  controls: {[field: string]: FormControl};
  debounce: boolean = false;
  changes: boolean = false;
  label: string = "";

  private _formManager: FormManager<VisDatasetItem>;

  constructor(private paramService: EventParamRegistrarService, private formService: DatasetFormManagerService) {
    this._formManager = formService.visFormManager;
    let formData = this._formManager.getAllFormData();
    this.formData = formData;
    //set up form controls
    this.controls = {}
    this.setControlValues(formData.values);
    this.updateDataset();
  }

  setControlValues(values: StringMap) {
    //don't trigger recomp in listeners while setting values
    this.debounce = true;
    for(let field in values) {
      let value = values[field];
      let control: FormControl = this.controls[field];
      if(control === undefined) {
        control = new FormControl(value);
        this.controls[field] = control;
        control.valueChanges.subscribe((value: string) => {
          //make sure not being changed by control correction
          if(!this.debounce) {
            let formData = this._formManager.setValue(field, value);
            this.formData.paramFormData = formData.formData;
            this.formData.coverageLabel = formData.coverageLabel;
            this.setControlValues(formData.values);
            this.changes = true;
          }
        });
      }
      else {
        control.setValue(value);
      }
    }
    //turn off debounce
    this.debounce = false;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }



  updateDataset() {
    this.changes = false;
    let dataset: VisDatasetItem = this._formManager.getDatasetItem();
    this.label = dataset.label;
    this.paramService.pushDataset(dataset);
  }
}
