(function() {
var Game = {};

var start = null;
var fps = null;


document.addEventListener("DOMContentLoaded", function(event) { 
	resources.load([
		'img/tree.png',
		'img/house.png',
		'img/man.png',
		'img/ground.png',
		]);
		resources.onReady(init);
		// init();
});

function init () {
	Game.canvas = document.getElementById("game");
	Game.canvas.width = window.innerWidth;
	Game.canvas.height = window.innerHeight;
	var ctx = Game.canvas.getContext("2d");

	Game.ground = ctx.createPattern(resources.get('img/ground.png'), 'repeat');

	Game.isRunning = true;
	Game.isPaused = false;
	console.log("start");
	Game.lastFrameTs = 0;
	Game.maxFPS = 60;
	// ticksStart = Date.now();
	Game.entities = [];//new EntityList();

	var treeSprites = [];
	treeSprites.push(new Sprite('img/tree.png', {x: 4, y: 0}, {width: 32, height: 32}));
	treeSprites.push(new Sprite('img/tree.png', {x: 3, y: 0}, {width: 32, height: 32}));
	treeSprites.push(new Sprite('img/tree.png', {x: 2, y: 0}, {width: 32, height: 32}));
	treeSprites.push(new Sprite('img/tree.png', {x: 1, y: 0}, {width: 32, height: 32}));
	treeSprites.push(new Sprite('img/tree.png', {x: 0, y: 0}, {width: 32, height: 32}));

	var houseSprite = new Sprite('img/house.png', {x: 0, y: 0}, {width: 32, height: 32}, .005, [0, 1, 2, 3], false);

	var manSprite = new Sprite('img/man.png', {x: 0, y: 0}, {width: 16, height: 16}, .001, [0, 1], false);
	for (var i = 0; i < 20; i++) {
		var x = Math.random() * Game.canvas.width;
		var y = Math.random() * Game.canvas.height;
		Game.entities.push(new Tree({x: x, y: y}, treeSprites));
	}
	Game.entities.push(new Entity({x: 64, y: 64}, houseSprite));
	Game.entities.push(new Man({x: 64+32-5, y: 64+64+5}, manSprite));
	console.log(Game.entities);
	requestAnimationFrame(loop);


}

function loop(ts) {
	if (!start) start = ts;
	var progress = ts - start;
	if (ts < Game.lastFrameTs + (1000 / Game.maxFPS)) {
		requestAnimationFrame(loop);
		return;
	}
	var dt = ts - Game.lastFrameTs;
	fps = 1000 / dt;

	update(dt);
	render();
	Game.lastFrameTs = ts;
	
	drawText(fps, {x: 10, y: 10});
	// c = Game.canvas;
	requestAnimationFrame(loop);
	
}

function update(dt) {
	for (var i = 0; i < Game.entities.length; i++) {
		Game.entities[i].update(dt);
	}
}

function render() {
	Game.canvas.width = window.innerWidth;
	Game.canvas.height = window.innerHeight;
	var ctx = Game.canvas.getContext('2d');
	clear(ctx);

	for (var i = 0; i < Game.entities.length; i++) {
		Game.entities[i].render(ctx);
	}
}
function clear(ctx) {
	ctx.fillStyle = Game.ground;
    ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
}



function drawText (txt, pos, font, color) {
	var ctx = Game.canvas.getContext('2d');
	ctx.font = typeof font !== "undefined" ? font : "12px serif";
	ctx.fillStyle = typeof color !== "undefined" ? color : "black";
	ctx.fillText(txt, pos.x, pos.y);
}
})();