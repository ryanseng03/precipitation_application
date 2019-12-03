import {LatLng} from "leaflet";

export interface SiteMetadata {
    name: string,
    location: LatLng,
    network: string,
    value: number
}