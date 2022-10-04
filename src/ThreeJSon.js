import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

function BuildScene(group = new THREE.Group(), jsonObject = [], async = new Boolean(true), clear = new Boolean(true)) {
    if(clear){
        ClearScene(group)
        console.log('Scene cleared')
    }
    jsonObject.forEach(element => {
        switch(element.type){
            case 'glb':
            case 'gltf':
                // Async load
                if(!async){
                    normalLoadModel(element, group)
                    break
                }
                asyncLoadModels(element, group)
                break
            case 'light':
                MakeLight(element, group)
                break
            case 'physics':
                MakePhysicsShape(element, group)
                break;
            case 'shape':
                MakeShape(element, group)
                break
        }
    });
}

function ClearScene(group = new THREE.Group()){
    // iterate through each child object to start from bottom up
    if(group.children.length > 0)
    {
        for( let i = group.children.length - 1; i >= 0; i--){
            ClearScene(group.children[i])
        }
    }
    // dispose memory of mesh
    if(group.mesh) {
        group.geometry.dispose()
        group.material.dispose()
    }
    // if the parent isn't 'scene' (essentially if obj isn't scene remove the object itself)
    if(group.parent.type != "Scene")
    {
        group.parent.remove(group)
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

async function asyncLoadModels(jsonobj, group){
    // Load GLTF data
    let data = await gltfLoader.loadAsync(jsonobj.path)
    // Ref Model
    let model = data.scene.children[0]
    // Set Model Transform
    setTransform(jsonobj, model)
    // Set Model name (for debug)
    model.name = jsonobj.name
    // Attach Object to scene
    group.add(model)
}

function normalLoadModel(jsonobj, group) {
    gltfLoader.load(
        jsonobj.path,
        function (gltf) {
            let mesh = gltf.scene
            setTransform(jsonobj, mesh)
            mesh.name = jsonobj.name
            group.add(mesh)
        }
    )
}

function MakeLight(jsonobj, group) {
    let light;
    let color = new THREE.Color('#'+jsonobj.mesh.color)
    let intensity = jsonobj.mesh.intensity
    switch(jsonobj.light){
        case 'ambient':
            light = new THREE.AmbientLight(color, intensity)
            break
        case 'point':
            light = new THREE.PointLight(color, intensity)
            setTransform(jsonobj, light)
            break
        case 'directional':
            light = new THREE.DirectionalLight(color, intensity)
            break
        case 'hemisphere':
            let groundColor = new THREE.Color('#'+jsonobj.mesh.groundColor)
            light = new THREE.HemisphereLight(color, groundColor, intensity)
            break
        case 'rectarea':
            // TODO
            break
        case 'spotlight':
            // TO DO
            break
        }
    light.name = jsonobj.name
    group.add(light)
}

function MakePhysicsShape(jsonobj, group){
    let physicsShape = MakeShape(jsonobj, true)
    group.add(physicsShape)
}

function MakeShape(jsonobj, group, physics = new Boolean(false)){
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
        case 'capsule':
            // TODO
            break
        case 'circle':
            // TODO
            break
        case 'cone':
            // TODO
            break
        case 'cylinder':
            // TODO
            break
        case 'dodecahedron':
            // TODO
            break
        case 'edges':
            // TODO
            break
        case 'extrude':
            // TODO
            break
        case 'icosahedron':
            // TODO
            break
        case 'lathe':
            // TODO
            break
        case 'octahedron':
            // TODO
            break
        case 'plane':
            // TODO
            break
        case 'polyhedron':
            // TODO
            break
        case 'ring':
            // TODO
            break
        case 'shape':
            // TODO
            break
        case 'sphere':
            // TODO
            break
        case 'tetrahedron':
            // TODO
            break
        case 'torus':
            // TODO
            break
        case 'torusknot':
            // TODO
            break
        case 'tube':
            // TODO
            break
        case 'wireframe':
            // TODO
            break
    }
    if(shape != undefined)
    {
        shape.name = jsonobj.name
        if(!physics){
            console.log(shape.name, "is not physics")
            group.add(shape)
        }
        return shape
    }
    console.error('Shape is declared but undefined')
}

export { BuildScene, ClearScene }