class Formula {
	constructor(container_id) {
		this.container = document.getElementById(container_id);

		(function(formula) {
			formula.container.onclick = function(e) {
				if (e.target == this) {
					formula.selected_block = {parent_container: formula.root};
				}
			}
		})(this);

		this.root = new BlockContainer();
		this.selected_block = {parent_container: this.root};
		this.render();
	}
	render() {
		this.container.innerHTML = "";
		this.container.appendChild(this.root.render());
	}
	toLatex() {
		return this.root.toLatex();
	}
	toJson() {
		return JSON.stringify(this.root.toJson());
	}

	add(block) {
		if (this.selected_block.type == "text" && this.selected_block.text == "") {
			this.selected_block.parent_container.replace(this.selected_block, block);
		} else {
			this.selected_block.parent_container.add(block);
		}
		this.render();
	}

	addTextBlock() {
		this.add(new TextBlock(this.selected_block.parent_container));
	}
	addFracBlock() {
		this.add(new FracBlock(this.selected_block.parent_container));
	}
	addSupBlock() {
		this.add(new SupBlock(this.selected_block.parent_container));
	}
	addSubBlock() {
		this.add(new SubBlock(this.selected_block.parent_container));
	}
	addIntBlock() {
		this.add(new IntBlock(this.selected_block.parent_container));
	}
}

class BlockContainer {
	// MODEL
	constructor(parent_block, class_name) {
		this.parent_block = parent_block;
		this.children = [new TextBlock(this)];
		this.class_name = class_name ? class_name : "";
	}
	add(block) {
		this.children.push(block);
	}
	remove(block) {
		var index = this.children.indexOf(block);
		if (index >= 0) {
			this.children.splice(index, 1);
		}
		if (this.children.length == 0 && this.parent_block) {
			this.parent_block.parent_container.replace(this.parent_block,
				new TextBlock(this.parent_block.parent_container));
		}
		formula.render(); //FIXME nao usar global
	}
	replace(old_block, new_block) {
		var index = this.children.indexOf(old_block);
		if (index >= 0) {
			this.children[index] = new_block;
		}
		formula.render(); //FIXME nao usar global
	}
	empty() {
		return this.children.length == 0 || (this.children.length == 1
			&& this.children[0].type == "text" && this.children[0].text == "");
	}

	// VIEW
	render() {
		var div = document.createElement("div");
		div.className = "block-container " + this.class_name;
		this.children.forEach(function(c) {
			div.appendChild(c.render());
		});
		return div;
	}
	toLatex(){
		return this.children.map(function(c) {
			return c.toLatex();
		}).join("");
	}
	toJson(){
		return this.children.map(function(c) {
			return c.toJson();
		});
	}
}

class Block {
	// MODEL
	constructor(parent_container) {
		this.parent_container = parent_container;
		this.create();
	}
	create() {

	}
	remove() {
		this.parent_container.remove(this);
	}

	// VIEW
	render() {

	}
	toLatex() {

	}
	toJson() {

	}
}

class TextBlock extends Block {
	create() {
		this.type = "text";
		this.display_text = ""; // text with symbols replaced
		this.text = ""; // raw typed text
	}

	render() {
		var div = document.createElement("div");
		div.className = "block text-block";
		div.innerHTML = this.display_text;
		div.contentEditable = true;

		(function(block) {
			// CONTROLLER
			div.onblur = function() {
				block.text = this.innerHTML;
				if (this.innerHTML == "-") {
					this.innerHTML = "&minus;";
				}
				block.display_text = this.innerHTML;
			}
			div.onkeypress = function(e) {
				if (e.keyCode == 13) { // enter
					return false;
				}
			}
			div.onkeydown = function(e) {
				if (this.innerHTML == "" && e.keyCode == 8) { // backspace
					block.remove();
				}
			}
			div.onclick = function() {
				formula.selected_block = block; //FIXME nao usar global
			}
		})(this);

		this.element = div;
		return div;
	}
	toLatex() {
		if (this.text != "") {
			return "{" + this.text + "}";
		} else {
			return "";
		}
	}
	toJson() {
		return {type: "text", text: this.text, display_text: this.display_text};
	}
}

class FracBlock extends Block {
	create() {
		this.type = "frac";
		this.up = new BlockContainer(this, "frac-up");
		this.down = new BlockContainer(this, "frac-down");
	}

	render() {
		var div = document.createElement("div");
		div.className = "block frac-block";
		
		div.appendChild(this.up.render());

		var line = document.createElement("div");
		line.className = "frac-line";
		div.appendChild(line);

		div.appendChild(this.down.render());

		return div;
	}
	toLatex() {
		return "\\dfrac{" + this.up.toLatex() + "}{" + this.down.toLatex() + "}";
	}
	toJson() {
		return {type: "frac", up: this.up.toJson(), down: this.down.toJson()};
	}
}

class SupBlock extends Block {
	create() {
		this.type = "sup";
		this.base = new BlockContainer(this, "sup-base");
		this.sup = new BlockContainer(this, "sup-sup");
	}

	render() {
		var div = document.createElement("div");
		div.className = "block sup-block";
		
		div.appendChild(this.base.render());
		div.appendChild(this.sup.render());
		return div;
	}
	toLatex() {
		return "{" + this.base.toLatex() + "^" + this.sup.toLatex() + "}";
	}
	toJson() {
		return {type: "sup", base: this.base.toJson(), sup: this.sup.toJson()};
	}
}

class SubBlock extends Block {
	create() {
		this.type = "sub";
		this.base = new BlockContainer(this, "sub-base");
		this.sub = new BlockContainer(this, "sub-sub");
	}

	render() {
		var div = document.createElement("div");
		div.className = "block sub-block";
		
		div.appendChild(this.base.render());
		div.appendChild(this.sub.render());

		return div;
	}
	toLatex() {
		return "{" + this.base.toLatex() + "_" + this.sub.toLatex() + "}";
	}
	toJson() {
		return {type: "sub", base: this.base.toJson(), sub: this.sub.toJson()};
	}
}

class IntBlock extends Block {
	create() {
		this.type = "int";
		this.up = new BlockContainer(this, "int-up");
		this.mid = new BlockContainer(this, "int-mid");
		this.down = new BlockContainer(this, "int-down");
	}

	render() {
		var div = document.createElement("div");
		div.className = "block int-block";

		var img = document.createElement("img");
		img.src = "symbols/int.svg";

		var container = document.createElement("div");
		container.className = "int-container";

		div.appendChild(img);
		div.appendChild(container);
		container.appendChild(this.up.render());
		container.appendChild(this.down.render());
		div.appendChild(this.mid.render());

		return div;
	}
	toLatex() {
		return "\\int^" + this.up.toLatex() + "_" + this.down.toLatex() + this.mid.toLatex();
	}
	toJson() {
		return {type: "int", up: this.up.toJson(), mid: this.mid.toJson(), down: this.down.toJson()};
	}
}