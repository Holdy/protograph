var fs = require('fs');
var os = require('os');
var path = require('path');
var mkdirp = require('mkdirp');

var subjectPart      = 0;
var relationshipPart = 1;
var objectPart       = 2;

var md = require('./metadata');

function ensureStoreMeta(atom) {

    if (!atom.storeMeta) {

        if (atom.r) {
            atom.storeMeta = md.create(atom.r);
        } else if (atom.s) {
            atom.storeMeta = md.createString(atom.s);
        } else if (atom.n) {
            atom.storeMeta = md.createNumber(atom.n);
        }
    }

    return atom.storeMeta;
}

function processItemCallback(dataWrapper, nextIndex, dataTemplate, dataFilter, itemCB, completeCB) {
    if (dataWrapper.data && nextIndex < dataWrapper.data.length) {

        var item = dataWrapper.data[nextIndex];

        if (dataFilter(dataTemplate, item)) {

            itemCB(item, function(end) {
                if (end === true) {
                    return completeCB(null, {natural: false});
                } else {
                    return processItemCallback(dataWrapper, ++nextIndex, dataTemplate, dataFilter, itemCB, completeCB);
                }
            });

        } else {
            return processItemCallback(dataWrapper, ++nextIndex, dataTemplate, dataFilter, itemCB, completeCB);
        }
    } else {
        //todo next file .
        return completeCB(null, {natural: true})
    }
}

function getImpl(options, fact, itemCallback, completeCallback) {
    if (!fact[objectPart] || fact[subjectPart]) {
        getObjectImpl(options, fact, itemCallback, completeCallback);
    } else if  (!fact[subjectPart]) {
        getSubjectImpl(options, fact, itemCallback, completeCallback);
    } else {
        completeCallback(new Error('Unimplemented get() combination.'));
    }
}

function getFileInfo(subRoot, primary, secondary) {
    var relationStoreInfo = ensureStoreMeta(primary);
    var fullDirectoryPath = path.join(subRoot, relationStoreInfo.directory);

    var objStoreInfo = ensureStoreMeta(secondary);
    var fileName = path.join(fullDirectoryPath, relationStoreInfo.fileName + '_' + objStoreInfo.fileKey + '.json');

    return {directoryName: fullDirectoryPath, 'fileName': fileName};
}

function getSubjectImpl(options, fact, itemCallback, completeCallback) {
    // determine the reverse-file where these facts would be stored.
    var fileInfo = getFileInfo(options.reverseRoot, fact[relationshipPart], fact[objectPart]);


    var wrappingItemCallback = function(item, itemDone) {
        itemCallback([item, fact[relationshipPart], fact[objectPart]], itemDone);
    };


    if (isFileSync(fileInfo.fileName)) {
        var content = require(fileInfo.fileName);
        processItemCallback(content, 0, null, matchesAll, wrappingItemCallback, completeCallback);
    } else {
        completeCallback(null, {natural:true});
    }
}


function matchesR(a,b) {
    return a.r === b.r;
}

function matchesN(a,b) {
    return a.n == b.n;
}

function matchesS(a,b) {
    return a.s == b.s;
}

function matchesAll(a,b) {
    return true;
}

function getObjectImpl(options, fact, itemCallback, completeCallback) {
    // determine the file where these facts would be stored.
    var fileInfo = getFileInfo(options.naturalRoot, fact[subjectPart], fact[relationshipPart]);


    var matchesFilter =  null;
    var obj = fact[objectPart];
    if (obj) {
        if (obj.r) {
            matchesFilter = matchesR;
        } else if (obj.s) {
            matchesFilter = matchesS;
        } else if (obj.n) {
            matchesFilter = matchesN;
        }
    } else {
        matchesFilter = matchesAll;
    }

    var wrappingItemCallback = function(item, itemDone) {
        itemCallback([fact[subjectPart], fact[relationshipPart], item], itemDone);
    };

    if (isFileSync(fileInfo.fileName)) {
        var content = require(fileInfo.fileName);
        processItemCallback(content, 0, obj, matchesFilter, wrappingItemCallback, completeCallback);
    } else {
        completeCallback(null, {natural:true});
    }
}

function getObjectMatcher(atom) {
    if (atom.r) {
        return function resourceMatcher(a, b) {
            return a.r === b.r;
        }
    } else if (atom.s) {
        return function stringMatcher(a,b) {
            //TODO check language too.
            return a.s === b.s;
        }
    } else if (atom.n) {
        return function numberMatcher(a,b) {
            return a.n == b.n;
        }
    }
}

function putImpl(options, fact, callback) {
    var existingItem = null;
    var object = fact[objectPart];
    var matcher = getObjectMatcher(object);
    getImpl(options, [fact[0], fact[1]],
        function itemCB(item, itemCallback) {
            // TODO strings and numbers
            if (matcher(item[objectPart], object)) {
                existingItem = item;
                itemCallback(true); // true === no more results required
            } else {
                itemCallback();
            }
        }, function end(err) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                return;
            }

            if (!existingItem) {

                putRaw(options, fact, function(err, rawData) {
                    if (err) {
                        return callback(err);
                    }
                    putRawReversed(options, fact, function(err) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, rawData);
                    });
                });

            } else if (callback) {
                callback(null);
            }
        });
}

function putRawReversed(options, fact, callback) {

    // For now, only allow lookup of r-r-r facts.
    if (fact[objectPart].r || fact[objectPart].s || fact[objectPart].n) {

        var relationStoreInfo = ensureStoreMeta(fact[relationshipPart]);
        var fullDirectoryPath = path.join(options.reverseRoot, relationStoreInfo.directory);

        mkdirp(fullDirectoryPath, function(err) {
            if (err) {
                callback(err);
            }

            var objStoreInfo = ensureStoreMeta(fact[objectPart]);
            var fileName = path.join(fullDirectoryPath, relationStoreInfo.fileName + '_' + objStoreInfo.fileKey + '.json');

            addItemRaw(fileName, fact[relationshipPart], fact[objectPart], fact[subjectPart], callback);
        });

    } else {
        callback();
    }
}

function addItemRaw(fileName, primary, secondary, wrappedData, callback) {

    var fileContent;
    if (isFileSync(fileName)) {
        fileContent = require(fileName);
    } else {
        fileContent = {
            meta: [primary.r, secondary.r],
            data: []}
        ;
    }

    var newItem = null;
    var wrappedObject = wrappedData;
    if (wrappedObject.r) {
        newItem = {r: wrappedObject.r};
    } else if (wrappedObject.s) {
        newItem = {s: wrappedObject.s};
    } else if (wrappedObject.n) {
        newItem = {n: wrappedObject.n};
    }
    // todo string and number

    if (newItem) {
        fileContent.data.push(newItem);
        fs.writeFile(fileName, JSON.stringify(fileContent, null, 3), 'utf-8', callback);
    } else if (callback) {
        callback(new Error('Unhandled type for data item.'));
    }
}

function putRaw(options, fact, callback) {
    var subjectStoreInfo = ensureStoreMeta(fact[subjectPart]);

    if (subjectStoreInfo) {

        var fullDirectoryPath  = path.join(options.naturalRoot, subjectStoreInfo.directory);

        mkdirp(fullDirectoryPath, function (err) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                return;
            }
            var relStoreInfo = ensureStoreMeta(fact[relationshipPart]);
            var fileName = path.join(fullDirectoryPath, subjectStoreInfo.fileName + '_' + relStoreInfo.fileKey + '.json');

            addItemRaw(fileName, fact[subjectPart], fact[relationshipPart], fact[objectPart], callback);
        });
    } else if (callback) {
        callback(); // todo err.
    }
}

function isFileSync(aPath) {
    try {
        var stat = fs.statSync(aPath);
        return stat.isFile();
    } catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        } else {
            throw e;
        }
    }
}

function getBaseDirectory(options) {
    var result = options ? options.directory : null;

    if (!result) {
        result = process.env['PROTOGRAPH_DIRECTORY'];

        if (!result) {
            result = path.join(os.homedir(), 'protograph_data');
        }
    }

    return result;
}

function create(options) {

    var baseDirectory = getBaseDirectory(options);
    console.log('Creating ProtoGraph client for: ' + baseDirectory);

    var diskInfo = {
        naturalRoot: path.join(baseDirectory, 'natural'),
        reverseRoot: path.join(baseDirectory, 'reverse')
    };

    return {
        get: function(fact, itemCallback, completeCallback) {
            return getImpl(diskInfo, fact, itemCallback, completeCallback);
        },
        put: function(fact, callback) {
            return putImpl(diskInfo, fact, callback);
        }
    };
}

module.exports.create = create;
