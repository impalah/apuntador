# Makefile for Apuntador development

.PHONY: install dev build preview lint format stylelint typecheck test test-e2e coverage clean docs docs-api docs-dev docs-build docs-serve

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

format:
	npm run format

stylelint:
	npm run stylelint

typecheck:
	npm run typecheck

test:
	npm run test

test-e2e:
	npm run test:e2e

coverage:
	npm run coverage

# Documentation targets
docs-api:
	npm run docs:api

docs-dev:
	npm run docs:dev

docs-build:
	npm run docs:build

docs-serve:
	npm run docs:serve

docs: docs-api docs-build

clean:
	rm -rf node_modules dist coverage test-results playwright-report .nyc_output docs/api docs/.vitepress/dist
	npm cache clean --force

clean-all: clean
	rm -f package-lock.json
	
clean-generated:
	rm -rf dist coverage test-results playwright-report docs/api docs/.vitepress/dist
	
clean-deps:
	rm -rf node_modules package-lock.json
	npm cache clean --force
