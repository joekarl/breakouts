function ImageManager() {
  this.images = {};
}

/**
 * callback will called with a load error if failed to load
 */
ImageManager.prototype.loadImage = function(path, cb){
  const imageOnload = function(err) {
    if (this.width + this.height == 0) {
      cb('Failed to load image(' + path + ')');
    } else {
      cb();
    }
  };
  const image = new Image();
  image.src = path;
  image.addEventListener('error', imageOnload.bind(image));
  image.addEventListener('load', imageOnload.bind(image));
  this.images[path] = image;
};

/**
 * callback will be called with an array of load errors if failed to load
 */
ImageManager.prototype.loadAllImages = function(paths, cb){
  var loadCounter = paths.length;
  var errors = new Array();
  paths.forEach(function(path){
    this.loadImage(path, function(error) {
      if (error) {
        errors.push(error);
      }
      loadCounter--;
      if (loadCounter == 0) {
        errors = errors.length > 0 ? errors : undefined;
        cb(errors);
      }
    });
  }.bind(this));
};

/**
 * returns an image if available
 */
ImageManager.prototype.getImage = function(path){
  return this.images[path];
};
