
compile:
	rm js/ -rf
	coffee -b -c -o js/ coffee/

test:
	node example/js/app.js