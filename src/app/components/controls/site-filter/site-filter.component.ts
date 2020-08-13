import { Component, OnInit, ViewChild, Pipe, Injectable, PipeTransform } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service";
import { FormControl, FormGroup } from '@angular/forms';
import { EventParamRegistrarService, ParameterHook } from 'src/app/services/inputManager/event-param-registrar.service';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import {FilterPipe} from "../../../pipes/filter.pipe";



interface FilterSelectorOptions {
  name: string,
  disabled: boolean,
  control: FormControl,
  values: ValueSelector[] | NumericRange
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

interface Filter {
  type: "include" | "exclude"
  field: string,
  values: any[] | NumericRange
}

@Component({
  selector: 'app-site-filter',
  templateUrl: './site-filter.component.html',
  styleUrls: ['./site-filter.component.scss']
})
export class SiteFilterComponent implements OnInit {

  filters: Filter[] = [];

  filterForm = new FormGroup({
    filterType: new FormControl("include"),
    filterFields: new FormControl(null),
    filterValues: new FormControl(null)
  });

  options: {
    filterType: FilterSelectorOptions,
    filterFields: FilterSelectorOptions,
    filterValues: FilterSelectorOptions
  }


  filterTypes = {
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
    this.options = {
      filterType: {
        name: "Type",
        disabled: false,
        control: <FormControl>this.filterForm.controls["filterType"],
        values: [{
          display: "Include",
          value: "include",
          include: true
        }, {
          display: "Exclude",
          value: "exclude",
          include: true
        }]
      },
      filterFields: {
        name: "Property",
        disabled: false,
        control: <FormControl>this.filterForm.controls["filterFields"],
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
        control: <FormControl>this.filterForm.controls["filterValues"],
        values: []
      }
    }
    //this.options.filterValues.disabled = this.options.filterFields.control.value == null;
    
    let valueSelectors: {[field: string]: ValueSelector[]} = {};
    for(let field of SiteInfo.getFields()) {
      valueSelectors[field] = [];
    }

    let hook: ParameterHook = paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.sites, (sites: SiteInfo[]) => {
      for(let field in valueSelectors) {
        let selectors = [];
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
          selectors.push(selector);
        });
        
        valueSelectors[field] = selectors;
        this.clearFilterFields();
      }
    });


    this.options.filterFields.control.valueChanges.subscribe((field: string) => {
      this.options.filterValues.values = valueSelectors[field];
      this.options.filterValues.control.setValue([]);
    });
  }

  clearFilterFields() {
    this.options.filterValues.control.setValue(null);
    this.options.filterFields.control.setValue(null);
  }

  ngOnInit() {
    
  }

  filterIncomplete(): boolean {
    let values = this.options.filterValues.control.value;
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
    console.log(this.options.filterValues.control.value);
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

    this.clearFilterFields();
  }

  deleteFilter(i: number) {
    let filter = this.filters[i];
    for(let selector of (<ValueSelector[]>this.options.filterFields.values)) {
      if(selector.value == filter.field) {
        selector.include = true;
        break;
      }
    }
    this.filters.splice(i, 1);
    
  }
}
