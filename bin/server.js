#! /usr/local/bin/node

var im 		= require('imagemagick'),
	parser	= require('nomnom'),
	path	= require('path'),
	fs 		= require('fs-extra');

var original_map;
var tile_size = 256;
var tile_dir = path.resolve(process.cwd(),path.normalize('tiles'));

var opts = parser
	.option('input', {
		abbr: 'i',
		help: 'Specify original image to cut',
		callback: function(i) {
			original_map = path.resolve(process.cwd(),path.normalize(i));
		}
	}).option('tile_size', {
		abbr: 't',
		help: 'Tile size in pixels',
		callback: function(t) {
			tile_size = t;
		}
	}).option('tile_dir', {
		abbr: 'o',
		help: 'Directory to save tiles in',
		callback: function(o) {
			tile_dir = path.resolve(process.cwd(),path.normalize(o));
		}
	}).parse();

console.log("tile_size: "+tile_size);
console.log("tile_dir: "+tile_dir);

im.identify(original_map, function(err, features){
	if (err) throw err;
	
	// Get image size
	var image_width = features.width;
	var image_height = features.height;
	
	if ( image_width % tile_size != 0 || image_height % tile_size != 0) {
		console.log("Error: image height and width must be multiples of tile size.");
		return;
	}
	
	var smallest_side = Math.min(image_width,image_height);
	
	// get zoom levels based on tile size
	var n = smallest_side;
	var steps = 0;
	while ( n > tile_size ) {
		n = n / 2;
		steps++;
	}
	
	// make tile directory
	fs.mkdir(tile_dir, function (err) {
	    if (err) throw err;
		
		// for each zoom level, scale the original and cut the tiles
		var zoom = 1;
		for (var scale_factor = steps; scale_factor >= 0; scale_factor--) {
			
			cutZoomLevel(zoom,scale_factor,image_width,image_height);
			zoom++;
		}
		
	});

});


function cutZoomLevel(zoom,scale_factor,image_width,image_height) {
	
	// get the temp image size based on the zoom factor
	var new_image_width = image_width * Math.pow(.5,scale_factor);
	var new_image_height = image_height * Math.pow(.5,scale_factor);
	
	var zoom_dir = path.resolve(tile_dir,path.normalize(zoom.toString()));
	
	// make the zoom level directory
	fs.mkdir(zoom_dir, function (err) {
		
	    if (err) throw err;
	
		var image_size = new_image_width + "x" + new_image_height + "!";
		
		// create temp image to cut tiles from
		var image_to_cut = zoom_dir+'/zoom_'+zoom.toString()+'.png';
		
		im.convert([original_map, '-resize', image_size, image_to_cut], function (err, stdout) {

			if (err) throw err;
			
			im.convert(['-crop', tile_size+'x'+tile_size, '+repage', image_to_cut, zoom_dir+'/tiles_%d.png'], function (err, stdout) {

				if (err) throw err;
				
				// count the total number of tiles in this zoom level
				var total_tiles = (new_image_width/tile_size)*(new_image_height/tile_size);

				// count the total number of columns in this zoom level
				var total_columns = new_image_width/tile_size;

				var row = 0;
				var column = 0;

				// rename each tile based on column and row
				for ( var n = 0; n < total_tiles; n++) { 
					
					var filename = zoom_dir+"/tiles_"+n+".png";
					
					var target = zoom_dir+"/map_"+column+"_"+row+".png";
					
					fs.rename(filename, target, function (err, data) {
					    if (err) throw err;
					});

					column++;
					if (column >= total_columns) {
						column = 0;
						row++;
					}
					
				}
				
				// remove temp image
				fs.remove(image_to_cut, function (err) {
					if (err) throw err;
				});
			
			});

		});
		
	});
}


