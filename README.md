# Protograph

Protograph is a very simple RDF style graph database.

Currently it only supports the storing of resource-predicate-resource facts E.g:

```
    var jeff = {r:'http://mynamespace/people#Jeff'};
    var likes = {r:'http://mynamespace/ontology/likes'};
    var cheese = {r:'http://mynamespace/foodstuff#cheese'};
    proto.put([jeff, likes, cheese], function putResult(err) {
        // Check if everything went OK.
    });
```
Find out what Jeff likes
```
   proto.get([jeff, likes, null],
      function(item, done) {
          // Do what you want with each thing Jeff likes.
      },
      function(err) {
          // Called after all things Jeff likes.
      });
```
