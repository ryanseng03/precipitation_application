import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit, OnDestroy {

  @Input() map: MapComponent;

  exportForm: FormGroup;

  valid = true;

  options = {
    spatialExtent: {
      values: [{
        display: "Statewide",
        value: "st"
      }, {
        display: "Big Island",
        value: "bi"
      }, {
        display: "Maui",
        value: "ma"
      }, {
        display: "Oahu",
        value: "oa"
      }, {
        display: "Kauai",
        value: "ka"
      }],
      control: null,
      name: "Spatial Extent",
      default: "st"
    },
    timePeriod: {
      values: [{
        display: "Selected Date Range",
        value: "range"
      }, {
        display: "Focused Date",
        value: "focus"
      }],
      control: null,
      name: "Time Range",
      default: "range"
    },
    includeRaster: {
      control: null,
      default: true,
      label: "Include Raster Data"
    },
    includeStations: {
      control: null,
      default: true,
      label: "Include Station Data"
    }
  }

  constructor() {

    let formGroup: {[field: string]: FormControl} = {};
    for(let field in this.options) {
      let control = new FormControl(this.options[field].default);
      this.options[field].control = control;
      formGroup[field] = control;
    }
    this.exportForm = new FormGroup(formGroup);
  }

  ngOnInit() {
    setTimeout(() => {
      console.log(this.map);
    }, 1000);

    this.map.focusSpatialExtent("st");

    this.options.spatialExtent.control.valueChanges.subscribe((value: string) => {
      this.map.focusSpatialExtent(value);
    });

    this.options.includeStations.control.valueChanges.subscribe((value: boolean) => {
      if(!this.options.includeRaster.control.value && !value) {
        this.valid = false;
      }
      else {
        this.valid = true;
      }
    });
    this.options.includeRaster.control.valueChanges.subscribe((value: boolean) => {
      if(!this.options.includeStations.control.value && !value) {
        this.valid = false;
      }
      else {
        this.valid = true;
      }
    });
  }

  ngOnDestroy() {
    this.map.clearExtent();
  }

  onSubmit(e: any) {

  }

}
