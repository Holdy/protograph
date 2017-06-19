var storageEngine = require('./lib/storageEngine');
var interface = require('./lib/interface');

function create(options) {
    var engine = storageEngine.create(options);
    return interface.wrap(engine);
}

module.exports.create = create;
