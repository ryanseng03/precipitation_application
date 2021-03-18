import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBaseComponent } from './nav-base.component';

describe('NavBaseComponent', () => {
  let component: NavBaseComponent;
  let fixture: ComponentFixture<NavBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
