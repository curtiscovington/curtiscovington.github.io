Entity = (function () {
	var count = 0;
	return class Entity {
	
		constructor(pos, s) {
			this.pos = pos;
			this.sprite = s;
			//this.sprite = s;
			this.id = count++;
		}

		update(dt) {
			this.sprite.update(dt);
		}

		render(ctx) {
			this.sprite.render(ctx, this.pos);
		}
	}
})();

class Tree extends Entity {
	constructor(pos, s) {
		super(pos, s[0]);
		this.spriteList = s;
		this.minSize = 5;
		this.maxSize = 32;
		this.currentSize = 0;
		this.t = 0;

		this.growTime = (Math.random() * (25 - 5) + 5) * 1000;
	}

	update(dt) {
		super.update(dt);
		this.t += dt;

		if (this.t > this.growTime) {
			this.t = 0;

			if (this.currentSize + 1 < this.spriteList.length) {
				this.currentSize++;
				this.sprite = this.spriteList[this.currentSize];
			}
			
		}
	}
}

class Man extends Entity {
	constructor(pos, s) {
		super(pos, s);
		this.t = 0;
		this.a = .001;
		this.velocity = 1;
		this.maxVelocity = 1;
		var x = Math.random() * 100;
		var y = Math.random() * 100;
		this.goal = {x: x, y: y};

		//this.dir = Vector2d.down();
	}

	distance(p1, p2) {
		var d = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
		// console.log(d);
		return d;
	}

	slope(p1,p2) {
		var a = (p2.y - p1.y);
		var b = (p2.x - p1.x);

		if (b === 0) {
			return false;
		}

		return  a / b;
	}

	angle(p1, p2) {
		var s = this.slope(p1, p2);
		if (s === false) {
			return false;
		}

		return Math.atan(s);
	}

	update(dt) {
		super.update(dt);
		this.t += dt;

		if (Input.isDown(Input.left)) {
			this.pos.x--;
		}
		if (Input.isDown(Input.right)) {
			this.pos.x++;
		}
		if (Input.isDown(Input.up)) {
			this.pos.y--;
		}
		if (Input.isDown(Input.down)) {
			this.pos.y++;
		}
		// this.pos.x += this.dir.x;
		// this.pos.y += this.dir.y;
		// if (this.distance(this.pos, this.goal) < 0.5) {
		// 	var x = Math.random() * 100;
		// 	var y = Math.random() * 100;
		// 	this.goal = {x: x, y: y};
		// } else {
		// 	// var a = this.angle(this.pos, this.goal);
		// 	// console.log(a);
		// 	var dir = {};
		// 	dir.x = this.goal.x - this.pos.x;
		// 	dir.y = this.goal.y - this.pos.y;
		// 	this.pos.x += this.a * dir.x * dt;
		// 	this.pos.y += this.a * dir.y * dt;
		// }
	}
}