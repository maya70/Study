(function($P){
	'use strict';

	$P.GraphForceView = $P.defineClass(
		$P.ForceView,
		function GraphForceView(config) {
			var nodes, links,
				self = this,
				textTransform;

			$P.ForceView.call(self, config);

			self.hiddenNodeTypes = {};
			self.highlights = {};
			self.notes = {};

			self.textTransform = self.shape.textTransform(self);

			if (config.displayArgument) {
				if ('graph' === config.displayArgument.type) {
					self.graph = config.displayArgument;}
				else if ('graphs' === config.displayArgument.type) {
					self.graphs = config.displayArgument.list;}}

			function nodeSize(target) {
				return function(d) {return target * 1.5;};
				return function(d) {
					var size = 1;
					if (d.componentNodes && d.componentNodes.length) {
						size = Math.pow(d.componentNodes.length, 0.4);}
					return target * size;};}
			self.nodeSize = nodeSize;

			function nodeTitle(d) {
				var title = d.name;
				if (d.componentNodes) {
					title = [d.name, ':'];
					d.componentNodes.forEach(function(node) {
						if (!node || !node.name) {return;}
						title.push('\n');
						title.push(node.name);});
					title = title.join('');}
				return title;}

			function entityFilter1(node) {
				if ('entity' !== node.klass) {return false;}
				//if (node.reactions && node.reactions.length > 0) {return true;}
				//if (node.componentNodes && $P.or(node.componentNodes, entityFilter1)) {return true;}
				//return false;}
				return true;}

			function diminishedEntityFilter(node) {
				return !self.visibleEntities.indexed[node.layoutId];}

			function entitylabelFilter(node) {
				if ('entitylabel' !== node.klass) {return false;}
				return self.visibleEntities.indexed['entity:'+node.id];}


			function locationFilter(node) {
				if ('location' !== node.klass) {return false;}
				return $P.or(self.visibleEntities, function(entity) {return entity.location === node.id;});}



			function isNodeVisible(node) {
				if (!node) {return false;}
				var id = node.layoutId;
				return self.visibleEntities.indexed[id]
					|| self.visibleEntitylabels.indexed[id]
					|| self.visibleLocations.indexed[id]
					|| self.diminishedEntities.indexed[id];}

			self.visibleEntities = self.layout.nodes.filter(entityFilter1);
			self.visibleEntities.indexed = $P.indexBy(self.visibleEntities, $P.getter('layoutId'));

	    	self.diminishedEntities = self.visibleEntities.filter(diminishedEntityFilter);
			self.diminishedEntities.indexed = $P.indexBy(self.diminishedEntities, $P.getter('layoutId'));

			self.visibleEntitylabels = self.layout.nodes.filter(entitylabelFilter);
			self.visibleEntitylabels.indexed = $P.indexBy(self.visibleEntitylabels, $P.getter('layoutId'));

			self.visibleLocations = self.layout.nodes.filter(locationFilter);
			self.visibleLocations.indexed = $P.indexBy(self.visibleLocations, $P.getter('layoutId'));

			self.visibleNodes = [].concat(self.visibleEntities, self.visibleEntitylabels, self.visibleLocations, self.diminishedEntities);

			self.visibleLinks = self.layout.links.filter(function(link) {
				//if (link.klass === 'entity:label') {console.log(link, link.source, link.target, isNodeVisible(link.source),  isNodeVisible(link.target));}
				return link.source && link.target && isNodeVisible(link.source) && isNodeVisible(link.target);});

			self.drawBackground = self.element.append('g').attr('class', 'layer').attr('pointer-events', 'none');

			function elementLayoutId(element) {return element.__data__.layoutId;}
			var rightclickNote = self.rightclickNote.bind(self);

			self.element.selectAll('.crosshair').append('circle').attr('class', 'crosshair')
				.attr('r', 40)
				.attr('fill', 'yellow')
				.style('opacity', '0');

			self.links = self.element.selectAll('.link').data(self.visibleLinks)
				.enter().append('g').attr('class', 'link');
			self.nodes = self.element.selectAll('.node').data(self.visibleNodes)
				.enter().append('g').attr('class', 'node');
			self.nodes.indexed = $P.indexBy(self.nodes[0], elementLayoutId);
			self.links.indexed = $P.indexBy(self.links, $P.getter('layoutId'));
			self.nodes.call(self.layout.drag);

			self.locations = self.nodes.filter(function(d, i) {return 'location' === d.klass;});
			self.locations.indexed = $P.indexBy(self.locations[0], elementLayoutId);
			self.locations.append('circle')
				.attr('stroke', 'black')
				.attr('fill', $P.getter('color'))
				.attr('r', 40)
				.on('dblclick', function(d) {
					self.setLocationCollapse(d, !self.display.collapsedLocations[d.id]);})
				.append('title').text(function(d) {return d.name;});
			self.locations.append('text')
				.style('font-size', '15px')
				.attr('fill', 'black')
				.attr('text-anchor', 'middle')
				.attr('transform', self.shape.textTransform(self))
				.text($P.getter('name'));

			self.linkBackgrounds();

			self.locationLinks = self.links.filter(
				function(d, i) {return 'entity:location' === d.klass;});
			self.locationLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 0.5)
				.attr('fill', 'none');

			self.entities = self.nodes.filter(function(d, i) {return 'entity' === d.klass;});
			self.entities.diminished = self.entities.filter(function(d, i) {
				return !self.inGraph(d);});
			self.entities.visible = self.entities.filter(function(d, i) {
				return self.inGraph(d);});

			self.entities.proteins = self.entities.filter(function(d, i) {
				var type = d.type && d.type.toLowerCase();
				return 'protein' == type;});
			self.entities.proteins.composite = self.entities.proteins.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.crosstalking = self.entities.proteins.filter(
				function(d, i) {return d.crosstalkCount > 1;});

			self.entities.small = self.entities.visible.filter(function(d, i) {
				return 'SmallMolecule' === d.type
					|| 'Rna' === d.type
					|| 'Dna' === d.type;});
			self.entities.complex = self.entities.visible.filter(
				function(d, i) {return 'Complex' == d.type;});
			self.entities.complex.composite = self.entities.complex.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.other = self.entities.visible.filter(
				function(d, i) {
					return 'Complex' !== d.type
						&& 'SmallMolecule' !== d.type
						&& 'Protein' !== d.type && 'protein' !== d.type;});

			// The big transparent background circles encoding location.
			self.entities.other.composite = self.entities.other.filter(
				function(d, i) {return d.componentNodes;});
			self.entities.proteins.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('follow-type', 'protein')
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.small.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.complex.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.other.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			self.entities.diminished.each(function(d, i) {
				var location = self.layout.getNode('location:'+d.location);
				if (location) {
					self.drawBackground.append('circle')
						.attr('class', 'follower')
						.attr('follow-id', d.layoutId)
						.attr('stroke', 'none')
						.attr('fill', location.color)
						.attr('fill-opacity', 0.25)
						.attr('pointer-events', 'none') // Can't click on them.
						.attr('r', 100);}});
			// Nodes in the pathway.
			// An extra box indicating crosstalk.
			 self.entityBackgrounds();
			// The main circle.
			self.entities.diminished
				.each($P.D3.Diminished.appender({
					size: nodeSize(14)}))
				.selectAll('.diminished-entity')
				.attr('pointer-events', 'all')
				.attr('transform', textTransform)
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						diminished: true,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.proteins.objects = {};
			self.entities.proteins
				.each($P.D3.Protein.appender({
					transform: textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.proteins.objects}))
				.selectAll('.protein')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.proteins.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';
				})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Small Molecules.
			self.entities.small.objects = {};
			self.entities.small
				.each($P.D3.Small.appender({
					transform: textTransform,
					size: nodeSize(14),
					fill: self.getExpressionColor.bind(self),
					collector: self.entities.small.objects}))
				.selectAll('.small')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			// Complex.
			self.entities.complex
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform + 'rotate(45)')
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);

			// Other
			self.entities.other
				.append('rect')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('width', nodeSize(10)).attr('height', nodeSize(10))
				.attr('x', nodeSize(-5)).attr('y', nodeSize(-5))
				.attr('transform', textTransform)
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);
			self.entities.complex.composite.selectAll('.component').data(function(d) {return d.componentNodes;}).enter()
				.append('circle')
				.attr('stroke', 'black')
				.attr('fill', self.getExpressionColor.bind(self))
				.attr('r', function(d, i) {return nodeSize(3)(d3.select(this.parentNode).datum());})
				.attr('transform', function(d, i) {
					var pd = d3.select(this.parentNode).datum();
					return 'rotate(' + (i * 360 / pd.componentNodes.length) + ')translate(' + nodeSize(8)(pd) + ')';})
				.attr('pointer-events', 'all')
				.on('click', function(d) {
					$P.state.scene.record({
						type: 'force-click',
						class: d.klass,
						id: d.layoutId,
						name: d.name,
						source: self.parentBubble});
					console.log(d);})
				.call(rightclickNote)
				.append('title').text(nodeTitle);

			self.entityLabels = self.nodes.filter(
				function(d, i) {return 'entitylabel' === d.klass;});
			self.entityLabels.append('text')
				.style('font-size', '12px')
				.attr('text-anchor', 'middle')
				.attr('fill', 'black')
				.attr('transform', self.shape.textTransform(self))
				.attr('pointer-events', 'none')
				.text($P.getter('name'));
			self.entityLabelLinks = self.links.filter(
				function(d, i) {return 'entity:label' === d.klass;});
			self.entityLabelLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.2)
				.attr('fill', 'none');
			self.entityEntityLinks = self.links.filter(
				function(d, i){return 'entity:entity' === d.klass; });
			self.entityEntityLinks.append('line')
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('stroke-opacity', 0.5)
				.attr('fill', 'none');


			if (self.graph) {
				self.root.each($P.D3.PathwayLabel.appender(
					{text: self.graph.name,
					 fill: self.graph.color,
					 view: self},
					function(label) {self.label = label;}));}
			else if (self.graphs) {
				var data = self.graphs.map(function(graph) {
					return {
						name: graph.name,
						color: graph.color};});
				self.labels = self.root.selectAll('.pathway-label').data(data).enter().append('g')
					.each($P.D3.PathwayLabel.appender(
						function(d, i) {return {
							element: this,
							view: self,
							text: d.name,
							fill: d.color,
							index: i};}));}

			// build selections of all follower nodes for a given node.s
			self.followerNodes = self.element.selectAll('.follower');



			// Highlighting
			function highlight(d, i) {
				self.highlights = self.layout.getAdjacentNodes(d, 3);
				self.updateNodes(self.nodes);
				self.updateLinks(self.links);
				self.layout.updateDisplay();}
			function unhighlight(d, i) {
				self.highlights = {};
				self.updateNodes(self.nodes);
				self.updateLinks(self.links);
				self.layout.updateDisplay();}


			self.entities //.selectAll('*')
				.on('mouseover', highlight)
				.on('mouseout', unhighlight);

			self.updateNodes(self.nodes);
			self.updateLinks(self.links);},
		{
			inGraph: function(node) {
				if (!this.graph && !this.graphs) {return true;}

				if ('entity' === node.klass) {
					if (!node.graphs) {return true;}
					function check(graph) {
						return node.graphs[parseInt(graph.id)];}
					if (this.graph && check(this.graph)) {return true;}
					if (this.graphs && this.graphs.some(check)) {return true;}
					return false;}

				else if ('reaction' === node.klass) {
					// TODE implement
					return true;}

				return false;},

			activeGraphs: function(component) {
				var graphs = [];
				if (!this.graph && !this.graphs) {return graphs;}

				if ('reaction:entity' === component.klass) {
					return this.activeGraphs(component.entity);}

				if ('entity' === component.klass) {
					if (!component.graphs) {return graphs;}
					if (this.graph && component.graphs[parseInt(this.graph.id)]) {
						graphs.push(this.graph);}
					if (this.graphs) {
						this.graphs.forEach(function(graph) {
							if (component.graphs[parseInt(graph.id)]) {
								graphs.push(graph);}});}}

				return graphs;},

			getExpression: function(node) {
				if (this.graph) {
					return this.graph.expression[node.name];}
				if (this.graphs) {
					return $P.or(this.graphs, function(graph) {
						return graph.expression[node.id];});}
				return null;},

			getExpressionColor: function(node) {
				var expression = this.getExpression(node);
				if ('up' === expression) {return '#f00';}
				if ('down' === expression) {return '#0f0';}
				return 'white';},
			onShapeChange: function() {
				var self = this;
				$P.ForceView.prototype.onShapeChange.call(self);
				if (self.label) {
					self.label.onShapeChange(self.shape);}
				if (self.labels) {
					self.labels.each(function(d, i) {
						d.manager.onShapeChange(self.shape);});}},

			delete: function() {
				$P.ForceView.prototype.delete.call(this);
				if (this.label) {this.label.remove();}
				if (this.labels) {this.labels.remove();}},

			linkBackgrounds: function() {},

			entityBackgrounds: function() {},

			makeReactionLinks: function() {
				this.reactionLinks.each($P.D3.ReactionLink.appender());},

			isNodeVisible: function(node, element) {
				var self = this,
						selection, follow, key;

				if (element) {
					selection = d3.select(element);
					node = node || selection.datum();
					follow = selection.attr('follow-id');
					if (follow) {
						return self.isNodeVisible(self.layout.getNode(follow));}}

				if ('entitylabel' === node.klass) {
					return self.isNodeVisible(self.layout.getNode('entity:' + node.id));}

				if (self.display.collapsedLocations[node.location]) {return false;}

				if ('location' === node.klass) {key = 'location';}
				//else if ('reaction' === node.klass) {key = 'reaction';}
				//else if ('paper' === node.klass) {key = 'paper';}
				else if (!this.inGraph(node)) {key = 'diminished';}
				else if ('protein' === node.type.toLowerCase()) {key = 'protein';}
				else if (-1 !== ['SmallMolecule','Rna','Dna'].indexOf(node.type)) {key = 'small';}
				else if ('Complex' === node.type) {key = 'complex';}
				else if ('entity' === node.klass) {key = 'other';}

				if (self.hiddenNodeTypes[key]) {return false;}

				return true;},

			onSearch: function(key) {
				var i, regex, results = {};

				this.searchKey = key;
				if (key) {
					regex = key.split('').join('.*');}

				$.each(this.entities.proteins.objects, function(layoutId, protein) {
					var d = protein.datum;
					var target = d.name || d.id || layoutId;
					protein.searchMatch = key && target.match(regex) || false;});

				this.nodes.each(function(node) {
					var target = '' + (node.name || node.id || node.layoutId);
					node.searchMatch = target.match(regex);
					if (['entity', 'reaction'].indexOf(node.klass) != -1
							&& node.searchMatch) {
						results[node.layoutId] = node;}});

				return results;},

			zoomTo: function(entity) {
				var scale = this.zoom.scale();
				var translate = [-scale * entity.x, -scale * entity.y];
				console.log(scale, translate);
				this.zoom.scale(scale).translate(translate);
				var crosshair = $(this.element).find('.crosshair');
				crosshair.css('x', entity.x);
				crosshair.css('y', entity.y);
				crosshair.fadeIn(150).fadeOut(150);
				this.onZoom();},

			updateNodes: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					return self.isNodeVisible(d, this) ? '' : 'none';});

				selection.each(function(d, i) {
					if (!d) {return;}

					var selection = d3.select(this);

					if ('entity' === d.klass || 'reaction' === d.klass) {
						var highlights = self.highlights[d.layoutId];
						d.highlighted = highlights + 1;
						if (d.displays) {
							d.displays.forEach(function(display) {
								display.highlighted = highlights + 1;});}}

					if ('location' === d.klass) {
						selection.attr('stroke-width', self.display.collapsedLocations[d.id] ? 5 : 1);}});},

			updateLinks: function(selection) {
				var self = this;

				selection.style('display', function(d, i) {
					function visible(node) {
						return node && (
							self.isNodeVisible(node)
								|| (node.locationCollapsed && 'reaction:entity' === d.klass));}
					return (visible(d.source) && visible(d.target)) ? '' : 'none';});

				selection.each(function(d, i) {
					var selection = d3.select(this);

					var highlighted =
								d.source.highlighted && d.target.highlighted
								&& Math.min(d.source.highlighted, d.target.highlighted);
					d.highlighted = highlighted;

					if (d.displays) {
						d.displays.forEach(function(display) {
							display.highlighted = highlighted + 1;});}});
			},

			setLocationCollapse: function(location, collapsed) {
				var self = this,
						locationNode;

				if (self.display.collapsedLocations[location.id] == collapsed) {return;}
				self.display.collapsedLocations[location.id] = collapsed;

				locationNode = self.locations.indexed[location.layoutId];
				self.updateNodes(d3.select(locationNode));

				location.links.forEach(function(link) {
					link.source.locationCollapsed = collapsed;
					var node = self.nodes.indexed[link.source.layoutId];
					self.updateNodes(d3.select(node));});

				self.updateNodes(self.entityLabels);
				self.updateLinks(self.reactionLinks);
				self.updateLinks(self.entityLabelLinks);
				self.updateLinks(self.locationLinks);
				self.updateNodes(self.followerNodes);

				self.layout.updateDisplay();},

			setNodeTypeHidden: function(nodeType, hidden) {
				var self = this,
						updateNode, updateLink;

				if (self.hiddenNodeTypes[nodeType] == hidden) {return;}
				self.hiddenNodeTypes[nodeType] = hidden;

				if ('paper' === nodeType) {
					self.updateNodes(self.papers);
					self.updateLinks(self.paperLinks);}
				else if ('reaction' === nodeType) {
					self.updateNodes(self.reactions);
					self.updateLinks(self.paperLinks);
					self.updateLinks(self.reactionLinks);}
				else {
					if ('diminished' === nodeType) {
						self.updateNodes(self.entities.diminished);}
					else if ('protein' === nodeType) {
						self.updateNodes(self.entities.proteins);}
					else if ('small' === nodeType) {
						self.updateNodes(self.entities.small);}
					else if ('complex' === nodeType) {
						self.updateNodes(self.entities.complex);}
					else if ('other' === nodeType) {
						self.updateNodes(self.entities.other);}
					self.updateNodes(self.entityLabels);
					self.updateLinks(self.reactionLinks);
					self.updateLinks(self.entityLabelLinks);
					self.updateLinks(self.locationLinks);}

				self.updateNodes(self.followerNodes);},

			rightclickNote: function(selection) {
				var self = this;
				selection.on('contextmenu', function(d, i) {
					d3.event.preventDefault();
					if (this.note) {
						this.note.delete();
						delete self.notes[this.note.id];
						this.note = null;}
					else {
						this.note = new $P.NoteFrame({
							w: 200, h: 100,
							follow: this, followLayoutId: d.layoutId,
							parent: self.parentBubble});
						self.notes[this.note.id] = this.note;}
				});
			}

		});

	$P.GraphForceView.makeLegend = function(parentSelection, width, height, callback) {
		var legend = parentSelection.append('svg').attr('class', 'legend');

		legend.append('line')
			.attr('stroke', 'black')
			.attr('stroke-width', 3)
			.attr('x1', 0).attr('y1', 0)
			.attr('x2', 0).attr('y2', height);

		var leftX = width - 115;
		var textX = leftX + 20;
		var y = 20;

		var checkboxes = {};

		function checkbox(id, y) {
			checkboxes[id] = new $P.D3.Checkbox({
				parentSelection: legend,
				x: leftX + 3, y: y - 1,
				state: true,
				callback: function(state) {
					callback(id, state);}
			});}

		checkbox('protein', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Protein');

		legend.each($P.D3.Protein.appender({
			x: leftX + 99,
			y: y}));

		y += 24;
		checkbox('small', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Small');

		legend.each($P.D3.Small.appender({
			x: leftX + 99,
			y: y}));

		y += 24;
		checkbox('complex', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Complex');

		legend.append('rect')
			.attr('stroke', 'black')
			.attr('fill', 'white')
			.attr('width', 15).attr('height', 15)
			.attr('transform', 'translate('+(leftX+98)+','+(y-11)+')rotate(45)');

		y += 24;
		checkbox('other', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Other');

		legend.append('rect')
			.attr('stroke', 'black')
			.attr('fill', 'white')
			.attr('width', 15).attr('height', 15)
			.attr('transform', 'translate('+(leftX+90)+','+(y-7)+')');

		y += 30;
		checkbox('diminished', y);
		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y - 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Not in');
		legend.append('text')
			.style('font-size', '12px')
			.attr('x', textX)
			.attr('y', y + 8)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Pathway');
		legend.each($P.D3.Diminished.appender({
			x: leftX + 98,
			y: y}));


		y += 26;
		checkbox('reaction', y);

		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Reaction');

		legend.each($P.D3.Reaction.appender({
			x: leftX + 98,
			y: y}));

		y += 20;
		checkbox('paper', y);
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Paper');

		legend.append('polygon')
			.attr('points', '7.5,6 -7.5,6 0,-8.25')
			.style('stroke', 'black')
			.style('fill', 'cyan')
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 24;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Crosstalk');

		legend.each($P.D3.Protein.appender({
			crosstalk: true,
			x: leftX + 98,
			y: y}));

		y += 24;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Expression:');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Up');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#f00')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		y += 19;
		legend.append('text')
			.style('font-size', '14px')
			.attr('x', textX)
			.attr('y', y)
			.attr('fill', 'black')
			.attr('dominant-baseline', 'middle')
			.text('Down');

		legend.append('circle')
			.attr('stroke', 'black')
			.attr('fill', '#0f0')
			.attr('r', 7.5)
			.attr('transform', 'translate('+(leftX+98)+','+y+')');

		return legend;};
})(PATHBUBBLES);
