/*--
ZIMON = {}

ZIMON
zim static class

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
so objects other than string, number, array, object literal, boolean or null
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

*/
var ZIMON = {
	stringify:function(obj, key) {
		// Assumes all non-JSON objects have a type property matching its class name.
		// If the class is not in the global scope then a key object must be used:
		// key = {scope:"zim"}; // where zim is in the global scope
		// the string value can contain dots for nested scope {scope:"zim.game"}
		// If different functions have different scopes use a specific scope:
		// key = {Person:{scope:"zim"}, Orb:{scope:"zim.game"}};
		// or key = {scope:"zim", Person:{scope:"zim"}};
		// Use a props property to transfer property values from old to new objects
		// key = {Person:{scope:"zim", props:["rotation", "alpha"]}};

		if (obj==null) return;
		obj = zimonUtils.copy(obj);
		process(obj);
		return JSON.stringify({obj:obj, key:key, zimon:1, info:"https://zimjs.com/zimon/"});
		function process(data, parent, index) {
			if (data==null) return;
			if (Array.isArray(data)) {
				zimonUtils.loop(data, function (d, i) {
					process(d, data, i);
				});
			} else if (data.constructor == {}.constructor) {
				zimonUtils.loop(data, function (p,v) {
					process(v, data, p);
				});
			} else {
				if (data.type) {
					var proxy = {zimon:data.type};
					if (data.arguments) {
						proxy.args = Array.prototype.slice.call(data.arguments);
						process(proxy.args);
					}
					if (data.type == "series") {
						proxy.args = Array.prototype.slice.call(data.array);
						process(proxy.args);
					}
					if (key && key[data.type] && key[data.type].props) {
						proxy.props = [];
						zimonUtils.loop(key[data.type].props, function (p) {
							proxy.props.push(data[p]);
						});
					}
					if (parent) {
						parent[index] = proxy;
					} else {
						obj = proxy;
					}
				} else {
					if (
						typeof data != "string" &&
						typeof data != "number" &&
						typeof data != "boolean" &&
						data !== null
					) {
						console.log("ZIMON - potentially bad JSON value" + data);
					}
				}
			}
		}
	},
	parse:function(string, key) {
		if (string==null) return;
		var o = JSON.parse(string);
		var obj = o.obj; // could use ES6 deconstruct
		var key = o.key;
		process(obj);
		return obj;
		function process(data, parent, index) {
			if (data==null) return;
			if (Array.isArray(data)) {
				zimonUtils.loop(data, function (d, i) {
					process(d, data, i);
				});
			} else if (data.zimon==null && data.constructor == {}.constructor) {
				zimonUtils.loop(data, function (p,v) {
					process(v, data, p);
				});
			} else {
				if (data.zimon) {
					// turn the zimon format into an object using scope in key
					var cl = data.zimon; // the class name
                    function translate(n) {
                        try {
                            return Function('return('+n+')')();
                        } catch (err) {
                            console.log("ZIMON - bad function scope or name: " + n);
                            return null;
                        }
                    }
                    var scope = "";
                    if (key) {
                    	if (key[cl] && key[cl].scope) {
                    		scope = key[cl].scope+".";
                    	} else if (key.scope) {
                    		scope = key.scope+".";
                    	}
                    }
					var fn = translate(scope+cl);
					var args = data.args;
					if (args==null) args = [];
					process(args);
					if (data.type == "series") {
						var z = zimonUtils.series(args);
					} else {
                        var z = !fn?null:new (fn.bind.apply(fn,[null].concat(Array.prototype.slice.call(args))))();
					}
					if (parent) {
						parent[index] = z;
					} else {
						obj = z;
					}
					if (key && key[cl] && key[cl].props) {
                        if (z) {
    						zimonUtils.loop(key[cl].props, function (p, i) {
    							if (data.props[i]!=null) z[p] = data.props[i];
						    });
                        }
					}
				}
			}
		}
	}
}

zimonUtils = {};
zimonUtils.copy = function(obj, clone, cloneContainer) {
	if (clone==null) clone = false;
	if (cloneContainer==null) cloneContainer = true;
	if (obj==null || !(obj instanceof Array || obj.constructor == {}.constructor)) return clone&&obj==null?(obj.clone?(obj.type&&((obj.type!="Container"&&obj.type!="Stage"&&obj.type!="StageGL")||cloneContainer)?obj.clone():obj):obj):obj;
	if (obj instanceof Array) {
		var array = [];
		for (var i=0; i<obj.length; i++) {
			array[i] = zimonUtils.copy(obj[i], clone, cloneContainer);
		}
		return array;
	}
	if (obj.constructor == {}.constructor) {
		var copy = {};
		for (var attr in obj) {
			var answer = zimonUtils.copy(obj[attr], clone, cloneContainer);
			if (obj.hasOwnProperty(attr)) copy[attr] = answer;
		}
		return copy;
	}
}

zimonUtils.series = function() {
    var array;
    if (arguments.length == 0) return function(){};
    if (arguments.length == 1 && Array.isArray(arguments[0])) array = arguments[0];
    else array = arguments;
    var count = 0;
    var f = function() {
        return array[(count++)%array.length];
    }
    f.array = array;
    f.type = "series";
    return f;
}

zimonUtils.loop = function(obj, call, reverse, step, start, end) {
    if (obj==null || call==null) return undefined;
    if (reverse==null) reverse = false;
    if (step==null || step <= 0) step = 1;

    var type = typeof obj=="number"?"number":(obj.constructor === Array?"array":(obj.constructor === {}.constructor?"object":(obj instanceof NodeList?"nodelist":(obj instanceof HTMLCollection?"htmlcollection":"invalid"))));

    if (type == "invalid") {
        return undefined;
    }
    if (type == "number" || type == "array" || type == "nodelist" || type == "htmlcollection") {
        var length = type=="number"?obj:obj.length;
        var total = getTotal(length-1);
        if (total == 0) return;
        if (reverse) {
            for(var i=start; i>=end; i-=step) {
                if (type=="number") {
                    var r = call(i, total, start, end, obj);
                } else if (type=="array") {
                    var r = call(obj[i], i, total, start, end, obj);
                } else { // nodelist
                    var r = call(obj.item(i), i, total, start, end, obj);
                }
                if (typeof r != 'undefined') return r;
            }
        } else {
            for(var i=start; i<=end; i+=step) {
                if (type=="number") {
                    var r = call(i, total, start, end, obj);
                } else if (type=="array") {
                    var r = call(obj[i], i, total, start, end, obj);
                } else { // nodelist or htmlcollection
                    var r = call(obj.item(i), i, total, start, end, obj);
                }
                if (typeof r != 'undefined') return r;
            }
        }
    } else if (type == "object") {
        var length = 0;
        var props = [];
        for (var i in obj) {
            length++;
            props.push(i);
        }
        var total = getTotal(length-1);
        if (total == 0) return;
        if (reverse) {
            for(var i=start; i>=end; i-=step) {
                var r = call(props[i], obj[props[i]], i, total, start, end, obj);
                if (typeof r != 'undefined') return r;
            }
        } else {
            for(var i=start; i<=end; i+=step) {
                var r = call(props[i], obj[props[i]], i, total, start, end, obj);
                if (typeof r != 'undefined') return r;
            }
        }
    }
    function getTotal(max) {
        if (start==null) start = reverse?max:0;
        if (end==null) end = reverse?0:max;
        if ((reverse && end > start) || (!reverse && start > end)) return 0;
        if ((start < 0 && end) <0 || (start > max && end > max)) return 0;
        start = Math.max(0, Math.min(start, max));
        end = Math.max(0, Math.min(end, max));
        return Math.floor((reverse?(start-end):(end-start)) / step) + 1;
    }
}