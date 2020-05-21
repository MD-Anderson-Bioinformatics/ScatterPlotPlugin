//////////////////////
//
// Vanodi module.
//

export function Vanodi (options) {
	this.init (options);
	const _this = this;
	window.addEventListener('message', function (msg) {
		_this.dispatchMessage(msg);
	});
}

(function() {
Vanodi.prototype.init = function initVanodi (options) {
	const nonce = (x => x && x.length > 1 ? x[1] : '')(/[?&]nonce=([^&;]+?)(&|#|;|$)/.exec(location.search));
	this._registerID = setInterval(function() {
		parent.postMessage({
			vanodi: Object.assign ({}, options, { op: 'register', nonce })
		}, '*');
	}, 1000);
	this.getNonce = function () { return nonce; };
};

Vanodi.prototype.postMessage = function postMessage (msg) {
	parent.postMessage({
		vanodi: Object.assign ({}, msg, { nonce: this.getNonce() })
	}, '*');
};

const listenerOps = [];
const listenerFns = [];

Vanodi.prototype.addMessageListener = function addMessageListener (op, fn) {
	const i = listenerOps.indexOf (op);
	if (i === -1) {
		listenerOps.push (op);
		listenerFns.push (fn);
	} else {
		listenerFns[i] = fn;
	}
};

Vanodi.prototype.dispatchMessage = function dispatchMessage (msg) {
	const vanodi = msg && msg.data && msg.data.vanodi;
	if (!vanodi) return;

	if (!vanodi.hasOwnProperty('nonce')) {
		console.log('vanodi message: no nonce');
		return;
	}
	if (vanodi.nonce !== this.getNonce()) {
		console.log('vanodi message: bad nonce');
		return;
	}
	if (!vanodi.hasOwnProperty('op')) {
		console.log('vanodi message: no op');
		return;
	}
	if (this._registerID != null) {
		// Host has registered us.
		// Stop trying to register.
		clearInterval(this._registerID);
		this._registerID = null;
		// Call _register listener, if any.
		const i = listenerOps.indexOf ("_register");
		if (i !== -1) listenerFns[i]();
	}
	const i = listenerOps.indexOf (vanodi.op);
	if (i !== -1) listenerFns[i](vanodi);
};

})();

//
// Vanodi module.
//
//////////////////////
