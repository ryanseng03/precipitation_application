import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSetSelectorComponent } from './data-set-selector.component';

describe('DataSetSelectorComponent', () => {
  let component: DataSetSelectorComponent;
  let fixture: ComponentFixture<DataSetSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataSetSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSetSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
