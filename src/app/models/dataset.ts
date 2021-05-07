import {Moment} from 'moment';

export interface Dataset {
    startDate: Moment,
    endDate: Moment,
    timestep: Timestep,
    fill: FillType,
    type: SetType
}


//should move this, this is a generic description item
export interface ValueData<T> {
  value: T,
  label: string,
  description: string
}

export type FillType = "partial" | "full" | "none";
export type Timestep = "monthly" | "daily";
export type SetType = "rainfall" | "temperature";
