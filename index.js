var path = require('path');
var mkdirp = require('mkdirp');
var includePathSearcher = require('include-path-searcher');
var CachingWriter = require('broccoli-caching-writer');
var mapSeries = require('promise-map-series');
var dargs = require('dargs');
var spawn = require('win-spawn');
var Promise = require('rsvp').Promise;

module.exports = SassCompiler;
SassCompiler.prototype = Object.create(CachingWriter.prototype);
SassCompiler.prototype.constructor = SassCompiler;

function SassCompiler (sourceTrees, inputFile, outputFile, options) {
  if (!(this instanceof SassCompiler)) return new SassCompiler(sourceTrees, inputFile, outputFile, options);
  this.sourceTrees = sourceTrees;
  this.inputFile = inputFile;
  this.outputFile = outputFile;
  options = options || {};
  this.sassOptions = {
    imagePath: options.imagePath,
    style: options.outputStyle,
    sourceComments: options.sourceComments,
    sourcemap: options.sourceMap,
    bundleExec: options.bundleExec,
    require: options.require,
    loadPath: options.loadPath || [],
    cacheLocation: options.cacheLocation,
    precision: options.precision,
    unixNewlines: options.unixNewlines
  };
}

SassCompiler.prototype.write = function (readTree, destDir) {
  return mapSeries(this.sourceTrees, function (tree) {
    this.inputTree = tree;
    return CachingWriter.prototype.write.call(this, readTree, destDir);
  }, this);
};

SassCompiler.prototype.updateCache = function (srcDir, destDir) {
  var bundleExec = this.sassOptions.bundleExec;
  var destFile = destDir + '/' + this.outputFile;
  mkdirp.sync(path.dirname(destFile));

  var inputFile = includePathSearcher.findFileSync(this.inputFile, srcDir);

  // srcDir.unshift(path.dirname(inputFile));
  this.sassOptions.loadPath = this.sassOptions.loadPath.concat(srcDir);
  var passedArgs = dargs(this.sassOptions, ['bundleExec']);
  var args = [
    'sass',
    '--no-cache',
    inputFile,
    destFile
  ].concat(passedArgs);

  if(bundleExec) {
    args.unshift('bundle', 'exec');
  }

  if(path.extname(this.inputFile) === '.css') {
    args.push('--scss');
  }

  return new Promise(function(resolve, reject) {
    var cmd = args.shift();
    var cp = spawn(cmd, args);

    function isWarning(error) {
      return /DEPRECATION WARNING/.test(error.toString()) || /WARNING:/.test(error.toString());
    }

    cp.on('error', function(err) {
      if (isWarning(err)) {
        console.warn(err);
        return;
      }

      console.error('[broccoli-ruby-sass] '+ err);
      reject(err);
    });

    var errors = '';

    cp.on('data', function(data) {
      // ignore deprecation warnings

      if (isWarning(err)) {
        console.warn(err);
        return;
      }

      errors += data;
    });

    cp.stderr.on('data', function(data) {
      if (!isWarning(data)) {
        errors += data;
      } else {
        console.warn('[broccoli-ruby-sass] ' + data);
      }
    });

    cp.on('close', function(code) {
      if(errors) {
        reject(errors);
      }

      if(code > 0) {
        reject('broccoli-ruby-sass exited with error code ' + code);
      }

      resolve(destDir);
    });
  });
};
