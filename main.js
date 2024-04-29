import * as THREE from 'https://unpkg.com/three@v0.162.0/build/three.module.js';
import Stats from 'https://unpkg.com/three@v0.162.0/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/three@v0.162.0/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'https://unpkg.com/three@v0.162.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://unpkg.com/three@v0.162.0/examples/jsm/postprocessing/OutputPass.js';

let container, stats, gui, audio;
let audioBars = 0;
let camera, controls, scene, renderer;
let cube = null;
let circle = null;
let poligono2D = null;
let poligono2DMaya = null;
const keys = {};

let composer, mixer, clock;
let particles = []
let targetPositions = []
let lerpTime = 1;
let musicStart = false;

const params = {
	threshold: 0,
	strength: 0.3,
	radius: 0.5,
	exposure: 1
};

const api = {
	size: 200,
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
	camera_position_z: 75,
	poligono_sides: 8,
	zero: function () {
		targetZero();
	},
	circulo: function () {
		targetCirculo();
	},
	linea: function () {
		targetPoligono(2);
	},
	triangulo: function () {
		targetPoligono(3);
	},
	poligono: function () {
		targetPoligono(null);
	},
	music: function () {
		playMusic();
	}
};

init();
animate();

function init() {
	clock = new THREE.Clock();
	const width = window.innerWidth;
	const height = window.innerHeight;

	// camera
	camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100);
	camera.position.z = api.camera_position_z;
	camera.position.y = api.camera_position_y;

	// renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.toneMapping = THREE.ReinhardToneMapping;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(width, height);
	container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	// audio
	audio = new Audio('assets/metal-blues.mp3');


	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	scene.add(new THREE.AmbientLight(0xcccccc));

	// Controls
	controls = new OrbitControls(camera, renderer.domElement);
	window.addEventListener('keydown', onKeyDown)
	window.addEventListener('keyup', onKeyUp)

	const renderScene = new RenderPass(scene, camera);

	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
	bloomPass.threshold = params.threshold;
	bloomPass.strength = params.strength;
	bloomPass.radius = params.radius;

	const outputPass = new OutputPass();

	composer = new EffectComposer(renderer);
	composer.addPass(renderScene);
	composer.addPass(bloomPass);
	composer.addPass(outputPass);


	// Stats
	stats = new Stats();
	container.appendChild(stats.dom);

	// Gui
	gui = new GUI();
	const configFolder = gui.addFolder('config');
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
	configFolder.add(api, "circulo").name("Circulo");
	configFolder.add(api, "triangulo").name("Triangulo");
	configFolder.add(api, "poligono").name("Poligono");
	configFolder.add(api, 'poligono_sides', 2, 100).step(1);

	const bloomFolder = gui.addFolder('bloom');
	bloomFolder.close();
	bloomFolder.add(params, 'threshold', 0.0, 1.0).onChange(function (value) {
		bloomPass.threshold = Number(value);

	});
	bloomFolder.add(params, 'strength', 0.0, 3.0).onChange(function (value) {

		bloomPass.strength = Number(value);
	});

	bloomFolder.add(params, 'radius', 0.0, 1.0).step(0.01).onChange(function (value) {
		bloomPass.radius = Number(value);
	});

	const toneMappingFolder = gui.addFolder('tone mapping');
	toneMappingFolder.close();
	toneMappingFolder.add(params, 'exposure', 0.1, 2).onChange(function (value) {
		renderer.toneMappingExposure = Math.pow(value, 4.0);
	});

	gui.add(api, "music").name("Music");

	// listeners
	window.addEventListener('resize', onWindowResize);

	Object.assign(window, { scene });

	const geometry = new THREE.CircleGeometry(0.25, 16);
	const material = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x1DA150 });
	circle = new THREE.Mesh(geometry, material);


	for (var i = 0; i < api.size; i++) {
		targetPositions[i] = new THREE.Vector3(0, 0, 0);
	}

	for (let i = 0; i < api.size; i++) {
		particles[i] = crearPunto(circle, 0, 0);
	}
}

function playMusic() {
	if (audio.paused)
		audio.play()
	else
		audio.pause()
}

function targetZero() {
	for (var i = 0; i < api.size; i++) {
		targetPositions[i] = new THREE.Vector3(0, 0, 0);
	}
	lerpTime = 0;
}

function targetCirculo() {
	var radio = api.radius;
	var cantidadCirculos = api.size;
	var centro = new THREE.Vector2(0, 0);

	for (var i = 0; i < api.size; i++) {
		var angulo = (i / cantidadCirculos) * Math.PI * 2;
		var x = centro.x + radio * Math.cos(angulo);
		var y = centro.y + radio * Math.sin(angulo);
		targetPositions[i] = new THREE.Vector3(x, y, 0);
	}
	lerpTime = 0;
}

function targetPoligono(numberOfSides) {
	if (numberOfSides == null) {
		numberOfSides = api.poligono_sides;
	}
	// Parámetros del polígono
	var ladoPoligono = api.radius; // Longitud de cada lado del polígono
	var cantidadLados = numberOfSides; // Cantidad de lados del polígono
	var cantidadCirculos = api.size; // Cantidad de círculos a instanciar
	var centro = new THREE.Vector2(0, 0);

	// Calcular las posiciones de los vértices del polígono
	var vertices = [];
	for (var i = 0; i < cantidadLados; i++) {
		var angulo = (i / cantidadLados) * Math.PI * 2;
		var x = centro.x + ladoPoligono * Math.cos(angulo);
		var y = centro.y + ladoPoligono * Math.sin(angulo);
		vertices.push(new THREE.Vector2(x, y));
	}

	// Calcular las posiciones a lo largo de los lados del polígono
	var puntosLado = [];
	for (var i = 0; i < cantidadLados; i++) {
		var puntoInicial = vertices[i];
		var puntoFinal = vertices[(i + 1) % cantidadLados];
		for (var j = 1; j < cantidadCirculos / cantidadLados; j++) {
			var puntoIntermedio = puntoInicial.clone().lerp(puntoFinal, j / (cantidadCirculos / cantidadLados));
			puntosLado.push(puntoIntermedio);
		}
	}
	console.log("Puntos lados: " + puntosLado.length);

	// Posicionar los círculos en los vértices y puntos intermedios
	var index = 0;
	for (var i = 0; i < vertices.length; i++) {
		var x = vertices[i].x;
		var y = vertices[i].y;
		targetPositions[index] = new THREE.Vector3(x, y, 0);
		for (var j = 0; j < cantidadCirculos / cantidadLados - 1; j++) {
			var punto = puntosLado[index++];
			x = punto.x;
			y = punto.y;
			targetPositions[index] = new THREE.Vector3(x, y, 0);
		}
	}
	var lastIndex = index;
	while (lastIndex < api.size) {
		lastIndex++;
		targetPositions[lastIndex] = targetPositions[index];
	}
	lerpTime = 0;
}

function crearPunto(prefab, x, y) {
	let c = prefab.clone();
	c.position.x = x;
	c.position.y = y;
	scene.add(c);
	crearLinea(x, y, c);
	return c;
}

function crearLinea(x, y, pointSecene) {
	const material = new THREE.LineBasicMaterial({
		color: 0x1DA150
	});

	const points = [];
	points.push(new THREE.Vector3(x, y, 0));
	points.push(new THREE.Vector3(x, y, 100));

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const line = new THREE.Line(geometry, material);
	pointSecene.add(line);
}

function crearLineaCubo(x, y) {
	const material = new THREE.LineBasicMaterial({
		color: 0x1DA150
	});

	const halfSize = api.cube_size / 2;

	const cubeScene = new THREE.Scene();

	// Cara frontal del cubo
	let geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x + halfSize, y - halfSize, -halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y - halfSize, -halfSize)
	]);
	let cubeFront = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeFront);

	// Cara trasera del cubo
	geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x + halfSize, y - halfSize, halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, halfSize),
		new THREE.Vector3(x - halfSize, y + halfSize, halfSize),
		new THREE.Vector3(x - halfSize, y - halfSize, halfSize)
	]);
	let cubeBack = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeBack);

	// Lado izquierdo del cubo
	geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x - halfSize, y - halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y - halfSize, halfSize),
		new THREE.Vector3(x - halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y + halfSize, halfSize)
	]);
	let cubeLeft = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeLeft);

	// Lado derecho del cubo
	geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x + halfSize, y - halfSize, -halfSize),
		new THREE.Vector3(x + halfSize, y - halfSize, halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, halfSize)
	]);
	let cubeRight = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeRight);

	// Lado superior del cubo
	geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x - halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y + halfSize, halfSize),
		new THREE.Vector3(x + halfSize, y + halfSize, halfSize)
	]);
	let cubeTop = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeTop);

	// Lado inferior del cubo
	geometry = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(x - halfSize, y - halfSize, -halfSize),
		new THREE.Vector3(x + halfSize, y - halfSize, -halfSize),
		new THREE.Vector3(x - halfSize, y - halfSize, halfSize),
		new THREE.Vector3(x + halfSize, y - halfSize, halfSize)
	]);
	let cubeBottom = new THREE.LineSegments(geometry, material);
	cubeScene.add(cubeBottom);

	cube = cubeScene;
	scene.add(cubeScene);
}

function crearLineaPoligono2D(x, y, number_sides) {
	const material = new THREE.LineBasicMaterial({
		color: 0x1DA150
	});

	const halfSize = api.cube_size / 2.5;

	const objectScene = new THREE.Scene();

	const angleStep = (2 * Math.PI) / number_sides;
	const points = [];
	for (let i = 0; i < number_sides; i++) {
		const x1 = x + halfSize * Math.cos(i * angleStep);
		const y1 = y + halfSize * Math.sin(i * angleStep);
		const x2 = x + halfSize * Math.cos((i + 1) * angleStep);
		const y2 = y + halfSize * Math.sin((i + 1) * angleStep);
		points.push(new THREE.Vector3(x1, y1, 0));
		points.push(new THREE.Vector3(x2, y2, 0));

	}
	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const object = new THREE.LineSegments(geometry, material);
	objectScene.add(object);
	poligono2D = objectScene;
	scene.add(objectScene);
}

function crearLineaPoligono2DMaya(x, y, number_sides) {
	const material = new THREE.LineBasicMaterial({
		color: 0x1DA150
	});

	const halfSize = api.cube_size / 2.5;

	const objectScene = new THREE.Scene();

	for (let index = 1; index < api.size; index++) {
		const angleStep = (2 * Math.PI) / number_sides;
		const points = [];
		for (let i = 0; i < number_sides; i++) {
			const x1 = x + (halfSize * index) * Math.cos(i * angleStep);
			const y1 = y + (halfSize * index) * Math.sin(i * angleStep);
			const x2 = x + (halfSize * index) * Math.cos((i + 1) * angleStep);
			const y2 = y + (halfSize * index) * Math.sin((i + 1) * angleStep);
			points.push(new THREE.Vector3(x1, y1, 0));
			points.push(new THREE.Vector3(x2, y2, 0));
	
		}
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const object = new THREE.LineSegments(geometry, material);
		objectScene.add(object);		
	}


	poligono2DMaya = objectScene;
	scene.add(objectScene);
}

function eliminarLineaCubo() {
	if (cube != null) {
		scene.remove(cube);
		cube = null;
	}
}

function eliminarPoigono2D() {
	if (poligono2D != null) {
		scene.remove(poligono2D);
		poligono2D = null;
	}
}

function eliminarPoigono2DMaya() {
	if (poligono2DMaya != null) {
		scene.remove(poligono2DMaya);
		poligono2DMaya = null;
	}
}

function onKeyDown(e) {
	keys[e.key.toLowerCase()] = true;
}

function onKeyUp(e) {
	keys[e.key.toLowerCase()] = false;
}


function onWindowResize() {
	const width = window.innerWidth;
	const height = window.innerHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
}

function animate() {
	if(audio.currentTime > 0 && !audio.paused && !musicStart){
		musicStart = true;
		renderer.toneMappingExposure = Math.pow(2, 4.0);
		crearLineaPoligono2DMaya(0,0,75);
		poligono2DMaya.scale.y = 0.1;
		poligono2DMaya.scale.x = 0.1;
		poligono2DMaya.scale.z = 0.1;
	}
	requestAnimationFrame(animate);
	const delta = clock.getDelta();
	if (lerpTime <= 1) {
		for (let i = 0; i < api.size; i++) {
			let newPos = particles[i].position.lerp(targetPositions[i], lerpTime);
			particles[i].position.x = newPos.x;
			particles[i].position.y = newPos.y;
			particles[i].position.z = newPos.z;
		}
		lerpTime += api.transition_speed * delta;
	} else {
		lerpTime = 1;
	}
	//console.log(audio.currentTime);
	if (audio.currentTime > audioBars + 1 && audio.currentTime < audio.duration - 2) {
		audioBars++;
		renderer.toneMappingExposure = Math.pow(2, 4.0);
		if (poligono2D != null) {
			poligono2D.scale.y *= 1.2;
			poligono2D.scale.x *= 1.2;
			poligono2D.scale.z *= 1.2;
		}
		if (poligono2DMaya != null) {
			poligono2DMaya.scale.y *= 0.8;
			poligono2DMaya.scale.x *= 0.8;
			poligono2DMaya.scale.z *= 0.8;
		}
		switch (audioBars) {
			case 1:
			case 2:
			case 3:
				api.camera_position_x = (-audioBars % 2 == 0) ? -audioBars : -audioBars * -1
				api.camera_position_y = -audioBars % 2 - 1;
				break;
			case 4:
			case 5:
			case 6:
			case 7:
				api.camera_position_x = (audioBars % 2 == 0) ? audioBars : audioBars * -1
				api.camera_position_y = audioBars % 2 + 1;
				break;
			case 8:
				api.camera_position_x = 0;
				api.camera_position_y = 0;
				api.camera_position_z += 20;
				crearLineaCubo(0, 0);
				crearLineaPoligono2D(0, 0, 6)
				targetCirculo();
				eliminarPoigono2DMaya();
				break;
			case 10:
				api.camera_position_x = -20;
				break;
			case 12:
				api.camera_position_x = 20;
				break;
			case 14:
				api.camera_position_x = 0;
				break;
			case 16:
				api.radius = 45;
				api.camera_position_z -= 40;
				targetPoligono(3);
				api.rotation_speed = 0.2;
				api.camera_position_y = 2;
				break;
			case 18:
				api.camera_position_y = -20;
				break;
			case 20:
				api.camera_position_y = 20;
				break;
			case 22:
				api.camera_position_y = 0;
				break;
			case 24:
				api.camera_position_z += 20;
				eliminarLineaCubo();
				eliminarPoigono2D();
				crearLineaPoligono2DMaya(0,0,6);
				targetPoligono(2);
				api.rotation_speed = -0.2;
				api.camera_position_y = -2;
				break;
			case 32:
				api.rotation_speed = -0.2;
				api.camera_position_y = 2;
				break;
			case 40:
				crearLineaCubo(0, 0);
				crearLineaPoligono2D(0, 0, 6)
				eliminarPoigono2DMaya();
				targetCirculo();
				api.rotation_speed = 0;
				api.camera_position_y = 0;
				break;
			case 48:
				targetPoligono(3);
				api.rotation_speed = 0.2;
				api.camera_position_y = 2;
				break;
			case 56:
			case 58:
			case 60:
			case 62:
			case 64:
			case 66:
			case 68:
				eliminarLineaCubo();
				eliminarPoigono2D();
				api.poligono2D_size = 0.5;
				crearLineaPoligono2D(0, 0, audioBars - 52);
				api.radius = audioBars - 52;
				api.rotation_speed = 0.1;
				api.camera_position_y = 0;
				targetPoligono(audioBars - 52);
				renderer.toneMappingExposure = Math.pow(3, 4.0);
				break;
			case 72:
				eliminarPoigono2D();
				api.radius = 40;
				api.rotation_speed = 0.2;
				api.camera_position_y = 2;
				targetPoligono(2);
				crearLineaPoligono2DMaya(0,0,6);
				break;
			case 76:
				eliminarPoigono2DMaya();
				crearLineaPoligono2DMaya(0,0,3);
				targetPoligono(3);
				api.rotation_speed = 0.2 + (audioBars - 70) * delta;
				break;
			case 80:
				eliminarPoigono2DMaya();
				crearLineaPoligono2DMaya(0,0,4);
				targetPoligono(4);
				api.rotation_speed = 0.2 + (audioBars - 70) * delta;
				break;
			case 82:
				eliminarPoigono2DMaya();
				crearLineaPoligono2DMaya(0,0,5);
				targetPoligono(5);
				api.rotation_speed = 0.2 + (audioBars - 70) * delta;
				break;
			case 84:
				eliminarPoigono2DMaya();
				crearLineaPoligono2DMaya(0,0,6);
				targetCirculo();
				api.camera_position_z = 80;
				api.camera_position_y = 0;
				api.rotation_speed = 0.2 + (audioBars - 60) * delta;
				break;
			case 88:
				eliminarPoigono2DMaya();
				api.camera_position_z = 20;
				renderer.toneMappingExposure = Math.pow(5, 4.0);
				api.rotation_speed = 0;
				api.camera_position_x = 0;
				api.camera_position_y = 0;
				targetZero();
				break;
		}
	}

	camera.position.y = THREE.MathUtils.lerp(camera.position.y, api.camera_position_y, delta);
	camera.position.x = THREE.MathUtils.lerp(camera.position.x, api.camera_position_x, delta);
	camera.position.z = THREE.MathUtils.lerp(camera.position.z, api.camera_position_z, 0.25 * delta);
	renderer.toneMappingExposure = THREE.MathUtils.lerp(renderer.toneMappingExposure, Math.pow(params.exposure, 4.0), 5 * delta);
	scene.rotation.z += api.rotation_speed * delta;
	if (cube != null) {
		cube.rotation.y += api.cube_rotation_speed * delta;
	}
	if (poligono2D != null) {
		poligono2D.scale.y = THREE.MathUtils.lerp(poligono2D.scale.y, api.poligono2D_size, delta);
		poligono2D.scale.x = THREE.MathUtils.lerp(poligono2D.scale.x, api.poligono2D_size, delta);
		poligono2D.scale.z = THREE.MathUtils.lerp(poligono2D.scale.z, api.poligono2D_size, delta);
	}
	if (poligono2DMaya != null) {
		poligono2DMaya.scale.y = THREE.MathUtils.lerp(poligono2DMaya.scale.y, api.poligono2DMaya_size, delta);
		poligono2DMaya.scale.x = THREE.MathUtils.lerp(poligono2DMaya.scale.x, api.poligono2DMaya_size, delta);
		poligono2DMaya.scale.z = THREE.MathUtils.lerp(poligono2DMaya.scale.z, api.poligono2DMaya_size, delta);
	}

	controls.update();
	stats.update();

	render();
}

function render() {

	composer.render();
}