
compile: npm
	rm js/ -rf
	node_modules/.bin/coffee --bare --compile --no-header --output js/ coffee/

npm:
	npm install

test: compile
	node example/js/app.js --daemon-restart
	node example/js/app.js
	node example/js/app.js --daemon-stop
	node_modules/.bin/coffee example/coffee/app.coffee --daemon-restart
	node_modules/.bin/coffee example/coffee/app.coffee
	node_modules/.bin/coffee example/coffee/app.coffee --daemon-stop
	@echo 'DONE'
