GameState_MENU = {
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
      gameState.currentState = GameState_GAME;
    }

    const ctx = gameState.ctx2d;
    const canvasSize = gameState.canvasSize;
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const images = gameState.images;
    const bg = gameState.imageManager.getImage(images.BG);
    const logo = gameState.imageManager.getImage(images.LOGO);
    const clickToStartText = 'click to start';
    const duringGameText = 'during the game use: L/R arrow';
    const keysText = 'keys to skip level';

    ctx.font = '19px sans-serif';
    const clickToStartTextMetrics = ctx.measureText(clickToStartText);
    const duringGameTextMetrics = ctx.measureText(duringGameText);
    const keysTextMetrics = ctx.measureText(keysText);

    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(logo, canvasWidth / 2 - logo.width / 2, canvasHeight / 6);

    ctx.fillStyle = '#000000';
    ctx.fillText(clickToStartText,
                 canvasWidth / 2 - clickToStartTextMetrics.width / 2,
                 canvasHeight * 3 / 4);
    ctx.fillText(duringGameText,
                 canvasWidth / 2 - duringGameTextMetrics.width / 2,
                 canvasHeight - 56);
    ctx.fillText(keysText,
                 canvasWidth / 2 - keysTextMetrics.width / 2,
                 canvasHeight - 24);
  }
};
