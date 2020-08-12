import { Component, OnInit, ViewChild } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service";
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-site-filter',
  templateUrl: './site-filter.component.html',
  styleUrls: ['./site-filter.component.scss']
})
export class SiteFilterComponent implements OnInit {

  constructor(private filter: SiteFilterService) { }

  ngOnInit() {
  }




  options = [
    {
      display: 'One',
      value: '1'
    }, {
      display: 'Two',
      value: '2'
    }, {
      display: 'Three',
      value: '3'
    }, {
      display: 'Four',
      value: '4'
    }, {
      display: 'Five',
      value: '5'
    }, {
      display: 'Six',
      value: '6'
    }
  ];
  profileForm = new FormGroup({
    selected: new FormControl(['1', '2', '3'])
  });
}
