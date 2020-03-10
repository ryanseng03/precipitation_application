import {LatLng, latLng} from "leaflet";

export class SiteValue {
    private val: {
        skn: string,
        type: string,
        value: number,
        date: string
    };

    constructor(value: {skn: string, type: string, value: number, date: string}) {
        this.val.type = value.type;
        this.val.value = value.value;
        this.val.date = value.date;
        this.val.skn = value.skn;
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
    private meta: {
        skn: string,
        name: string,
        location: LatLng,
        network: string
    }
    
    constructor(metadata: {skn: string, name: string, lat: number, lng: number, network: string}) {
        this.meta.skn = metadata.skn;
        this.meta.name = metadata.name;
        this.meta.location = new LatLng(metadata.lat, metadata.lng);
        this.meta.network = metadata.network;
    }

    get skn(): string {
        return this.meta.skn;
    }

    get name(): string {
        return this.meta.name;
    }

    get location(): LatLng {
        return this.meta.location;
    }

    get lat(): number {
        return this.meta.location.lat;
    }

    get lng(): number {
        return this.meta.location.lng;
    }

    get network(): string {
        return this.meta.network;
    }
}

//should store everything not actually being displayed separately to avoid unnecessary memory usage
export class SiteInfo {
    private info: {
        skn: string,
        name: string,
        location: LatLng,
        network: string,
        value: number,
        type: string,
        date: string
    }

    constructor(metadata: SiteMetadata, value: SiteValue) {
        this.info.skn = metadata.skn;
        this.info.name = metadata.name;
        this.info.location = metadata.location;
        this.info.network = metadata.network;
        this.info.value = value.value;
        this.info.type = value.type;
        this.info.date = value.date;
    }

    get skn(): string {
        return this.info.skn;
    }

    get name(): string {
        return this.info.name;
    }

    get location(): LatLng {
        return this.info.location;
    }

    get network(): string {
        return this.info.network;
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

    get lat(): number {
        return this.info.location.lat;
    }

    get lng(): number {
        return this.info.location.lng;
    }
}