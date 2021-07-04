attribute vec3 position;
attribute vec4 color;

uniform vec2 mouse;
uniform float volume; // 音源のボリュームを受け取る uniform 変数

varying vec4 vColor;

void main(){
    // varying 変数は、頂点カラーにマウスの影響を与えてから送る
    vColor = color * vec4(mouse, 1.0, 1.0);
    // R G B の各要素に volume の値を乗算
    vColor = vColor * vec4(volume, volume, volume, 1.0);
    gl_Position = vec4(position, 1.0);
}

