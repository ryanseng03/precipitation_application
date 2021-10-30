import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { DbConService } from '../dataLoaders/dataRequestor/auxillary/dbCon/db-con.service';
import { retry, catchError, take } from 'rxjs/operators';
import { Observable, Subject, throwError } from "rxjs";
import * as Moment from 'moment';
import { ValueData } from 'src/app/models/Dataset';
import { Period } from 'src/app/models/types';
import { DateManagerService } from '../dateManager/date-manager.service';
import { ResourceReq } from 'src/app/models/exportData';

@Injectable({
  providedIn: 'root'
})
export class ExportManagerService {

  //Master_Sta_List_Meta_2020_11_09.csv
  fileData = {
    rasters: [],
    stations: [{
      label: "",
      file: "Master_Sta_List_Meta_2020_11_09.csv",
      requires: []
    }]
  };

  static readonly EXPORT_PACKAGE_NAME = "HCDP_data.zip"
  //config?
  static readonly EXPORT_BASE_URL = "https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data/";

  //lets just set a maximum number of files instead of a size for simplicity
  static readonly MAX_INSTANT_PACKAGE_FILES = 150;
  // static readonly AVERAGE_FILE_SIZE = 1;
  static readonly F_PART_SIZE_UL_MB = 4;

  ///////////////////////
  static readonly ENDPOINT_INSTANT = "https://cistore.its.hawaii.edu/genzip/instant/splitlink";
  static readonly ENDPOINT_EMAIL = "https://cistore.its.hawaii.edu/genzip/email/";
  ///////////////////////

  constructor(private http: HttpClient, private dbcon: DbConService, private dateService: DateManagerService) {

  }

  async submitEmailPackageReq(reqs: ResourceReq[], email: string): Promise<void> {
    let reqBody = {
      fileData: reqs,
      email: email
    };
    let head = new HttpHeaders();
    const responseType: "text" = "text";
    let reqOpts = {
      headers: head,
      responseType: responseType,
    };
    let endpoint = ExportManagerService.ENDPOINT_EMAIL;
    let start = new Date().getTime();
    return new Promise<void>((resolve, reject) => {
      this.http.post(endpoint, reqBody, reqOpts)
      .pipe(
        retry(3),
        take(1),
        catchError((e: HttpErrorResponse) => {
          return throwError(e);
        })
      )
      .subscribe((response: string) => {
        let time = new Date().getTime() - start;
        let timeSec = time / 1000;
        console.log(`Got request confirmation, time elapsed ${timeSec} seconds`);
        resolve();
      }, (error: any) => {
        console.error(error);
        reject(error);
      });
    });

  }


  async submitInstantDownloadReq(reqs: ResourceReq[]): Promise<Observable<number>> {
    let reqBody = {
      fileData: reqs
    };
    let head = new HttpHeaders();
    const responseType: "json" = "json";
    let reqOpts = {
      headers: head,
      responseType: responseType,
    };
    let endpoint = ExportManagerService.ENDPOINT_INSTANT;

    return new Promise<Observable<number>>((resolve, reject) => {
      let start = new Date().getTime()
      this.http.post(endpoint, reqBody, reqOpts)
        .pipe(
          retry(3),
          take(1),
          catchError((e: HttpErrorResponse) => {
            return throwError(e);
          })
        )
        .subscribe(async (response: any) => {
          let time = new Date().getTime() - start;
          let timeSec = time / 1000;
          console.log(`Got generated file names, time elapsed ${timeSec} seconds`);
          let files: string[] = response.files;
          console.log(files);
          let downloadData: DownloadData = this.getFiles(files);
          //resolve with data monitor
          resolve(downloadData.progress);
          //when data download finished download to browser
          downloadData.data.then((data: Blob) => {
            this.downloadBlob(data, ExportManagerService.EXPORT_PACKAGE_NAME);
          })
          .catch((e: any) => {/*error logging and all that should be handled elsewhere, progress monitor should also get error for popping up client message*/});
        }, (error: any) => {
          console.error(error);
          reject(error);
        });
    });


  }


  private downloadBlob(blob: Blob, name: string) {
    let url = window.URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }


  private getFiles(files: string[]): DownloadData {
    let progress = new Subject<number>();

    //progress is in bytes so multiply by 1024 * 1024
    let fileBaseSize = ExportManagerService.F_PART_SIZE_UL_MB * 1024 * 1024;
    let sizeUL = files.length * fileBaseSize;
    let percentCoeff = 100 / sizeUL;
    console.log(sizeUL, percentCoeff);

    let data: Promise<Blob> = new Promise((resolve, reject) => {
      let responses: ArrayBuffer[] = new Array(files.length);
      let returnedResponses = 0;
      //shortcut, all but last file should be the base size, so start file transfers in reverse and just add last file size on first transfer if total size defined
      let actualSize = (files.length - 1) * fileBaseSize;
      //flag for if real size already determined
      let actualSizeFound = false;
      let progressStore: number[] = new Array(files.length).fill(0);
      let start = new Date().getTime();
      //start at end to speed up last file size receipt
      for(let i = files.length - 1; i >= 0; i--) {
        let file = files[i];
        this.getFile(file).subscribe((event: HttpEvent<ArrayBuffer>) => {
          // console.log(event);
          if(event.type === HttpEventType.DownloadProgress) {
            //if this is the last file (odd man out) and the total size field in the event is populated then adjust the total package size and percent coeff
            if(!actualSizeFound && i == files.length - 1 && event.total) {
              actualSize += event.total;
              //recompute coeff
              percentCoeff = 100 / actualSize;
              // console.log(actualSize, percentCoeff);
              actualSizeFound = true;
            }
            progressStore[i] = event.loaded;
            //reduce to total amount of data downloaded
            let loaded = progressStore.reduce((acc, value) => acc + value, 0);
            //convert to percent
            loaded *= percentCoeff;
            progress.next(loaded);
          }
          else if(event.type === HttpEventType.Response) {
            responses[i] = event.body;
            if(++returnedResponses === files.length) {
              let time = new Date().getTime() - start;
              let timeSec = time / 1000;
              console.log(`Got all zip data, time elapsed ${timeSec} seconds`);
              resolve(responses);
              progress.complete();
            }
          }
        });
      }
    })
    .then((responses: ArrayBuffer[]) => {
      return new Blob(responses, {type: "application/zip"});
    })
    .catch((e: any) => {
      //error out progress and reject
      progress.error(e);
      return Promise.reject(e);
    });

    return {
      progress: progress.asObservable(),
      data: data
    };
  }


  private getFile(url: string): Observable<HttpEvent<ArrayBuffer>> {
    let head = new HttpHeaders();
    const responseType: "arraybuffer" = "arraybuffer";
    const observe: "events" = "events";
    let options = {
      headers: head,
      responseType: responseType,
      reportProgress: true,
      observe: observe
    };

    console.log(url);

    return this.http.get(url, options)
    .pipe(
      retry(3),
      catchError((e: HttpErrorResponse) => {
        return throwError(e);
      })
    );
  }


  private translateSize(size: string | number): number {
    let sizeMB: number;
    if(typeof size === "number") {
      sizeMB = size;
    }
    else {
      let suffix: string = size.slice(-1);
      suffix = suffix.toUpperCase();
      let coeff = 0;
      let base = Number.parseInt(size);
      switch(suffix) {
        case "G": {
          coeff = 1024;
          break;
        }
        case "M": {
          coeff = 1;
          break;
        }
        case "K": {
          coeff = 1 / 1024;
          break;
        }
        case "B": {
          coeff = 1 / (1024 * 1024);
          break;
        }
      }
      sizeMB = coeff * base;
    }
    return sizeMB;
  }
}


interface ConvertedResourceInfo {
  datatype: string,
  fileGroup: {[item: string]: string},
  fileData: ConvertedFileData,
  filterOpts: any
}

interface ConvertedFileData {
  dates?: ConvertedDateInfo,
  fields: {[item: string]: string | number}
}

interface ConvertedDateInfo {
  dates: {
    start: string,
    end: string
  },
  period: Period
}

// export interface ResourceInfo {
//   datatype: string,
//   fileGroup: {[item: string]: string},
//   fileData: FileData,
//   filterOpts: any
// }

export interface FileData {
  dates?: DateInfo,
  fields: {[item: string]: string | number}
}

export interface DateInfo {
  dates: {
    start: Moment.Moment,
    end: Moment.Moment
  },
  period: Period
}

// export interface ResourceOptions {
//   datatype: string,
//   fileGroup: any,
//   fileData: any,
//   filterOpts: any
// }

interface DownloadData {
  progress: Observable<number>,
  data: Promise<Blob>
}






export interface ExportInfo {
  dateInfo?: FileDateInfo,
  baseURL: string,
  files: FileData[]
}

interface FileDateInfo {
  dates: [Moment.Moment, Moment.Moment],
  period: string,
}





// interface OptionGroups {
//   raster: Options[],
//   stations: Options[],
//   general: Options[]
// }

// interface Options {
//   data: ValueData<string>,
//   next: Options,
//   files: FileGroups,
//   symetric: ValueData<Options>[]
// }

// // interface SymetricOptions {
// //   options: SymetricOptions[]
// // }

// // interface SymetricOption {
// //   data: ValueData<string>,
// //   files: FileGroups,
// //   next: HierarchicalOption
// // }

// interface ExportOptionsCap {
//   dates: [Moment.Moment, Moment.Moment],
//   files: FileGroups
// }




//////////////////////////////////////////////////////

//output stuff

// export interface FileData {
//   //need to have information to populate form...


//   //temp
//   fileBase: string,
//   requires: string[]

// }


////////////////////////////////////////////////////

// interface ExportOptionsLayer {
//   options: ExportOption[] | ExportOptionCap,
//   files: FileGroups
// }

// interface ExportOption {
//   //info on option and option values
//   data: ValueData<ExportOptionValue[]>,
// }

// interface ExportOptionValue {
//   data: ValueData<string>,
//   next: ExportOptionsLayer
// }

// interface ExportOptionCap {
//   basePath: string,
//   baseOpts: ValueData<ExportMultioption>[],
//   dates: [Moment.Moment, Moment.Moment],
//   files: FileGroups
// }

interface ExportMultioption {
  min: number,
  default?: number[],
  data: ValueData<ValueData<string>[]>
}

// export interface FileData {
//   fileBase: string,
//   requires: string[]
// }


//THE SELECTOR VALUE HAS TO BE UNIQUE...
//SETTING THE VALUE IN THE CONTROL SETS THE LABEL (won't work unless the value is unique)

//just need a set of values, set the controls
interface SelectorPathData {
  path: string
}

interface FileGroup {
  //raster, station, general
  group: ValueData<string>
  //bind multi-options to file data
  fileData: FileData[]
}

// export interface FileData {

//   resourceID: string
// }


//no, FileGroup[] instead
interface FileSelectorGroups {
  raster: FileData[],
  stations: FileData[],
  general: FileData[]
}

interface FileSelectData {
  data: ValueData<string>,
  resourceIDGroups: string[]
  requires: string[]
}

//ex, groupData is county, valueData label is county, value is resource ID
//value should be the resource ID
type FileResourceIDGroup = SelectorData<string, string>;

//resource id should be the value
// interface FileResourceIDSelector {
//   selector: ValueData<string>
// }

//same
// interface SelectorGroupData<T, U> {
//   groupData: ValueData<T>,
//   valueData: ValueData<U>[]
// }

//file data should have either a resource id, or a resource id map (map to multi-data values (set multi-data values to keys instead of resource ids))
//simplify, symetric options all at end, each node exactly one

//FILTERING CLASSIFICATIONS
//FILE FILTERING (for geotiffs and metadata), FIELD FILTERING (SEND DETAILS TO API) (for csvs)
//metadata files?
//filtering should be optional, everything should have default (e.g. statewide for geotiffs)
//have some kind of "create filter" button
//each file have filter class, how apply mass filters?
//get no filter working then deal with this

//everything has to be off of the values...

//mapping of selectors, used for vis and export, use to collapse bulk, also ensures consistency across application
let propertyMap: {
  datatype: {
    label: "Data Type",
    description: "Data type",
    //use labels instead of arrays/indices for readability
    values: {
      rainfall: {
        label: "Rainfall",
        description: "Rainfall data"
      },
      temperature: {
        label: "Tempurature",
        description: "Tempurature data"
      }
    }
  },
  period: {
    label: "Time Period",
    description: "Period of time covered by measurements"
    values: {
      day: {
        label: "Daily",
        description: "Data at a daily interval"
      },
      month: {
        label: "Monthly",
        description: "Data at a monthly interval"
      }
    }
  },
  tier: {
    label: "Data Tier",
    description: "Tier of data collection. Some data comes in after the initial data set is published and used to generate a new data set. Higher tiers represent more complete data, though lower tiers are maintained for consistency."
    values: {
      0: {
        label: "tier 0",
        description: "Initial set of data using automated sensor data available in near real time."
      },
      latest: {
        label: "Highest Available",
        description: "The most up to date data available for each date. Note the tier of data may differ if higher tiers are not available for some dates."
      }
    }
  },
  fill: {
    label: "Fill Type",
    description: "Sensor station data gap filling type",
    values: {
      unfilled: {
        label: "Unfilled",
        description: "Raw sensor data with no gap filling techniques applied."
      }
      partial: {
        label: "Partial Filled",
        description: "Partially filled sensor data using a single gap filling technique. This is the data set used to generate gridded map products"
      },
      filled: {
        label: "Filled",
        description: "Serially complete data using multiple gap filling techniques. Has increased uncertainty over partial filled data."
      }
    }
  },
  method: {
    label: "Production Method",
    description: "The production method used to generate the gridded map products",
    values: {
      new: {
        label: "New",
        descriptions: "Gridded map products generated using new production methods"
      },
      legacy: {
        label: "Legacy",
        description: "Gridded map products generated using legacy production methods"
      }
    }
  }
}


interface DataSelection {
  period: string,
  [field: string]: string
}
type OptPath = string[];

//can this be used for vis and export and file refs be moved out?
//basis set of fields to determine file type and dates, all of the export/vis specific properties should be post-date
//even cap "metadata" field should be used for both
//have this as backbone data, vis and export have their own annotations

//this should be good \o/
//nope... it is inconsistent, remember period? can have files some files for some types but no vis
//this can be export backbone
//actually, can use it as a backbone, have annotations in the vis object noting unavailability for vis (backbone should be most expansive set)
//can export have unavailability or always most expansive set?
//note that even if somethings unavailable it should still have the full property path, just some of the value sets may be limited (e.g. period for vis no daily for now)

//assume everything always has a period if there's dates for date format processing
//have something that handles special fields
let backboneData: any = {
  field: {
    fieldRef: "datatype",
    advanced: false
  },
  layerMap: {
    rainfall: {
      field: {
        fieldRef: "method",
        advanced: false
      },
      layerMap: {
        new: {
          field: {
            fieldRef: "period",
            advanced: false
          },
          layerMap: {
            month: {
              field: {
                fieldRef: "tier",
                advanced: true,
                default: "latest"
              },
              layerMap: {
                0: {
                  dates:{
                    min: "1990-01",
                    max: null
                  }
                },
                //need to have special processing for certain properties
                //for tiers in particular, tier values should be numeric, latest tag should query for greatest value ($max)
                latest: {
                  dates: {
                    min: "1990-01",
                    //if max is null then should query for newest data
                    max: null
                  }
                }
              }
            },
            day: {
              field: {
                fieldRef: "tier",
                advanced: true,
                //note default values will be filled in on path reset (must be manually overridden), so should still have this property even with pre-filled path
                default: "latest"
              },
              layerMap: {
                0: {
                  dates:{
                    min: "1990-01",
                    max: null
                  }
                },
                //how does latest data tier work with csv data?
                //should just be whatever the newest data is for each station, should work fine (may have to do external processing if files are not presented with one up to date)
                //need to ask ryan how these files are going to be stored
                latest: {
                  dates: {
                    min: "1990-01",
                    //if max is null then should query for newest data
                    max: null
                  }
                }
              }
            }
          },
        },
        //legacy maps don't have a period option (only monthly), list in metadata
        legacy: {
          //how get period
          dates: {
            min: "1920-01",
            //remember the range is [) (set goes through 2012-12)
            max: "2013-01"
          },
          metadata: {
            period: "month"
          },
        }
      }
    }
  }
};

//for date filepaths lets have a special string in the filepath representing the date formatting
//use ${} with date format in between curlys, e.g. ${YYYY_MM}

//default path
let dataDefault = ["rainfall", "new", "month", "latest"];

//!!!!!!!
//data tiers really do complicate everything... tiers will probably have to be a parameter for post-processing on csvs (much more straightforward for geotiff data)
//maybe should separate out csv and geotiff/related info since handled so much differently
//!!!!!!!

//have a file ref that just has the selector paths and file names enumerated without all of the details of how to select it (this way can easily use with vis stuff if end up using files)
//how we dealing with csvs? see above note
//geotiff data should always be at bottom of the path so no need special file interjections
let rasterDataRef = {
  //use file path composition to shorten full paths and allow gap for date folders
  //assumes datasets stored hierarchically in same precedent
  //note this is flexible to allow different storage systems/roots if shift base path down, for now assume root the same for all data sets
  //how to deal with extended paths from geotiffs?
  path: "https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data/",
  //gonna want to wrap these in a field to separate from path, maybe make a script to do so dont have to do by hand
  rainfall: {
    path: "Rainfall/",
    new: {
      //going to need to add a folder after rainfall for this
      path: "",
      month: {
        //obviously gonna change with daily maps
        path: "allMonYrData/",
        //how to handle data tiers...
        //"latest" data tier may be variable
        //I think the best way would be to have tier label processed separately based on date range and label (expand tier similar to dates)
        //have ${T} or something like that
      }
      //no daily geotiff stuff for now
      // daily: {

      // }
    },
    //note this stuff isnt in the system yet and you probably want to change the filenames/path
    legacy: {
      //what is the folder after Rainfall gonna be?
      path: "legacy/",
      //need something to identify what this file is
      files: [{
        type: "map",
        file: "MoYrRF_${YYYY_MM}.tif"
      }, {
        type: "anomaly",
        file: "MoYrAnom_${YYYY_MM}_mm.tif"
      }]
    }
  }
}

//fields are set by backbone, just list value paths
let exportData = {
  files: [],
  rainfall: {
    files: [],
    new: {
      files: [],

    },
    legacy: {
      files: []
    }
  }
}

//need something to note which files properties belong to

//should allow layers after dates. why? because that way can have




//decouple values and layers for readability
//decouple field and values
interface ExportLayer {
  files: FileData[],
  field: FieldData,
  layerMap: {
    [values: string]: ExportLayer | ExportLayerCap
  }
}

//multi-options?
//imagine county stuff if there was no statewide (not appropriate as filter since no obvious default)
//file specific filters
//file data should have links to options that apply to them
//what if mutiple options affect file name?
// interface FileOptions {
//   selector: SelectorData
// }

interface FileOption {
  //implement as filter?
  filter: boolean,

}

//instead of cap just have special date layer
//nah, dates should be last thing so can't influence anything else (each dataset has a date range of coverage)

interface ExportLayerCap {
  //strings because want to be json friendly
  dates: {
    min: string,
    max: string
  },
  //non-selecting metadata with static value to display (values should be in propertyMap) (e.g. period for legacy)
  metadata:{
    [fieldRef: string]: string
  },
  //array, could be multiple base paths
  files: FileData[]
}



//are you going to store counties as filters? makes sense
//any of these option things should be in propertyMap
//how to link with filtering?
// interface FileData {
//   path: string
//   file: ValueData<string>
// }

interface FieldData {
  fieldRef: string,
  advanced: boolean,
  default?: string
}

interface AdvancedFieldData {

}


interface FileGroups {

}



//requires field? what fields need to be filled out for this to be available?
//but how to change options...
//strip this out to streamline, then use value map with ref strings
// interface FieldData {
//   ref: string,
//   advanced: boolean,
//   default: string
//   //valueRef: ValueRefMap | string[]
// }

interface ValueLayer {
  values: ValueInfo[]
}

interface ValueInfo {
  value: string,
  next: ValueLayer
}

// //yeah this doesn't work... its based on all the upper field values (e.g. rainfall -> monthly -> fill type values may be different than temperature -> daily -> field type values)
// interface ValueRefMap {
//   requires: string,
//   valueMap: {
//     [requiredFieldValue: string]: string[]
//   }

// }

////////////////////////////////////////////////

// let exportData: ExportLayer = {
//   files: [],
//   options: {
//     advanced: false,
//     selector: {
//       type: "selector",
//       multiselect: false,
//       groupData: {
//         value: "datatype",
//         label: "Data Type",
//         description: "Data type"
//       },
//       valueData: [{
//         value: {
//           s
//           selector: {
//             type: "selector",
//             multiselect: false,
//             groupData: {
//               value: "period",
//               label: "Time Period",
//               description: "Period of time covered by measurements"
//             },
//             valueData: [{
//               value: null,
//               label: "Monthly",
//               description: "Rainfall data at a monthly interval"
//             }, {
//               value: null,
//               label: "Daily",
//               description: "Rainfall data at a daily interval"
//             }]
//           }
//         },
//         label: "Rainfall",
//         description: "Rainfall data"
//       }]
//     }
//   }
// };



//root

// interface ExportLayer {
//   files: FileData[],
//   options: ExportOptions
// }

interface ExportOptions {
  advanced: boolean,
  default?: string,
  selector: SelectorData<string, ExportLayer | ExportCap>
}





interface ExportCap {
  files: FileData
}





interface ControlData<T> {
  type: "range" | "selector",
  groupData: ValueData<T>,
  valueData: any
}

interface RangeData<T> extends ControlData<T> {
  type: "range",
  multiselect: boolean,
  valueData: {
    min: number,
    max: number
  }
}

interface SelectorData<T, U> extends ControlData<T> {
  type: "selector",
  multiselect: boolean,
  //checkboxes/radio boxes
  expand: boolean,
  groupData: ValueData<T>,
  valueData: ValueData<U>[]
}

//multioptions have multiple baseurls associated
//each file should have a key to reference it by (use value in ValueData)


// export interface FileData {
//   fileBase: string,
//   requires: string[]
// }
