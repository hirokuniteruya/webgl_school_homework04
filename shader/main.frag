precision mediump float;
varying vec4 vColor;

void main(){
    // varying 変数で受け取った色をそのまま出力
    gl_FragColor = vColor;
}

