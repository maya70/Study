(function($P){
    'use strict';

    $P.Bubble.RandForce = $P.defineClass(
        $P.Bubble,      // parent
        function RandForceBubble(config){
            var self = this;
            config.closeMenu = true;
			config.groupMenu = true;
			$P.BubbleBase.call(this, config);
			self.graphs = [];
			self.numGraphs = 0;
			self.mode = config.mode || 'soup';
			self.contentConfig = config.contentConfig || {};
			self.contentConfig.graphs = self.graphs.slice();

			if(undefined !== config.text) {this.text = config.text;}
			self.add($P.ActionButton.create({
				name: 'switch',
				text: 'S',
				action: function(canvas, x, y) {
					self.mode = 'split' === self.mode ? 'soup' : 'split';
					if ('split' === self.mode) {self.content.layoutSplit();}
					if ('soup' === self.mode) {self.content.layoutSoup();}
					self.content.updateSvgPosition();}}));

			self.add($P.ActionButton.create({
				name: 'mult',
				text: 'M',
				action: function(canvas, x, y) {
					self.mode = 'sm';
					if ('sm' === self.mode) {self.content.layoutSM();}
					self.content.updateSvgPosition();}}));

			self.repositionMenus();
        },
        {
            addGraph: function(graph, i) {
                var self = this;
                var gr;

                if( i > 0 ){   // this is not the first graph to be added, so create a new event object for it
                   gr = {		name: 'addGraph',
								ignore_xy: true,
								graphName: 'Graph'+i,
								symbols: [],
								strokeStyle: self.parent.strokeStyle
								 };
				   gr.graphId = i;
				   gr.name = 'Graph'+i;
				   gr.id = i;
				   var colors = $P.BubbleBase.colors.slice(0), color, p;
					for (p in self.graphs) {
						$P.removeFromList(colors, self.graphs[p].color);}
					if (0 === colors.length) {
						gr.color = '#666';}
					else if (-1 !== colors.indexOf(graph.strokeStyle)) {
						gr.color = graph.strokeStyle;}
					else {
						gr.color = colors[0];} //}

					this.graphs.push(gr);

					if (this.content) {
						this.content.addGraph(gr, this.mode);}


                }
                else{
                    // Strip active colors.
					var colors = $P.BubbleBase.colors.slice(0), color, p;
					for (p in self.graphs) {
						$P.removeFromList(colors, self.graphs[p].color);}
					if (0 === colors.length) {
						graph.color = '#666';}
					else if (-1 !== colors.indexOf(graph.strokeStyle)) {
						graph.color = graph.strokeStyle;}
					else {
						graph.color = colors[0];}

				this.graphs.push(graph);
				if (this.content) {
					this.content.addGraph(graph, this.mode);
				    }
                }
            },
            onAdded: function(parent){
                $P.BubbleBase.prototype.onAdded.call(this, parent);
				var self = this;
				var config;
				if (!this.content) {
					config = this.contentConfig || {};
					config.parent = this;
					config.mode = this.mode;
					config = $.extend(config, this.getInteriorDimensions());
					this.content = new $P.Bubble.RandForceContent(config);
				}
             },
             receiveEvent: function(event){
                var result;
                var self = this;
                var N = 8;
                if('addGraph' == event.name) { // && (this.contains(event.x, event.y) || event.ignore_xy)){
                    if(!this.name) {this.name = event.name || 'Graph1';}
                    self.numGraphs++;
                    event.name = 'Graph'+ self.numGraphs;
                    event.id = self.numGraphs;
                    for( var i=0; i < N; i++)
                    {
                        this.addGraph(event, i);
                    }
                    this.content.layout.force.start();
                    return{ target: this, addLink: {color:this.content.getGraphColor(event)},
                            name: 'addedGraph', graphId: event.id
                           }
                 }
                result = $P.Bubble.prototype.receiveEvent.call(this, event);
                if(result) {return result;}
                return false;
             }
        }
    );

    $P.Bubble.RandForce.loader = function(load, id, data) {
        var config = {};
        $P.Bubble.RandForce.prototype.saveKeys.forEach(function(key) {
            config[key] = load.loadObject(data[key]);});
        return new $P.Bubble.RandForce(config);
     };

})(PATHBUBBLES);