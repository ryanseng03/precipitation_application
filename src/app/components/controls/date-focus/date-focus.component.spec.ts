import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateFocusComponent } from './date-focus.component';

describe('DateFocusComponent', () => {
  let component: DateFocusComponent;
  let fixture: ComponentFixture<DateFocusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DateFocusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateFocusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
