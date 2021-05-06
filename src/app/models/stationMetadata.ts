
import Moment from "moment";
import * as L from "leaflet";

//non dataset info
export interface StationValue {
    metadata: string,
    id: string,
    date: Moment.Moment,
    value: number,
    location: L.LatLng,
    //metadata: {}
};

export interface StationMetadata {
    id: string,
    location: L.LatLng,
    ext: {
        [field: string]: string | number
    }
    
}

export interface StationData {

}

export interface StationFieldMetadata {
    type: StationFieldType,

}

export abstract class StationField {
    type: StationFieldType;
    value: string | number;
    constructor(type: StationFieldType) {
        this.type = type;
    }
    
}

export class DiscreetStationField {

}

export type StationFieldType = "discreet" | "continuous";

//

export interface Dataset {
    datatype: string,
    period: string,
    tier: number
}
