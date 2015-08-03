
// how many times to run sim per frame
const SIM_FACTOR = 4.0;
const PADDLE_IMAGE_COORDS = {
  sx: 0,
  sy: 64,
  sWidth: 48,
  sHeight: 16
};
const PADDLE_V_OFFSET = 376;
const BALL_DIAMETER = 16;
const BALL_RADIUS = BALL_DIAMETER / 2;
const PADDLE_BOUNDS = [PADDLE_IMAGE_COORDS.sWidth, PADDLE_IMAGE_COORDS.sHeight];
const PADDLE_COLLISION_AUGMENT = 5;
const BALL_IMAGE_COORDS = [
  {sx: 48, sy: 64},
  {sx: 64, sy: 64},
  {sx: 80, sy: 64},
  {sx: 96, sy: 64},
  {sx: 112, sy: 64},
];
const BALL_INITIAL_POS = [50, 240];
const BALL_INITIAL_VELOCITY = 180;
const BALL_ANIMATION_FRAME_NUM = BALL_IMAGE_COORDS.length;
const BALL_ANIMATION_DURATION = 250;
const BALL_ANIMATION_FRAME_DURATION = BALL_ANIMATION_DURATION / BALL_ANIMATION_FRAME_NUM;
const COUNTER_IMAGE_COORDS = [
  {sx: 64, sy: 96, sWidth: 32, sHeight: 48},
  {sx: 32, sy: 96, sWidth: 32, sHeight: 48},
  {sx: 0, sy: 96, sWidth: 32, sHeight: 48},
];
const COUNTER_IMAGE_POS = [140, 200];
const WALL_SIZE = 16;
const REVERSE_THRESHOLD = 64;
const BLOCK_X_OFFSET = 48;
const BLOCK_Y_OFFSET = 48;
const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ANIMATION_DURATION = 250;
const BLOCK_ANIMATION_FRAME_NUM = 4;
const BLOCK_ANIMATION_FRAME_DURATION = BLOCK_ANIMATION_DURATION / BLOCK_ANIMATION_FRAME_NUM;
const SCORE_PER_BLOCK = 100;

const DEBUG_PHYSICS = false;

/**
 * position - [x, y]
 * color - see values in levels.js
 */
function Block(position, color) {
  this.position = position;
  this.aabb = {
    x: position[0],
    y: position[1],
    width: BLOCK_WIDTH,
    height: BLOCK_HEIGHT
  };
  this.dead = false;
  this.deathTimeout = BLOCK_ANIMATION_DURATION;
  this.color = color;
}

function countLiveBlocks(blocks) {
  return blocks.reduce(function(count, block) {
    if (!block.dead) {
      return count + 1;
    } else {
      return count;
    }
  }, 0);
}

function update(gameState, dt) {
  // check finish conditions before doing anything else
  const stateData = gameState.stateData;

  const liveBlockCount = countLiveBlocks(stateData.levelBlocks);

  if (liveBlockCount == 0) {
    stateData.level++;
    return initStartState(gameState, dt);
  }

  // get updated input
  const previousPaddlePosition = stateData.paddlePosition;
  stateData.paddlePosition = gameState.inputManager.mousePosition[0];
  if (stateData.paddlePosition < 0) {
    stateData.paddlePosition = 0;
  } else if (stateData.paddlePosition > gameState.canvasSize.width) {
    stateData.paddlePosition = gameState.canvasSize.width;
  }
  const paddleDx = stateData.paddlePosition - previousPaddlePosition;

  stateData.paddleAABB.x = stateData.paddlePosition - PADDLE_BOUNDS[0] / 2;
  stateData.paddleAABB.y = PADDLE_V_OFFSET - PADDLE_BOUNDS[1] / 2;
  stateData.paddleAABB.width = PADDLE_BOUNDS[0];
  stateData.paddleAABB.height = PADDLE_BOUNDS[1];

  if (stateData.levelStartTimeout > 0) {
    // don't update ball or collisions
    stateData.levelStartTimeout -= dt;
    return;
  }

  // update ball animation
  stateData.ballAnimationCounter += dt;
  const ballAnimationOffset = stateData.ballAnimationCounter % BALL_ANIMATION_DURATION;
  stateData.ballAnimationFrame = Math.floor(ballAnimationOffset / BALL_ANIMATION_FRAME_DURATION);

  const interpolation = dt / 1000;
  const fieldStartX = WALL_SIZE;
  const fieldStartY = WALL_SIZE;
  const fieldWidth = gameState.canvasSize.width - fieldStartX - WALL_SIZE;
  const fieldHeight = gameState.canvasSize.height;

  // update block lifecycles
  stateData.levelBlocks.forEach(function(block){
    if (block.dead && block.deathTimeout > 0) {
      block.deathTimeout -= dt;
    }
  });

  // do simulation
  stateData.ballPosition[0] += stateData.ballVelocity[0] * interpolation;
  stateData.ballPosition[1] += stateData.ballVelocity[1] * interpolation;

  if (stateData.ballPosition[0] + BALL_RADIUS > fieldWidth + fieldStartX) {
    stateData.ballVelocity[0] *= -1;
    stateData.ballPosition[0] = fieldWidth + fieldStartX - BALL_RADIUS;
  } else if (stateData.ballPosition[0] - BALL_RADIUS < fieldStartX) {
    stateData.ballVelocity[0] *= -1;
    stateData.ballPosition[0] = fieldStartX + BALL_RADIUS;
  }

  if (stateData.ballPosition[1] - BALL_RADIUS > fieldHeight + fieldStartY) {
    // :( we hit the bottom and lost
    stateData.lives -= 1;
    if (stateData.lives == 0){
      gameState.currentState = GameState_GAMEOVER;
    }
    return initStartState(gameState, dt);
  } else if (stateData.ballPosition[1] - BALL_RADIUS < fieldStartY) {
    stateData.ballVelocity[1] *= -1;
    stateData.ballPosition[1] = fieldStartY + BALL_RADIUS;
  }

  stateData.ballAABB.x = stateData.ballPosition[0] - BALL_RADIUS;
  stateData.ballAABB.y = stateData.ballPosition[1] - BALL_RADIUS;
  stateData.ballAABB.width = BALL_DIAMETER;
  stateData.ballAABB.height = BALL_DIAMETER;

  const paddleCollision = PHYSICS.satAABBToAABBCollision(stateData.ballAABB, stateData.paddleAABB);
  if (paddleCollision && stateData.ballVelocity[1] > 0) {
    stateData.ballVelocity[1] *= -1;
    if (paddleCollision[0] != 0) {
      // collision with side of paddle
      if ((stateData.ballVelocity[0] < 0 && paddleCollision[0] < 0) ||
          (stateData.ballVelocity[0] > 0 && paddleCollision[0] > 0)) {
        // ball moving left, collision on left side of paddle
        // -- or --
        // ball moving right, collision on right side of paddle
        // ignore side collision
      } else {
        // collision with side of paddle, flip x velocity
        stateData.ballVelocity[0] *= -1;
      }
    } else {
      // we hit the top of the paddle, let's augment the ball's horizontal velocity
      // this is so we get a little better gameplay and can kindof control the ball
      const collisionDistance = Math.abs(stateData.ballPosition[0] - stateData.paddlePosition);
      if (stateData.ballPosition[0] < stateData.paddlePosition) {
        stateData.ballVelocity[0] -= collisionDistance * PADDLE_COLLISION_AUGMENT;
      } else if (stateData.ballPosition[0] > stateData.paddlePosition) {
        stateData.ballVelocity[0] += collisionDistance * PADDLE_COLLISION_AUGMENT;
      }
    }
  }

  // check if collision with tiles
  const tileCollisions = stateData.levelBlocks.map(function(block){
    if (block.dead) { return; }
    const collisionVector = PHYSICS.satAABBToAABBCollision(stateData.ballAABB, block.aabb);
    if (collisionVector) {
      return {
        block: block,
        collisionVector: collisionVector
      };
    } else {
      return;
    }
  });

  const blockCollision = tileCollisions.reduce(function(prev, curr){
    if (!prev && curr) {
      return curr;
    } else if (prev && curr){
      const prevMagnitude = PHYSICS.magnitudeOfVector(prev.collisionVector);
      const currMagnitude = PHYSICS.magnitudeOfVector(curr.collisionVector);
      if (currMagnitude > prevMagnitude) {
        return curr;
      }
    } else {
      return prev;
    }
  }, undefined);

  if (blockCollision) {
    blockCollision.block.dead = true;
    stateData.score += SCORE_PER_BLOCK;
    if (blockCollision.collisionVector[0] != 0) {
      // collision with side of block
      stateData.ballVelocity[0] *= -1;
    } else if (blockCollision.collisionVector[1] != 0) {
      // collision with side of block
      stateData.ballVelocity[1] *= -1;
    }
  }
}

function render(gameState, dt) {
  // draw the game
  const stateData = gameState.stateData;
  const ctx = gameState.ctx2d;
  const images = gameState.images;
  const bg = gameState.imageManager.getImage(images.BG);
  const tiles = gameState.imageManager.getImage(images.TILES);
  const ballImageCoords = BALL_IMAGE_COORDS[stateData.ballAnimationFrame];

  ctx.drawImage(bg, 0, 0);

  // if we're switching states quit drawing early to prevent flash
  if (gameState.currentState != GameState_GAME) {
    return;
  }

  ctx.drawImage(tiles,
    PADDLE_IMAGE_COORDS.sx,
    PADDLE_IMAGE_COORDS.sy,
    PADDLE_IMAGE_COORDS.sWidth,
    PADDLE_IMAGE_COORDS.sHeight,
    stateData.paddlePosition - 24,
    PADDLE_V_OFFSET - 8,
    PADDLE_IMAGE_COORDS.sWidth,
    PADDLE_IMAGE_COORDS.sHeight);

  // draw labels
  ctx.fillStyle = "#000000";
  ctx.font = '18px sans-serif';
  ctx.fillText("Lives: " + stateData.lives, 30, gameState.canvasSize.height - 10);
  ctx.fillText("Score: " + stateData.score, 115, gameState.canvasSize.height - 10);
  ctx.fillText("Level: " + stateData.level, 220, gameState.canvasSize.height - 10);

  ctx.drawImage(tiles,
    ballImageCoords.sx,
    ballImageCoords.sy,
    BALL_DIAMETER,
    BALL_DIAMETER,
    stateData.ballPosition[0] - BALL_RADIUS,
    stateData.ballPosition[1] - BALL_RADIUS,
    BALL_DIAMETER,
    BALL_DIAMETER);

  // draw blocks
  stateData.levelBlocks.forEach(function(block){
    if (block.dead && block.deathTimeout <= 0) { return; }
    const animationFrame = BLOCK_ANIMATION_FRAME_NUM - Math.floor(block.deathTimeout / BLOCK_ANIMATION_FRAME_DURATION);
    ctx.drawImage(tiles,
      BLOCK_WIDTH * animationFrame,
      BLOCK_HEIGHT * block.color,
      BLOCK_WIDTH,
      BLOCK_HEIGHT,
      block.aabb.x,
      block.aabb.y,
      block.aabb.width,
      block.aabb.height);
  });

  if (stateData.levelStartTimeout > 0) {
    // draw level start counter
    const levelStartFrame = Math.floor(stateData.levelStartTimeout / 1000);
    const counterImageCoords = COUNTER_IMAGE_COORDS[levelStartFrame];
    ctx.drawImage(tiles,
      counterImageCoords.sx,
      counterImageCoords.sy,
      counterImageCoords.sWidth,
      counterImageCoords.sHeight,
      COUNTER_IMAGE_POS[0],
      COUNTER_IMAGE_POS[1],
      counterImageCoords.sWidth,
      counterImageCoords.sHeight);
  }

  if (DEBUG_PHYSICS) {
    ctx.strokeStyle = "#FF0000";
    ctx.strokeRect(stateData.paddleAABB.x, stateData.paddleAABB.y, stateData.paddleAABB.width, stateData.paddleAABB.height);
    ctx.strokeRect(stateData.ballAABB.x, stateData.ballAABB.y, stateData.ballAABB.width, stateData.ballAABB.height);

    stateData.levelBlocks.forEach(function(block){
      if (!block.dead) {
        ctx.strokeRect(block.aabb.x, block.aabb.y, block.aabb.width, block.aabb.height);
      }
    });
  }
}

function initStartState(gameState, dt) {
  const stateData = gameState.stateData;
  var i, j;

  if (stateData.level > stateData.winLevel) {
    return gameState.currentState = GameState_WIN;
  }

  stateData.levelStartTimeout = 2999;
  stateData.paddlePosition = gameState.canvasSize.width / 2;
  gameState.inputManager.mousePosition[0] = stateData.paddlePosition;
  stateData.ballAnimationFrame = 0;
  stateData.ballAnimationCounter = 0;
  stateData.ballVelocity = [BALL_INITIAL_VELOCITY, BALL_INITIAL_VELOCITY];
  stateData.ballPosition = [BALL_INITIAL_POS[0], BALL_INITIAL_POS[1]];
  stateData.paddleAABB = {
    x: -1,
    y: -1,
    width: -1,
    height: -1
  };
  stateData.paddleAABB.x = stateData.paddlePosition - PADDLE_BOUNDS[0] / 2;
  stateData.paddleAABB.y = PADDLE_V_OFFSET - PADDLE_BOUNDS[1] / 2;
  stateData.paddleAABB.width = PADDLE_BOUNDS[0];
  stateData.paddleAABB.height = PADDLE_BOUNDS[1];

  stateData.ballAABB = {
    x: -1,
    y: -1,
    width: -1,
    height: -1
  };
  stateData.ballAABB.x = stateData.ballPosition[0] - BALL_RADIUS;
  stateData.ballAABB.y = stateData.ballPosition[1] - BALL_RADIUS;
  stateData.ballAABB.width = BALL_DIAMETER;
  stateData.ballAABB.height = BALL_DIAMETER;

  // setup blocks
  if (countLiveBlocks(stateData.levelBlocks) == 0) {
    stateData.levelBlocks = [];
    // load level blocks
    var level = LEVELS[stateData.level - 1];
    for (i = 0; i < level.length; ++i) {
      var row = level[i];
      for (j = 0; j < row.length; ++j) {
        var blockColor = row[j];
        var x = BLOCK_WIDTH * j + BLOCK_X_OFFSET;
        var y = BLOCK_HEIGHT * i + BLOCK_Y_OFFSET;
        if (blockColor !== undefined) {
          stateData.levelBlocks.push(new Block([x, y], blockColor));
        }
      }
    }
  }
}

GameState_GAME = {
  init: function(gameState, dt) {
    const stateData = gameState.stateData;
    stateData.lives = 3;
    stateData.score = 0;
    stateData.level = 1;
    stateData.winLevel = 3;
    stateData.levelBlocks = [];
    initStartState(gameState, dt);
  },
  updateRender: function(gameState, dt) {
    const simDt = dt / SIM_FACTOR;
    var i;
    for (i = 0; i < SIM_FACTOR; ++i) {
      update(gameState, simDt);
    }
    render(gameState, dt);
  }
};
