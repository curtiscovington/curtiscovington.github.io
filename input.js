Input = (function() {
	var keys = {};
	// for (var i = 0;)
	window.onkeydown = function (evt) {
		keys[evt.which] = true;
	}
	window.onkeyup = function (evt) {
		keys[evt.which] = false;
	}

	return class Input {
		static get left() {
			return 37;
		}
		static get up() {
			return 38;
		}
		static get right() {
			return 39;
		}
		static get down() {
			return 40;
		}
		static isDown(key) {
			if (typeof keys[key] === "undefined") return false;
			return keys[key];
		}
	}
})();