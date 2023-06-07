import { KeyValue } from "@angular/common";
import { LatLng } from "leaflet";


export class MapLocationFormat {
    private _title: string;
    private _formattedFields: {[field: string]: string};

    constructor(title: string, formattedFields: {[field: string]: string}) {
        this._title = title;
        this._formattedFields = formattedFields;
    }

    get formattedFields(): {[field: string]: string} {
        return this._formattedFields;
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
    private _unit: string;
    private _unitShort: string;
    protected _format: MapLocationFormat;

    constructor(type: string, value: number, unit: string, unitShort: string) {
        this._value = value;
        this._type = type;
        this._unit = unit;
        this._unitShort = unitShort;
    }

    get type(): string {
        return this._type;
    }

    get value(): number {
        return this._value;
    }

    get unit(): string {
        return this._unit;
    }

    get unitShort(): string {
        return this._unitShort;
    }

    protected get valueFieldLabel(): string {
        let label = "Value";
        if(this._unitShort) {
            label += ` (${this._unitShort})`;
        }
        return label;
    }
    
    get format(): MapLocationFormat {
        return this._format;
    }

    
}


export class StationMetadata {
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
    private static FORMAT = {
        skn: {
            name: "SKN",
            round: 0,
            values: {}
        },
        name: {
            name: "Name",
            round: 0,
            values: {}
        },
        observer: {
            name: "Observer",
            round: 0,
            values: {}
        },
        network: {
            name: "Network",
            round: 0,
            values: {}
        },
        island: {
            name: "Island",
            round: 0,
            values: {
                BI: "Big Island",
                OA: "Oʻahu",
                MA: "Maui",
                KA: "Kauai",
                MO: "Molokaʻi",
                KO: "Kahoʻolawe",
                LA: "Lānaʻi"
              }
        },
        elevation_m: {
            name: "Elevation (m)",
            round: 2,
            values: {}
        },
        lat: {
            name: "Latitude",
            round: 4,
            values: {}
        },
        lng: {
            name: "Longitude",
            round: 4,
            values: {}
        },
        ncei_id: {
            name: "NCEI ID",
            round: 0,
            values: {}
        },
        nws_id: {
            name: "NWS ID",
            round: 0,
            values: {}
        },
        nesdis_id: {
            name: "NESDIS ID",
            round: 0,
            values: {}
        },
        scan_id: {
            name: "Scan ID",
            round: 0,
            values: {}
        },
        smart_node_rf_id: {
            name: "Smart Node RFID",
            round: 0,
            values: {}
        },
        value: {
            name: "Value",
            round: 2,
            values: {}
        }
    };

//     constructor(value: number, unit: string, unitShort: string, idField: string, ) {
//         super("station", value, unit, unitShort);
//         this.setFormat(metadata);
//     }

//     setFormat(metadata: StationMetadata): void {
//         let title = "Station Data";
//         let data = {};
//         data[this.valueFieldLabel] = this.value;
//         let id_field = metadata.add.id_field;
//         for(let field in metadata.add) {
//             let formatData = Station.FORMAT[field];
//             if(formatData) {
//                 let value = metadata.add[field];
//                 if(formatData.values[value]) {
//                     value = formatData.values[value];
//                 }
//                 if(field == id_field) {
//                     value += " (Station ID)";
//                 }
//                 data[formatData.name] = value;
//             }
//         }
//         let format = new MapLocationFormat(title, data);
//         this._format = format;
//     }
}

export class V_Station extends MapLocation {
    private _cellData: CellData;
    private _location: L.LatLng;

    constructor(value: number, unit: string, unitShort: string, cellData: CellData, location: L.LatLng) {
        super("virtual_station", value, unit, unitShort);
        this._cellData = cellData;
        this._location = location;
        this.setFormat();
    }

    get location(): L.LatLng {
        return this._location;
    }

    get cellData(): CellData {
        return this._cellData;
    }

    private setFormat(): void {
        let title = "Map Location Data";
        let data = {
            "Row": this._cellData.row.toLocaleString(),
            "Col": this._cellData.col.toLocaleString(),
            // "Cell Width (m/°)": `${this.roundValue(this._cellData.cellWidthM)}/${this._cellData.cellWidthLng}`,
            // "Cell Height (m/°)": `${this.roundValue(this._cellData.cellHeightM)}/${this._cellData.cellHeightLat}`,
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