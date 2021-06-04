
import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import Moment from 'moment';
import { ExportAddItemComponent, ExportDataInfo } from 'src/app/dialogs/export-add-item/export-add-item.component';
import { ExportUnimplementedComponent } from 'src/app/dialogs/export-unimplemented/export-unimplemented.component';
import { ExportManagerService } from 'src/app/services/export/export-manager.service';
import { ExportInfo, FileData } from "src/app/services/export/export-manager.service";

@Component({
  selector: 'app-export-interface',
  templateUrl: './export-interface.component.html',
  styleUrls: ['./export-interface.component.scss']
})
export class ExportInterfaceComponent implements OnInit {

  emailData: {
    useEmailControl: FormControl,
    emailInputControl: FormControl,
    maxSizeExceeded: boolean
  }

  exportItems: ExportDataInfo[] = [];

  constructor(public dialog: MatDialog, private exportManager: ExportManagerService) {
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

  checkExportSize() {
    //size should be set to the export package size
    let size = 0;
    if(size < 100) {
      this.emailData.maxSizeExceeded = false;
    }
    else {
      this.emailData.maxSizeExceeded = true;
      this.emailData.useEmailControl.setValue(true);
    }
  }

  ngOnInit() {
    //this.addExportData(-1);
  }


  removeExportItem(i: number) {
    this.exportItems.splice(i, 1);
  }

  fileData: ExportInfo[] = [];
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
    let tempExportInfoMap: {
      raster: ExportInfo,
      station: ExportInfo
    } = {
      raster: {
        dateInfo: {
          //test dates so don't overwhelm
          dates: [Moment("1990-01"), Moment("1991-01")],
          period: "month",
        },
        //should add better path combination (strip extra /)
        baseURL: "Rainfall/allMonYrData",
        files: []
      },
      station: {
        //dateInfo: null,
        baseURL: "Rainfall",
        files: []
      }
    };

    let tempFileMap: {[item: string]: FileData} = {
      partial: {
        fileBase: "monthly_rf_new_data_1990_2020_FINAL_19dec2020.csv",
        requires: []
      },
      unfilled: {
        fileBase: "monthly_rf_new_data_1990_2020_FINAL_19dec2020.csv",
        requires: []
      },
      raster: {
        fileBase: "statewide_rf_mm.tif",
        requires: []
      },
      stderr: {
        fileBase: "statewide_rf_mm_SE.tif",
        requires: []
      },
      anomaly: {
        fileBase: "statewide_anom.tif",
        requires: []
      },
      loocv: {
        fileBase: "statewide_anom_SE.tif",
        requires: []
      },
      metadata: {
        fileBase: "statewide_rf_mm_meta.txt",
        requires: []
      }
    };

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
        this.checkExportSize();

        //temp using temp mappings--------------
        let rasterExportBase: ExportInfo = {
          dateInfo: tempExportInfoMap.raster.dateInfo,
          baseURL: tempExportInfoMap.raster.baseURL,
          files: []
        };
        for(let info of data.files.raster) {
          let value = info.value;
          rasterExportBase.files.push(tempFileMap[value]);
        }
        this.fileData.push(rasterExportBase);

        let stationExportBase: ExportInfo = {
          dateInfo: tempExportInfoMap.station.dateInfo,
          baseURL: tempExportInfoMap.station.baseURL,
          files: []
        };
        for(let info of data.files.station) {
          let value = info.value;
          stationExportBase.files.push(tempFileMap[value]);
        }
        this.fileData.push(stationExportBase);

        //---------------------------------------
      }
    });
  }

  getExportedItemDataset(i: number) {
    let data = this.exportItems[i];
    let format: string;
    if(data.timeperiod.value == "monthly") {
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
    this.exportManager.generatePackage(this.fileData, this.emailData.emailInputControl.value);
  }
}




//file identification info
interface FileInfo {
  datatype: string,

}
