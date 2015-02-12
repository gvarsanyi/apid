
compile: npm
	@rm js/ -rf
	@node_modules/.bin/coffee --bare --compile --no-header --output js/ coffee/

npm:
	@npm install

test: compile
	@node example/js/cli.js --daemon-stop
	@node example/js/cli.js
	@node_modules/.bin/coffee example/coffee/cli.coffee --daemon-restart
	@echo 'DONE'
