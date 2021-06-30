
import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import Moment from 'moment';
import { ExportAddItemComponent, ExportDataInfo } from 'src/app/dialogs/export-add-item/export-add-item.component';
import { ExportUnimplementedComponent } from 'src/app/dialogs/export-unimplemented/export-unimplemented.component';
import { ExportManagerService, DownloadProgress, ResourceInfo, ResourceOptions } from 'src/app/services/export/export-manager.service';
import { ExportInfo, FileData } from "src/app/services/export/export-manager.service";
import { ErrorPopupService } from 'src/app/services/errorHandling/error-popup.service';


@Component({
  selector: 'app-export-interface',
  templateUrl: './export-interface.component.html',
  styleUrls: ['./export-interface.component.scss']
})
export class ExportInterfaceComponent implements OnInit {

  exportActivityMonitor = {
    active: false,
    mode: "query",
    value: 0
  };

  emailData: {
    useEmailControl: FormControl,
    emailInputControl: FormControl,
    maxSizeExceeded: boolean
  };

  exportItems: ExportDataInfo[] = [];

  constructor(public dialog: MatDialog, private exportManager: ExportManagerService, private errorService: ErrorPopupService) {
    this.emailData = {
      useEmailControl: new FormControl(false),
      emailInputControl: new FormControl(),
      maxSizeExceeded: false
    }
    this.emailData.emailInputControl.setValidators(Validators.email);
    // this.emailData.useEmailControl.valueChanges.subscribe((value: boolean) => {
    //   let emailControl = this.emailData.emailInputControl;
    //   if(!value) {
    //     emailControl.setValidators(Validators.email);
    //   }
    // });
  }

  // checkExportSize() {
  //   //size should be set to the export package size
  //   let size = 0;
  //   if(size < 100) {
  //     this.emailData.maxSizeExceeded = false;
  //   }
  //   else {
  //     this.emailData.maxSizeExceeded = true;
  //     this.emailData.useEmailControl.setValue(true);
  //   }
  // }

  ngOnInit() {
    //this.addExportData(-1);
  }

  checkEmailReq() {
    let inLimit = this.exportManager.packageSizeInLimit(this.fileData);
    this.emailData.maxSizeExceeded = !inLimit;
    if(this.emailData.maxSizeExceeded) {
      this.emailData.useEmailControl.setValue(true);
    }
  }


  removeExportItem(i: number) {
    this.exportItems.splice(i, 1);
    this.checkEmailReq();
  }

  fileData: ResourceInfo[] = [];
  addExportData(i: number) {
    let initData: ExportDataInfo = i < 0 ? null : this.exportItems[i]

    //panelClass applies global class to form (styles.scss)
    const dialogRef = this.dialog.open(ExportAddItemComponent, {
      width: "80%",
      height: "90%",
      panelClass: "export-dialog",
      data: initData
    });


    
    //TEMP MAPPING
    //raster and stations have separate mappings
    // let tempExportInfoMap: {
    //   raster: ExportInfo,
    //   station: ExportInfo
    // } = {
    //   raster: {
    //     dateInfo: {
    //       //test dates so don't overwhelm
    //       dates: [Moment("1990-01"), Moment("1991-01")],
    //       period: "month",
    //     },
    //     //should add better path combination (strip extra /)
    //     baseURL: "Rainfall/allMonYrData",
    //     files: []
    //   },
    //   station: {
    //     //dateInfo: null,
    //     baseURL: "Rainfall",
    //     files: []
    //   }
    // };

    // let tempFileMap: {[item: string]: FileData} = {
    //   partial: {
    //     fileBase: "monthly_rf_new_data_1990_2020_FINAL_19dec2020.csv",
    //     requires: []
    //   },
    //   unfilled: {
    //     fileBase: "monthly_rf_new_data_1990_2020_FINAL_19dec2020.csv",
    //     requires: []
    //   },
    //   raster: {
    //     fileBase: "statewide_rf_mm.tif",
    //     requires: []
    //   },
    //   stderr: {
    //     fileBase: "statewide_rf_mm_SE.tif",
    //     requires: []
    //   },
    //   anomaly: {
    //     fileBase: "statewide_anom.tif",
    //     requires: []
    //   },
    //   loocv: {
    //     fileBase: "statewide_anom_SE.tif",
    //     requires: []
    //   },
    //   metadata: {
    //     fileBase: "statewide_rf_mm_meta.txt",
    //     requires: []
    //   }
    // };

    //

    dialogRef.afterClosed().subscribe((data: ExportDataInfo) => {
      console.log(data);
      if(data) {
        if(i < 0) {
          this.exportItems.push(data);
        }
        else {
          this.exportItems.splice(i, 1, data);
        }
        //this.checkExportSize();

        //temp using temp mappings--------------
        // let rasterExportBase: ExportInfo = {
        //   dateInfo: tempExportInfoMap.raster.dateInfo,
        //   baseURL: tempExportInfoMap.raster.baseURL,
        //   files: []
        // };

        //temp


        for(let info of data.files.raster) {
          let resourceInfo: ResourceInfo = {
            opts: {
              datatype: data.datatype.value,
              fileGroup: {
                group: "raster",
                type: "values"
              },
              fileData: {
                period: data.timeperiod.value,
                dates: [data.dates[0].format("YYYY-MM"), data.dates[1].format("YYYY-MM")],
                extent: "state",
                type: info.value,
                tier: data.tier.value
              },
              filterOpts: {}
            },
            //maybe should move this size property
            size: 1
          }
          
          this.fileData.push(resourceInfo);
        }

        // let stationExportBase: ExportInfo = {
        //   dateInfo: tempExportInfoMap.station.dateInfo,
        //   baseURL: tempExportInfoMap.station.baseURL,
        //   files: []
        // };
        for(let info of data.files.station) {
          let resourceInfo: ResourceInfo = {
            opts: {
              datatype: data.datatype.value,
              fileGroup: {
                group: "stations",
                type: "values"
              },
              fileData: {
                period: data.timeperiod.value,
                fill: info.value,
                tier: data.tier.value
              },
              filterOpts: {}
            },
            //maybe should move this size property
            size: 1
          }
  
          this.fileData.push(resourceInfo);
        }

        //---------------------------------------

        this.checkEmailReq();
      }
    });
  }

  getExportedItemDataset(i: number) {
    let data = this.exportItems[i];
    let format: string;
    if(data.timeperiod.value == "month") {
      format = "MMMM YYYY";
    }
    else {
      format = "MMMM DD YYYY";
    }
    let dataset = `${data.timeperiod.label} ${data.datatype.label} ${data.dates[0].format(format)} - ${data.dates[1].format(format)}`;

    return dataset;
  }

  getExportedItemFiles(i: number) {
    let data = this.exportItems[i];
    let files = [];
    for(let fileInfo of data.files.raster) {
      files.push(fileInfo.label);
    }
    for(let fileInfo of data.files.station) {
      files.push(fileInfo.label);
    }
    return files.join(", ");
  }

  export() {
    // const dialogRef = this.dialog.open(ExportUnimplementedComponent, {
    //   width: '250px',
    //   data: null
    // });
    let resourceOpts = this.fileData.map((item: ResourceInfo) => item.opts);
    if(this.emailData.useEmailControl.value) {
      this.exportActivityMonitor.mode = "indeterminate"
      this.exportActivityMonitor.active = true;
      let email = this.emailData.emailInputControl.value
      this.exportManager.submitEmailPackageReq(resourceOpts, email).then(() => {
        let message = `A download request has been generated. You should receive an email at ${email} with your download package shortly. If you do not receive an email within 4 hours, please ensure the email address you entered is spelled correctly and try again or contact the site administrators.`;
        this.errorService.notify("info", message);
        this.exportActivityMonitor.active = false;
      })
      .catch((e) => {
        this.errorService.notify("error", "An error occured while requesting the download package.");
        this.exportActivityMonitor.active = false;
      });
    }
    else {
      this.exportActivityMonitor.mode = "query"
      this.exportActivityMonitor.active = true;
      this.exportManager.submitInstantDownloadReq(resourceOpts).then((progress: DownloadProgress) => {
        this.exportActivityMonitor.mode = "determinate";
        this.exportActivityMonitor.value = 0;
        //need to normalize size and progress to [0, 100], compute coeff
        let coeff = 100 / progress.sizeUL;
        progress.progress.subscribe((complete: number) => {
          //normalize progress to 100
          let percent = coeff * complete
          this.exportActivityMonitor.value = percent;
        }, (e: any) => {
          this.errorService.notify("error", "An error occured while retreiving the download package.");
          //does complete still trigger on error?
          this.exportActivityMonitor.active = false;
        }, () => {
          //if this triggers on error need to set flag or something
          let message = `Your download package has been generated. Check your browser for the downloaded file.`;
          this.errorService.notify("info", message);
          this.exportActivityMonitor.active = false;
        });
        
      })
      .catch((e) => {
        this.errorService.notify("error", "An error occured while generating the download package.");
        this.exportActivityMonitor.active = false;
      });
    }
  }
}





//file identification info
interface FileInfo {
  datatype: string,

}

