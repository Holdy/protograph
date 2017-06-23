var fs = require('fs');
var os = require('os');
var path = require('path');
var mkdirp = require('mkdirp');

var subjectPart      = 0;
var relationshipPart = 1;
var objectPart       = 2;

var metadata = require('./metadata');

function ensureStoreMeta(wrappedUri) {

    if (!wrappedUri.storeMeta) {
        wrappedUri.storeMeta = metadata.create(wrappedUri.r);
    }

    return wrappedUri.storeMeta;
}

function processItemCallback(dataWrapper, nextIndex, itemCB, completeCB) {
    if (dataWrapper.data && nextIndex < dataWrapper.data.length) {
        var item = dataWrapper.data[nextIndex];
        itemCB(item, function(end) {
            if (end === true) {
                return completeCB(null, {natural: false});
            } else {
                return processItemCallback(dataWrapper, ++nextIndex, itemCB, completeCB);
            }
        });
    } else {
        //todo next file .
        return completeCB(null, {natural: true})
    }
}

function getImpl(options, fact, itemCallback, completeCallback) {
    // determine the file where these facts would be stored.
    subjectMeta = ensureStoreMeta(fact[subjectPart]);
    relationshipMeta = ensureStoreMeta(fact[relationshipPart]);

    var fullDirectoryPath = path.join(options.naturalRoot, subjectMeta.directory);
    var fileName = path.join(fullDirectoryPath, subjectMeta.fileName + '_' + relationshipMeta.fileKey + '.json');

    if (isFileSync(fileName)) {
        var content = require(fileName);
           processItemCallback(content, 0, itemCallback, completeCallback);
    } else {
        completeCallback(null, {natural:true});
    }
}

function putImpl(options, fact, callback) {
    var existingItem = null;
    getImpl(options, fact,
        function itemCB(item, itemCallback) {
            // TODO strings and numbers
            if (item.r === fact[objectPart].r) {
                existingItem = item;
                itemCallback(true); // true === no more results required
            } else {
                itemCallback();
            }
        }, function end(err) {
            if (err) {
                return callback(err);
            }

            if (!existingItem) {
                putRaw(options, fact, callback);
            } else {
                callback(null);
            }
        });
}

function putRaw(options, fact, callback) {
    var subjectStoreInfo = ensureStoreMeta(fact[subjectPart]);

    if (subjectStoreInfo) {

        var fullDirectoryPath  = path.join(options.naturalRoot, subjectStoreInfo.directory);

        mkdirp(fullDirectoryPath, function (err) {
            if (err) {
                return callback(err);
            }
            var relStoreInfo = ensureStoreMeta(fact[relationshipPart]);
            var fileName = path.join(fullDirectoryPath, subjectStoreInfo.fileName + '_' + relStoreInfo.fileKey + '.json');

            var fileContent;
            if (isFileSync(fileName)) {
                fileContent = require(fileName);
            } else {
                fileContent = {
                    meta: [fact[subjectPart].r, fact[relationshipPart].r],
                    data: []}
                ;
            }

            var newItem = null;
            var wrappedObject = fact[objectPart];
            if (wrappedObject.r) {
                newItem = {r: wrappedObject.r};
            }
            // todo string and number


            if (newItem) {
                fileContent.data.push(newItem);
                fs.writeFile(fileName, JSON.stringify(fileContent, null, 3), 'utf-8', callback);
            }
        });
    } else {
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
