#!/usr/bin/env python3
"""Writes the banner candidates (B1 round 3) into scripts/banner/concepts/:
D (the Badlands) and E (the wormhole), each as A (black space behind the title)
and B (the phenomenon stretched behind the title). One frame for all four:
a wider left sweep, thin bars, the site URL in the bottom bar."""
import yaml, pathlib

OUT = pathlib.Path(__file__).parent / 'concepts'
URL = 'lcards.unimatrix01.ca'

def bar(area, color, label=None, label_color=None):
    card = {'type': 'custom:lcards-button', 'view_layout': {'grid-area': area}, 'preset': 'panel-light',
            'min_height': 0, 'interactive': False,
            'text': {'label': {'show': False}} if not label else {'label': {'content': label, 'show': True, 'position': 'center-right', 'text_transform': 'none', 'font_size': 16, 'color': label_color}},
            'style': {'card': {'color': {'background': {'default': color}}}}}
    return card

def elbow(area, kind):
    return {'type': 'custom:lcards-elbow', 'view_layout': {'grid-area': area},
            'elbow': {'type': kind, 'segment': {'bar_width': 110, 'bar_height': 20, 'outer_curve': 90, 'inner_curve': 40, 'color': 'var(--lcars-ui-primary)'}}}

def text(area, content, size, color, pos, transform=None):
    label = {'content': content, 'show': True, 'position': pos, 'font_size': size, 'color': color}
    if transform: label['text_transform'] = transform
    return {'type': 'custom:lcards-button', 'view_layout': {'grid-area': area}, 'preset': 'text-only',
            'min_height': 0, 'interactive': False, 'text': {'label': label}}

def scrim():
    """A soft fade behind the title: dark at the left, clear by the scene. A level
    fill at 100% left to right draws its color_a to color_b gradient; under the frame."""
    return {'type': 'custom:lcards-button', 'view_layout': {'grid-area': '1 / 1 / 4 / 3'}, 'preset': 'text-only',
            'min_height': 0, 'interactive': False, 'text': {'label': {'show': False}},
            'background_animation': [{'preset': 'level', 'config': {
                'fill_pct': 100, 'direction': 'right', 'color_a': 'alpha(var(--lcars-text-dark), 0.85)', 'color_b': 'alpha(var(--lcars-text-dark), 0)',
                'gradient_crossover': 50, 'wave_height': 0, 'wave2_height': 0, 'slosh_amount': 0, 'edge_glow': False}}]}

def frame():
    """The chrome, in the theme's own roles: gray bars, the accent bar and the
    title, URL in the theme's highlight colour (--lcars-ui-tertiary)."""
    hi = 'var(--lcars-ui-tertiary)'
    cards = [elbow('corner', 'header-left'), elbow('fcorner', 'footer-left'),
             bar('t1', 'var(--lcars-ui-primary)'), bar('t2', 'var(--lcars-card-bottom-color)'), bar('t3', 'var(--lcars-ui-accent-color)'),
             bar('b1', 'var(--lcars-ui-primary)'), bar('b2', 'var(--lcars-card-bottom-color)', URL, hi), bar('b3', 'var(--lcars-ui-primary)'),
             text('title', 'LCARdS', 88, hi, 'bottom-left', 'none'),
             text('byline', 'LCARS CARDS FOR HOME ASSISTANT', 26, 'var(--lcars-space-white)', 'top-left')]
    return {'type': 'custom:lcards-layout-card', 'view_layout': {'grid-area': '1 / 1 / 4 / 3'},
            'layout': {'grid-gap': '5px',
                       'grid-template-columns': '190px 340px 6px minmax(0, 1fr) 6px 90px',
                       'grid-template-rows': '20px minmax(0, 1fr) minmax(0, 1fr) 20px',
                       'grid-template-areas': '"corner t1 . t2 . t3"\n"corner title . . . ."\n"fcorner byline . . . ."\n"fcorner b1 . b2 . b3"\n'},
            'cards': cards}

def faint_extras(moving=True):
    """Faint things behind the scene: depth dust, and a nebula wash (a background
    effect) so faint gas reaches behind the title too. moving=False holds the gas
    still, for a loop that must end exactly where it starts (a spin)."""
    gas = {'cloud_count': 7, 'colors': ['var(--lcars-deep-navy)', 'var(--lcars-eggplant)', 'var(--lcars-slate)'],
           'min_opacity': 0.25, 'max_opacity': 0.55, 'max_radius': 0.6, 'seed': 11}
    gas.update({'scroll_speed_x': 2, 'scroll_speed_y': 0, 'volumetric': True} if moving else {'scroll_speed_x': 0, 'scroll_speed_y': 0, 'volumetric': False})
    return ({'dust': {'count': 3000, 'opacity': 0.5, 'colors': ['var(--lcards-moonlight)', 'var(--lcars-ice)']}},
            [{'preset': 'nebula', 'config': gas}])

def scene(cid, view, objects, points=(), moving=True, units=None):
    dust, wash = faint_extras(moving)
    return {'type': 'custom:lcards-astrometrics-card', 'view_layout': {'grid-area': 'scene'}, 'id': cid, 'height': 260,
            'camera': {'view': 'banner', 'buttons': False, 'controls': False, 'auto_rotate': 0, 'views': {'banner': view}},
            'backdrop': {'stars': {'count': 3000}, **dust},
            'background_animation': wash,
            'points': list(points), 'objects': objects, **({'units': units} if units else {})}

def banner(scene_card, profile, with_scrim=False, states=None):
    card = {'type': 'custom:lcards-layout-card',
            'layout': {'height': '300px', 'grid-gap': '0px', 'grid-template-columns': '110px minmax(0, 1fr)', 'grid-template-rows': '20px 260px 20px',
                       'grid-template-areas': '". ."\n". scene"\n". ."\n'},
            'cards': [scene_card] + ([scrim()] if with_scrim else []) + [frame()]}
    card = {'banner_profile': profile, **card}
    if states: card = {'banner_states': states, **card}
    return card

# D: the Badlands. A: the nebula on the right; B: a wider nebula reaching behind the title.
badlands = [{'type': 'nebula', 'id': 'badlands', 'at': [0, 0, 0], 'preset': 'badlands'}]
D = {
    'a': scene('banner_badlands', {'target': [-260, 0, 0], 'yaw': 25, 'tilt': 7, 'distance': 520}, badlands),
    'b': scene('banner_badlands', {'target': [-120, 0, 0], 'yaw': 18, 'tilt': 6, 'distance': 430},
               [{**badlands[0], 'size': [900, 160, 500]}]),
}

# E: the wormhole, tilted to show the funnel. A: on the right; B: larger, its disc reaching behind the title.
def wormhole(radius):
    return [
        {'type': 'grid', 'id': 'funnel', 'shape': 'well', 'well': {'shape': 'trumpet', 'throat': 0.07}, 'at': 'mouth', 'face': 'down',
         'radius': radius, 'depth': 7, 'line_width': 0, 'edges': False,
         'fill': {'effect': {'type': 'swirl', 'colors': ['var(--lcards-moonlight)', 'var(--lcards-orange-lightest)', 'var(--lcars-violet)', 'var(--lcards-blue-medium)', 'var(--lcars-violet)', 'var(--lcards-blue-medium-dark)', 'var(--lcards-blue-medium)', 'var(--lcards-blue-dark)'], 'speed': 2.7, 'turbulence': 0.8, 'num_octaves': 5}},
         'deform': [{'type': 'twist', 'angle': 80, 'anchor': 'top', 'period': 6}]},
        {'type': 'galaxy', 'id': 'vortex', 'at': 'mouth', 'face': 'down', 'radius': radius, 'arms': {'count': 4, 'pitch': 20, 'color': 'var(--lcards-blue-light)'},
         'bar': {'length': 0}, 'thickness': 0.02, 'stars': {'count': 8000}, 'seed': 4, 'glow': 0, 'dust': {'amount': 0}, 'core': {'color': 'var(--lcards-moonlight)'}, 'spin': 15},
        {'type': 'glow', 'id': 'heart', 'at': 'mouth', 'color': 'var(--lcards-orange-lightest)', 'size': radius * 0.55},
    ]
mouth = [{'id': 'mouth', 'xyz': [0, 0, 0]}, {'id': 'down', 'at': 'mouth', 'offset': [0, -1000, 0]}]
E = {
    'a': scene('banner_wormhole', {'target': [-14, -2, 0], 'yaw': 15, 'tilt': 20, 'distance': 30}, wormhole(11), mouth),
    'b': scene('banner_wormhole', {'target': [-6, -2, 0], 'yaw': 15, 'tilt': 20, 'distance': 27}, wormhole(17), mouth),
}

PROFILES = {'red': 'LCARS Picard [LCARdS Red Accent]', 'blue': 'LCARS Picard [LCARdS Blue Accent]'}
for name, variants in (('d-badlands', D), ('e-wormhole', E)):
    for v, sc in variants.items():
        for tone, profile in PROFILES.items():
            path = OUT / f'{name}-{v}-{tone}.yaml'
            card = banner(sc, profile, with_scrim=(name == 'd-badlands' and v == 'b'))
            path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n' + yaml.safe_dump(card, sort_keys=False, width=200))
            print(path)

# Dev-board views (the user reviews the banners in Home Assistant): one view per
# profile, the view's theme set to that profile, the four banners at banner size.
DEMO = pathlib.Path(__file__).parents[2] / 'demo' / 'views'
for tone, profile in PROFILES.items():
    cards = []
    for name, variants in (('d-badlands', D), ('e-wormhole', E)):
        for v, sc in variants.items():
            card = banner(sc, profile, with_scrim=(name == 'd-badlands' and v == 'b'))
            card.pop('banner_profile', None)
            card.pop('banner_states', None)
            # each scene card needs its own id on one view
            card['cards'][0] = {**card['cards'][0], 'id': f"{card['cards'][0]['id']}_{v}"}
            cards.append(card)
    view = {'title': f'B1 banners {tone}', 'path': f'b1-banners-{tone}', 'theme': profile,
            'type': 'custom:lcards-layout-view',
            'layout': {'padding': '16px', 'grid-gap': '16px', 'grid-template-columns': '1200px', 'grid-template-rows': 'repeat(4, 300px)'},
            'cards': cards}
    path = DEMO / f'b1-banners-{tone}.yaml'
    path.write_text(f'# B1 banner candidates in the {profile} theme (D Badlands a/b, E wormhole a/b).\n'
                    '# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n'
                    + yaml.safe_dump(view, sort_keys=False, width=200))
    print(path)

# Animated wormhole (E b, Blue Accent first): closed, bursts open and spins, snaps shut.
# The sizes follow input_number.banner_aperture (0..100) with a short glide; a flash
# glow (banner_flash) fires as it opens. render.mjs --capture runs banner_timeline.
def aperture(max_value, smooth=650, low=None):
    return {'entity': 'input_number.banner_aperture', 'input': [0, 100], 'output': [max_value * 0.12 if low is None else low, max_value], 'smooth': smooth}

def wormhole_anim(radius):
    """Opens like the canon wormhole: the centre stays put. The funnel keeps its
    full size and only fades in and out (scaling it moved the throat in space);
    the flat spiral disc grows from the centre, the core glow with it, and a
    flash fires as it opens and as it shuts."""
    objs = wormhole(radius)
    objs[0]['opacity'] = aperture(1, smooth=900, low=0)            # funnel: fixed size, fades
    objs[1]['radius'] = aperture(radius, smooth=700)               # spiral disc: grows from the centre
    objs[1]['opacity'] = aperture(1, smooth=500, low=0)
    objs[2]['size'] = aperture(radius * 0.55, smooth=600)          # core glow
    objs[2]['opacity'] = aperture(1, smooth=400, low=0)
    # a fast spin as it bursts open, settling to its normal speed
    objs[1]['spin'] = {'entity': 'input_number.banner_spin', 'input': [0, 100], 'output': [15, 90], 'smooth': 1100}
    objs.append({'type': 'glow', 'id': 'flash', 'at': 'mouth', 'color': 'var(--lcards-blue-lightest)',
                 'size': {'entity': 'input_number.banner_flash', 'input': [0, 100], 'output': [0, radius * 0.8], 'smooth': 220}})
    return objs

anim_scene = scene('banner_wormhole', {'target': [-6, -2, 0], 'yaw': 15, 'tilt': 20, 'distance': 27}, wormhole_anim(17), mouth)
# built fully open (its true shape), closed after mounting, opened on cue
anim = banner(anim_scene, PROFILES['blue'], states={'input_number.banner_aperture': 100, 'input_number.banner_flash': 100, 'input_number.banner_spin': 0})
anim['banner_after_mount'] = {'input_number.banner_aperture': 0, 'input_number.banner_flash': 0}
anim['banner_timeline'] = [
    # a flash at the centre, then the swirl blooms out of it with a fast spin
    {'at': 1300, 'states': {'input_number.banner_flash': 100}},
    {'at': 1550, 'states': {'input_number.banner_aperture': 100, 'input_number.banner_spin': 100}},
    {'at': 1750, 'states': {'input_number.banner_flash': 0}},
    {'at': 2100, 'states': {'input_number.banner_spin': 0}},
    # it pulls back into the centre and ends in a flash
    {'at': 7400, 'states': {'input_number.banner_aperture': 0}},
    {'at': 7900, 'states': {'input_number.banner_flash': 70}},
    {'at': 8150, 'states': {'input_number.banner_flash': 0}},
]
path = OUT / 'e-wormhole-b-blue-anim.yaml'
path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n' + yaml.safe_dump(anim, sort_keys=False, width=200))
print(path)

# Animated Badlands (D a, Blue Accent first): the camera drifts slowly round the
# nebula while the gas and fire columns move; encode-gif.mjs --crossfade loops it.
bad_anim = scene('banner_badlands', {'target': [-260, 0, 0], 'yaw': 25, 'tilt': 7, 'distance': 520}, badlands)
bad_anim['camera']['auto_rotate'] = 1.2
path = OUT / 'd-badlands-a-blue-anim.yaml'
path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n'
                + yaml.safe_dump(banner(bad_anim, PROFILES['blue']), sort_keys=False, width=200))
print(path)

# The other two (blue first): Badlands B (drifting, the fade behind the title) and
# wormhole A (the same open, spin and shut at its smaller size, on the right).
bad_b_anim = scene('banner_badlands', {'target': [-120, 0, 0], 'yaw': 18, 'tilt': 6, 'distance': 430}, [{**badlands[0], 'size': [900, 160, 500]}])
bad_b_anim['camera']['auto_rotate'] = 1.2
path = OUT / 'd-badlands-b-blue-anim.yaml'
path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n'
                + yaml.safe_dump(banner(bad_b_anim, PROFILES['blue'], with_scrim=True), sort_keys=False, width=200))
print(path)

worm_a_scene = scene('banner_wormhole', {'target': [-14, -2, 0], 'yaw': 15, 'tilt': 20, 'distance': 30}, wormhole_anim(11), mouth)
worm_a = banner(worm_a_scene, PROFILES['blue'], states={'input_number.banner_aperture': 100, 'input_number.banner_flash': 100, 'input_number.banner_spin': 0})
worm_a['banner_after_mount'] = {'input_number.banner_aperture': 0, 'input_number.banner_flash': 0}
worm_a['banner_timeline'] = anim['banner_timeline']
path = OUT / 'e-wormhole-a-blue-anim.yaml'
path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n' + yaml.safe_dump(worm_a, sort_keys=False, width=200))
print(path)

# Crystalline entity (blue): close in on the entity, spinning one full turn per loop
# (30 deg/s over 12 s), the gas held still, so the last frame meets the first.
cryst_scene = scene('banner_crystalline', {'target': [-1.25, -0.12, 0], 'yaw': 20, 'tilt': 12, 'distance': 3.6},
                    [{'type': 'crystalline', 'id': 'entity', 'at': 'core', 'spin': 30, 'core': {'period': 0}}],
                    [{'id': 'core', 'xyz': [0, 0, 0]}], moving=False, units='km')
path = OUT / 'f-crystalline-blue-anim.yaml'
path.write_text('# Generated by scripts/banner/make-concepts.py: edit the script, not this file.\n'
                + yaml.safe_dump(banner(cryst_scene, PROFILES['blue']), sort_keys=False, width=200))
print(path)
