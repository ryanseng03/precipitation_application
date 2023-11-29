import { Component, OnInit, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormValue } from 'src/app/services/dataset-form-manager.service';
import { DatasetSelectorGroup } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-selector',
  templateUrl: './selector.component.html',
  styleUrls: ['./selector.component.scss']
})
export class SelectorComponent implements OnInit {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() tooltipPosition: string = "right";
  @Input() valueTooltipPosition: string = "right";
  @Input() control: FormControl;
  @Input() groupValues: DatasetSelectorGroup[];
  @Input() values: FormValue[];
  @Input() flattenSingle: boolean = true;
  @Input() multiselect: boolean = false;

  constructor() {
  }

  ngOnInit() {
  }

}
