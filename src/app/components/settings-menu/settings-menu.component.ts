import { Component, OnInit } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
export class Settings {
  nightModeActive: boolean;
  settingsModalOpen: boolean;

  constructor() {
    this.nightModeActive = false;
    this.settingsModalOpen = false;
  }
}

@Component({
  selector: 'app-settings-menu',
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.scss'],
})
export class SettingsMenuComponent implements OnInit {
  settings = new Settings();

  constructor(public app: AppComponent) {}

  ngOnInit(): void {
    this.app.settings$.subscribe(settings => (this.settings = settings));
  }

  toggleNightMode() {
    this.settings.nightModeActive = !this.settings.nightModeActive;
    this.app.settings$.next(this.settings);
  }

  closeSettings() {
    this.settings.settingsModalOpen = false;
    this.app.settings$.next(this.settings);
  }
}
