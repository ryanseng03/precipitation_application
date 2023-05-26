import { KeyValue } from "@angular/common";
import { StationMetadata } from "../services/filters/station-filtering.service";

class MapLocationFormat {
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

abstract class MapLocation {
    private static ROUND = 2;

    private _value: number;
    private _type: string;
    private _unit: string;
    private _unitShort: string;

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

    abstract format(): MapLocationFormat;

    protected roundValue(value: number): string {
        let roundFactor = Math.pow(10, Station.ROUND);
        let rounded = Math.round(value * roundFactor) / roundFactor;
        return rounded.toLocaleString();
    }
}

class Station extends MapLocation {
    
    private static FORMAT = {
        skn: {
            name: "SKN",
            round: false,
            values: {}
        },
        name: {
            name: "Name",
            round: false,
            values: {}
        },
        observer: {
            name: "Observer",
            round: false,
            values: {}
        },
        network: {
            name: "Network",
            round: false,
            values: {}
        },
        island: {
            name: "Island",
            round: false,
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
            round: true,
            values: {}
        },
        lat: {
            name: "Latitude",
            round: true,
            values: {}
        },
        lng: {
            name: "Longitude",
            round: true,
            values: {}
        },
        ncei_id: {
            name: "NCEI ID",
            round: false,
            values: {}
        },
        nws_id: {
            name: "NWS ID",
            round: false,
            values: {}
        },
        nesdis_id: {
            name: "NESDIS ID",
            round: false,
            values: {}
        },
        scan_id: {
            name: "Scan ID",
            round: false,
            values: {}
        },
        smart_node_rf_id: {
            name: "Smart Node RFID",
            round: false,
            values: {}
        },
        value: {
            name: "Value",
            round: true,
            values: {}
        }
    };

    private _metadata: StationMetadata;

    constructor(type: string, value: number, unit: string, unitShort: string, metadata: StationMetadata) {
        let id_field = metadata.add.id_field;
        super();
    }

    format(): MapLocationFormat {
        let title = "Station Data";
    }

class V_Station extends MapLocation {
    private _cellData: CellData;
    private _location: L.LatLng;

    constructor(value: number, unit: string, unitShort: string, cellData: CellData, location: L.LatLng) {
        super("virtual_station", value, unit, unitShort);
        this._cellData = cellData;
        this._location = location;
    }

    get location(): L.LatLng {
        return this._location;
    }

    get cellData(): CellData {
        return this._cellData;
    }

    format(): MapLocationFormat {
        let title = "Map Data";
        let data = {
            "Row": this._cellData.row.toLocaleString(),
            "Col": this._cellData.col.toLocaleString(),
            "Cell Width (m/°)": `${this.roundValue(this._cellData.cellWidthM)}/${this._cellData.cellWidthLng}`,
            "Cell Height (m/°)": `${this.roundValue(this._cellData.cellHeightM)}/${this._cellData.cellHeightLat}`,
            "Cell Extent (min longitude °, min latitude °, max longitude °, max latitude °)": this._cellData.cellExtent.toBBoxString()
        };
        data[this.valueFieldLabel] = this.value;
        let format = new MapLocationFormat(title, data);
        return format;
    }
    
}

interface CellData {
    row: number;
    col: number;
    cellWidthM: number;
    cellHeightM: number;
    cellWidthLng: number;
    cellHeightLat: number;
    cellExtent: L.LatLngBounds;
}


// // import Moment from "moment";
// import { latLng, LatLng } from "leaflet";
// // import { ValueData } from "./Dataset";

// export class Station {

//     private metadata: StationMetadata;
//     public value: number;
  
//     constructor(metadata: any, value?: number) {
//       this.value = value || null;
//       this.metadata = new Proxy(metadata);
//     }

//     private proxyHandler = {
//         get: (obj, prop) => {
//             return prop in obj
//         }
//     }
  
//     setValue(value: number): void {
//       this.value = value;
//     }
  
//     getValue(): number | null {
//       return this.value;
//     }
  
//     get id(): string {
//       return this.metadata.id;
//     }
  
//     get location(): LatLng {
//       return this.metadata.location;
//     }
  
//     get lat(): number {
//       return this.metadata.lat;
//     }
  
//     get lng(): number {
//       return this.metadata.lng;
//     }
  
//     get elevation(): number {
//       return this.metadata.elevation;
//     }
  
//     getFieldValue(field: string): Range | string {
//       return this.metadata.getFieldValue(field);
//     }
  
//     getExtFields(): string[] {
//       return this.metadata.getExtFields();
//     }
//   }