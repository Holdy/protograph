

With regard to metadata used by the system.

.directory (based on the resource url) that data about the resource should be placed in. Strings/numbers do not have a meaninful directory value.
.fileName represents a fileName fragment for this resource.
.fileKey For resources this is the basic name plus the md5 hash of the whole uri.


 For number types, filekey will be:
    the number + '_' + (hash of the type or 0 representing no type).

 For string types, filekey will be:
    hash of the string + '_' + lang code or 0 for default).
