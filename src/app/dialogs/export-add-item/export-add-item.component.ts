import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
import { StringMap } from 'src/app/models/types';
import { ActiveFormData, DatasetFormManagerService, ExportDatasetItem, FormManager, FileGroup, FileProperty, FileData, UnitOfTime } from 'src/app/services/dataset-form-manager.service';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {
  formData: ActiveFormData<ExportDatasetItem>;
  controls: ExportControlData;
  private lockDatasetUpdates: boolean;
  private dateDebounce: boolean = false;

  private _formManager: FormManager<ExportDatasetItem>;

  numSelected: number;

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: FormState, private dateManager: DateManagerService, private formService: DatasetFormManagerService) {
    //reset the state on close, can remove this if want to save when closing form, probably want it to reset to a default
    dialogRef.afterClosed().subscribe(() => {
      this._formManager.resetState();
    });
    this._formManager = formService.exportFormManager;
    this.initializeControls(data);
  }



  private initializeControls(initValues: FormState) {
    this.controls = {
      datatype: null,
      dataset: {},
      fileGroups: {}
    };
    let formData = initValues? this._formManager.setValues(initValues.dataset) : this._formManager.getFormData();
    this.formData = formData;
    let {datatype, ...values} = formData.values;
    //initialize date values to date range
    this.controls.dates = initValues?.dates ? {
      ...initValues.dates
    } : {
      start: this.formData.datasetItem.start,
      end: this.formData.datasetItem.end,
      unit: this.formData.datasetItem.unit,
      interval: this.formData.datasetItem.interval
    }
    this.controls.dates.start = initValues ? initValues.dates.start : this.formData.datasetItem.start;
    this.controls.dates.end = initValues ? initValues.dates.end : this.formData.datasetItem.end;
    //setup main datatype control (always there, only needed once)
    this.setupDatatypeControl(datatype);
    //setup variable controls
    this.setupDatasetControls(values);
    this.setupFileGroupControls(initValues?.fileGroups);
  }

  private setupDatatypeControl(datatype: string) {
    let control = new FormControl(datatype);
    let sub = control.valueChanges.subscribe((value: string) => {
      if(!this.lockDatasetUpdates) {
        this.updateDatatype(value)
      }
    });
    this.controls.datatype = {
      control,
      sub
    };
  }

  private updateDatatype(value: string) {
    let formData = this._formManager.setDatatype(value);
    this.formData = formData;
    let {datatype, ...values} = formData.values;
    //unsubscribe from controls so new ones can be created
    this.cleanupControlSubscriptions();
    this.setupDatasetControls(values);
    this.setupFileGroupControls(null);
  }

  private setupDatasetControls(controlValues: StringMap) {
    for(let field in controlValues) {
      let control = new FormControl(controlValues[field]);
      let sub = control.valueChanges.subscribe((value) => {
        if(!this.lockDatasetUpdates) {
          let formData = this._formManager.setValue(field, value);
          this.formData = formData;
          let {datatype, ...values} = formData.values;
          this.updateDatasetControlValues(values);
          this.cleanupFileGroupControlSubscriptions();
          this.setupFileGroupControls(null);
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

  private setupFileGroupControls(initValues: FileGroupStates) {
    this.numSelected = 0;
    for(let group of this.formData.datasetItem.fileGroups) {
      let groupValues = initValues ? initValues[group.tag] : null;
      let filePropertyControls = this.getFilePropertyControls(group.additionalProperties, groupValues?.fileProps);
      let fileSelectControls = this.getFileSelectControls(group.fileData, groupValues?.files);
      this.controls.fileGroups[group.tag] = {
        fileProps: filePropertyControls,
        files: fileSelectControls
      };
    }
  }

  private getFilePropertyControls(properties: FileProperty[], initValues: FilePropState): Controls {
    let filePropertyControls: Controls = {};
    //set up file property controls
    for(let field of properties) {
      let tag = field.formData.tag;
      let defaults = initValues ? initValues[tag] : field.defaultValues;
      let control = new FormControl(defaults);
      let lastValues = defaults;
      let sub = control.valueChanges.subscribe((values: string[]) => {
        if(values.length < 1) {
          control.setValue(lastValues);
        }
        else {
          lastValues = values;
        }
      });
      filePropertyControls[tag] = {
        control,
        sub
      };
    }
    return filePropertyControls;
  }

  private getFileSelectControls(fileData: FileData[], initValues: FileSelectState): FileControls {
    let fileSelectControls: FileControls = {};
    //set up file select controls
    for(let file of fileData) {
      let tag = file.tag;
      let initValue: boolean = initValues ? initValues[tag] : false;
      //set to false initially, separately set initial values so control listener handles side effects
      let control = new FormControl(initValue);
      if(initValue) {
        this.numSelected++;
      }
      let lastValue = initValue;
      let sub = control.valueChanges.subscribe((value: boolean) => {
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
            requiredControlData.data.control.setValue(true);
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
      let controlData = {
        data: {
          control, sub
        },
        reqCount: 0
      };
      fileSelectControls[tag] = controlData;
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
    this.controls.dataset = {};
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
    this.controls.fileGroups = {};
  }

  validateSetDate(date: Moment, which: string) {
    //debounce corrected value feedback
    if(!this.dateDebounce) {
      this.dateDebounce = true;
      let correctedDate = this.formData.datasetItem.timeseriesHandler.roundToInterval(date);
      this.controls.dates[which] = correctedDate;
    }
    else {
      this.dateDebounce = false;
    }
  }

  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  // let reqs: ResourceReq[] = this.exportItems.map((item: ExportPackageItemData) => {
  //   let resourceDates = null;
  //   if(item.state.dates) {
  //     let startDateStr = this.dateService.dateToString(item.state.dates.start, item.state.dates.unit);
  //     let endDateStr = this.dateService.dateToString(item.state.dates.end, item.state.dates.unit);
  //     resourceDates = {
  //       start: startDateStr,
  //       end: endDateStr,
  //       unit: item.state.dates.unit,
  //       interval: item.state.dates.interval
  //     }
  //   }

  //   let { datatype, ...params } = item.state.dataset;
  //   let fileData = [];
  //   for(let groupTag in item.state.fileGroups) {
  //     let fileGroup = item.state.fileGroups[groupTag];
  //     let files: string[] = [];
  //     for(let file in fileGroup.files) {
  //       if(fileGroup.files[file]) {
  //         files.push(file);
  //       }
  //     }
  //     let fileDataItem = {
  //       fileParams: fileGroup.fileProps,
  //       files
  //     }
  //     fileData.push(fileDataItem);
  //   }
  //   let req: ResourceReq = {
  //     datatype,
  //     params,
  //     fileData
  //   }
  //   if(resourceDates) {
  //     req.dates = resourceDates;
  //   }
  //   return req;
  // });

  submit() {
    //construct state
    let exportData: ExportPackageItemData = {
      datasetItem: this.formData.datasetItem,
      state: {
        dataset: {
          datatype: this.controls.datatype.control.value
        },
        dates: {
          ...this.controls.dates
        },
        fileGroups: {}
      },
      labels: {
        dataset: null,
        files: null
      }
    }
    let fileLabels = [];
    let datasetLabel = `${this.formData.datasetItem.label}`;
    if(this.formData.datasetItem.timeseriesHandler) {
      datasetLabel += ` ${this.formData.datasetItem.timeseriesHandler.getLabel(this.controls.dates.start)} - ${this.formData.datasetItem.timeseriesHandler.getLabel(this.controls.dates.end)}`;
    }
    exportData.labels.dataset = datasetLabel;
    for(let field in this.controls.dataset) {
      exportData.state.dataset[field] = this.controls.dataset[field].control.value;
    }
    for(let fileGroup of this.formData.datasetItem.fileGroups) {
      let groupTag = fileGroup.tag;
      exportData.state.fileGroups[groupTag] = {
        fileProps: {},
        files: {}
      };
      for(let propTag in this.controls.fileGroups[groupTag].fileProps) {
        exportData.state.fileGroups[groupTag].fileProps[propTag] = this.controls.fileGroups[groupTag].fileProps[propTag].control.value;
      }
      for(let fileData of fileGroup.fileData) {
        let fileTag = fileData.tag;
        let selected = this.controls.fileGroups[groupTag].files[fileTag].data.control.value;
        exportData.state.fileGroups[groupTag].files[fileTag] = selected;
        if(selected) {
          fileLabels.push(fileData.label);
        }
      }
    }
    exportData.labels.files = fileLabels.join(", ");

    this.dialogRef.close(exportData);
  }
}

export interface FormState {
  dataset: StringMap,
  dates?: DateState,
  fileGroups: FileGroupStates
}

export type FileGroupStates = {[tag: string]: FileGroupState};

export interface FileGroupState {
  fileProps: FilePropState,
  files: FileSelectState
}

export type FilePropState = {[tag: string]: string[]};
export type FileSelectState = {[tag: string]: boolean};

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
  [tag: string]: {
    fileProps: Controls,
    files: FileControls
  }
}

interface ExportControlData {
  datatype: ControlData,
  dataset: Controls,
  dates?: DateState,
  fileGroups: FileGroupControls
}

export interface DateState {
  start: Moment,
  end: Moment,
  unit: UnitOfTime,
  interval: number
}

export interface LabelData {
  dataset: string,
  files: string
}

export interface ExportPackageItemData {
  datasetItem: ExportDatasetItem,
  state: FormState,
  labels: LabelData
}
