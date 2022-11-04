import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FocusControlComponent } from './focus-control.component';

describe('FocusControlComponent', () => {
  let component: FocusControlComponent;
  let fixture: ComponentFixture<FocusControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FocusControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FocusControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
