import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-game-won-modal',
  templateUrl: './game-won-modal.component.html',
  styleUrls: ['./game-won-modal.component.scss'],
})
export class GameWonModalComponent {
  @Input() totalMoves: number;
  @Input() elapsedTimeInSeconds: number;

  @Output() modalEventEmitter = new EventEmitter();
  constructor() {}

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

  closeHandler() {
    this.modalEventEmitter.emit('closeModal');
  }

  startNewGameHandler() {
    this.modalEventEmitter.emit('startNewGame');
  }
}
