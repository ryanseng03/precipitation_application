import {Moment} from 'moment';

export interface Dataset {
    startDate: Moment,
    endDate: Moment,
    timestep: Timestep,
    fill: FillType,
    type: SetType
}

export type FillType = "partial" | "full" | "none";
export type Timestep = "monthly" | "daily";
export type SetType = "rainfall" | "temperature";