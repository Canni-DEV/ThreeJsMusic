import * as THREE from 'https://unpkg.com/three@v0.162.0/build/three.module.js';

export class MusicScene {
    constructor(api, scene) {
        this.cube = null;
        this.poligono2D = null;
        this.poligono2DMaya = null;
        this.particles = [];
        this.targetPositions = [];
        this.scene = scene;
        this.lerpTime = 1;

        for (var i = 0; i < api.size; i++) {
            this.targetPositions[i] = new THREE.Vector3(0, 0, 0);
        }
        const geometry = new THREE.CircleGeometry(0.25, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x1DA150 });
        for (let i = 0; i < api.size; i++) {
            this.particles[i] = this.crearPunto(new THREE.Mesh(geometry, material), 0, 0);
        }
    }

    targetZero(api) {
        for (var i = 0; i < api.size; i++) {
            this.targetPositions[i] = new THREE.Vector3(0, 0, 0);
        }
        this.lerpTime = 0;
    }

    targetCirculo(api) {
        var radio = api.radius;
        var cantidadCirculos = api.size;
        var centro = new THREE.Vector2(0, 0);

        for (var i = 0; i < api.size; i++) {
            var angulo = (i / cantidadCirculos) * Math.PI * 2;
            var x = centro.x + radio * Math.cos(angulo);
            var y = centro.y + radio * Math.sin(angulo);
            this.targetPositions[i] = new THREE.Vector3(x, y, 0);
        }
        this.lerpTime = 0;
    }

    targetPoligono(numberOfSides, api) {
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

        // Posicionar los círculos en los vértices y puntos intermedios
        var index = 0;
        for (var i = 0; i < vertices.length; i++) {
            var x = vertices[i].x;
            var y = vertices[i].y;
            this.targetPositions[index] = new THREE.Vector3(x, y, 0);
            for (var j = 0; j < cantidadCirculos / cantidadLados - 1; j++) {
                var punto = puntosLado[index++];
                x = punto.x;
                y = punto.y;
                this.targetPositions[index] = new THREE.Vector3(x, y, 0);
            }
        }
        var lastIndex = index;
        while (lastIndex < api.size) {
            lastIndex++;
            this.targetPositions[lastIndex] = this.targetPositions[index];
        }
        this.lerpTime = 0;
    }

    crearPunto(prefab, x, y) {
        let c = prefab.clone();
        c.position.x = x;
        c.position.y = y;
        this.scene.add(c);
        this.crearLinea(x, y, c);
        return c;
    }

    crearLinea(x, y, pointSecene) {
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

    crearLineaCubo(x, y, api) {
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

        this.cube = cubeScene;
        this.scene.add(cubeScene);
    }

    crearLineaPoligono2D(x, y, number_sides, api) {
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
        this.poligono2D = objectScene;
        this.scene.add(objectScene);
    }

    crearLineaPoligono2DMaya(x, y, number_sides, api) {
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


        this.poligono2DMaya = objectScene;
        this.scene.add(objectScene);
    }

    eliminarLineaCubo() {
        if (this.cube != null) {
            this.scene.remove(this.cube);
            this.cube = null;
        }
    }

    escalarPoligono2D(scale){
        if (this.poligono2D != null) {
            this.poligono2D.scale.y *= scale;
            this.poligono2D.scale.x *= scale;
            this.poligono2D.scale.z *= scale;
        }
    }

    eliminarPoigono2D() {
        if (this.poligono2D != null) {
            this.scene.remove(this.poligono2D);
            this.poligono2D = null;
        }
    }

    escalarPoligono2DMaya(scale){
        if (this.poligono2DMaya != null) {
            this.poligono2DMaya.scale.y *= scale;
            this.poligono2DMaya.scale.x *= scale;
            this.poligono2DMaya.scale.z *= scale;
        }
    }

    eliminarPoigono2DMaya() {
        if (this.poligono2DMaya != null) {
            this.scene.remove(this.poligono2DMaya);
            this.poligono2DMaya = null;
        }
    }

    animate(delta, api) {
        if (this.lerpTime <= 1) {
            for (let i = 0; i < api.size; i++) {
                let newPos = this.particles[i].position.lerp(this.targetPositions[i], this.lerpTime);
                this.particles[i].position.x = newPos.x;
                this.particles[i].position.y = newPos.y;
                this.particles[i].position.z = newPos.z;
            }
            this.lerpTime += api.transition_speed * delta;
        } else {
            this.lerpTime = 1;
        }

        if (this.cube != null) {
            this.cube.rotation.y += api.cube_rotation_speed * delta;
        }
        if (this.poligono2D != null) {
            this.poligono2D.scale.y = THREE.MathUtils.lerp(this.poligono2D.scale.y, api.poligono2D_size, delta);
            this.poligono2D.scale.x = THREE.MathUtils.lerp(this.poligono2D.scale.x, api.poligono2D_size, delta);
            this.poligono2D.scale.z = THREE.MathUtils.lerp(this.poligono2D.scale.z, api.poligono2D_size, delta);
        }
        if (this.poligono2DMaya != null) {
            this.poligono2DMaya.scale.y = THREE.MathUtils.lerp(this.poligono2DMaya.scale.y, api.poligono2DMaya_size, delta);
            this.poligono2DMaya.scale.x = THREE.MathUtils.lerp(this.poligono2DMaya.scale.x, api.poligono2DMaya_size, delta);
            this.poligono2DMaya.scale.z = THREE.MathUtils.lerp(this.poligono2DMaya.scale.z, api.poligono2DMaya_size, delta);
        }
    }
}