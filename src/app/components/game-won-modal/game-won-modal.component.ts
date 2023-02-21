import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-game-won-modal',
  templateUrl: './game-won-modal.component.html',
  styleUrls: ['./game-won-modal.component.scss']
})
export class GameWonModalComponent implements OnInit {
  @Output() modalEventEmitter = new EventEmitter;
  constructor() { }

  ngOnInit(): void {
  }

  closeHandler(){
    this.modalEventEmitter.emit('closeModal');
  }

  startNewGameHandler(){
    this.modalEventEmitter.emit('startNewGame');
  }
}
