import { Component, OnInit, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import Moment from "moment";
import { timestamp } from 'rxjs/operators';
import { ValueData } from 'src/app/models/Dataset';
import { ResourceReq, ExportData, ExportInfo } from 'src/app/models/exportData';
import { Period, StringMap } from 'src/app/models/types';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

// interface ExportData {
//   datatype: string,
//   dates: {
//     period: Period,
//     start: Moment.Moment,
//     end: Moment.Moment
//   },
//   //this should be moved to variable stuff
//   tier: string,
//   //need to change this a bit for other groups
//   files: {
//     stations: {
//       group: StringMap,
//       data: StringMap[]
//     },
//     raster: {
//       group: StringMap,
//       data: StringMap[]
//     }
//   }
// }

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {

  // item: ExportItem;
  // exportItems: ExportItem[];

  //choices should come from external object
  //date from indicator if NRT or updated if possible
  dataset = {
    datatype: {
      label: "Rainfall",
      value: "rainfall",
      control: new FormControl("rainfall")
    },
    period: {
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
    }
  }

  //group all options
  getExportInfo(): ExportInfo {
    let period = this.dataset.period.control.value;
    let periodLabel: string;
    for(let item of this.dataset.period.options) {
      if(item.value === period) {
        periodLabel = item.label;
        break;
      }
    }
    //extent is the only base thing that doesnt have, other things are "types"
    let info: ExportInfo = {
      datatypeLabel: "Rainfall",
      datatype: this.dataset.datatype.control.value,
      dates: {
        periodLabel: periodLabel,
        period: period,
        start: this.dataset.dates.selected[0],
        end: this.dataset.dates.selected[1]
      },
      tier: this.dataset.advanced.tier.control.value,
      files: {
        stations: {
          group: {
            group: "stations",
            type: "values"
          },
          data: []
        },
        raster: {
          group: {
            group: "raster",
            type: "values"
          },
          data: []
        }
      }
    }


    for(let fill in this.stationFiles) {
      let fileData = this.stationFiles[fill];
      if(fileData.control.value && fileData.valid) {
        let label = fileData.label;
        info.files.stations.data.push({
          label: label,
          data: {
            fill: fill
          }
        });
      }
    }
    for(let type in this.rasterFiles) {
      let fileData = this.rasterFiles[type];
      if(fileData.control.value && fileData.valid) {
        let label = fileData.label;
        info.files.raster.data.push({
          label: label,
          data: {
            extent: "state",
            type: type
          }
        });
      }
      
    }
    return info;
  }


  // datasets = [{
  //   datatype: "rainfall",
  //   timeperiod: "month",
  //   tier: "t0",
  //   dates: [Moment("1990-12"), Moment("2019-12")],
  //   files: {
  //     raster: ["partial"],
  //     station: ["raster", "stderr", "anomaly", "loocv", "metadata"]
  //   }
  // },
  // {
  //   datatype: "rainfall",
  //   timeperiod: "day",
  //   tier: "t0",
  //   dates: [Moment("1990-12"), Moment("2019-12")],
  //   files: {
  //     raster: ["partial", "unfilled"],
  //     station: ["raster", "stderr", "anomaly", "loocv", "metadata"]
  //   }
  // }]

  // //use a temporary mapping of the only variable
  // fileMap = {
  //   month: {
  //     station: ["partial"],
  //     raster: ["raster", "stderr", "anomaly", "loocv", "metadata"]
  //   },
  //   day: {
  //     station: ["partial", "unfilled"],
  //     raster: []
  //   }
  // }

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
      label: "Gridded Data",
      control: new FormControl(false),
      disabled: false
    },
    stderr: {
      valid: false,
      label: "Gridded Standard Error",
      control: new FormControl(false),
      disabled: false
    },
    anomaly: {
      valid: false,
      label: "Gridded Anomaly",
      control: new FormControl(false),
      disabled: false
    },
    stderr_anomaly: {
      valid: false,
      label: "Gridded Standard Error Anomaly",
      control: new FormControl(false),
      disabled: false
    },
    metadata: {
      valid: false,
      label: "Metadata and Error Metrics",
      control: new FormControl(false),
      disabled: false
    }
  };

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: ExportData, private dateManager: DateManagerService) {
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
    this.dataset.period.control.valueChanges.subscribe((value: Period) => {
      // let files: string[] = validFiles.raster;
      // console.log(files);
      // for(let ftype in this.rasterFiles) {
      //   if(files.includes(ftype)) {
      //     this.rasterFiles[ftype].valid = true;
      //   }
      //   else {
      //     this.rasterFiles[ftype].valid = false;
      //   }
      // }
      // files = validFiles.station;
      // console.log(files);
      // for(let ftype in this.stationFiles) {
      //   if(files.includes(ftype)) {
      //     this.stationFiles[ftype].valid = true;
      //   }
      //   else {
      //     this.stationFiles[ftype].valid = false;
      //   }
      // }
      
      
      //temp
      if(value == "month") {
        this.rasterFiles.anomaly.valid = true;
        this.rasterFiles.metadata.valid = true;
        this.rasterFiles.raster.valid = true;
        this.rasterFiles.stderr.valid = true;
        this.rasterFiles.stderr_anomaly.valid = true;
        this.stationFiles.filled.valid = false;
        this.stationFiles.partial.valid = true;
        this.stationFiles.unfilled.valid = false;
      }
      else { 
        this.rasterFiles.anomaly.valid = false;
        this.rasterFiles.metadata.valid = false;
        this.rasterFiles.raster.valid = false;
        this.rasterFiles.stderr.valid = false;
        this.rasterFiles.stderr_anomaly.valid = false;
        this.stationFiles.filled.valid = false;
        this.stationFiles.partial.valid = true;
        this.stationFiles.unfilled.valid = true;
      }
    });
    this.dataset.period.control.setValue("month");
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
      let info: ExportInfo = data.getExportInfo();
      //only need to do this one for now (note need to do all when fully implemented)
      this.dataset.period.control.setValue(info.dates.period);
      this.dataset.dates.selected = [info.dates.start, info.dates.end];
      //set files
      for(let file of info.files.raster.data) {
        let ftype = file.data.type;
        this.rasterFiles[ftype].control.setValue(true);
      }
      for(let file of info.files.stations.data) {
        let ftype = file.data.fill;
        this.stationFiles[ftype].control.setValue(true);
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
    // let data: ExportDataInfo = {
    //   datatype: {
    //     label: this.dataset.datatype.label,
    //     value: this.dataset.datatype.control.value
    //   },
    //   //using label as value for now to avoid retranslation
    //   timeperiod: {
    //     label: null,
    //     value: this.dataset.timestep.control.value
    //   },
    //   tier: {
    //     label: this.dataset.advanced.tier.label,
    //     value: this.dataset.advanced.control.value
    //   },
    //   dates: [this.dataset.dates.selected[0], this.dataset.dates.selected[1]],
    //   files: {
    //     raster: [],
    //     station: []
    //   }
    // };

    // //how do you want to get the label from controls that actually have multiple values? just search for now
    // let timeperiod = data.timeperiod.value;
    // for(let opt of this.dataset.timestep.options) {
    //   if(opt.value == timeperiod) {
    //     data.timeperiod.label = opt.label;
    //     break;
    //   }
    // }


    // for(let ftype in this.stationFiles) {
    //   let fdata = this.stationFiles[ftype];
    //   if(fdata.valid && fdata.control.value) {
    //     data.files.station.push({
    //       label: this.stationFiles[ftype].label,
    //       value: ftype
    //     });
    //   }
    // }
    // for(let ftype in this.rasterFiles) {
    //   let fdata = this.rasterFiles[ftype];
    //   if(fdata.valid && fdata.control.value) {
    //     data.files.raster.push({
    //       label: this.rasterFiles[ftype].label,
    //       value: ftype
    //     });
    //   }
    // }
    let info: ExportInfo = this.getExportInfo();
    let data: ExportData = new ExportData(info, this.dateManager);
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

// interface DatasetInfo {
//   classification: string,
//   subclassification: string,
//   period: string
// }

// interface ExportItem {
//   datasetInfo: DatasetInfo
//   //info specific to file type for identifying resource
//   resources: ResourceInfo[]
// }

// type ResourceType = "raster" | "station" | "anomaly" | "standard_error" | "LOOCV_error" | "metadata";

// interface ResourceInfo {
//   type: ResourceType
// }


// export interface ExportDataInfo {
//   datatype: ValueData<string>,
//   dates?: {
//     start: Moment.Moment,
//     end: Moment.Moment,
//     period: Period
//   },
//   groupData: {

//   }
//   fileData: {
//     raster: FieldInfo[],
//     station: FieldInfo[]
//   }
// }


