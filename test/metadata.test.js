var expect = require('chai').expect;

var create = require('../lib/metadata').create;

describe('metadata creation', function() {

    it('should return null for null', function(done) {
        var result = create(null);
        expect(result).to.equal(null);
        done();
    });

    it('should return null for non http / https', function(done) {
        var result = create('httbiscuit://stuff');
        expect(result).to.equal(null);
        done();
    });

    it('should place root items inside root directory', function(done) {
        var result = create('http://www.slapdash.com');

        expect(result.directory).to.equal('http/www.slapdash.com');
        expect(result.fileName).to.equal('www.slapdash.com');
        expect(result.fileKey).to.equal('www.slapdash.com_21f5c9a33630696c0a200922f35df460');
        done();
    });

    it('should handle non root items (by slash) correctly', function(done) {
       var result = create('http://www.slapdash.com/item');

        expect(result.directory).to.equal('http/www.slapdash.com');
        expect(result.fileName).to.equal('item');
        expect(result.fileKey).to.equal('item_44eb2557837a13f07ba239aab731d727');
        done();
    });

    it('should handle non root items (by hash) correctly', function(done) {
        var result = create('http://www.slapdash.com/ontology#someItem');

        expect(result.directory).to.equal('http/www.slapdash.com/ontology');
        expect(result.fileName).to.equal('someItem');
        expect(result.fileKey).to.equal('someItem_530ed38cc4a8241efd3ab1bdab849675');
        done();
    });

});
