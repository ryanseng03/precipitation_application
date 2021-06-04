import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import * as JSZip from "jszip";
import { DbConService, Config } from '../dataLoaders/dataRequestor/auxillary/dbCon/db-con.service';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';
import { throwError } from "rxjs";
import { saveAs }  from 'file-saver';
import * as Moment from 'moment';
import { ValueData } from 'src/app/models/Dataset';

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
    let start = new Date().getTime();

    //const intro = { name: "intro.txt", lastModified: new Date(), input: "Hello. This is the client-zip library." }
    //czip.downloadZip([intro]).blob()
    // .then((zipData: Blob) => {
    //   let time = new Date().getTime() - start;
    //   let timeSec = time / 1000;
    //   console.log(console.log(`Generated download package, time elapsed ${timeSec} seconds`));
    //   saveAs(zipData, ExportManagerService.EXPORT_PACKAGE_NAME);
    // });

    // let writer = new zip.BlobWriter("application/zip");
    // let zipWriter = new zip.ZipWriter(writer);
    // let reader = new zip.BlobReader(new Blob([data[0].contents]));
    // zipWriter.add("test.zip", reader);

    // cast any with jszip, throws an error otherwise but works (not sure why)
    let zip: JSZip = new (<any>JSZip)();
    for(let fileData of data) {
      zip.file(fileData.fname, fileData.contents);
    }
    // let zipOpts: JSZip.JSZipGeneratorOptions = {
    //   type: "blob",
    //   compression: "DEFLATE",
    //   streamFiles: true
    // };
    zip.generateAsync()
    .then((zipData: Blob) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(console.log(`Generated download package, time elapsed ${timeSec} seconds`));
      saveAs(zipData, ExportManagerService.EXPORT_PACKAGE_NAME);
    });
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

export interface FileData {
  fileBase: string,
  requires: string[]
}

interface OptionGroups {
  raster: Options[],
  stations: Options[],
  general: Options[]
}

interface Options {
  data: ValueData<string>,
  next: Options,
  files: FileGroups,
  symetric: ValueData<Options>[]
}

// interface SymetricOptions {
//   options: SymetricOptions[]
// }

// interface SymetricOption {
//   data: ValueData<string>,
//   files: FileGroups,
//   next: HierarchicalOption
// }

interface ExportOptionsCap {
  dates: [Moment.Moment, Moment.Moment],
  files: FileGroups
}

interface FileGroups {
  raster: FileData[],
  stations: FileData[],
  general: FileData[]
}


//////////////////////////////////////////////////////

interface ExportOptionsLayer {
  options: ExportOption[] | ExportOptionCap,
  files: FileGroups
}

interface ExportOption {
  //info on option and option values
  data: ValueData<ExportOptionValue[]>,
}

interface ExportOptionValue {
  data: ValueData<string>,
  next: ExportOptionsLayer
}

interface ExportOptionCap {
  baseOpts: ValueData<ExportMultioption>[],
  dates: [Moment.Moment, Moment.Moment]
}

interface ExportMultioption {
  min: number,
  max: number,
  data: ValueData<string>[]
}
