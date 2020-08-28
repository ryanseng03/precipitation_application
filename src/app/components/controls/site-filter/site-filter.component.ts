import { Component, OnInit, ViewChild, Pipe, Injectable, PipeTransform, ChangeDetectionStrategy, NgZone } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service";
import { FormControl, FormGroup } from '@angular/forms';
import { EventParamRegistrarService, ParameterHook } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteInfo } from 'src/app/models/SiteMetadata';


abstract class FilterOptions {
  name: string;
  disabled: boolean;
  control: FormControl;
  default: any;
  abstract values: any;
}

//interface can extend class and inherit member variables
interface FilterSelector extends FilterOptions {
  values: any;
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



  constructor(private filter: SiteFilterService, private paramService: EventParamRegistrarService) {

    this.siteInfo = {
     filteredSites: null,
     sites: null
    };

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
        default: null,
        control: null,
        values: null
      }
    }

    let controls: {[item: string]: FormControl} = {};
    for(let item in this.options) {
      let control = new FormControl(this.options[item].default);
      controls[item] = control;
      this.options[item].control = control;
    }
    this.filterForm = new FormGroup(controls);

    this.options.filterValues.values = new FilterValuesManager(this.options.filterValues.control, this.options.filterFields.control, SiteInfo.getFields(), this.filterTypes)


    let hook: ParameterHook = paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites, (sites: SiteInfo[]) => {
      this.options.filterValues.values.populate(sites);
      this.siteInfo.sites = sites;
      this.filterSites(sites, this.filters);
    });
  }

  //apply filter to sites and emit
  filterSites(sites: SiteInfo[], filters: Filter[]): SiteInfo[] {
    let filtered = sites.filter(this.siteFilter(filters));
    this.siteInfo.filteredSites = filtered;
    this.paramService.pushSiteFilter(filtered);
    return filtered;
  }

  //allow caller to specify filters to allow for only filter subset to be run when new filter applied (rather than redoing the whole thing)
  siteFilter(filters: Filter[]) {
    return (site: SiteInfo): boolean => {
      for(let filter of filters) {
        if(!filter.filter(site)) {
          return false
        }

        // let type = this.filterTypes[filter.field];
        // let includes = (value: any) => {
        //   if(type == "selector") {
        //     return filter.values.includes(value)
        //   }
        //   else {
        //     if(typeof value != "number") {
        //       value = Number.parseFloat(value);
        //     }
        //     return value >= filter.values.min && value < filter.values.max;
        //   }
        // }

        // let value = site[filter.field];
        // if(filter.type == "include") {
        //   if(!includes(value)) {
        //     return false;
        //   }
        // }
        // //exclude
        // else {
        //   if(includes(value)) {
        //     return false;
        //   }
        // }
      }
      return true;
    }

  }


  // clearFilterFields() {
  //   this.options.filterValues.control.setValue("");
  //   this.options.filterFields.control.setValue("");
  // }

  ngOnInit() {

  }

  filterIncomplete(): boolean {
    let values = this.options.filterValues.control.value;
    console.log(values);
    return values == null || values.length == 0;
  }



  // options = [
  //   {
  //     display: 'One',
  //     value: '1'
  //   }, {
  //     display: 'Two',
  //     value: '2'
  //   }, {
  //     display: 'Three',
  //     value: '3'
  //   }, {
  //     display: 'Four',
  //     value: '4'
  //   }, {
  //     display: 'Five',
  //     value: '5'
  //   }, {
  //     display: 'Six',
  //     value: '6'
  //   }
  // ];


  onSubmit(e) {
    //remove field from list, should only have one for each
    for(let selector of (<ValueSelector[]>this.options.filterFields.values)) {
      if(selector.value == this.options.filterFields.control.value) {
        selector.include = false;
        break;
      }
    }
    let filterValues: FilterValuesManager = this.options.filterValues.values;
    let type: string = filterValues.getControlType();
    if(type == null) {
      throw new Error("Invalid form state");
    }
    filterValues.getValues()

    let filter: Filter = filterValues.createFilter(this.options.filterType.control.value);

    this.options.filterFields.control.setValue("");
  }

  deleteFilter(e: MouseEvent, i: number) {
    e.stopPropagation();
    e.preventDefault();

    let filter = this.filters[i];
    for(let selector of (<ValueSelector[]>this.options.filterFields.values)) {
      if(selector.value == filter.field) {
        selector.include = true;
        break;
      }
    }
    this.filters.splice(i, 1);
    //need to redo filters over full set of sites
    // this.filterSites(this.siteInfo.sites, this.filters);
  }

  menuClick(e: MouseEvent) {
    console.log("click!");
    e.stopPropagation();
    e.preventDefault();
  }
}

class FilterValuesManager {
  private control: FormControl;
  private filterTypes: {[field: string]: string}
  private values: {[field: string]: any}
  private populated: boolean;
  private fields: string[];
  private field: string;

  constructor(valuesControl: FormControl, fieldControl: FormControl, fields: string[], filterTypes: {[field: string]: string}) {
    this.populated = false;
    this.control = valuesControl;
    this.filterTypes = filterTypes;
    this.fields = fields;
    this.field = "";
    fieldControl.valueChanges.subscribe((field: string) => {
      this.control.setValue(null);
      this.field = field;
    });
  }

  getValues(): any {
    return this.values[this.field];
  }

  getControlType(): string {
    let type = null
    if(this.populated) {
      type = this.filterTypes[this.field];
    }
    return type;
  }

  populate(sites: SiteInfo[]) {
    this.populated = true;
    for(let field of this.fields) {
      let values: any;
      if(this.filterTypes[field] == "selector") {
        let values: ValueSelector[] = [];
        let uniqueVals = new Set<any>();
        for(let site of sites) {
          let value = site[field];
          uniqueVals.add(value);
        }
        uniqueVals.forEach((value: any) => {
          let selector: ValueSelector = {
            display: value.toString(),
            value: value,
            include: true
          };
          values.push(selector);
        });
      }
      else {
        let range: NumericRange = {
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY
        };
        for(let site of sites) {
          let value = site[field];
          if(typeof value != "number") {
            value = Number.parseFloat(value);
          }
          if(value < range.min) range.min = value;
          if(value > range.max) range.max = value;
        }
        values = range;
      }
    }
  }

  createFilter(type: "include" | "exclude"): Filter {
    let filter: Filter;
    if(!this.populated) {
      filter = null;
    }
    if(this.filterTypes[this.field] == "selector") {
      filter = new DiscreteFilter(type, this.control.value, this.field);
    }
    else {
      filter = new RangeFilter(type, this.control.value, this.field);
    }
    return filter;
  }

}




//base class for filters
abstract class Filter {
  type: "include" | "exclude";
  field: string;
  values: any;
  constructor(type: "include" | "exclude", values: any, field: string) {
    this.type = type;
    this.values = values;
    this.field = field;
  }

  filter(site: SiteInfo): boolean {
    let value = site[this.field];
    if(this.type == "include") {
      if(!this.includes(value)) {
        return false;
      }
    }
    //exclude
    else {
      if(this.includes(value)) {
        return false;
      }
    }
  }

  protected abstract includes(value: any)
}

//filters over a specific extent
class RangeFilter extends Filter {
  constructor(type: "include" | "exclude", values: NumericRange, field: string) {
    super(type, values, field);
  }

  includes(value: number | string): boolean {
    if(typeof value != "number") {
      value = Number.parseFloat(value);
    }
    return value >= this.values.min && value < this.values.max;
  }
}

class DiscreteFilter extends Filter {
  constructor(type: "include" | "exclude", values: string[], field: string) {
    super(type, values, field);
  }

  includes(value: string): boolean {
    return this.values.includes(value);
  }
}
