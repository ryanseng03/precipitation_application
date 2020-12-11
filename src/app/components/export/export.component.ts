import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
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

  email = new FormControl("", [Validators.email]);
  selectorGroup: FormArray;

  //will any of these things change based on type (i.e. not rainfall)?
  controls = {
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
    includeTypes: {
      selectors: [
        {
          control: null,
          default: true,
          label: "Include Raster Data",
          info: ""
        },
        {
          control: null,
          default: true,
          label: "Include Station Data",
          info: ""
        },
        {
          control: null,
          default: true,
          label: "Include Anomaly Map",
          info: "The ratio of the observed value to the mean monthly value at the same location"
        },
        {
          control: null,
          default: true,
          label: "Include Standard Error Map",
          info: ""
        },
        {
          control: null,
          default: true,
          label: "Include LOOCV Error Metrics",
          info: "Leave one out cross-validation metrics."
        },
        {
          control: null,
          default: true,
          label: "Include Metadata",
          info: ""
        }
      ]
    }
  }

  //Rainfall maps, anomaly maps, standard error maps, station data, and LOOCV error metrics, metadata

  constructor() {

    let formGroup: {[field: string]: AbstractControl} = {};
    let selectorGroup: FormControl[] = []; 
    
    for(let selector of this.controls.includeTypes.selectors) {
      let control = new FormControl(true);
      selectorGroup.push(control);
      selector.control = control;
    }
    this.selectorGroup = new FormArray(selectorGroup);
    formGroup["email"] = this.email;
    formGroup["includeTypes"] = this.selectorGroup;
    this.exportForm = new FormGroup(formGroup);
  }

  ngOnInit() {
    this.validateForm();
    setTimeout(() => {
      console.log(this.map);
    }, 1000);

    this.map.focusSpatialExtent("st");

    this.controls.spatialExtent.control.valueChanges.subscribe((value: string) => {
      this.map.focusSpatialExtent(value);
    });

    // this.options.includeStations.control.valueChanges.subscribe((value: boolean) => {
    //   if(!this.options.includeRaster.control.value && !value) {
    //     this.valid = false;
    //   }
    //   else {
    //     this.valid = true;
    //   }
    // });
    // this.options.includeRaster.control.valueChanges.subscribe((value: boolean) => {
    //   if(!this.options.includeStations.control.value && !value) {
    //     this.valid = false;
    //   }
    //   else {
    //     this.valid = true;
    //   }
    // });
  }

  ngOnDestroy() {
    this.map.clearExtent();
  }

  validateForm() {
  }

  onSubmit(e: any) {
    //send form data to service, generate package or create notification that the download package will be sent to email when ready
  }

}
