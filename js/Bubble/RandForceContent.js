(function($P){
    'use strict';
    $P.Bubble.RandForceContent = $P.defineClass(
        $P.HtmlObject,
        function RandBubbleContent(config){
            var self = this;

			$P.HtmlObject.call(self, {
				parent: '#bubble',
				type: 'div',
				pointer: 'all',
				objectConfig: config});


			self.graph = {
    			"nodes": [  {  "id": 1, "location": 'A', "type": 'protein' },
                			{  "id": 2, "location": 'B', "type": 'protein'},
                			{  "id": 3, "location": 'C', "type": 'protein' },
                			{  "id": 4, "location": 'D', "type": 'protein' },
                			{  "id": 5, "location": 'A', "type": 'protein' },
                			{  "id": 6, "location": 'B', "type": 'protein' },
                			{  "id": 7, "location": 'C', "type": 'protein' },
               				{  "id": 8, "location": 'D', "type": 'protein' },
                			{  "id": 9, "location": 'A', "type": 'protein' },
               				{  "id": 10, "location": 'B', "type": 'protein' },
                			{  "id": 11, "location": 'C', "type": 'protein'},
                			{  "id": 12, "location": 'D', "type": 'protein' },
                			{  "id": 13, "location": 'A', "type": 'protein' },
                			{  "id": 14, "location": 'B', "type": 'protein' },
                			{  "id": 15, "location": 'C', "type": 'protein'},
                			{  "id": 16, "location": 'D', "type": 'protein' },
                			{  "id": 17, "location": 'A', "type": 'protein' },
                			{  "id": 18, "location": 'B', "type": 'protein' }
            			],
    			"links": [  { "target": 11, "source":  0 },
                			{ "target":  3, "source":  0 },
                			{ "target": 10, "source":  0 },
                			{ "target": 16, "source":  0 },
                			{ "target":  1, "source":  0 },
                			{ "target":  3, "source":  0 },
                			{ "target":  9, "source":  0 },
                			{ "target":  5, "source":  0 },
                			{ "target": 11, "source":  0 },
                			{ "target": 13, "source":  0 },
                			{ "target": 16, "source":  0 },
                			{ "target":  3, "source":  1 },
                			{ "target":  9, "source":  1 },
                			{ "target": 12, "source":  1 },
                			{ "target":  4, "source":  2 },
                			{ "target":  6, "source":  2 },
                			{ "target":  8, "source":  2 },
                			{ "target": 13, "source":  2 },
                			{ "target": 10, "source":  3 },
                			{ "target": 16, "source":  3 },
                			{ "target":  9, "source":  3 },
                			{ "target":  7, "source":  3 },
                			{ "target": 11, "source":  5 },
                			{ "target": 13, "source":  5 },
                			{ "target": 12, "source":  5 },
                			{ "target":  8, "source":  6 },
                			{ "target": 13, "source":  6 },
                			{ "target": 10, "source":  7 },
                			{ "target": 11, "source":  7 },
                			{ "target": 17, "source":  8 },
                			{ "target": 13, "source":  8 },
                			{ "target": 11, "source": 10 },
                			{ "target": 16, "source": 10 },
                			{ "target": 13, "source": 11 },
                			{ "target": 14, "source": 12 },
                			{ "target": 14, "source": 12 },
                			{ "target": 14, "source": 12 },
                			{ "target": 15, "source": 12 },
                			{ "target": 16, "source": 12 },
                			{ "target": 15, "source": 14 },
                			{ "target": 16, "source": 14 },
                			{ "target": 15, "source": 14 },
                			{ "target": 16, "source": 15 },
                			{ "target": 16, "source": 15 },
                			{ "target": 17, "source": 16 }
            			],
            	 "expression" : ['up', 'up','up','up','up','up','up','up','up','up','up','up','up','up','up','up','up','up', 'down']
    			};


			var nodes = self.graph.nodes;
			var links = self.graph.links;
			self.numGraphs = 0;


			self.svg = d3.select(self.element).append('svg').attr('class', 'svg')
							.attr('width', config.w)
							.attr('height', config.h);
			self.svg.main = self.svg.append('g');
			self.layout = config.layout || new $P.RandForceLayout();

			self.layout.registerDisplayListener(self.onTick.bind(self));
			self.layout.force.gravity(0);
			self.layout.gravity = 0.03;

			if (config.translate || config.scale) {
				self.zoomBase = {
					translate: function() {return config.translate || [0, 0];},
					scale: function() {return config.scale || 1;}};}

			self.graphs = [];			// equivalent to self.pathways
			if (config.graphs) {
				self.setGraphs(config.graphs, function() {}, config.viewNotes);
			}


			self.legendWidth = config.legendWidth || 130;
			self.mode = config.mode || 'sm';

			self.updateSvgPosition();

			/*
			var force = d3.layout.force()
							.size([config.w, config.h])
							.nodes(nodes)
							.links(links);

			force.linkDistance(config.w/3.5);
			var link = self.svg.selectAll('.link')
							.data(links)
							.enter().append('line')
							.attr('class', 'link')
							.attr('x1', function(d) {return nodes[d.source].x; } )
							.attr('y1', function(d) {return nodes[d.source].y; } )
							.attr('x2', function(d) {return nodes[d.target].x; } )
							.attr('y2', function(d) {return nodes[d.target].y; } )
							;

			var node = self.svg.selectAll('.node')
							.data(nodes)
							.enter().append('circle')
							.attr('class', 'node')
							.attr('r', config.w/100)
							.attr('cx', function(d) {return d.x;})
							.attr('cy', function(d) {return d.y;});

			var animating = false;
			var animationStep = 400;
			force.on('tick', function(){
				node.transition().ease('linear').duration(animationStep)
					.attr('cx', function(d) {return d.x;} )
					.attr('cy', function(d) {return d.y;} );

				link.transition().ease('linear').duration(animationStep)
					.attr('x1', function(d) {return d.source.x;})
					.attr('y1', function(d) {return d.source.y;})
					.attr('x2', function(d) {return d.target.x;})
					.attr('y2', function(d) {return d.target.y;});

				force.stop();

				if(animating)
				{
				 setTimeout( function() {force.start();}, animationStep );
				}

			}); */

			//self.layout.force.start();

			/*
			force.on('end', function(){
					node.attr('r', config.w/100)
						.attr('cx', function(d) {return d.x;})
						.attr('cy', function(d) {return d.y;});

					link.attr('x1', function(d) {return d.source.x;})
						.attr('y1', function(d) {return d.source.y;})
						.attr('x2', function(d) {return d.target.x;})
						.attr('y2', function(d) {return d.target.y;});
				});
			*/
			//animating = true;
			//force.start();


			//root.append('<div id="drag" style="width: 50px; height: 50px; background-color: red;"/>');
			//root.append('TEST');
			//root.append('<hr/>');

			/*
			root.find('#drag').draggable({
				revert: true,
				revertDuration: 0,
				scroll: false,
				stop: function(event, ui) {
					var force;

					if (self.contains(mouse.x, mouse.y)) {return;}

					var mouse = $P.state.mainCanvas.getMouseLocation(event);
					mouse.x += $P.state.scrollX;

					var send = {
						name: 'dragPathway',
						x: mouse.x, y: mouse.y,
						strokeStyle: 'gray',
						expression: null};
					var result = $P.state.scene.sendEvent(send);

					if (!result) {
						force = new $P.Bubble.Force({x: mouse.x, y: mouse.y, w: 750, h: 600});
						$P.state.scene.add(force);
						result = force.receiveEvent(event);}

					if (result && result.addLink) {
						// Add Link Here.
					}

			}});

			root.find('#search_run').click(function(event) {
				self.updateSearch();});
			*/
        },
        {
			addViewNotes: function(viewNotes) {
				var i, layoutId, notes, view, self = this;
				for (i = 0; i < viewNotes.length; ++i) {
					view = this.display.views[i];
					for (layoutId in viewNotes[i]) {
						var text = viewNotes[i][layoutId];
						var element = $P.findFirst(view.entities[0], function(entity) {
							return entity.__data__.layoutId == layoutId;});
						console.log('LAYOUT-ID', layoutId);
						console.log('ELEMENT', element);
						console.log('DATA', element.__data__);
						var note = new $P.NoteFrame({
							w:200, h:100,
							follow: element, followLayoutId: layoutId,
							text: text,
							parent: self.parent});
						view.notes[note.id] = note;
					}
				}
			},
			getGraphColor: function(graph) {
				var i;
				for (i = 0; i < this.graphs.length; ++i) {
					if (graph.id === this.graphs[i].id) {
						return this.graphs[i].color;}}
				return graph.color || graph.strokeStyle || null;
			},

			renewDisplay: function() {
				if ('split' === this.mode) {this.layoutSplit();}
				else if ('soup' === this.mode) {this.layoutSoup();}
			},
        	updateSearch: function() {
				var key = $(this.element).find('#search_text').val();
				this.parent.getAllNeighbors().forEach(function(neighbor) {
					if (neighbor.onSearch) {
						neighbor.onSearch(key);}});
			},
			onAdded: function(parent) {
				$P.HtmlObject.prototype.onAdded.call(this, parent);
			},
			drawSelf: function(context, scale, args) {
				$P.HtmlObject.prototype.drawSelf.call(this, context, scale, args);
			},
			updateLegend: function() {
				var self = this;
				if (self.legend) {self.legend.remove();}
				self.legend = self.display.viewConstructor.makeLegend(
					d3.select(self.element), self.legendWidth, self.h,
					function(id, state) {self.setNodeTypeHidden(id, !state);});
			},
			updateSvgPosition: function() {
				if (this.svg) {
					this.svg.attr('width', this.w - this.legendWidth).attr('height', this.h);}
				if (this.display) {this.display.size = [this.w - this.legendWidth, this.h];}
				if (this.legend) {
					this.legend
						.attr('x', this.w - this.legendWidth)
						.attr('width', this.legendWidth)
						.attr('y', 0)
						.attr('height', this.h);}
			},
			setNodeTypeHidden: function(nodeType, hidden) {
				this.display.views.forEach(function(view) {
					view.setNodeTypeHidden(nodeType, hidden);});
			},
			setGraphs: function(graphs, finish, viewNotes){
					var self = this;
					//self.onGraphsChanged = function() {};
					var index = 0;
					function add() {
						if(index < graphs.length){
							self.addGraph(graphs[index], undefined, add);
							++index;
							}
						else{
							//delete self.onGraphsChanged();
							self.onGraphsChanged();
							if(viewNotes) {self.addViewNotes(viewNotes);}
							if(finish) {finish();}
							}
					}
					add();
			},
			onGraphsChanged: function(){
			   var self = this;
			   if(self.svg) {self.svg.remove();}
			   self.svg = d3.select(self.element).append('svg').attr('class', 'svg');
			   self.svg.main = self.svg.append('g').attr('id', 'main');
			   self.svg.main.append('rect')
			   			.attr('width', '100%')
			   			.attr('height', '100%')
			   			.attr('fill', 'white');
			   self.svg.defs = self.svg.append('defs');   // no idea what this is but including it for now
			   self.layout.setGraphs(self.graphs, function() {
			   							self.renewDisplay();
			   							self.updateSvgPosition();
			   						} );
			},
			onPositionChanged: function(dx, dy, dw, dh) {
				$P.HtmlObject.prototype.onPositionChanged.call(this, dx, dy, dw, dh);
				//if ((dw && dw !== 0) || (dh && dh !== 0)) {this.layout.force.start();}
				this.updateSvgPosition();
			},
			onTick: function() {
				var self = this;
				this.svg.selectAll('.node').attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')';});
				this.svg.selectAll('.follower').attr('transform', function(d) {
					var follow = d3.select(this).attr('follow-id');
					var node = self.layout.getNode(follow);
					return 'translate(' + node.x + ',' + node.y + ')';});
				// Undirected Links.
				this.svg.selectAll('.link line')
					.attr('x1', function(link) {return link.source.x;})
					.attr('y1', function(link) {return link.source.y;})
					.attr('x2', function(link) {return link.target.x;})
					.attr('y2', function(link) {return link.target.y;});
				this.svg.selectAll('.update-displays').each(function(d, i) {
					if (d && d.displays) {
						d.displays.forEach(function(display) {
							display.update(self.layout);});}});
			},
			layoutPrep: function() {
				if (this.display) {this.display.delete();}
				if (this.display && this.display.viewCount > 0) {
					this.zoomBase = this.display.getZoomBase();}
			},
			layoutFinish: function() {
				if (!this.display || !this.display.layout || !this.display.layout.force) {return;}
				this.onTick();
				//this.updateLegend();
			},
			layoutSM: function(){
				this.layoutPrep();
				this.display = new $P.ForceDisplay(
					{
						svg: this.svg,
						parent:this.svg.main,
						parentBubble: this.parent,
						layout: this.layout,
						shape: new $P.ForceShape.Grid({w: this.w, h: this.h, count: this.graphs.length }),
						zoomBase: this.zoomBase,
						viewArgs: {type: 'graphs', list: this.graphs},   			// this will be trouble in the View class ---> needs to be handled there
						collapsedLocations: this.display && this.display.collapsedLocations,
						viewConstructor: $P.GraphForceView
					}
				);
				this.layoutFinish();
			},
			layoutSoup: function() {
				this.layoutPrep();
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					zoomBase: this.zoomBase,
					viewArgs: {type: 'graphs', list: this.graphs},
					collapsedLocations: this.display && this.display.collapsedLocations,
					viewConstructor: $P.RandSoupForceView});
				this.layoutFinish();
			},

			layoutSingle: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Centered({w: this.w, h: this.h, count: 1}),
					zoomBase: this.zoomBase,
					viewArgs: this.graphs,
					collapsedLocations: this.display && this.display.collapsedLocations,
					viewConstructor: $P.GraphForceView});
					},

			layoutMirror: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Mirror({w: this.w * 0.5, h: this.h, count: 2}),
					zoomBase: this.zoomBase,
					viewArgs: this.graphs,
					collapsedLocations: this.display && this.display.collapsedLocations,
					viewConstructor: $P.GraphForceView});
					},

			layoutRadial: function() {
				this.display = new $P.ForceDisplay({
					svg: this.svg,
					parent: this.svg.main,
					parentBubble: this.parent,
					layout: this.layout,
					shape: new $P.ForceShape.Radial({
						count: this.graphs.length,
						radius: Math.max(this.w, this.h)}),
					zoomBase: this.zoomBase,
					viewArgs: {type: 'graphs', list: this.graphs},
					collapsedLocations: this.display && this.display.collapsedLocations,
					viewConstructor: $P.GraphForceView});
					},

			layoutSplit: function() {
				this.layoutPrep();
				if (1 === this.graphs.length) {this.layoutSingle();}
				if (2 === this.graphs.length) {this.layoutMirror();}
				if (2 < this.graphs.length) {this.layoutRadial();}
				this.layoutFinish();
			},
			renewDisplay: function() {

				if('split' === this.mode) {this.layoutSplit();}
				else if('soup' === this.mode ) {this.layoutSoup();}
				else if('sm' === this.mode) {this.layoutSM();}
			},


			addGraph: function(graph, mode, finish) {
				var self = this;
				if(undefined !== mode) {this.mode = mode;}
				if (undefined === graph.color) {
					var colors = $P.BubbleBase.colors.slice(0), color, p;
					for (p in self.graphs) {
						$P.removeFromList(colors, self.graphs[p].color);}
					if (0 === colors.length) {
						graph.color = '#666';}
					else if (-1 !== colors.indexOf(graph.strokeStyle)) {
						graph.color = graph.strokeStyle;}
					else {
						graph.color = colors[0];}
				}
			 	self.layout.getNodes().forEach(function(node) {delete node.displays;});
			 	function onGraphDataLoaded(){
			 		$P.state.scene.record({
						type: 'graph-added',
						id: graph.id,
						name: graph.name,
						bubble: self});
					self.layout.consolidateComposite();
			 		self.layout.force.start();
			 		self.numGraphs++;
			 		graph.graphId = self.numGraphs;
			 		graph.expression = self.graph.expression;
					self.graphs.push(graph);
					self.onGraphsChanged();
					if(finish) {finish();}
					}
				$.each(self.graph.nodes, function( entityId, entity){
										entity.klass = 'entity';
										entity.graphs = Array.apply(0, Array(self.graphs.length+1)).map(function (x, y) { return y + 1; });
										entity.graphId = self.graph.graphId;
										self.layout.addNode(entity);
										} );
				self.layout.addMoreLinks(self.graph.links);
				onGraphDataLoaded();
			}

        }


    );


})(PATHBUBBLES);