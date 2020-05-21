import { VAN } from './ngchm.js';

// canvasDraw.js

export const canvasPlot = {
	selectPoint,
	clearSelectedPoints,
	clearLassoCanvas,
	highlightPoint,
	drawPlot,
	getBatchIds
};

var selectedPoints = []; // keep track of selected points
var postedPoints = [];

// Exported function.
function selectPoint (poi) {
	selectedPoints.push(poi);
}

// Exported function.
function clearSelectedPoints () {
	selectedPoints = [];
}

// Exported function.
// Function to clear lasso canvas
function clearLassoCanvas () {
	var lassoCanvas = document.getElementById('catch-lasso')
	var lassoCtx = lassoCanvas.getContext('2d')
	lassoCtx.clearRect(0, 0, lassoCanvas.offsetWidth, lassoCanvas.offsetHeight)
}

// Function to draw point (p) in canvas context (ctx)
function drawPoint(p,ctx, xScale, yScale) {
	ctx.fillStyle = p.color;
	ctx.beginPath()
	ctx.arc(xScale(p.x), yScale(p.y), canvasPlot.plotOptions.pointSize, 0, Math.PI*2, true)
	ctx.fill()
}

// Exported function.
// Function to highlight point obtained from quatreee
// (all we get back from quadtree are x,y coordinates of point)
// This is used to 'highlight' and to 'select'. 
//    When 'highlighting' send the highlight canvas context as ctx
//    When 'selecting' send the select canvas context as ctx
function highlightPoint (point ,ctx, xScale, yScale) {
	drawPoint(point, ctx, xScale, yScale)
	ctx.strokeStyle = canvasPlot.plotOptions.highlightColor;
	ctx.lineWidth = 2;
	ctx.beginPath();
	var sx = point.x
	var sy = point.y
	ctx.arc(xScale(sx), yScale(sy), canvasPlot.plotOptions.pointSize, 0, Math.PI*2, true);
	ctx.stroke();
}

// Post vanodi message to parent (probably NGCHM) about point mouseover
function postHighlightPoint(point) {
	VAN.postMessage({
		op: 'mouseover',
		selection: {axis: 'column', pointId: point.text}
	});
}

// quick function to check if arrays are equal,
// because we only want to post a message if something has changed
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length != b.length) return false;
	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

// Post vanodi message to parent (probably NGCHM) about selected points
function postSelectLabels(points,clickType) {
	if (arraysEqual(points,postedPoints)) { return} // if nothing changed, don't postMessage
	var hiLiteInfo = {}
	hiLiteInfo.axis = 'column'
	hiLiteInfo.pointIds = points.map(function(p) {return p.text})
	hiLiteInfo.clickType = clickType;
	VAN.postMessage({
		op: 'selectLabels',
		selection: hiLiteInfo
	});
	postedPoints = points;
}

function createXScale(data, transform) {
	var xExtent = d3.extent(data, function(d) {return (d.x-transform.x)*transform.k});
	var xPadding = (xExtent[1] - xExtent[0]) * 0.05;
	return d3.scaleLinear()
		.domain([xExtent[0]-xPadding, xExtent[1]+xPadding])
		.range([0, canvasPlot.plotGeometry.width])
}

function createYScale(data, transform) {
	var yExtent = d3.extent(data, function(d) {return (d.y+transform.y)*transform.k});
	var yPadding =  (yExtent[1] - yExtent[0]) * 0.05;
	return d3.scaleLinear()
		.domain([yExtent[0]-yPadding, yExtent[1]+yPadding])
		.range([canvasPlot.plotGeometry.height, 0])
}

// Create x-axis and y-axis using D3
function createAxes(data, xScale, yScale) {
	var svg = d3.select('#axis-svg')
	svg.style('background-color',canvasPlot.plotOptions.backgroundColor)
	svg.append('g') // x-axis
		.attr('transform', 'translate('+canvasPlot.plotGeometry.marginLeft+','+canvasPlot.plotGeometry.height+')')
		.style('color',canvasPlot.plotOptions.textColor)
		.style('font',canvasPlot.plotGeometry.tickLabelFont + 'px Arial')
		.call(d3.axisBottom(xScale))
	svg.append('g')   // vertical grid lines
		.call(d3.axisTop().tickFormat('').tickSize(-canvasPlot.plotGeometry.height).scale(xScale))
		.attr('transform', 'translate('+canvasPlot.plotGeometry.marginLeft+',0)')
		.style('opacity',0.4)
	svg.append('g') // y-axis
		.attr('transform','translate('+canvasPlot.plotGeometry.marginLeft+',0)')
		.style('color',canvasPlot.plotOptions.textColor)
		.style('font',canvasPlot.plotGeometry.tickLabelFont + 'px Arial')
		.call(d3.axisLeft(yScale))
	svg.append('g') // horizontal gridlines 
		.call(d3.axisLeft().tickFormat('').tickSize(-canvasPlot.plotGeometry.width).scale(yScale))
		.attr('transform', 'translate('+canvasPlot.plotGeometry.marginLeft+',0)')
		.style('opacity',0.4)
	// x-axis label
	var lY = canvasPlot.plotGeometry.height + canvasPlot.plotGeometry.marginBottom
	var lX = canvasPlot.plotGeometry.marginLeft + canvasPlot.plotGeometry.width / 2
	svg.append('text') 
		.attr('transform', 'translate('+lX+','+lY+')')
		.attr('dy','-5px')
		.style('text-anchor','middle')
		.style('font-family','Arial')
		.style('fill',canvasPlot.plotOptions.textColor)
		.style('font-size',canvasPlot.plotGeometry.axisLabelFont+'px')
		.text(canvasPlot.plotOptions.xLabel)
	// y-axis label
	lX = canvasPlot.plotGeometry.height/2 + canvasPlot.plotGeometry.marginBottom;
	lY = 0;
	svg.append('text') 
		.attr('transform', 'rotate(90)')
		.attr('y',lY)
		.attr('x',lX)
		.attr('dy','-5px')
		.style('text-anchor','middle')
		.style('font-family','Arial')
		.style('fill',canvasPlot.plotOptions.textColor)
		.style('font-size',canvasPlot.plotGeometry.axisLabelFont+'px')
		.text(canvasPlot.plotOptions.yLabel)
}

// Exported function
// Function to return array of batch IDs, sorted smallest to largest
function getBatchIds(data) {
	var batchIds = Array.from(new Set(data.map(function(el) { return el.batch })))
	try {document.getElementById('npoints').innerHTML = data.length} catch {}
	try {document.getElementById('nbatches').innerHTML = batchIds.length} catch{}
	var cardiB = batchIds.map(function(bid) {
		var zeta = data.filter(function(el) {
			return el.batch == bid;
		}).length
		return zeta
	})
	var cardinality = {}
	batchIds.forEach(function(bid,idx) {
		cardinality[bid] = cardiB[idx];
	})
	batchIds.sort(function(a,b) { // sort smallest to largest
		return (cardinality[a] > cardinality[b] ? 1 : -1 )
	})
	return batchIds;
}

// Function to get array of array of batchIds and their
// corresponding colors. Structure of 'colors' array:
// [ [batchId 1, color 1], [batchId 2, color 2], etc.]
function getColors(batchIds,data) {
	var colors = [];
	var entry;
	batchIds.forEach(function(bid) {
		for (var i=0; i<data.length; i++) {
			if (data[i].batch == bid) {
				entry = data[i].color;
				break;
			}
		}
		colors.push([bid, entry])
	})
	return colors;
}

// Function to draw legend on canvas with id = 'legend'
// input is the output of getColors
function createLegend(colors) {
	var c, text, xloc, yloc, legendWidth, textWidth
	// set width based on longest string....
	text = canvasPlot.plotOptions.legendTitle;
	var legendTitleWidth = text.visualLength() 
	var maxLabelWidth = Math.max(...colors.map(c => {return c[0].toString().visualLength()}))
	var legendWidth = legendTitleWidth > maxLabelWidth ? legendTitleWidth + 40 : maxLabelWidth + 40
	var nLegendEntries = colors.length;
	var legendHeight = canvasPlot.plotGeometry.legendVSpace * (nLegendEntries + 2);
	var canvas = document.getElementById('legend');
	canvas.width = legendWidth;
	canvas.height = legendHeight;
	var ctx = canvas.getContext('2d');
	ctx.font = '20px Arial';
	ctx.fillStyle = 'black'
	ctx.fillText(text, 10, canvasPlot.plotGeometry.legendVSpace)
	ctx.beginPath()
	ctx.fill()
	colors.sort(function(a,b) { // put in alphabetical order
		return (a[0] > b[0]) ? 1 : -1
	})
	for (var i=0; i<colors.length; i++) {
		c = colors[i]
		text = c[0] 
		yloc = 4+canvasPlot.plotGeometry.legendVSpace*(i+2) 
		ctx.fillStyle = 'black';
		ctx.fillText(text, 30, yloc)
		ctx.fillStyle = c[1];
		ctx.beginPath()
		yloc = yloc - 10
		ctx.arc(15, yloc, 5, 0, Math.PI*2, true)
		ctx.fill()
	}
}

// Function to set size of SVG (for axes) and plot area (for canvases)
// Also places the legend to the right of the canvases. Note that there
// was a lot of futzing aorund between using the attribute vs style for
// with and height. 
function setSize() {
	var svg = document.getElementById('axis-svg')
	// use style here, because width seems only a getter for svg
	svg.style.width = (canvasPlot.plotGeometry.width + canvasPlot.plotGeometry.marginLeft +  canvasPlot.plotGeometry.marginRight) + 'px';
	svg.style.height = (canvasPlot.plotGeometry.height + canvasPlot.plotGeometry.marginTop + canvasPlot.plotGeometry.marginBottom) + 'px';
	// for canvas elements using style for left position, and attribute for width & height
	var lefty = (canvasPlot.plotGeometry.marginLeft + canvasPlot.plotGeometry.borderWidth) + 'px';
	var widthy = canvasPlot.plotGeometry.width;
	var heighty = canvasPlot.plotGeometry.height;
	var zoomCanvas = document.getElementById('catch-zoom');
	zoomCanvas.style.left = lefty;
	zoomCanvas.width = widthy;
	zoomCanvas.height = heighty;
	var lassoCanvas = document.getElementById('catch-lasso');
	lassoCanvas.style.left = lefty;
	lassoCanvas.width = widthy;
	lassoCanvas.height = heighty;
	var highlightCanvas = document.getElementById('highlight-points');
	highlightCanvas.style.left = lefty;
	highlightCanvas.width = widthy;
	highlightCanvas.height = heighty;
	var selectCanvas = document.getElementById('select-points');
	selectCanvas.style.left = lefty;
	selectCanvas.width = widthy;
	selectCanvas.height = heighty;
	var pointsCanvas = document.getElementById('plot-points');
	pointsCanvas.style.left = lefty;
	pointsCanvas.width = widthy;
	pointsCanvas.height = heighty;
	var legendCanvas = document.getElementById('legend')
	legendCanvas.style.left = (canvasPlot.plotGeometry.width + canvasPlot.plotGeometry.marginLeft + canvasPlot.plotGeometry.marginRight + 10) + 'px';
	legendCanvas.height= canvasPlot.plotGeometry.height;
}

// Function to clear plot area of points, axes labels, tick marks, etc.
function clearPlotArea() {
	var pointsCanvas = document.getElementById('plot-points')
	var pointsCtx = pointsCanvas.getContext('2d')
	pointsCtx.clearRect(0, 0, pointsCanvas.offsetWidth, pointsCanvas.offsetHeight)
	clearAxes()
	clearHighlightCanvas()
	clearSelectedPointsCanvas()
}

function clearHighlightCanvas() {
	var highlightCanvas = document.getElementById('highlight-points')
	var highlightCtx = highlightCanvas.getContext('2d')
	highlightCtx.clearRect(0, 0, highlightCanvas.offsetWidth, highlightCanvas.offsetHeight)
}

function clearSelectedPointsCanvas() {
	var selectedPointsCanvas = document.getElementById('select-points')
	var selectedCtx = selectedPointsCanvas.getContext('2d')
	selectedCtx.clearRect(0, 0, selectedPointsCanvas.offsetWidth, selectedPointsCanvas.offsetHeight)
}

function clearAxes() {
	var svgElem = document.getElementById('axis-svg') // remove axis, axis labels, tick marks, etc
	while (svgElem.firstChild) {
		svgElem.removeChild(svgElem.firstChild);
	}
}

// Function to clear legend
function clearLegend() {
	var canvas = document.getElementById('legend');
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
}

// Initialize plotOptions
function initializeOptions(plotOptions) {
	var op = {}
	op.pointSize = plotOptions.hasOwnProperty('pointSize') ? plotOptions.pointSize : 4;
	op.backgroundColor = plotOptions.hasOwnProperty('backgroundColor') ? plotOptions.backgroundColor : 'ivory';
	op.textColor = plotOptions.hasOwnProperty('textColor') ? plotOptions.textColor : 'grey';
	op.highlightColor = plotOptions.hasOwnProperty('highlightColor') ? plotOptions.highlightColor : 'steelblue';
	op.lassoColor = plotOptions.hasOwnProperty('lassoColor') ? plotOptions.lassoColor : 'black';
	op.xLabel = plotOptions.hasOwnProperty('xLabel') ? plotOptions.xLabel : 'x data';
	op.yLabel = plotOptions.hasOwnProperty('yLabel') ? plotOptions.yLabel : 'y data';
	op.plotTitle = plotOptions.hasOwnProperty('plotTitle') ? plotOptions.plotTitle : 'Plot Title';
	op.legendTitle = plotOptions.hasOwnProperty('legendTitle') ? plotOptions.legendTitle : 'Legend Title';
	return op
}

// Initialize plotGeometry
function initializeGeometry(plotGeometry) {
	var geo = {}
	geo.width = plotGeometry.hasOwnProperty('width') ? plotGeometry.width : window.innerWidth * .7;
	geo.height = plotGeometry.hasOwnProperty('height') ? plotGeometry.height : window.innerHeight * .5;
	geo.marginTop = plotGeometry.hasOwnProperty('marginTop') ? plotGeometry.marginTop : 0;
	geo.marginRight = plotGeometry.hasOwnProperty('marginRight') ? plotGeometry.marginRight : 0;
	geo.marginBottom = plotGeometry.hasOwnProperty('marginBottom') ? plotGeometry.marginBottom : 40;
	geo.marginLeft = plotGeometry.hasOwnProperty('marginLeft') ? plotGeometry.marginLeft : 40;
	geo.borderWidth = plotGeometry.hasOwnProperty('borderWidth') ? plotGeometry.borderWidth: 1;
	geo.legendVSpace = plotGeometry.hasOwnProperty('legendVSpace') ? plotGeometry.legendVSpace: 25;
	geo.tickLabelFont = (geo.marginBottom + geo.marginLeft) / 8;
	geo.axisLabelFont = (geo.marginBottom + geo.marginLeft) / 6;
	return geo;
}

// Get the visual width of text (for sizing the tooltip width)
String.prototype.visualLength = function() {
	var ruler = document.getElementById('tooltip-ruler')
	ruler.innerHTML = this;
	return ruler.offsetWidth;
};

// Draw all the points on the points canvas
function drawActualPoints(data, xScale, yScale) {
	var drawCanvas = document.getElementById('plot-points')
	var drawCtx = drawCanvas.getContext('2d')
	data.forEach(function(point) {
		drawPoint(point,drawCtx, xScale, yScale);
	})
}

// Function to estimate distance to use when checking quadtree for
// the point nearest the current mouse position.
function getDistanceCheck(data,xScale,yScale) {
	var xExtent = d3.extent(data.map(function(d) {return d.x}))
	var yExtent = d3.extent(data.map(function(d) {return d.y}))
	var xDiff = ((xExtent[1]) - (xExtent[0]))/100
	var yDiff = ((yExtent[1]) - (yExtent[0]))/100
	var dc = Math.sqrt(xDiff*xDiff+yDiff*yDiff)
	return dc;
}

// Show tooltip when hovering near point
function showTooltip(data,quadtree,distanceCheck,rect) {
	var e = window.event;
	var mouseX = e.pageX - rect.left - 4;
	var mouseY = e.pageY - rect.top - 5;
	var checkMX = canvasPlot.xScale.invert(mouseX); // use zoom scales here
	var checkMY = canvasPlot.yScale.invert(mouseY);
	var closePoint = quadtree.find(checkMX,checkMY,distanceCheck);
	var tipCanvas = document.getElementById('tip');
	var tipCtx = tipCanvas.getContext('2d');
	var highlightCanvas = document.getElementById('highlight-points');
	var highlightCtx = highlightCanvas.getContext('2d');
	if (typeof  closePoint !== 'undefined') {
		// get the data element corresponding to the closest point from quadtree
		var dot = data.filter(function(dp) {return (dp.x == closePoint[0] && dp.y == closePoint[1])})
		dot = dot[0]
		if (typeof dot != 'undefined') {
			// display tooltip
			tipCanvas.style.left = (canvasPlot.xScale(dot.x)+1) + "px"; // use zoom scales here too
			tipCanvas.style.top = (canvasPlot.yScale(dot.y) - 40) + "px";
			tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
			tipCanvas.width = dot.text.visualLength() + 10; // width of text + hard-coded little margin
			tipCanvas.height = 26;
			tipCtx.font = '20px Arial';
			tipCtx.fillText(dot.text, 5, 20);
			// highlight point
			highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
			highlightPoint(dot, highlightCtx, canvasPlot.xScale, canvasPlot.yScale);
			// create tmp array of selected points in order to highlight on heatmap so that already selected points and 
			// moused-over point are highlighted. (this is a little inefficient)
			var tmpSelectedPoints = selectedPoints.slice()
			tmpSelectedPoints.push(dot)
			postSelectLabels(tmpSelectedPoints,'ctrlClick')
			postHighlightPoint(dot);
		}
	} else { 
		tipCanvas.style.left = "-900px"; // move tooltip off view 
		tipCanvas.style.top = "100px";
		highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height); // clear highlight canvas
		postSelectLabels(selectedPoints,'ctrlClick') // make only actually selected points appear on heatmap
	}
}

// Exported function.
// Make plot
//  - Draw points for each batch in the appropriate canvas element
function drawPlot (data,plotGeometry,plotOptions,colorMap) {
	clearPlotArea()
	canvasPlot.plotGeometry = initializeGeometry(plotGeometry); 
	canvasPlot.plotOptions = initializeOptions(plotOptions); 
	const xScale = createXScale(data, d3.zoomIdentity)
	const yScale = createYScale(data, d3.zoomIdentity)
	if (canvasPlot.hasOwnProperty('g_transform')) { // use scales from most recent zoom/pan
		canvasPlot.xScale = canvasPlot.g_transform.rescaleX(xScale); 
		canvasPlot.yScale = canvasPlot.g_transform.rescaleY(yScale); 
	} else { // use scales from original data 
		canvasPlot.xScale = xScale;
		canvasPlot.yScale = yScale;
		d3.select('#catch-zoom').call(d3.zoom().transform, d3.zoomIdentity)
	}
	// define canvases and contexts
	var lassoCanvas = document.getElementById("catch-lasso");
	var lassoCtx = lassoCanvas.getContext("2d");
	var tipCanvas = document.getElementById("tip")
	var tipCtx = tipCanvas.getContext("2d");
	var highlightCanvas = document.getElementById('highlight-points');
	var highlightCtx = highlightCanvas.getContext('2d');
	var selectCanvas = document.getElementById('select-points');
	var selectCtx = selectCanvas.getContext('2d');
	setSize()
	document.getElementById('plot-info-div').style.display = 'block';
	document.getElementById('canvas-plot-wrapper').style.display = 'block';
	createAxes(canvasPlot.data, canvasPlot.xScale, canvasPlot.yScale);
	drawActualPoints(canvasPlot.data, canvasPlot.xScale, canvasPlot.yScale);
	selectedPoints.forEach(function(dot) {
		highlightPoint(dot, selectCtx, canvasPlot.xScale, canvasPlot.yScale);
	})
	clearLegend()
	if (colorMap) {
	    createLegend(colorMap);
	} else {
	    var colors = getColors(canvasPlot.batchIds, canvasPlot.data);
	    createLegend(colors);
	}
	var rect  = lassoCanvas.getBoundingClientRect();
	canvasPlot.initialClosePointDistance = getDistanceCheck(canvasPlot.data,canvasPlot.xScale,canvasPlot.yScale)
	canvasPlot.distanceCheck = canvasPlot.initialClosePointDistance;
	var quadtree = d3.quadtree().addAll(canvasPlot.data.map(function(d) { return [d.x,d.y] }));
	var DmouseX, DmouseY,lastX, lastY, StartDmouseX, StartDmouseY
	// Function to determine if point is within an area being lassoed 
	function pointInPolygon(point, vs) {
		var xi, xj, yi, yj, intersect,
			x = point[0],
			y = point[1],
			inside = false;
		for (var i=0, j=vs.length-1; i<vs.length; j=i++) {
			xi = vs[i][0],
			yi = vs[i][1],
			xj = vs[j][0],
			yj = vs[j][1],
			intersect = ((yi > y) != (yj > y))
				&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
			if (intersect) inside = !inside;
		}
		return inside;
	}
	// Using D3's call(d3.drag()) to handle selecting points when user drags on canvas
	var dragCoords;  // <-- coordiantes of mouse point as we drag
	var selectedByDrag = [] // <-- data points selected by drag
	var isDrawing = false
	const zoomCursor = "url('img/zoom-pan-black-30x30.png'),pointer";
	const lassoCursor = "url('img/lasso-arrow-30x30.png') 4 5,pointer"
	function lassostart() {
		dragCoords = []
		selectedByDrag = []
		if (!d3.event.sourceEvent.metaKey && !d3.event.sourceEvent.ctrlKey) {
			selectedPoints = []
			lassoCtx.clearRect(0, 0, width, height);
			selectCtx.clearRect(0, 0, width, height);
		}
		StartDmouseX = d3.event.x  - canvasPlot.plotGeometry.marginLeft;
		StartDmouseY = d3.event.y;
		lastX = StartDmouseX; 
		lastY = StartDmouseY; 
	}
	function lassoed() {
		selectedByDrag = []
		isDrawing = true;
		DmouseX = d3.event.x  - canvasPlot.plotGeometry.marginLeft;
		DmouseY = d3.event.y;
		var currentX = canvasPlot.xScale.invert(DmouseX); // use zoom scales here
		var currentY = canvasPlot.yScale.invert(DmouseY);
		dragCoords.push([currentX, currentY])
		canvasPlot.data.forEach(function(d) {
			if (pointInPolygon([d.x,d.y], dragCoords)) {
				highlightPoint(d, selectCtx, canvasPlot.xScale, canvasPlot.yScale) 
				selectedByDrag.push(d)
			}
		})
		lassoCtx.beginPath();
		lassoCtx.strokeStyle = plotOptions.lassoColor;
		lassoCtx.lineWidth = 2;
		lassoCtx.moveTo(lastX, lastY)
		lassoCtx.lineTo(DmouseX, DmouseY)
		lassoCtx.closePath();
		lassoCtx.stroke()
		lastX = DmouseX;
		lastY = DmouseY;
	}
	function lassoend() {
		if (isDrawing == true) {
			lassoCtx.beginPath();
			lassoCtx.strokeStyle = plotOptions.lassoColor;
			lassoCtx.lineWidth = 2;
			lassoCtx.moveTo(DmouseX, DmouseY)
			lassoCtx.lineTo(StartDmouseX, StartDmouseY)
			lassoCtx.closePath();
			lassoCtx.stroke()
			isDrawing = false;
		}
		// add points selected by dragging to the list of selected points
		selectedByDrag.forEach(function(elem) {
			selectedPoints.push(elem)
		})
		postSelectLabels(selectedPoints,'ctrlClick') // make only actually selected points appear on heatmap
	}
	var subsetData 
	var subsetHighlight; // subset of highlighted points to draw while zooming
	function zoomstart() {
		if (canvasPlot.data.length > 6000) { // then get subsets of points to plot during zoom
			subsetData = getSmallerData(canvasPlot.data); 
			subsetHighlight = getSmallerData(selectedPoints); 
		} else { // else things should be fast enough with all points
			subsetData = canvasPlot.data;
			subsetHighlight = selectedPoints;
		}
	}
	function zoomed() {
		lassoCtx.clearRect(0, 0, width, height);
		selectCtx.clearRect(0, 0, width, height);
		var transform = d3.event.transform;
		canvasPlot.xScale = transform.rescaleX(xScale); // use D3 transform to get 
		canvasPlot.yScale = transform.rescaleY(yScale); // x and y scales for zoom
		canvasPlot.distanceCheck = canvasPlot.initialClosePointDistance / transform.k; 
		batchCtx.save()
		batchCtx.clearRect(0, 0, width, height);
		clearAxes()
		createAxes(canvasPlot.data,canvasPlot.xScale,canvasPlot.yScale);
		subsetData.forEach(function(point) { // only plot subset while zooming
			drawPoint(point, batchCtx, canvasPlot.xScale, canvasPlot.yScale);
		})
		batchCtx.restore();
		// zoom the select-points canvas
		selectCtx.clearRect(0, 0, selectCanvas.width, selectCanvas.height);
		subsetHighlight.forEach(function(dot) { // only highlight subset while zooming
			highlightPoint(dot, selectCtx, canvasPlot.xScale, canvasPlot.yScale);
		})
		// clear highlights and tooltips
		highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
		tipCanvas.style.left = "-900px"; // move tooltip off view 
		tipCanvas.style.top = "100px";
		canvasPlot.g_transform = transform; // cache the transform
	}
	function zoomend() {
		canvasPlot.data.forEach(function(point) {
			drawPoint(point, batchCtx, canvasPlot.xScale, canvasPlot.yScale);
		})
		selectedPoints.forEach(function(dot) {
			highlightPoint(dot, selectCtx, canvasPlot.xScale, canvasPlot.yScale);
		})
	}
	function doTheLasso() {
		d3.select('#catch-zoom')
			.call(d3.drag()
				.on("start", lassostart)
				.on("drag", lassoed)
				.on("end", lassoend)
			)
	}
	var maxZoom = 50
	function doTheZoom() {
		d3.select('#catch-zoom')
			//.call(d3.zoom().transform, d3.zoomIdentity)
			.call(d3.zoom()
				.scaleExtent([0,maxZoom])
				.on("start", zoomstart)
				.on("zoom", zoomed)
				.on("end", zoomend)
			) 
	}
	function clearD3Events() {
		d3.select('#catch-zoom')
			.on(".start", null)
			.on(".drag", null)
			.on(".zoom", null)
			.on(".end", null)
	}

	var theMode = 'zoom'

	document.getElementById('zoom-button').addEventListener('click', (event) => {
		document.getElementById('zoom-button').classList.add('selected-icon')
		document.getElementById('lasso-button').classList.remove('selected-icon')
		document.getElementById('catch-zoom').style.cursor = zoomCursor; 
		clearD3Events()
		doTheZoom()
		theMode = 'zoom'
	}, false)
	document.getElementById('lasso-button').addEventListener('click', (event) => {
		document.getElementById('lasso-button').classList.add('selected-icon')
		document.getElementById('zoom-button').classList.remove('selected-icon')
		document.getElementById('catch-zoom').style.cursor = lassoCursor;
		clearD3Events()
		doTheLasso()
		theMode = 'lasso'
	}, false)
	/*
			Listen for keydown. If 's' is pressed, toggle between 'zoom/pan' and 'lasso' settings
	*/
	document.addEventListener('keydown', (event) => {
		var key = event.key || event.keyCode;
		if (key != 's') {return}
		if (theMode == 'zoom') {  // if mode was zoom, change to lasso
			document.getElementById('lasso-button').classList.add('selected-icon')
			document.getElementById('zoom-button').classList.remove('selected-icon')
			document.getElementById('catch-zoom').style.cursor = lassoCursor; 
			clearD3Events()
			doTheLasso()
			theMode = 'lasso'
		} else { // else mode was lasso, change to zoom
			document.getElementById('zoom-button').classList.add('selected-icon')
			document.getElementById('lasso-button').classList.remove('selected-icon')
			document.getElementById('catch-zoom').style.cursor = zoomCursor; 
			clearD3Events()
			doTheZoom()
			theMode = 'zoom'
		}
	})
	var pointsCanvas = document.getElementById('plot-points')
	var batchCtx = pointsCanvas.getContext('2d')
	var width = pointsCanvas.width
	var height = pointsCanvas.height
	var mouseX, mouseY
	// function to get data small enough for zooming 
	function getSmallerData(array) {
		var nth;
		if (array.length < 12000) { 
			nth = 2;
		} else if (array.length < 100) {
			nth = 1;
		} else {
			var nth = Math.floor(array.length / 6000) ;
		}
		//if (nth < 2 && array.length > 100) { nth = 10 }  // this is mostly for selected points
		return array.filter(function(e,i) { return i % nth === nth - 1 })
	}
	document.getElementById('catch-zoom').addEventListener('mousemove', function() {showTooltip(canvasPlot.data,quadtree,canvasPlot.distanceCheck,rect)}, false)
	// hide tooltips when mouse moves off canvases:
	document.getElementById('catch-zoom').addEventListener('mouseout', function() { 
		tipCanvas.style.left = "-900px"; // move tooltip off view 
		tipCanvas.style.top = "100px";
	}, false)
	document.getElementById('zoom-button').click();
} /* end function drawPlot */
