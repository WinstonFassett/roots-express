var fs                  = require('fs'),
    readdirp            = require('readdirp'),
    _                   = require('underscore'),
    lastChange          = Math.floor((new Date).getTime()),
    watchedFiles        = {},
    watchedDirectories  = {},
    checkDirPause       = 2000; //this is due to the unix filesystem checking every 2s -- via wiki

/**
*
* Watches the directory passed and its contained files
*
**/
function watchDirectories(directories, cb, partial) {
  directories.forEach(function(dir) {
    readdirp({ root: dir, directoryFilter: '!components' }, function(err, res) {
      res.files.forEach(function(file) {
        watchFile(file, cb);
      });
    });
  });
  !partial && setInterval(function(){checkDirectories(cb)}, checkDirPause);
}

/**
*
* Checks to see if something in the directory has changed
*
**/
function checkDirectories(cb) {
  _.each(watchedDirectories, function(lastModified, path) {
    fs.stat(path, function(err, stats) {
      var statsStamp = (new Date(stats.mtime)).getTime();
      if (statsStamp != lastModified) {
        watchedDirectories[path] = statsStamp;
        watchDirectories([path], cb, true);
      }
    });
  });
}

/**
*
* Watches the file passed and its containing directory
*
**/
function watchFile(file, cb) {
  watchDirectory(file);
  !watchedFiles[file.fullPath] && fs.watch(file.fullPath, function(e, filename) {
    watchedFiles[file.fullPath] = true;
    checkLastChange(cb);
  });
}


/**
*
* Sets up a store of the folders being watched
* and saves the last modification timestamp for it
*
**/
function watchDirectory(file) {
  var directory = file.fullParentDir;
  if (!watchedDirectories[directory]) {
    fs.stat(directory, function(err, stats) {
      watchedDirectories[directory] = (new Date(stats.mtime)).getTime();; //saves a ref to the last modification time
    });
  }
}

/**
*
* Fix for duplicate file change calls
* http://stackoverflow.com/questions/10468504/why-fs-watchfile-called-twice-in-node
*
**/
function checkLastChange(cb) {
  var minTime = 500; // in miliseconds
  var currentTime = Math.floor((new Date).getTime());
  if (currentTime - lastChange > minTime) {
    lastChange = currentTime;
    cb();
  }
}

exports.watchDirectories = watchDirectories;