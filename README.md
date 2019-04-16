ZIMON
Static Class to stringify an object and parse resulting string back to the object
Created by Dan Zen for ZIM at https://zimjs.com but usable in other languages
in a similar way that JSON was made for JS but usable in other languages
ZIMON differs from JSON is that it can work with any type of object

DESCRIPTION
ZIMON stands for ZIM Object Notation
It turns any prepared** object to a string using ZIMON.stringify(object)
It turns a ZIMON string back into and object using ZIMON.parse(string)
The object can be inside an array [] or an object literal {}
These can be nested and filled with any type of object (that is prepared**)
See https://zimjs.com/zimon/ for an example

KEY
An optional key object can be used to specify the scope of the class
and to specify which properties to store for objects made from a class.
The scope must be a string accessible from where you stringify - it can contain dots (.)
The key can be passed as the second parameter to ZIMON.stringify().
The key is sent in the ZIMON string and nothing extra is needed when parsing.

PURPOSE
The purpose is similar to JSON - to save to localStorage or databases or share between languages.
Indeed, the final ZIMOM format is JSON.
Like JSON, ZIMON can be used outside of ZIM and outside JavaScript if implemented in another language.
See https://github.com/danzen/zimon/ for generic JS code to port to other languages.

** PREPARED OBJECTS
Any objects NOT supported by JSON must be prepared
so objects OTHER than string, number, array, object literal, boolean or null
need to have the following:
1. A type property that matches the class name as a string
2. An arguments property that holds an array of the arguments passed to make the object

EXAMPLE
// To prepare custom objects:
Custom = function(a, b, c) { // ** global scope
	this.type = "Custom"; // ZIMON uses a type property that matches the class name
	// best to take copy of arguments and turn then into array
	// otherwise any changes to argument values (setting defaults, etc) will be needlessly recorded
	// when ZIMON.stringify() is eventually called
	this.arguments = Array.prototype.slice.call(arguments);
	this.write = function() {console.log(a, b, c);}
}
var c = new Custom("one", "two", "three");
var c2 = ZIMON.stringify(c);
var c3 = ZIMON.parse(c2);
c3.write(); // logs one two three

// ** or save in some namespace or on an object
frame.Custom = function(a, b, c) {// same as above}
var c = new frame.Custom("one", "two", "three");
// then use key as second parameter to specify scope
var c2 = ZIMON.stringify(c, {Custom:{scope:"frame"}}); // key
var c3 = ZIMON.parse(c2);
c3.write(); // logs one two three
END EXAMPLE

EXAMPLE
// a built-in JavaScript Object:
var date = new Date(1982, 0, 10);
date.type = "Date"; // add date
date.arguments = [1982, 0, 10]; // and manual arguments
var d = ZIMON.stringify(date);
var d2 = ZIMON.parse(d);
zog(d2.getYear()); // 82
END EXAMPLE

STATIC METHODS
stringify(obj, key) - supply an object to convert to a ZIMON string
	the object can be any JSON ready object - string, number, array, object literal, boolean or null
	the object can be a prepared custom or built in object
		with a type property of the class name
		with an arguments property of the arguments - see ** PREPARED OBJECTS above
	Or any combination of these - ZIMON is recursive so checks parameters, etc.
	the optional key can be used to specify scope for the class if not in global scope
	and used to specify which properties should be recorded
	the key has the following format:
	 	{ClassName:{scope:"inScope.nested.etc", props:["prop1", "prop2", "etc"]}, ClassName2:{}, etc.}
	stringify returns a ZIMON string in JSON format
	eg.'{"obj":{"zimon":"Rectangle","args":[30,30,"#e472c4"]},"props":[0.3,212,184]},"key":{"Tile":{"props":["alpha","x","y"]}},"zimon":1,"info":"https://zimjs.com/ZIMON"}';
parse(string) - pass in the ZIMON string to turn back into an object (or objects within objects)

