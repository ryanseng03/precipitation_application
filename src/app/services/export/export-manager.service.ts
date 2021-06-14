import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import * as JSZip from "jszip";
import { DbConService, Config } from '../dataLoaders/dataRequestor/auxillary/dbCon/db-con.service';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';
import { throwError } from "rxjs";
import { saveAs }  from 'file-saver';
import * as Moment from 'moment';
import { ValueData } from 'src/app/models/Dataset';
import * as zip from "client-zip";

@Injectable({
  providedIn: 'root'
})
export class ExportManagerService {

  // exportData = {
  //   datatype:
  //     period: {

  //     },
  //     files: {
  //       rasters: [],
  //       stations: []
  //     }
  //   files: {
  //     rasters: [],
  //     stations: []
  //   }
  // }

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

  //sizes in MB
  static readonly MAX_INTERNAL_PACKAGE_SIZE = 100;
  static readonly GEOTIFF_SIZE = 25;
  static readonly METADATA_SIZE = 2;
  static readonly STATION_DATA = 20;

  constructor(private http: HttpClient, private dbcon: DbConService) {
    // let files: FileData[] = [this.fileData.stations[0]];
    // this.generatePackage(files);
  }

  generatePackage(files: ExportInfo[], email?: string) {
    console.log(files);
    let fnames = this.getResourceNames(files);
    console.log(fnames);
    //email support not here yet
    if(email) {

    }
    //else {
      let start = new Date().getTime();
      let promises: Promise<DownloadData>[] = [];
      for(let file of fnames) {
        let fdata: Promise<DownloadData> = this.getFile(file);
        promises.push(fdata);
      }
      Promise.all(promises)
      .then((data: DownloadData[]) => {
        let time = new Date().getTime() - start;
        let timeSec = time / 1000;
        console.log(console.log(`Got file data, time elapsed ${timeSec} seconds`));
        this.createPackage(data);
      })
      .catch((error: any) => {
        console.error(error);
      });
    //}
  }

  private getFile(file: string): Promise<DownloadData> {
    //should chnage base url with https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data, rest can be root dir for that dataset
    //maybe? what if what to use different storage sys, maybe just have all specified by dataset
    let url = `${ExportManagerService.EXPORT_BASE_URL}${file}`;
    // let resourceSplit = url.split("/");
    // let fname = resourceSplit[resourceSplit.length - 1]

    return new Promise<DownloadData>((resolve, reject) => {
      // let head = new HttpHeaders()
      // // .set("Authorization", "Bearer " + config.oAuthAccessToken)
      // .set("Content-Type", "application/x-www-form-urlencoded");
      let options = {
        //headers: head,
        responseType: "arraybuffer"
      };

      //remember error manager and dialogs
      //cast options to any because typings being weird
      this.http.get(url, <any>options)
      .pipe(
        retry(3),
        take(1),
        catchError((e: HttpErrorResponse) => {
          return throwError(e);
        })
      )
      .subscribe((response: ArrayBuffer) => {
        let data: DownloadData = {
          fname: file,
          contents: response
        };
        //console.log(response);
        resolve(data);
      }, (error: any) => {
        reject(error);
      });
    });

  }

  private createPackage(data: DownloadData[]) {
    console.log(data);
    //let t = 100n;
    let t2 = BigInt(100);
    let start = new Date().getTime();
    const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." };
    const blob = zip.downloadZip([intro]).blob();

    //const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." }
    //czip.downloadZip([intro]).blob()
    // .then((zipData: Blob) => {
    //   let time = new Date().getTime() - start;
    //   let timeSec = time / 1000;
    //   console.log(console.log(`Generated download package, time elapsed ${timeSec} seconds`));
    //   saveAs(zipData, ExportManagerService.EXPORT_PACKAGE_NAME);
    // });

    //let t = 100n;
    //let t = BigInt(100);

    // let writer = new zip.BlobWriter("application/zip");
    // let zipWriter = new zip.ZipWriter(writer);
    // let reader = new zip.BlobReader(new Blob([data[0].contents]));
    // zipWriter.add("test.zip", reader);

    // cast any with jszip, throws an error otherwise but works (not sure why)
    // let zip: JSZip = new (<any>JSZip)();
    // for(let fileData of data) {
    //   zip.file(fileData.fname, fileData.contents);
    // }
    // let zipOpts: JSZip.JSZipGeneratorOptions = {
    //   type: "blob",
    //   // compression: "DEFLATE",
    //   // streamFiles: true
    // };
    // zip.generateAsync(zipOpts)
    // .then((zipData: Blob) => {
    //   let time = new Date().getTime() - start;
    //   let timeSec = time / 1000;
    //   console.log(console.log(`Generated download package, time elapsed ${timeSec} seconds`));
    //   saveAs(zipData, ExportManagerService.EXPORT_PACKAGE_NAME);
    // });
  }

  //should have selection for county
  private getResourceNames(fileInfo: ExportInfo[]): string[] {
    let files = []
    for(let info of fileInfo) {
      if(info.dateInfo) {
        //step through dates using granularity
        let date: Moment.Moment = info.dateInfo.dates[0].clone();
        while(date.isBefore(info.dateInfo.dates[1])) {
          let dateForm: string;
            switch(info.dateInfo.period) {
              case "month": {
                dateForm = date.format("YYYY_MM");
                break;
              }
              case "day": {
                dateForm = date.format("YYYY_MM_DD");
                break;
              }
              default: {
                throw new Error("Unknown date period. Can not generate file listing");
              }
            }
          for(let file of info.files) {
            let fname = `${dateForm}_${file.fileBase}`;
            let fpath = `${info.baseURL}/${dateForm}/${fname}`;
            files.push(fpath);
          }
          date.add(1, <Moment.unitOfTime.DurationConstructor>info.dateInfo.period);
        }
      }
      else {
        for(let file of info.files) {
          let fpath = `${info.baseURL}/${file.fileBase}`;
          files.push(fpath);
        }

      }

    }

    return files;
  }
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

interface DownloadData {
  fname: string,
  contents: ArrayBuffer
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
      daily: {
        label: "Daily",
        description: "Data at a daily interval"
      },
      monthly: {
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
            monthly: {
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
                latest: {
                  dates: {
                    min: "1990-01",
                    //if max is null then should query for newest data
                    max: null
                  }
                }
              }
            },
            daily: {
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
            period: "monthly"
          },
        }
      }
    }
  }
};

//for date filepaths lets have a special string in the filepath representing the date formatting
//use ${} with date format in between curlys, e.g. ${YYYY_MM}

//default path
let dataDefault = ["rainfall", "new", "monthly", "latest"];

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
      monthly: {
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
interface FileOptions {
  selector: SelectorData
}

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

interface DateInfo {
  dates: {
    min: string,
    max: string
  },
  period: string
}

//are you going to store counties as filters? makes sense
//any of these option things should be in propertyMap
//how to link with filtering?
interface FileData {
  path: string
  file: ValueData<string>
}

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
