import * as THREE from 'three';

export function calcPoints(radius) {
    let points = [];
    // 円形に360分割した点を格納
    for (let index = 0; index <= 390; index++) {
        var rad = (index * Math.PI) / 180;
        var x = radius * Math.cos(rad);
        var z = radius * Math.sin(rad);
        points.push(new THREE.Vector3(x, 0, z));
    }
    return points;
}

// 現在位置と次フレームの位置から法線を算出します。
export function getNormal(currentPoint, nextPoint) {
    var vAB = nextPoint
        .clone()
        .sub(currentPoint)
        .normalize();
    var vAZ = new THREE.Vector3(0, 1, 0);
    // 法線ベクトルが常にプラスを向くよう調整
    // var normalVec = vAB.cross(vAY)
    var normalVec = nextPoint.z >= 0 ? vAB.cross(vAZ) : vAZ.cross(vAB);
    return normalVec;
}