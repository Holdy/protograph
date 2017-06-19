var expect = require('chai').expect;
var r = require('./testResources');

var store = require('../protograph').create({directory: '/Users/chrisholden/data/triples2'});

describe('store', function() {


    function getRandomPerson() {
        return {
            r: 'http://www.rainbird.ai/ont/person#' + (new Date()).getTime()
        };
    }

    //todo storeMeta.directory should only store relative path under storeRoot.
    // so that if it is accidentally shown - the actual store root isn't shown.
    it('should write a new file', function(done) {

        var randomPerson = getRandomPerson();

        store.put([randomPerson, r.speaks, r.english], function(err) {
            expect(err).to.not.be.ok;

            expect(randomPerson.storeMeta.directory.indexOf('chrisholden')).to.equal(-1);

            var items = [];
            store.get([randomPerson, r.speaks, null],
                function itemIterator(item, done) {
                    items.push(item);
                    done();
                },
                function completed(err) {
                    expect(err).to.not.be.ok;
                    expect(items.length).to.equal(1);
                    expect(items[0].r).to.equal(r.english.r);
                    done();
                }
            );
        });
    });

    it ('should add multiple values', function(done) {
        // Ensure results aren't cached.
        var jrandom = getRandomPerson();

        store.put([jrandom, r.speaks, r.english], function(err) {

            var list = [];
            store.get([jrandom, r.speaks, null], catchItemsIn(list),function(err) {
                expect(err).to.not.be.ok;
                expect(list.length).to.equal(1);

                store.put([jrandom, r.speaks, r.serbian], function(err) {

                    var secondList = [];
                    store.get([jrandom, r.speaks, null], catchItemsIn(secondList), function(err) {
                        expect(err).to.not.be.ok;
                        expect(secondList.length).to.equal(2);
                        done();
                    });

                });
            });
        });
    });

    it('should ensure values but not repeat them', function(done) {
        var fact = [r.dave, r.speaks, r.english];

        store.put(fact, function(err) {
            expect(err).to.not.be.ok;

            getFactList(fact, function(err, list) {
                expect(list.length).to.equal(1);

                store.put(fact, function(err) {
                    expect(err).to.not.be.ok;

                    getFactList(fact, function(err, list) {
                        expect(list.length).to.equal(1);
                        done();
                    });
                });
            });
        });
    });

    function getFactList(fact, callback) {
        var list = [];
        store.get(fact, catchItemsIn(list), function(err) {
            callback(err, list);
        });

    }

    function catchItemsIn(list) {
        return function(item, done) {
            list.push(item);
            done();
        }
    }

});
