//////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////// Image Processor //////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
var getPixels = require("get-pixels");

// Resizes the given buffer image to half of it's size
function halfImage(img, inSize) {
	var halfSize = inSize/2;
	var halfimg = new Array(halfSize*halfSize*3);
	for(var i=0; i<halfSize; i++) {
		for(var j=0; j<halfSize; j++) {
			var red = 0;
			var green = 0;
			var blue = 0;
			for(var x=i*2; x<(i+1)*2; x++) {
				for(var y=j*2; y<(j+1)*2; y++) {
					red += img[((y*inSize)+x)*3 + 0];
					green +=img[((y*inSize)+x)*3 + 1];
					blue += img[((y*inSize)+x)*3 + 2];
				}
			}
			halfimg[((j*halfSize)+i)*3 + 0] = red/4;
			halfimg[((j*halfSize)+i)*3 + 1] = green/4;
			halfimg[((j*halfSize)+i)*3 + 2] = blue/4;
		}
	}
	return halfimg;
}

// Down samples the given image to a size of 32 by 32
function shrinkImage32x32(ndarray) {
	var img = new Array(32*32*3);
	var width = ndarray.shape.slice()[0];
	var height = ndarray.shape.slice()[1];
	
	//clip the width or height to get a square image
	var widthOffset = 0;
	var heightOffset = 0;
	var square = width;
	if(width > height) {
		square = height;
		widthOffset = (width-height)/2;
	} else if (width < height) { 
		square = width;
		heightOffset = (height-width)/2;
	}
	
	//use a simple box filter to downsample to 32 by 32
	for(var i=0; i<32; i++) {
		for(var j=0; j<32; j++) {
			var startX = Math.round((i/32)*square + widthOffset);
			var endX = Math.round(((i+1)/32)*square + widthOffset);
			var startY = Math.round((j/32)*square + heightOffset);
			var endY = Math.round(((j+1)/32)*square + heightOffset);
			
			var red = 0;
			var green = 0;
			var blue = 0;
			for(var x=startX; x<endX; x++) {
				for(var y=startY; y<endY; y++) {
					red+=ndarray.get(x,y,0);
					green+=ndarray.get(x,y,1);
					blue+=ndarray.get(x,y,2);
				}
			}
			var count = (endX-startX)*(endY-startY);
			img[((j*32)+i)*3 + 0] = Math.round(red/count);
			img[((j*32)+i)*3 + 1] = Math.round(green/count);
			img[((j*32)+i)*3 + 2] = Math.round(blue/count);
		}
	}
	
	return img;
}

// Get object with icon pixels for given image
function getIcon32(url, callback) {
	getPixels(url, function(err, pixels) {
		if(err) {
			callback();
		} else {
			callback(shrinkImage32x32(pixels));
		}
	});
};

// Return ImageProcessor
var ImageProcessor = function () {};
ImageProcessor.prototype.getIcon32 = function(url, callback) {
	getIcon32(url, callback);
};
ImageProcessor.prototype.getIcon16 = function(url, callback) {
	getIcon32(url, function(img) {
		if(img) {
			var img16 = halfImage(img, 32);
			callback(img16);
		}
	});
};
ImageProcessor.prototype.getIcon8 = function(url, callback) {
	getIcon32(url, function(img) {
		if(img) {
			var img16 = halfImage(img, 32);
			var img8 = halfImage(img16, 16);
			callback(img8);
		}
	});
};
ImageProcessor.prototype.halfImage = function(img, inSize) {
	return halfImage(img, inSize);
};
module.exports = new ImageProcessor();
