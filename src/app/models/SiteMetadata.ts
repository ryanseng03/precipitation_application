import {LatLng, latLng} from "leaflet";

export class SiteValue {
    private val: {
        skn: string,
        type: string,
        value: number,
        date: string
    };

    constructor(value: {skn: string, type: string, value: number, date: string}) {
        this.val = {
            type: value.type,
            value: value.value,
            date: value.date,
            skn: value.skn
        }
    }

    get type(): string {
        return this.val.type;
    }

    get value(): number {
        return this.val.value;
    }

    get date(): string {
        return this.val.date;
    }

    get skn(): string {
        return this.val.skn;
    }
}

//should add other properties to this
export class SiteMetadata {
    meta: SiteMetadataFields;

    constructor(metadata: SiteMetadataFields, nodata: string) {
        this.meta = JSON.parse(JSON.stringify(metadata));
        for(let field in this.meta) {
            if(field == nodata) {
                this.meta[field] = null;
            }
        }
        //make sure basics arent null, must have at least skn and lat lng (anything else?)
        if(this.meta.skn === null || this.meta.lat === null || this.meta.lng === null) {
            throw new Error("Invalid site metadata: a required value had no data.");
        }
    }


    get skn(): string {
        return this.meta.skn;
    }

    get name(): string {
        return this.meta.name;
    }

    get location(): LatLng {
        return this.meta.elevation === null ? latLng(this.meta.lat, this.meta.lng) : latLng(this.meta.lat, this.meta.lng, this.meta.elevation);
    }

    get lat(): number {
        return this.meta.lat;
    }

    get lng(): number {
        return this.meta.lng;
    }

    get elevation(): number {
        return this.meta.elevation;
    }

    get network(): string {
        return this.meta.network;
    }

    get observer(): string {
        return this.meta.observer;
    }

    get island(): string {
        return this.meta.island;
    }

    get nceiID(): string {
        return this.meta.nceiID;
    }

    get nwsID(): string {
        return this.meta.nwsID;
    }

    get scanID(): string {
        return this.meta.scanID;
    }

    get smartNodeRfID(): string {
        return this.meta.smartNodeRfID;
    }
}

export interface SiteMetadataFields {
    skn: string,
    name: string,
    observer: string,
    network: string,
    island: string,
    //elevation in meters
    elevation: number,
    lat: number,
    lng: number,
    nceiID: string,
    nwsID: string,
    scanID: string,
    smartNodeRfID: string
}

//should store everything not actually being displayed separately to avoid unnecessary memory usage
export class SiteInfo {
    private info: SiteInfoFields;

    constructor(metadata: SiteMetadata, value: SiteValue) {
        this.info = {
            skn: metadata.skn,
            name: metadata.name,
            observer: metadata.observer,
            network: metadata.network,
            island: metadata.island,
            //elevation in meters
            elevation: metadata.elevation,
            lat: metadata.lat,
            lng: metadata.lng,
            nceiID: metadata.nceiID,
            nwsID: metadata.nwsID,
            scanID: metadata.scanID,
            smartNodeRfID: metadata.smartNodeRfID,
            value: value.value,
            type: value.type,
            date: value.date,
        }
    }

    get skn(): string {
        return this.info.skn;
    }

    get name(): string {
        return this.info.name;
    }

    get location(): LatLng {
        return this.info.elevation === null ? latLng(this.info.lat, this.info.lng) : latLng(this.info.lat, this.info.lng, this.info.elevation);
    }

    get lat(): number {
        return this.info.lat;
    }

    get lng(): number {
        return this.info.lng;
    }

    get elevation(): number {
        return this.info.elevation;
    }

    get network(): string {
        return this.info.network;
    }

    get observer(): string {
        return this.info.observer;
    }

    get island(): string {
        return this.info.island;
    }

    get nceiID(): string {
        return this.info.nceiID;
    }

    get nwsID(): string {
        return this.info.nwsID;
    }

    get scanID(): string {
        return this.info.scanID;
    }

    get smartNodeRfID(): string {
        return this.info.smartNodeRfID;
    }

    get type(): string {
        return this.info.type;
    }

    get value(): number {
        return this.info.value;
    }

    get date(): string {
        return this.info.date;
    }

    public static getFields() {
        return ["skn", "name", "observer", "network", "island", "elevation", "lat", "lng", "nceiID", "nwsID", "scanID", "smartNodeRfID", "value", "type", "date"];
    }

}

export interface SiteInfoFields {
    skn: string,
    name: string,
    observer: string,
    network: string,
    island: string,
    //elevation in meters
    elevation: number,
    lat: number,
    lng: number,
    nceiID: string,
    nwsID: string,
    scanID: string,
    smartNodeRfID: string
    value: number,
    type: string,
    date: string
}
