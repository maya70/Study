(function($P){
	'use strict';

	$P.Bubble.Force = $P.defineClass(
		$P.Bubble,
		function ForceBubble(config) {
			var self = this;
			config.closeMenu = true;
			config.groupMenu = true;
			$P.BubbleBase.call(this, config);

			self.mode = config.mode || 'soup';
			self.pathways = config.pathways || [];

			self.contentConfig = config.contentConfig || {};
			self.contentConfig.pathways = self.pathways.slice();

			self.add($P.ActionButton.create({
				name: 'switch',
				text: 'S',
				action: function(canvas, x, y) {
					self.mode = 'split' === self.mode ? 'soup' : 'split';
					if ('split' === self.mode) {self.content.layoutSplit();}
					if ('soup' === self.mode) {self.content.layoutSoup();}
					self.content.updateSvgPosition();}}));

			self.add($P.ActionButton.create({
				name: 'export',
				text: 'E',
				action: self.exportImage.bind(self)}));

			self.repositionMenus();},
		{
			onAdded: function(parent) {
				$P.BubbleBase.prototype.onAdded.call(this, parent);
				this.ensureContent();},

			ensureContent: function() {
				var self = this;
				var config;
				if (!this.content) {
					config = this.contentConfig || {};
					config.parent = this;
					config.mode = this.mode;
					config = $.extend(config, this.getInteriorDimensions());
					this.content = new $P.Bubble.ForceContent(config);
				}},

			addPathway: function(pathway, i) {
				var self = this;
				var pw;
				if(i > 0) // create a new pathway after the first one
				{
					pw = {		name: 'dragPathway',
								ignore_xy: true,
								pathwayName: pathway.name,
								symbols: pathway.symbols,
								strokeStyle: self.parent.strokeStyle
								 };
					pw.pathwayId =  pathway.pathwayId;
					pw.expression = pathway.expression;
					pw.expression.pathwayId = pathway.expression.pathwayId;
					pw.name = pathway.pathwayName;
					pw.id = pathway.pathwayId;
					var colors = $P.BubbleBase.colors.slice(0), color, p;
					for (p in self.pathways) {
						$P.removeFromList(colors, self.pathways[p].color);}
					if (0 === colors.length) {
						pw.color = '#666';}
					else if (-1 !== colors.indexOf(pathway.strokeStyle)) {
						pw.color = pathway.strokeStyle;}
					else {
						pw.color = colors[0];} //}

					this.pathways.push(pw);

					if (this.content) {
						this.content.addPathway(pw, this.mode);}

				 }
				 else{
				// Strip active colors.
				//if (undefined === pathway.color) {
					var colors = $P.BubbleBase.colors.slice(i), color, p;
					for (p in self.pathways) {
						$P.removeFromList(colors, self.pathways[p].color);}
					if (0 === colors.length) {
						pathway.color = '#666';}
					else if (-1 !== colors.indexOf(pathway.strokeStyle)) {
						pathway.color = pathway.strokeStyle;}
					else {
						pathway.color = colors[0];} //}

				this.pathways.push(pathway);

				if (this.content) {
					this.content.addPathway(pathway, this.mode);}
					}

					},

			receiveEvent: function(event) {
				var result;
				var N = 3;
				if ('dragPathway' == event.name && (this.contains(event.x, event.y) || event.ignore_xy)) {
					if (!this.name) {this.name = event.pathwayName;}
					else {this.name = 'Split Force Diagram';}
					event.name = event.pathwayName;
					event.id = event.pathwayId;
					for( var i=0; i < N; i++)
					{
						this.addPathway(event, i);
					}
					this.content.layout.force.start();
					return {target: this, addLink: {color: this.content.getPathwayColor(event)},
									name: 'addedPathway', pathwayId: event.pathwayId};}

				result = $P.Bubble.prototype.receiveEvent.call(this, event);
				if (result) {return result;}

				return false;},

			onDelete: function() {
				$P.Bubble.prototype.onDelete.call(this);
				if (this.content) {
					this.content.layout.force.stop();}},

			onSearch: function(key) {
				return this.content.onSearch(key);},

			zoomTo: function(entity) {
			  return this.content.zoomTo(entity);},

			exportImage: function() {
				if (!this.content) {return;}
				$P.Image.Svg(this.content.svg[0][0]).saveToSvg('bubble.svg');},

			saveCallback: function(save, id) {
				var self = this;
				var result = {};
				save.objects[id] = result;

				$P.Bubble.prototype.saveKeys.forEach(function(key) {
					result[key] = save.save(self[key]);});

				result.mode = save.save(self.mode);
				result.pathways = save.save(self.pathways);
				result.contentConfig = save.save(self.content);

				return id;},


			saveKeys: [].concat($P.Bubble.prototype.saveKeys, [
				'mode', 'pathways', 'contentConfig'])
		});

	$P.Bubble.Force.loader = function(load, id, data) {
		var config = {};
		$P.Bubble.Force.prototype.saveKeys.forEach(function(key) {
			config[key] = load.loadObject(data[key]);});

		return new $P.Bubble.Force(config);};

})(PATHBUBBLES);
