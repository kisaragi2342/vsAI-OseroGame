document.addEventListener('DOMContentLoaded', () => {
    // このコードは、ウェブページが完全に読み込まれたときに実行されるように設定されています。
    // オセロゲームの画面要素やゲームの進行をJavaScriptで制御するために使われます。

    // --- DOM Elements (HTML要素をJavaScriptで操作できるように取得しています) ---
    // タイトル画面全体を表す要素
    const titleScreen = document.getElementById('title-screen');
    // ゲーム画面全体を表す要素
    const gameScreen = document.getElementById('game-screen');
    // 盤面の幅を入力するテキストボックスの要素
    const boardWidthInput = document.getElementById('board-width-input');
    // 盤面の高さを入力するテキストボックスの要素
    const boardHeightInput = document.getElementById('board-height-input');
    // 盤面サイズのエラーメッセージを表示する要素
    const sizeErrorMessage = document.getElementById('size-error-message');
    // 難易度選択ボタンをすべて取得します（複数のボタンがあるのでquerySelectorAllを使います）
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    // ゲーム開始ボタンの要素
    const startGameButton = document.getElementById('start-game-button');
    // タイトル画面に戻るボタンの要素
    const backToTitleButton = document.getElementById('back-to-title-button');
    // ミュートボタンの要素
    const muteButton = document.getElementById('mute-button');
    // 現在のゲーム情報（盤面サイズや難易度）を表示する要素
    const currentGameInfoDisplay = document.getElementById('current-game-info-display');
    // オセロ盤のマス目を格納する親要素
    const boardContainer = document.getElementById('board-container');
    // プレイヤー（黒）のスコアを表示する要素
    const blackScoreSpan = document.getElementById('black-score');
    // AI（白）のスコアを表示する要素
    const whiteScoreSpan = document.getElementById('white-score');
    // 現在どちらのターンかを表示する要素
    const currentTurnIndicator = document.getElementById('current-turn-indicator');
    // ゲームをリセットするボタンの要素
    const resetButton = document.getElementById('reset-button');
    // ゲーム中のメッセージ（パス、ゲーム終了など）を表示する要素
    const messageElement = document.getElementById('message');

    // --- Game Constants & Variables (ゲームで使用する定数と変数です) ---
    // プレイヤー（黒石）を表す数値
    const PLAYER = 1;
    // AI（白石）を表す数値
    const AI = 2;
    // 石が置かれていない空のマスを表す数値
    const EMPTY = 0;
    // オセロ盤の現在の幅（初期値は8）
    let boardWidth = 8;
    // オセロ盤の現在の高さ（初期値は8）
    let boardHeight = 8;
    // オセロ盤の状態を記録する二次元配列（例: board[行][列] = 石の種類）
    let board = [];
    // 現在のターンプレイヤー（PLAYERかAIか）
    let currentPlayer = PLAYER;
    // ゲームが現在進行中かどうかを示す真偽値
    let gameRunning = true;
    // 選択されているAIの難易度（'easy', 'normal', 'hard'のいずれか）
    let selectedDifficulty = 'normal';
    // 効果音がミュートされているかどうかを示す真偽値
    let isMuted = false;

    // オセロの石をひっくり返す際にチェックする8方向（上、下、左、右、斜め4方向）
    const directions = [
        [-1, -1], [-1, 0], [-1, 1], // 左上、上、右上
        [0, -1],           [0, 1],  // 左、右
        [1, -1], [1, 0], [1, 1]   // 左下、下、右下
    ];

    // --- Sound Effects (ゲームの効果音に関する設定です) ---
    // 各効果音の音声ファイルを読み込みます。
    const sounds = {
        place: new Audio('sounds/place.wav'), // 石を置く音
        flip: new Audio('sounds/flip.wav'),   // 石がひっくり返る音
        pass: new Audio('sounds/pass.wav'),   // パスする音
        win: new Audio('sounds/win.wav'),     // 勝利した時の音
        lose: new Audio('sounds/lose.wav'),   // 敗北した時の音
        draw: new Audio('sounds/draw.wav'),   // 引き分けの音
        click: new Audio('sounds/click.wav')  // ボタンをクリックする音
    };

    // playSound関数：指定された効果音を再生します。
    function playSound(soundName) {
        // ミュート状態ではない、かつ、指定された効果音が存在する場合のみ再生します。
        if (!isMuted && sounds[soundName]) {
            sounds[soundName].currentTime = 0; // 音の再生位置を最初に戻し、繰り返し再生できるようにします。
            sounds[soundName].play().catch(error => console.error("Error playing sound:", soundName, error)); // 音を再生し、エラーが発生した場合はコンソールに表示します。
        }
    }

    // --- Title Screen Logic (タイトル画面での操作に関する処理です) ---
    // 各難易度ボタンにクリックイベントリスナーを設定します。
    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            playSound('click'); // ボタンクリック音を鳴らします。
            // まず、すべての難易度ボタンから「選択済み」を示すクラス（'selected'）を削除します。
            difficultyButtons.forEach(btn => btn.classList.remove('selected'));
            // そして、クリックされたボタンに「選択済み」クラスを追加します。
            button.classList.add('selected');
            // 選択された難易度をデータ属性（data-difficulty）から取得し、変数に保存します。
            selectedDifficulty = button.dataset.difficulty;
        });
    });

    // ゲームスタートボタンがクリックされたときの処理です。
    startGameButton.addEventListener('click', () => {
        playSound('click'); // ボタンクリック音を鳴らします。
        // 入力された盤面の幅と高さを整数に変換して取得します。
        const width = parseInt(boardWidthInput.value);
        const height = parseInt(boardHeightInput.value);

        // 盤面サイズの入力値が有効かどうかをチェックします。
        // 幅と高さが両方とも6～16の偶数である必要があります。
        if (width % 2 !== 0 || height % 2 !== 0 ||
            width < 6 || width > 16 || height < 6 || height > 16) {
            sizeErrorMessage.textContent = "幅と高さは6～16の偶数を指定してください。"; // エラーメッセージを表示します。
            return; // ここで処理を中断し、ゲームを開始しません。
        }
        sizeErrorMessage.textContent = ""; // エラーがなければメッセージをクリアします。
        boardWidth = width;   // ゲームの盤面幅を更新します。
        boardHeight = height; // ゲームの盤面高さを更新します。

        // 画面の表示を切り替えます。
        titleScreen.style.display = 'none'; // タイトル画面を非表示にします。
        gameScreen.style.display = 'flex'; // ゲーム画面を表示します。

        // 現在のゲーム情報（盤面サイズと難易度）を表示用に整形します。
        let difficultyText = "";
        if (selectedDifficulty === "easy") difficultyText = "易しい";
        else if (selectedDifficulty === "normal") difficultyText = "普通";
        else if (selectedDifficulty === "hard") difficultyText = "難しい";
        currentGameInfoDisplay.textContent = `盤面: ${boardWidth}x${boardHeight}, 難易度: ${difficultyText}`;

        initializeBoard(); // オセロ盤を初期状態に設定します。
    });

    // タイトルへ戻るボタンがクリックされたときの処理です。
    backToTitleButton.addEventListener('click', () => {
        playSound('click'); // ボタンクリック音を鳴らします。
        gameScreen.style.display = 'none'; // ゲーム画面を非表示にします。
        titleScreen.style.display = 'flex'; // タイトル画面を表示します。
    });

    // ミュートボタンがクリックされたときの処理です。
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted; // isMutedの状態を反転させます（trueならfalse、falseならtrue）。
        muteButton.textContent = isMuted ? "ミュート解除" : "ミュート"; // ボタンの表示テキストをミュート状態に合わせて切り替えます。
        muteButton.classList.toggle('muted', isMuted); // 'muted'クラスの追加・削除を行い、ボタンの見た目を切り替えます。
    });

    // --- Game Logic Functions (ゲームの主要な動きを制御する関数群です) ---

    // initializeBoard関数：ゲーム盤を初期化し、ゲームの準備を行います。
    function initializeBoard() {
        // boardHeightの行数で、各行がboardWidthの列数を持つ空の（EMPTY）二次元配列を作成します。
        board = Array(boardHeight).fill(null).map(() => Array(boardWidth).fill(EMPTY));
        // オセロの初期配置（中央に互い違いに2つずつ石を置く）を設定します。
        const midX1 = boardWidth / 2 - 1, midX2 = boardWidth / 2;
        const midY1 = boardHeight / 2 - 1, midY2 = boardHeight / 2;
        board[midY1][midX1] = AI;     // 左上（AIの石）
        board[midY1][midX2] = PLAYER; // 右上（プレイヤーの石）
        board[midY2][midX1] = PLAYER; // 左下（プレイヤーの石）
        board[midY2][midX2] = AI;     // 右下（AIの石）

        currentPlayer = PLAYER; // 最初のターンはプレイヤーから開始します。
        gameRunning = true;     // ゲームの状態を「進行中」に設定します。
        messageElement.textContent = ''; // 表示されているメッセージをクリアします。
        // CSS Gridのテンプレート（マス目の配置）を現在の盤面サイズに合わせて設定します。
        boardContainer.style.gridTemplateColumns = `repeat(${boardWidth}, 1fr)`;
        boardContainer.style.gridTemplateRows = `repeat(${boardHeight}, 1fr)`;
        renderBoard();          // 盤面の見た目を現在の状態に合わせて描画します。
        updateScoreAndTurn();   // スコアと現在のターン表示を更新します。
    }

    // renderBoard関数：現在のゲーム盤の状態（board配列）に基づいて、HTMLの盤面（マス目と石）を再描画します。
    function renderBoard() {
        boardContainer.innerHTML = ''; // 既存のマス目をすべて削除し、盤面をクリアします。
        // 現在のプレイヤーが石を置ける場所（有効な手）を計算します。
        // ゲームが進行中で、現在のプレイヤーが人間（PLAYER）の場合のみ計算します。
        const validMovesForPlayer = (currentPlayer === PLAYER && gameRunning) ? getAllValidMoves(PLAYER) : [];

        // 盤面の各行、各列をループしてマス目を作成・更新します。
        for (let row = 0; row < boardHeight; row++) {
            for (let col = 0; col < boardWidth; col++) {
                const cell = document.createElement('div'); // 新しいマス目（div要素）を作成します。
                cell.classList.add('cell'); // CSSクラス'cell'を追加して、スタイルを適用します。
                cell.dataset.row = row; // データ属性に現在の行番号を保存します。
                cell.dataset.col = col; // データ属性に現在の列番号を保存します。

                const discData = board[row][col]; // 現在のマスにどのような石があるか（PLAYER, AI, EMPTY）を取得します。
                if (discData !== EMPTY) { // もし石が置かれているマスであれば
                    const disc = document.createElement('div'); // 石（div要素）を作成します。
                    disc.classList.add('disc'); // CSSクラス'disc'を追加します。
                    // 石の種類（黒か白か）に応じて、対応するCSSクラスを追加します。
                    disc.classList.add(discData === PLAYER ? 'black' : 'white');
                    // アニメーションが常に正しい初期状態から始まるように、transformプロパティを初期化します。
                    if (disc.style.transform === '') { // 初めて石が描画される場合などに適用
                        disc.style.transform = 'rotateY(0deg)';
                    }
                    cell.appendChild(disc); // 作成した石をマス目に追加します。
                } else if (currentPlayer === PLAYER && gameRunning) { // 石がなく、プレイヤーのターンでゲーム進行中なら
                    // このマスがプレイヤーにとって有効な手であるかをチェックします。
                    if (validMovesForPlayer.some(move => move.row === row && move.col === col)) {
                        cell.classList.add('playable'); // 有効な手であれば、'playable'クラスを追加して視覚的に示します。
                    }
                }
                // 各マス目にクリックイベントリスナーを設定します。クリックされたらhandleCellClick関数が実行されます。
                cell.addEventListener('click', handleCellClick);
                boardContainer.appendChild(cell); // 作成したマス目をオセロ盤のコンテナに追加します。
            }
        }
    }

    // handleCellClick関数：ユーザーが盤面のマス目をクリックしたときに実行されます。
    // asyncキーワードは、この関数内で非同期処理（awaitを使った待機）が行われることを示します。
    async function handleCellClick(event) {
        // ゲームが進行中でない場合、またはAIのターンの場合は、何もしないで処理を終了します。
        if (!gameRunning || currentPlayer === AI) return;
        const targetCell = event.currentTarget; // クリックされたマス目のHTML要素を取得します。
        // データ属性から、クリックされたマスの行と列の番号を取得します。
        const row = parseInt(targetCell.dataset.row);
        const col = parseInt(targetCell.dataset.col);

        // クリックされたマスに石を置いたときに、ひっくり返せる石のリストを取得します。
        const flippableDiscs = getFlippableDiscs(row, col, PLAYER);
        // ひっくり返せる石が1つ以上ある場合（＝有効な手の場合）
        if (flippableDiscs.length > 0) {
            playSound('place'); // 石を置く効果音を鳴らします。

            // 1. **盤面データ（JavaScriptの内部状態）を更新します。**
            // クリックされたマスにプレイヤー（黒）の石を置きます。
            board[row][col] = PLAYER;

            // 2. **新しい石を視覚的に盤面に追加します。**
            // クリックされたマス目の内容を一度クリアします（これにより、'playable'のハイライトなどが消えます）。
            targetCell.innerHTML = '';
            const newDiscElement = document.createElement('div'); // 新しい石のDOM要素を作成します。
            newDiscElement.classList.add('disc', 'black'); // 'disc'と'black'のCSSクラスを追加します。
            newDiscElement.style.transform = 'rotateY(0deg)'; // CSSアニメーションが正しく始まるように初期状態を設定します。
            targetCell.appendChild(newDiscElement); // マス目に新しい石を追加します。
            targetCell.classList.remove('playable'); // マス目から'playable'クラスを削除します。

            // 3. **ひっくり返る石のアニメーションを実行し、完了するまで待機します。**
            // animateFlips関数は非同期なので、awaitを使ってアニメーションが全て終わるのを待ちます。
            await animateFlips(flippableDiscs, PLAYER);

            messageElement.textContent = ''; // ゲームメッセージをクリアします。
            // 4. **アニメーション完了後、盤面全体を再描画して、見た目と内部データの一貫性を保ちます。**
            renderBoard();
            // 5. **スコア表示と現在のターンの情報を更新し、ゲーム終了条件をチェックします。**
            updateScoreAndTurn();

            // 6. **ゲームがまだ進行中であれば、次のプレイヤーにターンを切り替えます。**
            if (gameRunning) {
                switchPlayer();
            }
        } else {
            // 有効な手ではない場合、エラーメッセージを表示します。
            messageElement.textContent = "そこには置けません。";
        }
    }

    // animateFlips関数：指定された石をひっくり返すアニメーションを実行します。
    // この関数も非同期なので、awaitでアニメーションの完了を待つことができます。
    async function animateFlips(discsToFlip, newPlayerOwner) {
        let flipSoundPlayedThisTurn = false; // このターンでひっくり返す音を一度だけ鳴らすためのフラグです。

        // ひっくり返す必要がある各石の座標（discCoord）を順番に処理します。
        for (const discCoord of discsToFlip) {
            // 該当するマス目のHTML要素と、その中にある石のHTML要素を取得します。
            const cellElement = boardContainer.querySelector(`.cell[data-row='${discCoord.row}'][data-col='${discCoord.col}']`);
            const discElement = cellElement ? cellElement.querySelector('.disc') : null; // cellElementが存在する場合のみ、その中の石を取得します。

            if (discElement) { // 石の要素が見つかった場合
                // 今回のターンでまだひっくり返す音を鳴らしておらず、かつひっくり返す石がある場合
                if (!flipSoundPlayedThisTurn && discsToFlip.length > 0) {
                    playSound('flip'); // ひっくり返す効果音を鳴らします。
                    flipSoundPlayedThisTurn = true; // フラグを立てて、このターンではもう音を鳴らさないようにします。
                }

                // 新しい石の所有者（ひっくり返った後の色）に応じて、目標とするCSSクラスとアニメーションクラスを設定します。
                const targetColorClass = newPlayerOwner === PLAYER ? 'black' : 'white'; // 最終的に石が黒になるか白になるか
                const animationClass = newPlayerOwner === PLAYER ? 'flipping-to-black' : 'flipping-to-white'; // 実行するアニメーションの種類

                // アニメーションを開始する前に、石のCSSのtransformプロパティをリセットします。
                // これにより、常に初期の回転Y軸0度からアニメーションが開始されます。
                discElement.style.transform = 'rotateY(0deg)';
                // 既存の色とアニメーションクラスをすべて削除します。
                discElement.classList.remove('white', 'black', 'flipping-to-white', 'flipping-to-black');
                // アニメーションが始まる前に、石がひっくり返る前の色（相手の色）を一時的に設定します。
                // これは、CSSアニメーションの最初の半分でこの色が表示されるようにするためです。
                discElement.classList.add(newPlayerOwner === PLAYER ? 'white' : 'black');

                // `void discElement.offsetWidth;` は、ブラウザに強制的に再描画（リフロー）を行わせるテクニックです。
                // これにより、上記の色変更がすぐに適用され、その後にアニメーションが開始されることが保証されます。
                void discElement.offsetWidth;

                discElement.classList.add(animationClass); // アニメーションクラスを追加し、CSSアニメーションを開始させます。

                // CSSアニメーション（transition）が完了するまで500ミリ秒（0.5秒）待機します。
                await new Promise(resolve => setTimeout(resolve, 500));

                // アニメーションが完了したら、アニメーションクラスを削除します。
                discElement.classList.remove(animationClass);
                // 古い色クラスを削除し、最終的な色クラスを追加します。
                discElement.classList.remove('white', 'black');
                discElement.classList.add(targetColorClass);
                // アニメーション完了後の最終的な見た目のために、transformを再度設定します。
                // （CSSのキーフレームが最終的な状態を維持する場合、この行は必ずしも必要ではありませんが、安全のために入れています。）
                discElement.style.transform = 'rotateY(0deg)';

                // **このひっくり返された石の盤面データも更新します。**
                board[discCoord.row][discCoord.col] = newPlayerOwner;
            }
        }
        // この関数内では renderBoard() や updateScoreAndTurn() を呼び出しません。
        // これらは石を置いた後のメインの処理関数（handleCellClickやaiMove）から呼び出されます。
    }

    // getFlippableDiscs関数：指定された位置に、指定されたプレイヤーの石を置いたときに、
    // どの石がひっくり返されるかを計算し、その座標のリストを返します。
    function getFlippableDiscs(row, col, player) {
        // もし指定されたマスにすでに石がある場合、そこには置けないので空のリストを返します。
        if (board[row][col] !== EMPTY) return [];
        // 相手の石の種類を決定します。（プレイヤーが1なら相手は2、プレイヤーが2なら相手は1）
        const opponent = player === PLAYER ? AI : PLAYER;
        let allFlippable = []; // ひっくり返せる石の座標を格納するリストです。

        // 8つの方向すべてについてチェックします。
        for (const [dr, dc] of directions) {
            let r = row + dr, c = col + dc; // 現在のマスから1マス先の座標を計算します。
            let line = []; // この方向でひっくり返せる石の一時的なリストです。

            // 盤面の範囲内で、かつ相手の石が連続している間、ループを続けます。
            while (r >= 0 && r < boardHeight && c >= 0 && c < boardWidth && board[r][c] === opponent) {
                line.push({row: r, col: c}); // ひっくり返せる候補として、その石の座標をリストに追加します。
                r += dr; c += dc; // さらに1マス先に進みます。
            }
            // ループを抜けた後、その先に自分の石があり、かつ途中に相手の石が1つ以上挟まっていた場合
            if (r >= 0 && r < boardHeight && c >= 0 && c < boardWidth && board[r][c] === player && line.length > 0) {
                // この方向で見つかったひっくり返せる石を、全体のリストに追加します。
                allFlippable = allFFlippable.concat(line);
            }
        }
        return allFlippable; // 最終的にひっくり返せるすべての石のリストを返します。
    }

    // getAllValidMoves関数：指定されたプレイヤーが現在の盤面で石を置けるすべての場所（有効な手）を計算し、リストで返します。
    function getAllValidMoves(player) {
        const validMoves = []; // 有効な手を格納するリストです。
        // 盤面の全てのマスを順番にチェックします。
        for (let r = 0; r < boardHeight; r++) {
            for (let c = 0; c < boardWidth; c++) {
                if (board[r][c] === EMPTY) { // もしそのマスが空であれば
                    // そのマスに石を置いたときにひっくり返せる石があるかチェックします。
                    const flippable = getFlippableDiscs(r, c, player);
                    if (flippable.length > 0) { // ひっくり返せる石が1つ以上あれば、そこは有効な手です。
                        // 有効な手のリストに、そのマスの座標とひっくり返せる石の数を追加します。
                        validMoves.push({ row: r, col: c, count: flippable.length });
                    }
                }
            }
        }
        return validMoves; // すべての有効な手のリストを返します。
    }

    // switchPlayer関数：現在のターンプレイヤーを切り替え、次のターンの処理を開始します。
    function switchPlayer() {
        // 現在のプレイヤーをプレイヤー（PLAYER）からAIへ、またはAIからプレイヤーへ切り替えます。
        currentPlayer = (currentPlayer === PLAYER) ? AI : PLAYER;

        // ゲームが進行中でない場合は、これ以上処理を行わずに終了します。
        if (!gameRunning) return;

        // 新しく番になったプレイヤー（切り替わった後のプレイヤー）の有効な手をすべて取得します。
        const validMovesCurrent = getAllValidMoves(currentPlayer);

        if (validMovesCurrent.length === 0) { // 現在のプレイヤーに有効な手が一つもない場合（＝パス）
            playSound('pass'); // パス音を鳴らします。
            // どちらのプレイヤーがパスしたかをメッセージとして表示します。
            messageElement.textContent = `${currentPlayer === PLAYER ? "あなた" : "AI"} はパスです。`;

            // 有効な手がないので、さらにプレイヤーを切り替えて、もう一度相手の番にします。
            currentPlayer = (currentPlayer === PLAYER) ? AI : PLAYER;
            // 再び切り替わったプレイヤー（最初にパスしたプレイヤーの相手）の有効な手を取得します。
            const validMovesOpponent = getAllValidMoves(currentPlayer);

            if (validMovesOpponent.length === 0) { // もし、その相手のプレイヤーにも有効な手がない場合（＝両者パス）
                updateScoreAndTurn(); // 最終スコアを更新し、表示します。
                announceWinner(); // ゲームの勝敗を決定し、発表します。
                return; // ここで処理を終了します。
            }
        }

        // スコア表示と現在のターン表示を更新し、ゲーム終了条件を再チェックします。
        // これは、パスが発生しなかった場合や、パス後の相手の番になった場合に呼ばれます。
        updateScoreAndTurn();

        // もし現在のプレイヤーがAIで、ゲームが進行中であれば、AIの次の手を進めます。
        if (currentPlayer === AI && gameRunning) {
            currentTurnIndicator.textContent = "AIが思考中です..."; // AIが考えていることをユーザーに伝えます。
            // 少し遅延させてからaiMove関数を呼び出します。（ユーザーがアニメーションを見る時間を与えるため）
            // Math.random() * 500 + 1200 は、1.2秒から1.7秒のランダムな遅延を意味します。
            setTimeout(aiMove, Math.random() * 500 + 1200);
        } else if (gameRunning && currentPlayer === PLAYER) {
            // もし現在のプレイヤーが人間（PLAYER）でゲームが進行中であれば、盤面を再描画します。
            // これにより、新しいターンになったときに、プレイヤーが置ける場所（ヒント）が正しく表示されます。
            renderBoard();
        }
    }

    // aiMove関数：AIが盤面を分析し、最適な手を選んで石を置く処理を実行します。
    // この関数も非同期なので、アニメーションの完了を待つことができます。
    async function aiMove() {
        if (!gameRunning) return; // ゲームが進行中でなければ、何もしないで終了します。

        let bestMove = null; // AIが選んだ最も良い手を格納する変数です。
        const validMoves = getAllValidMoves(AI); // AIが現在置けるすべての有効な手を取得します。

        if (validMoves.length === 0) { // AIが置けるマスが一つもない場合
            // AIはパスすることになります。switchPlayer関数がこのパスの処理とターン切り替えを行います。
            if (gameRunning) switchPlayer();
            return; // ここで処理を終了します。
        }

        // AIの難易度に応じた手の選択ロジックです。
        if (selectedDifficulty === 'easy') { // 難易度が「易しい」の場合
            // 有効な手の中からランダムに一つを選びます。
            bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else { // 難易度が「普通」または「難しい」の場合
            if (selectedDifficulty === 'hard') { // 難易度が「難しい」の場合
                const corners = [ // オセロ盤の四隅の座標を定義します。
                    {r:0, c:0}, {r:0, c:boardWidth-1},
                    {r:boardHeight-1, c:0}, {r:boardHeight-1, c:boardWidth-1}
                ];
                let cornerMove = null;
                // 四隅に石を置ける有効な手があるかチェックします。
                for (const corner of corners) {
                    const moveAtCorner = validMoves.find(m => m.row === corner.r && m.col === corner.c);
                    if (moveAtCorner) { // もし四隅に置ける手が見つかれば
                        cornerMove = moveAtCorner; // その手を最も良い手として設定し
                        break; // ループを終了します。
                    }
                }
                if (cornerMove) bestMove = cornerMove; // 四隅に置ける手があればそれを選択します。
            }
            if (!bestMove) { // もし四隅に置ける手がなかった場合（または難易度が「普通」の場合）
                // 有効な手を、ひっくり返せる石の数が多い順にソートします。（より多くの石をひっくり返す手を選ぶ）
                validMoves.sort((a, b) => b.count - a.count);
                bestMove = validMoves[0]; // ソートされたリストの最初の要素（最もひっくり返せる数が多い手）を選びます。
            }
        }

        if (bestMove) { // 最も良い手（bestMove）が見つかった場合
            playSound('place'); // 石を置く効果音を鳴らします。
            // 選ばれた手で石を置いたときにひっくり返せる石のリストを取得します。
            const flippableDiscs = getFlippableDiscs(bestMove.row, bestMove.col, AI);

            // 1. **盤面データ（JavaScriptの内部状態）を更新します。**
            // AIが選んだマスにAI（白）の石を置きます。
            board[bestMove.row][bestMove.col] = AI;

            // 2. **新しい石を視覚的に盤面に追加します。**
            // AIが石を置いたマス目のHTML要素を取得します。
            const aiPlacedCell = boardContainer.querySelector(`.cell[data-row='${bestMove.row}'][data-col='${bestMove.col}']`);
            if (aiPlacedCell) {
                aiPlacedCell.innerHTML = ''; // マス目の内容をクリアします。
                const aiNewDiscElement = document.createElement('div'); // 新しい石のDOM要素を作成します。
                aiNewDiscElement.classList.add('disc', 'white'); // 'disc'と'white'のCSSクラスを追加します。
                aiNewDiscElement.style.transform = 'rotateY(0deg)'; // CSSアニメーションが正しく始まるように初期状態を設定します。
                aiPlacedCell.appendChild(aiNewDiscElement); // マス目に新しい石を追加します。
            }

            // 3. **ひっくり返る石のアニメーションを実行し、完了するまで待機します。**
            await animateFlips(flippableDiscs, AI);

            // AIがどのマスに石を置いたかをメッセージとして表示します。
            messageElement.textContent = `AI が (${bestMove.row + 1}, ${bestMove.col + 1}) に置きました。`;
            // 4. **アニメーション完了後、盤面全体を再描画して、見た目と内部データの一貫性を保ちます。**
            renderBoard();
            // 5. **スコア表示と現在のターンの情報を更新します。**
            updateScoreAndTurn();

            // 6. **ゲームがまだ進行中であれば、次のプレイヤーにターンを切り替えます。**
            if (gameRunning) {
                switchPlayer();
            }
        }
        // bestMoveがnullの場合（有効な手がない場合）は、aiMove関数が呼ばれた時点で
        // すでにswitchPlayer()が呼ばれてパス処理が行われているはずなので、ここでは何もせず終了します。
    }

    // updateScoreAndTurn関数：現在の盤面上の黒石、白石の数を数え、スコアとターン表示を更新します。
    function updateScoreAndTurn() {
        let blackCount = 0, whiteCount = 0, emptyCount = 0; // 黒石、白石、空のマス目の数を初期化します。
        // 盤面の全てのマスをループして、それぞれの石の種類を数えます。
        for (let r = 0; r < boardHeight; r++) {
            for (let c = 0; c < boardWidth; c++) {
                if (board[r][c] === PLAYER) blackCount++; // プレイヤー（黒）の石があればカウント
                else if (board[r][c] === AI) whiteCount++;   // AI（白）の石があればカウント
                else emptyCount++; // 石がなければ空のマスとしてカウント
            }
        }
        blackScoreSpan.textContent = blackCount; // 黒石のスコア表示を更新します。
        whiteScoreSpan.textContent = whiteCount; // 白石のスコア表示を更新します。

        if (!gameRunning) return; // ゲームがすでに終了している場合は、これ以上処理を行いません。

        // 現在のターン表示を更新します。
        currentTurnIndicator.textContent = (currentPlayer === PLAYER) ? "あなたの番です" : "AIの番です";

        // ゲーム終了条件をチェックします。スコアとターンが更新された後に行われます。
        // 終了条件は以下のいずれかです。
        // 1. 全てのマスが埋まった場合 (emptyCount === 0)
        // 2. プレイヤーもAIもどちらも石を置ける場所がない場合 (!getAllValidMoves(PLAYER).length && !getAllValidMoves(AI).length)
        if (emptyCount === 0 || (!getAllValidMoves(PLAYER).length && !getAllValidMoves(AI).length)) {
            if (gameRunning) { // announceWinner関数が複数回呼び出されないようにチェックします。
                // わずかな遅延を置いてからannounceWinner関数を呼び出します。
                // これにより、最後のUI更新（スコアなど）がユーザーに見える時間が確保されます。
                setTimeout(announceWinner, 150);
            }
        }
    }

    // announceWinner関数：ゲームが終了した際に、勝敗を判定し、その結果をユーザーに表示します。
    function announceWinner() {
        if (!gameRunning) return; // 既にゲームが終了している場合は、重複して処理を行いません。
        gameRunning = false; // ゲームの状態を「終了」に設定します。

        let blackCount = 0, whiteCount = 0; // 最終的な黒石と白石の数を数えます。
        for (let r = 0; r < boardHeight; r++) {
            for (let c = 0; c < boardWidth; c++) {
                if (board[r][c] === PLAYER) blackCount++; // 黒石の数をカウント
                if (board[r][c] === AI) whiteCount++;     // 白石の数をカウント
            }
        }
        let winMessage = "ゲーム終了！ "; // 表示するメッセージの初期部分です。
        if (blackCount > whiteCount) {
            winMessage += `あなたの勝ちです (${blackCount} 対 ${whiteCount})。`; // プレイヤーの勝利メッセージ
            playSound('win'); // 勝利の効果音を鳴らします。
        } else if (whiteCount > blackCount) {
            winMessage += `AIの勝ちです (${whiteCount} 対 ${blackCount})。`; // AIの勝利メッセージ
            playSound('lose'); // 敗北の効果音を鳴らします。
        } else {
            winMessage += `引き分けです (${blackCount} 対 ${whiteCount})。`; // 引き分けメッセージ
            playSound('draw'); // 引き分けの効果音を鳴らします。
        }
        messageElement.textContent = winMessage; // 最終メッセージを画面に表示します。
        currentTurnIndicator.textContent = "ゲーム終了"; // ターン表示を「ゲーム終了」に更新します。
    }

    // resetButtonがクリックされたときの処理です。
    resetButton.addEventListener('click', () => {
        playSound('click'); // ボタンクリック音を鳴らします。
        initializeBoard(); // 盤面を初期化して、新しいゲームを開始します。
    });

    // Initialize (ページ読み込み時の初期設定です)
    // ページがロードされたときに、まずタイトル画面を表示し、ゲーム画面は非表示にします。
    titleScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    // ミュートボタンの初期テキストとクラスを設定します。
    muteButton.textContent = isMuted ? "ミュート解除" : "ミュート";
    muteButton.classList.toggle('muted', isMuted);
});