import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSetIntervalSelectorComponent } from './data-set-interval-selector.component';

describe('DataSetIntervalSelectorComponent', () => {
  let component: DataSetIntervalSelectorComponent;
  let fixture: ComponentFixture<DataSetIntervalSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataSetIntervalSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSetIntervalSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
