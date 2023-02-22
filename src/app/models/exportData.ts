import { StringMap } from "./types";
import { UnitOfTime } from "../services/dataset-form-manager.service";


export interface ResourceReq {
  datatype: string,
  dates?: {
    start: string,
    end: string,
    unit: UnitOfTime,
    interval: number
  },
  params: StringMap,
  fileData: {
    fileParams: {[param: string]: string[]},
    files: string[]
  }[]
};

