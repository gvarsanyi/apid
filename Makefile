
compile: npm
	rm js/ -rf
	coffee --bare --compile --no-header --output js/ coffee/

npm:
	npm install

test: compile
	node example/js/app.js --daemon-restart
	node example/js/app.js
	node example/js/app.js --daemon-stop
	coffee example/coffee/app.coffee --daemon-restart
	coffee example/coffee/app.coffee
	coffee example/coffee/app.coffee --daemon-stop
	@echo 'DONE'
