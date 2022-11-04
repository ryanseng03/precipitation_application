import {Moment} from 'moment';
import { UnitOfTime } from '../services/dataset-form-manager.service';

export interface Dataset {
  //have to include any type for compatibility with arbitrary fields, why typescript
  includes: Set<IncludeTypes> | any,
  datatype: string,
  period: UnitOfTime,
  start: Moment | any,
  end: Moment | any,
  focus: Moment | any,
  [additional: string]: string
}

//get dates last, RTS will be updated on a per dataset basis just in case there's a delay on certain sets

//datasets should have isRT flag, if it does set the end date to null and display as "present", query will ject get most recent date
export const registry: {[property: string]: ValueData<{[value: string]: ValueData<string>}>} = {
  datatypes: {
    tag: "datatype",
    label: "Datatype",
    description: "The climatological variable being represented by the data",
    value: {
      rainfall: {
        tag: "rainfall",
        label: "Rainfall",
        description: "The amount of rain falling in an area",
        value: "rainfall"
      },
      temperature: {
        tag: "temperature",
        label: "Temperature",
        description: "The temperature of an area",
        value: "temperature"
      }
    }
  },
  fills: {
    tag: "fill",
    label: "Fill",
    description: "Fill type for the data",
    value: {
    }
  }
}




//should move this, this is a generic description item
export interface ValueData<T> {
  tag: string,
  label: string,
  description: string,
  value: T
}

export type IncludeTypes = "raster" | "station";
