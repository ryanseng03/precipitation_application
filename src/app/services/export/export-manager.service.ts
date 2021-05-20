import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import * as JSZip from "jszip";
import { DbConService, Config } from '../dataLoaders/dataRequestor/auxillary/dbCon/db-con.service';
import { map, retry, catchError, mergeMap, take } from 'rxjs/operators';
import { throwError } from "rxjs";
import { saveAs }  from 'file-saver';


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
  static readonly EXPORT_BASE_URL = "https://ikeauth.its.hawaii.edu/files/v2/download/public/system/ikewai-annotated-data/Rainfall/";

  //sizes in MB
  static readonly MAX_INTERNAL_PACKAGE_SIZE = 100;
  static readonly GEOTIFF_SIZE = 25;
  static readonly METADATA_SIZE = 2;
  static readonly STATION_DATA = 20;

  constructor(private http: HttpClient, private dbcon: DbConService) {
    // let files: FileData[] = [this.fileData.stations[0]];
    // this.generatePackage(files);
  }

  private generatePackage(files: FileData[], email?: string) {
    //email support not here yet
    if(email) {

    }
    //else {
      let promises: Promise<DownloadData>[] = [];
      for(let file of files) {
        let fdata: Promise<DownloadData> = this.getFile(file);
        promises.push(fdata);
      }
      Promise.all(promises)
      .then((data: DownloadData[]) => {
        this.createPackage(data);
      })
      .catch((error: any) => {
        console.error(error);
      });
    //}
  }

  private getFile(file: FileData): Promise<DownloadData> {
    let url = `${ExportManagerService.EXPORT_BASE_URL}${file.file}`;

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
          fname: file.file,
          contents: response
        };
        resolve(data);
      }, (error: any) => {
        reject(error);
      });
    });



  }

  private createPackage(data: DownloadData[]) {
    JSZip.generateAsync
    //cast any with jszip, throws an error otherwise but works (not sure why)
    let zip: JSZip = new (<any>JSZip)();
    for(let fileData of data) {
      zip.file(fileData.fname, fileData.contents);
    }
    zip.generateAsync({type: "blob"})
    .then((zipData: Blob) => {
      saveAs(zipData, ExportManagerService.EXPORT_PACKAGE_NAME);
    });

  }
}

interface DownloadData {
  fname: string,
  contents: ArrayBuffer
}

export interface FileData {
  label: string,
  file: string,
  requires: string[]
}

interface HierarchicalOption {
  data: OptionData
  next: HierarchicalOption
  options: SymetricOption[]
}

// interface SymetricOptions {
//   options: SymetricOptions[]
// }

interface SymetricOption {
  data: OptionData
  next?: HierarchicalOption
}

interface OptionData {
  value: string,
  label: string
}
