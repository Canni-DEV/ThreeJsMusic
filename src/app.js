import * as THREE from 'https://unpkg.com/three@v0.162.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@v0.162.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/OutputPass.js';
import { GuiScene } from './gui.js';
import { MusicScene } from './music_scene.js';

export class App {

    constructor(size, bpm) {
        this.audioBars = 0;
        this.scene = null;
        this.renderer = null;
        this.musicScene = null;
        this.composer = null;
        this.musicStart = false;
        this.timeBar = bpm / 120;
        this.clock = new THREE.Clock();

        this.params = {
            threshold: 0,
            strength: 0.3,
            radius: 0.5,
            exposure: 1
        };

        this.api = {
            size: size,
            radius: 30,
            transition_speed: 0.8,
            rotation_speed: 0,
            cube_rotation_speed: 0.2,
            cube_size: 15,
            poligono2D_size: 1,
            poligono2DMaya_size: 1,
            time_step: 0.05,
            camera_position_y: 0,
            camera_position_x: 0,
            camera_position_z: 65,
            poligono_sides: 8,
            zero: () =>  this.targetZero(),
            circulo: () => this.targetCirculo(),
            linea: () => this.targetPoligono(2),
            triangulo: () => this.targetPoligono(3),
            poligono: () => this.targetPoligono(null),
            music:  () => this.playMusic()
            };

        this.init();
        this.animate();    
    }

   

    init() {
        
        const width = window.innerWidth;
        const height = window.innerHeight;

        // camera
        this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 150);
        this.camera.position.z = this.api.camera_position_z;
        this.camera.position.y = this.api.camera_position_y;

        // renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.container = document.getElementById('container');
        this.container.appendChild(this.renderer.domElement);

        // audio
        this.audio = new Audio('https://cdn.pixabay.com/download/audio/2022/01/24/audio_10217b4b7b.mp3?filename=metal-blues-120-bpm-full-15518.mp3');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.add(new THREE.AmbientLight(0xcccccc));

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        window.addEventListener('keydown', this.onKeyDown)
        window.addEventListener('keyup', this.onKeyUp)

        const renderScene = new RenderPass(this.scene, this.camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = this.params.threshold;
        bloomPass.strength = this.params.strength;
        bloomPass.radius = this.params.radius;

        const outputPass = new OutputPass();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
        this.composer.addPass(outputPass);

        const gui = new GuiScene(this.api, this.params, this.container, this.renderer, bloomPass);
        this.stats = gui.stats;

        // listeners
        window.addEventListener('resize', this.onWindowResize);
        this.musicScene = new MusicScene(this.api, this.scene);
        let scene = this.scene;
        Object.assign(window, { scene });
    }

    playMusic() {
        if (this.audio.paused)
            this.audio.play();
        else
            this.audio.pause();
    }

    targetZero() {
        this.musicScene?.targetZero(this.api);
    }

    targetCirculo() {
        this.musicScene?.targetCirculo(this.api);
    }

    targetPoligono(sides) {
        this.musicScene?.targetPoligono(sides, this.api);
    }

    onKeyDown(e) {
    }

    onKeyUp(e) {
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    on_music_start(){
        this.musicStart = true;
        this.renderer.toneMappingExposure = Math.pow(2, 4.0);
        this.musicScene.crearLineaPoligono2DMaya(0, 0, 75, this.api);
        this.musicScene.poligono2DMaya.scale.y = 0.1;
        this.musicScene.poligono2DMaya.scale.x = 0.1;
        this.musicScene.poligono2DMaya.scale.z = 0.1;
    }

    on_bar(){
        this.renderer.toneMappingExposure = Math.pow(2, 4.0);
        this.musicScene.escalarPoligono2D(1.2);
        this.musicScene.escalarPoligono2DMaya(0.8);
    }

    lerp_camera_position(delta){
        this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.api.camera_position_y, delta);
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.api.camera_position_x, delta);
        this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.api.camera_position_z, 0.25 * delta);
    }


    //MEGA TODO: pasar a estructura de datos urgente.
    animate() {
        const delta = this.clock.getDelta();
        if (this.audio.currentTime > 0 && !this.audio.paused && !this.musicStart) {
            this.on_music_start();
        }
        requestAnimationFrame(this.animate.bind(this));
        this.musicScene.animate(delta, this.api);
        if (this.audio.currentTime > this.audioBars + this.timeBar && this.audio.currentTime < this.audio.duration - (this.timeBar * 2)) {
            this.audioBars++;
            this.on_bar();
            switch (this.audioBars) {
                case 1:
                case 2:
                case 3:
                    this.api.camera_position_x = (-this.audioBars % 2 == 0) ? -this.audioBars : -this.audioBars * -1
                    this.api.camera_position_y = -this.audioBars % 2 - 1;
                    break;
                case 4:
                case 5:
                case 6:
                case 7:
                    this.api.camera_position_x = (this.audioBars % 2 == 0) ? this.audioBars : this.audioBars * -1
                    this.api.camera_position_y = this.audioBars % 2 + 1;
                    break;
                case 8:
                    this.api.camera_position_x = 0;
                    this.api.camera_position_y = 0;
                    this.api.camera_position_z += 20;
                    this.musicScene.crearLineaCubo(0, 0, this.api);
                    this.musicScene.crearLineaPoligono2D(0, 0, 6, this.api)
                    this.musicScene.targetCirculo(this.api);
                    this.musicScene.eliminarPoigono2DMaya();
                    break;
                case 10:
                    this.api.camera_position_x = -20;
                    break;
                case 12:
                    this.api.camera_position_x = 20;
                    break;
                case 14:
                    this.api.camera_position_x = 0;
                    break;
                case 16:
                    this.api.radius = 45;
                    this.api.camera_position_z -= 40;
                    this.musicScene.targetPoligono(3, this.api);
                    this.api.rotation_speed = 0.2;
                    this.api.camera_position_y = 2;
                    break;
                case 18:
                    this.api.camera_position_y = -20;
                    break;
                case 20:
                    this.api.camera_position_y = 20;
                    break;
                case 22:
                    this.api.camera_position_y = 0;
                    break;
                case 24:
                    this.api.camera_position_z = 75;
                    this.musicScene.eliminarLineaCubo();
                    this.musicScene.eliminarPoigono2D();
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 6, this.api);
                    this.musicScene.targetPoligono(2, this.api);
                    this.api.rotation_speed = -0.2;
                    this.api.camera_position_y = -2;
                    break;
                case 32:
                    this.api.rotation_speed = -0.2;
                    this.api.camera_position_y = 2;
                    break;
                case 40:
                    this.musicScene.crearLineaCubo(0, 0, this.api);
                    this.musicScene.crearLineaPoligono2D(0, 0, 6, this.api)
                    this.musicScene.eliminarPoigono2DMaya();
                    this.musicScene.targetCirculo(this.api);
                    this.api.rotation_speed = 0;
                    this.api.camera_position_y = 5;
                    this.api.camera_position_x += 15;
                    break;
                case 48:
                    this.musicScene.targetPoligono(3, this.api);
                    this.api.rotation_speed = 0.2;
                    this.api.camera_position_y = -10;
                    this.api.camera_position_x = 0;
                    break;
                case 56:
                case 58:
                case 60:
                case 62:
                case 64:
                case 66:
                case 68:
                    this.musicScene.eliminarLineaCubo();
                    this.musicScene.eliminarPoigono2D();
                    this.api.poligono2D_size = 0.5;
                    this.musicScene.crearLineaPoligono2D(0, 0, this.audioBars - 52, this.api);
                    this.api.radius = this.audioBars - 52;
                    this.api.rotation_speed = 0.1;
                    this.api.camera_position_y = 0;
                    this.musicScene.targetPoligono(this.audioBars - 52, this.api);
                    this.renderer.toneMappingExposure = Math.pow(3, 4.0);
                    break;
                case 72:
                    this.musicScene.eliminarPoigono2D();
                    this.api.radius = 40;
                    this.api.rotation_speed = 0.2;
                    this.api.camera_position_y = 2;
                    this.musicScene.targetPoligono(2, this.api);
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 6, this.api);
                    break;
                case 76:
                    this.musicScene.eliminarPoigono2DMaya();
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 3, this.api);
                    this.musicScene.targetPoligono(3, this.api);
                    this.api.rotation_speed = 0.2 + (this.audioBars - 70) * delta;
                    break;
                case 80:
                    this.musicScene.eliminarPoigono2DMaya();
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 4, this.api);
                    this.musicScene.targetPoligono(4, this.api);
                    this.api.rotation_speed = 0.2 + (this.audioBars - 70) * delta;
                    break;
                case 82:
                    this.musicScene.eliminarPoigono2DMaya();
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 5, this.api);
                    this.musicScene.targetPoligono(5, this.api);
                    this.api.rotation_speed = 0.2 + (this.audioBars - 70) * delta;
                    break;
                case 84:
                    this.musicScene.eliminarPoigono2DMaya();
                    this.musicScene.crearLineaPoligono2DMaya(0, 0, 6, this.api);
                    this.musicScene.targetCirculo(this.api);
                    this.api.camera_position_z = 80;
                    this.api.camera_position_y = 0;
                    this.api.rotation_speed = 0.2 + (this.audioBars - 60) * delta;
                    break;
                case 88:
                    this.musicScene.eliminarPoigono2DMaya();
                    this.api.camera_position_z = 20;
                    this.renderer.toneMappingExposure = Math.pow(5, 4.0);
                    this.api.rotation_speed = 0;
                    this.api.camera_position_x = 0;
                    this.api.camera_position_y = 0;
                    this.musicScene.targetZero(this.api);
                    break;
            }
        }
        this.lerp_camera_position(delta);
        this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, Math.pow(this.params.exposure, 4.0), 5 * delta);
        this.scene.rotation.z += this.api.rotation_speed * delta;

        this.controls.update();
        this.stats.update();
        this.render();
    }

    render() {
        this.composer.render();
    }
}