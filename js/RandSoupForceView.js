(function($P){
	'use strict';

	$P.RandSoupForceView = $P.defineClass(
		$P.GraphForceView,
		function RandSoupForceView(config) {
			var self = this;
			$P.GraphForceView.call(self, config);
		},
		{

			entityBackgrounds: function() {
				var self = this;
				self.entities.selectAll('.pathway-arcs').remove();
				self.entities.graphs = self.entities.append('g').attr('class', 'pathway-arcs');
				self.entities.graphs
					.selectAll('.pathway-section')
					.data(function(d, i) {
						d.pathwayArc = this;
						var graphs = self.activeGraphs(d);
						if (d.id == 7021){console.log(d, graphs);}
						var result = [];
						graphs.forEach(function(graph) {
							var r = Object.create(graph);
							r.entity = d;
							r.angle = Math.PI * 2 / graphs.length;
							result.push(r);});
						return result;})
					.enter().append('path')
					.attr('d', function(d, i) {
						return (d3.svg.arc()
										.innerRadius(0)
										.outerRadius(self.nodeSize(8))
										.startAngle(d.angle * i)
										.endAngle(d.angle * (i + 1)))();})
					.attr('stroke', 'black')
					.attr('stroke-width', self.nodeSize(0.5))
					.attr('fill', function(d, i) {return d.color;});},

			makeReactionLinks: function() {
				this.reactionLinks.each($P.D3.SoupReactionLink.appender({view: this}));}

		});

	$P.RandSoupForceView.makeLegend = function(parentSelection, width, height, callback) {
		return $P.GraphForceView.makeLegend(parentSelection, width, height, callback);};

})(PATHBUBBLES);
