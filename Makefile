build:
	cat js/ender.js js/underscore-min.js \
		js/toolbit.js \
		js/sphericalmercator.js js/modestmaps.min.js \
		js/wax.mm.js js/utfgridquery.js js/easey.js js/site.js > site.js
	uglifyjs site.js > site.min.js
	#xls2csv.py -i source/155424.xls -o csv/155424.0.csv -e -p ',' -s 0
	#xls2csv.py -i source/155424.xls -o csv/155424.1.csv -e -p ',' -s 1
	#xls2csv.py -i source/155424.xls -o csv/155424.2.csv -e -p ',' -s 2
	#xls2csv.py -i source/155424.xls -o csv/155424.3.csv -e -p ',' -s 3
	#xls2csv.py -i source/155424.xls -o csv/155424.4.csv -e -p ',' -s 4
	#xls2csv.py -i source/155424.xls -o csv/155424.5.csv -e -p ',' -s 5
	#xls2csv.py -i source/155424.xls -o csv/155424.6.csv -e -p ',' -s 6
	#xls2csv.py -i source/155424.xls -o csv/155424.7.csv -e -p ',' -s 7
	#xls2csv.py -i source/155424.xls -o csv/155424.8.csv -e -p ',' -s 8
	#xls2csv.py -i source/155424.xls -o csv/155424.9.csv -e -p ',' -s 9
	# node sep.js csv/155424.0.csv
	# node sep.js csv/155424.1.csv
	# node sep.js csv/155424.2.csv
	# node sep.js csv/155424.3.csv
	# node sep.js csv/155424.4.csv
	# node sep.js csv/155424.5.csv
	# node sep.js csv/155424.6.csv
	# node sep.js csv/155424.7.csv
	# node sep.js csv/155424.8.csv
	# node sep.js csv/155424.9.csv
