// Class Definition

var KeyEvent = (function () {
    function KeyEvent(event, up) {
		this.timestamp = Date.now();
        this.keyCode = event.keyCode;
		this.char = String.fromCharCode(this.keyCode).toLowerCase();
		if(!/\d|\w|\s/.test(this.char)){
			this.char = "";
		}
		this.shiftKey = event.shiftKey;
		this.ctrlKey = event.ctrlKey;
		this.enterKey = this.keyCode == 13 ? true : false;
		this.up = up;
    }
	
    KeyEvent.prototype.targetCode = function () {
		var target = false;
		if(!this.ctrlKey && (this.char || this.enterKey)){
			target = true;
		}
		return target;
    };
    return KeyEvent;
})();

var KeyProperty = (function(){
	function KeyProperty(keyDown){
		this.keyDown = keyDown;
		this.keyUp = null;
	}
	KeyProperty.prototype.setKeyUp = function(keyUp){
		this.keyUp = keyUp;
	}
	KeyProperty.prototype.getChar = function(){
		var c = this.keyDown.char;
		if(this.keyDown.shiftKey){
			c = c.toUpperCase();
		}
		return c;
	}
	KeyProperty.prototype.calElapsed = function(){
		var e = this.keyUp.timestamp - this.keyDown.timestamp;
		var secDiff = e / 1000;
		return secDiff;
	}
	return KeyProperty;
})();

// Global Variables

var TITLE = "Hacker Touches the Walls";
var KeyPressed = [];
var TypedKeys = [];

// Event Stream

function keyDownEvents(){
	return $(document).asEventStream("keydown").map(function(e){ return new KeyEvent(e, false); });
}
function keyUpEvents(){
	return $(document).asEventStream("keyup").map(function(e){ return new KeyEvent(e, true); });	
}

function mergeEvent(keyEvent){
	if(keyEvent.up){
		var matched = null;
		var i = 0;
		for(i = 0; i < KeyPressed.length; i++){
			if(KeyPressed[i].keyDown.keyCode == keyEvent.keyCode){
				matched = KeyPressed[i];
				break;
			}
		}
		if(matched){
			matched.setKeyUp(keyEvent);
			TypedKeys.push(matched);
			KeyPressed.splice(i, 1);
			if(matched.keyDown.enterKey){
				evaluate();
			}
		}
	}else{
		var kp = new KeyProperty(keyEvent);
		KeyPressed.push(kp);
	}
} 

// Evaluate

function evaluate(){
	var answer = TITLE.split("");
	var wellTyped = [];
	var keyPressTimes = [];
	for(var i = 0; i < TypedKeys.length - 1; i++){ //exclude last enter.
		var t = TypedKeys[i];
		if(i < answer.length && t.getChar() == answer[i]){
			wellTyped.push(t.getChar());
		}
		keyPressTimes.push(t.calElapsed());
	}
	var tttaaannn = TypedKeys[TypedKeys.length - 1];
	var enterTime = tttaaannn.calElapsed();	
	var accuracy = wellTyped.length / answer.length;
	var typed = TypedKeys.slice(0, TypedKeys.length - 1).map(function(tk){ return tk.getChar() }).join("");
	var totalTime = (tttaaannn.keyUp.timestamp - TypedKeys[0].keyDown.timestamp) / 1000;
	console.log(typed + "(" + accuracy + ")");
	console.log(keyPressTimes);
	
	KeyPressed = [];
	TypedKeys = [];
}

$(function(){
	var keyDowns = keyDownEvents().filter(function(ke){ return ke.targetCode(); });
	var keyUps = keyUpEvents().filter(function(ke){ return ke.targetCode(); });
	keyDowns.merge(keyUps).onValue(mergeEvent);

})