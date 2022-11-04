import { StringMap } from "./types";
import { Moment } from "moment";
import { DateManagerService } from "../services/dateManager/date-manager.service";
import { UnitOfTime } from "../services/dataset-form-manager.service";



//use this for now
let resourceMap: {[resource: string]: ResourceReq}


export interface ResourceReq {
  datatype: string,
  dates?: {
    start: string,
    end: string,
    period: UnitOfTime
  },
  group: StringMap,
  data: StringMap,
  //define this later
  filterOpts: any
}

export interface ExportInfo {
  datatype: string,
  datatypeLabel: string,
  dates: {
    periodLabel: string,
    period: UnitOfTime,
    start: Moment,
    end: Moment
  },
  //this should be moved to variable stuff
  tier: string,
  //need to change this a bit for other groups
  files: {
    stations: {
      group: StringMap,
      data: {
        label: string,
        data: StringMap
      }[]
    },
    raster: {
      group: StringMap,
      data: {
        label: string,
        data: StringMap
      }[]
    }
  }
};

// export interface ResourceInfo {
//   datatype: string,
//   fileGroup: {[item: string]: string},
//   fileData: {
//     dates?: {
//       start: string,
//       end: string,
//       period: Period
//     }
//     fields: {
//       [field: string]: string
//     }
//   },
//   //define this later
//   filterOpts: any
// }

// interface ResourceData {
//   datatype: string,
//   fileGroup: {[tag: string]: SelectorData},
//   fileData: {
//     dates?: {
//       start: string,
//       end: string,
//       period: Period
//     }
//     fields: {
//       [field: string]: string
//     }
//   },
//   //define this later
//   filterOpts: any
// }

//each file should have its own ResourceReq

export class ExportData {
  private data: ExportInfo;
  private dateService: DateManagerService;

  constructor(data: ExportInfo, dateService: DateManagerService) {
    this.dateService = dateService;
    this.data = data;
  }

  getExportInfo(): ExportInfo {
    return this.data;
  }


  getLabelInfo(): {setLabel: string, files: string[]} {
    let setLabel = this.data.datatypeLabel;
    let dates = this.data.dates;
    if(dates) {
      let formattedStart = this.dateService.dateToString(dates.start, dates.period, true);
      let formattedEnd = this.dateService.dateToString(dates.end, dates.period, true);
      setLabel += ` ${dates.periodLabel} ${formattedStart} - ${formattedEnd}`;
    }
    let fileLabels = [];
    for(let file of this.data.files.raster.data.concat(this.data.files.stations.data)) {
      fileLabels.push(file.label);
    }
    return {
      setLabel: setLabel,
      files: fileLabels
    }
  }

  getNumFiles(): number {
    let dates = this.data.dates;
    //no optional dates in this, need to add that back in
    // let numFiles = this.data.groups.reduce((acc, value) => {
    //   let num = 1;
    //   let dates = value.dates;
    //   if(dates) {
    //     num = this.dateService.datesBetween(dates.start, dates.end, dates.period.value);
    //   }
    //   return acc + num;
    // }, 0);
    //dateless
    let numFiles = this.data.files.stations.data.length;
    let rasterFiles = this.data.files.raster.data.length;
    numFiles += rasterFiles * this.dateService.datesBetween(dates.start, dates.end, dates.period);
    return numFiles;
  }

  getResourceReqs(): ResourceReq[] {
    let reqs: ResourceReq[] = [];
    let period = this.data.dates.period;
    let startDate = this.dateService.dateToString(this.data.dates.start, period);
    let endDate = this.dateService.dateToString(this.data.dates.end, period);
    for(let file of this.data.files.raster.data) {
      let data = {
        type: file.data.type,
        extent: file.data.extent,
        tier: this.data.tier
      };
      let req: ResourceReq = {
        datatype: this.data.datatype,
        dates: {
          period: period,
          start: startDate,
          end: endDate
        },
        group: this.data.files.raster.group,
        data: data,
        filterOpts: {}
      };
      reqs.push(req);
    }
    for(let file of this.data.files.stations.data) {
      let data = {
        fill: file.data.fill,
        tier: this.data.tier
      }
      let req: ResourceReq = {
        datatype: this.data.datatype,
        dates: {
          period: period,
          start: startDate,
          end: endDate
        },
        group: this.data.files.stations.group,
        data: data,
        filterOpts: {}
      };
      reqs.push(req);
    }
    return reqs;
  }
}

// interface ExportSet {
//   datatype: string,
//   exportData: {
//     dated: DatedExportItem[],
//     undated: ExportItem[]
//   }
// }

// interface DatedExportItem {
//   date: {
//     start: Moment,
//     end: Moment,
//     period: Period
//   }
//   data: ExportItem[]
// }

// interface ExportItem {
//   fileGroup: StringMap,
//   fileData: StringMap,
//   label: string,
//   group: string,
//   filterGroup: string
// }


interface ValueData<T> {
  tag: string,
  label: string,
  description: string,
  value: T
}
//this only needs the actively selected thing, not all the options
type SelectedData<T> = ValueData<ValueData<T>>;
type SelectedMap<T> = {[tag: string]: SelectedData<T>};
type SelectorData<T> = ValueData<{[tag: string]: ValueData<T>}>;
type SelectorMap<T> = {[tag: string]: SelectorData<T>};

