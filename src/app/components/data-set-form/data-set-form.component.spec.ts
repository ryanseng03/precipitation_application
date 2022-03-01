import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSetFormComponent } from './data-set-form.component';

describe('DataSetFormComponent', () => {
  let component: DataSetFormComponent;
  let fixture: ComponentFixture<DataSetFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataSetFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSetFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
