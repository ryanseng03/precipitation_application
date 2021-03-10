import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {

  exportItem = {
    classification:
  }

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

  }




  //return info about the export item
  close(data: any): void {
    this.dialogRef.close();
  }

}

//need date range, class, subclass

interface ExportItem {
  classification: string,
  //info specific to file type for identifying resource
  info: ResourceInfo
}

type ResourceType = "raster" | "station" | "anomaly" | "standard_error" | "LOOCV_error" | "metadata";

abstract interface ResourceInfo {
  type: ResourceType
}

interface RasterInfo extends ResourceInfo {

}

interface StationInfo extends ResourceInfo {

}

interface AnomalyInfo extends ResourceInfo {

}

interface StandardErrorInfo extends ResourceInfo {

}

interface LOOCVErrorInfo extends ResourceInfo {

}

interface MetadataInfo extends ResourceInfo {

}
