import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterMapComponent } from './filter-map.component';

describe('FilterMapComponent', () => {
  let component: FilterMapComponent;
  let fixture: ComponentFixture<FilterMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
