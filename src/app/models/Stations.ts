
import Moment from "moment";
import { latLng, LatLng } from "leaflet";
import { ValueData } from "./Dataset";

//non dataset info
//do we need to have array to assign values or something like that?
// export class StationValue {
//     id: string;
//     date: Moment.Moment;
//     value: number;

//     constructor(id: string, date: Moment.Moment, value: number) {
//       this.id = id;
//       this.date = date;
//       this.value = value;
//     }
// };

export class StationMetadata {
  private _id: string;
  private _location: LatLng;
  //should be field value
  private _ext: {[field: string]: StationField};

  constructor(id: string, ext: StationField[], lat: number, lng: number, altitude?: number) {
    this._id = id;
    this._location = latLng(lat, lng, altitude);
    this._ext = {};
    for(let fieldData of ext) {
      let field = fieldData.getFieldInfo().value;
      this._ext[field] = fieldData;
    }
  }

  getFieldValue(field: string): Range | string {
    let fieldData = this._ext[field];
    let value = fieldData.getValue();
    return value;
  }

  get id(): string {
    return this._id;
  }

  get location(): LatLng {
    return this._location;
  }

  get lat(): number {
    return this._location.lat;
  }

  get lng(): number {
    return this._location.lng;
  }

  get elevation(): number {
    return this._location.alt;
  }

  getExtFields(): string[] {
    let fields: string[] = [];
    for(let field in this._ext) {
      fields.push(field);
    }
    return fields;
  }
}

//store metadata, add values, update values
//single station set should have global date

//timeseries? probably separate

//does this need to store the metadata label, or just associate this with the full info object?
export class StationData {

  private metadata: StationMetadata;
  private value: number;

  constructor(metadata: StationMetadata, value?: number) {
    this.value = value || null;
    this.metadata = metadata;
  }

  setValue(value: number): void {
    this.value = value;
  }

  getValue(): number | null {
    return this.value;
  }

  get id(): string {
    return this.metadata.id;
  }

  get location(): LatLng {
    return this.metadata.location;
  }

  get lat(): number {
    return this.metadata.lat;
  }

  get lng(): number {
    return this.metadata.lng;
  }

  get elevation(): number {
    return this.metadata.elevation;
  }

  getFieldValue(field: string): Range | string {
    return this.metadata.getFieldValue(field);
  }

  getExtFields(): string[] {
    return this.metadata.getExtFields();
  }
}

//need this as an intermediary since have to set all values at once in info (otherwise have to set everything manually)
export class StationValueSet {
  private _map: {[id: string]: number}

  constructor() {
    this._map = {};
  }

  set(id: string, value: number) {
    this._map[id] = value;
  }

  get(id: string): number {
    return this._map[id];
  }

  get map(): {[id: string]: number} {
    return this._map;
  }
}

//full info about all of the stations in a group
export class StationInfo {
  private metadata: StationMetadata[];
  private fieldData: {[field: string]: ValueData<string>};
  //private metadata: {[id: string]: StationMetadata[]};
  private data: {[id: string]: StationData};

  constructor(metadata: StationMetadata[], fieldData: {[field: string]: ValueData<string>}) {
    this.fieldData = fieldData;
    let data: {[id: string]: StationData} = {};
    for(let meta of metadata) {
      data[meta.id] = new StationData(meta);
    }
    this.data = data;
  }

  setStationValues(values: StationValueSet): void {
    let map = values.map;
    for(let meta of this.metadata) {
      let id = meta.id;
      let value = map[id] || null;
      this.data[id].setValue(value);
    }
  }

  getFields(): string[] {
    return Object.keys(this.fieldData);
  }

  getFieldType(field: string): StationFieldType {
    let fieldData = this.fieldData[field];
    return fieldData.getType();
  }

  getFieldInfo(field: string): ValueData<string> {
    let fieldInfo = this.fieldData[field].getFieldInfo();
    return fieldInfo;
  }

  // getFieldData(field: string) {
  //   return this.fieldData[field];
  // }

  //field values should be similar to field info
  //have a discreet field value as ValueData<string>
  //have range value as number

  getFieldValues(field: string): [number, number] | ValueData<string> {
    return null;
  }


  setValues(values: {[id: string]: number}) {
    for(let id in this.data) {
      let value = values[id] || null;
      this.data[id].setValue(value);
    }
  }


}

export class StationInfoHandler {
  private stationData: {[label: string]: StationInfo}
  private metadata: StationMetadata;
  date: Moment.Moment;

  constructor(data: Moment.Moment) {
    this.stationData = {}
  }

  setMetadata() {

  }

  addStationSet(groupID: string) {
    // 
  }

  addValuesToStations(values: StationValue[]) {
    //reset values to null

    for(let valueDoc of values) {
      let value = valueDoc.value;
      let metaLabel = valueDoc.metadataLabel;
      let info = this.stationData[metaLabel];
      //info.se
    }
  }


}


//this is for a single field value (non-mutable), should separate field type etc into a separate thing since doesnt change between value
//separate field, the value type can be derived from field info associated with that field

//the value should be a completely separate thing, have this just store info about the fields, no need to duplicate

//value: ValueData<string> | number

export abstract class StationField {
    private type: StationFieldType;
    protected value: any;

    constructor(type: StationFieldType, value: any) {
      this.type = type;
      this.value = value;
    }

    getValue(): any {
      return this.value;
    }

    getType(): StationFieldType {
      return this.type;
    }
}

export class DiscreetStationField extends StationField {
  constructor(value: ValueData<string>) {
    super("discreet", value);
  }

  getValue(): ValueData<string> {
    return this.value;
  }
}

export class ContinuousStationField extends StationField {
  constructor(value: number) {
    super("continuous", value);
  }

  getValue(): number {
    return this.value;
  }
}

export type StationFieldType = "discreet" | "continuous";


export interface Dataset {
    datatype: string,
    period: string,
    tier: number
}

export type Range = [number, number];
export type DateRange = [Moment.Moment, Moment.Moment];
