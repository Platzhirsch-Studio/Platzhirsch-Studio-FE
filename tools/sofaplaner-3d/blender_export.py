# Sofaplaner 3D – Formatwandlung in Blender (headless, nur CPU, kein Rendern).
#
#   blender -b --factory-startup -P tools/sofaplaner-3d/blender_export.py -- <eingabe> <ausgabe.glb>
#
# Importiert FBX / OBJ / 3DS / DAE / STL / PLY / BLEND / USD / ABC, wendet
# Transformationen und Modifikatoren an und schreibt ein rohes GLB (Meter,
# Y-oben). Einheit, Drehung, Ursprung, Klassen (Polster/Sockel/Keder) und LODs
# macht danach tools/sofaplaner-3d/lib.mjs. Letzte Zeile der Ausgabe:
#   SOFAPLANER_RESULT {"ok": true, ...}
import json
import os
import sys

import addon_utils
import bpy


def result(**kw):
    print("SOFAPLANER_RESULT " + json.dumps(kw), flush=True)


def enable(mod):
    try:
        addon_utils.enable(mod, default_set=True)
        return True
    except Exception:
        return False


def do_import(src):
    ext = os.path.splitext(src)[1].lower()
    if ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=src, use_image_search=True)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=src)
    elif ext == ".3ds":
        if not (enable("io_scene_3ds") or enable("bl_ext.blender_org.autodesk_3ds_format")):
            raise RuntimeError("3DS-Import in dieser Blender-Version nicht verfügbar – bitte FBX/OBJ verwenden")
        bpy.ops.import_scene.max3ds(filepath=src)
    elif ext == ".dae":
        bpy.ops.wm.collada_import(filepath=src)
    elif ext == ".stl":
        bpy.ops.wm.stl_import(filepath=src)
    elif ext == ".ply":
        bpy.ops.wm.ply_import(filepath=src)
    elif ext in (".usd", ".usdc", ".usdz", ".usda"):
        bpy.ops.wm.usd_import(filepath=src)
    elif ext == ".abc":
        bpy.ops.wm.alembic_import(filepath=src)
    elif ext == ".blend":
        with bpy.data.libraries.load(src, link=False) as (data_from, data_to):
            data_to.objects = list(data_from.objects)
        for ob in data_to.objects:
            if ob is not None:
                bpy.context.scene.collection.objects.link(ob)
    else:
        raise RuntimeError("Format nicht unterstützt: " + ext)


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if len(argv) < 2:
        result(ok=False, error="Aufruf: -- <eingabe> <ausgabe.glb>")
        return
    src, dst = argv[0], argv[1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        do_import(src)
    except Exception as e:  # noqa: BLE001
        result(ok=False, error=str(e))
        return
    # everything that is not a mesh but has geometry (curves, text, surfaces) → mesh
    bpy.ops.object.select_all(action="DESELECT")
    for ob in list(bpy.context.scene.objects):
        if ob.type in {"CURVE", "SURFACE", "META", "FONT"}:
            ob.select_set(True)
            bpy.context.view_layer.objects.active = ob
    if bpy.context.selected_objects:
        bpy.ops.object.convert(target="MESH")
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        result(ok=False, error="keine Mesh-Objekte in der Datei")
        return
    materials = sorted({s.material.name for o in meshes for s in o.material_slots if s.material})
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=dst,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_extras=False,
    )
    unit = bpy.context.scene.unit_settings
    result(ok=True, objects=len(meshes), materials=materials, scale_length=unit.scale_length, length_unit=unit.length_unit)


main()
