MapChop [![Dependency Status](https://gemnasium.com/RP3Agency/MapChop.png)](https://gemnasium.com/RP3Agency/MapChop)
=======
A node.js script to handle breaking image maps into tile-based images for use in mapping applications.

Installation
------------
```
$ [sudo] npm install mapchop -g
```

Usage
-----
```
Usage: /usr/local/bin/node mapchop [options]

Options:
   -i, --input      Specify original image to cut
   -t, --tileSize   Tile size in pixels  [default: 256]
   -o, --tileDir    Directory to save tiles in [default: {currentDirectory}/tiles]
```

Output
------
Under ```tileDir```, directories should be created, containing the map broken into square segments. From 1-5, the images should represent smaller and smaller portions of the original map.  It's then possible to plug in the tiles to a mapping solutions, such as [Leaflet](http://leafletjs.com/).