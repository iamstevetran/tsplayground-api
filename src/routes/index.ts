'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as uuid from 'node-uuid'; 
import * as rimraf from 'rimraf';
import { exec } from 'child_process';

const router = express.Router();
const rootPath = path.join(__dirname, '../');


/* GET home page. */
router.get('/', (req,res,next) => {
  res.render('index', {title: 'Express'});

});

router.get('/:tsver/:code', (req,res,next) => {
  let tsVersion = req.params.tsver;
  const code =  new Buffer(req.params.code, 'base64').toString('utf8');
  const sandboxDir = path.join(rootPath, 'ts-sandboxes');
  if (!fs.existsSync(sandboxDir)){
    fs.mkdirSync(sandboxDir);
	}

	exec('npm view typescript@'.concat(tsVersion), (error, stdout, stderr) => {
		let data = {};
		if (!stdout || error || stderr) {
			res.json(data);
			return;
		}

		const npmInfo = stdout.replace(/[ \t]*[a-z]+\@(\d*\.){1,}\d/g, '<<split>>')
			.replace(/\.\.\. \d+ more items /g, '')
			.replace(/(\n|\r\n)/g, '')
			.split('<<split>>')
			.filter(item => item);
		if (!npmInfo.length) {
			res.json(data);
			return;
		}

		data = new Function("return " + npmInfo[npmInfo.length - 1])();

		tsVersion = Object.keys(data["time"]).filter(version => (new RegExp('^' + tsVersion.replace('.', '\\.') + '((?!dev).)*$')).test(version))[0];

		const tsDir = path.join(sandboxDir, tsVersion);
		const tsConfigTemplate = path.join(rootPath, 'templates/tsconfig.tmpl.json');

  	const tsDirUuid = uuid.v4();
  	const tsUuid = uuid.v4();
  	const srcDir = path.join(tsDir, 'src');
  	const inputDir = path.join(srcDir, tsDirUuid);
		if (!fs.existsSync(tsDir)){
	    fs.mkdirSync(tsDir);
	    // Generate tsconfig for the first time
	    if (fs.existsSync(tsConfigTemplate)) {
	    	let tsconfig = fs.readFileSync(tsConfigTemplate, {encoding: 'utf-8'});

	    	fs.writeFileSync(path.join(tsDir, 'tsconfig.json'), tsconfig, {encoding: 'utf-8'});
	    }
		}

		if (!fs.existsSync(srcDir)) {
			fs.mkdirSync(srcDir);
		}

		fs.mkdirSync(inputDir);
		fs.writeFile(path.join(inputDir, tsUuid + '.ts'), code, {encoding: 'utf-8'});

		exec('npm init --yes', {cwd: tsDir},  (error, stdout, stderr) => {
			exec('npm install --save typescript@' + tsVersion, {cwd: tsDir},  (error, stdout, stderr) => {
				console.log('installed typescript');
				exec(path.join(tsDir, 'node_modules','.bin', 'tsc'), {cwd: tsDir}, (error, stdout, stderr) => {
					console.log('tsc ran');

					rimraf(inputDir, () => {console.log('removed')});
					
					if (error || stderr) {
						res.json(data);
						console.log('error');
						console.error(error);
						console.error(stderr);
						return;
					}

					data = {
						compiled: fs.readFileSync(path.join(tsDir, 'dist', tsDirUuid, tsUuid + '.js'), {encoding: 'utf-8'})
					}

					res.json(data);
				});
			});
		});
	})
});

export default router;
