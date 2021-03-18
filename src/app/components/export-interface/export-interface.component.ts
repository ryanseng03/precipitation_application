import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-export-interface',
  templateUrl: './export-interface.component.html',
  styleUrls: ['./export-interface.component.scss']
})
export class ExportInterfaceComponent implements OnInit {

  constructor() { 
    console.log("!");
  }

  ngOnInit() {
  }

}
