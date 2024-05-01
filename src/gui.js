import Stats from 'https://unpkg.com/three@v0.162.0/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/three@v0.162.0/examples/jsm/libs/lil-gui.module.min.js';
export class GuiScene {

    constructor(api, params, container, renderer, bloomPass) {
        this.stats = new Stats();
        container.appendChild(this.stats.dom);
        this.gui = new GUI();
        const configFolder = this.gui.addFolder('config');
        configFolder.close();
        configFolder.add(api, 'size', 20, 200).step(1);
        configFolder.add(api, 'radius', 2, 64).step(1);
        configFolder.add(api, 'transition_speed', 0, 20).step(0.1);
        configFolder.add(api, 'rotation_speed', -2, 2).step(0.1).name("Rotation Speed");
        configFolder.add(api, 'cube_rotation_speed', -2, 2).step(0.1).name("Cube Rotation Speed");
        configFolder.add(api, 'time_step', 0.1, 10).name("Time Step");
        configFolder.add(api, 'camera_position_x', -20, 20).name("Camera X");
        configFolder.add(api, 'camera_position_y', -20, 20).name("Camera Y");
        configFolder.add(api, 'camera_position_z', 0, 100).name("Camera Z");
        configFolder.add(api, "zero").name("Zero");
        configFolder.add(api, "linea").name("Linea");
        configFolder.add(api, "triangulo").name("Triangulo");
        configFolder.add(api, "cuadrado").name("Cuadrado");
        configFolder.add(api, "circulo").name("Circulo");
        configFolder.add(api, "poligono").name("Poligono");
        configFolder.add(api, 'poligono_sides', 2, 100).name("Lados del poligono").step(1);

        const bloomFolder = this.gui.addFolder('bloom');
        bloomFolder.close();
        bloomFolder.add(params, 'threshold', 0.0, 1.0).onChange((value) => bloomPass.threshold = Number(value));
        bloomFolder.add(params, 'strength', 0.0, 3.0).onChange((value) => bloomPass.strength = Number(value));
        bloomFolder.add(params, 'radius', 0.0, 1.0).step(0.01).onChange((value) => bloomPass.radius = Number(value));

        const toneMappingFolder = this.gui.addFolder('tone mapping');
        toneMappingFolder.close();
        toneMappingFolder.add(params, 'exposure', 0.1, 2).onChange((value) => renderer.toneMappingExposure = Math.pow(value, 4.0));

        this.gui.add(api, "music").name("Music");
    }
}