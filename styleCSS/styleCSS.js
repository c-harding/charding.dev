function $function (fn,$input,q) {
	function test(string) {
		string=string
			.replace(/^\s*/,"")
			.replace(/\s*$/,"")
			.replace(/^\([^\(\)]*\)$/,"")
		if (string.match(/[Tt][Rr][Uu][Ee]/)) return true
		if (string.match(/[Ff][Aa][Ll][Ss]/)) return false
		if (string.match(/\d+>=\d+/) && string.match(/(\d+)>=\d+/)[1] >= string.match(/\d+>=(\d+)/)[1]) return true
		if (string.match(/\d+<\d+/) && string.match(/(\d+)<\d+/)[1] < string.match(/\d+<(\d+)/)[1]) return true
		if (string.match(/\d+>\d+/) && string.match(/(\d+)>\d+/)[1] > string.match(/\d+>(\d+)/)[1]) return true
		if (string.match(/\d+<=\d+/) && string.match(/(\d+)<=\d+/)[1] <= string.match(/\d+<=(\d+)/)[1]) return true
		if (string.match(/\w+="\w+"/) && string.match(/(\w+)="\w+"/)[1] == string.match(/\w+="(\w+)"/)[1]) return true
		return false
	}
	
	function readLine(line) {
		var Return = []
		if (multiVar) {
			if (line.match(/\}/)) multiVar=false
			else Return=[
				"subReturn",
				line
					.replace(/;\s*;/,";")
					.replace(/^\s*/,"")
			]
		} else if (line.match(/^if/)) {
			if (test(line.match(/^if(.+){/)[1])) Return = ["if",true]
			else Return = ["if",false]
		} else if (line.match(/^else/)) {
			if (((line.match(/^else\s*if/) && test(line.match(/^else\s*if(.+){/)[1])) || (!line.match(/^else\s*if/))) && !skipElse[z]) Return = ["if",true]
			else Return = ["if",false]
		} else if (line.match(/^\$return\s*:/)) {
			Return = [
				"return",
				(line.match(/^[\$£]return\s*:(.*)$/)[1]+";")
					.replace(/;\s*;/,";")
					.replace(/^\s*/,"")
			]
		} else if (line.match(/^£return\s*:/)) {
			multiVar=true
			Return = ["startReturn"]
		}
		
		if (Return[0] == "if" && Return[1]) skipElse[z]=true
		else if (Return[0]!="if") skipElse[z]=false
		
		if (line.match(/\{/)) 
			z++
		else if (line.match(/\}/)) {
			delete skipElse.splice(z,1)
			if (skipSect&&skipSect>=z) skipSect=false
			z--
			Return = ["endBrace"]
		}
		
		return Return
	}
	
	fn=fn
		.replace(/\$input/g, $input)
		.replace(/;\s*(.)/g, ";\n$1")
		.replace(/\}\s*(.)/g, "}\n$1")
		.replace(/(.)\s*\}/g, "$1\n}")
		.replace(/(.)\s*\{/g, "$1 {")
		.replace(/\n[\t ]*\n/g, "\n")
		.replace(/\s*$/g, "")
		.replace(/^\s*/g, "")
	
	var splitFn=fn.split("\n"),
		x = 0,
		z = 0,
		skipElse=[false],
		skipSect=false,
		thisLine=[],
		multiVar=false,
		$return = ""
	while (x<splitFn.length) {
		splitFn[x] = splitFn[x].replace(/^\s*/,"")
		thisLine=readLine(splitFn[x])
		if (skipSect && z>=skipSect) {
			x++
			continue
		}
		if (thisLine[0]=="if" && thisLine[1]==false) skipSect=z
		else if (thisLine[0]=="return") $return = thisLine[1]
		else if (thisLine[0]=="subReturn") $return += thisLine[1]
		x++
	}
	fn=splitFn.join("\n")
	return $return
}

function styleFile(filePath) {
	var file = ""
	$.ajax({
		url: filePath,
		success: function(data) {
			var styleTag = $(document.createElement('style'))
			$(document.head).append(styleTag)
			var rowsArray=data.split("\n")
			for (var x in rowsArray)
				rowsArray[x] = rowsArray[x]
					.replace(/^[ \t]*/g, '')
					.replace(/[ \t]*$/g, '')
					.replace(/([^{};,\\])$/g, '$1;')
			data = rowsArray
				.join("\n")
				.replace(/[}][\n\r]*(.)/g, "}\n\n$1")
				.replace(/([{;])[\n\r]*([^\s}])/g, "$1\n\t$2")
				.replace(/[\,]\\n*\r*\n*\t*(\w)/g, ' $1')
			var textLoopSkip=0,
				cssVarsObj = {pound:{},dollar:{},functions:{}},
				functions = {},
				newData = data
			for (var x in data) {
				x=parseInt(x)
				if (textLoopSkip>0) {
					textLoopSkip--
					continue
				}
				if (data[x]=="@" && data[x]+data[x+1]+data[x+2]+data[x+3]+data[x+4]=="@vars") {
					var y = 4
					while (data[x+y]!="{") {
						y++
					}
					var z = 1
					y++
					while (z!=0&&data.length>x+y) {
						if (data[x+y]=="{") z++
						else if (data[x+y]=="}") z--
						else if (data[x+y]=="£")
							cssVarsObj.pound[data.substring(x+y).match(/^£([\w-_]+):/)[1]] = data.substring(x+y+(data.substring(x+y).match(/^£([\w-_]+):\s*?{/)[0].length)).match(/^([^{}]*?)}/)[1]
						else if (data[x+y]=="$") {
							y++
							if (data[x+y]=="$") {
							var z1=1,
								y1=(data.substring(x+y).match(/^\$([\w-_]+)\(\): *?{/)[0].length),
								string1=""
								while (z1!=0&&data.length>x+y+y1) {
									if (data[x+y+y1]=="{") z1++
									else if (data[x+y+y1]=="}") z1--
									string1 += data[x+y+y1]
									y1++
								}
								cssVarsObj.functions[data.substring(x+y).match(/^\$([\w-_]+)\(\):/)[1]] = string1.match(/^([\s\S]*)\}\s*$/)[1]
								y+=y1
							}
							else {
								cssVarsObj.dollar[data.substring(x+y).match(/^([\w-_]+):/)[1]] = data.substring(x+y+(data.substring(x+y).match(/^([\w-_]+):\s*?/)[0].length)).match(/^([^{}]*?);/)[1]
							}
						}
						y++
					}
					textLoopSkip+=y
					newData=data.substring(0,x)+data.substring(x+y)
				}
			}
			data=newData
			
			var loopNo=data.length
			while (data.match(/[\$£]/) && loopNo>0)	{
				for (var x in cssVarsObj.functions) {
					data = data.replace(new RegExp("\\$\\$"+x+"\\((\\w*)\\)",'g'), function(match, $1) {
						return $function(cssVarsObj.functions[x],$1,x)
					})
				}
				
				for (var x in cssVarsObj.pound)
					data = data.replace(new RegExp("£"+x,'g'),cssVarsObj.pound[x])
				
				for (var x in cssVarsObj.dollar)
					data = data.replace(new RegExp("\\$"+x,'g'),cssVarsObj.dollar[x])
				
				loopNo--
			}
			
			data = data
				.replace (/;\s*;/g,';')
			
			$(styleTag).html(data)
		},
		dataType:'text'
	})
}
