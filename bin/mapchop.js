#! /usr/local/bin/node

var im = require('imagemagick'),
    parser = require('nomnom'),
    path = require('path'),
    fs = require('fs-extra');

var originalMap,
    tileDir = path.resolve(process.cwd(), path.normalize('tiles')),
    tileSize = 256;

var opts = parser
  .option('input', {
    abbr: 'i',
    help: 'Specify original image to cut',
    required: true,
    callback: function(i) {
      originalMap = path.resolve(process.cwd(), path.normalize(i));
    }
  }).option('tileSize', {
    abbr: 't',
    default: 256,
    help: 'Tile size in pixels',
    required: true,
    callback: function(t) {
      tileSize = t;
    }
  }).option('tileDir', {
    abbr: 'o',
    default: path.resolve(process.cwd(), path.normalize('tiles')),
    help: 'Directory to save tiles in',
    required: true,
    callback: function(o) {
      tileDir = path.resolve(process.cwd(), path.normalize(o));
    }
  }).parse();

console.log("Tile Size set to " + tileSize);
console.log("Tile Directory set to " + tileDir);

im.identify(originalMap, function(err, features) {
  if (err) 
    throw err;

  // Get image size
  var imageWidth = features.width;
  var imageHeight = features.height;

  if (imageWidth % tileSize != 0 || imageHeight % tileSize != 0) {
    console.log("Error: image height and width must be multiples of tile size.");
    return;
  }

  var smallestSide = Math.min(imageWidth, imageHeight);
  var n = smallestSide; // get zoom levels based on tile size
  var steps = 0;
  
  while (n > tileSize) {
    n = n / 2;
    steps++;
  }

  // make tile directory
  fs.mkdir(tileDir, function(err) {
    if (err)
      throw err;

    var zoom = 1; // for each zoom level, scale the original and cut the tiles
    
    for (var scaleFactor = steps; scaleFactor >= 0; scaleFactor--) {
      cutZoomLevel(zoom, scaleFactor, imageWidth, imageHeight);
      zoom++;
    }
  });
});


function cutZoomLevel(zoom, scaleFactor, imageWidth, imageHeight) {

  // get the temp image size based on the zoom factor
  var newImageWidth = imageWidth * Math.pow(.5, scaleFactor);
  var newImageHeight = imageHeight * Math.pow(.5, scaleFactor);

  var zoomDir = path.resolve(tileDir, path.normalize(zoom.toString()));

  // make the zoom level directory
  fs.mkdir(zoomDir, function(err) {

    if (err) throw err;

    var imageSize = newImageWidth + "x" + newImageHeight + "!";

    // create temp image to cut tiles from
    var imageToCut = zoomDir + '/zoom_' + zoom.toString() + '.png';

    im.convert([originalMap, '-resize', imageSize, imageToCut], function(err, stdout) {

      if (err)
        throw err;

      im.convert(['-crop', tileSize + 'x' + tileSize, '+repage', imageToCut, zoomDir + '/tiles_%d.png'], function(err, stdout) {

        if (err)
          throw err;

        // count the total number of tiles in this zoom level
        var totalTiles = (newImageWidth / tileSize) * (newImageHeight / tileSize);

        // count the total number of columns in this zoom level
        var totalColumns = newImageWidth / tileSize;

        var row = 0;
        var column = 0;

        // rename each tile based on column and row
        for (var n = 0; n < totalTiles; n++) {
          var filename = zoomDir + "/tiles_" + n + ".png";
          var target = zoomDir + "/map_" + column + "_" + row + ".png";

          fs.rename(filename, target, function(err, data) {
            if (err) throw err;
          });

          column++;
          if (column >= totalColumns) {
            column = 0;
            row++;
          }
        }
        // remove temp image
        fs.remove(imageToCut, function(err) {
          if (err) throw err;
        });
      });
    });
  });
}
