import { CameraConfig, ThreeBase } from './threeBase'
import * as THREE from 'three'

export class ThreeScene extends ThreeBase {
    constructor(
        public cameraConfig: CameraConfig,
        public domElement: HTMLElement
    ) {
        super(cameraConfig, domElement)
        this.init()
    }
    init(){
        const {scene,GUISet,lightSet} = this

        lightSet.hemiLight?.position.setY(15)
        scene.add(this.camera)
        this.camera.position.setY(15)
        this.controls.target.set(0,0,0)
        scene.add(lightSet.hemiLight!)
        const geo = new THREE.BoxGeometry(2,2,2,6,6,6)
        const mat = new THREE.MeshStandardMaterial({color:'#fff'})
        const box = new THREE.Mesh(geo,mat)
        scene.add(box)
    }

    animate(){
        this.renderer.render(this.scene,this.camera)
    }
}
