import { KeyValue, formatNumber } from "@angular/common";
import { LatLng } from "leaflet";


export class MapLocationFormat {
    private _title: string;
    private _formattedFields: {[field: string]: string};

    constructor(title: string, formattedFields: {[field: string]: string}) {
        this._title = title;
        this._formattedFields = formattedFields;
    }

    get formattedFields(): {[field: string]: string} {
        return JSON.parse(JSON.stringify(this._formattedFields));
    }

    get formattedPairs(): KeyValue<string, string>[] {
        let pairs: KeyValue<string, string>[] = [];
        for(let field in this._formattedFields) {
            pairs.push({
                key: field,
                value: this._formattedFields[field]
            });
        }
        return pairs;
    }

    get title(): string {
        return this._title;
    }
}

export abstract class MapLocation {
    private _value: number;
    private _type: string;
    private _units: string;
    private _unitsShort: string;
    protected _format: MapLocationFormat;
    private _location: L.LatLng;

    constructor(type: string, value: number, units: string, unitsShort: string, location: L.LatLng) {
        this._value = value;
        this._type = type;
        this._units = units;
        this._unitsShort = unitsShort;
    }

    get type(): string {
        return this._type;
    }

    get value(): number {
        return this._value;
    }

    get unit(): string {
        return this._units;
    }

    get unitShort(): string {
        return this._unitsShort;
    }

    get location(): L.LatLng {
        return this._location;
    }

    protected get valueFieldLabel(): string {
        let label = "Value";
        if(this._unitsShort) {
            label += ` (${this._unitsShort})`;
        }
        return label;
    }

    get format(): MapLocationFormat {
        return this._format;
    }
}


export class StationMetadata {
    static readonly FORMAT = {
        skn: {
            name: "SKN"
        },
        name: {
            name: "Name"
        },
        observer: {
            name: "Observer"
        },
        network: {
            name: "Network"
        },
        island: {
            name: "Island",
            translate: (value: string) => {
                let trans = {
                    BI: "Big Island",
                    OA: "Oʻahu",
                    MA: "Maui",
                    KA: "Kauai",
                    MO: "Molokaʻi",
                    KO: "Kahoʻolawe",
                    LA: "Lānaʻi"
                }
                return trans[value] ? trans[value] : value;
            }
        },
        elevation_m: {
            name: "Elevation (m)",
            translate: (value: number) => {
                return formatNumber(value, navigator.language, "1.2-2");
            }
        },
        lat: {
            name: "Latitude",
            translate: (value: number) => {
                return formatNumber(value, navigator.language, "1.4-4");
            }
        },
        lng: {
            name: "Longitude",
            translate: (value: number) => {
                return formatNumber(value, navigator.language, "1.4-4");
            }
        },
        ncei_id: {
            name: "NCEI ID"
        },
        nws_id: {
            name: "NWS ID"
        },
        nesdis_id: {
            name: "NESDIS ID"
        },
        scan_id: {
            name: "Scan ID"
        },
        smart_node_rf_id: {
            name: "Smart Node RFID"
        }
    };

    private _idField: string;
    private _data: {[field: string]: number | string};
    private _location: L.LatLng;

    constructor(idField: string, data: {[field: string]: number | string}) {
        this._idField = idField;
        //validate data, must have id and lat lng at the bare minimum
        if(!data[idField]|| !data.lat || !data.lng) {
            throw new Error("Invalid metadata");
        }
        this._data = data;
        let elevation = data.elevation_m === undefined ? <number>data.elevation_m : undefined;
        this._location = new LatLng(<number>data.lat, <number>data.lng, elevation);
    }

    getValue(field: string): string | number {
        return this._data[field];
    }

    get fields(): string[] {
        return Object.keys(this._data);
    }

    get location(): L.LatLng {
        return this._location;
    }

    get idField(): string {
        return this._idField;
    }

    get id(): string {
        return <string>this._data[this._idField];
    }
}

export class Station extends MapLocation {
	  private _metadata: StationMetadata;
    private _id: string;

    //note the id is hopefully temporary, this is separate from the metadata id because of the standardization issue with numeric ids (some datasets list them as X.0, some as X)
    //should eventually standardize these before ingestion and fix db entries, for now just deal with mismatch by storing station id separate from metadata id and use standardization for comp
    constructor(value: number, id: string, units: string, unitsShort: string, metadata: StationMetadata) {
        super("station", value, units, unitsShort, metadata.location);
        this.setFormat(metadata);
        this._metadata = metadata;
        this._id = id;
    }

    get id(): string {
        return this._id;
    }

    get metadata(): StationMetadata {
        return this._metadata;
    }

    private setFormat(metadata: StationMetadata): void {
        let title = "Station Data";
        let data = {};
        data[this.valueFieldLabel] = this.value;
        let idField = metadata.idField;
        for(let field in metadata.fields) {
            let formatData = StationMetadata.FORMAT[field];
            if(formatData) {
                let value = metadata.getValue(field);
                if(formatData.translate) {
                    value = formatData.translate(value);
                }
                if(field == idField) {
                    value += " (Station ID)";
                }
                data[formatData.name] = value;
            }
        }
        let format = new MapLocationFormat(title, data);
        this._format = format;
    }
}

export class V_Station extends MapLocation {
    private _cellData: CellData;

    constructor(value: number, unit: string, unitShort: string, cellData: CellData, location: L.LatLng) {
        super("virtual_station", value, unit, unitShort, location);
        this._cellData = cellData;
        this.setFormat();
    }

    get cellData(): CellData {
        return this._cellData;
    }

    private setFormat(): void {
        let title = "Map Location Data";
        let data = {
            "Row": this._cellData.row.toLocaleString(),
            "Col": this._cellData.col.toLocaleString(),
            "Cell Width (m/°)": `${formatNumber(this._cellData.cellWidthM, navigator.language, "1.2-2")}/${formatNumber(this._cellData.cellWidthLng, navigator.language, "1.4-4")}`,
            "Cell Height (m/°)": `${formatNumber(this._cellData.cellHeightM, navigator.language, "1.2-2")}/${formatNumber(this._cellData.cellHeightLat, navigator.language, "1.4-4")}`,
            "Cell Extent (min longitude °, min latitude °, max longitude °, max latitude °)": this._cellData.cellExtent.toBBoxString()
        };
        data[this.valueFieldLabel] = this.value;
        let format = new MapLocationFormat(title, data);
        this._format = format;
    }

}

export interface CellData {
    row: number;
    col: number;
    cellWidthM: number;
    cellHeightM: number;
    cellWidthLng: number;
    cellHeightLat: number;
    cellExtent: L.LatLngBounds;
}
