import * as THREE from 'https://unpkg.com/three@v0.162.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@v0.162.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/OutputPass.js';
import { CSS3DRenderer } from 'https://unpkg.com/three@v0.162.0/examples/jsm/renderers/CSS3DRenderer.js';
import { CSS3DObject } from 'https://unpkg.com/three@v0.162.0/examples/jsm/renderers/CSS3DRenderer.js';
import { GuiScene } from './gui.js';
import { MusicScene } from './music_scene.js';


export class App {

    constructor(size, bpm, htmlIdContainer) {
        this.audioBars = 0;
        this.scene = null;
        this.renderer = null;
        this.rendererCss = null;
        this.musicScene = null;
        this.composer = null;
        this.musicStart = false;
        this.timeBar = (60 / bpm);
        this.clock = new THREE.Clock();
        this.objectCSS = null;
        this.lastblack = ((60 / bpm) * 4);

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
            zero: () => this.targetZero(),
            circulo: () => this.targetCirculo(),
            linea: () => this.targetPoligono(2),
            triangulo: () => this.targetPoligono(3),
            cuadrado: () => this.targetPoligono(4),
            poligono: () => this.targetPoligono(this.api.poligono_sides),
            music: () => this.toogleMusic()
        };

        this.init(htmlIdContainer);
        this.animate();
    }



    init(htmlIdContainer) {

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
        this.container = document.getElementById(htmlIdContainer);
        this.container.appendChild(this.renderer.domElement);

        this.rendererCss = new CSS3DRenderer();
        this.rendererCss.setSize(window.innerWidth, window.innerHeight);
        this.rendererCss.domElement.style.position = 'absolute';
        this.rendererCss.domElement.style.top = 0;
        this.container.appendChild(this.rendererCss.domElement);

        // audio
        //this.audio = new Audio('https://cdn.pixabay.com/download/audio/2022/01/24/audio_10217b4b7b.mp3?filename=metal-blues-120-bpm-full-15518.mp3');
        this.audio = new Audio('src/assets/Escapar.mp3');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.add(new THREE.AmbientLight(0xcccccc));

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.rendererCss.domElement);
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

        window.addEventListener('resize', this.onWindowResize.bind(this));
        let newMusicScene = new THREE.Scene();
        this.musicScene = new MusicScene(this.api, newMusicScene);
        this.scene.add(newMusicScene);

        let scene = this.scene;
        Object.assign(window, { scene });
    }

    toogleMusic() {
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
        this.rendererCss.setSize(width, height);
    }

    on_music_start() {
        this.musicStart = true;
        this.camera.position.z *= 2;
        this.renderer.toneMappingExposure = Math.pow(2, 4.0);
        this.musicScene.crearLineaPoligono2DMaya(0, 0, 75, this.api);
        this.musicScene.escalarPoligono2DMaya(0.1);
        this.musicScene.targetZero(this.api);
        this.create_text("ESCAPAR")
    }

    on_music_end() {
        this.musicScene.eliminarLineaCubo();
        this.musicScene.eliminarPoigono2D();
        this.musicScene.eliminarPoigono2DMaya();
        this.renderer.toneMappingExposure = Math.pow(5, 4.0);
        this.api.rotation_speed = 0;
        this.api.camera_position_x = 0;
        this.api.camera_position_y = 0;
        this.api.camera_position_z = 20;
        this.musicScene.targetZero(this.api);
    }

    on_bar() {
        this.renderer.toneMappingExposure = Math.pow(2, 4.0);
        this.musicScene.escalarPoligono2D(1.2);
        this.musicScene.escalarPoligono2DMaya(0.8);
        if (this.audioBars % 4 == 0) {
            this.api.camera_position_x = Math.floor(Math.random() * 10) * ((Math.random() > 0.5) ? 1 : -1);
            this.api.camera_position_y = Math.floor(Math.random() * 10) * ((Math.random() > 0.5) ? 1 : -1);
            this.api.camera_position_z = Math.floor(75 + Math.random() * 20);
        }
        if (this.audioBars % 8 == 0) {
            if (Math.random() > 0.5) {
                this.musicScene.eliminarLineaCubo();
                this.musicScene.eliminarPoigono2D();
                this.musicScene.crearLineaPoligono2DMaya(0, 0, Math.floor(3 + Math.random() * 6), this.api);
            } else {
                this.musicScene.eliminarPoigono2DMaya();
                this.musicScene.crearLineaPoligono2D(0, 0, Math.floor(3 + Math.random() * 6), this.api);
                if (Math.random() > 0.5) {
                    this.musicScene.crearLineaCubo(0, 0, this.api);
                }
            }
            this.api.rotation_speed = Math.random() * 0.2 * ((Math.random() > 0.5) ? 1 : -1);
        }
        if (this.audioBars % 16 == 0) {
            this.delete_text();
            var sides = Math.floor(2 + Math.random() * 8);
            if (sides === 7) {
                this.musicScene.targetCirculo(this.api);
            }else{
                this.musicScene.targetPoligono(sides, this.api);
            }
            if (sides == 2) {
                this.musicScene.eliminarLineaCubo();
                this.musicScene.eliminarPoigono2D();
                this.musicScene.crearLineaPoligono2DMaya(0, 0, Math.floor(3 + Math.random() * 4), this.api);
            }
            this.renderer.toneMappingExposure = Math.pow(4, 4.0);
        }
    }

    lerp_camera_position(delta) {
        if (this.camera.position.distanceTo(new THREE.Vector3(this.api.camera_position_x, this.api.camera_position_y, this.api.camera_position_z)) > 0.05) {
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.api.camera_position_y, delta);
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.api.camera_position_x, delta);
            this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.api.camera_position_z, 0.25 * delta);
        }
    }

    create_text(text) {
        this.delete_text();
        if (this.objectCSS == null) {
            const element = document.createElement('div');
            element.style = "text-align: center; font-family: 'Matrix', sans-serif; font-size:75px; line-height:100px;";
            this.objectCSS = new CSS3DObject(element);
            this.objectCSS.position.set(0, 0, -250);
            this.objectCSS.element.innerHTML = text;
            this.objectCSS.scale.set(0.5, 0.5, 0.5);
            this.scene.add(this.objectCSS);
        }
    }

    update_text(text) {
        if (this.objectCSS != null) {
            this.objectCSS.element.innerHTML = text;
        }
    }

    delete_text() {
        if (this.objectCSS != null) {
            this.scene.remove(this.objectCSS);
            this.objectCSS = null;
        }
    }


    //MEGA TODO: pasar a estructura de datos urgente.
    animate() {
        const delta = this.clock.getDelta();
        if (this.audio.currentTime > 0 && !this.audio.paused && !this.musicStart) {
            this.on_music_start();
        }
        requestAnimationFrame(this.animate.bind(this));
        this.musicScene.animate(delta, this.api);
        if (this.audio.currentTime > this.lastblack + this.timeBar && this.audio.currentTime < this.audio.duration - (this.timeBar * 2)) {
            this.audioBars++;
            this.lastblack += this.timeBar;
            this.on_bar();
        }
        if (this.audio.currentTime > this.audio.duration - (this.timeBar)) {
            this.on_music_end();
        }

        this.lerp_camera_position(delta);
        this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, Math.pow(this.params.exposure, 4.0), 5 * delta);

        this.controls.update();
        this.stats.update();
        this.render();
    }

    render() {
        this.composer.render();
        this.rendererCss.render(scene, this.camera);
    }
}