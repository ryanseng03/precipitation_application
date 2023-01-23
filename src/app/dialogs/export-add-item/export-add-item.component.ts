import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { StringMap } from 'src/app/models/types';
import { ActiveFormData, DatasetFormManagerService, ExportDatasetItem, FormManager, FileGroup, FileProperty } from 'src/app/services/dataset-form-manager.service';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {
  formData: ActiveFormData<ExportDatasetItem>;
  controls: ExportControlData;
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

  // setupControls(initialValues: FormState) {
  //   let controls: ControlData = {
  //     dataset: {},
  //     fileProps: {},
  //     files: {}
  //   };

  //   //set up dataset controls
  //   for(let field in this.formData.values) {
  //     let value = this.formData.values[field];
  //     let control = new FormControl(value);
  //     controls[field] = control;
  //     control.valueChanges.subscribe((value: string) => {

  //       for(let tag in this.controls.dataset) {
  //         this.controls.dataset[tag].control.setValue()
  //       }

  //       //make sure not being changed by control correction
  //       if(!this.debounce) {
  //         this.formData = this._formManager.setValue(field, value);
  //         this.setControlValues(this.formData.values);
  //       }
  //     });
  //   }


  //   //set up file property controls and select control values
  //   for(let group of this.formData.datasetItem.fileGroups) {
  //     //set up file property controls
  //     for(let field of group.additionalProperties) {
  //       let tag = field.formData.tag;
  //       let defaults = initialValues?.fileProps[tag] || field.defaultValues;
  //       let control = new FormControl(defaults);
  //       controls.fileProps[tag] = control;
  //       let lastValues = defaults;
  //       control.valueChanges.subscribe((values: string[]) => {
  //         if(values.length < 1) {
  //           control.setValue(lastValues);
  //         }
  //         else {
  //           lastValues = values;
  //         }
  //       });
  //     }

  //     //set up file select controls
  //     this.numSelected = 0;
  //     for(let file of group.fileData) {
  //       let tag = file.tag;
  //       //set to false initially, separately set initial values so control listener handles side effects
  //       let control = new FormControl(false);
  //       let controlData = {
  //         control,
  //         reqCount: 0
  //       };
  //       controls.files[tag] = controlData;
  //       let lastValue = false;
  //       control.valueChanges.subscribe((value: boolean) => {
  //         //use to debounce same values if toggled due to requirements
  //         if(value == lastValue) {
  //           return;
  //         }
  //         if(value) {
  //           this.numSelected++;
  //           //update required files
  //           for(let tag of file.requires) {
  //             let requiredControlData = controls.files[tag];
  //             requiredControlData.reqCount++;
  //             requiredControlData.control.setValue(true);
  //           }
  //           lastValue = value;
  //         }
  //         //if trying to unselect check if required, if it is reselect
  //         else if(controlData.reqCount > 0) {
  //           control.setValue(true);
  //         }
  //         else {
  //           this.numSelected--;
  //           //update required file counts
  //           for(let tag of file.requires) {
  //             let requiredControlData = controls.files[tag];
  //             requiredControlData.reqCount--;
  //           }
  //           lastValue = value;
  //         }
  //       });
  //     }
  //     //go back through and set any files initially checked so control handler can manage side effects like req counts
  //     for(let file of group.fileData) {
  //       let tag = file.tag;
  //       let value = initialValues?.files[tag];
  //       if(value) {
  //         controls.files[tag].control.setValue(true);
  //       }
  //     }
  //   }



  //   this.debounce = false;
  //   this.controls = controls;
  // }

  // setDatasetControlValues(values: StringMap) {
  //   let datasetControls = {};
  //   //set up dataset controls
  //   for(let field in values) {
  //     let value = this.formData.values[field];
  //     let control = new FormControl(value);
  //     controls[field] = control;
  //     control.valueChanges.subscribe((value: string) => {
  //       //make sure not being changed by control correction
  //       if(!this.debounce) {
  //         this.formData = this._formManager.setValue(field, value);
  //         this.setDatasetControlValues(this.formData.values);
  //         //set up file group and select controls for dataset
  //         this.getFileGroupControls();
  //         this.getFileSelectControls();
  //       }
  //     });
  //   }
  // }


  //////////////////////


  private lockDatasetUpdates: boolean;
  private initializeControls(initialValues: FormState) {
    let formData = initialValues? this._formManager.setValues(initialValues.dataset) : this._formManager.getFormData();
    let {datatype, ...values} = formData.values;
    //setup main datatype control (always there, only needed once)
    this.setupDatatypeControl(datatype);
    //setup variable controls
    this.setupDatasetControls(values);
    this.setupFileGroupControls(initialValues.fileGroups);
  }

  private setupDatatypeControl(datatype: string) {
    let control = new FormControl(datatype);
    control.valueChanges.subscribe((value: string) => {
      if(!this.lockDatasetUpdates) {
        this.updateDatatype(value)
      }
    });
  }

  private updateDatatype(value: string) {
    let datasetData = this._formManager.setDatatype(value);
    let {datatype, ...values} = formData.values;
    //unsubscribe from controls so new ones can be created
    this.cleanupControlSubscriptions();
    this.setupDatasetControls(values);
    this.setupFileGroupControls(datasetData.values);
  }

  private setupDatasetControls(values: StringMap) {
    for(let field in values) {
      let control = new FormControl(values[field]);
      let sub = control.valueChanges.subscribe((value) => {
        if(!this.lockDatasetUpdates) {
          let formData = this._formManager.setValue(field, value);
          let {datatype, ...values} = formData.values;
          this.updateDatasetControlValues(values);
          this.cleanupFileGroupControlSubscriptions();
          this.setupFileGroupControls();
        }
      });   
      this.controls.dataset[field] = {
        control,
        sub
      }
    }
  }

  private updateDatasetControlValues(values: StringMap) {
    this.lockDatasetUpdates = true;
    for(let tag in values) {
      this.controls.dataset[tag].control.setValue(values[tag]);
    }
    this.lockDatasetUpdates = false;
  }

  private setupFileGroupControls(values: FileGroupState[]) {
    this.setupFilePropertyControls();
    this.setupFleSelectControls();
  }

  

  getFileDatasetControls() {
    //just dataset control
  }

  // //!! EACH FILE GROUP IS GOING TO HAVE FILE PROP CONTROLS WITH THE SAME TAG, NEED TO SEPARATE THE CONTROLS OUT BY GROUP
  // getFileGroupControls(groups: FileGroup[]): GroupControls {
  //   let fileGroupControls: GroupControls = {};
  //   for(let group of groups) {
  //     let controlGroup = {
  //       fileProps: this.getFilePropertyControls(group),
  //       files: this.getFileSelectControls(group)
  //     };
  //     fileGroupControls[group.tag] = controlGroup
  //   }
  //   return fileGroupControls;
  // }

  getFilePropertyControls(group: FileGroup, values: FilePropState): Controls {
    let filePropertyControls: Controls = {};
    //set up file property controls
    for(let field of group.additionalProperties) {
      let tag = field.formData.tag;
      let defaults = field.defaultValues;
      let control = new FormControl(defaults);
      filePropertyControls[tag] = control;
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
    return filePropertyControls;
  }

  getFileSelectControls(group: FileGroup, values: FileSelectState): FileControl {
    let fileSelectControls: FileControl = {};
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
      fileSelectControls[tag] = controlData;
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
            let requiredControlData = fileSelectControls[tag];
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
            let requiredControlData = fileSelectControls[tag];
            requiredControlData.reqCount--;
          }
          lastValue = value;
        }
      });
    }
    return fileSelectControls;
  }

  //cleanup
  cleanupControlSubscriptions() {
    this.cleanupDatasetControlSubscriptions();
    this.cleanupFileGroupControlSubscriptions();
  }

  cleanupDatasetControlSubscriptions() {
    for(let tag in this.controls.dataset) {
      this.controls.dataset[tag].sub.unsubscribe();
    }
  }

  cleanupFileGroupControlSubscriptions() {
    for(let groupTag in this.controls.fileGroups) {
      let fileProps = this.controls.fileGroups[groupTag].fileProps;
      for(let tag in fileProps) {
        fileProps[tag].sub.unsubscribe();
      }
      let files = this.controls.fileGroups[groupTag].files;
      for(let tag in files) {
        files[tag].data.sub.unsubscribe();
      }
    }
  }

  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  submit() {
    this.dialogRef.close(null);
  }


}

export interface FormState {
  dataset: StringMap,
  fileGroups: FileGroupState[]
}

export interface FileGroupState {
  fileProps: FilePropState,
  files: FileSelectState
}

export type FilePropState = {[field: string]: string[]};
export type FileSelectState = {[field: string]: boolean};

interface FileControl {
  reqCount: number,
  data: ControlData
}

type Controls = {[tag: string]: ControlData}
type FileControls = {[tag: string]: FileControl}

interface ControlData {
  control: FormControl,
  sub: Subscription
}

interface FileGroupControls {
  fileProps: Controls,
  files: FileControls
}

interface ExportControlData {
  datatype: ControlData,
  dataset: Controls,
  fileGroups: FileGroupControls[]
}

