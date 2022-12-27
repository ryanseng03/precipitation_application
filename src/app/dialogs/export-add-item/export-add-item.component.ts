import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { StringMap } from 'src/app/models/types';
import { ActiveFormData, DatasetFormManagerService, ExportDatasetItem, FormManager } from 'src/app/services/dataset-form-manager.service';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {
  formData: ActiveFormData<ExportDatasetItem>;
  controls: ControlData;
  private debounce: boolean;

  private _formManager: FormManager<ExportDatasetItem>;

  numSelected: number;

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: FormState, private dateManager: DateManagerService, private formService: DatasetFormManagerService) {
    this._formManager = formService.exportFormManager;
    let formData = this._formManager.getFormData();
    this.formData = formData;
    //set up form controls
    //inject values
    this.setupControls(data);
    //this.updateDataset();

    formData.datasetItem.fileGroups
  }

  setupControls(initialValues: FormState) {
    let controls: ControlData = {
      dataset: {},
      fileProps: {},
      files: {}
    };

    //set up dataset controls
    for(let field in this.formData.values) {
      let value = this.formData.values[field];
      let control = new FormControl(value);
      this.controls[field] = control;
      control.valueChanges.subscribe((value: string) => {
        //make sure not being changed by control correction
        if(!this.debounce) {
          this.formData = this._formManager.setValue(field, value);
          this.setControlValues(this.formData.values);
        }
      });
    }


    //set up file property and select controls
    for(let group of this.formData.datasetItem.fileGroups) {
      //set up file property controls
      for(let field of group.additionalProperties) {
        let tag = field.formData.tag;
        let defaults = initialValues?.fileProps[tag] || field.defaultValues;
        let control = new FormControl(defaults);
        controls.fileProps[tag] = control;
        let lastValues = defaults;
        control.valueChanges.subscribe((values: string[]) => {
          if(values.length < 1) {
            control.setValue(lastValues);
          }
          else {
            lastValues = values;
          }
        });
        
      }

      //set up file select controls
      this.numSelected = 0;
      for(let file of group.fileData) {
        let tag = file.tag;
        //set to false initially, separately set initial values so control listener handles side effects
        let control = new FormControl(false);
        let controlData = {
          control,
          reqCount: 0
        };
        controls.files[tag] = controlData;
        let lastValue = false;
        control.valueChanges.subscribe((value: boolean) => {
          //use to debounce same values if toggled due to requirements
          if(value == lastValue) {
            return;
          }
          if(value) {
            this.numSelected++;
            //update required files
            for(let tag of file.requires) {
              let requiredControlData = controls.files[tag];
              requiredControlData.reqCount++;
              requiredControlData.control.setValue(true);
            }
            lastValue = value;
          }
          //if trying to unselect check if required, if it is reselect
          else if(controlData.reqCount > 0) {
            control.setValue(true);
          }
          else {
            this.numSelected--;
            //update required file counts
            for(let tag of file.requires) {
              let requiredControlData = controls.files[tag];
              requiredControlData.reqCount--;
            }
            lastValue = value;
          }
        });
      }
      //go back through and set any files initially checked so control handler can manage side effects like req counts
      for(let file of group.fileData) {
        let tag = file.tag;
        let value = initialValues?.files[tag];
        if(value) {
          controls.files[tag].control.setValue(true);
        }
      }
    }

    

    this.debounce = false;
    this.controls = controls;
  }

  setDatasetControlValues(values: StringMap) {
    
  }

  //!! EACH FILE GROUP IS GOING TO HAVE FILE PROP CONTROLS WITH THE SAME TAG, NEED TO SEPARATE THE CONTROLS OUT BY GROUP
  setFilePropControlValues

  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  submit() {
    this.dialogRef.close(null);
  }


}

export interface FormState {
  dataset: {[field: string]: string},
  fileProps: {[field: string]: string[]},
  files: {[field: string]: boolean}
}

interface FileControl {
  reqCount: number,
  control: FormControl
}

type Controls = {[tag: string]: FormControl}
type FileControls = {[tag: string]: FileControl}

interface ControlData {
  dataset: Controls,
  fileProps: Controls,
  files: FileControls
}

