
const mapData = {
    minX: 0,
    maxX: 11,
    minY: 0,
    maxY: 11,
    blockedSpaces: {
        "0x0": true,
        "2x0": true,
        "3x0": true,
        "5x0": true,
        "6x0": true,
        "7x0": true,
        "8x0": true,
        "9x0": true,
        "6x1": true,
        "7x1": true,
        "8x1": true,
        "9x1": true,
        "0x2": true,
        "1x2": true,
        "2x2": true,
        "4x2": true,
        "8x2": true,
        "9x2": true,
        "0x3": true,
        "1x3": true,
        "2x3": true,
        "10x3": true,
        "0x4": true,
        "1x4": true,
        "2x4": true,
        "10x4": true,
        "0x5": true,
        "4x5": true,
        "7x6": true,
        "8x6": true,
        "10x6": true,
        "0x7": true,
        "2x7": true,
        "3x7": true,
        "4x7": true,
        "10x7": true,
        "2x8": true,
        "3x8": true,
        "4x8": true,
        "8x8": true,
        "9x8": true,
        "10x8": true,
        "2x9": true,
        "3x9": true,
        "4x9": true,
        "5x9": true,
        "6x9": true,
        "8x9": true,
        "9x9": true,
        "10x9": true,
        "3x10": true,
        "9x10": true,
    }
}

const playerColors = ["red", "yellow", "green", "purple"]

function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getKeyString(x, y) {
    return `${x}x${y}`;
}

function createName() {
    const prefix = randomFromArray([
        "COOL",
        "SUPER",
        "WTF",
        "NINJA",
        "SPOOKY",
        "MOON",
        "SUN",
        "ARA",
        "BEBRA",
        "WOW"
    ]);
    const animal = randomFromArray([
        "BEAR",
        "DOG",
        "WOLF",
        "CAT",
        "MOUSE",
        "PIG",
        "GOAT",
        "PUMA",
        "LEON",
        "BUG"
    ]);
    return `${prefix} ${animal}`
}

function isSolid(x, y) {

    const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];

    return (
        blockedNextSpace || 
        x >= mapData.maxX || 
        x < mapData.minX || 
        y >= mapData.maxY || 
        y < mapData.minY
    )
}

function getRandomSafeSpot() {
    return randomFromArray([
        { x: 0, y: 1 },
        { x: 4, y: 0 },
        { x: 9, y: 3 },
        { x: 0, y: 10 },
        { x: 4, y: 10 },
        { x: 10, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 8 },
    ])
}

(function() {

    let playerId;
    let playerRef;
    let players = {};
    let playerElements = {};
    let coins = {};
    let coinElements = {};

    const gameContainer = document.querySelector(".game-container");
    const playerNameIpnut = document.querySelector("#player-name");
    const playerColorButton = document.querySelector("#player-color");

    
    const upButton = document.querySelector("#up");
    const downButton = document.querySelector("#down");
    const leftButton = document.querySelector("#left");
    const rightButton = document.querySelector("#right");

    function placeCoin() {
        const { x, y} = getRandomSafeSpot();
        const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
        coinRef.set({
            x,
            y,
        })

        const coinTimeouts = [2000, 3000, 4000, 5000];
        setTimeout(() => {
            placeCoin();
        }, randomFromArray(coinTimeouts))
    }

    function attemptGrabCoin(x, y) {
        const key = getKeyString(x, y);
        if (coins[key]) {
            setTimeout(() => {
                firebase.database().ref(`coins/${key}`).remove();
            }, 200)
            playerRef.update({
                coins: players[playerId].coins + 1,
            })
        }
    }

    function handlerArrowPress(xChange = 0, yChange = 0) {
        const newX = players[playerId].x + xChange;
        const newY = players[playerId].y + yChange;

        if (!isSolid(newX, newY)) {
            players[playerId].x = newX;
            players[playerId].y = newY;
            if (xChange === 1) {
                players[playerId].direction = "right"
            }
            if (xChange === -1) {
                players[playerId].direction = "left"
            }
            playerRef.set(players[playerId]);
            attemptGrabCoin(newX, newY);
        }
    }

    function initGame() {

        new KeyPressListener("KeyW", () => handlerArrowPress(0, -1));
        new KeyPressListener("KeyS", () => handlerArrowPress(0, 1));
        new KeyPressListener("KeyA", () => handlerArrowPress(-1, 0));
        new KeyPressListener("KeyD", () => handlerArrowPress(1, 0));

        const allPlayersRef = firebase.database().ref(`players`);
        const allCoinsRef = firebase.database().ref(`coins`);

        allPlayersRef.on("value", (snapshot) => {

            players = snapshot.val() || {};
            Object.keys(players).forEach(key => {
                const characterState = players[key];
                let el = playerElements[key];
                // update dom
                el.querySelector(".Character_name").innerText = characterState.name;
                el.querySelector(".Character_coins").innerText = characterState.coins;
                el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-direction", characterState.direction);
                const left = 60 * characterState.x + "px";
                const top = 60 * characterState.y + "px";
                el.style.transform = `translate3d(${left}, ${top}, 0)`;
            })
            
        });
        allPlayersRef.on("child_added", (snapshot) => {
            
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
            if (addedPlayer.id === playerId) {
                characterElement.classList.add("you");
            }
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_coins">0</span>
                </div>
                <div class="Character_you-arrow"></div>
            `);
            playerElements[addedPlayer.id] = characterElement;
            console.log(addedPlayer);
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 60 * addedPlayer.x + "px";
            const top = 60 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        });

        allPlayersRef.on("child_removed", (snapshot) => {
            const removeKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removeKey]);
            delete playerElements[removeKey];
        });

        allCoinsRef.on("child_added", (snapshot) => {
            const coin = snapshot.val();
            const key = getKeyString(coin.x, coin.y);
            coins[key] = true;

            const coinElement = document.createElement("div");
            coinElement.classList.add("Coin", "grid-cell");
            coinElement.innerHTML = (`
                <div class="Coin_shadow grid-cell"></div>
                <div class="Coin_sprite grid-cell"></div>
            `);
            const left = 60 * coin.x + "px";
            const top = 60 * coin.y + "px";
            coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            coinElements[key] = coinElement;
            gameContainer.appendChild(coinElement);
        });

        allCoinsRef.on("child_removed", (snapshot) => {
            const {x, y} = snapshot.val();
            const keyToRemove = getKeyString(x, y);
            gameContainer.removeChild( coinElements[keyToRemove] );
            delete coinElements[keyToRemove];
        });

        playerNameIpnut.addEventListener('change', (e) => {
            const newName = e.target.value || createName();
            playerNameIpnut.value = newName;
            playerRef.update({
                name: newName,
            })
        })
        playerColorButton.addEventListener('click', (e) => {
            const mySkinIndex = playerColors.indexOf(players[playerId].color);
            const nextColor = playerColors[mySkinIndex + 1] || playerColors[0]
            console.log(nextColor);
            playerRef.update({
                color: nextColor,
            })
        })

        playerColorButton.addEventListener('click', (e) => {
            const mySkinIndex = playerColors.indexOf(players[playerId].color);
            const nextColor = playerColors[mySkinIndex + 1] || playerColors[0]
            console.log(nextColor);
            playerRef.update({
                color: nextColor,
            })
        })

        upButton.addEventListener('click', (e) => {
            handlerArrowPress(0, -1)
        })
        downButton.addEventListener('click', (e) => {
            handlerArrowPress(0, 1)
        })
        leftButton.addEventListener('click', (e) => {
            handlerArrowPress(-1, 0)
        })
        rightButton.addEventListener('click', (e) => {
            handlerArrowPress(1, 0)
        })

        placeCoin();
    }

    firebase.auth().onAuthStateChanged((user) => {
        console.log(user);
        if (user) {
            // Логин
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);

            const name = createName();
            playerNameIpnut.value = name;

            const {x, y} = getRandomSafeSpot()

            // Добавляем в базу юзера (вход)
            playerRef.set({
                id: playerId,
                name,
                direction: "right",
                color: randomFromArray(playerColors),
                x,
                y,
                coins: 0,
            })

            // Удаляем из базы после отключения (выхода)
            playerRef.onDisconnect().remove();

            // Запуск игры
            initGame();
            

        } else {
            // АнЛогин


        }
    });

    firebase.auth().signInAnonymously().catch(error => {
        let errorCode = error.code;
        let errorMessage = error.message;

        console.log(errorCode, errorMessage);
    });

})();