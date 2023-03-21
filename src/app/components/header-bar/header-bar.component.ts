import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppComponent, MoveHistory } from 'src/app/app.component';
import { Settings } from '../settings-menu/settings-menu.component';
@Component({
  selector: 'app-header-bar',
  templateUrl: './header-bar.component.html',
  styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent implements OnInit {
  @Input() totalMoves = 0;
  @Input() elapsedTimeInSeconds = 0;
  @Input() moveHistory: MoveHistory[];
  @Output() resetGameEvent = new EventEmitter<null>();
  @Output() undoMoveEvent = new EventEmitter<null>();

  rotateImageStyling: string = '';
  showSettingsMenu = false;
  settings = new Settings();

  constructor(private app: AppComponent) {}

  ngOnInit(): void {
    this.app.settings$.subscribe(settings => (this.settings = settings));
  }

  settingsClickHandler() {
    this.settings.settingsModalOpen = !this.settings.settingsModalOpen;
    this.app.settings$.next(this.settings);
  }

  get formattedTotalMoves() {
    return String(this.totalMoves).padStart(4, '0');
  }

  get formattedElapsedTime() {
    const minutes = Math.floor(this.elapsedTimeInSeconds / 60);
    const seconds = this.elapsedTimeInSeconds % 60;
    const minutesString = minutes >= 10 ? `${minutes}` : `0${minutes}`;
    const secondsString = seconds >= 10 ? `${seconds}` : `0${seconds}`;
    return `${minutesString}:${secondsString}`;
  }
}
