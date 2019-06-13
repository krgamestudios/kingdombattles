//replacement(options)(key [, args...])
//options - the json object containing all options
//key - one of the keys in options
//data (optional) - a number of arguments that are substituted into the resulting string
const replacement = (options) => (key, ...data) => {
	let result;

	//randomize arrays
	if (Array.isArray(options[key])) {
		result = options[key][Math.floor(Math.random() * options[key].length)];
	} else {
		result = options[key];
	}

	//handle no result
	if (result === undefined) {
		const noResult = options["noResult"];
		if (noResult === undefined) {
			return ""; //nothing at all to show
		}
		//randomized noResult array
		if (Array.isArray(noResult)) {
			result = noResult[Math.floor(Math.random() * noResult.length)];
		} else {
			result = noResult;
 		 }
	}

	//replacement engine
	let counter = 0;
	data.map((dat) => {
		counter++;
		result = result.replace(/\{([1-9][0-9]*)\}/g, a => a === "{" + counter + "}" ? dat : a);
	});

	//return the final result
	return result;
};

//templateReplacement(templateString [, args...])
//templateString - the string to act as a template
//data (optional) - a number of arguments that are substituted into the template string
const stringReplacement = (templateString, ...data) => {
	let result = templateString;

	//replacement engine
	let counter = 0;
	data.map((dat) => {
		counter++;
		result = result.replace(/\{([1-9][0-9]*)\}/g, a => a === "{" + counter + "}" ? dat : a);
	});

	//return the final result
	return result;
}

module.exports = {
	replacement: replacement,
	stringReplacement: stringReplacement
};