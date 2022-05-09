function jsCSS() {
	this.make = function() {
		this.styleTag = document.createElement("style")
		this.styleTag.type="text/css"
		document.body.appendChild(this.styleTag)
		this.parse()
        return this
	}
	this.parse = function() {
		var cssCode=""
		for (var selector in this.css) {
			cssCode += selector + " {"
			for (var rule in this.css[selector]) {
				cssCode += rule + ":" + this.css[selector][rule]+";"
			}
			cssCode += "}"
		}
		this.styleTag.innerHTML=cssCode
	}
	
	this.css = {}
	
	this.addRule = function(selector,rules) {
		for (var rule in rules) {
			if (!this.css[selector]) this.css[selector] = {}
			this.css[selector][rule] = rules[rule]
		}
		this.parse()
        return this
	}
	
	this.deleteRule = function(selector,rules) {
		if (typeof rules == "object") for (var rule in rules) {
			if (this.css[selector]) delete this.css[selector][rules[rule]]
		}
		else delete this.css[selector][rules]
		this.parse()
        return this
	}
	
	this.make()
}
