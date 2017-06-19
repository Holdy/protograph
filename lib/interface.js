
function wrap (functionalityProvider) {

    return {
        get: functionalityProvider.get,
        put: functionalityProvider.put
    }
}

module.exports.wrap = wrap;
