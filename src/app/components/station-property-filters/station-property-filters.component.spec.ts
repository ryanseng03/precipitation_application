import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StationPropertyFiltersComponent } from './station-property-filters.component';

describe('StationPropertyFiltersComponent', () => {
  let component: StationPropertyFiltersComponent;
  let fixture: ComponentFixture<StationPropertyFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StationPropertyFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationPropertyFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
