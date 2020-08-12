import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViewsComponent } from './data-views.component';

describe('DataViewsComponent', () => {
  let component: DataViewsComponent;
  let fixture: ComponentFixture<DataViewsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataViewsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataViewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
