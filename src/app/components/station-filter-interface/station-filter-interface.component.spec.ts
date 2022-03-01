import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StationFilterInterfaceComponent } from './station-filter-interface.component';

describe('StationFilterInterfaceComponent', () => {
  let component: StationFilterInterfaceComponent;
  let fixture: ComponentFixture<StationFilterInterfaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StationFilterInterfaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StationFilterInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
