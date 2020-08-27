import { Component, OnInit, ViewChild, Pipe, Injectable, PipeTransform, ChangeDetectionStrategy, NgZone } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service";
import { FormControl, FormGroup } from '@angular/forms';
import { EventParamRegistrarService, ParameterHook } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import {FilterPipe} from "../../../pipes/filter.pipe";


interface FilterSelectorOptions {
  name: string,
  disabled: boolean,
  control: FormControl,
  values: any
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

  options: any;


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



  constructor(private filter: SiteFilterService, private paramService: EventParamRegistrarService, private ngZone: NgZone) {

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

    for(let item in this.options) {
      let controls: {[item: string]: FormControl};
      let control = new FormControl(this.options[item].default);
      controls[item] = control;
      this.options[item].control = control;
    }

    this.options.filterValues.values = new FilterValuesManager(this.options.filterValues.control, this.options.filterFields.control, SiteInfo.getFields(), this.filterTypes)



    //this.options.filterValues.disabled = this.options.filterFields.control.value == null;

    // let valueSelectors: {[field: string]: any} = {
    //   "": []
    // };
    // let fields = SiteInfo.getFields();
    // for(let field of fields) {
    //   valueSelectors[field] = [];
    // }

    let hook: ParameterHook = paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites, (sites: SiteInfo[]) => {
      this.options.filterValues.values.populate(sites);
      this.siteInfo.sites = sites;
      this.filterSites(sites, this.filters);
    });






    hook = paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites, (sites: SiteInfo[]) => {
      this.siteInfo.sites = sites;
      for(let field of fields) {
        let values: any;
        if(this.filterTypes[field] == "selector") {
          let values = [];
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

        valueSelectors[field] = values;

        this.options.filterValues.control.setValue("");
      }

      this.filterSites(sites, this.filters);

      this.ngZone.run(() => {
        this.options.filterValues.values = valueSelectors[this.options.filterFields.control.value];
      });
    });




    this.options.filterFields.control.valueChanges.subscribe((field: string) => {
      this.options.filterValues.values = valueSelectors[field];
      this.options.filterValues.control.setValue([]);
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


  clearFilterFields() {
    this.options.filterValues.control.setValue("");
    this.options.filterFields.control.setValue("");
  }

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






    let filter: Filter = {
      type: this.options.filterType.control.value,
      field: this.options.filterFields.control.value,
      values: this.options.filterValues.control.value
    }
    this.filters.push(filter);

    this.filterSites(this.siteInfo.filteredSites, [filter]);

    this.clearFilterFields();
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
    this.filterSites(this.siteInfo.sites, this.filters);
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
  private values: {[field: string]: FilterValues}
  private filterValues: FilterValues;

  constructor(valuesControl: FormControl, fieldControl: FormControl, fields: string[], filterTypes: {[field: string]: string}) {
    this.control = valuesControl;
    fieldControl.valueChanges.subscribe((field: string) => {
      this.control.setValue(null);
      this.filterValues = this.values[field];
    });

    for(let type in this.filterTypes) {

    }
  }

  getControlType() {
    return this.filterValues.type;
  }

  populate(sites: SiteInfo[]) {
    for(let field of fields) {
      let values: any;
      if(this.filterTypes[field] == "selector") {
        let values = [];
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

      valueSelectors[field] = values;

      this.options.filterValues.control.setValue("");
    }
  }

}

abstract class FilterValues {
  constructor(sites: SiteInfo[], field: string, control: FormControl) {}
  abstract type: string;
  abstract control: FormControl;
  abstract getValues(): any;
  abstract getFilter(): Filter;
}

class RangeFilterValues extends FilterValues {
  private range: NumericRange;
  type = "range";

  constructor(sites: SiteInfo[], field: string) {
    super(sites, field);

    this.range = {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    };
    for(let site of sites) {
      let value = site[field];
      if(typeof value != "number") {
        value = Number.parseFloat(value);
      }
      if(value < this.range.min) this.range.min = value;
      if(value > this.range.max) this.range.max = value;
    }
  }

  getValues(): NumericRange {
    return this.range;
  }
}

class DiscreteFilterValues extends FilterValues {
  private values: ValueSelector[];
  type = "discrete";

  constructor(sites: SiteInfo[], field: string) {
    super(sites, field);
    this.values = [];
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
      this.values.push(selector);
    });
  }

  getValues(): ValueSelector[] {
    return this.values;
  }
}


//base class for filters
abstract class Filter {
  abstract type: "include" | "exclude";
  constructor(type: "include" | "exclude", values: T, field: string) {}

  abstract filter(site: SiteInfo): boolean;
}

//filters over a specific extent
class RangeFilter extends Filter {
  constructor(type: "include" | "exclude", values: T, field: string) {
    super();
  }

  filter(site: SiteInfo): boolean {


  }
}

class DiscreteFilter extends Filter<ValueSelector[]> {
  constructor() {
    super();
  }

  filter(site: SiteInfo): boolean {
    return filter.values.includes(value)

  }
}
