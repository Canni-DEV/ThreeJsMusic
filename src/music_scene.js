import * as THREE from 'https://unpkg.com/three@v0.162.0/build/three.module.js';

export class MusicScene {
    constructor(api, scene) {
        this.cube = null;
        this.poligono2D = null;
        this.poligono2DMaya = null;
        this.poligono2DMayaPoligono = null;
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
        const ladoPoligono = api.radius;
        const cantidadLados = numberOfSides;
        const cantidadCirculos = api.size;
        const centro = new THREE.Vector2(0, 0);

        // Constantes pre-calculadas
        const PI2 = Math.PI * 2;
        const PI_DIV_CANTIDAD_LADOS = PI2 / cantidadLados;

        // Calcular las posiciones de los vértices del polígono
        const vertices = [];
        for (let i = 0; i < cantidadLados; i++) {
            const angulo = i * PI_DIV_CANTIDAD_LADOS;
            const x = centro.x + ladoPoligono * Math.cos(angulo);
            const y = centro.y + ladoPoligono * Math.sin(angulo);
            vertices.push(new THREE.Vector2(x, y));
        }

        // Calcular la cantidad de círculos por lado
        const circulosPorLado = Math.floor(cantidadCirculos / cantidadLados);

        // Posicionar los círculos en los vértices y puntos intermedios
        let index = 0;
        for (let i = 0; i < vertices.length; i++) {
            const puntoVertice = vertices[i];
            this.targetPositions[index++] = new THREE.Vector3(puntoVertice.x, puntoVertice.y, 0);

            const puntoFinal = vertices[(i + 1) % cantidadLados];
            for (let j = 1; j < circulosPorLado; j++) {
                const puntoIntermedio = puntoVertice.clone().lerp(puntoFinal, j / circulosPorLado);
                this.targetPositions[index++] = new THREE.Vector3(puntoIntermedio.x, puntoIntermedio.y, 0);
            }
        }

        // Repetir los últimos círculos para alcanzar la cantidad especificada
        let lastIndex = index - 1;
        while (lastIndex < cantidadCirculos) {
            lastIndex++;
            this.targetPositions[lastIndex] = this.targetPositions[index - 1];
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

        for (let index = 1; index < api.size / 2; index++) {
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

    crearLineapoligono2DMayaPoligono(number_sides, api) {
        const material = new THREE.LineBasicMaterial({
            color: 0x1DA150
        });

        const halfSize = api.cube_size / 2;

        let distancia = api.cube_size;
        let distanciaAux = 0;
        const objectScene = new THREE.Scene();

        for (let x = -api.size / 16; x < api.size / 16; x++) {
            for (let y = -api.size / 16; y < api.size / 16; y++) {
                const angleStep = (2 * Math.PI) / number_sides;
                const points = [];
                for (let i = 0; i < number_sides; i++) {
                    const x1 = x * distancia + (halfSize) * Math.cos(i * angleStep);
                    const y1 = y * distancia + (halfSize) * Math.sin(i * angleStep);
                    const x2 = x * distancia + (halfSize) * Math.cos((i + 1) * angleStep);
                    const y2 = y * distancia + (halfSize) * Math.sin((i + 1) * angleStep);
                    points.push(new THREE.Vector3(x1, y1, 0));
                    points.push(new THREE.Vector3(x2, y2, 0));

                }
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const object = new THREE.LineSegments(geometry, material);
                objectScene.add(object);
            }
            if (distancia == api.cube_size)
                distancia = api.cube_size * 1.6;
            else
                distancia = api.cube_size;
        }
        this.poligono2DMayaPoligono = objectScene;
        this.scene.add(objectScene);
    }

    eliminarLineaCubo() {
        if (this.cube != null) {
            this.scene.remove(this.cube);
            this.cube = null;
        }
    }

    escalarPoligono2D(scale) {
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

    escalarPoligono2DMaya(scale) {
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

    escalarpoligono2DMayaPoligono(scale) {
        if (this.poligono2DMayaPoligono != null) {
            this.poligono2DMayaPoligono.scale.y *= scale;
            this.poligono2DMayaPoligono.scale.x *= scale;
            this.poligono2DMayaPoligono.scale.z *= scale;
        }
    }

    escalarpoligono2DMayaPoligono() {
        if (this.poligono2DMayaPoligono != null) {
            this.scene.remove(this.poligono2DMayaPoligono);
            this.poligono2DMayaPoligono = null;
        }
    }

    rotate(delta, api) {
        this.scene.rotation.z += api.rotation_speed * delta;
    }

    animate(delta, api) {
        this.rotate(delta, api);
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

        if (this.poligono2DMayaPoligono != null) {
            this.poligono2DMayaPoligono.scale.y = THREE.MathUtils.lerp(this.poligono2DMayaPoligono.scale.y, api.poligono2DMaya_size, delta);
            this.poligono2DMayaPoligono.scale.x = THREE.MathUtils.lerp(this.poligono2DMayaPoligono.scale.x, api.poligono2DMaya_size, delta);
            this.poligono2DMayaPoligono.scale.z = THREE.MathUtils.lerp(this.poligono2DMayaPoligono.scale.z, api.poligono2DMaya_size, delta);
        }
    }
}