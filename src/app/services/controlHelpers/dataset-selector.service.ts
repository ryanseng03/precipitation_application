import { Injectable } from '@angular/core';
import {FormControl} from '@angular/forms';
import moment, { Moment } from 'moment';

@Injectable({
  providedIn: 'root'
})
export class DatasetSelectorService {

  constructor() { }

//   export interface DatasetConfig {
//     initialSetIndex: number,
//     datasets: any[]
// }

/*
dataset hierarchy:
classification (rainfall, temp, etc)
- date range: user selected, valid range controlled by classification (encompassing all available datasets for classification)
-- datasets: set of subclassifications, their set info, date ranges they cover

have datasets be auto selected based on date range, with hybrids used for ranges that cover multiple
provide description of dataset(s) being used and the time ranges they exist for, and allow user to select order of preference of datasets (allows for expansion to more than 2 subclasses)
dataset with highest preference that includes data for a given date will be used

have service determine dataset to be used, this will construct a set of properties to be used in query... make sure to also integrate into caching system

new control type, ordered list, draggable elements
cdkDropList around a set of cdkDrag

note category select, date range select, and dataset precedence selector (if hybrid) are global (should be available for all datasets), rest of controls and info are based on Dataset info
*/

config: any = {
    initialSetIndex: 0,
    //categorized by type
    datasets: {
        rainfall: {
            range: {
                start: "1990-01-01",
                end: "2019-12-31"
            },
            //subclass selected automatically based on selected time range, should show what type of data will be displayed though (description of ranges)
            //if overlap then have option of which to use as default
            subclasses: {
              //used for overlap
              default: "new",
              values: {
                new: {
                  range: {
                    start: "1990-01-01",
                    end: "2019-12-31"
                  }
                },
                //what should the range on this actually be?
                legacy: {
                  range: {
                    start: "1990-01-01",
                    end: "2019-12-31"
                  }
                }
              }
            },
            // controls
            // timesteps: ["monthly"],
            methods: ["new"],
            timestepsAvailable: ["monthly", "daily"],
            fillTypes: ["filled", "partial", "unfilled"]
        }
    }
}

// let selectors = [];

// //generate discreet sets
// for(let dataset of config.datasets) {
//     let base = {

//     }
// }

  getDatasets(): string[] {
      return Object.keys(this.config);
  }
}

//don't give date option for vis,

//classifications of vis items --- map, station/value items
//value items have timeseries data attached - this is not part of the selected dataset but will be options for generating time series vis

//what else, vis time granularities total (order of granularity), export time granularities, time granularities per i

/*
need general info (applicable to any data class)
- classification (readonly)
- date range (readonly)
- subclasses (readonly)
-- subrange (readonly)
-- vis included items (readonly)
-- export included items (readonly)
- subclass precedence
*/

//note vis items have to be well defined for later use

//have export things be completely separate, allow a set to be made with multiple classes of data

//in time series vis have export current vis data options, including single station

//initial view will be just for vis data, after selecting set immediately swap to tables/time series view, maybe include link to export screen in this view

//export form, set of configurable objects

//note that map and station data may have different ranges
//map data necessarily constrained by station data but not other way around (cant have map data without station data)
//so global range is map range
//station specific range only good for 
//what about export, are the export files being constrained
//lets not worry about this for now, for now constrain time series data to the specified subset (otherwise theres a question of "why can't I see the station in the other subsets?" if stations aren't displayed)
//but want to grab data somehow... export will have to incorporate this
//!!
//will stations have active ranges??? -- yes
//actually, just use active range anotation in station metadata

//NOTE timeseries granularity is just the time between steps, the range of the set is separate (and should be a minimum of the next granularity up)

//remember these are all example data right now

//ACTUALLY, STORE ALL "TIMESERIES" INFO IN STATION METADATA, ALL THE RANGES AND WHATNOT ARE SPECIFIC TO THE STATION, AND ALL DATA IS ISOLATED TO A SINGLE STATION, HAVE IT BE PART OF THAT (ALSO CAN HAVE STATIONS WITH DIFFERENT AVAILABLE GRANULARITIES THAT WAY)

class Dataset_tt {
  dataset = {
    classification: "rainfall",
    subclasses: [{
      range: {
        min: moment("2012-01"),
        max: moment("2019-12")
      },
      granularity: "",
      map: {},
      stations: {
        timeseries: ["monthly", "daily"],
        //options are things that may change between data sets, set of values referenced by assigned tag
        //note need to add this tag annotation to the dataset format
        //this will store whatever was selected during data set selection for these options
        options: {
          fill: "partial"
        }
      }
    }]
  }

  export = {
    rainfall: {

    },
    
  }

  getTimeseriesGranularities(date: Moment) {
    let subset = this.getInfoOnDate(date);
    return subset.stations.timeseries;
  }

  getInfoOnDate(date: Moment) {
    let subclasses = this.dataset.subclasses;
    let firstSubclass = null;
    for(let subclass of subclasses) {
      //check if date in range
      if(date.isBetween(subclass.range.min, subclass.range.max)) {
        firstSubclass = subclass;
        break;
      }
    }
    return firstSubclass;
  }
}


class SelectedSetInfo {

  
  //what things have selections for vis?
  //options (variable between sets), granularity, classification, precedence

  t = {
    classification: "rainfall",
    dateRange: {
      min: moment("2012-01"),
      max: moment("2019-12")
    },
    subsets: [
      {
        subclassification: "new",
        precedence: 0,
        range: {
          min: moment("2012-01"),
          max: moment("2019-12")
        },
        visItems: {
          granularities: ["monthly"],
          options: [],
          map: {
            options: []
          },
          stations: {
            timeseries: ["monthly", "daily"],
            options: [
              {
                type: "select",
                label: "Fill Type",
                values: {
                  "unfilled": "Unfilled",
                  "partial": "Partial Filled",
                  "filled": "Filled"
                }
              }
            ]
          }
        },
      },
      {
        subclassification: "legacy",
        precedence: 1,
        visItems: {
          map: {
            min: moment("2012-01"),
            max: moment("2019-12")
          },
          stations: null
        },
      }
    ]
  }



  //length should be one less than date list
  datasets: Dataset[];
  dates: Moment[];

  getDatasetForDate(date: Moment) {

  }

  getDatasetsForDateRange

}


class Granularity {
  name: string;
  precedence: number;

  constructor(name: string, precedence: number) {
    this.name = name;
    this.precedence = precedence;
  }


}

class VisItemPack {
  mainGranularity: string
  items
}

class ExportItemPack {

}

abstract class DataItem {
  value: string
}

abstract class VisItem extends DataItem {

}

class ValueItem extends VisItem {
  timeSeriesGranularities: string[];

}

class MapItem extends VisItem {

}

//what is needed for generating request? (identifying resource)
class ExportItem extends DataItem {

}



//separate export info and display info
//store information on what items are available for display and export, and how to retrieve the data
//display info should have a static set of things that can be displayed, need to know for application, export can have anything, just need info on how to retrieve resource
//no, because need some sort of function based on date to get actual resource location, just have classifications of export items and have query info generated by service that handles that stuff
//just make sure you have a handler for each of the types, would have needed to add that anyway
//this is just a set of tags that identify which handler you'll need to use
//in whatever service using to do actual export logic it should have a mapping of these tags along with date and classification/subclassification and determine how to retreive resource
//same with display stuff, don't have the query logic here, this should just tag what items should be retrieved
//NOTE THAT YOULL NEED TO ADD CAVEAT TO DOWNLOAD PACKAGE STUFF THAT NOT ALL DATA MIGHT BE THERE, ADD LOGIC TO DISPLAY NOTHING IF AN ITEM ISNT RETREIVED (e.g. if not retreiving rainfall station data)
//also need other information on what data to use, what is to be selected by users, what is bound between display and export options and what is separately selected by export
//"display" options are logically first, and any data with same tag shares any dataset selection properties with same export tag, so have "bound" flag to indicate implicit carryover
//use any selected display data to seed export data if not bound
//e.g. for fill type have it unbound (user can select multiples for export), but seed export by having selected display fill type initially selected

//export data implicitly has a toggle control
class Dataset {
  subclass: string
  label: string;
  info: string;
  //sets of tags of items that are valid for these categories
  displayOpts: DisplayItemOptions;
  exportOpts: ExportItemOptions;
  //

  dateRange: DateRange;

  constructor(subclass: string, label: string, displayOpts: DisplayItemOptions, exportOpts: ExportItemOptions, dateRange: DateRange, info: string) {

  }

  //bind

}

class DatasetGroup {
  classification: string;

}

interface DisplayItemOptions {
  [tag: string]: AbstractControlData[]
}
interface ExportItemOptions {
  [tag: string]: AbstractControlData[]
}

//typings for specific tags to indicate availability of data for display and export
type DisplayTag = "raster" | "station";
type ExportTag = "raster" | "station" | "anomaly" | "se" | "anomaly_se" | "metadata";

interface DateRange {
  start: Moment,
  end: Moment
}

abstract class AbstractControlData {
  type: string
  control: FormControl;
  defaultValue: any;
  label: string;
  info: string;

  constructor(label: string, type: string, defaultValue: any, info?: string) {
    this.type = type;
    this.control = new FormControl();
    this.info = info;
  }
}

class SelectControl extends AbstractControlData {
  defaultValue: string;
  values: SelectorValues[];
  allowBlank: boolean;

  constructor(label: string, defaultValue: string, values: SelectorValues[], allowBlank: boolean = true, info?: string) {
    let type = "select"
    super(label, type, defaultValue, info)
    this.values = values;
    this.allowBlank = allowBlank;
  }
}

class ToggleControl extends AbstractControlData {
  defaultValue: boolean

  constructor(label: string, defaultValue: boolean, info?: string) {
    let type = "toggle"
    super(label, type, defaultValue, info)
  }
}


interface SelectorValues {
  value: string,
  label: string
}
