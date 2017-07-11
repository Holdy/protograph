var expect = require('chai').expect;
var os = require('os');
var path = require('path');

var r = require('./testResources');

var homeDirectory = os.homedir();
var dataDirectory = path.join(homeDirectory, 'data/protograph-test');
var store = require('../protograph').create({directory: dataDirectory});

describe('store', function() {


    function getRandomPerson() {
        var randomPart = (new Date()).getTime();
        return {
            'randomPart': randomPart,
            r: 'http://www.rainbird.ai/ont/person#' + randomPart
        };
    }

    it('should allow storage and query on strings', function(done) {

        var foundFactCount = 0;
        var jrandom = getRandomPerson();
        var name = {s:'Biff Tanner ' + jrandom.randomPart};
        store.put([jrandom, r.rdfs_label,  name], function(err) {

            store.get([null, r.rdfs_label, name],
                function itemIterator(item, itemDone) {
                    expect(item[0].r).to.equal(jrandom.r);
                    foundFactCount++;
                    itemDone();
                },
                function completed(err) {
                    expect(err).to.not.be.ok;
                    expect(foundFactCount).to.equal(1);
                    done();
                });
        });


    });

    it('should write a new file - without exposing storage root', function(done) {

        var randomPerson = getRandomPerson();

        store.put([randomPerson, r.speaks, r.english], function(err) {
            expect(err).to.not.be.ok;

            expect(randomPerson.storeMeta.directory.indexOf(homeDirectory)).to.equal(-1);

            var items = [];
            store.get([randomPerson, r.speaks, null],
                function itemIterator(item, done) {
                    items.push(item[2]);
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

    it('should allow lookup of facts by ?-r-r', function(done) {
        var fact = [r.dave, r.speaks, r.spanglish];

        store.put(fact, function(err) {
            expect(err).to.not.be.ok;

            getFactList([null, fact[1], fact[2]], function(err, list) {
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
