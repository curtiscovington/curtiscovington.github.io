class Vector2d {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static down() {
		return new Vector2d(0, 1);
	}

	static up() {
		return new Vector2d(0, -1);
	}

	static left() {
		return new Vector2d(-1, 0);
	}

	static right() {
		return new Vector2d(1, 0);
	}

	static zero() {
		return new Vector2d(0, 0);
	}

	/**
	*	Creates a new Vector from a magnitude and angle
	*	@param {Number} m - the magnitude
	*	@param {Number} a - the angle in radians
	* 	@returns {Vector2d}
	*/
	static fromAngle(m, a) {
		return new Vector2d(m * Math.cos(a), m * Math.sin(a));
	}

	/**
	*	Adds a vector to this vector
	*	@param {Vector2d} v - The vector to add
	*	@returns {Vector2d} the resulting vector
	*/
	add(v) {
		return new Vector2d(this.x + v.x, this.y + v.y);
	}

	/**
	*	Subtracts a vector from this vector
	*	@param {Vector2d} v - The vector to subtract
	*	@returns {Vector2d} the resulting vector
	*/
	sub(v) {
		return new Vector2d(this.x - v.x, this.y - v.y);
	}

	/**
	*	Multiplies a vector
	*	@param {Vector2d} v - The vector to multiply
	*	@returns {Vector2d} the resulting vector
	*/
	multiply(v) {
		return new Vector2d(this.x * v.x, this.y * v.y);
	}

	/**
	*	Divides a vector
	*	@param {Vector2d} v - The vector to divide
	*	@returns {Vector2d} the resulting vector
	*/
	divide(v) {
		return new Vector2d(this.x / v.x, this.y / v.y);
	}

	/**
	*	Performs the dot product operation
	*	@param {Vector2d} v - The vector to dot
	*	@returns {Number} the scalar quantity
	*/
	dot(v) {
		return (this.x * v.x) + (this.y * v.y);
	}

	/**
	*	Finds the length of a vector aka the magnitude	
	*	@returns {Number} the length of the vector
	*/
	length() {
		// Pythagorean theorm
		return Math.sqrt(this.dot(this));
	}

	/**
	*	Normalizes the vector
	*	@returns {Vector2d} the unit vector
	*/
	normalize() {
		var l = this.length();
		return new Vector2d(this.x / l, this.y / l);
	}

	/**
	*	Finds the angle to a vector
	*	@param {Vector2d} v
	* 	@returns {Number} the angle in radians
	*/
	angle(v) {
		return Math.acos(this.dot(v) / (this.length() * v.length()));
	}
}