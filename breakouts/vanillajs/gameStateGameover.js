GameState_GAMEOVER = {
  init: function(gameState, dt) {
    const stateData = gameState.stateData;
    stateData.clicked = false;
    stateData.clickCleared = false;
  },
  updateRender: function(gameState, dt) {
    const stateData = gameState.stateData;
    const mouseDown = gameState.inputManager.isMouseDown();
    if (!stateData.clicked && stateData.clickCleared && mouseDown) {
      stateData.clicked = true;
    } else if (!stateData.clicked && !mouseDown && !stateData.clickCleared) {
      stateData.clickCleared = true;
    } else if (stateData.clicked){
      gameState.currentState = GameState_MENU;
    }

    const ctx = gameState.ctx2d;
    const canvasSize = gameState.canvasSize;
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const images = gameState.images;
    const bg = gameState.imageManager.getImage(images.BG);
    const logo = gameState.imageManager.getImage(images.LOGO);
    const gameOverText = 'GAME OVER!';

    ctx.font = '22px sans-serif';
    const gameOverTextMetrics = ctx.measureText(gameOverText);

    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(logo, canvasWidth / 2 - logo.width / 2, canvasHeight / 6);

    ctx.fillStyle = '#000000';
    ctx.fillText(gameOverText,
                 canvasWidth / 2 - gameOverTextMetrics.width / 2,
                 canvasHeight * 3 / 4);
  }
};
