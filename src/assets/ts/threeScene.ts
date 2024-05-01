import { CameraConfig, ThreeBase } from './threeBase'
import * as THREE from 'three'
import { Capsule, Octree, OctreeHelper } from 'three/examples/jsm/Addons.js'
import { DragControls } from '@/assets/ts/myAddons'

export class ThreeScene extends ThreeBase {
    octree!: Octree
    octreeHelper!: OctreeHelper
    playerCollider = new Capsule(
        new THREE.Vector3(0, 0.35, 0),
        new THREE.Vector3(0, 1, 0),
        0.35
    )
    playerOnFloor: boolean = false
    playerVelocity = new THREE.Vector3()
    playerDirection = new THREE.Vector3()
    keyStates: { [key: string]: boolean } = {}
    mouseTime: number = 0
    clock = new THREE.Clock()
    STEPS_PER_FRAME: number = 5
    GRAVITY: number = 30

    constructor(
        public cameraConfig: CameraConfig,
        public domElement: HTMLElement
    ) {
        super(cameraConfig, domElement)
        this.init()
    }
    init() {
        this.initConf()
        this.useLight()
        this.initPlane()
        this.initBox()
        this.initEvent()
        // this.initDragControls()
        this.initCollision()
    }
    initEvent() {
        const { keyStates, renderer, camera, scene } = this
        const pauseDom = document.getElementsByClassName(
            'pause'
        )[0] as HTMLDivElement
        // renderer.domElement.addEventListener('click', () => {
        //     this.pointerLockControls.lock()
        // })
        let isDragging = false
        let intersectObj: THREE.Mesh | null
        const boxSet = scene.children.find((item) => item.name === 'boxGroup')
        const pointer = new THREE.Vector2(0)
        const raycaster = new THREE.Raycaster()
        const mousedown = (event: MouseEvent) => {
            console.log('按下')
        }
        const mousemove = (event: MouseEvent) => {
            raycaster.setFromCamera(pointer, camera)
            const intersects = raycaster.intersectObjects(
                boxSet!.children,
                false
            )
            if (intersects.length > 0) {
                if (intersectObj != intersects[0].object) {
                    if (intersectObj) {
                        // @ts-ignore
                        intersectObj.material.emissive.setHex(
                            // @ts-ignore
                            intersectObj.currentHex
                        )
                    }

                    intersectObj = intersects[0].object as THREE.Mesh
                    // @ts-ignore
                    intersectObj.currentHex =
                        // @ts-ignore
                        intersectObj.material.emissive.getHex()
                    // @ts-ignore
                    intersectObj.material.emissive.setHex(0xff0000)
                }
            } else {
                if (intersectObj)
                //@ts-ignore
                    intersectObj.material.emissive.setHex(
                //@ts-ignore
                        intersectObj.currentHex
                    )
                intersectObj = null
            }
        }
        const mouseup = () => {
            console.log('鼠标松开')
        }
        document.body.addEventListener('mouseup', mouseup)
        document.body.addEventListener('mousedown', mousedown)
        document.body.addEventListener('mousemove', (event: MouseEvent) => {
            if (document.pointerLockElement === document.body) {
                camera.rotation.y -= event.movementX / 500
                camera.rotation.x -= event.movementY / 500
                // pointer.x = (event.clientX / window.innerWidth) * 2 - 1
                // pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
                mousemove(event)
            }
        })

        renderer.domElement.addEventListener('mousedown', (event) => {
            event.stopPropagation()
            document.body.requestPointerLock()

            this.mouseTime = performance.now()
        })

        document.addEventListener('keydown', (event: KeyboardEvent) => {
            keyStates[event.code] = true
        })

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            keyStates[event.code] = false
        })
    }
    initConf() {
        const { scene, camera, renderer } = this
        scene.add(camera)
        camera.rotation.order = 'YXZ'

        this.controls = this.pointerLockControls
    }

    playerCollisions = () => {
        const { playerCollider, playerVelocity } = this
        const result = this.octree.capsuleIntersect(playerCollider)

        this.playerOnFloor = false

        if (result) {
            this.playerOnFloor = result.normal.y > 0

            if (!this.playerOnFloor) {
                playerVelocity.addScaledVector(
                    result.normal,
                    -result.normal.dot(playerVelocity)
                )
            }

            playerCollider.translate(result.normal.multiplyScalar(result.depth))
        }
    }
    updatePlayer = (deltaTime: number) => {
        const { playerVelocity, playerCollider, playerCollisions, camera } =
            this
        let damping: number = Math.exp(-4 * deltaTime) - 1

        if (!this.playerOnFloor) {
            playerVelocity.y -= this.GRAVITY * deltaTime

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
    getForwardVector = (): THREE.Vector3 => {
        const { camera, playerDirection } = this
        camera.getWorldDirection(playerDirection)
        playerDirection.y = 0
        playerDirection.normalize()

        return playerDirection
    }
    getSideVector = (): THREE.Vector3 => {
        const { camera, playerDirection } = this
        camera.getWorldDirection(playerDirection)
        playerDirection.y = 0
        playerDirection.normalize()
        playerDirection.cross(camera.up)

        return playerDirection
    }
    teleportPlayerIfOob = () => {
        const { camera, playerCollider } = this
        if (camera.position.y <= -25) {
            playerCollider.start.set(0, 0.35, 0)
            playerCollider.end.set(0, 1, 0)
            playerCollider.radius = 0.35
            camera.position.copy(playerCollider.end)
            camera.rotation.set(0, 0, 0)
        }
    }
    controlsEvent = (deltaTime: number) => {
        const { keyStates, getForwardVector, playerVelocity, getSideVector } =
            this
        // gives a bit of air control
        const speedDelta: number = deltaTime * (this.playerOnFloor ? 25 : 8)

        if (keyStates['KeyW']) {
            playerVelocity.add(getForwardVector().multiplyScalar(speedDelta))
        }

        if (keyStates['KeyS']) {
            playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta))
        }

        if (keyStates['KeyA']) {
            playerVelocity.add(getSideVector().multiplyScalar(-speedDelta))
        }

        if (keyStates['KeyD']) {
            playerVelocity.add(getSideVector().multiplyScalar(speedDelta))
        }

        if (this.playerOnFloor) {
            if (keyStates['Space']) {
                playerVelocity.y = 15
            }
        }
    }
    private initCollision() {
        const { scene } = this
        const octree = new Octree()
        octree.fromGraphNode(scene)
        const octreeHelper = new OctreeHelper(octree)
        this.octree = octree
        this.octreeHelper = octreeHelper
        this.scene.add(octreeHelper)
    }
    initDragControls() {
        const { scene, camera, renderer } = this
        const boxSet = scene.children.find((item) => item.name === 'boxGroup')

        const dragControls = new DragControls(
            boxSet!.children,
            camera,
            document.body
        )
        console.log(dragControls)
    }
    useLight() {
        const { scene, lightSet } = this
        lightSet.hemiLight?.position.setY(15)
        scene.add(lightSet.hemiLight!)
    }
    initPlane() {
        const { scene } = this
        const geo = new THREE.PlaneGeometry(30, 30, 30, 30)
        const mat = new THREE.MeshStandardMaterial({ color: '#fff' })
        const plane = new THREE.Mesh(geo, mat)

        // 绕 x 轴旋转-90度
        plane.rotation.setFromRotationMatrix(
            new THREE.Matrix4(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1)
        )
        scene.add(plane)
    }
    initBox() {
        const { scene } = this
        const positionSet = []
        const boxGroup = new THREE.Group()
        const geo = new THREE.BoxGeometry(2, 2, 2, 6, 6, 6)
       
        for (let i = 0; i < 10; i++) {
            const mat = new THREE.MeshStandardMaterial({ color: '#fff' })
            const box = new THREE.Mesh(geo, mat)
            const position = {
                x: Math.random() * 5,
                y: Math.random() * 5,
                z: Math.random() * 5,
            }
            box.position.set(position.x, position.y, position.z)
            positionSet.push(position)
            boxGroup.add(box)
        }
        boxGroup.name = 'boxGroup'
        scene.add(boxGroup)
    }

    animate() {
        const {
            teleportPlayerIfOob,
            updatePlayer,
            controlsEvent,
            axes,
            renderer,
            scene,
            camera,
            clock,
        } = this
        const deltaTime: number =
            Math.min(0.05, clock.getDelta()) / this.STEPS_PER_FRAME

        // we look for collisions in substeps to mitigate the risk of
        // an object traversing another too quickly for detection.

        for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
            controlsEvent(deltaTime)

            updatePlayer(deltaTime)

            // updateSpheres(deltaTime)

            teleportPlayerIfOob()
        }

        renderer.render(scene, camera)
    }
}
