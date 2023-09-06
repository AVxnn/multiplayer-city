class KeyPressListener {
    constructor(keyCode, callback) {
        let keySafe = true;
        this.keydownFunction = function(event) {
            if (event.code === keyCode) {
                if (keySafe) {
                    keySafe = false;
                    callback();
                    setTimeout(() => {
                        keySafe = true
                        console.log('ww');
                    }, 150)
                }
            }
        };
        this.keyupFunction = function(event) {
            if (event.code === keyCode) {
                keySafe = true;
                console.log('wew');
            }
        }
        document.addEventListener("keydown", this.keydownFunction);
        document.addEventListener("keyup", this.keyupFunction);
    };

    unbind() {
        document.removeEventListener("keydown", this.keydownFunction);
        document.removeEventListener("keyup", this.keyupFunction);
    }
}