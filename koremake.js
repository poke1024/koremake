var version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);

if (version < 4.0) {
	console.log('Sorry, this requires at least node version 4.0.');
	process.exit(1);
}

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

String.prototype.replaceAll = function (find, replace) {
	return this.replace(new RegExp(escapeRegExp(find), 'g'), replace);
};

const os = require('os');
const Options = require('./Options.js');
const Platform = require('./Platform.js');
const GraphicsApi = require('./GraphicsApi.js');
const VisualStudioVersion = require('./VisualStudioVersion.js');
const VrApi = require('./VrApi.js');

let defaultTarget;
if (os.platform() === "linux") {
	defaultTarget = Platform.Linux;
}
else if (os.platform() === "win32") {
	defaultTarget = Platform.Windows;
}
else {
	defaultTarget = Platform.OSX;
}

const options = [
	{
		full: 'from',
		value: true,
		description: 'Location of your project',
		default: '.'

	},
	{
		full: 'to',
		value: true,
		description: 'Build location',
		default: 'build'
	},
	{
		full: 'target',
		short: 't',
		value: true,
		description: 'Target platform',
		default: defaultTarget
	},
	{
		full: 'vr',
		value: true,
		description: 'Target VR device',
		default: VrApi.None
	},
	{
		full: 'emcc',
		value: true,
		description: 'Location of emscripten shader compiler',
	},
	{
		full: 'pch',
		description: 'Use precompiled headers for C++ targets',
		value: false
	},
	{
		full: 'intermediate',
		description: 'Intermediate location for object files.',
		value: true,
		default: '',
		hidden: true
	},
	{
		full: 'graphics',
		short: 'g',
		description: 'Graphics api to use',
		value: true,
		default: GraphicsApi.Direct3D9
	},
	{
		full: 'visualstudio',
		short: 'v',
		description: 'Version of Visual Studio to use',
		value: true,
		default: VisualStudioVersion.VS2015
	},
	{
		full: 'nokrafix',
		description: 'Switch off the new shader compiler',
		value: false
	},
	{
		full: 'compile',
		description: 'Compile executable',
		value: false
	},
	{
		full: 'run',
		description: 'Run executable',
		value: false
	},
	{
		full: 'update',
		description: 'Update Kore and it\'s submodules',
		value: false
	}
];

var parsedOptions = {

};

function printHelp() {
	console.log('khamake options:\n');
	for (let option of options) {
		if (option.hidden) continue;
		if (option.short) console.log('-' + option.short + ' ' + '--' + option.full);
		else console.log('--' + option.full);
		console.log(option.description);
		console.log();
	}
}

for (let option of options) {
	if (option.value) {
		parsedOptions[option.full] = option.default;
	}
	else {
		parsedOptions[option.full] = false;
	}
}

let args = process.argv;
for (let i = 2; i < args.length; ++i) {
	let arg = args[i];

	if (arg[0] == '-') {
		if (arg[1] == '-') {
			if (arg.substr(2) === 'help') {
				printHelp();
				process.exit(0);
			}
			for (let option of options) {
				if (arg.substr(2) === option.full) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
		else {
			if (arg[1] === 'h') {
				printHelp();
				process.exit(0);
			}
			for (let option of options) {
				if (option.short && arg[1] === option.short) {
					if (option.value) {
						++i;
						parsedOptions[option.full] = args[i];
					}
					else {
						parsedOptions[option.full] = true;
					}
				}
			}
		}
	}
	else {
		parsedOptions.target = arg;
	}
}

if (parsedOptions.graphics === GraphicsApi.OpenGL) {
	parsedOptions.graphics = GraphicsApi.OpenGL2;
}

if (parsedOptions.run) {
	parsedOptions.compile = true;
}

if (!parsedOptions.emcc && parsedOptions.target === Platform.HTML5) {
	console.error("Please set the emcc path.");
	process.exit(0);
}

if (parsedOptions.update) {
	console.log("Updating everything...");
	require('child_process').spawnSync('git', ['submodule', 'foreach', '--recursive', 'git', 'pull', 'origin', 'master'], { stdio: 'inherit', stderr: 'inherit' });	
	process.exit(0);
}

require('./main.js').run(
	parsedOptions,
{
	info: console.log,
	error: console.log
}, function () { });
