import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { degToRad } from 'three/src/math/mathutils'

const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/')
gltfLoader.setDRACOLoader(dracoLoader)

const defaultSettings = {
    material: {
        physMat: new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true
        }),
        shape: new THREE.MeshStandardMaterial({
            color: 0x777777
        })
    },
    helper: {
    }
}

/**
 * Builds the scene from jsonObject array into a specified group
 * @param {THREE.Group} group ThreeJS group that imported objects will be in (add group to main scene
 * @param {any[]} jsonObject Parsed JSON Array object
 * @param {Boolean} clear Clear group before building again? default = true
 * @return {any[]} list of imported objects
*/
function BuildScene(group, jsonObject, clear = true) {
    let objectlist = []
    if(clear){
        ClearScene(group)
    }
    try{
        jsonObject.forEach(async element => {
            let object;
            switch(element.type){
                case 'glb':
                case 'gltf':
                    object = await asyncMakeModel(element)
                    break
                case 'light':
                    object = await MakeLight(element)
                    break
                case 'physics':
                    object = await MakePhysicsShape(element)
                    break;
                case 'shape':
                    object = await MakeShape(element)
                    break
            }
            objectlist.push(object)
            group.add(object)
        })
        return objectlist
    } catch (err) {
        console.warn(err)
    }
}

/**
 * Clears the group
 * @param {THREE.Group} group 
 */
function ClearScene(group){
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

/**
 * Set the Transform of the target with parameters within jsonobj
 * @param {any} jsonobj 
 * @param {THREE.Object3D} target 
 */
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

/**
 * Makes Model in group from jsonobj asynchronously
 * @param {*} jsonobj 
 * @return {THREE.Object3D}
 */
async function asyncMakeModel(jsonobj){
    // Load GLTF data
    let data = await gltfLoader.loadAsync(jsonobj.path)
    // Ref Model
    let model = data.scene.children[0]
    // Set Model Transform
    setTransform(jsonobj, model)
    // Set Model name (for debug)
    model.name = jsonobj.name

    return model
}

/**
 * Makes Model in group from jsonobj
 * @param {*} jsonobj 
 * @return {THREE.Object3D}
 */
function normalMakeModel(jsonobj) {
    let model
    gltfLoader.load(
        jsonobj.path,
        function (gltf) {
            model = gltf.scene.children[0]
            setTransform(jsonobj, model)
            model.name = jsonobj.name
        }
    )
    return model
}

/**
 * Makes Light in group from jsonobj
 * @param {*} jsonobj 
 * @return {THREE.AmbientLight | THREE.PointLight | THREE.DirectionalLight | THREE.HemisphereLight | THREE.RectAreaLight | THREE.SpotLight}
 */
function MakeLight(jsonobj) {
    let light
    let color = new THREE.Color('#'+jsonobj.mesh.color)
    let helper
    let intensity = jsonobj.mesh.intensity
    switch(jsonobj.light){
        case 'ambient':
            light = new THREE.AmbientLight(color, intensity)
            break
        case 'point':
            light = new THREE.PointLight(color, intensity)
            helper = new THREE.PointLightHelper(light, .5)
            light.add(helper)
            setTransform(jsonobj, light)
            break
        case 'directional':
            light = new THREE.DirectionalLight(color, intensity)
            helper = new THREE.DirectionalLightHelper(light, 10)
            light.add(helper)
            break
        case 'hemisphere':
            let groundColor = new THREE.Color('#'+jsonobj.mesh.groundColor)
            light = new THREE.HemisphereLight(color, groundColor, intensity)
            helper = new THREE.HemisphereLightHelper(light, 5)
            light.add(helper)
            break
        case 'rectarea':
            light = new THREE.RectAreaLight()
            // TODO
            break
        case 'spotlight':
            light = new THREE.SpotLight()
            // TO DO
            break
        }
    if(light != undefined)
    {
        light.name = jsonobj.name
        return light
    }
}

/**
 * Makes PhysicsShape in group from jsonobj
 * @param {*} jsonobj 
 * @param {THREE.Material} material wireframe material. optional
 * @return {THREE.Mesh}
 */
function MakePhysicsShape(jsonobj, material = defaultSettings.material.physMat){
    let physicsShape = MakeShape(jsonobj, true)
    physicsShape.material = material;
    return physicsShape
}

/**
 * 
 * @param {*} jsonobj 
 * @returns {THREE.Mesh}
 */
function MakeShape(jsonobj){
    let geometry
    switch(jsonobj.shape){
        case 'box':
            geometry = new THREE.BoxGeometry(
                jsonobj.geometry[0],
                jsonobj.geometry[1],
                jsonobj.geometry[2]
            )
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
            geometry = new THREE.CylinderGeometry(
                jsonobj.geometry[0],
                jsonobj.geometry[1],
                jsonobj.geometry[2],
                jsonobj.geometry[3],
            )
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
            geometry = new THREE.SphereGeometry(
                jsonobj.geometry[0]
            )
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
    let shape = geometry != undefined ? new THREE.Mesh(geometry, defaultSettings.material.shape) : undefined
    if(shape != undefined)
    {
        setTransform(jsonobj, shape)
        shape.name = jsonobj.name
        return shape
    }
}

/**
 * @param {string} type 
 * @param {string} obj 
 */
function ErrorHandler(type, obj){

}

export { BuildScene, ClearScene }