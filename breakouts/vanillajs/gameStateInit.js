GameState_INIT = {
  init: function(gameState, dt) {
    const stateData = gameState.stateData;
    stateData.doneLoading = false;
    stateData.startedLoading = false;
    stateData.errorLoading = false;
  },
  updateRender: function(gameState, dt) {
    const stateData = gameState.stateData;
    const ctx = gameState.ctx2d;
    const images = gameState.images;

    if (stateData.doneLoading) {
      // if done loading assets, change current state to menu
      gameState.currentState = GameState_GAME;
    } else if (!stateData.startedLoading) {

      // if we haven't started loading, start loading all the assets
      gameState.imageManager.loadAllImages([
        images.TILES,
        images.LOGO,
        images.BG
      ], function(errors){
        if (errors) {
          stateData.errorLoading = true;
          console.log(errors);
        } else {
          stateData.doneLoading = true;
        }
      });
      stateData.startedLoading = true;
    }

    // render
    if (!stateData.errorLoading) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Loading...', 10, gameState.canvasSize.height - 10);
    } else {
      ctx.fillStyle = '#FF0000';
      ctx.fillText('ERROR LOADING ASSETS, SEE CONSOLE', 10, gameState.canvasSize.height - 10);
    }
  }
};
