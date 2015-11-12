(function($P){
	'use strict';

	$P.Frame = $P.defineClass(
		$P.Shape.Rectangle,
		function Frame(config) {
			if (!(this instanceof Frame)) {return new Frame(config);}

			config.fillStyle = config.fillStyle || '#fff';
			config.w = config.w || 500;
			config.h = config.h || 500;
			config.cornerRadius = config.cornerRadius || 12;
			if (undefined === config.lineWidth) {config.lineWidth = 6;}
			if (undefined !== config.resizeWidth) {this.resizeWidth = config.resizeWidth;}

			var parent = config.parent;
			config.parent = null;
			$P.Shape.Rectangle.call(this, config);

			this.minSize = config.minSize || {w: 100, h: 100};
			if ('current' === this.minSize) {
				this.minSize = {w: this.w, h: this.h};};

			if (parent) {parent.add(this);}
			return this;},
		{
			receiveEvent: function(event) {
				var result;
				result = $P.Object2D.prototype.receiveEvent.call(this, event);
				if (result) {return result;}
				return this.mousemove(event) || this.mousedown(event);},

			/**
			 * Handle the mousemove event.
			 * @param {*} event - The actual event.
			 * @returns {boolean} - if the event should stop propagating
			 */
			mousemove: function(event) {
				var direction, cursor;
				if (event.name !== 'mousemove') {return false;}

				if (this.contains(event.x, event.y)) {return false;}

				direction = this.getResizeDirection(event.x, event.y);
				if (direction && this.expandedContains(event.x, event.y, this.resizeWidth || this.lineWidth)) {
					cursor = direction + '-resize';
					$P.state.mainCanvas.setCursor(cursor);
					return true;}

				return false;},

			/**
			 * Handle the mousedown event.
			 * @param {*} event - The actual event.
			 * @returns {boolean} - if the event should stop propagating
			 */
			mousedown: function(event) {
				var x, y;
				if ('mousedown' !== event.name) {return false;}
				x = event.x;
				y = event.y;

				if (this.expandedContains(x, y, -this.lineWidth)) {
					return true;}
				else if (this.contains(x, y)) {
					this.parent.bringToFront && this.parent.bringToFront();
					$P.state.mainCanvas.beginDrag(this.parent, x, y);
					return true;}
				else if (this.expandedContains(x, y, this.lineWidth)) {
					$P.state.mainCanvas.beginResize(this, this.getResizeDirection(x, y), x, y);
					return true;}

				return false;},

			/**
			 * For the given coordinates, which direction would we be resizing in?
			 * @param {number} x - the x coordinate
			 * @param {number} y - the y coordinate
			 * @returns {?String} - A direction string, like 'nw', or null for
			 * an invalid or unknown position. You should be able to append
			 * '-resize' to the string to get a valid cursor style.
			 */
			getResizeDirection: function(x, y) {
				var xl = this.x,
						xr = xl + this.w,
						yt = this.y,
						yb = yt + this.h;
				if (xl - x + yt - y > -this.lineWidth) {return 'nw';}
				if (x - xr + yt - y > -this.lineWidth) {return 'ne';}
				if (xl - x + y - yb > -this.lineWidth) {return 'sw';}
				if (x - xr + y - yb > -this.lineWidth) {return 'se';}
				if (x <= xl) {return 'w';}
				if (x >= xr) {return 'e';}
				if (y <= yt) {return 'n';}
				if (y >= yb) {return 's';}
				return null;},

			/**
			 * Resizes this object.
			 * @param {string} direction - the edge we're resizing from.
			 * @param {number} dx - the amount to alter the size by in the x direction
			 * @param {number} dy - the amount to alter the size by in the y direction
			 * @returns - the {l, r, t, b} that was unused.
			 */
			resize: function(direction, dx, dy) {
				var l = 0, r = 0, t = 0, b = 0,
						newW, newH, multW = 1, multH = 1;
				if (direction.indexOf('w') != -1) {
					l = -dx;}
				if (direction.indexOf('e') != -1) {
					r = dx;}
				if (direction.indexOf('n') != -1) {t = -dy;}
				if (direction.indexOf('s') != -1) {b = dy;}

				if (this.minSize && this.minSize.w) {
					newW = this.w + l + r;
					if (newW < this.minSize.w) {
						multW = (this.minSize.w - this.w) / (l + r);}}

				if (this.minSize && this.minSize.h) {
					newH = this.h + t + b;
					if (newH < this.minSize.h) {
						multH = (this.minSize.h - this.h) / (t + b);}}

				this.expandEdges(r * multW, t * multH, l * multW, b * multH);

				return {
					l: l * (1 - multW),
					r: r * (1 - multW),
					t: t * (1 - multH),
					b: b * (1 - multH)};},

			saveKeys: [
				'x', 'y', 'w', 'h',
				'strokeStyle', 'fillStyle',
				'cornerRadius', 'lineWidth',
				'minSize']
		});

})(PATHBUBBLES);
