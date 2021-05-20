
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ExportAddItemComponent, ExportDataInfo } from 'src/app/dialogs/export-add-item/export-add-item.component';
import { ExportUnimplementedComponent } from 'src/app/dialogs/export-unimplemented/export-unimplemented.component';
import { ExportManagerService } from 'src/app/services/export/export-manager.service';


@Component({
  selector: 'app-export-interface',
  templateUrl: './export-interface.component.html',
  styleUrls: ['./export-interface.component.scss']
})
export class ExportInterfaceComponent implements OnInit {

  exportItems: ExportDataInfo[] = [];

  constructor(public dialog: MatDialog, private exportManager: ExportManagerService) {
  }

  ngOnInit() {
    //this.addExportData(-1);
  }


  removeExportItem(i: number) {
    this.exportItems.splice(i, 1);
  }

  addExportData(i: number) {
    let initData: ExportDataInfo = i < 0 ? null : this.exportItems[i]

    //panelClass applies global class to form (styles.scss)
    const dialogRef = this.dialog.open(ExportAddItemComponent, {
      width: "80%",
      height: "90%",
      panelClass: "export-dialog",
      data: initData
    });
    dialogRef.afterClosed().subscribe((data: ExportDataInfo) => {
      console.log(data);
      if(data) {
        if(i < 0) {
          this.exportItems.push(data);
        }
        else {
          this.exportItems.splice(i, 1, data);
        }
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
    const dialogRef = this.dialog.open(ExportUnimplementedComponent, {
      width: '250px',
      data: null
    });
  }
}




//file identification info
interface FileInfo {
  datatype: string,

}
