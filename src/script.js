import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as TJSON from './ThreeJSon.js'

// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
camera.position.set(0,0,5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: false,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    
    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    
    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

var importGroup = new THREE.Group()
importGroup.name = "importedScene"
scene.add(importGroup)

const gridHelper = new THREE.GridHelper(50,50,0xFFFFFF)
scene.add(gridHelper)

//
// Real stuff
//

const fileReader = new FileReader()
const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/')
gltfLoader.setDRACOLoader(dracoLoader);

const fileInput = document.getElementById('file')
var selectedFile
var JSONObj
fileInput.onchange = () => {
    selectedFile = fileInput.files[0]
    fileReader.readAsText(selectedFile)
    
    fileReader.onload = function() {
        JSONObj = JSON.parse(fileReader.result)
    }

    fileReader.onerror = function(){
        console.error(fileReader.error)
    }
}

const fileButton = document.getElementById('uploadButton')
fileButton.onclick = () => {

    TJSON.BuildScene(importGroup, JSONObj)
    // // Clear Previous Models for next Load
    // ClearImportedObjs(importGroup)
    // let b_async = document.querySelector('#asyncCheckbox')
    // // Read JSON and for each object build
    // JSONObj.forEach(element => {
    //     switch(element.type){
    //         case 'glb':
    //         case 'gltf':
    //             // Async load
    //             if(b_async.checked){
    //                 asyncLoadModels(element)
    //                 break
    //             }
    //             normalLoadModel(element)
    //             break
    //         case 'light':
    //             MakeLight(element)
    //             break
    //         case 'physics':
    //             MakePhysicsShape(element)
    //             break;
    //         case 'shape':
    //             MakeShape(element)
    //             break
    //     }
    // })
    // console.log('imported', importGroup.children)
}

document.addEventListener('keypress', function ( event ) {
    switch(event.code){
        case 'KeyT':
            console.log('scene:', scene)
            console.log(JSONObj)
            break
    }
})

const clearButton = document.getElementById('clearButton')
clearButton.onclick = () => {
    TJSON.ClearScene(scene)
    // ClearImportedObjs(importGroup)
}

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects

    // Update Orbital Controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()