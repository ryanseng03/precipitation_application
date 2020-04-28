import { Component, OnInit } from '@angular/core';
import {SiteFilterService} from "src/app/services/controlHelpers/site-filter.service"

@Component({
  selector: 'app-site-filter',
  templateUrl: './site-filter.component.html',
  styleUrls: ['./site-filter.component.scss']
})
export class SiteFilterComponent implements OnInit {

  constructor(private filter: SiteFilterService) { }

  ngOnInit() {
  }

}
