var jsdom = require ('jsdom');

module .exports = (new jsdom .JSDOM ()) .window;
