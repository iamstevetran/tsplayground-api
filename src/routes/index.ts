'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as uuid from 'node-uuid';
import * as rimraf from 'rimraf';
import { exec, execSync } from 'child_process';
import * as sha1 from 'sha1';

const router = express.Router();
const rootPath = path.join(__dirname, '../');
const maxBuffer = 1024 * 500;

/* GET home page. */
router.get('/', (req, res, next) => {
	res.render('index', { title: 'Express' });

});

router.get('/:tsver/:code', (req, res, next) => {
	let tsVersion = req.params.tsver;
	const code = new Buffer(req.params.code, 'base64').toString('utf8');
	const sandboxDir = path.join(rootPath, 'ts-sandboxes');
	if (!fs.existsSync(sandboxDir)) {
		fs.mkdirSync(sandboxDir);
	}

	exec('npm view typescript@'.concat(tsVersion), { maxBuffer: maxBuffer }, (error, stdout, stderr) => {
		let data = {};
		try {

			if (!stdout || error || stderr) {
				console.error(error, stderr);
				res.json(data);
				return;
			}

			const npmInfo = stdout.replace(/[ \t]*[a-z]+\@(\d+\.){1,}\d+/g, '<<split>>')
				.replace(/\.\.\. \d+ more items /g, '')
				.replace(/(\n|\r\n)/g, '')
				.split('<<split>>')
				.filter(item => item);

			if (!npmInfo.length) {
				res.json(data);
				return;
			}

			data = new Function("return " + npmInfo[npmInfo.length - 1])();

			tsVersion = Object.keys(data["time"]).filter(version => (new RegExp('^' + tsVersion.replace('.', '\\.') + '((?!dev|insider).)*$')).test(version))[0];
			console.info('ts version: ' + tsVersion);
			const tsDir = path.join(sandboxDir, tsVersion);
			const tsConfigTemplate = path.join(rootPath, 'templates/tsconfig.tmpl.json');

			const tsDirUuid = (req['user'] && req['user'].sub) ? req['user'].sub.replace(/[^\.\-a-zA-Z0-9]/g, '.') : uuid.v4();
			const tsUuid = sha1(req.params.code);
			const srcDir = path.join(tsDir, 'src');
			const inputDir = path.join(srcDir, tsDirUuid);
			const tsFile = path.join(inputDir, tsUuid + '.ts');
			const jsFile = path.join(tsDir, 'dist', tsDirUuid, tsUuid + '.js')

			const reponseCompiledCode = () => {
				data = {
					compiled: fs.readFileSync(jsFile, { encoding: 'utf-8' })
				};

				res.json(data);
			}

			if (fs.existsSync(jsFile)) {
				reponseCompiledCode();
				return;
			}

			if (!fs.existsSync(tsDir)) {
				fs.mkdirSync(tsDir);
				// Generate tsconfig for the first time
				if (fs.existsSync(tsConfigTemplate)) {
					let tsconfig = fs.readFileSync(tsConfigTemplate, { encoding: 'utf-8' });

					fs.writeFileSync(path.join(tsDir, 'tsconfig.json'), tsconfig, { encoding: 'utf-8' });
					execSync('npm init --yes', { cwd: tsDir });
					execSync('npm install --save typescript@' + tsVersion, { cwd: tsDir });
					console.info('installed typescript');
				}
			}

			if (!fs.existsSync(srcDir)) {
				fs.mkdirSync(srcDir);
			}

			if (!fs.existsSync(inputDir)) {
				fs.mkdirSync(inputDir);
			}

			if (!fs.existsSync(tsFile)) {
				fs.writeFileSync(tsFile, code, { encoding: 'utf-8' });
			}

			exec(path.join(tsDir, 'node_modules', '.bin', 'tsc'), { cwd: tsDir }, (error, stdout, stderr) => {
				console.info('tsc ran');

				rimraf(inputDir, () => { console.info('removed src') });

				if (error || stderr) {
					res.json(data);
					console.info('error');
					console.error(error);
					console.error(stderr);
					return;
				}

				reponseCompiledCode();
			});

		} catch (e) {
			console.error(e);
			res.json(data);
			return;
		}
	});
});

export default router;
