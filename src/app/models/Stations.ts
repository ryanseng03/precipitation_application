
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
    ext: {[field: string]: StationFieldData};

    constructor(label: string, id: string, ext: StationFieldData[], lat: number, lng: number, altitude?: number) {
      this.label = label;
      this.id = id;
      this.location = latLng(lat, lng, altitude);
      this.ext = {};
      for(let fieldData of ext) {
        let field = fieldData.getFieldData().value;
        this.ext[field] = fieldData;
      }
    }

    getFieldValue(field: string): string | number {
      let fieldData = this.ext[field];
      let value = fieldData.getValue();
      return value;
    }
}

//does this need to store the metadata label, or just associate this with the full info object?
export class StationData {
  metadataLabel: string;
  id: string;
  location: LatLng;
  date: Moment.Moment;
  value: number;
  ext: {[field: string]: StationFieldData};

  constructor(metadata: StationMetadata, value: StationValue) {
    this.metadataLabel = metadata.label;
    this.id = metadata.id;
    this.location = metadata.location;
    this.date = value.date;
    this.value = value.value;
    this.ext = metadata.ext;
  }
}

//full info about all of the stations in a group
export class StationInfo {
  //metadata label
  private label: string;
  private fieldData: {[field: string]: ValueData<string>};
  private stations: {[id: string]: StationData};

  constructor(label: string, fieldData: {[field: string]: ValueData<string>}) {
    this.label = label;
    this.fieldData = fieldData;
  }

  getStation(id: string) {
    return this.stations[id];
  }

  getFieldData(field: string) {
    return this.fieldData[field];
  }
}


//this is for a single field value (non-mutable), should separate field type etc into a separate thing since doesnt change between value
//separate field, the value type can be derived from field info associated with that field

export abstract class StationFieldData {
    private type: StationFieldType;
    protected value: string | number;
    private fieldData: ValueData<string>;

    constructor(type: StationFieldType, value: string | number, fieldData: ValueData<string>) {
        this.type = type;
        this.value = value;
    }

    getValue() {
      return this.value;
    }

    getType() {
      return this.type;
    }

    getFieldData() {
      return this.fieldData;
    }
}

export class DiscreetStationField extends StationFieldData {
  valueMap: {[value: string]: {description: string, label: string}};

  constructor(value: string, fieldData: ValueData<string>, valueMap?: {[value: string]: {description: string, label: string}}) {
    super("discreet", value, fieldData);
    this.valueMap = valueMap || {};
  }

  getValueLabel() {
    let valueData = this.valueMap[this.value] || {description: null, label: null};
    let label = valueData.description || this.value;
    return label;
  }
}

export class ContinuousStationField extends StationFieldData {
  constructor(value: number, fieldData: ValueData<string>) {
    super("continuous", value, fieldData);
  }
}

export type StationFieldType = "discreet" | "continuous";

//

export interface Dataset {
    datatype: string,
    period: string,
    tier: number
}
