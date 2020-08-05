#!/usr/local/bin/python3

import random 
import string
from lorem.text import TextLorem
import sys

##
## Make some quick and dirty demo data (of variable size)
## for debugging and testing
##

data_file = 'data.tsv'
xmin = 300  # minimum and maximum values for x and y taken
xmax = 350  # from the size of the canvas on index.html
ymin = 0
ymax = 650
nBatches = 20    #<-- number of batches to generate
mux = [ random.uniform(-500,500) for i in range(nBatches) ]
sigmax = [ random.uniform(20,30) for i in range(nBatches) ]
muy = [ random.uniform(-500,500) for i in range(nBatches) ]
sigmay = [ random.uniform(10,40) for i in range(nBatches) ]
nPointsB = [ int(random.uniform(20,50)) for i in range(nBatches) ]

## crerate colors for each batch at random 
colorDict = {}
for i in range(nBatches):
	r = lambda: random.randint(0,255)
	colorDict[i] = '#%02X%02X%02X' % (r(),r(),r())

lorem = TextLorem(wsep='', srange=(2,3))
batchNames = []
for batch in range(nBatches):
	batchNames.append(lorem.sentence())

with open(data_file,'w') as f:
	f.write("id\tx\ty\tbatch\tcolor\n")
	f.write('0,0\t0\t0\t1\t' + colorDict[1] + '\n')
	f.write('100,100\t100\t100\t1\t' + colorDict[1] + '\n')
	for batch in range(nBatches):
		f.write('100.5,100.5,'+batchNames[batch]+'\t100.5\t100.5\t' + batchNames[batch] +'\t' + colorDict[batch] +'\n')
	for batch in range(nBatches):
		print ('Cardinality of ',batch,': ',nPointsB[batch]+1)
		for kount in range(nPointsB[batch]):
			xval = str(round(random.gauss(mux[batch],sigmax[batch]),1))
			yval = str(round(random.gauss(muy[batch],sigmay[batch]),1))
			color = colorDict[batch]
			id_string = xval+", "+yval+', '+str(batch)
			#id_string = 'batch: '+batchNames[batch]+', npoints: '+str(nPointsB[batch])
			f.write(id_string+"\t"+xval+"\t"+yval+"\t"+batchNames[batch]+"\t"+color+"\n")

print ('total number of points: ',sum(nPointsB)+nBatches+2)
