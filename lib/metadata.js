var crypto = require('crypto');

function hashString(string) {
    var hasher = crypto.createHash('md5');
    hasher.update(string);
    return hasher.digest('hex');
}

function createString(string) {
    return {
        fileKey: hashString(string)
    };
}

function createNumber(number) {
    return {
        fileKey: '' + number
    }
}

function create (uri) {
    var result = null;

    if (uri) {
        if (!uri.indexOf('http://') || !uri.indexOf('https://')) {
            var index = uri.indexOf(':');
            var base = 'http/' + uri.substring(index+3);
            var parts = base.split(/[/#]/g);

            if (parts.length === 2) {
                // We will put a root file in the directory to keep the storage root clean.
                result = {
                    directory: parts.join('/'),
                    fileName: parts[1]
                };
            } else {
                // last part is the name.
                result = {
                    fileName: parts.splice(parts.length-1, 1)[0],
                    directory: parts.join('/')
                }
            }

            // shortname is name + ' ' + md5 hash of base url (eg with out http/s)
            result.fileKey =  result.fileName + '_' + hashString(base);
        }
    }

    return result;
}

module.exports.create = create;
module.exports.createString = createString;
module.exports.createNumber = createNumber;
