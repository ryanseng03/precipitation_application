import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetManagerService {

  private assetBase: string;

  constructor(private domSanitizer: DomSanitizer) {
    this.assetBase = `${environment.assetBaseUrl}assets/`;
  }

  getAssetURL(asset: string): string {
    let cleanAsset = asset.replace(/^\//, "");
    let url = `${this.assetBase}${cleanAsset}`;
    return url;
  }

  getTrustedResourceURL(asset: string): SafeResourceUrl {
    let url = this.getAssetURL(asset);
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
