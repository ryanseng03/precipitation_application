import { Period, StringMap } from "./types";
import { Moment } from "moment";


export interface ResourceReq {
  datatype: string,
  fileGroup: StringMap,
  fileData: {
    dates?: {
      start: string,
      end: string,
      period: Period
    },
    fields: StringMap
  },
  //define this later
  filterOpts: any
}

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

interface ResourceData {
  datatype: string,
  fileGroup: {[tag: string]: SelectorData},
  fileData: {
    dates?: {
      start: string,
      end: string,
      period: Period
    }
    fields: {
      [field: string]: string
    }
  },
  //define this later
  filterOpts: any
}

//each file should have its own ResourceReq

class ExportData {
  resourceInfo: ResourceData

  constructor(datatype: string, group?: StringMap, fields?: StringMap, dates?: DateInfo) {
    this.resourceInfo = ""
  }


  getSetLabel(): string {

  }

  getFiles(): string[] {

  }

  getResourceReq(): ResourceReq[] {

  }
}

interface ExportSet {
  datatype: string,
  exportData: {
    dated: DatedExportItem[],
    undated: ExportItem[]
  }
}

interface DatedExportItem {
  date: {
    start: Moment,
    end: Moment,
    period: Period
  }
  data: ExportItem[]
}

interface ExportItem {
  fileGroup: StringMap,
  fileData: StringMap,
  label: string,
  group: string,
  filterGroup: string
}


interface ValueData<T> {
  tag: string,
  label: string,
  description: string,
  value: T
}
//this only needs the actively selected thing, not all the options
type SelectedData<T> = ValueData<ValueData<T>>;
type SelectedMap{[tag: string]: SelectedData<string>};
type SelectorData<T> = ValueData<{[tag: string]: ValueData<T>}>;
type SelectorMap = {[tag: string]: SelectorData<string>};

