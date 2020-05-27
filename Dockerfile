##
## Serve ScatterPlotPlugin files from apache web server
##

FROM httpd

ENV SERVE_DIR=/usr/local/apache2/htdocs/ScatterPlotPlugin

RUN mkdir $SERVE_DIR; mkdir $SERVE_DIR/img; mkdir $SERVE_DIR/resources; mkdir $SERVE_DIR/demo_data

## copy the files needed for the plugin:
COPY canvasDraw.js canvasDraw.css index.html ngchm.js vanodi.js  $SERVE_DIR/
COPY img $SERVE_DIR/img
COPY resources $SERVE_DIR/resources

## copy the demo page and its data:
COPY demo-only.html $SERVE_DIR
COPY demo_data/data.tsv $SERVE_DIR/demo_data/data.tsv


