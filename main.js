import './style.css'
import { Game } from './src/Game.js'

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();

  // Hide instructions on click
  const instructions = document.getElementById('instructions');
  document.addEventListener('click', () => {
    if (instructions.style.opacity !== '0') {
      instructions.style.opacity = '0';
      game.controls.lock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) {
        instructions.style.opacity = '1';
    }
  });
});
