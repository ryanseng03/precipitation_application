import { Injectable } from '@angular/core';
import { SiteMetadata, SiteValue } from "../../models/SiteMetadata";

@Injectable({
  providedIn: 'root'
})
export class DataProcessorService {

  constructor() { }

  processMetadataDoc(doc: any[]): SiteMetadata {
    
  }

  processValueDocs(doc: any): SiteValue {

  }
}
