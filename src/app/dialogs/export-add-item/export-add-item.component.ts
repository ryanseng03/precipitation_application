import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import Moment from "moment";
import { timestamp } from 'rxjs/operators';
import { ValueData } from 'src/app/models/Dataset';
import { Period } from 'src/app/models/types';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {

  item: ExportItem;
  exportItems: ExportItem[];

  //choices should come from external object
  //date from indicator if NRT or updated if possible
  dataset = {
    datatype: {
      label: "Rainfall",
      value: "rainfall",
      control: new FormControl("rainfall")
    },
    timestep: {
      options: [{
        label: "Monthly",
        value: "month"
      }, {
        label: "Daily",
        value: "day"
      }],
      control: new FormControl("month")
    },
    dates: {
      range: [Moment("1990-12"), Moment("2019-12")],
      selected: [Moment("1990-12"), Moment("2019-12")]
    },
    advanced: {
      control: new FormControl(false),
      tier: {
        label: "Tier 0",
        value: "0",
        control: new FormControl("0")
      }
    },
    raster: null,
    station: {
      fill: {
        label: "Partial Fill",
        value: "partial",
        control: new FormControl("partial")
      }
    }
  }




  datasets = [{
    datatype: "rainfall",
    timeperiod: "month",
    tier: "t0",
    dates: [Moment("1990-12"), Moment("2019-12")],
    files: {
      raster: ["partial"],
      station: ["raster", "stderr", "anomaly", "loocv", "metadata"]
    }
  },
  {
    datatype: "rainfall",
    timeperiod: "day",
    tier: "t0",
    dates: [Moment("1990-12"), Moment("2019-12")],
    files: {
      raster: ["partial", "unfilled"],
      station: ["raster", "stderr", "anomaly", "loocv", "metadata"]
    }
  }]

  //use a temporary mapping of the only variable
  fileMap = {
    month: {
      station: ["partial"],
      raster: ["raster", "stderr", "anomaly", "loocv", "metadata"]
    },
    day: {
      station: ["partial", "unfilled"],
      raster: []
    }
  }

  /*
  [
    {
      control: null,
      default: true,
      label: "Include Raster Data",
      info: "Continuous rainfall map for the selected spatial extent at 250m resolution. Provided as a GeoTIFF."
    },
    {
      control: null,
      default: true,
      label: "Include Station Data",
      info: "Metadata and values for the rainfall stations used to collect data"
    },
    {
      control: null,
      default: false,
      label: "Include Anomaly Map",
      info: "The ratio of the observed value to the mean monthly value at the same location"
    },
    {
      control: null,
      default: false,
      label: "Include Standard Error Map",
      info: ""
    },
    {
      control: null,
      default: false,
      label: "Include LOOCV Error Metrics",
      info: "Leave one out cross-validation metrics."
    },
    {
      control: null,
      default: false,
      label: "Include Metadata",
      info: ""
    }
  ]
  */

  selected = {
    raster: 0,
    station: 0
  };

  stationFileTags: string[];
  stationFiles = {
    partial: {
      valid: false,
      label: "Partial Filled Station Data",
      control: new FormControl(false),
      disabled: false
    },
    unfilled: {
      valid: false,
      label: "Unfilled Station Data",
      control: new FormControl(false),
      disabled: false
    },
    filled: {
      valid: false,
      label: "Filled Station Data",
      control: new FormControl(false),
      disabled: false
    }
  };

  rasterFileTags: string[];
  rasterFilesLessMetadata = 0;
  rasterFiles = {
    raster: {
      valid: false,
      label: "Gridded Data Map",
      control: new FormControl(false),
      disabled: false
    },
    stderr: {
      valid: false,
      label: "Gridded Standard Error Map",
      control: new FormControl(false),
      disabled: false
    },
    anomaly: {
      valid: false,
      label: "Gridded Anomaly Map",
      control: new FormControl(false),
      disabled: false
    },
    loocv: {
      valid: false,
      label: "Gridded LOOCV Error Metrics",
      control: new FormControl(false),
      disabled: false
    },
    metadata: {
      valid: false,
      label: "Gridded Data Metadata",
      control: new FormControl(false),
      disabled: false
    }
  };

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: ExportDataInfo) {
    // this.datasets = data.datasets;
    // this.exportItems = data.items;

    // this.item = {
    //   datasetInfo: {
    //     classification: null,
    //     subclassification: null,
    //     period: null
    //   },
    //   resources: []
    // }

    //temp
    this.dataset.timestep.control.valueChanges.subscribe((value: string) => {
      let validFiles = this.fileMap[value];
      let files: string[] = validFiles.raster;
      console.log(files);
      for(let ftype in this.rasterFiles) {
        if(files.includes(ftype)) {
          this.rasterFiles[ftype].valid = true;
        }
        else {
          this.rasterFiles[ftype].valid = false;
        }
      }
      files = validFiles.station;
      console.log(files);
      for(let ftype in this.stationFiles) {
        if(files.includes(ftype)) {
          this.stationFiles[ftype].valid = true;
        }
        else {
          this.stationFiles[ftype].valid = false;
        }
      }
    });
    this.dataset.timestep.control.setValue("month");
    //

    this.rasterFileTags = [];
    for(let ftype in this.rasterFiles) {
      let fdata = this.rasterFiles[ftype];
      let control: FormControl = fdata.control;
      if(ftype == "metadata") {
        control.valueChanges.subscribe((selected: boolean) => {
          if(selected) {
            this.selected.raster++;
          }
          else {
            this.selected.raster--;
          }
        });
      }
      else {
        control.valueChanges.subscribe((selected: boolean) => {
          if(selected) {
            this.selected.raster++;
            this.rasterFilesLessMetadata++;
          }
          else {
            this.selected.raster--;
            this.rasterFilesLessMetadata--;
          }
          let metadataData = this.rasterFiles.metadata;
          let metadataControl: FormControl = metadataData.control;
          if(this.rasterFilesLessMetadata > 0) {
            metadataData.disabled = true;
            if(!metadataControl.value) {
              metadataControl.setValue(true);
            }
          }
          else {
            metadataData.disabled = false;
          }
        });
      }
      this.rasterFileTags.push(ftype);
    }

    this.stationFileTags = [];
    for(let ftype in this.stationFiles) {
      let fdata = this.stationFiles[ftype];
      let control: FormControl = fdata.control;
      control.valueChanges.subscribe((selected: boolean) => {
        if(selected) {
          this.selected.station++;
        }
        else {
          this.selected.station--;
        }
      });
      this.stationFileTags.push(ftype);
    }


    //initialize from object if exist
    if(data) {
      //only need to do this one for now (note need to do all when fully implemented)
      this.dataset.timestep.control.setValue(data.timeperiod.value);
      this.dataset.dates.selected = [data.dates[0], data.dates[1]];
      //set files
      for(let ftype of data.files.raster) {
        this.rasterFiles[ftype.value].control.setValue(true);
      }
      for(let ftype of data.files.station) {
        this.stationFiles[ftype.value].control.setValue(true);
      }
    }
  }

  filesSelected() {
    let numFiles = this.selected.raster + this.selected.station;
    let filesSelected = numFiles > 0;
    return filesSelected;
  }


  // getRasterFiles() {
  //   let files = [];
  //   for(let ftype in this.rasterFiles) {
  //     let fdata = this.rasterFiles[ftype];
  //     if(fdata.valid) {
  //       files.push(fdata);
  //     }
  //   }
  //   return files;
  // }


  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  submit() {
    let data: ExportDataInfo = {
      datatype: {
        label: this.dataset.datatype.label,
        value: this.dataset.datatype.control.value
      },
      //using label as value for now to avoid retranslation
      timeperiod: {
        label: null,
        value: this.dataset.timestep.control.value
      },
      tier: {
        label: this.dataset.advanced.tier.label,
        value: this.dataset.advanced.control.value
      },
      dates: [this.dataset.dates.selected[0], this.dataset.dates.selected[1]],
      files: {
        raster: [],
        station: []
      }
    };

    //how do you want to get the label from controls that actually have multiple values? just search for now
    let timeperiod = data.timeperiod.value;
    for(let opt of this.dataset.timestep.options) {
      if(opt.value == timeperiod) {
        data.timeperiod.label = opt.label;
        break;
      }
    }


    for(let ftype in this.stationFiles) {
      let fdata = this.stationFiles[ftype];
      if(fdata.valid && fdata.control.value) {
        data.files.station.push({
          label: this.stationFiles[ftype].label,
          value: ftype
        });
      }
    }
    for(let ftype in this.rasterFiles) {
      let fdata = this.rasterFiles[ftype];
      if(fdata.valid && fdata.control.value) {
        data.files.raster.push({
          label: this.rasterFiles[ftype].label,
          value: ftype
        });
      }
    }
    this.dialogRef.close(data);
  }

  setDate(side: 0 | 1, date: Moment.Moment) {
    this.dataset.dates.selected[side] = date;
  }


}


//what to select?
//any of the items that are available for class,subclass,period set
//item hierarchy class->subclass->period->other
//only things that should affect set generation are these three things

//THESE THREE THINGS DRIVE THE DATA SET, EVERYTHING ELSE (date range, units, etc) IS JUST A PROPERTY OF THE SET

//"other" should have set definition


//need date range, class, subclass

interface DatasetInfo {
  classification: string,
  subclassification: string,
  period: string
}

interface ExportItem {
  datasetInfo: DatasetInfo
  //info specific to file type for identifying resource
  resources: ResourceInfo[]
}

type ResourceType = "raster" | "station" | "anomaly" | "standard_error" | "LOOCV_error" | "metadata";

interface ResourceInfo {
  type: ResourceType
}


export interface ExportDataInfo {
  datatype: ValueData<string>,
  dates?: {
    start: Moment.Moment,
    end: Moment.Moment,
    period: Period
  },
  groupData: {

  }
  fileData: {
    raster: FieldInfo[],
    station: FieldInfo[]
  }
}


