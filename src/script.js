import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

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

var importScene = new THREE.Group()
importScene.name = "importedScene"
scene.add(importScene)

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

function ClearImportedObjs(obj){
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
}

function setTransform(jsonobj, target) {
    // Set Target Position xyz (Vector3)
    target.position.set(
        jsonobj.mesh.position[0], // x
        jsonobj.mesh.position[1], // y
        jsonobj.mesh.position[2]  // z
    )
    // Set Target Rotation xyz (Vector3) Input: Degrees, Output: Radians
    target.rotation.set(
        THREE.MathUtils.degToRad(jsonobj.mesh.rotation[0]), // x
        THREE.MathUtils.degToRad(jsonobj.mesh.rotation[1]), // y
        THREE.MathUtils.degToRad(jsonobj.mesh.rotation[2])  // z
    )
    // Set Target Scale xyz (Vector3)
    target.scale.set(
        jsonobj.mesh.scale[0], // x
        jsonobj.mesh.scale[1], // y
        jsonobj.mesh.scale[2]  // z
    )
}

async function asyncLoadModels(jsonobj){
    // Load GLTF data
    let data = await gltfLoader.loadAsync(jsonobj.path)
    // Ref Model
    let model = data.scene.children[0]
    // Set Model Transform
    setTransform(jsonobj, model)
    // Set Model name (for debug)
    model.name = jsonobj.name
    // Attach Object to importScene
    importScene.add(model)
}

function normalLoadModel(jsonobj) {
    gltfLoader.load(
        jsonobj.path,
        function (gltf) {
            let mesh = gltf.scene
            setTransform(jsonobj, mesh)
            mesh.name = jsonobj.name
            importScene.add(mesh)
        }
    )
}

function MakeLight(jsonobj) {
    let light;
    let color = []
    for(let i = 0; i < jsonobj.mesh.color.length; i++) {
        color.push("#"+jsonobj.mesh.color[i])
    }
    let intensity = jsonobj.mesh.intensity
    switch(jsonobj.light){
        case 'ambient':
            light = new THREE.AmbientLight(color[0], intensity)
            break
        case 'point':
            light = new THREE.PointLight(color[0], intensity)
            setTransform(jsonobj, light)
            break
        case 'directional':
            light = new THREE.DirectionalLight(color[0], intensity)
            break
        case 'hemisphere':
            light = new THREE.HemisphereLight(color[0], color[1], intensity)
            break
        case 'rectarea':

            break
        case 'spotlight':
            
            break
        }
    light.name = jsonobj.name
    importScene.add(light)
}

function MakePhysicsShape(jsonobj){
    let physicsShape = MakeShape(jsonobj, true)
    importScene.add(physicsShape)
}

function MakeShape(jsonobj, physics = new Boolean(false)){
    let geometry
    let shape
    switch(jsonobj.shape){
        case 'box':
            geometry = new THREE.BoxGeometry(
                jsonobj.geometry[0],
                jsonobj.geometry[1],
                jsonobj.geometry[2]
            )
            shape = new THREE.Mesh(geometry)
            setTransform(jsonobj, shape)
            break
    }
    if(shape != undefined)
    {
        shape.name = jsonobj.name
        if(!physics){
            console.log(shape.name, "is not physics")
            importScene.add(shape)
        }
        return shape
    }
    console.error('Shape is declared but undefined')
}

const fileButton = document.getElementById('uploadButton')
fileButton.onclick = () => {
    // Clear Previous Models for next Load
    ClearImportedObjs(importScene)
    let b_async = document.querySelector('#asyncCheckbox')
    // Read JSON and for each object build
    JSONObj.forEach(element => {
        switch(element.type){
            case 'glb':
            case 'gltf':
                // Async load
                if(!b_async.checked){
                    normalLoadModel(element)
                    break
                }
                asyncLoadModels(element)
                break
            case 'light':
                MakeLight(element)
                break
            case 'physics':
                MakePhysicsShape(element)
                break;
            case 'shape':
                MakeShape(element)
                break
        }
    })
    console.log('imported', importScene.children)
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
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()