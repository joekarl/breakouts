/**
 * Class to handle user input
 * Handles keyboard/mouse input
 * TODO(joekarl): handle accelerometer, touch for mobile
 */

const LEFT_KEYCODE = 37;
const RIGHT_KEYCODE = 39;

function InputManager(canvas) {
  this.keyState = new Array(128);
  this.mouseDown = false;
  this.canvas = canvas;
  this.mousePosition = [0, 0];
  window.addEventListener('keyup', function(event) { this.onKeyup(event); }.bind(this), false);
  window.addEventListener('keydown', function(event) { this.onKeydown(event); }.bind(this), false);
  window.addEventListener('mousemove', function(event) { this.onMousemove(event); }.bind(this), false);
  canvas.addEventListener('mousedown', function(event) { this.mouseDown = true; }.bind(this), false);
  canvas.addEventListener('mouseup', function(event) { this.mouseDown = false; }.bind(this), false);
  for (var i = 0; i < this.keyState.length; ++i) {
    this.keyState[i] = -1;
  }
}

InputManager.prototype.leftPressed = function() {
  return this.keyState[LEFT_KEYCODE] > 0;
};

InputManager.prototype.rightPressed = function() {
  return this.keyState[RIGHT_KEYCODE] > 0;
};

InputManager.prototype.isPressed = function(code) {
  return this.keyState[code] > 0;
};

InputManager.prototype.onKeyup = function(e) {
  this.keyState[e.keyCode] = -1;
};

InputManager.prototype.onKeydown = function(e) {
  this.keyState[e.keyCode] = new Date().getTime();
};

InputManager.prototype.isMouseDown = function() {
  return this.mouseDown;
};

InputManager.prototype.onMousemove = function(e) {
  const canvasBounds = this.canvas.getBoundingClientRect();
  var posx = 0;
  var posy = 0;
  if (!e) {
    var e = window.event;
  }
  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  }
  else if (e.clientX || e.clientY)   {
    posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  this.mousePosition = [posx - canvasBounds.left, posy - canvasBounds.top];
};
