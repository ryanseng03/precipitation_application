
/////////////
//data defs//
/////////////

import { Moment } from "moment";

interface ValueInfo<T> {
  tag?: string,
  label: string,
  description: string,
  value: T
};

type Selector = ValueInfo<{[tag: string]: ValueInfo<string>}>;

interface SelectorIndex {
  [tag: string]: Selector
};

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



////////
//data//
////////

enum DataGroup {
  Station,
  Raster,
  Both
}

//where to add dates?
interface Dates {
  period: Selector,
  start: Moment,
  end: Moment
}



interface PathItem {
  selectorTag: string,
  valueTags: ValueItem[],
  advanced: boolean,
  default?: string,
  group: DataGroup
};

interface ValueItem {
  next: PathItem
  value: string
}

type Path = PathItem[];

type Index = {
  [datatype: string]: Path
};


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////////////////////////////////



let temperaturePath: Path = [];

let index: Index = {
  //rainfall: rainfallPath,
  temperature: temperaturePath
};


let tierValues: {[tag: string]: ValueInfo<string>} = {
  archival: {
    label: "Archival",
    description: "Archival data including all historical data.",
    value: "archival"
  },
  recent: {
    label: "Most Recent",
    description: "The most up to date data available for a given date",
    value: "recent"
  }
};

let datatypeValues: {[tag: string]: ValueInfo<string>} = {
  rainfall: {
    label: "Rainfall",
    description: "Rainfall data.",
    value: "rainfall"
  },
  temperature: {
    label: "Temperature",
    description: "Temperature Data",
    value: "temperature"
  }
};

let temperatureValues: {[tag: string]: ValueInfo<string>} = {

};

let selectorIndex: SelectorIndex = {
  datatype: {
    tag: "datatype",
    label: "Datatype",
    description: "Datatype",
    value: datatypeValues
  },
  tier: {
    tag: "tier",
    label: "Data Tier",
    description: "Data tier",
    value: tierValues
  },

};
