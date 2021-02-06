import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { MapComponent } from '../map/map.component';
import {ExportUnimplementedComponent} from "../../dialogs/export-unimplemented/export-unimplemented.component";
import { MatDialog } from '@angular/material/dialog';
import {ExportAddItemComponent} from "../../dialogs/export-add-item/export-add-item.component"

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit, OnDestroy {

  @Input() map: MapComponent;

  itemTest: Set<any> = new Set(["a", "b", "c"]);

  exportForm: FormGroup;

  //WEIRD [OBJECT OBJECT] ERROR, ExpressionChangedAfterItHasBeenCheckedError ON CHECK EMAIL, AND NEED TO REMOVE EMAIL CONTROL FROM FORM VALIDATION WHEN NOT SELECTED


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
      debounce: false,
      control: null,
      selectors: [
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
    },
    selectAll: {
      control: null,
      label: "Select All",
      debounce: false
    },
    useEmail: {
      control: null,
      saveValue: false
    },
    email: {
      control: null
    }
  }

  //Rainfall maps, anomaly maps, standard error maps, station data, and LOOCV error metrics, metadata

  constructor(public dialog: MatDialog, private changeDetector: ChangeDetectorRef) {
    this.controls.spatialExtent. control = new FormControl("st");
    this.controls.timePeriod. control = new FormControl("range");
    this.controls.email.control = new FormControl("");

    let selectAllControl = new FormControl(true);
    this.controls.selectAll.control = selectAllControl;

    this.controls.useEmail.control = new FormControl(false);

    let formGroup: {[field: string]: AbstractControl} = {};
    let selectorControls: FormControl[] = [];

    for(let selector of this.controls.includeTypes.selectors) {
      let control = new FormControl(selector.default);
      selectorControls.push(control);
      selector.control = control;
    }
    let selectorGroup = new FormArray(selectorControls, this.validateRequiredFormArr.bind(this))
    this.controls.includeTypes.control = selectorGroup;


    for(let label in this.controls) {
      formGroup[label] = this.controls[label].control;
    }
    this.exportForm = new FormGroup(formGroup);


  }

  ngOnInit() {
    let updateAllSelected = (values: boolean[]) => {
      let allSelected = values.every(Boolean);
      //only change if modified by user (debounce if changed as a result of other control changes)
      if(!this.controls.includeTypes.debounce) {
        this.controls.selectAll.debounce = true;
        this.controls.selectAll.control.setValue(allSelected)
      }
      else {
        this.controls.includeTypes.debounce = false;
      }
      this.controls.selectAll.label = allSelected ? "Deselect All" : "Select All";
    };

    this.controls.includeTypes.control.valueChanges.subscribe((values: boolean[]) => {
      updateAllSelected(values);
    });

    //need to change what this does based on whats selected
    this.controls.selectAll.control.valueChanges.subscribe((value: boolean) => {
      //only change if modified by user (debounce if changed as a result of other control changes)
      if(!this.controls.selectAll.debounce) {
        let len = this.controls.includeTypes.control.value.length;
        let values = Array(len).fill(value);
        this.controls.includeTypes.debounce = true;
        this.controls.includeTypes.control.setValue(values);
      }
      else {
        this.controls.selectAll.debounce = false;
      }
    });

    this.controls.useEmail.control.valueChanges.subscribe((value: boolean) => {
      let emailControl: AbstractControl = this.controls.email.control;
      if(value) {
        emailControl.setValidators(Validators.email);
      }
      else {
        emailControl.clearValidators();
      }
      emailControl.updateValueAndValidity();
      this.changeDetector.detectChanges();
    });

    updateAllSelected(this.controls.includeTypes.control.value);

    this.map.focusSpatialExtent(this.controls.spatialExtent.control.value);

    this.controls.spatialExtent.control.valueChanges.subscribe((value: string) => {
      this.map.focusSpatialExtent(value);
    });

    this.checkSetRequireEmail();

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

  onSubmit(e: any): void {
    this.openUnimplementedDialog();
    //send form data to service, generate package or create notification that the download package will be sent to email when ready
  }


  //form validators/helpers
  validateRequiredFormArr(group: FormArray): null | ValidationErrors {
    return this.someSelected(group) ? null : {error: "At least one option must be selected."}
  }


  someSelected(group: FormArray): boolean {
    return group.value.some(Boolean);
  }

  allSelected(group: FormArray): boolean {
    return group.value.every(Boolean);
  }

  checkSetRequireEmail() {
    //TEMP FOR TESTING, CHANGE THIS TO CHECK IF EMAIL REQUIRED BASED ON PACKAGE SIZE
    let requireEmail = false;
    this.setRequireEmail(requireEmail);
  }

  //check if download package requires email
  setRequireEmail(require: boolean) {
    this.controls.useEmail.saveValue = this.controls.useEmail.control.value;
    if(require) {
      this.controls.useEmail.control.setValue(true);
      this.controls.useEmail.control.disable();
    }
    else {
      this.controls.useEmail.control.setValue(this.controls.useEmail.saveValue);
      this.controls.useEmail.control.enable();
    }

  }

  // //note these are for form arrays since doing type conversions with multitypes is weird and overloading doesn't work as necessary for this
  // countSelected(group: FormArray): number {
  //   let selected = 0;
  //   for(let control of group.controls) {
  //     if(control.value) {
  //       selected++;
  //     }
  //   }
  //   return selected;
  // }


  openUnimplementedDialog(): void {
    const dialogRef = this.dialog.open(ExportUnimplementedComponent, {
      width: '250px',
      data: null
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   console.log('The dialog was closed');
    //   this.animal = result;
    // });
  }


  removeItem(item: any) {
    this.itemTest.delete(item);
  }

  t = 0;
  openAddItemDialog(): void {
    const dialogRef = this.dialog.open(ExportAddItemComponent, {
      width: '250px',
      data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.itemTest.add(this.t++);
      }

    });

  }

}



