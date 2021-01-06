import { Component, OnInit, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
//import { ColorScale } from 'src/app/models/colorScale';
import {ColorGeneratorService, XMLColorSchemeData} from "../../services/rasterLayerGeneration/color-generator.service";
import {CustomColorSchemeService} from "../../services/helpers/custom-color-scheme.service";

@Component({
  selector: 'app-upload-custom-color-scheme',
  templateUrl: './upload-custom-color-scheme.component.html',
  styleUrls: ['./upload-custom-color-scheme.component.scss']
})
export class UploadCustomColorSchemeComponent {
  useCustomName: FormControl;
  customName: FormControl;
  reverseScheme: FormControl;
  fileData: Promise<string>;
  error: any;
  defaultName: string;

  constructor(public helper: CustomColorSchemeService, private colors: ColorGeneratorService, public dialogRef: MatDialogRef<UploadCustomColorSchemeComponent>, @Inject(MAT_DIALOG_DATA) public invalidNames: Set<string>) {
    this.defaultName = helper.getDefaultName();
    this.customName = new FormControl(this.defaultName, this.nameFieldValidator());
    this.reverseScheme = new FormControl(false);
    this.useCustomName = new FormControl(false);
    this.fileData = null;
    this.error = null;
  }

  // exit(): void {
  //   this.dialogRef.close(null);
  // }

  handleFileInput(files: FileList) {
    console.log(files);
    //single input, get first item
    //use any type to prevent typing error (text does not exist on type File)
    let file: any = files.item(0);
    //make sure file actually selected
    if(file) {
      //Blob.text isn't fully supported, use if available, otherwise use FileReader
      if(file.text) {
        this.fileData = file.text();
      }
      else {
        let reader = new FileReader();
        this.fileData = new Promise((resolve, reject) => {
          reader.onload = (event: Event) => {
            let data: string = <string>reader.result;
            resolve(data);
          };
          reader.onerror = (event: Event) => {
            reject(reader.error);
          };
          reader.onabort = (event: Event) => {
            reject("File read aborted");
          };
        });
        reader.readAsText(file);
      }
    }
    //if no file selected set fileData promise to null
    else {
      this.fileData = null;
    }
  }

  close() {
    this.dialogRef.close(null);
  }

  submit() {
    console.log(this.fileData);
    //note if fileData is null then submit should be disabled
    this.fileData.then((data: string) => {
      console.log(data);
      //verify validity
      this.colors.getColorSchemeFromXML(data, this.reverseScheme.value).then((colorSchemeData: XMLColorSchemeData) => {
        //replace name with custom name or default name if name null/already taken
        if(this.useCustomName.value) {
          colorSchemeData.name = this.customName.value;
        }
        //if name is null or already taken then use default name
        else if(colorSchemeData.name == null || !this.validateName(colorSchemeData.name)) {
          colorSchemeData.name = this.defaultName;
        }
        this.dialogRef.close(colorSchemeData);
      }, (e) => {
        this.error = e;
      });
    });    
  }


  validateForm() {
    let valid = true;
    valid = valid && (!this.useCustomName.value || this.customName.valid)
    //make sure a file has been uploaded, fileData promise should be null if it hasn't
    valid = valid && this.fileData !== null;
    return valid;
  }


  nameFieldValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      console.log("validating");
      let name = control.value;
      let valid = this.validateName(name);
      return valid ? null : {forbiddenName: {value: name}};
    };
  }

  validateName(name: string) {
    return !this.invalidNames.has(name);
  }
}

