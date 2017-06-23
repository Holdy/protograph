# Protograph

Protograph is a (very) simple RDF style graph database.

Create a client by saying where the data should be stored:
```
   var protograph = require('protograph');
   var proto = protograph.create({directory:'/mydata/testGraph/'});
```
All data will then be stored under the testGraph directory.


Currently you can only store resource-predicate-resource facts E.g:
```
    var jeff = {r:'http://mynamespace/people#Jeff'};
    var likes = {r:'http://mynamespace/ontology/likes'};
    var cheese = {r:'http://mynamespace/foodstuff#cheese'};
    proto.put([jeff, likes, cheese], function(err) {
        // Check if everything went OK.
    });
```

And then query on them:
```
   proto.get([jeff, likes, null], // Jeff likes ?
      function(item, itemCallback) {
          // Do what you want with each thing Jeff likes.
          itemCallback();
      },
      function(err) {
          // Called after all things Jeff likes.
      });
```

You cannot currently:
 * Store string objects.
 * Store number objects.
 * Query based on the object, E.g. '? likes cheese'.


If you do not specify a directory option, the value in the environment variable PROTOGRAPH_DIRECTORY will be used.
If this environment variable is not present ~/protograph_data will be used.
