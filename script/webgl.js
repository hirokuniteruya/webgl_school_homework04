
/**
 * WebGL の API を目的別にまとめたユーティリティクラス
 * @class
 */
class WebGLUtility {
    /**
     * ファイルをテキストとして開く
     * @static
     * @param {string} path - 読み込むファイルのパス
     * @return {Promise}
     */
    static loadFile(path){
        return new Promise((resolve, reject) => {
            // fetch を使ってファイルにアクセスする
            fetch(path)
            .then((res) => {
                // テキストとして処理する
                return res.text();
            })
            .then((text) => {
                // テキストを引数に Promise を解決する
                resolve(text);
            })
            .catch((err) => {
                // なんらかのエラー
                reject(err);
            });
        });
    }

    /**
     * プロパティとして保持する canvas の幅
     * @type {number} w - canvas に設定する横幅
     */
    set width(w){
        this.canvas.width = w;
    }
    get width(){
        return this.canvas.width;
    }
    /**
     * プロパティとして保持する canvas の高さ
     * @type {number} h - canvas に設定する縦方向の高さ
     */
    set height(h){
        this.canvas.height = h;
    }
    get height(){
        return this.canvas.height;
    }
    /**
     * プロパティとして保持する WebGL コンテキストにプログラムオブジェクトを設定する
     * @type {WebGLProgram} prg - 設定するプログラムオブジェクト
     */
    set program(prg){
        // gl.useProgram で利用するプログラムオブジェクトを設定できる
        this.gl.useProgram(prg);
        // あとで取り出すこともできるようプロパティに保持しておく
        this.currentProgram = prg;
    }
    get program(){
        return this.currentProgram;
    }

    /**
     * @constructor
     */
    constructor(){
        this.canvas = null;
        this.gl = null;
        this.currentProgram = null;
    }
    /**
     * canvas を受け取り WebGL コンテキストを初期化する
     * @param {HTMLCanvasElement} canvas - WebGL コンテキストを取得する canvas 要素
     */
    initialize(canvas){
        // プロパティに保持しておく
        this.canvas = canvas;
        // canvas から WebGL コンテキスト取得を試みる
        this.gl = this.canvas.getContext('webgl');
        if(this.gl == null){
            // WebGL コンテキストが取得できない場合はエラー
            throw new Error('webgl not supported');
        }
    }
    /**
     * ソースコードからシェーダオブジェクトを生成する
     * @param {string} source - シェーダのソースコード
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @return {WebGLShader}
     */
    createShaderObject(source, type){
        const gl = this.gl;
        // 空のシェーダオブジェクトを生成する
        const shader = gl.createShader(type);
        // シェーダオブジェクトにソースコードを割り当てる
        gl.shaderSource(shader, source);
        // シェーダをコンパイルする
        gl.compileShader(shader);
        // コンパイル後のステータスを確認し問題なければシェーダオブジェクトを返す
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            throw new Error(gl.getShaderInfoLog(shader));
            return null;
        }
    }
    /**
     * シェーダオブジェクトからプログラムオブジェクトを生成する
     * @param {WebGLShader} vs - 頂点シェーダのシェーダオブジェクト
     * @param {WebGLShader} fs - フラグメントシェーダのシェーダオブジェクト
     * @return {WebGLProgram}
     */
    createProgramObject(vs, fs){
        const gl = this.gl;
        // 空のプログラムオブジェクトを生成する
        const program = gl.createProgram();
        // ２つのシェーダをアタッチ（関連付け）する
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        // シェーダオブジェクトをリンクする
        gl.linkProgram(program);
        // リンクが完了するとシェーダオブジェクトは不要になるので削除する
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        // リンク後のステータスを確認し問題なければプログラムオブジェクトを返す
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            throw new Error(gl.getProgramInfoLog(program));
            return null;
        }
    }
    /**
     * JavaScript の配列から VBO（Vertex Buffer Object）を生成する
     * @param {Array.<number>} vertexArray - 頂点属性情報の配列
     * @return {WebGLBuffer}
     */
    createVBO(vertexArray){
        const gl = this.gl;
        // 空のバッファオブジェクトを生成する
        const vbo = gl.createBuffer();
        // バッファを gl.ARRAY_BUFFER としてバインドする
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        // バインドしたバッファに Float32Array オブジェクトに変換した配列を設定する
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
        // 安全のために最後にバインドを解除してからバッファオブジェクトを返す
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    /**
     * 頂点属性情報を有効化しロケーションと紐付ける
     * @param {Array.<WebGLBuffer>} vbo - 頂点属性を格納した VBO の配列
     * @param {Array.<number>} attLocation - 頂点属性ロケーションの配列
     * @param {Array.<number>} attStride - 頂点属性のストライドの配列
     */
    enableAttribute(vbo, attLocation, attStride){
        const gl = this.gl;
        vbo.forEach((buffer, index) => {
            // 有効化したいバッファをまずバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            // 頂点属性ロケーションの有効化を行う
            gl.enableVertexAttribArray(attLocation[index]);
            // 対象のロケーションのストライドやデータ型を設定する
            gl.vertexAttribPointer(attLocation[index], attStride[index], gl.FLOAT, false, 0, 0);
        });
    }
}

