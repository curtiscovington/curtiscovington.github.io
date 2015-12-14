class Sprite {
	constructor(img, pos, size, speed, frames, once) {
		this.img = img;
		this.pos = pos;
		this.size = size;
		this.speed = speed;
		this.frames = frames;
		this.once = once;
		this.index = 0;
	}

	update(dt) {
		this.index += this.speed * dt;
	}

	render(ctx, pos) {
		var frame;
		if (this.speed > 0) {
			var max = this.frames.length;
			var index = Math.floor(this.index);
			frame = this.frames[index % max];

			if (this.once && index >= max) {
				this.done = true;
				return;
			}
		} else {
			frame = 0;
		}


		var w = this.size.width;
		var h = this.size.height;

		var x = this.pos.x * w;
		var y = this.pos.y * h;


		x += frame * w;

		ctx.drawImage(resources.get(this.img), x, y, w, h, pos.x, pos.y, w, h);
	}
}