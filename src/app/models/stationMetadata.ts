
import Moment from "moment";
import * as L from "leaflet";

export interface StationData {
    datatype: string,
    id: string,
    date: Moment.Moment,
    value: number,
    location: L.LatLng
    metadata: {[field: string]: string}
};