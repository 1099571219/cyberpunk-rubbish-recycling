import * as THREE from 'three'

import Stats from 'three/addons/libs/stats.module.js'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { Octree } from 'three/addons/math/Octree.js'
import { OctreeHelper } from 'three/addons/helpers/OctreeHelper.js'

import { Capsule } from 'three/addons/math/Capsule.js'

import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { useEffect } from 'react'

function FpsTest() {
    useEffect(() => {
        const clock: THREE.Clock = new THREE.Clock()

        const scene: THREE.Scene = new THREE.Scene()
        scene.background = new THREE.Color(0x88ccee)
        scene.fog = new THREE.Fog(0x88ccee, 0, 50)

        const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        camera.rotation.order = 'YXZ'

        const fillLight1: THREE.HemisphereLight = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5)
        fillLight1.position.set(2, 1, 1)
        scene.add(fillLight1)

        const directionalLight: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
        directionalLight.position.set(-5, 25, -1)
        directionalLight.castShadow = true
        directionalLight.shadow.camera.near = 0.01
        directionalLight.shadow.camera.far = 500
        directionalLight.shadow.camera.right = 30
        directionalLight.shadow.camera.left = -30
        directionalLight.shadow.camera.top = 30
        directionalLight.shadow.camera.bottom = -30
        directionalLight.shadow.mapSize.width = 1024
        directionalLight.shadow.mapSize.height = 1024
        directionalLight.shadow.radius = 4
        directionalLight.shadow.bias = -0.00006
        scene.add(directionalLight)

        const container: HTMLElement = document.getElementById('container')!

        const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.VSMShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        container.appendChild(renderer.domElement)

        const stats: Stats = new Stats()
        stats.dom.style.position = 'absolute'
        stats.dom.style.top = '0px'
        container.appendChild(stats.dom)

        const GRAVITY: number = 30

        const NUM_SPHERES: number = 100
        const SPHERE_RADIUS: number = 0.2

        const STEPS_PER_FRAME: number = 5

        const sphereGeometry: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5)
        const sphereMaterial: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial({
            color: 0xdede8d,
        })

        const spheres: { mesh: THREE.Mesh, collider: THREE.Sphere, velocity: THREE.Vector3 }[] = []
        let sphereIdx: number = 0

        for (let i = 0; i < NUM_SPHERES; i++) {
            const sphere: THREE.Mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
            sphere.castShadow = true
            sphere.receiveShadow = true

            scene.add(sphere)

            spheres.push({
                mesh: sphere,
                collider: new THREE.Sphere(
                    new THREE.Vector3(0, -100, 0),
                    SPHERE_RADIUS
                ),
                velocity: new THREE.Vector3(),
            })
        }

        const worldOctree: Octree = new Octree()

        const playerCollider: Capsule = new Capsule(
            new THREE.Vector3(0, 0.35, 0),
            new THREE.Vector3(0, 1, 0),
            0.35
        )

        const playerVelocity: THREE.Vector3 = new THREE.Vector3()
        const playerDirection: THREE.Vector3 = new THREE.Vector3()

        let playerOnFloor: boolean = false
        let mouseTime: number = 0

        const keyStates: { [key: string]: boolean } = {}

        const vector1: THREE.Vector3 = new THREE.Vector3()
        const vector2: THREE.Vector3 = new THREE.Vector3()
        const vector3: THREE.Vector3 = new THREE.Vector3()

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            keyStates[event.code] = true
        })

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            keyStates[event.code] = false
        })

        container.addEventListener('mousedown', () => {
            document.body.requestPointerLock()

            mouseTime = performance.now()
        })

        document.addEventListener('mouseup', () => {
            if (document.pointerLockElement !== null) throwBall()
        })

        document.body.addEventListener('mousemove', (event: MouseEvent) => {
            if (document.pointerLockElement === document.body) {
                camera.rotation.y -= event.movementX / 500
                camera.rotation.x -= event.movementY / 500
            }
        })

        window.addEventListener('resize', onWindowResize)

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()

            renderer.setSize(window.innerWidth, window.innerHeight)
        }

        function throwBall() {
            const sphere = spheres[sphereIdx]

            camera.getWorldDirection(playerDirection)

            sphere.collider.center
                .copy(playerCollider.end)
                .addScaledVector(playerDirection, playerCollider.radius * 1.5)

            // throw the ball with more force if we hold the button longer, and if we move forward

            const impulse: number =
                15 +
                30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001))

            sphere.velocity.copy(playerDirection).multiplyScalar(impulse)
            sphere.velocity.addScaledVector(playerVelocity, 2)

            sphereIdx = (sphereIdx + 1) % spheres.length
        }

        function playerCollisions() {
            const result = worldOctree.capsuleIntersect(playerCollider)

            playerOnFloor = false

            if (result) {
                playerOnFloor = result.normal.y > 0

                if (!playerOnFloor) {
                    playerVelocity.addScaledVector(
                        result.normal,
                        -result.normal.dot(playerVelocity)
                    )
                }

                playerCollider.translate(
                    result.normal.multiplyScalar(result.depth)
                )
            }
        }

        function updatePlayer(deltaTime: number) {
            let damping: number = Math.exp(-4 * deltaTime) - 1

            if (!playerOnFloor) {
                playerVelocity.y -= GRAVITY * deltaTime

                // small air resistance
                damping *= 0.1
            }

            playerVelocity.addScaledVector(playerVelocity, damping)

            const deltaPosition: THREE.Vector3 = playerVelocity
                .clone()
                .multiplyScalar(deltaTime)
            playerCollider.translate(deltaPosition)

            playerCollisions()

            camera.position.copy(playerCollider.end)
        }

        function playerSphereCollision(sphere: { mesh: THREE.Mesh, collider: THREE.Sphere, velocity: THREE.Vector3 }) {
            const center: THREE.Vector3 = vector1
                .addVectors(playerCollider.start, playerCollider.end)
                .multiplyScalar(0.5)

            const sphere_center: THREE.Vector3 = sphere.collider.center

            const r: number = playerCollider.radius + sphere.collider.radius
            const r2: number = r * r

            // approximation: player = 3 spheres

            for (const point of [
                playerCollider.start,
                playerCollider.end,
                center,
            ]) {
                const d2: number = point.distanceToSquared(sphere_center)

                if (d2 < r2) {
                    const normal: THREE.Vector3 = vector1
                        .subVectors(point, sphere_center)
                        .normalize()
                    const v1: THREE.Vector3 = vector2
                        .copy(normal)
                        .multiplyScalar(normal.dot(playerVelocity))
                    const v2: THREE.Vector3 = vector3
                        .copy(normal)
                        .multiplyScalar(normal.dot(sphere.velocity))

                    playerVelocity.add(v2).sub(v1)
                    sphere.velocity.add(v1).sub(v2)

                    const d: number = (r - Math.sqrt(d2)) / 2
                    sphere_center.addScaledVector(normal, -d)
                }
            }
        }

        function spheresCollisions() {
            for (let i = 0, length = spheres.length; i < length; i++) {
                const s1 = spheres[i]

                for (let j = i + 1; j < length; j++) {
                    const s2 = spheres[j]

                    const d2 = s1.collider.center.distanceToSquared(
                        s2.collider.center
                    )
                    const r = s1.collider.radius + s2.collider.radius
                    const r2 = r * r

                    if (d2 < r2) {
                        const normal = vector1
                            .subVectors(s1.collider.center, s2.collider.center)
                            .normalize()
                        const v1 = vector2
                            .copy(normal)
                            .multiplyScalar(normal.dot(s1.velocity))
                        const v2 = vector3
                            .copy(normal)
                            .multiplyScalar(normal.dot(s2.velocity))

                        s1.velocity.add(v2).sub(v1)
                        s2.velocity.add(v1).sub(v2)

                        const d = (r - Math.sqrt(d2)) / 2

                        s1.collider.center.addScaledVector(normal, d)
                        s2.collider.center.addScaledVector(normal, -d)
                    }
                }
            }
        }

        function updateSpheres(deltaTime: number) {
            spheres.forEach((sphere) => {
                sphere.collider.center.addScaledVector(
                    sphere.velocity,
                    deltaTime
                )

                const result = worldOctree.sphereIntersect(sphere.collider)

                if (result) {
                    sphere.velocity.addScaledVector(
                        result.normal,
                        -result.normal.dot(sphere.velocity) * 1.5
                    )
                    sphere.collider.center.add(
                        result.normal.multiplyScalar(result.depth)
                    )
                } else {
                    sphere.velocity.y -= GRAVITY * deltaTime
                }

                const damping = Math.exp(-1.5 * deltaTime) - 1
                sphere.velocity.addScaledVector(sphere.velocity, damping)

                playerSphereCollision(sphere)
            })

            spheresCollisions()

            for (const sphere of spheres) {
                sphere.mesh.position.copy(sphere.collider.center)
            }
        }

        function getForwardVector(): THREE.Vector3 {
            camera.getWorldDirection(playerDirection)
            playerDirection.y = 0
            playerDirection.normalize()

            return playerDirection
        }

        function getSideVector(): THREE.Vector3 {
            camera.getWorldDirection(playerDirection)
            playerDirection.y = 0
            playerDirection.normalize()
            playerDirection.cross(camera.up)

            return playerDirection
        }

        function controls(deltaTime: number) {
            // gives a bit of air control
            const speedDelta: number = deltaTime * (playerOnFloor ? 25 : 8)

            if (keyStates['KeyW']) {
                playerVelocity.add(
                    getForwardVector().multiplyScalar(speedDelta)
                )
            }

            if (keyStates['KeyS']) {
                playerVelocity.add(
                    getForwardVector().multiplyScalar(-speedDelta)
                )
            }

            if (keyStates['KeyA']) {
                playerVelocity.add(getSideVector().multiplyScalar(-speedDelta))
            }

            if (keyStates['KeyD']) {
                playerVelocity.add(getSideVector().multiplyScalar(speedDelta))
            }

            if (playerOnFloor) {
                if (keyStates['Space']) {
                    playerVelocity.y = 15
                }
            }
        }

        const loader: GLTFLoader = new GLTFLoader().setPath('/models/')

        loader.load('collision-world.glb', (gltf) => {
            scene.add(gltf.scene)

            worldOctree.fromGraphNode(gltf.scene)

            gltf.scene.traverse((child) => {
                //@ts-ignore
                if (child.isMesh) {
                    child.castShadow = true
                    child.receiveShadow = true
                //@ts-ignore
                    if (child.material.map) {
                //@ts-ignore
                        child.material.map.anisotropy = 4
                    }
                }
            })

            const helper: OctreeHelper = new OctreeHelper(worldOctree)
            helper.visible = false
            scene.add(helper)

            const gui: GUI = new GUI({ width: 200 })
            gui.add({ debug: false }, 'debug').onChange(function (value) {
                helper.visible = value
            })

            animate()
        })

        function teleportPlayerIfOob() {
            if (camera.position.y <= -25) {
                playerCollider.start.set(0, 0.35, 0)
                playerCollider.end.set(0, 1, 0)
                playerCollider.radius = 0.35
                camera.position.copy(playerCollider.end)
                camera.rotation.set(0, 0, 0)
            }
        }

        function animate() {
            const deltaTime: number = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME

            // we look for collisions in substeps to mitigate the risk of
            // an object traversing another too quickly for detection.

            for (let i = 0; i < STEPS_PER_FRAME; i++) {
                controls(deltaTime)

                updatePlayer(deltaTime)

                updateSpheres(deltaTime)

                teleportPlayerIfOob()
            }

            renderer.render(scene, camera)

            stats.update()

            requestAnimationFrame(animate)
        }
    }, [])
    return (
        <>
            <div id="info" className='fixed lt-50% translate--50%'>
                Octree threejs demo - basic collisions with static triangle mesh
                <br />
                MOUSE to look around and to throw balls
                <br />
                WASD to move and SPACE to jump
            </div>
            <div id="container" className='w-100% h-100%'></div>
        </>
    )
}

export default FpsTest
