const vertex = /* glsl */ `

varying vec2 uv0;

void main() {
    uv0 = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export default vertex;