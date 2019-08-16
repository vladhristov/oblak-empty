'use strict';

const path = require('path');
const fs = require('fs');
const format = require('prettier-eslint');
const { inspect } = require('util');

const constGenerators = {
	domain: (cache, domain) => {
		cache.events = cache.events || {
			domain: {},
			readmodels: {},
		};

		cache.commands = cache.commands || {
			domain: {},
		};

		const { events, commands } = cache;

		Object.keys(domain).forEach(ctx => Object.keys(domain[ctx]).forEach(agg => ['commandRejected', ...Object.keys(domain[ctx][agg].events)].forEach((event) => {
			events.domain[ctx] = events.domain[ctx] || {};
			events.domain[ctx][agg] = events.domain[ctx][agg] || {};
			events.domain[ctx][agg][event] = `domain.${ctx}.${agg}.${event}`;
		})));

		Object.keys(domain).forEach(ctx => Object.keys(domain[ctx]).forEach(agg => Object.keys(domain[ctx][agg].commands).forEach((command) => {
			commands.domain[ctx] = commands.domain[ctx] || {};
			commands.domain[ctx][agg] = commands.domain[ctx][agg] || {};
			commands.domain[ctx][agg][command] = `domain.${ctx}.${agg}.${command}`;
		})));
	},
	readmodels(cache, readmodels) {
		cache.events = cache.events || {
			domain: {},
			readmodels: {},
		};

		const { events } = cache;

		Object.keys(readmodels).forEach(type => Object.keys(readmodels[type]).forEach((readmodel) => {
			events.readmodels[type] = events.readmodels[type] || {};
			const base = `readmodel.${type}.${readmodel}`;
			events.readmodels[type][readmodel] = {
				create: `${base}.create`,
				update: `${base}.update`,
				delete: `${base}.delete`,
				any: `${base}.*`,
			};
		}));
	},
};

const saveConsts = (consts, filePath) => {
	const str = format({ text: `'use strict';\n\n/**\n * Generated by Oblak CLI\n */\n\nmodule.exports = ${inspect(consts, { depth: null, compact: false })}`, filePath });
	fs.writeFileSync(filePath, str, 'utf8');
};

const generateDataFile = (oblak) => {
	const filePath = path.join(process.cwd(), './oblak-data.js');
	fs.writeFileSync(filePath, 'module.exports = {};', 'utf8');

	// prepare live cache to enable files to reuse component
	const cache = require(filePath) //eslint-disable-line

	const hooks = [
		oblak.addHook('afterModuleLoad', function moduleLoaded({ name }) {
			if (!constGenerators[name])
				return;
			constGenerators[name](cache, this[name]);
		}),
		// generatConsts(cache, oblak, arg);

		oblak.addHook('afterLoad', () => {
			saveConsts(cache, filePath);
			hooks.forEach(h => h());
		}),
	];
};

module.exports = (oblak) => {
	generateDataFile(oblak);
};
