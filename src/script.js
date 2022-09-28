import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0,0,5)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
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

var importScene = new THREE.Group()
importScene.name = "importedScene"
scene.add(importScene)

const directionLight = new THREE.DirectionalLight(0xFFFFFF, 1)
directionLight.position.set(0,0, 2)
scene.add(directionLight)
directionLight.target = importScene

//
// Real stuff
//

const fileReader = new FileReader()
const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/%27')
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

function ClearImportedObjs(obj){
    console.log(obj.name, obj.children.length > 0, obj)
    // iterate through each child object to start from bottom up
    if(obj.children.length > 0)
    {
        for( let i = obj.children.length - 1; i >= 0; i--){
            ClearImportedObjs(obj.children[i])
        }
    }
    // dispose memory of mesh
    if(obj.mesh) {
        obj.geometry.dispose()
        obj.material.dispose()
    }
    // if the parent isn't 'scene' (essentially if obj isn't importScene remove the object itself)
    if(obj.parent != scene)
    {
        obj.parent.remove(obj)
    }
    console.log(scene.children)
}

async function LoadModels(obj){
    // Load GLTF data
    let data = await gltfLoader.loadAsync(obj.path)
    // Ref Model
    let model = data.scene.children[0]
    // Set Model Position xyz (Vector3)
    model.position.set(
        obj.mesh.position[0], // x
        obj.mesh.position[1], // y
        obj.mesh.position[2]  // z
    )
    // Set Model Rotation xyz (Vector3) Input: Degrees, Output: Radians
    model.rotation.set(
        THREE.MathUtils.degToRad(obj.mesh.rotation[0]), // x
        THREE.MathUtils.degToRad(obj.mesh.rotation[1]), // y
        THREE.MathUtils.degToRad(obj.mesh.rotation[2])  // z
    )
    // Set Model Scale xyz (Vector3)
    model.scale.set(
        obj.mesh.scale[0], // x
        obj.mesh.scale[1], // y
        obj.mesh.scale[2]  // z
    )
    // Set Model name (for debug)
    model.name = obj.name
    // Attach Object to importScene
    importScene.add(model)
}

const fileButton = document.getElementById('uploadButton')
fileButton.onclick = () => {
    // Clear Previous Models for next Load
    ClearImportedObjs(importScene)
    // Read JSON and for each object build
    JSONObj.forEach(element => {
        switch(element.type){
            case 'glb':
            case 'gltf':
                // Async load
                LoadModels(element)
                break
        }
    })
    // console.log(importedObjs)
    // console.log(scene)
};

const clearButton = document.getElementById('clearButton')
clearButton.onclick = () => {
    ClearImportedObjs(importScene)
}

const clock = new THREE.Clock()

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects

    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()