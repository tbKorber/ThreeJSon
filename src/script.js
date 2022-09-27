import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
camera.position.set(0,0,2)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
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

var importedObjs = new THREE.Group()
importedObjs.name = "importedObjs"
scene.add(importedObjs)

//
// Real stuff
//

const fileReader = new FileReader()
const gltfLoader = new GLTFLoader()

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

function clearImportedObjs(obj){
    if(obj.children.length > 0)
    {
        obj.children.forEach(element => {
            clearImportedObjs(element)
        });
    }
    console.log(obj, obj.children.length > 0)
    if(obj.isMesh) {
        obj.geometry.dispose()
        obj.material.dispose()
    }
    if(obj.parent != scene)
    {
        obj.parent.remove(obj)
    }
}

const fileButton = document.getElementById('uploadButton')
fileButton.onclick = () => {
    clearImportedObjs(importedObjs)
    JSONObj.forEach(element => {
        switch(element.type){
            case 'glb':
            case 'gltf':
                gltfLoader.load(
                    element.path,
                    function (gltf) {
                        var mesh = gltf.scene
                        mesh.position.set(
                            element.mesh.position[0], // x
                            element.mesh.position[1], // y
                            element.mesh.position[2]  // z
                        )
                        mesh.rotation.set(
                            THREE.MathUtils.degToRad(element.mesh.rotation[0]), // x
                            THREE.MathUtils.degToRad(element.mesh.rotation[1]), // y
                            THREE.MathUtils.degToRad(element.mesh.rotation[2])  // z
                        )
                        mesh.scale.set(
                            element.mesh.scale[0], // x
                            element.mesh.scale[1], // y
                            element.mesh.scale[2]  // z
                        )
                        mesh.name = element.name
                        importedObjs.add(mesh)
                    }
                )
                break
        }
    })
    console.log(importedObjs)
    console.log(scene)
};

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