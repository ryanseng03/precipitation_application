import { formatNumber } from "@angular/common";
import { LatLng } from "leaflet";


export class MapLocationFormat {
    private _title: string;
    private _formatMap: {[field: string]: FormatData};

    constructor(title: string, data: FormatData[]) {
        this._title = title;
        this._formatMap = {};
        for(let item of data) {
            this._formatMap[item.field] = item;
        }
    }

    public getFieldFormat(field: string): FormatData {
        return {
           ...this._formatMap[field]
        };
    }

    get formatData(): FormatData[] {
        return Object.values(this._formatMap).map((data: FormatData) => {
            return {
                ...data
            };
        });
    }

    get fields(): string[] {
        return Object.keys(this._formatMap);
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
        this._location = location;
    }

    public abstract equal(other: MapLocation): boolean;

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
    private _data: {[field: string]: MetadataValue};
    private _location: L.LatLng;
    private _format: MapLocationFormat;

    constructor(idField: string, data: {[field: string]: MetadataValue}) {
        this._idField = idField;
        //validate data, must have id and lat lng at the bare minimum
        if(!data[idField]|| !data.lat || !data.lng) {
            throw new Error("Invalid metadata");
        }
        this._data = data;
        let elevation = data.elevation_m === undefined ? <number>data.elevation_m : undefined;
        this._location = new LatLng(<number>data.lat, <number>data.lng, elevation);
        this.setFormat();
    }

    public getValue(field: string): MetadataValue {
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

    get format(): MapLocationFormat {
        return this._format;
    }

    private setFormat(): void {
        let title = "Station Metadata";
        let data: FormatData[] = [];

        for(let field of this.fields) {
            let formatData = StationMetadata.FORMAT[field];
            if(formatData) {
                let value = this._data[field];
                let formattedValue = <string>value;
                if(formatData.translate) {
                    formattedValue = formatData.translate(value);
                }
                data.push({
                    field,
                    formattedField: formatData.name,
                    value,
                    formattedValue
                });
            }
        }
        let format = new MapLocationFormat(title, data);
        this._format = format;
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

    public equal(other: MapLocation): boolean {
        return this.type == other.type && this._id == (<Station>other).id;
    }

    get id(): string {
        return this._id;
    }

    get metadata(): StationMetadata {
        return this._metadata;
    }

    private setFormat(metadata: StationMetadata): void {
        let title = "Station Data";
        let data: FormatData[] = [{
            field: "value",
            formattedField: this.valueFieldLabel,
            value: this.value,
            formattedValue: formatNumber(this.value, navigator.language, "1.2-2")
        },
        ...metadata.format.formatData];

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

    public equal(other: MapLocation): boolean {
        return this.type == other.type && this._cellData.col == (<V_Station>other).cellData.col && this._cellData.row == (<V_Station>other).cellData.row;
    }

    get cellData(): CellData {
        return this._cellData;
    }

    private setFormat(): void {
        let title = "Map Location Data";
        let data: FormatData[] = [
            {
                field: "lat",
                formattedField: "Latitude",
                value: this._cellData.col,
                formattedValue: `${formatNumber(this.location.lat, navigator.language, "1.4-4")}`
            },
            {
                field: "lng",
                formattedField: "Longitude",
                value: this._cellData.col,
                formattedValue: `${formatNumber(this.location.lng, navigator.language, "1.4-4")}`
            },
            {
                field: "row",
                formattedField: "Row",
                value: this._cellData.row,
                formattedValue: this._cellData.row.toLocaleString()
            },
            {
                field: "col",
                formattedField: "Column",
                value: this._cellData.col,
                formattedValue: this._cellData.col.toLocaleString()
            },
            {
                field: "width",
                formattedField: "Cell Width (m, °)",
                value: [this._cellData.cellWidthM, this._cellData.cellWidthLng],
                formattedValue: `${formatNumber(this._cellData.cellWidthM, navigator.language, "1.2-2")}, ${formatNumber(this._cellData.cellWidthLng, navigator.language, "1.4-4")}`
            },
            {
                field: "height",
                formattedField: "Cell Height (m, °)",
                value: [this._cellData.cellHeightM, this._cellData.cellHeightLat],
                formattedValue: `${formatNumber(this._cellData.cellHeightM, navigator.language, "1.2-2")}, ${formatNumber(this._cellData.cellHeightLat, navigator.language, "1.4-4")}`
            },
            {
                field: "extent",
                formattedField: "Cell Extent (West longtitude °, South latitude °, East longitude °, North latitude °)",
                value: this._cellData.cellExtent,
                formattedValue: `${formatNumber(this._cellData.cellExtent.getWest(), navigator.language, "1.4-4")}, ${formatNumber(this._cellData.cellExtent.getSouth(), navigator.language, "1.4-4")}, ${formatNumber(this._cellData.cellExtent.getEast(), navigator.language, "1.4-4")}, ${formatNumber(this._cellData.cellExtent.getNorth(), navigator.language, "1.4-4")}`
            },
            {
                field: "value",
                formattedField: this.valueFieldLabel,
                value: this.value,
                formattedValue: formatNumber(this.value, navigator.language, "1.2-2")
            }
        ];

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

export interface FormatData {
    field: string
    formattedField: string,
    value: any,
    formattedValue: string
}

export type MetadataValue = string | number;
