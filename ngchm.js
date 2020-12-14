import { Vanodi } from './vanodi.js';
import { canvasPlot } from './canvasDraw.js';

export var VAN = new Vanodi({
		op: 'register',
		name: 'canvasPlot2D',
		axes: [
			{ axisLabel: 'Points Axis',
			  coco: [ { name: 'Coordinate', baseid: 'coordinate', min: 2, max: 2, helpText: 'Coordinate in scatter plot' },
				  { name: 'Color By', baseid: 'covariate', min: 1, max: 1, helpText: 'Covariate used to color points in the Scatter Plot' }] }
		],
		options: [
			{ label: 'Background Color', type: 'dropdown', choices: [
				{ label: 'White', value: "white" },
				{ label: 'Ivory', value: "ivory" },
				{ label: 'Black', value: "black" },
				{ label: 'Gray',  value: "grey"  }
			  ]},
			{ label: 'Text Color', type: 'dropdown', choices: [
				{ label: 'Black', value: 'black' },
			        { label: 'Gray',  value: 'grey'  },
				{ label: 'Ivory', value: 'ivory' },
				{ label: 'White', value: 'white' }
			  ]},
			{ label: 'Lasso Color', type: 'dropdown', choices: [
					{ label: 'Black', value: 'black'},
					{ label: 'Ivory', value: 'ivory'},
					{ label: 'Blue', value: 'blue'}
				],
				helpText: 'Color used to draw lasso for selecting points'
			},
			{ label: 'Selection Color', type: 'dropdown', choices: [
					{ label: 'Black', value: 'black'},
					{ label: 'Ivory', value: 'ivory'},
					{ label: 'Blue', value: 'blue'}
				], 
				helpText: 'Color used to highlight selected points'
			}
		]
}); /* end function registerPlugin */

var ScatterPlot = { plotData: [] };

VAN.addMessageListener ('plot', function plotMessageHandler (vanodi) {
	ScatterPlot.plotData = []
	// package data from vanodi message for input into canvas plot
	var vanodiXCoord = vanodi.data.axes[0].coordinates[0]
	var vanodiYCoord = vanodi.data.axes[0].coordinates[1]
	var vanodiBatches = vanodi.data.axes[0].covariates[0]
	var vanodiColors = vanodi.data.axes[0].covariateColors[0]
	var vanodiLabels = vanodi.data.axes[0].actualLabels;
	var vanodiColorMaps = vanodi.data.axes[0].covariateColorMap;
	ScatterPlot.colorMap = vanodiColorMaps && getVanodiColorMap (vanodiColorMaps[0]);

	for (var i=0; i<vanodiXCoord.length; i++) {
		//var colorValue = vanodiColors.filter(function(c) {
		//	if (c.Class == vanodiBatches[i]) {return c.Color}
		//})[0].Color
		var colorValue = vanodiColors[i];
		var xval = parseFloat(vanodiXCoord[i])
		var yval = parseFloat(vanodiYCoord[i])
		ScatterPlot.plotData.push({
			x: xval,
			y: yval,
			batch: vanodiBatches[i],
			text:  vanodiLabels[i],
			color: colorValue
		})
	}
	if (ScatterPlot.plotData.map(elem => {return elem.x}).every(elem=>isNaN(elem))) {
		$("<div title='Data Error'>All x values are NaN</div>").dialog({
				dialogClass: "no-close",
				buttons: [
					{
						text: "Close",
						click: function() {
							$( this ).dialog( "close" );
						}
					}
				]
		});
	}
	if (ScatterPlot.plotData.map(elem => {return elem.y}).every(elem=>isNaN(elem))) {
		$("<div title='Data Error'>All y values are NaN</div>").dialog({
				dialogClass: "no-close",
				buttons: [
					{
						text: "Close",
						click: function() {
							$( this ).dialog( "close" );
						}
					}
				]
		});
	}
	ScatterPlot.plotGeometry = {
		marginTop: 0,
		marginRight: 0,
		marginBottom: 50,
		marginLeft: 70,
		borderWidth: 1,
		legendVSpace: 25
	}
	ScatterPlot.plotOptions = {
		backgroundColor: vanodi.config.options['Background Color'],
		textColor: vanodi.config.options['Text Color'],
		lassoColor: vanodi.config.options['Lasso Color'],
		highlightColor: vanodi.config.options['Selection Color'],
		xLabel: vanodi.config.axes[0].coordinates[0].label,
		yLabel: vanodi.config.axes[0].coordinates[1].label,
		plotTitle: vanodi.config.plotTitle,
		legendTitle: vanodi.config.axes[0].covariates[0].label
	}
	$(document).ready(function() {
		var slider = document.getElementById('point-size-slider')
		ScatterPlot.plotOptions.pointSize = slider.value
		canvasPlot.batchIds = canvasPlot.getBatchIds(ScatterPlot.plotData)
		canvasPlot.axis = vanodi.config.axes[0].axisName
		var chance1 = new Chance(124);
		canvasPlot.data = chance1.shuffle(ScatterPlot.plotData)
		canvasPlot.selectedPointIds = vanodi.data.axes[0].selectedLabels ? vanodi.data.axes[0].selectedLabels : []
		canvasPlot.drawPlot(canvasPlot.data, ScatterPlot.plotGeometry, ScatterPlot.plotOptions, ScatterPlot.colorMap);
		slider.oninput = function() {
			canvasPlot.plotOptions.pointSize = this.value;
			canvasPlot.drawPlot(canvasPlot.data, canvasPlot.plotGeometry, canvasPlot.plotOptions, ScatterPlot.colorMap)
		}
		var reset = document.getElementById('reset-button');
		reset.onclick = function() {
			ScatterPlot.plotOptions.pointSize = slider.value;
			delete canvasPlot.g_transform // rm g_transform to use original x/y scales
			canvasPlot.drawPlot(canvasPlot.data, ScatterPlot.plotGeometry, ScatterPlot.plotOptions, ScatterPlot.colorMap);
		} 
		$(window).resize($.throttle(1000, function() {
			ScatterPlot.plotOptions.pointSize = slider.value;
			canvasPlot.drawPlot(canvasPlot.data, ScatterPlot.plotGeometry, ScatterPlot.plotOptions, ScatterPlot.colorMap)
		}))
	})

	function getVanodiColorMap (cm) {
		if (!cm) return null;
		return cm.map(e => [ e.Class, e.Color ]);
	}
});

VAN.addMessageListener ('makeHiLite', function hiliteMessageHandler (vanodi) {
	if (canvasPlot.axis && canvasPlot.axis.toLowerCase() != vanodi.data.axis.toLowerCase()) {
		return false
	}
	canvasPlot.clearSelectedPoints();
	// From vanodi message, get the data points to select on the scatter plot
	var pointsToSelect = ScatterPlot.plotData.filter(function(pd) {
		if (vanodi.data.pointIds.indexOf(pd.text) > -1) {
			return pd;
		}
	})
	// Select those points on the scatter plot
	var selectCanvas = document.getElementById('select-points');
	var selectCtx = selectCanvas.getContext('2d')
	selectCtx.clearRect(0, 0, selectCanvas.width, selectCanvas.height);
	pointsToSelect.forEach(function(poi) {
		canvasPlot.selectPoint(poi);
		canvasPlot.highlightPoint(poi, selectCtx, canvasPlot.xScale, canvasPlot.yScale);
	})
});
