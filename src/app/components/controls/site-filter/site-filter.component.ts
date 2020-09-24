import { Component, OnInit, ViewChild, Pipe, Injectable, PipeTransform, ChangeDetectionStrategy, NgZone, ChangeDetectorRef } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service";
import { FormControl, FormGroup } from '@angular/forms';
import { EventParamRegistrarService, ParameterHook } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteInfo } from 'src/app/models/SiteMetadata';


abstract class FilterOptions {
  name: string;
  disabled: boolean;
  abstract values: any;
}

//interface can extend class and inherit member variables
interface FilterSelector extends FilterOptions {
  control: FormControl;
  default: string;
  values: ValueSelector[];
}

interface FilterValues extends FilterOptions {
  values: FilterValuesManager;
}

interface NumericRange {
  min: number,
  max: number
}

interface ValueSelector {
  display: string,
  value: any,
  include: boolean
}

// interface Filter {
//   type: "include" | "exclude"
//   field: string,
//   values: any
// }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-site-filter',
  templateUrl: './site-filter.component.html',
  styleUrls: ['./site-filter.component.scss']
})
export class SiteFilterComponent implements OnInit {

  siteInfo: {
    filteredSites: SiteInfo[];
    sites: SiteInfo[];
  }


  filters: Filter[] = [];

  filterForm: FormGroup;

  options: {
    filterType: FilterSelector,
    filterFields: FilterSelector,
    filterValues: FilterValues
  };


  //mapping of the control types for each field
  private filterTypes = {
    "skn": "selector",
    "name": "selector",
    "observer": "selector",
    "network": "selector",
    "island": "selector",
    "elevation": "range",
    "lat": "range",
    "lng": "range",
    "nceiID": "selector",
    "nwsID": "selector",
    "scanID": "selector",
    "smartNodeRfID": "selector",
    "value": "range",
    "type": "selector",
    "date": "selector"
  }



  constructor(private paramService: EventParamRegistrarService, private cdRef: ChangeDetectorRef) {

    this.siteInfo = {
     filteredSites: null,
     sites: null
    };

    //information tracking for the three controls (type, field, values)
    this.options = {
      filterType: {
        name: "Type",
        disabled: false,
        control: null,
        default: "include",
        values: [{
          display: "Include",
          value: "include",
          include: true
        }, {
          display: "Exclude",
          value: "exclude",
          include: true
        }],
      },
      filterFields: {
        name: "Property",
        disabled: false,
        control: null,
        default: "",
        values: SiteInfo.getFields().map((field: string) => {
          //names should be translated when mappings created
          let selector: ValueSelector = {
            display: field,
            value: field,
            include: true
          }
          return selector;
        })
      },
      filterValues: {
        name: "Values",
        disabled: false,
        values: null
      }
    }

    let controls: {[item: string]: FormControl} = {};
    for(let item of ["filterType", "filterFields"]) {
      let control = new FormControl(this.options[item].default);
      controls[item] = control;
      this.options[item].control = control;
    }
    this.filterForm = new FormGroup(controls);

    //create a filter value manager with the field control, complete set of fields, and field control type mapping
    this.options.filterValues.values = new FilterValuesManager(this.options.filterFields.control, SiteInfo.getFields(), this.filterTypes)

    //parameter hook for rainfall stations coming into application
    let hook: ParameterHook = paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites, (sites: SiteInfo[]) => {
      //populate the values manager with the set of site info
      this.options.filterValues.values.populate(sites);
      //trigger change detection to update controls
      cdRef.detectChanges();

      this.siteInfo.sites = sites;
      this.filterSites(sites, this.filters);
    });
  }

  //apply filter to sites and emit
  filterSites(sites: SiteInfo[], filters: Filter[]): SiteInfo[] {
    //filter set of sites using siteFilter function
    let filtered = sites.filter(this.siteFilter(filters));
    this.siteInfo.filteredSites = filtered;
    //push the filtered sites to the parameter service
    this.paramService.pushSiteFilter(filtered);
    return filtered;
  }

  //allow caller to specify filters to allow for only filter subset to be run when new filter applied (rather than redoing the whole thing)
  siteFilter(filters: Filter[]) {
    //return function for checking if site matches the set of filters
    return (site: SiteInfo): boolean => {
      //run the site through each filter and return false if it doesn;t match any of them
      for(let filter of filters) {
        if(!filter.filter(site)) {
          return false;
        }
      }
      //matches all filters, return true
      return true;
    }

  }


  // clearFilterFields() {
  //   this.options.filterValues.control.setValue("");
  //   this.options.filterFields.control.setValue("");
  // }

  ngOnInit() {

  }

  //check if filter is complete by checking if any values have been selected
  filterIncomplete(): boolean {
    let values = this.options.filterValues.values.getOutputValues();
    //console.log(values);
    return values == null || values.length == 0;
  }


  //submit selected values to create filter
  onSubmit(e) {
    //get selected field and type values from controls
    let field = this.options.filterFields.control.value;
    let type = this.options.filterType.control.value;
    //remove field from list, should only have one for each
    for(let selector of this.options.filterFields.values) {
      //find matching selector and set include to false
      if(selector.value == field) {
        selector.include = false;
        break;
      }
    }
    //create filter from the set values object
    let filter: Filter = this.options.filterValues.values.createFilter(type);
    this.filters.push(filter);
    //reset field value
    this.options.filterFields.control.setValue("");
    //run filtered sites through newly constructed filter
    this.filterSites(this.siteInfo.filteredSites, [filter]);
  }

  //delete one of the filters
  deleteFilter(e: MouseEvent, i: number) {
    e.stopPropagation();
    e.preventDefault();

    let filter = this.filters[i];
    //find field selector and set to include
    for(let selector of this.options.filterFields.values) {
      if(selector.value == filter.field) {
        selector.include = true;
        break;
      }
    }
    //remove filter from set of filters
    this.filters.splice(i, 1);
    //need to redo filters over full set of sites
    this.filterSites(this.siteInfo.sites, this.filters);
  }

  //prevent menu from closing on clicking menu item by stopping click event
  menuClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
  }
}

class FilterValuesManager {
  // private filterTypes: {[field: string]: string};
  private values: {[field: string]: FilterValueControl<any, any>};
  // private populated: boolean;
  // private fields: string[];
  private field: string;

  constructor(fieldControl: FormControl, fields: string[], filterTypes: {[field: string]: string}) {
    this.values = {};
    for(let field of fields) {
      if(filterTypes[field] == "selector") {
        this.values[field] = new DiscreteControl(field);
      }
      else {
        this.values[field] = new RangeControl(field);
      }

    }

    this.field = "";

    //update state when selected field changes
    fieldControl.valueChanges.subscribe((field: string) => {
      this.field = field;
    });
  }

  getOutputValues(): any {
    let output: any;
    if(this.values[this.field]) {
      output = this.values[this.field].getOutputValues();
    }
    else {
      output = null;
    }
    return output;
  }

  getInputValues(): any {
    let input: any;
    if(this.values[this.field]) {
      input = this.values[this.field].getInputValues();
    }
    else {
      input = null;
    }
    return input;
  }

  getControl(): FormControl {
    let control: FormControl;
    if(this.values[this.field]) {
      control = this.values[this.field].getControl();
    }
    else {
      control = null;
    }
    return control;
  }

  getControlType(): string {
    let controlType: string;
    //if input value is undefined then don't give control type to prevent issues with usage before init
    if(this.values[this.field] && this.values[this.field].getInputValues() != undefined) {
      controlType = this.values[this.field].getControlType();
    }
    else {
      controlType = null;
    }
    return controlType;
  }

  populate(sites: SiteInfo[]) {
    //this.populated = true;
    for(let field in this.values) {
      this.values[field].updateInputFromSites(sites);
    }
  }

  createFilter(type: "include" | "exclude"): Filter {
    return this.values[this.field].createFilter(type);
  }



}


//T input value type (used to populate control), V output value type (control value type)
abstract class FilterValueControl<T, V> {
  protected control: FormControl;
  //these are input values (discrete from control/output values)
  protected values: T;
  protected field: string;
  constructor(field: string, values?: T) {
    this.values = values;
    this.field = field;
    this.control = new FormControl(this.getDefault());
  }
  protected abstract getDefault(): T;

  //get form control
  getControl(): FormControl {
    return this.control;
  }

  //get input values
  public getInputValues(): T {
    return this.values;
  }

  //get output values from control
  public getOutputValues(): V {
    return this.control.value;
  }

  //sets input values
  protected updateInput(values: T) {
    this.values = values;
    //should reset form control when values updated
    this.control.setValue(this.getDefault());
  }

  //abstract methods, specific to continuous/discreet control types
  public abstract updateInputFromSites(sites: SiteInfo[]): void;

  public abstract createFilter(type: "include" | "exclude"): Filter;

  public abstract getControlType(): string;
}

//input value is the full range, output is the subrange
class RangeControl extends FilterValueControl<NumericRange, NumericRange> {
  //default full range of values
  protected getDefault(): NumericRange {
    return this.values;
  }

  //get input from sites
  public updateInputFromSites(sites: SiteInfo[]): void {
    let range: NumericRange = {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    };
    //find range of values
    for(let site of sites) {
      let value = site[this.field];
      if(typeof value != "number") {
        value = Number.parseFloat(value);
      }
      if(value < range.min) range.min = value;
      if(value > range.max) range.max = value;
    }
    //update value range
    this.updateInput(range);
  }

  //construct filter from range
  public createFilter(type: "include" | "exclude"): RangeFilter {
    return new RangeFilter(type, this.getOutputValues(), this.field);
  }

  //get control type for generating html control
  public getControlType(): string {
    return "range";
  }
}

//input value is the set of selectors used to generate list, output is the set of selected values
class DiscreteControl extends FilterValueControl<ValueSelector[], string[]> {
  //default value empty list
  protected getDefault(): ValueSelector[] {
    return [];
  }

  //get field values from set of sites
  public updateInputFromSites(sites: SiteInfo[]) {
    //set of ValueSelectors, display, value, include fields used for generating 
    let selectors: ValueSelector[] = [];
    //only want unique values so add them to a set
    let uniqueVals = new Set<any>();
    for(let site of sites) {
      let value = site[this.field];
      uniqueVals.add(value);
    }
    //generate selector info from each unique value
    uniqueVals.forEach((value: any) => {
      let selector: ValueSelector = {
        display: value.toString(),
        value: value,
        include: true
      };
      selectors.push(selector);
    });
    //update input values based on generated items
    this.updateInput(selectors);
  }

  //create a filter from the current field and selected values
  public createFilter(type: "include" | "exclude"): DiscreteFilter {
    return new DiscreteFilter(type, this.getOutputValues(), this.field);
  }

  //control type for generating html control
  public getControlType(): string {
    return "selector";
  }
}




//base class for filters
abstract class Filter {
  type: "include" | "exclude";
  field: string;
  values: any;
  //set filter type field and values
  constructor(type: "include" | "exclude", values: any, field: string) {
    this.type = type;
    this.values = values;
    this.field = field;
  }

  //check if the site info object matches the filter
  filter(site: SiteInfo): boolean {
    let value = site[this.field];
    //make sure value is included in filter
    if(this.type == "include") {
      //value not in filter, return false
      if(!this.includes(value)) {
        return false;
      }
    }
    //value should not be in filter
    else {
      //value in filter, return false
      if(this.includes(value)) {
        return false;
      }
    }
    return true;
  }

  //abstract method to check for filter inclusion
  protected abstract includes(value: any): boolean;

  //abstract method to construct string from values
  abstract getValuesText(): string;

}


//filters for continuous values
class RangeFilter extends Filter {
  constructor(type: "include" | "exclude", values: NumericRange, field: string) {
    super(type, values, field);
  }

  //check if value falls in range
  includes(value: number | string): boolean {
    if(typeof value != "number") {
      value = Number.parseFloat(value);
    }
    return value >= this.values.min && value < this.values.max;
  }

  //construct range string from min and max
  getValuesText(): string {
    return `${this.values.min} - ${this.values.max}`;
  }
}

//filters for categorical values
class DiscreteFilter extends Filter {
  constructor(type: "include" | "exclude", values: string[], field: string) {
    super(type, values, field);
  }

  //check if the value is in the set of values 
  includes(value: string): boolean {
    return this.values.includes(value);
  }

  //combine the set of values into a comma separated list string
  getValuesText(): string {
    return this.values.join(", ");
  }
}
