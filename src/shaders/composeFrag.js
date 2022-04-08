const fragment = /* glsl */ `

uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 uv0;

void main() {
    gl_FragColor = ( texture2D( baseTexture, uv0 ) + vec4( 1.0 ) * texture2D( bloomTexture, uv0 ) );
}
`;

export default fragment;