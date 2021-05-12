
import Moment from "moment";
import { latLng, LatLng } from "leaflet";
import { ValueData } from "./Dataset";

//non dataset info
export class StationValue {
    metadataLabel: string;
    id: string;
    date: Moment.Moment;
    value: number;

    constructor(metadataLabel: string, id: string, date: Moment.Moment, value: number) {
      this.metadataLabel = metadataLabel;
      this.id = id;
      this.date = date;
      this.value = value;
    }
};

export class StationMetadata {
    label: string;
    id: string;
    location: LatLng;
    ext: {[field: string]: StationField};

    constructor(label: string, id: string, ext: StationField[], lat: number, lng: number, altitude?: number) {
      this.label = label;
      this.id = id;
      this.location = latLng(lat, lng, altitude);
      this.ext = {};
      for(let fieldData of ext) {
        let field = fieldData.getFieldInfo().value;
        this.ext[field] = fieldData;
      }
    }

    getFieldValue(field: string) {
      let fieldData = this.ext[field];
      let value = fieldData.getValue();
      //return value;
    }
}

//store metadata, add values, update values
//single station set should have global date

//timeseries? probably separate

//does this need to store the metadata label, or just associate this with the full info object?
export class StationData {
  //global for specific time
  metadataLabel: string;
  //date: Moment.Moment;

  value: number;


  id: string;
  location: LatLng;
  ext: {[field: string]: StationField};
  
  
  

  constructor(metadata: StationMetadata, value?: number) {
    this.value = value || null;
    this.metadataLabel = metadata.label;
    this.id = metadata.id;
    this.location = metadata.location;
    this.ext = metadata.ext;
  }

  setValue(value: number) {
    this.value = value;
  }
}

//full info about all of the stations in a group
export class StationInfo {
  private fieldData: {[field: string]: StationField};
  //private metadata: {[id: string]: StationMetadata[]};
  private data: {[id: string]: StationData};

  constructor(metadata: StationMetadata[], fieldData: {[field: string]: StationField}) {
    this.fieldData = fieldData;
    let data: {[id: string]: StationData} = {};
    for(let meta of metadata) {
      data[meta.id] = new StationData(meta, null);
    }
    this.data = data;
  }

  getStationData(id: string): StationData {
    return this.data[id];
  }

  getFields(): string[] {
    return Object.keys(this.fieldData.fieldData);
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
    private fieldInfo: ValueData<string>;

    constructor(type: StationFieldType, fieldInfo: ValueData<string>, valueMap: {}) {
        this.type = type;
        this.fieldInfo = fieldInfo;
    }

    getValue() {
      //return this.value;
    }

    getType() {
      return this.type;
    }

    getFieldInfo() {
      return this.fieldInfo;
    }
}

export class DiscreetStationField extends StationField {
  constructor(value: ValueData<string>, fieldData: ValueData<string>) {
    super("discreet", fieldData, {});
  }

}

export class ContinuousStationField extends StationField {
  constructor(value: number, fieldData: ValueData<string>) {
    super("continuous", fieldData, {});
  }
}

export type StationFieldType = "discreet" | "continuous";


export interface Dataset {
    datatype: string,
    period: string,
    tier: number
}
