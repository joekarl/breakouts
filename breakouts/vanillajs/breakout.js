/**
 * The guts of the game
 */
const gameCanvas = document.getElementById('gameField');
const ctx2d = gameCanvas.getContext('2d');

const gameState = {
  ctx2d,
  canvasSize: {
    width: gameCanvas.width,
    height: gameCanvas.height
  },
  currentState: GameState_INIT,
  imageManager: new ImageManager(),
  images: {
    TILES: '../../resources/tiles.png',
    LOGO: '../../resources/logo.png',
    BG: '../../resources/bg_prerendered.png',
  },
  inputManager: new InputManager(gameCanvas),
  previousState: -1,
  stateData: {}
};

// the game loop, we use request animation frame to drive everything
function gameLoop(lastTime, currentTime) {
  var dt = currentTime - lastTime;
  if (dt > 32) {
    dt = 32;
  }
  const ctx = gameState.ctx2d;

  // init the game state, clean up after old state
  if (gameState.previousState != gameState.currentState) {
    gameState.previousState = gameState.currentState;
    gameState.stateData = {};
    gameState.currentState.init(gameState, dt);
  }

  // clear the screen
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, gameState.canvasSize.width, gameState.canvasSize.height);

  ctx.save();
  gameState.currentState.updateRender(gameState, dt);
  ctx.restore();

  requestAnimationFrame(gameLoop.bind(null, currentTime));
}

requestAnimationFrame(gameLoop.bind(null, new Date().getTime()));
