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


var BarCanvas = (function(){
	function BarCanvas(title){
		this.barCount = title.length;
		this.stage = null;
		this.bars = [];
		this.BAR_HEIGHT = 5;
		this.BAR_COLOR = "steelblue";
		this.BAR_COLOR_ERR = "crimson";
		this.VEROCITY = 600; //px per second
	}
	BarCanvas.prototype.setStage = function(stage){
		this.stage = stage;
		
		// drawBars
		var size = this.getBarWidth();
		var height = this.BAR_HEIGHT;
		
		for(var i = 0; i < this.barCount; i++){
			var bar = new createjs.Shape();
			bar.graphics.beginFill(this.BAR_COLOR).drawRect(i * size, this.getMaxHeight(), size, height);
			this.stage.addChild(bar);
			this.bars.push(bar);
		}

		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", this.stage);
	}
	BarCanvas.prototype.getMaxHeight = function(){
		return parseFloat($("#canvas").attr("height")) - this.BAR_HEIGHT;
	}
	BarCanvas.prototype.getBarWidth = function(){
		return parseFloat($("#canvas").attr("width")) / this.barCount;
	}
	BarCanvas.prototype.animateKey = function(position, elapsedsec, ok){
		var bar = (position < this.barCount) ? this.bars[position] : this.bars[this.barCount - 1];
		var maxHeight = Canvas.getMaxHeight();
	
		var y = elapsedsec * this.VEROCITY;
		if(y >= maxHeight){
			y = maxHeight;
		}
		
		var size = this.getBarWidth();
		var color = ok ? this.BAR_COLOR : this.BAR_COLOR_ERR;
		bar.graphics.clear();
		bar.graphics.beginFill(color).drawRect(position * size, this.getMaxHeight(), size, this.BAR_HEIGHT);
		
		createjs.Tween.get(bar)
			.to({y: -y}, 500, createjs.Ease.linear)
			.to({y: 0}, 1800, createjs.Ease.linear)
		VM.setTyped(position, ok);
	}

	return BarCanvas;	
})();

// Global Variables

var TITLE = "HackerTouchestheWalls";
var KeyDowns = [];
var TypedKeys = [];
var Canvas = new BarCanvas(TITLE);
var VM = null;

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
		for(i = 0; i < KeyDowns.length; i++){
			if(KeyDowns[i].keyDown.keyCode == keyEvent.keyCode){
				matched = KeyDowns[i];
				break;
			}
		}
		if(matched){
			matched.setKeyUp(keyEvent);
			var position = TypedKeys.length;
			var answer = (position < TITLE.length) ? TITLE.charAt(position) : TITLE.charAt(TITLE.length - 1);
			TypedKeys.push(matched);
			KeyDowns.splice(i, 1);
			if(matched.keyDown.enterKey){
				evaluate();
			}else{
				Canvas.animateKey(position, matched.calElapsed(), answer == matched.getChar());
			}
		}
	}else{
		var kp = new KeyProperty(keyEvent);
		KeyDowns.push(kp);
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
	var avgKeyTouch = keyPressTimes.length == 0 ? 0 : keyPressTimes.reduce(function(a, b){ return a + b;}) / keyPressTimes.length;
	var totalTime = (tttaaannn.keyUp.timestamp - TypedKeys[0].keyDown.timestamp) / 1000;
	var category = "default";
	
	if(accuracy < 0.7){
		category = "noway";
	}else{
		if(totalTime < 3.5){
			category = "cool";
			if(accuracy < 0.9){
				category = "wild";
			}
		}else{
			category = "normal";
			if(totalTime >= 4.5){
				category = "idle";
			}
		}
	}
	console.log(enterTime);
	VM.setEvaluation(accuracy, avgKeyTouch, totalTime, category);
	
	KeyDowns = [];
	TypedKeys = [];
}

VM = new Vue({
	el: '#app',
	data: {
		evaluation: {
			accuracy: 0.0,
			avgKeyTouch: 0.0,
			totalTime: 0.0,
			category: "default"
		},
		title:[],
		images: {
			"default": "img/default.png",
			"noway": "img/noway.png",
			"cool": "img/cool.png",
			"wild": "img/wild.png",
			"normal": "img/normal.png",
			"idle": "img/idle.png"
		}
	},
	created: function () {
		this.setTitle();
	},
	methods: {
		setTitle: function(){
			var typedChar = function(c){ return {char: c, ok: false} }
			var one = "Hacker".split("").map(typedChar);
			var two = "Touches".split("").map(typedChar);
			var three = "the".split("").map(typedChar);
			var four = "Walls".split("").map(typedChar);
			this.title = this.title.concat([one, two, three, four]);
			
		},
		setTyped: function(position, ok){
			var index = position;
			for(var i = 0; i < this.title.length; i++){
				if(index < this.title[i].length){
					this.title[i][index].ok = ok;
					break;
				}else{
					index -= this.title[i].length;
				}
			}
		},
		setEvaluation: function(accuracy, avgKeyTouch, totalTime, category){
			var round = function(v){
				return Math.round(v * 100) / 100;
			}
			this.evaluation.accuracy = round(accuracy) * 100;
			this.evaluation.avgKeyTouch = round(avgKeyTouch);
			this.evaluation.totalTime = round(totalTime);
			this.evaluation.category = category;
		},
		getCategoryImage: function(){
			return this.images[this.evaluation.category];
		}
		
	}
});


$(function(){
	var keyDowns = keyDownEvents().filter(function(ke){ return ke.targetCode(); });
	var keyUps = keyUpEvents().filter(function(ke){ return ke.targetCode(); });
	keyDowns.merge(keyUps).onValue(mergeEvent);
	
	var width = $("#animation").width();
	$("#canvas").attr("width", width);
	var stage = new createjs.Stage("canvas");
	Canvas.setStage(stage);
	
	VM.$data.evaluation.accuracy = 1.0;
		
})
