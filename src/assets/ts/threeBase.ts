import * as THREE from 'three'
import { Octree, OrbitControls } from 'three/examples/jsm/Addons.js'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

interface GUISetType {
    globalGUI: GUI
    commonGUI: GUI
    helperGUI: GUI
    modelGUI: GUI
    utilsGUI: GUI
    lightGUI: GUI
    rendererGUI: GUI
}
// 同步修改
const GUIName = [
    'commonGUI',
    'helperGUI',
    'modelGUI',
    'utilsGUI',
    'lightGUI',
    'rendererGUI',
]
export interface CameraConfig {
    fov: number
    near: number
    far: number
}
type LightSet = {
    ambientLight?: THREE.AmbientLight
    directLight?: THREE.DirectionalLight
    hemiLight?: THREE.HemisphereLight
}
export class ThreeBase {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    // groupSet: GroupExt = {} as GroupExt
    GUISet: GUISetType
    stats = new Stats()
    worldOctree = new Octree()
    lightSet: LightSet
    constructor(
        public cameraConfig: CameraConfig,
        public domElement: HTMLElement
    ) {
        this.GUISet = this.initGUI()
        this.scene = this.initScene()
        this.camera = this.initCamera()
        this.renderer = this.initRenderer()
        this.controls = this.initControls()
        this.lightSet = this.initLight()
    }
    private initGUI = () => {
        const GUISet = {} as GUISetType
        GUISet.globalGUI = new GUI({ width: 200 })
        GUISet.globalGUI.close()

        GUIName.forEach((name) => {
            GUISet[name as keyof GUISetType] = GUISet.globalGUI.addFolder(name)
        })
        return GUISet
    }
    private initScene() {
        // const { GUISet } = this
        const scene = new THREE.Scene()
        // scene.background = new THREE.Color(0x000511)

        const sceneBgParams = {
            string: '#000000',
            int: 0x000000,
            object: { r: 1, g: 1, b: 1 },
            array: [1, 1, 1],
        }
        // const sceneFolder = GUISet.commonGUI.addFolder('scene')
        // sceneFolder
        //     .addColor(sceneBgParams, 'string')
        //     .onChange((val) => {
        //         scene.background = new THREE.Color(val)
        //     })
        //     .name('background')
        scene.background = new THREE.Color('#000')
        return scene
    }
    private initCamera() {
        const { cameraConfig, domElement } = this
        const camera = new THREE.PerspectiveCamera(
            cameraConfig.fov,
            domElement.clientWidth / domElement.clientHeight,
            cameraConfig.near,
            cameraConfig.far
        )
        return camera
    }
    private initRenderer() {
        const { domElement, GUISet } = this
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            precision: 'highp',
            logarithmicDepthBuffer: true,
        })
        // 阴影控制

        const shadowParams = {
            shadowType: 'PCFSoft',
        }

        const shadowOptions = {
            basic: THREE.BasicShadowMap,
            PCF: THREE.PCFShadowMap,
            PCFSoft: THREE.PCFSoftShadowMap,
            VSM: THREE.VSMShadowMap,
        }

        renderer.shadowMap.enabled = true
        renderer.shadowMap.type =
            shadowOptions[shadowParams.shadowType as keyof typeof shadowOptions]

        const shadowMapGUI = GUISet.rendererGUI.addFolder('shadowMap')
        shadowMapGUI
            .add(shadowParams, 'shadowType', Object.keys(shadowOptions))
            .onChange(() => {
                renderer.shadowMap.type =
                    shadowOptions[
                        shadowParams.shadowType as keyof typeof shadowOptions
                    ]
            })

        // 配置色调映射 gui 控制对象
        const toneParams = {
            exposure: 1.0,
            toneMapping: 'AgX',
            blurriness: 0.3,
            intensity: 1.0,
        }

        const toneMappingOptions = {
            None: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping,
            AgX: THREE.AgXToneMapping,
            Neutral: THREE.NeutralToneMapping,
            Custom: THREE.CustomToneMapping,
        }

        renderer.toneMapping =
            toneMappingOptions[
                toneParams.toneMapping as keyof typeof toneMappingOptions
            ]
        renderer.toneMappingExposure = toneParams.exposure

        const toneMappingFolder = GUISet.rendererGUI.addFolder('toneMapping')
        toneMappingFolder
            .add(toneParams, 'toneMapping', Object.keys(toneMappingOptions))
            .onChange(function () {
                updateGUI(toneMappingFolder)
                renderer.toneMapping =
                    toneMappingOptions[
                        toneParams.toneMapping as keyof typeof toneMappingOptions
                    ]
            })
        let guiExposure: GUI | null
        function updateGUI(folder: GUI) {
            if (guiExposure) {
                guiExposure.destroy()
                guiExposure = null
            }
            if (toneParams.toneMapping !== 'None') {
                guiExposure = folder
                guiExposure
                    .add(toneParams, 'exposure', 0, 2)
                    .onChange(function () {
                        renderer.toneMappingExposure = toneParams.exposure
                    })
            }
        }
        updateGUI(toneMappingFolder)

        renderer.setSize(domElement.clientWidth, domElement.clientHeight)

        renderer.domElement.className = 'threeSceneCanvas'
        domElement.appendChild(renderer.domElement)
        return renderer
    }
    private initControls() {
        const controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        )
        controls.enableDamping = true // 手动操作更顺滑
        controls.enableZoom = true
        controls.enablePan = true
        controls.enableRotate = true
        // controls.minDistance = 40
        // controls.maxDistance = 80
        return controls
    }
    private initLight() {
        const {scene} = this
        const lightSet = {} as LightSet
        // light.ambientLight = new THREE.AmbientLight('#fff', 1)
        lightSet.hemiLight = new THREE.HemisphereLight('#fff','#444',1)

        return lightSet
    }
}
