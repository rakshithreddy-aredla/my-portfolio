import bpy
import os
import numpy as np

# ============================================================
# Bas-relief "sculpture" generator:
# converts a photo's luminance into real 3D depth on a curved
# plaque, adds a pedestal, exports a GLB for the web.
# ============================================================

SCRIPT_DIR = os.path.dirname(__file__)
IMG_PATH = os.path.join(SCRIPT_DIR, "..", "rakshith.jpg")
OUT_PATH = os.path.join(SCRIPT_DIR, "..", "assets", "face-relief.glb")

DEPTH = 0.34        # relief strength
CURVE = 0.32        # plaque curvature (edges recede)
N = 200             # grid resolution (N x N)

# ===== reset scene =====
bpy.ops.wm.read_factory_settings(use_empty=True)

# ===== load photo =====
img = bpy.data.images.load(IMG_PATH)
img.colorspace_settings.name = 'sRGB'
W, H = img.size
buf = np.empty(W * H * 4, dtype=np.float32)
img.pixels.foreach_get(buf)
px = buf.reshape(H, W, 4)  # row 0 = bottom of image

def luminance(u, v):
    # u,v in [0,1]; v=0 bottom
    xi = min(W - 1, max(0, int(u * (W - 1))))
    yi = min(H - 1, max(0, int(v * (H - 1))))
    r, g, b = px[yi, xi, 0], px[yi, xi, 1], px[yi, xi, 2]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

# ===== build relief grid =====
# Blender: X = width, Z = up, Y = depth. Front (viewer after Y-up export) = -Y.
verts = []
for j in range(N):
    v = j / (N - 1)
    z = v * 2.0 - 1.0            # -1 bottom .. +1 top (image upright)
    for i in range(N):
        u = i / (N - 1)
        x = u * 2.0 - 1.0        # -1 left .. +1 right
        lum = luminance(u, v)
        # boost contrast slightly
        lum = min(1.0, max(0.0, (lum - 0.12) / 0.76))
        y = CURVE * (x * x) - DEPTH * lum   # edges recede (+Y), relief protrudes (-Y)
        verts.append((x, y, z))

faces = []
for j in range(N - 1):
    for i in range(N - 1):
        a = j * N + i
        b = j * N + i + 1
        c = (j + 1) * N + i + 1
        d = (j + 1) * N + i
        faces.append((a, b, c, d))

mesh = bpy.data.meshes.new("relief")
mesh.from_pydata(verts, [], faces)
mesh.validate()
mesh.update()

obj = bpy.data.objects.new("relief", mesh)
bpy.context.collection.objects.link(obj)

# smooth shading
for p in mesh.polygons:
    p.use_smooth = True

# UVs = photo mapped straight onto the plaque
uv = mesh.uv_layers.new(name="UVMap")
for loop in mesh.loops:
    vi = loop.vertex_index
    vx, _, vz = verts[vi]
    uv.data[loop.index].uv = ((vx + 1.0) / 2.0, (vz + 1.0) / 2.0)

# material: the photo itself, slightly glossy like polished stone
mat = bpy.data.materials.new("photo_relief")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = img
mat.node_tree.links.new(bsdf.inputs["Base Color"], tex.outputs["Color"])
bsdf.inputs["Roughness"].default_value = 0.55
obj.data.materials.append(mat)

# give the plaque real thickness
sol = obj.modifiers.new("Solidify", 'SOLIDIFY')
sol.thickness = 0.14
sol.offset = -1.0  # thickness goes backward (+Y), face stays clean

# ===== pedestal =====
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.25, -1.42))
ped = bpy.context.active_object
ped.name = "pedestal"
ped.scale = (2.7, 0.7, 0.5)
stone = bpy.data.materials.new("stone")
stone.use_nodes = True
sbsdf = stone.node_tree.nodes.get("Principled BSDF")
sbsdf.inputs["Base Color"].default_value = (0.055, 0.045, 0.05, 1)
sbsdf.inputs["Roughness"].default_value = 0.4
sbsdf.inputs["Metallic"].default_value = 0.2
ped.data.materials.append(stone)

# accent strip on the pedestal (violet glow)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.08, -1.2))
strip = bpy.context.active_object
strip.name = "strip"
strip.scale = (2.7, 0.04, 0.06)
glow = bpy.data.materials.new("glowstrip")
glow.use_nodes = True
gbsdf = glow.node_tree.nodes.get("Principled BSDF")
gbsdf.inputs["Base Color"].default_value = (0.486, 0.36, 1.0, 1)
gbsdf.inputs["Emission Color"].default_value = (0.486, 0.36, 1.0, 1)
gbsdf.inputs["Emission Strength"].default_value = 2.0
strip.data.materials.append(glow)

# ===== apply solidify so the GLB contains real geometry =====
bpy.context.view_layer.objects.active = obj
bpy.ops.object.modifier_apply(modifier="Solidify")

# ===== export =====
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT_PATH, export_format='GLB', export_yup=True)
print("EXPORTED:", OUT_PATH)
