import { Component, Input, OnInit } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { Settings } from '../header-bar/header-bar.component';

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.scss'],
})
export class SettingsMenuComponent implements OnInit {
  @Input() isOpen: boolean;

  settings: Settings = {
    nightMode: false,
    settingsMenu: false,
  };
  nightModeActive = false;

  constructor(public app: AppComponent) {}

  ngOnInit(): void {
    this.app.settings$.subscribe(settings => (this.settings = settings));
  }

  toggleNightMode() {
    this.settings.nightMode = !this.settings.nightMode;
    this.app.settings$.next(this.settings);
  }
}
