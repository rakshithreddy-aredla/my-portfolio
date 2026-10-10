import bpy
import math
import os

# ===== reset scene =====
bpy.ops.wm.read_factory_settings(use_empty=True)

# ===== PBR materials =====
def make_mat(name, color, roughness=0.5, metallic=0.0, emit=(0,0,0), emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emit != (0,0,0):
            bsdf.inputs["Emission Color"].default_value = (emit[0], emit[1], emit[2], 1)
            bsdf.inputs["Emission Strength"].default_value = emit_strength
    return m

skin       = make_mat("skin", (0.906, 0.698, 0.529), 0.55)
skin_light = make_mat("skin_light", (0.953, 0.824, 0.722), 0.6)
hair_mat   = make_mat("hair", (0.078, 0.063, 0.047), 0.6)
jacket     = make_mat("jacket", (0.141, 0.118, 0.102), 0.55)
shirt      = make_mat("shirt", (0.098, 0.082, 0.071), 0.6)
pants      = make_mat("pants", (0.11, 0.09, 0.08), 0.7)
shoe       = make_mat("shoe", (0.07, 0.06, 0.05), 0.6)
accent     = make_mat("accent", (0.91, 0.416, 0.173), 0.5, emit=(0.91,0.416,0.173), emit_strength=0.5)
iris_mat   = make_mat("iris", (0.42, 0.29, 0.17), 0.35)
pupil_mat  = make_mat("pupil", (0.086, 0.059, 0.039), 0.25)
white      = make_mat("white", (0.96, 0.95, 0.92), 0.25)

def sphere(name, radius, loc, scale=(1,1,1), mat=skin, subsurf=2):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=radius, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if mat:
        obj.data.materials.append(mat)
    if subsurf:
        bpy.ops.object.modifier_add(type='SUBSURF')
        obj.modifiers["Subdivision"].levels = subsurf
        obj.modifiers["Subdivision"].render_levels = subsurf
    return obj

# ===== body (X right, Y forward, Z up) =====
legL = sphere("legL", 0.17, (-0.28, 0, -0.72), (1,1,1.4), pants)
legR = sphere("legR", 0.17, ( 0.28, 0, -0.72), (1,1,1.4), pants)
sphere("footL", 0.16, (-0.28, 0.08, -1.18), (1.3,0.9,0.6), shoe)
sphere("footR", 0.16, ( 0.28, 0.08, -1.18), (1.3,0.9,0.6), shoe)

torso = sphere("torso", 0.9, (0, 0, 0.3), (1.15, 0.8, 1.05), jacket)
sphere("collar", 0.33, (0, 0, 1.02), (1.1,1,0.8), shirt)

bpy.ops.mesh.primitive_cube_add(size=0.05, location=(0, 0.08, 0.3))
zipc = bpy.context.active_object; zipc.name = "zipper"; zipc.scale = (0.4, 0.02, 1.6)
zipc.data.materials.append(accent)

neck = sphere("neck", 0.22, (0, 0, 1.18), (1,1,0.8), skin_light)

# ===== head group (face points -Y = Blender forward) =====
head = bpy.data.objects.new("head", None)
bpy.context.collection.objects.link(head)
head.location = (0, 0, 1.7)

skull = sphere("skull", 0.62, (0, 0, 0.1), (0.92,0.95,0.92), skin, subsurf=3)
skull.parent = head

# optional face texture (best-effort sphere wrap)
img_path = os.path.join(os.path.dirname(__file__), "..", "rakshith.jpg")
if os.path.exists(img_path):
    img = bpy.data.images.load(img_path, check_existing=True)
    skin_tex = bpy.data.materials.new("skin_tex")
    skin_tex.use_nodes = True
    bsdf = skin_tex.node_tree.nodes.get("Principled BSDF")
    tex = skin_tex.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image = img
    skin_tex.node_tree.links.new(bsdf.inputs["Base Color"], tex.outputs["Color"])
    skull.data.materials.clear()
    skull.data.materials.append(skin_tex)

# hair cap (top hemisphere)
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.64, location=(0,0,0.12))
hair = bpy.context.active_object; hair.name = "hair"
hair.scale = (0.94, 0.96, 0.94)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.bisect(plane_co=(0,0,0.18), plane_no=(0,0,-1), clear_inner=False, clear_outer=True)
bpy.ops.object.mode_set(mode='OBJECT')
hair.data.materials.append(hair_mat)
hair.parent = head

earL = sphere("earL", 0.11, (-0.52, 0, 0.1), (0.55,1,0.8), skin); earL.parent = head
earR = sphere("earR", 0.11, ( 0.52, 0, 0.1), (0.55,1,0.8), skin); earR.parent = head

sphere("nose", 0.055, (0, -0.6, 0.08), (1,1.2,0.9), skin_light).parent = head

for side, x in (("L",-0.2), ("R",0.2)):
    s = sphere("sclera_"+side, 0.135, (x, -0.58, 0.12), (1,1.05,0.6), white); s.parent = head
    i = sphere("iris_"+side, 0.062, (x, -0.58, 0.12), (1,1,0.6), iris_mat); i.parent = head
    p = sphere("pupil_"+side, 0.028, (x, -0.58, 0.12), (1,1,0.6), pupil_mat); p.parent = head

bpy.ops.mesh.primitive_cube_add(size=0.05, location=(-0.2, -0.57, 0.3))
browL = bpy.context.active_object; browL.name="browL"; browL.scale=(0.6,0.06,0.15); browL.rotation_euler=(0,0,0.12)
browL.data.materials.append(hair_mat); browL.parent=head
bpy.ops.mesh.primitive_cube_add(size=0.05, location=(0.2, -0.57, 0.3))
browR = bpy.context.active_object; browR.name="browR"; browR.scale=(0.6,0.06,0.15); browR.rotation_euler=(0,0,-0.12)
browR.data.materials.append(hair_mat); browR.parent=head

bpy.ops.curve.primitive_bezier_circle_add(location=(0, -0.56, 0.02))
smile = bpy.context.active_object; smile.name="smile"
smile.scale = (0.16, 0.16, 0.16)
smile.rotation_euler = (math.pi/2, 0, 0)
smile.data.materials.append(accent)
smile.parent = head

# ===== arms (pivot empties at shoulders so waving animates cleanly) =====
def arm(side, x):
    pivot = bpy.data.objects.new("pivot_"+side, None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = (x*0.95, 0, 1.18)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.1, location=(x*0.95, 0, 1.0))
    a = bpy.context.active_object; a.name = "arm_"+side
    a.scale = (1, 1, 1.8)
    a.data.materials.append(jacket)
    a.parent = pivot
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.085, location=(x*0.95 + x*0.2, 0, 0.42))
    h = bpy.context.active_object; h.name = "hand_"+side
    h.data.materials.append(skin)
    h.parent = a
arm("L", -1); arm("R", 1)

# ===== lights =====
bpy.ops.object.light_add(type='SUN', location=(2,4,6))
bpy.context.active_object.data.energy = 3
bpy.ops.object.light_add(type='AREA', location=(0,-2,3))
bpy.context.active_object.data.energy = 250

# ===== export GLB (Y-up for Three.js) =====
out_dir = os.path.join(os.path.dirname(__file__), "..", "assets")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "avatar.glb")
bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_yup=True)
print("EXPORTED:", out_path)
