import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Moment } from 'moment';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent {

  item: ExportItem;

  datasets: any;
  exportItems: ExportItem[];

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.datasets = data.datasets;
    this.exportItems = data.items;

    this.item = {
      datasetInfo: {
        classification: null,
        subclassification: null,
        period: null
      },
      resources: []
    }
  }


  getKeys(o: any) {
    return Object.keys(o);
  }


  //return info about the export item
  close(data: any): void {
    this.dialogRef.close(data);
  }

  submit() {
    this.close(this.item);
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

interface RasterInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
}

interface StationInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
}

interface AnomalyInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
}

interface StandardErrorInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
}

interface LOOCVErrorInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
}

interface MetadataInfo extends ResourceInfo {
  dateRange: [Moment, Moment]
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
