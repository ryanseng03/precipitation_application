import { StringMap } from "./types";
import { Moment } from "moment";
import { DateManagerService } from "../services/dateManager/date-manager.service";
import { UnitOfTime } from "../services/dataset-form-manager.service";


export interface ResourceReq {
  datatype: string,
  dates?: {
    start: string,
    end: string,
    unit: UnitOfTime,
    interval: string
  },
  params: StringMap
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

