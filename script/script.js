
// = 004 ======================================================================
// このサンプルは、最初の状態では 003 とまったく同じ内容です。
// これを、みなさん自身の手で修正を加えて「描かれる図形を五角形に」してみてくだ
// さい。
// そんなの余裕じゃろ～ と思うかも知れませんが……結構最初は難しく感じる人も多い
// かもしれません。なお、正確な正五角形でなくても良いものとします。
// ポイントは以下の点を意識すること！
// * canvas 全体が XY 共に -1.0 ～ 1.0 の空間になっている
// * gl.TRIANGLES では頂点３個がワンセットで１枚のポリゴンになる
// * つまりいくつかの頂点は「まったく同じ位置に重複して配置される」ことになる
// * 頂点座標だけでなく、頂点カラーも同じ個数分必要になる！
// ============================================================================

(() => {
    // 複数の関数で利用する広いスコープが必要な変数を宣言しておく
    let position = null;
    let color = null;
    let vbo = null;
    let uniform = null;
    let mouse = [0, 0];

    // audio 関連
    let ac, audioBufferSourceNode, audioAnalyser, audioCount;
    // インフォパネルの要素への参照を格納する変数
    let mouseIndicator, volumeBar;

    // webgl.js に記載のクラスをインスタンス化する
    const webgl = new WebGLUtility();

    // ドキュメントの読み込みが完了したら実行されるようイベントを設定する
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('webgl-canvas');
        webgl.initialize(canvas);
        const size = Math.min(window.innerWidth, window.innerHeight);
        webgl.width  = size;
        webgl.height = size;

        // インフォパネルの要素への参照を取得
        mouseIndicator = document.querySelector('#mouse-indicator');
        volumeBar = document.querySelector('#volume-bar');
    
        // マウスカーソルが動いた際のイベントを登録しておく
        window.addEventListener('mousemove', (event) => {
            mouse[0] = event.clientX / window.innerWidth;
            mouse[1] = event.clientY / window.innerHeight;
            
            // インフォパネルのマウス座標の表示を更新
            const truncatedMouse = {
                x: Math.floor(mouse[0] * 100) / 100,
                y: Math.floor(mouse[1] * 100) / 100,
            }
            mouseIndicator.innerHTML = `x: ${truncatedMouse.x}<br />y: ${truncatedMouse.y}`;
        }, false);

        let vs = null;
        let fs = null;
        WebGLUtility.loadFile('./shader/main.vert')
        .then((vertexShaderSource) => {
            vs = webgl.createShaderObject(vertexShaderSource, webgl.gl.VERTEX_SHADER);
            return WebGLUtility.loadFile('./shader/main.frag');
        })
        .then((fragmentShaderSource) => {
            fs = webgl.createShaderObject(fragmentShaderSource, webgl.gl.FRAGMENT_SHADER);
            webgl.program = webgl.createProgramObject(vs, fs);

            // 頂点とロケーションのセットアップは先に行っておく
            setupGeometry();
            setupLocation();

            return initAudio();
        })
        .then(buffer => {
            
            setAudio(buffer);
            
            // 準備ができたらレンダリングを開始
            render();

            document.querySelector('#audio-start').addEventListener('click', () => {
                // 音源の再生を開始
                audioBufferSourceNode.start(0);
            })

        });
    }, false);

    /**
     * 頂点属性（頂点ジオメトリ）のセットアップを行う
     */
    function setupGeometry(){
        const radius = 0.5;

        position = [
            0.0,  0.5,  0.0, // ひとつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(1)), radius * Math.sin(getAngular(1)), 0.0, // ふたつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(2)), radius * Math.sin(getAngular(2)), 0.0, // みっつ目の頂点の x, y, z 座標
            0.0,  0.5,  0.0, // よっつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(2)), radius * Math.sin(getAngular(2)), 0.0, // いつつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(3)), radius * Math.sin(getAngular(3)), 0.0, // むっつ目の頂点の x, y, z 座標
            0.0,  0.5,  0.0, // ななつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(3)), radius * Math.sin(getAngular(3)), 0.0, // やっつ目の頂点の x, y, z 座標
            radius * Math.cos(getAngular(4)), radius * Math.sin(getAngular(4)), 0.0, // ここのつ目頂点の x, y, z 座標
        ];
        color = [
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0,
        ];
        // 配列に入れておく
        vbo = [
            webgl.createVBO(position),
            webgl.createVBO(color),
        ];

        function getAngular(idx) {
            return ( Math.PI / 2 ) - ( 2 * Math.PI / 5 ) * idx; // １周の 5分の1 の角度
        }
    }

    /**
     * 頂点属性のロケーションに関するセットアップを行う
     */
    function setupLocation(){
        const gl = webgl.gl;
        // attribute location の取得と有効化
        const attLocation = [
            gl.getAttribLocation(webgl.program, 'position'),
            gl.getAttribLocation(webgl.program, 'color'),
        ];
        const attStride = [3, 4];
        webgl.enableAttribute(vbo, attLocation, attStride);

        // uniform 変数のロケーションを取得する
        uniform = {
            mouse: gl.getUniformLocation(webgl.program, 'mouse'),
            volume: gl.getUniformLocation(webgl.program, 'volume'),
        };
    }

    /**
     * レンダリングのためのセットアップを行う
     */
    function setupRendering(){
        const gl = webgl.gl;
        gl.viewport(0, 0, webgl.width, webgl.height);
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    /**
     * レンダリングを行う
     */
    function render(){

        // 時間領域の波形データを取得して audioCount 配列へ格納
        audioAnalyser.getByteTimeDomainData(audioCount);
        // この関数実行タイミングでの波形データの最大値を取得
        let volume = audioCount.reduce((a,b) => Math.max(a, b));
        // 0 〜 255 の値が入るので、 0 〜 1 になるように調整
        volume = volume / 255;

        const gl = webgl.gl;

        // 再帰呼び出しを行う
        requestAnimationFrame(render);

        // レンダリング時のクリア処理など
        setupRendering();

        // uniform 変数は常に変化し得るので毎フレーム値を送信する
        gl.uniform2fv(uniform.mouse, mouse);
        gl.uniform1f(uniform.volume, volume);

        // 登録されている VBO の情報をもとに頂点を描画する
        gl.drawArrays(gl.TRIANGLES, 0, position.length / 3);

        // ボリュームの大きさを示すバーの幅を変更
        volumeBar.style.width = `${volume * 200}px`;

    }


    /*-------------------------------*
    * Web Audio API 関連の関数定義部
    *-------------------------------*/

    /**
     * AudioContext の生成と、オーディオバッファソースノードとアナライザの生成と、
     * 音声データの取得を行い、デコード後の音声データで満足する Promise オブジェクトを返します。
     * @returns {Promise} デコードされた音声データで満足する Promise オブジェクト
     */
    function initAudio() {

        return new Promise((resolve, reject) => {

            // AudioContext の生成
            ac = new window.AudioContext();
            // 音声データの入力機能（AudioBufferSourceNode の生成）
            audioBufferSourceNode = ac.createBufferSource();
            // 音声データの波形取得機能（アナライザの生成）
            audioAnalyser = ac.createAnalyser();
            // 取得する音声データのパス
            const audioSource = '../audio/audio.mp3';

            const xhr = new XMLHttpRequest();
            xhr.open('GET', audioSource, true);
            xhr.responseType = 'arraybuffer';
            // 取得した音声データをデコードし、この後の処理に渡す
            xhr.onload = () => {
                ac.decodeAudioData(xhr.response, buffer => resolve(buffer));
            }
            xhr.send();

        });

    }

    /**
     * オーディオバッファを受け取り、各種設定及び各種ノードの接続を行い、
     * 音源の再生を開始します。
     * @param {AudioBuffer} buffer 
     */
    function setAudio(buffer) {

        // 描画の更新をスムーズにするかどうかを決める
        audioAnalyser.smoothingTimeConstant = 1.0;

        // 渡ってきた音声データを音源として設定
        audioBufferSourceNode.buffer = buffer;

        // 音源がループするように設定
        audioBufferSourceNode.loop = true;

        // 時間領域の波形データを格納する配列を生成
        audioCount = new Uint8Array(audioAnalyser.frequencyBinCount);

        // 音源をアナライザに接続
        audioBufferSourceNode.connect(audioAnalyser);

        // アナライザを出力先のノードに接続
        audioAnalyser.connect(ac.destination);

        // 音源の再生を開始
        // audioBufferSourceNode.start(0);

    }

})();

