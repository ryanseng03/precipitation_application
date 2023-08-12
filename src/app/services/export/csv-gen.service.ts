import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvGenService {

  constructor() { }

  createCSV(data: string[][], fname: string): void {
    let dataStr = data.map((row: string[]) => {
      return row.join(",");
    }).join("\n");
    const blob = new Blob([dataStr], { type: 'text/csv' });
    this.downloadBlob(blob, fname);
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
}
