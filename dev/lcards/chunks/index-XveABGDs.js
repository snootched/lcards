var H=Object.defineProperty;var h=(a,o)=>H(a,"name",{value:o,configurable:true});import{bs as V,bt as U,bu as W}from"./lcards-main-C10Twmlb.js";const F=`<?xml version="1.0" encoding="UTF-8"?>
<svg width="80mm" height="80mm" version="1.1" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <cc:Work rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
        <dc:title>LCARdS D-Pad Interactive Component</dc:title>
        <dc:description>9-segment interactive D-pad control for remote/media control</dc:description>
      </cc:Work>
    </rdf:RDF>
  </metadata>

  <!-- Background -->

  <!--
  <rect id="background" width="80" height="80" fill="#1a1a2e" />
  -->
  <rect id="background" width="80" height="80" fill="none" />

  <!-- Diagonal Corner Segments -->
  <path id="up-left" d="m33 33v-32.35c-15.992 2.4474-29.977 16.417-32.424 32.35z" />
  <path id="up-right" d="m47 33v-32.35c15.992 2.4474 29.977 16.417 32.424 32.35z" />
  <path id="down-left" d="m33 47v32.35c-15.992-2.4474-29.977-16.417-32.424-32.35z" />
  <path id="down-right" d="m47 47v32.35c15.992-2.4474 29.977-16.417 32.424-32.35z" />

  <!-- Directional Arrows -->
  <path id="up" d="m34 10h12v-9.5c-3.8785-0.47437-8.044-0.4824-12 0z" />
  <path id="down" d="m46 70h-12v9.5c3.8785 0.47437 8.044 0.4824 12 0z" />
  <path id="left" d="m10 46v-12h-9.5c-0.47437 3.8785-0.4824 8.044 0 12z" />
  <path id="right" d="m70 34v12h9.5c0.47437-3.8785 0.4824-8.044 0-12z" />

  <!-- Center Button (plus shape) -->
  <path id="center" d="m11 34v12h23v23h12v-23h23v-12h-23v-23h-12v23z" />

  <!-- Decorative Lines (optional - can be styled or hidden) -->
  <g id="decorative-lines" opacity="0.3">
    <path d="m34 13.49h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 16.2h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 19.48h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 27.9h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m34 59h12" stroke="#000" stroke-width="0.75" fill="none"/>
    <path d="m44.2 2.199v5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m2.199 35.8h5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m77.801 44.2h-5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
    <path d="m35.8 77.801v-5.0271" stroke="#000" stroke-width="1.2" fill="none"/>
  </g>
</svg>`,G={dpad:{svg:F,orientation:"square",features:["multi-segment","state-based-styling","zones","text-overlay"],zones:{up:{x:34,y:.5,width:12,height:9.5},down:{x:34,y:70,width:12,height:9.5},left:{x:.5,y:34,width:9.5,height:12},right:{x:70,y:34,width:9.5,height:12},center:{x:10,y:10,width:60,height:60},up_left:{x:0,y:0,width:33,height:33},up_right:{x:47,y:0,width:33,height:33},down_left:{x:0,y:47,width:33,height:33},down_right:{x:47,y:47,width:33,height:33}},segments:{up:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},down:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},left:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},right:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},"up-left":{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},"up-right":{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},"down-left":{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},"down-right":{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},center:{style:{fill:"theme:components.dpad.segment.center.fill",stroke:"theme:components.dpad.segment.center.stroke","stroke-width":"theme:components.dpad.segment.center.stroke-width"}}},presets:{default:{}},validatePreset(a){return a in this.presets},getPresetNames(){return Object.keys(this.presets)},metadata:{type:"dpad",card_type:"button",pack:"lcards_buttons",id:"dpad",name:"D-Pad Control",description:"Interactive directional control with 9 segments",version:"1.0.0",examples:{basic:{description:"Basic media player control",config:{component:"dpad",entity:"media_player.living_room",dpad:{segments:{up:{tap_action:{action:"call-service",service:"media_player.volume_up"}},down:{tap_action:{action:"call-service",service:"media_player.volume_down"}},left:{tap_action:{action:"call-service",service:"media_player.media_previous_track"}},right:{tap_action:{action:"call-service",service:"media_player.media_next_track"}},center:{tap_action:{action:"call-service",service:"media_player.media_play_pause"}}}}}},advanced:{description:"Remote control with full directional navigation",config:{component:"dpad",entity:"remote.roku",dpad:{segments:{up:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"up"}}},down:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"down"}}},left:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"left"}}},right:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"right"}}},center:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"select"}}},"up-left":{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"home"}}},"up-right":{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"back"}}}}}}}}}}},q=`<?xml version="1.0" encoding="UTF-8"?>
<svg width="209.478mm" height="215.106mm" version="1.1" viewBox="0 0 209.47815 215.10629" xmlns="http://www.w3.org/2000/svg">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <cc:Work rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
        <dc:title>LCARdS D-Pad Interactive Component (Voyager Style)</dc:title>
        <dc:description>56-segment interactive Voyager-style D-pad control for remote/media control</dc:description>
      </cc:Work>
    </rdf:RDF>
  </metadata>

  <!-- Background -->
  <rect id="background" width="209.47815" height="215.10629" fill="none" />

  <!-- Diagonal Corner Quadrants -->
  <path id="up_left" d="M 52.401,113.318 L 52.401,112.921 L 53.107,110.204 L 53.812,107.488 L 54.698,105.247 L 55.584,103.005 L 56.969,100.365 L 58.353,97.725 L 60.198,95.082 L 62.043,92.438 L 64.181,89.994 L 66.319,87.551 L 69.285,84.991 L 72.25,82.431 L 74.677,80.819 L 77.105,79.208 L 79.998,77.765 L 82.891,76.323 L 84.853,75.581 L 86.815,74.84 L 89.528,74.145 L 92.241,73.451 L 92.456,73.449 L 92.67,73.447 L 92.67,93.581 L 92.67,113.716 L 72.535,113.716 L 52.4,113.716 L 52.401,113.318" />
  <path id="up_right" d="M 112.661,93.575 L 112.661,73.435 L 113.447,73.614 L 114.232,73.793 L 116.517,74.355 L 118.802,74.918 L 121.661,76.033 L 124.52,77.149 L 127.087,78.615 L 129.654,80.081 L 131.939,81.671 L 134.224,83.261 L 137.307,86.136 L 140.389,89.011 L 142.426,91.438 L 144.463,93.866 L 146.043,96.286 L 147.623,98.706 L 148.954,101.427 L 150.285,104.147 L 151.03,106.219 L 151.776,108.29 L 152.353,110.55 L 152.93,112.811 L 152.93,113.263 L 152.93,113.715 L 132.796,113.715 L 112.661,113.715 L 112.661,93.575" />
  <path id="down_left" d="M 90.242,173.637 L 89.1,173.358 L 86.387,172.485 L 83.674,171.611 L 81.103,170.416 L 78.533,169.221 L 76.116,167.719 L 73.7,166.218 L 71.404,164.419 L 69.108,162.62 L 66.332,159.859 L 63.556,157.099 L 61.443,154.293 L 59.329,151.488 L 57.735,148.666 L 56.141,145.844 L 54.998,142.988 L 53.856,140.132 L 53.129,137.419 L 52.402,134.706 L 52.402,134.206 L 52.401,133.707 L 72.535,133.707 L 92.67,133.707 L 92.67,153.841 L 92.67,173.975 L 92.027,173.946 L 91.385,173.916 L 90.242,173.637" />
  <path id="down_right" d="M 112.661,153.866 L 112.661,133.707 L 132.828,133.707 L 152.995,133.707 L 152.8,135.008 L 152.605,136.31 L 151.941,138.507 L 151.278,140.704 L 150.573,142.56 L 149.868,144.416 L 148.806,146.524 L 147.745,148.632 L 146.245,150.951 L 144.745,153.27 L 143.005,155.427 L 141.265,157.584 L 139.03,159.877 L 136.794,162.171 L 134.31,164.146 L 131.826,166.122 L 129.394,167.648 L 126.963,169.174 L 123.867,170.556 L 120.77,171.938 L 117.93,172.779 L 115.089,173.62 L 113.875,173.823 L 112.661,174.026 L 112.661,153.866" />

  <!-- Center Button -->
  <path id="center" d="M 95.811,123.854 L 95.811,116.856 L 102.808,116.856 L 109.805,116.856 L 109.805,123.854 L 109.805,130.851 L 102.808,130.851 L 95.811,130.851 L 95.811,123.854" />

  <!-- Up Arm (centre → edge) -->
  <path id="up_inner" d="M 95.811,110.716 L 95.811,107.717 L 102.666,107.717 L 109.52,107.717 L 109.52,110.716 L 109.52,113.715 L 102.666,113.715 L 95.811,113.715 L 95.811,110.716" />
  <path id="up_shaft" d="M 95.811,102.005 L 95.811,98.007 L 102.665,98.007 L 109.52,98.007 L 109.52,102.005 L 109.52,106.004 L 102.665,106.004 L 95.811,106.004 L 95.811,102.005" />
  <path id="up_seam" d="M 95.811,94.004 L 95.811,91.714 L 102.737,91.79 L 109.662,91.867 L 109.746,94.08 L 109.829,96.293 L 102.82,96.293 L 95.811,96.293 L 95.811,94.004" />
  <path id="up_arrow" d="M 99.578,87.387 L 101.99,84.765 L 102.419,84.494 L 102.848,84.224 L 104.278,85.76 L 105.708,87.297 L 106.936,88.654 L 108.164,90.01 L 102.665,90.01 L 97.165,90.01 L 99.578,87.387" />
  <path id="up_outer" d="M 95.811,77.762 L 95.811,72.93 L 98.881,72.72 L 101.951,72.51 L 105.654,72.696 L 109.357,72.883 L 109.588,73.115 L 109.82,73.347 L 109.741,77.894 L 109.662,82.442 L 102.736,82.519 L 95.811,82.595 L 95.811,77.762" />
  <path id="up_ring" d="M 95.669,69.733 L 95.582,69.59 L 93.825,58.777 L 92.067,47.964 L 92.154,47.884 L 92.241,47.805 L 97.557,47.475 L 102.874,47.145 L 107.982,47.478 L 113.089,47.811 L 113.173,47.884 L 113.257,47.957 L 111.541,58.74 L 109.825,69.523 L 109.705,69.643 L 109.586,69.762 L 102.671,69.819 L 95.756,69.876 L 95.669,69.733" />

  <!-- Down Arm (centre → edge) -->
  <path id="down_shaft" d="M 95.811,144.702 L 95.811,133.707 L 102.666,133.707 L 109.52,133.707 L 109.52,144.702 L 109.52,155.697 L 102.666,155.697 L 95.811,155.697 L 95.811,144.702" />
  <path id="down_arrow" d="M 99.824,160.553 L 97.188,157.697 L 102.7,157.697 L 108.211,157.697 L 106.94,159.053 L 105.668,160.41 L 104.248,161.909 L 102.828,163.408 L 102.643,163.408 L 102.459,163.408 L 99.824,160.553" />
  <path id="down_outer" d="M 98.167,174.921 L 95.811,174.809 L 95.811,169.96 L 95.811,165.112 L 102.737,165.188 L 109.663,165.265 L 109.742,169.813 L 109.821,174.361 L 109.599,174.569 L 109.377,174.778 L 104.95,174.906 L 100.524,175.033 L 98.167,174.921" />
  <path id="down_ring" d="M 95.3,199.958 L 92.36,199.75 L 92.285,199.643 L 92.21,199.536 L 93.913,188.669 L 95.616,177.801 L 102.711,177.801 L 109.806,177.801 L 109.806,178.102 L 109.806,178.402 L 111.522,188.943 L 113.239,199.483 L 113.1,199.622 L 112.961,199.76 L 109.598,199.987 L 106.236,200.214 L 102.237,200.19 L 98.239,200.166 L 95.3,199.958" />

  <!-- Left Arm (centre → edge) -->
  <path id="left_shaft" d="M 70.679,123.711 L 70.679,116.856 L 81.674,116.856 L 92.67,116.856 L 92.67,123.711 L 92.67,130.565 L 81.674,130.565 L 70.679,130.565 L 70.679,123.711" />
  <path id="left_arrow" d="M 65.706,126.485 L 62.874,123.837 L 65.647,121.275 L 68.42,118.713 L 68.692,118.617 L 68.965,118.522 L 68.965,123.83 L 68.965,129.137 L 68.751,129.135 L 68.537,129.133 L 65.706,126.485" />
  <path id="left_outer" d="M 51.678,129.953 L 51.481,129.055 L 51.462,124.455 L 51.444,119.855 L 51.664,118.356 L 51.883,116.856 L 56.569,116.856 L 61.254,116.856 L 61.254,123.854 L 61.254,130.851 L 56.565,130.851 L 51.875,130.851 L 51.678,129.953" />
  <path id="left_ring" d="M 26.455,130.779 L 26.12,127.281 L 26.13,123.14 L 26.141,118.998 L 26.416,116.169 L 26.691,113.34 L 26.766,113.268 L 26.84,113.196 L 37.55,115.018 L 48.26,116.841 L 48.403,116.849 L 48.545,116.857 L 48.596,123.854 L 48.647,130.85 L 48.025,130.989 L 47.403,131.127 L 37.632,132.703 L 27.86,134.278 L 27.325,134.278 L 26.791,134.278 L 26.455,130.779" />

  <!-- Right Arm (centre → edge) -->
  <path id="right_shaft" d="M 112.661,123.711 L 112.661,116.856 L 123.657,116.856 L 134.652,116.856 L 134.652,123.711 L 134.652,130.565 L 123.657,130.565 L 112.661,130.565 L 112.661,123.711" />
  <path id="right_arrow" d="M 136.366,123.715 L 136.366,118.246 L 137.151,118.815 L 137.937,119.385 L 140.173,121.649 L 142.41,123.913 L 139.661,126.454 L 136.912,128.994 L 136.639,129.09 L 136.366,129.185 L 136.366,123.715" />
  <path id="right_outer" d="M 144.077,123.854 L 144.077,116.856 L 148.77,116.856 L 153.463,116.856 L 153.668,117.499 L 153.873,118.142 L 153.873,124.167 L 153.874,130.193 L 153.671,130.522 L 153.468,130.851 L 148.772,130.851 L 144.077,130.851 L 144.077,123.854" />
  <path id="right_ring" d="M 167.353,132.549 L 157.071,130.882 L 156.907,130.866 L 156.742,130.851 L 156.737,123.858 L 156.732,116.866 L 157.616,116.711 L 158.5,116.557 L 168.475,114.986 L 178.449,113.415 L 178.663,113.636 L 178.877,113.858 L 179.175,118.444 L 179.473,123.03 L 179.199,128.011 L 178.925,132.993 L 178.774,133.635 L 178.624,134.278 L 178.13,134.247 L 177.635,134.216 L 167.353,132.549" />

  <!-- Ring Band — Up sector -->
  <path id="ring_up_1" d="M 79.115,74.32 L 78.949,74.053 L 74.1,64.589 L 69.251,55.126 L 69.251,54.849 L 69.251,54.573 L 71.178,53.701 L 73.106,52.828 L 76.462,51.566 L 79.818,50.304 L 83.226,49.472 L 86.633,48.64 L 87.925,48.446 L 89.216,48.253 L 89.366,48.926 L 89.516,49.599 L 91.1,59.991 L 92.685,70.384 L 92.606,70.449 L 92.527,70.515 L 90.242,70.998 L 87.957,71.48 L 85.244,72.355 L 82.531,73.231 L 80.996,73.909 L 79.461,74.588 L 79.371,74.588 L 79.28,74.588 L 79.115,74.32" />
  <path id="ring_up_2" d="M 122.85,73.399 L 120.044,72.272 L 116.424,71.374 L 112.804,70.476 L 112.713,70.419 L 112.622,70.361 L 114.208,60.265 L 115.794,50.17 L 115.954,49.242 L 116.114,48.313 L 116.567,48.313 L 117.019,48.313 L 120.338,49.048 L 123.656,49.783 L 127.512,51.059 L 131.368,52.335 L 133.838,53.537 L 136.309,54.739 L 131.218,64.585 L 126.126,74.431 L 125.891,74.478 L 125.656,74.526 L 122.85,73.399" />
  <path id="ring_up_3" d="M 65.029,46.73 L 62.382,41.426 L 65.316,40.045 L 68.251,38.664 L 71.821,37.376 L 75.391,36.088 L 78.961,35.2 L 82.531,34.313 L 84.605,33.92 L 86.678,33.528 L 86.831,33.775 L 86.984,34.022 L 87.828,39.354 L 88.671,44.686 L 88.671,45.052 L 88.671,45.417 L 87.029,45.742 L 85.387,46.067 L 82.476,46.752 L 79.566,47.437 L 76.505,48.472 L 73.445,49.507 L 70.848,50.647 L 68.251,51.787 L 67.964,51.91 L 67.676,52.034 L 65.029,46.73" />
  <path id="ring_up_4" d="M 135.722,51.292 L 134.365,50.587 L 131.228,49.302 L 128.091,48.017 L 124.731,47.051 L 121.372,46.085 L 118.933,45.601 L 116.494,45.118 L 117.505,39.303 L 118.516,33.489 L 118.735,33.444 L 118.954,33.399 L 120.305,33.601 L 121.657,33.803 L 124.799,34.618 L 127.94,35.433 L 131.295,36.591 L 134.65,37.748 L 138.569,39.467 L 142.489,41.185 L 142.7,41.396 L 142.91,41.607 L 140.255,46.73 L 137.6,51.853 L 137.34,51.925 L 137.079,51.998 L 135.722,51.292" />
  <path id="ring_up_5" d="M 89.719,33.107 L 87.776,21.325 L 87.633,20.825 L 87.49,20.325 L 102.36,20.325 L 117.231,20.325 L 117.229,20.968 L 117.227,21.61 L 116.804,25.037 L 116.382,28.465 L 115.027,36.681 L 113.671,44.898 L 111.524,44.678 L 109.377,44.458 L 102.809,44.458 L 96.24,44.458 L 93.951,44.673 L 91.662,44.888 L 89.719,33.107" />

  <!-- Ring Band — Up-Right sector -->
  <path id="ring_upright_1" d="M 148.578,94.794 L 146.674,91.867 L 144.484,89.331 L 142.295,86.796 L 150.28,78.81 L 158.266,70.824 L 160.814,73.777 L 163.361,76.73 L 165.521,79.729 L 167.682,82.728 L 169.055,85.103 L 170.428,87.478 L 170.175,87.71 L 169.923,87.941 L 160.365,92.831 L 150.808,97.721 L 150.645,97.721 L 150.483,97.721 L 148.578,94.794" />
  <path id="ring_upright_2" d="M 137.936,82.709 L 136.508,81.428 L 134.509,79.911 L 132.51,78.393 L 130.588,77.276 L 128.665,76.159 L 128.66,75.964 L 128.655,75.769 L 131.38,70.583 L 134.104,65.398 L 136.41,60.782 L 138.716,56.167 L 138.809,56.066 L 138.902,55.965 L 141.418,57.481 L 143.935,58.996 L 146.332,60.695 L 148.729,62.394 L 151.293,64.564 L 153.858,66.734 L 154.751,67.508 L 155.644,68.281 L 147.792,76.147 L 139.94,84.013 L 139.653,84.002 L 139.365,83.991 L 137.936,82.709" />
  <path id="ring_upright_3" d="M 154.644,63.811 L 151.93,61.354 L 148.996,59.167 L 146.061,56.981 L 143.07,55.177 L 140.078,53.372 L 140.078,53.096 L 140.078,52.819 L 142.714,47.853 L 145.35,42.887 L 145.602,42.887 L 145.854,42.887 L 148.321,44.367 L 150.788,45.847 L 153.285,47.514 L 155.781,49.182 L 158.568,51.427 L 161.355,53.673 L 163.755,55.928 L 166.156,58.183 L 161.965,62.173 L 157.774,66.163 L 157.565,66.215 L 157.357,66.268 L 154.644,63.811" />
  <path id="ring_upright_4" d="M 171.351,83.383 L 169.637,80.487 L 167.175,77.181 L 164.713,73.874 L 162.409,71.304 L 160.104,68.733 L 170.244,58.595 L 180.384,48.456 L 181.814,50.027 L 183.245,51.598 L 185.901,54.739 L 188.558,57.881 L 191.008,61.244 L 193.459,64.607 L 195.076,67.221 L 196.693,69.835 L 197.65,71.576 L 198.606,73.316 L 185.909,79.807 L 173.211,86.298 L 173.138,86.289 L 173.064,86.28 L 171.351,83.383" />

  <!-- Ring Band — Up-Left sector -->
  <path id="ring_upleft_1" d="M 57.278,76.467 L 49.45,68.635 L 51.07,67.155 L 52.689,65.675 L 55.044,63.754 L 57.398,61.833 L 59.683,60.241 L 61.968,58.649 L 64.214,57.322 L 66.461,55.995 L 66.526,56.081 L 66.592,56.167 L 71.635,66.138 L 76.678,76.109 L 76.606,76.159 L 76.533,76.209 L 74.946,77.102 L 73.358,77.995 L 71.376,79.476 L 69.393,80.957 L 67.513,82.628 L 65.632,84.298 L 65.369,84.298 L 65.106,84.298 L 57.278,76.467" />
  <path id="ring_upleft_2" d="M 27.168,83.724 L 22.356,81.214 L 22.062,80.92 L 21.768,80.626 L 23.129,78.25 L 24.49,75.873 L 26.354,73.16 L 28.219,70.447 L 30.419,67.726 L 32.62,65.004 L 34.847,62.637 L 37.075,60.269 L 41.168,64.355 L 45.261,68.44 L 45.261,68.692 L 45.261,68.944 L 42.734,71.695 L 40.207,74.445 L 36.977,78.648 L 34.675,82.473 L 32.374,86.298 L 32.177,86.265 L 31.98,86.233 L 27.168,83.724" />

  <!-- Ring Band — Left sector -->
  <path id="ring_left_1" d="M 37.744,112 L 27.514,110.343 L 27.357,110.186 L 27.2,110.029 L 27.938,106.348 L 28.677,102.668 L 29.68,99.608 L 30.682,96.548 L 32.007,93.493 L 33.331,90.439 L 33.408,90.354 L 33.484,90.268 L 43.482,95.359 L 53.479,100.45 L 52.355,103.15 L 51.231,105.851 L 50.414,108.998 L 49.597,112.144 L 49.423,112.93 L 49.248,113.715 L 48.611,113.686 L 47.974,113.657 L 37.744,112" />
  <path id="ring_left_2" d="M 11.275,127.367 L 11.275,117.886 L 11.59,114.587 L 11.905,111.287 L 12.113,111.064 L 12.322,110.84 L 18.01,111.791 L 23.699,112.742 L 23.632,113.728 L 23.565,114.714 L 23.381,121.915 L 23.197,129.117 L 23.543,131.864 L 23.889,134.611 L 23.75,134.75 L 23.61,134.89 L 17.681,135.869 L 11.751,136.848 L 11.513,136.848 L 11.275,136.848 L 11.275,127.367" />
  <path id="ring_left_3" d="M 18.137,108.949 L 12.576,107.971 L 12.48,107.875 L 12.384,107.779 L 12.98,104.624 L 13.575,101.468 L 14.712,97.581 L 15.849,93.693 L 17.114,90.495 L 18.38,87.297 L 19.143,85.632 L 19.906,83.967 L 20.525,84.122 L 21.144,84.278 L 25.912,86.583 L 30.68,88.888 L 30.148,90.234 L 29.616,91.581 L 28.45,94.38 L 27.284,97.18 L 26.718,99.093 L 26.152,101.006 L 25.416,104.433 L 24.679,107.86 L 24.392,108.931 L 24.105,110.002 L 23.902,109.964 L 23.699,109.926 L 18.137,108.949" />

  <!-- Ring Band — Right sector -->
  <path id="ring_right_1" d="M 155.359,110.411 L 154.554,107.107 L 153.214,103.771 L 151.874,100.435 L 156.186,98.203 L 160.499,95.971 L 166.153,93.1 L 171.808,90.229 L 171.881,90.334 L 171.954,90.439 L 172.851,92.438 L 173.749,94.437 L 174.641,96.865 L 175.534,99.292 L 176.243,101.72 L 176.952,104.147 L 177.625,107.236 L 178.297,110.325 L 177.966,110.439 L 177.634,110.552 L 167.436,112.133 L 157.237,113.715 L 156.701,113.715 L 156.165,113.715 L 155.359,110.411" />
  <path id="ring_right_2" d="M 191.771,136.399 L 191.343,136.301 L 186.409,135.537 L 181.475,134.774 L 181.613,134.311 L 181.751,133.849 L 182.04,128.709 L 182.328,123.568 L 181.957,118.284 L 181.586,113.001 L 181.646,112.916 L 181.707,112.831 L 187.075,112.131 L 192.443,111.43 L 193.068,111.43 L 193.693,111.43 L 193.873,112.745 L 194.053,114.06 L 194.36,118.743 L 194.668,123.426 L 194.363,128.495 L 194.058,133.564 L 193.875,135.063 L 193.691,136.562 L 192.945,136.529 L 192.2,136.496 L 191.771,136.399" />
  <path id="ring_right_3" d="M 180.908,108.315 L 180.591,106.718 L 179.773,103.433 L 178.954,100.149 L 178.05,97.579 L 177.146,95.008 L 175.782,91.944 L 174.419,88.88 L 187.114,82.444 L 199.809,76.008 L 200.046,76.155 L 200.283,76.301 L 202.43,81.371 L 204.577,86.44 L 205.855,90.445 L 207.133,94.449 L 208.303,99.854 L 209.473,105.259 L 209.195,105.431 L 208.918,105.602 L 198.274,107.259 L 187.63,108.916 L 184.428,109.414 L 181.226,109.912 L 180.908,108.315" />
  <path id="ring_right_4" d="M 197.198,123.996 L 197.198,110.859 L 203.338,110.859 L 209.478,110.859 L 209.478,123.996 L 209.478,137.134 L 203.338,137.134 L 197.198,137.134 L 197.198,123.996" />

  <!-- Ring Band — Down / Down-Right sector -->
  <path id="ring_down" d="M 90.098,214.744 L 90.098,214.387 L 90.84,208.675 L 91.582,202.963 L 91.777,202.755 L 91.972,202.546 L 97.426,202.941 L 102.88,203.336 L 108.109,202.931 L 113.337,202.526 L 113.526,202.744 L 113.715,202.963 L 114.205,207.961 L 114.694,212.959 L 114.857,214.03 L 115.019,215.101 L 102.559,215.101 L 90.099,215.101 L 90.098,214.744" />
  <path id="ring_downright" d="M 156.547,208.16 L 153.501,203.192 L 153.501,203.031 L 153.501,202.87 L 157.741,199.74 L 161.98,196.609 L 165.877,192.861 L 169.773,189.112 L 169.947,189.112 L 170.121,189.112 L 174.021,192.725 L 177.92,196.339 L 178.48,196.864 L 179.041,197.388 L 177.909,198.558 L 176.778,199.727 L 173.552,202.613 L 170.326,205.5 L 167.411,207.769 L 164.497,210.038 L 162.425,211.436 L 160.354,212.835 L 159.973,212.981 L 159.592,213.127 L 156.547,208.16" />

  <!-- Top Bar (left → right) -->
  <path id="top_bar_1" d="M 24.68,44.29 L 1.993,22.275 L 0.996,21.298 L 0,20.322 L 23.81,20.395 L 47.62,20.468 L 52.034,28.607 L 56.448,36.747 L 60.707,44.917 L 64.967,53.088 L 64.967,53.379 L 64.967,53.67 L 64.104,54.028 L 63.241,54.385 L 59.806,56.632 L 56.371,58.878 L 54.314,60.514 L 52.258,62.15 L 49.916,64.228 L 47.575,66.306 L 47.471,66.306 L 47.367,66.306 L 24.68,44.29" />
  <path id="top_bar_2" d="M 0.137,8.33 L 0.137,0.333 L 23.841,0.333 L 47.545,0.333 L 47.545,8.33 L 47.545,16.327 L 23.841,16.327 L 0.137,16.327 L 0.137,8.33" />
  <path id="top_bar_3" d="M 65.153,15.631 L 63.769,14.953 L 62.974,14.191 L 62.179,13.429 L 61.41,12.016 L 60.64,10.602 L 60.484,9.088 L 60.328,7.573 L 60.793,5.973 L 61.258,4.374 L 62.684,2.813 L 64.111,1.252 L 65.324,0.732 L 66.537,0.212 L 75.748,0.106 L 84.958,0 L 84.958,8.163 L 84.958,16.327 L 75.748,16.318 L 66.537,16.309 L 65.153,15.631" />
  <path id="top_bar_4" d="M 86.957,8.33 L 86.957,0.333 L 101.951,0.333 L 116.945,0.333 L 116.945,8.33 L 116.945,16.327 L 101.951,16.327 L 86.957,16.327 L 86.957,8.33" />
  <path id="top_bar_5" d="M 118.944,8.33 L 118.944,0.333 L 128.155,0.34 L 137.365,0.346 L 138.53,0.875 L 139.696,1.405 L 140.784,2.511 L 141.872,3.618 L 142.581,5.149 L 143.291,6.68 L 143.157,8.76 L 143.024,10.84 L 142.276,12.116 L 141.528,13.392 L 140.465,14.326 L 139.402,15.259 L 138.24,15.787 L 137.079,16.314 L 128.012,16.32 L 118.944,16.327 L 118.944,8.33" />
  <path id="top_bar_6" d="M 152.739,16.343 L 151.834,16.123 L 150.547,15.368 L 149.259,14.614 L 148.389,13.558 L 147.52,12.503 L 147.083,11.223 L 146.647,9.942 L 146.669,8.208 L 146.69,6.474 L 147.026,5.564 L 147.361,4.655 L 148.264,3.377 L 149.168,2.1 L 150.549,1.288 L 151.93,0.476 L 168.066,0.389 L 184.203,0.301 L 185.331,0.631 L 186.459,0.962 L 187.404,1.604 L 188.35,2.247 L 189.312,3.503 L 190.275,4.76 L 190.618,5.835 L 190.961,6.91 L 190.975,8.423 L 190.988,9.936 L 190.386,11.298 L 189.784,12.659 L 188.909,13.764 L 188.034,14.869 L 186.404,15.669 L 184.774,16.47 L 169.209,16.516 L 153.644,16.563 L 152.739,16.343" />
  <path id="top_bar_7" d="M 152.359,39.7 L 151.359,39.427 L 150.225,38.65 L 149.091,37.873 L 148.166,36.66 L 147.241,35.447 L 146.945,34.383 L 146.65,33.32 L 146.654,31.606 L 146.658,29.893 L 147.239,28.607 L 147.82,27.322 L 148.732,26.359 L 149.644,25.396 L 151.358,24.575 L 153.071,23.753 L 168.554,23.752 L 184.037,23.752 L 185.642,24.353 L 187.247,24.953 L 188.234,25.82 L 189.221,26.687 L 189.903,27.861 L 190.585,29.036 L 190.862,30.588 L 191.14,32.14 L 190.738,33.682 L 190.337,35.223 L 189.502,36.435 L 188.668,37.648 L 187.62,38.448 L 186.571,39.248 L 185.269,39.639 L 183.968,40.031 L 168.662,40.002 L 153.357,39.972 L 152.359,39.7" />

  <!-- Bottom Accent Cluster -->
  <path id="accent_1" d="M 5.278,156.018 L 5.278,140.301 L 6.206,140.139 L 7.134,139.976 L 27.411,137.007 L 47.689,134.038 L 48.545,133.944 L 49.402,133.849 L 49.491,134.563 L 49.581,135.277 L 50.32,138.133 L 51.058,140.989 L 52.176,143.702 L 53.295,146.415 L 53.441,146.874 L 53.588,147.332 L 33.788,157.264 L 13.988,167.195 L 9.633,169.465 L 5.278,171.736 L 5.278,156.018" />
  <path id="accent_2" d="M 5.277,194.879 L 5.277,174.654 L 29.767,162.476 L 54.257,150.299 L 54.641,150.214 L 55.025,150.128 L 56.456,152.413 L 57.887,154.697 L 59.337,156.554 L 60.786,158.41 L 62.52,160.373 L 64.253,162.336 L 66.823,164.536 L 69.393,166.735 L 71.098,167.983 L 72.803,169.231 L 74.703,170.402 L 76.603,171.573 L 65.531,193.266 L 54.46,214.958 L 29.869,215.031 L 5.277,215.104 L 5.277,194.879" />
  <path id="accent_3" d="M 59.91,211.034 L 62.039,206.961 L 70.656,189.913 L 79.272,172.865 L 81.52,173.828 L 83.768,174.79 L 86.434,175.641 L 89.099,176.493 L 90.908,176.847 L 92.717,177.201 L 92.557,178.087 L 92.397,178.973 L 90.102,193.824 L 87.807,208.675 L 87.309,211.817 L 86.811,214.958 L 72.296,215.032 L 57.782,215.106 L 59.91,211.034" />
  <path id="accent_4" d="M 160.927,214.982 L 160.927,214.863 L 163.283,213.226 L 165.639,211.59 L 168.218,209.531 L 170.798,207.472 L 173.359,205.081 L 175.92,202.689 L 178.062,200.616 L 180.204,198.543 L 194.841,198.54 L 209.478,198.537 L 209.478,206.819 L 209.478,215.102 L 185.202,215.102 L 160.927,215.102 L 160.927,214.982" />
  <path id="accent_5" d="M 116.089,199.209 L 116.089,199.025 L 114.363,188.178 L 112.637,177.332 L 112.721,177.276 L 112.804,177.221 L 116.089,176.435 L 119.373,175.648 L 122.657,174.356 L 125.942,173.064 L 128.084,171.905 L 130.226,170.746 L 132.72,169.072 L 135.214,167.398 L 137.718,165.29 L 140.222,163.181 L 142.249,160.936 L 144.276,158.692 L 146.35,155.981 L 148.424,153.27 L 149.958,150.664 L 151.493,148.059 L 152.476,145.762 L 153.46,143.465 L 154.308,140.799 L 155.156,138.133 L 155.643,135.92 L 156.129,133.707 L 156.344,133.707 L 156.558,133.707 L 167.23,135.435 L 177.902,137.163 L 178.039,137.3 L 178.176,137.437 L 177.844,139.356 L 177.511,141.275 L 176.518,144.885 L 175.525,148.495 L 174.476,151.311 L 173.427,154.127 L 172.401,156.411 L 171.376,158.696 L 169.696,161.549 L 168.017,164.402 L 165.832,167.404 L 163.646,170.405 L 161.186,173.261 L 158.725,176.117 L 155.756,178.985 L 152.788,181.852 L 150.074,184.028 L 147.36,186.204 L 144.077,188.404 L 140.793,190.604 L 136.223,192.843 L 131.654,195.082 L 127.655,196.409 L 123.657,197.737 L 120.087,198.562 L 116.517,199.387 L 116.303,199.39 L 116.089,199.393 L 116.089,199.209" />
  <path id="accent_6" d="M 118.265,213.173 L 118.112,212.388 L 117.348,207.452 L 116.583,202.516 L 116.742,202.356 L 116.902,202.197 L 119.993,201.534 L 123.085,200.87 L 126.807,199.718 L 130.528,198.567 L 133.654,197.257 L 136.779,195.948 L 139.775,194.362 L 142.772,192.776 L 145.923,190.691 L 149.074,188.607 L 152.073,186.248 L 155.072,183.889 L 158.957,180.003 L 162.842,176.117 L 165.218,173.118 L 167.594,170.12 L 169.941,166.55 L 172.289,162.98 L 173.591,160.552 L 174.894,158.125 L 176.488,154.15 L 178.082,150.175 L 179.042,146.867 L 180.002,143.559 L 180.618,140.713 L 181.233,137.866 L 181.308,137.791 L 181.383,137.716 L 187.024,138.68 L 192.664,139.645 L 192.781,139.762 L 192.897,139.878 L 192.192,143.279 L 191.487,146.679 L 190.338,150.499 L 189.188,154.32 L 187.874,157.65 L 186.559,160.981 L 184.914,164.287 L 183.269,167.593 L 181.904,169.856 L 180.539,172.119 L 179.393,173.832 L 178.247,175.546 L 176.529,177.831 L 174.811,180.115 L 172.658,182.686 L 170.504,185.256 L 167.663,188.069 L 164.823,190.882 L 162.089,193.231 L 159.356,195.579 L 157.03,197.333 L 154.704,199.087 L 151.032,201.484 L 147.361,203.881 L 145.219,205.044 L 143.077,206.208 L 140.507,207.332 L 137.936,208.456 L 135.223,209.471 L 132.51,210.486 L 128.512,211.631 L 124.513,212.776 L 121.602,213.367 L 118.692,213.958 L 118.555,213.958 L 118.418,213.958 L 118.265,213.173" />

  <!-- Decorative accent strokes (added highlight lines, non-interactive) -->
  <g id="decorative-lines" opacity="0.3" fill="none" stroke="#000">
    <path d="M 96.5,79 h 12.6" stroke-width="1" />
    <path d="M 96.5,101.3 h 12.6" stroke-width="1" />
    <path d="M 96.5,155 h 12.6" stroke-width="1" />
    <path d="M 76,116.9 v 13.6" stroke-width="1" />
    <path d="M 129.4,116.9 v 13.6" stroke-width="1" />
    <path d="M 99,50 h 12" stroke-width="1.5" />
    <path d="M 99,197 h 12" stroke-width="1.5" />
    <path d="M 29,118 v 12" stroke-width="1.5" />
    <path d="M 176,118 v 12" stroke-width="1.5" />
  </g>
</svg>`,Y={dpad_voyager:{svg:q,orientation:"square",features:["multi-segment","state-based-styling","zones","text-overlay"],zones:{up_left:{x:52.4,y:73.4,width:40.3,height:40.3},up_right:{x:112.7,y:73.4,width:40.3,height:40.3},down_left:{x:52.4,y:133.7,width:40.3,height:40.3},down_right:{x:112.7,y:133.7,width:40.3,height:40.3},center:{x:95.8,y:116.9,width:14,height:14},up_inner:{x:95.8,y:107.7,width:13.7,height:6},up_shaft:{x:95.8,y:98,width:13.7,height:8},up_seam:{x:95.8,y:91.7,width:14,height:4.6},up_arrow:{x:97.2,y:84.2,width:11,height:5.8},up_outer:{x:95.8,y:72.5,width:14,height:10.1},up_ring:{x:92.1,y:47.1,width:21.2,height:22.7},down_shaft:{x:95.8,y:133.7,width:13.7,height:22},down_arrow:{x:97.2,y:157.7,width:11,height:5.7},down_outer:{x:95.8,y:165.1,width:14,height:9.9},down_ring:{x:92.2,y:177.8,width:21,height:22.4},left_shaft:{x:70.7,y:116.9,width:22,height:13.7},left_arrow:{x:62.9,y:118.5,width:6.1,height:10.6},left_outer:{x:51.4,y:116.9,width:9.8,height:14},left_ring:{x:26.1,y:113.2,width:22.5,height:21.1},right_shaft:{x:112.7,y:116.9,width:22,height:13.7},right_arrow:{x:136.4,y:118.2,width:6,height:10.9},right_outer:{x:144.1,y:116.9,width:9.8,height:14},right_ring:{x:156.7,y:113.4,width:22.7,height:20.9},ring_down:{x:90.1,y:202.5,width:24.9,height:12.6},ring_downright:{x:153.5,y:189.1,width:25.5,height:24},ring_left_1:{x:27.2,y:90.3,width:26.3,height:23.4},ring_left_2:{x:11.3,y:110.8,width:12.6,height:26},ring_left_3:{x:12.4,y:84,width:18.3,height:26},ring_right_1:{x:151.9,y:90.2,width:26.4,height:23.5},ring_right_2:{x:181.5,y:111.4,width:13.2,height:25.1},ring_right_3:{x:174.4,y:76,width:35.1,height:33.9},ring_right_4:{x:197.2,y:110.9,width:12.3,height:26.3},ring_up_1:{x:69.3,y:48.3,width:23.4,height:26.3},ring_up_2:{x:112.6,y:48.3,width:23.7,height:26.2},ring_up_3:{x:62.4,y:33.5,width:26.3,height:18.5},ring_up_4:{x:116.5,y:33.4,width:26.4,height:18.6},ring_up_5:{x:87.5,y:20.3,width:29.7,height:24.6},ring_upleft_1:{x:49.5,y:56,width:27.2,height:28.3},ring_upleft_2:{x:21.8,y:60.3,width:23.5,height:26},ring_upright_1:{x:142.3,y:70.8,width:28.1,height:26.9},ring_upright_2:{x:128.7,y:56,width:27,height:28},ring_upright_3:{x:140.1,y:42.9,width:26.1,height:23.4},ring_upright_4:{x:160.1,y:48.5,width:38.5,height:37.8},top_bar_1:{x:0,y:20.3,width:65,height:46},top_bar_2:{x:.1,y:.3,width:47.4,height:16},top_bar_3:{x:60.3,y:0,width:24.6,height:16.3},top_bar_4:{x:87,y:.3,width:30,height:16},top_bar_5:{x:118.9,y:.3,width:24.3,height:16},top_bar_6:{x:146.6,y:.3,width:44.3,height:16.3},top_bar_7:{x:146.7,y:23.8,width:44.5,height:16.3},accent_1:{x:5.3,y:133.8,width:48.3,height:37.9},accent_2:{x:5.3,y:150.1,width:71.3,height:65},accent_3:{x:57.8,y:172.9,width:34.9,height:42.2},accent_4:{x:160.9,y:198.5,width:48.6,height:16.6},accent_5:{x:112.6,y:133.7,width:65.5,height:65.7},accent_6:{x:116.6,y:137.7,width:76.3,height:76.2}},segments:{up_left:{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},up_right:{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},down_left:{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},down_right:{style:{fill:"theme:components.dpad.segment.diagonal.fill",stroke:"theme:components.dpad.segment.diagonal.stroke","stroke-width":"theme:components.dpad.segment.diagonal.stroke-width"}},center:{style:{fill:"theme:components.dpad.segment.center.fill",stroke:"theme:components.dpad.segment.center.stroke","stroke-width":"theme:components.dpad.segment.center.stroke-width"}},up_inner:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},up_shaft:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},up_seam:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},up_arrow:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},up_outer:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},up_ring:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},down_shaft:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},down_arrow:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},down_outer:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},down_ring:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},left_shaft:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},left_arrow:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},left_outer:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},left_ring:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},right_shaft:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},right_arrow:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},right_outer:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},right_ring:{style:{fill:"theme:components.dpad.segment.directional.fill",stroke:"theme:components.dpad.segment.directional.stroke","stroke-width":"theme:components.dpad.segment.directional.stroke-width"}},ring_down:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_downright:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_left_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_left_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_left_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_right_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_right_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_right_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_right_4:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_up_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_up_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_up_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_up_4:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_up_5:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upleft_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upleft_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upright_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upright_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upright_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},ring_upright_4:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_4:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_5:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_6:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},top_bar_7:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_1:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_2:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_3:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_4:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_5:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}},accent_6:{style:{fill:"theme:components.dpad.segment.ring.fill",stroke:"theme:components.dpad.segment.ring.stroke","stroke-width":"theme:components.dpad.segment.ring.stroke-width"}}},presets:{default:{}},validatePreset(a){return a in this.presets},getPresetNames(){return Object.keys(this.presets)},metadata:{type:"dpad_voyager",card_type:"button",pack:"lcards_buttons",id:"dpad_voyager",name:"D-Pad Control (Voyager)",description:"Interactive 56-segment directional control styled after Voyager-era LCARS consoles",version:"1.0.0",examples:{basic:{description:"Basic media player control using the primary directional segments",config:{component:"dpad_voyager",entity:"media_player.living_room",dpad_voyager:{segments:{up_arrow:{tap_action:{action:"call-service",service:"media_player.volume_up"}},down_arrow:{tap_action:{action:"call-service",service:"media_player.volume_down"}},left_arrow:{tap_action:{action:"call-service",service:"media_player.media_previous_track"}},right_arrow:{tap_action:{action:"call-service",service:"media_player.media_next_track"}},center:{tap_action:{action:"call-service",service:"media_player.media_play_pause"}}}}}},advanced:{description:"Remote control with full directional navigation and diagonal shortcuts",config:{component:"dpad_voyager",entity:"remote.roku",dpad_voyager:{segments:{up_arrow:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"up"}}},down_arrow:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"down"}}},left_arrow:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"left"}}},right_arrow:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"right"}}},center:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"select"}}},up_left:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"home"}}},up_right:{tap_action:{action:"call-service",service:"remote.send_command",data:{command:"back"}}}}}}}}}}};function O(a,o){const e={x:0,y:0,width:a,height:o};return{progress:{...e},control:{...e},range:{...e},track:{...e},text:{x:5,y:5,width:a-10,height:Math.min(30,o/2)}}}h(O,"calculateZones$4");function X(a){const{width:o,height:e,colors:t,zones:s}=a,r=s||O(o,e);return`
<svg xmlns="http://www.w3.org/2000/svg" width="${o}" height="${e}" viewBox="0 0 ${o} ${e}">
  <!-- Background (transparent by default, can be styled via config) -->
  <rect width="${o}" height="${e}" fill="transparent"></rect>

  <!-- Range indicators zone (overlapping with track) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${r.range.x}, ${r.range.y})"
     data-bounds="${r.range.x},${r.range.y},${r.range.width},${r.range.height}">
  </g>

  <!-- Progress bar background zone — rendered before track so ticks paint over the fill -->
  <g id="progress-zone-bg" data-zone="progress"
     transform="translate(${r.progress.x}, ${r.progress.y})"
     data-bounds="${r.progress.x},${r.progress.y},${r.progress.width},${r.progress.height}">
  </g>

  <!-- Track zone (gauge or pills) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${r.track.x}, ${r.track.y})"
     data-bounds="${r.track.x},${r.track.y},${r.track.width},${r.track.height}">
  </g>

  <!-- Progress bar foreground zone — rendered after track so value indicator overlays tick marks -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${r.progress.x}, ${r.progress.y})"
     data-bounds="${r.progress.x},${r.progress.y},${r.progress.width},${r.progress.height}">
  </g>

  <!-- Control overlay zone (overlapping with progress/track for interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${r.control.x}" y="${r.control.y}"
        width="${r.control.width}" height="${r.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${r.control.x},${r.control.y},${r.control.width},${r.control.height}" />

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${r.text.x}, ${r.text.y})"
     data-bounds="${r.text.x},${r.text.y},${r.text.width},${r.text.height}">
  </g>
</svg>
    `.trim()}h(X,"render$4");function Q(){return{type:"slider",pack:"lcards_sliders",id:"default",name:"Default",description:"Simple rectangular slider with state-aware colours and overlapping zones",orientation:"auto",supportsOrientation:["horizontal","vertical"],defaultOrientation:"horizontal",features:["state-colors","progress-bar","gauge","pills","ranges","text-fields"],configSchema:{style:{border:{color:{description:"Border colour (state-aware: object with state keys or single colour)",type:["string","object"]},width:{description:"Border width in pixels",type:"number",default:2},radius:{description:"Corner radius: uniform number (e.g. 12) or per-corner object { top_left, top_right, bottom_right, bottom_left }. LCARS tip: set left corners to 0 and right corners to 12 for end-cap rounding on a left-bordered slider.",type:["number","object"],default:0}},background:{color:{description:"Background colour (state-aware: object with state keys or single colour)",type:["string","object"]}}}}}}h(Q,"getMetadata$2");const K={calculateZones:O,render:X,metadata:Q()};function E(a,o){const e=a/365,t=o/601;return{progress:{x:100*e,y:72*t,width:19*e,height:441*t},control:{x:100*e,y:72*t,width:19*e,height:441*t},range:{x:148*e,y:84*t,width:18*e,height:418*t},solidBar:{x:183*e,y:72*t,width:16*e,height:441*t},track:{x:199*e,y:72*t,width:120*e,height:441*t},text:{x:0*e,y:16*t,width:365*e,height:552*t}}}h(E,"calculateZones$3");function J(a,o,e,t){var y,_,f,p;const s=(e==null?void 0:e.ranges)||[];if(s.length===0)return"";const r=t.min??0,d=t.max??100,i=d-r,n=(o==null?void 0:o.rangeBorder)||((_=(y=e==null?void 0:e.range)==null?void 0:y.border)==null?void 0:_.color)||"black",l=((p=(f=e==null?void 0:e.range)==null?void 0:f.border)==null?void 0:p.gap)??2,g=a.height,L=a.width;let m="";return s.forEach((c,k)=>{const b=c.min??r,$=c.max??d,M=c.color||"var(--lcards-gray-medium, #cccccc)",C=(b-r)/i,x=($-r)/i,R=x-C,B=k===0,T=k===s.length-1,v=g*R,z=g*(1-x);m+=`<rect x="${-l}" y="${z}" width="${L+l}" height="${v}" fill="${n}" />`;const A=B?l:0,u=T?l:0,w=L-l,j=Math.max(1,v-A-u);m+=`<rect x="${-l}" y="${z+A}" width="${w}" height="${j}" fill="${M}" />`}),m}h(J,"renderRangeSegments");function ee(a){const{width:o,height:e,colors:t,config:s,style:r,zones:d}=a,i=d||E(o,e),n=o/365,l=e/601,g=s.show_animation!==false,L=s.animation_speed||2,m=(r==null?void 0:r.ranges)&&r.ranges.length>0;return`
<svg width="${o}" height="${e}" viewBox="0 0 ${o} ${e}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background (transparent) -->
  <rect width="${o}" height="${e}" fill="transparent" />

  <!-- Top-left border ] shape (state-aware: blue when active) -->
  <path fill="${t.borderTop}" d="M0,0 L${175*n},0 L${175*n},${64*l} L${145*n},${64*l} L${145*n},${16*l} L0,${16*l} Z" />

  <!-- Top-right border [ shape (gray) -->
  <path fill="${t.borderBottom}" d="M${183*n},0 L${o},0 L${o},${16*l} L${199*n},${16*l} L${199*n},${64*l} L${183*n},${64*l} Z" />

  <!-- Bottom-left border ] shape (state-aware: blue when active) -->
  <path fill="${t.borderTop}" d="M0,${570*l} L${145*n},${570*l} L${145*n},${522*l} L${175*n},${522*l} L${175*n},${e} L0,${e} Z" />

  <!-- Bottom-right border [ shape (gray) -->
  <path fill="${t.borderBottom}" d="M${183*n},${522*l} L${199*n},${522*l} L${199*n},${570*l} L${o},${570*l} L${o},${e} L${183*n},${e} Z" />

  <!-- Range zone: solid bar when no ranges, notched frame when ranges exist -->
  ${m?`
  <!-- Range area border frame (notched, customizable color) -->
  <path fill="${t.rangeFrame}" d="M${145*n},${72*l} L${175*n},${72*l} L${175*n},${514*l} L${145*n},${514*l} L${145*n},${509*l} L${170*n},${509*l} L${170*n},${77*l} L${145*n},${77*l} Z" />
  `:`
  <!-- Solid range bar (no ranges defined) - fills the frame area -->
  <rect x="${145*n}" y="${72*l}" width="${30*n}" height="${442*l}" fill="${t.rangeFrame}" />
  `}

  <!-- Solid vertical bar (connector between range and track) -->
  <rect x="${i.solidBar.x}" y="${i.solidBar.y}" width="${i.solidBar.width}" height="${i.solidBar.height}" fill="${t.solidBar}" />

  <!-- Animation indicators (3 squares with staggered timing) -->
  ${g?`
  <rect x="${2*n}" y="${28*l}" width="${26*n}" height="${24*l}" fill="${t.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${L}s" repeatCount="indefinite" />
  </rect>
  <rect x="${38*n}" y="${28*l}" width="${26*n}" height="${24*l}" fill="${t.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${L}s" begin="${L/3}s" repeatCount="indefinite" />
  </rect>
  <rect x="${74*n}" y="${28*l}" width="${26*n}" height="${24*l}" fill="${t.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${L}s" begin="${L*2/3}s" repeatCount="indefinite" />
  </rect>
  `:""}

  <!-- Range indicators zone (render first so progress thumb appears on top) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${i.range.x}, ${i.range.y})"
     data-bounds="${i.range.x},${i.range.y},${i.range.width},${i.range.height}">
    ${m?J(i.range,t,r,s):""}
  </g>

  <!-- Progress bar zone (leftmost, renders after ranges for proper z-order) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${i.progress.x}, ${i.progress.y})"
     data-bounds="${i.progress.x},${i.progress.y},${i.progress.width},${i.progress.height}">
  </g>

  <!-- Control overlay zone (overlaps progress bar for slider interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${i.control.x}" y="${i.control.y}"
        width="${i.control.width}" height="${i.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${i.control.x},${i.control.y},${i.control.width},${i.control.height}" />

  <!-- Track zone (pills or gauge - rightmost) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${i.track.x}, ${i.track.y})"
     data-bounds="${i.track.x},${i.track.y},${i.track.width},${i.track.height}">
  </g>

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${i.text.x}, ${i.text.y})"
     data-bounds="${i.text.x},${i.text.y},${i.text.width},${i.text.height}">
  </g>
</svg>
  `.trim()}h(ee,"render$3");const te={type:"slider",pack:"lcards_sliders",name:"picard",displayName:"Picard",orientation:"vertical",features:["state-aware-borders","animated-indicator","progress-bar","range-indicators","decorative-frame"],defaultSize:{width:365,height:601},configurableOptions:[{key:"show_animation",type:"boolean",default:true,description:"Show pulsing animation indicators in top-left","x-ui-hints":{label:"Show Animation",helper:"Show 3 pulsing animation indicators in top-left (default: true)",selector:{boolean:{}}}},{key:"animation_speed",type:"number",default:2,description:"Animation pulse speed in seconds","x-ui-hints":{label:"Animation Speed",helper:"Animation pulse speed in seconds (default: 2)",selector:{number:{mode:"box",step:.1,min:.1,max:10}}}}],description:"Star Trek LCARS-inspired vertical slider with state-aware borders and animated indicator"},oe={render:ee,calculateZones:E,metadata:te};function N(a,o){const e=a/400,t=o/600;return{track:{x:200*e,y:80*t,width:160*e,height:440*t},control:{x:80*e,y:80*t,width:40*e,height:440*t},progress:{x:80*e,y:80*t,width:40*e,height:440*t},range:{x:140*e,y:80*t,width:40*e,height:440*t},text:{x:0*e,y:0*t,width:80*e,height:600*t},border:{x:0,y:0,width:a,height:o}}}h(N,"calculateZones$2");function re(a){var k,b,$;const{width:o,height:e,colors:t,config:s,style:r,state:d,zones:i}=a,n=i||N(o,e),l=s.show_decorations!==false,g=s.show_animation!==false,L=s.show_grid!==false,m=s.decoration_size||10,y=s.animation_speed||2,_=s.border_thickness||5,f=s.decoration_color||t.animationIndicator;(k=r==null?void 0:r.border)==null||k.radius,(b=r==null?void 0:r.range)==null||b.show_labels,($=d==null?void 0:d.entity)==null||$.state,d==null||d.value;const p=o/400,c=e/600;return`
<svg width="${o}" height="${e}" viewBox="0 0 ${o} ${e}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${o}" height="${e}" fill="transparent" />

  <!-- ============================================================ -->
  <!-- DECORATIVE ELEMENTS (User-configurable) -->
  <!-- ============================================================ -->

  ${l?`
  <!-- Top border decoration (state-aware color) -->
  <rect x="0" y="0" width="${o}" height="${_*c}" fill="${t.borderTop}" />

  <!-- Bottom border decoration -->
  <rect x="0" y="${e-_*c}" width="${o}" height="${_*c}" fill="${t.borderBottom}" />

  <!-- Left decorative panel -->
  <rect x="0" y="${20*c}" width="${60*p}" height="${560*c}" fill="${t.borderTop}" opacity="0.3" />

  <!-- Corner decorations -->
  <circle cx="${20*p}" cy="${30*c}" r="${m*p}" fill="${f}" />
  <circle cx="${20*p}" cy="${570*c}" r="${m*p}" fill="${f}" />
  `:""}

  ${L?`
  <!-- Grid lines (helpful for layout visualization) -->
  <line x1="0" y1="${e/3}" x2="${o}" y2="${e/3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="0" y1="${e*2/3}" x2="${o}" y2="${e*2/3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${o/4}" y1="0" x2="${o/4}" y2="${e}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${o/2}" y1="0" x2="${o/2}" y2="${e}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${o*3/4}" y1="0" x2="${o*3/4}" y2="${e}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  `:""}

  <!-- ============================================================ -->
  <!-- ANIMATION EXAMPLE (User-configurable speed) -->
  <!-- ============================================================ -->

  ${g?`
  <!-- Pulsing indicator -->
  <rect x="${10*p}" y="${40*c}" width="${20*p}" height="${20*c}" fill="${t.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${y}s" repeatCount="indefinite" />
  </rect>

  <!-- Scrolling indicator -->
  <rect x="${10*p}" y="${70*c}" width="${20*p}" height="${5*c}" fill="${t.animationIndicator}">
    <animate attributeName="y" values="${70*c};${100*c};${70*c}" dur="${y*1.5}s" repeatCount="indefinite" />
  </rect>
  `:""}

  <!-- ============================================================ -->
  <!-- ZONE MARKERS (Visual guides - remove in production) -->
  <!-- These show zone boundaries for development/testing -->
  <!-- ============================================================ -->

  ${s.show_zone_markers?`
  <!-- Track zone marker -->
  <rect x="${n.track.x}" y="${n.track.y}"
        width="${n.track.width}" height="${n.track.height}"
        fill="none" stroke="#ff0000" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${n.track.x+5}" y="${n.track.y+15}" font-size="12" fill="#ff0000">track</text>

  <!-- Progress zone marker -->
  <rect x="${n.progress.x}" y="${n.progress.y}"
        width="${n.progress.width}" height="${n.progress.height}"
        fill="none" stroke="#00ff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${n.progress.x+5}" y="${n.progress.y+15}" font-size="12" fill="#00ff00">progress</text>

  <!-- Range zone marker -->
  <rect x="${n.range.x}" y="${n.range.y}"
        width="${n.range.width}" height="${n.range.height}"
        fill="none" stroke="#0000ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${n.range.x+5}" y="${n.range.y+15}" font-size="12" fill="#0000ff">range</text>

  <!-- Control zone marker -->
  <rect x="${n.control.x}" y="${n.control.y}"
        width="${n.control.width}" height="${n.control.height}"
        fill="none" stroke="#ffff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${n.control.x+5}" y="${n.control.y+15}" font-size="12" fill="#ffff00">control</text>

  <!-- Text zone marker -->
  <rect x="${n.text.x}" y="${n.text.y}"
        width="${n.text.width}" height="${n.text.height}"
        fill="none" stroke="#ff00ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${n.text.x+5}" y="${n.text.y+15}" font-size="12" fill="#ff00ff">text</text>
  `:""}

  <!-- ============================================================ -->
  <!-- REQUIRED ZONES -->
  <!-- These MUST be present for card to inject content -->
  <!-- ============================================================ -->

  <!-- Progress bar zone (OPTIONAL but common in gauge mode) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${n.progress.x}, ${n.progress.y})"
     data-bounds="${n.progress.x},${n.progress.y},${n.progress.width},${n.progress.height}">
    <!-- Card injects progress bar rect here -->
  </g>

  <!-- Range indicator zone (OPTIONAL - for colored range backgrounds) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${n.range.x}, ${n.range.y})"
     data-bounds="${n.range.x},${n.range.y},${n.range.width},${n.range.height}">
    <!-- Card injects range segment rects here -->
  </g>

  <!-- Control overlay zone (REQUIRED - must have pointer-events="all") -->
  <rect id="control-zone" data-zone="control"
        x="${n.control.x}" y="${n.control.y}"
        width="${n.control.width}" height="${n.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${n.control.x},${n.control.y},${n.control.width},${n.control.height}" />

  <!-- Track zone (REQUIRED - pills or gauge rendered here) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${n.track.x}, ${n.track.y})"
     data-bounds="${n.track.x},${n.track.y},${n.track.width},${n.track.height}">
    <!-- Card injects pills or gauge SVG here -->
  </g>

  <!-- Text zone (REQUIRED - text fields rendered here) -->
  <g id="text-zone" data-zone="text"
     transform="translate(${n.text.x}, ${n.text.y})"
     data-bounds="${n.text.x},${n.text.y},${n.text.width},${n.text.height}">
    <!-- Card injects text elements here -->
  </g>

  <!-- Border zone (OPTIONAL - only if using card's border system) -->
  <g id="border-zone" data-zone="border">
    <!-- Card injects border rects here if style.border configured -->
  </g>
</svg>
    `.trim()}h(re,"render$2");const ne={type:"slider",pack:"lcards_sliders",name:"demo",displayName:"Demo Component",orientation:"auto",features:["state-aware-borders","animated-indicator","progress-bar","range-indicators","decorative-elements","zone-markers"],defaultSize:{width:400,height:600},configurableOptions:[{key:"show_decorations",type:"boolean",default:true,description:"Show decorative border elements","x-ui-hints":{label:"Show Decorations",helper:"Display decorative visual elements (default: true)",selector:{boolean:{}}}},{key:"show_animation",type:"boolean",default:true,description:"Show animated indicators","x-ui-hints":{label:"Show Animation",helper:"Enable pulsing and scrolling animations (default: true)",selector:{boolean:{}}}},{key:"show_grid",type:"boolean",default:false,description:"Show layout grid lines","x-ui-hints":{label:"Show Grid",helper:"Display grid lines for layout visualization (default: false)",selector:{boolean:{}}}},{key:"show_zone_markers",type:"boolean",default:false,description:"Show zone boundary markers","x-ui-hints":{label:"Show Zone Markers",helper:"Display coloured outlines for all zones (development only, default: false)",selector:{boolean:{}}}},{key:"decoration_size",type:"number",default:10,description:"Size of decorative elements in pixels","x-ui-hints":{label:"Decoration Size",helper:"Size of corner decorations in pixels (default: 10)",selector:{number:{mode:"box",step:1,min:5,max:30}}}},{key:"animation_speed",type:"number",default:2,description:"Animation speed in seconds","x-ui-hints":{label:"Animation Speed",helper:"Duration of animation cycle in seconds (default: 2)",selector:{number:{mode:"slider",step:.1,min:.1,max:10}}}},{key:"border_thickness",type:"number",default:5,description:"Border thickness in pixels","x-ui-hints":{label:"Border Thickness",helper:"Thickness of top/bottom borders in pixels (default: 5)",selector:{number:{mode:"box",step:1,min:0,max:20}}}},{key:"decoration_color",type:"color",default:"#66ccff",description:"Colour of decorative elements","x-ui-hints":{label:"Decoration Colour",helper:"Colour for corner decorations and animations (default: #66ccff)",format:"color-lcards"}},{key:"style.border.radius",type:"number",default:0,description:"Border radius for rounded corners","x-ui-hints":{label:"Border Radius",helper:"Rounded corner radius in pixels (default: 0)",selector:{number:{mode:"box",step:1,min:0,max:50}}}},{key:"style.range.show_labels",type:"boolean",default:true,description:"Show labels on range indicators","x-ui-hints":{label:"Show Range Labels",helper:"Display labels on coloured range segments (default: true)",selector:{boolean:{}}}}],description:"Comprehensive demo component showcasing all available zones, configurable options, and rendering features. Use this as a reference for component development and testing."},ae={render:re,calculateZones:N,metadata:ne},I=["lozenge","rect","rounded","diamond","hexagon","polygon","path"],D={lozenge(a,o,e,t,s={}){const r=s.radius!=null?Number(s.radius):Math.floor(Math.min(e,t)/2);return`<rect x="${a}" y="${o}" width="${e}" height="${t}" rx="${r}" ry="${r}" />`},rect(a,o,e,t){return`<rect x="${a}" y="${o}" width="${e}" height="${t}" />`},rounded(a,o,e,t,s={}){const r=s.radius!=null?Number(s.radius):8;return`<rect x="${a}" y="${o}" width="${e}" height="${t}" rx="${r}" ry="${r}" />`},diamond(a,o,e,t){const s=a+e/2,r=o+t/2;return`<polygon points="${[`${s},${o}`,`${a+e},${r}`,`${s},${o+t}`,`${a},${r}`].join(" ")}" />`},hexagon(a,o,e,t,s={}){const r=s.orientation??(e>=t?"horizontal":"vertical");let d;if(r==="horizontal"){const i=e*.15;d=[`${a+i},${o}`,`${a+e-i},${o}`,`${a+e},${o+t/2}`,`${a+e-i},${o+t}`,`${a+i},${o+t}`,`${a},${o+t/2}`].join(" ")}else{const i=t*.15;d=[`${a+e/2},${o}`,`${a+e},${o+i}`,`${a+e},${o+t-i}`,`${a+e/2},${o+t}`,`${a},${o+t-i}`,`${a},${o+i}`].join(" ")}return`<polygon points="${d}" />`},polygon(a,o,e,t,s={}){const r=s.points;return!Array.isArray(r)||r.length<3?D.rect(a,o,e,t):`<polygon points="${r.map(([i,n])=>`${a+i*e},${o+n*t}`).join(" ")}" />`},path(a,o,e,t,s={}){const r=s.d||`M${a},${o} H${a+e} V${o+t} H${a} Z`;return s.translate?`<g transform="translate(${a}, ${o})"><path d="${r}" /></g>`:`<path d="${r}" />`}};function ie(a,o,e,t,s,r,d={}){const n=(D[o]??D.lozenge)(e,t,s,r,d);return`<clipPath id="${a}">
    ${n}
  </clipPath>`}h(ie,"buildClipPath");let se=0;function P(a,o,e){var L,m,y,_,f,p,c,k,b,$,M,C,x,R,B,T,v,z,A;const t=(L=e==null?void 0:e.style)==null?void 0:L.shaped,s=((y=(m=e==null?void 0:e.style)==null?void 0:m.track)==null?void 0:y.orientation)??"vertical";let r,d,i,n;if(s==="horizontal"){const u=((f=(_=t==null?void 0:t.text_bands)==null?void 0:_.left)==null?void 0:f.size)??60,w=((c=(p=t==null?void 0:t.text_bands)==null?void 0:p.right)==null?void 0:c.size)??60;r=u,d=0,i=Math.max(1,a-u-w),n=o}else{const u=((b=(k=t==null?void 0:t.text_bands)==null?void 0:k.top)==null?void 0:b.size)??36,w=((M=($=t==null?void 0:t.text_bands)==null?void 0:$.bottom)==null?void 0:M.size)??36;r=0,d=u,i=a,n=Math.max(1,o-u-w)}const l={x:r,y:d,width:i,height:n},g={};if(s==="horizontal"){const u=((x=(C=t==null?void 0:t.text_bands)==null?void 0:C.left)==null?void 0:x.size)??60,w=((B=(R=t==null?void 0:t.text_bands)==null?void 0:R.right)==null?void 0:B.size)??60;u>0&&(g.left={x:0,y:0,width:u,height:o}),w>0&&(g.right={x:a-w,y:0,width:w,height:o})}else{const u=((v=(T=t==null?void 0:t.text_bands)==null?void 0:T.top)==null?void 0:v.size)??36,w=((A=(z=t==null?void 0:t.text_bands)==null?void 0:z.bottom)==null?void 0:A.size)??36;u>0&&(g.top={x:0,y:0,width:a,height:u}),w>0&&(g.bottom={x:0,y:o-w,width:a,height:w})}return{track:{...l},control:{...l},progress:{...l},text:{x:0,y:0,width:a,height:o},_shaped:{...l},...g}}h(P,"calculateZones$1");function de(a){var k,b,$,M,C,x,R,B,T,v,z;const{width:o,height:e,colors:t,config:s,style:r}=a,d=a.zones||P(o,e,a),i=d._shaped??d.control,n=i.x,l=i.y,g=i.width,L=i.height,m=((k=r==null?void 0:r.shaped)==null?void 0:k.type)??"lozenge",y={radius:(b=r==null?void 0:r.shaped)==null?void 0:b.radius,orientation:($=r==null?void 0:r.track)==null?void 0:$.orientation,points:(C=(M=r==null?void 0:r.shaped)==null?void 0:M.polygon)==null?void 0:C.points,d:(R=(x=r==null?void 0:r.shaped)==null?void 0:x.path)==null?void 0:R.d,translate:(T=(B=r==null?void 0:r.shaped)==null?void 0:B.path)==null?void 0:T.translate},f=`shaped-clip-${(s==null?void 0:s.id)??`shaped-${++se}`}`,p=(t==null?void 0:t.trackBackground)??((z=(v=r==null?void 0:r.shaped)==null?void 0:v.track)==null?void 0:z.background)??"var(--lcards-gray-dark, #12121c)",c=ie(f,m,n,l,g,L,y);return`
<svg xmlns="http://www.w3.org/2000/svg" width="${o}" height="${e}" viewBox="0 0 ${o} ${e}">
  <defs>
    <!-- Clip path constrains all injected content to the shape boundary -->
    ${c}
  </defs>

  <!-- Full-card transparent background -->
  <rect width="${o}" height="${e}" fill="transparent" />

  <!-- Shape background (the "empty" portion of the track) -->
  <rect x="${n}" y="${l}" width="${g}" height="${L}"
        clip-path="url(#${f})"
        fill="${p}" />

  <!-- Progress bar zone — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="progress-zone" data-zone="progress"
     clip-path="url(#${f})"
     transform="translate(0, 0)"
     data-bounds="${d.progress.x},${d.progress.y},${d.progress.width},${d.progress.height}">
  </g>

  <!-- Track zone (fill + ranges, injected by card) — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="track-zone" data-zone="track"
     clip-path="url(#${f})"
     transform="translate(0, 0)"
     data-bounds="${d.track.x},${d.track.y},${d.track.width},${d.track.height}">
  </g>

  <!-- Control overlay — full body area for pointer interaction -->
  <rect id="control-zone" data-zone="control"
        x="${d.control.x}" y="${d.control.y}"
        width="${d.control.width}" height="${d.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${d.control.x},${d.control.y},${d.control.width},${d.control.height}" />

  <!-- Text zone — full card area so labels can sit in exterior bands -->
  <g id="text-zone" data-zone="text"
     transform="translate(${d.text.x}, ${d.text.y})"
     data-bounds="${d.text.x},${d.text.y},${d.text.width},${d.text.height}">
  </g>
</svg>
    `.trim()}h(de,"render$1");function le(){return{type:"slider",pack:"lcards_sliders",id:"shaped",name:"Shaped",description:"Generic clip-path slider with exterior text bands. Shape is configurable via style.shaped.type (lozenge, rect, rounded, diamond, hexagon, polygon, path). Band widths/heights are set via style.shaped.text_bands.*.",orientation:"auto",supportsOrientation:["horizontal","vertical"],defaultOrientation:"vertical",features:["clip-shape","exterior-labels","solid-fill","range-bands","invert-fill","state-colors","text-fields","configurable-shape"],supportedShapes:I,configSchema:{style:{shaped:{type:{description:"Shape to use as the clip boundary",type:"string",enum:I,default:"lozenge"},radius:{description:"Corner radius in px (lozenge defaults to auto = min(w,h)/2, rounded defaults to 8)",type:"number"},fill:{color:{description:"Value fill colour",type:"string",default:"theme:components.slider.shaped.fill.color"}},text_bands:{description:"Pixel space reserved outside the shape body on each side, used by text.* fields for their position zones",top:{size:{type:"number",default:36}},bottom:{size:{type:"number",default:36}},left:{size:{type:"number",default:60}},right:{size:{type:"number",default:60}}},track:{background:{description:"Shape track background colour (the empty portion)",type:"string",default:"theme:components.slider.track.background"}},polygon:{points:{description:"Array of [xPct, yPct] pairs (0-1) for polygon shape type",type:"array"}},path:{d:{description:"SVG path d-attribute for path shape type",type:"string"},translate:{description:"If true, wrap path in translate(bodyX, bodyY) transform",type:"boolean",default:false}}}}}}}h(le,"getMetadata$1");const ce={calculateZones:P,render:de,metadata:le()};function Z(a,o,e){var i;const t=e==null?void 0:e.style,s=(e==null?void 0:e.ringOuterPad)??((i=t==null?void 0:t.ring)==null?void 0:i.padding)??0,r=V(a,o,t==null?void 0:t.ring,{outerPad:s}),d=U(r.inner);return{track:{...r.box},control:{...r.box},progress:{...r.box},text:{x:0,y:0,width:a,height:o},_ring:r,...d}}h(Z,"calculateZones");function he(a){const{width:o,height:e}=a,t=a.zones||Z(o,e,a),s=t.track;return`
<svg xmlns="http://www.w3.org/2000/svg" width="${o}" height="${e}" viewBox="0 0 ${o} ${e}">
  <rect width="${o}" height="${e}" fill="transparent" />

  <!-- Track zone: track arc, range arcs, value arc, ticks, markers (absolute coordinates) -->
  <g id="track-zone" data-zone="track"
     transform="translate(0, 0)"
     data-bounds="${s.x},${s.y},${s.width},${s.height}">
  </g>

  <!-- Control zone: the card puts its pointer overlay over this box -->
  <rect id="control-zone" data-zone="control"
        x="${t.control.x}" y="${t.control.y}"
        width="${t.control.width}" height="${t.control.height}"
        fill="none" stroke="none"
        data-bounds="${t.control.x},${t.control.y},${t.control.width},${t.control.height}" />

  <!-- Text zone: full card area; fields target label / value / sublabel / center -->
  <g id="text-zone" data-zone="text"
     transform="translate(0, 0)"
     data-bounds="0,0,${o},${e}">
  </g>
</svg>
    `.trim()}h(he,"render");function pe(){return{type:"slider",pack:"lcards_sliders",id:"ring",name:"Ring",description:"Circular gauge: a thick value arc around the centre text. Drag around the ring to set the value. Angles, thickness and caps via style.ring.*; text fields target the label, value, sublabel or center zones.",orientation:"auto",supportsOrientation:["horizontal","vertical"],defaultOrientation:"horizontal",features:["ring","drag-around","range-arcs","markers","scale","marker-labels","invert-fill","state-colors","text-fields"],textZones:["label","value","sublabel","center"]}}h(pe,"getMetadata");const Le={calculateZones:Z,render:he,metadata:pe()},ge={default:K,picard:oe,demo:ae,shaped:ce,ring:Le},me=`<svg viewBox="0 0 100 73.49" xmlns="http://www.w3.org/2000/svg">

  <!-- Shield outline (fill-rule evenodd cuts the interior open) -->
  <g id="alert-shape">
    <path fill-rule="evenodd" clip-rule="evenodd" d="
      M30.40 0 V21.00 C30.40 21.84 31.06 22.50 31.89 22.50
      H68.08 C68.91 22.50 69.57 21.84 69.57 21.00 V0
      C77.94 2.90 85.08 7.63 90.35 13.59
      L75.92 25.26 H24.08 L9.29 13.59
      C14.62 7.63 22.01 2.90 30.40 0Z
      M1.08 28.36 C0.37 31.07 0 33.84 0 36.63
      C0 39.42 0.37 42.19 1.08 44.90
      H15.10 V28.36 H1.08Z
      M9.29 60.03 C14.62 65.90 22.01 70.62 30.40 73.56
      V52.54 C30.40 51.70 31.06 51.04 31.89 51.04
      H68.08 C68.91 51.04 69.57 51.70 69.57 52.54 V73.56
      C77.94 70.62 85.08 65.90 90.35 60.03
      L75.92 48.37 H24.08 L9.29 60.03Z
      M98.67 44.90 C99.38 42.19 99.76 39.42 99.76 36.63
      C99.76 33.84 99.38 31.07 98.67 28.36
      H84.77 V44.90 H98.67Z"/>
  </g>

  <!-- Top-cap bars (bar-1 … bar-6, top to bottom)
       Short vertical segments at x=50 with wide stroke render as horizontal bars. -->
  <g id="alert-bars">
    <line id="bar-1"  x1="50" y1="0.000"  x2="50" y2="1.882"  stroke-width="33.33"/>
    <line id="bar-2"  x1="50" y1="3.473"  x2="50" y2="5.355"  stroke-width="33.33"/>
    <line id="bar-3"  x1="50" y1="6.946"  x2="50" y2="8.828"  stroke-width="33.33"/>
    <line id="bar-4"  x1="50" y1="10.420" x2="50" y2="12.301" stroke-width="33.33"/>
    <line id="bar-5"  x1="50" y1="13.884" x2="50" y2="15.765" stroke-width="33.33"/>
    <line id="bar-6"  x1="50" y1="17.357" x2="50" y2="19.239" stroke-width="33.33"/>
    <!-- Bottom-cap bars (bar-7 … bar-12, top to bottom) -->
    <line id="bar-7"  x1="50" y1="54.234" x2="50" y2="56.116" stroke-width="33.33"/>
    <line id="bar-8"  x1="50" y1="57.713" x2="50" y2="59.595" stroke-width="33.33"/>
    <line id="bar-9"  x1="50" y1="61.187" x2="50" y2="63.068" stroke-width="33.33"/>
    <line id="bar-10" x1="50" y1="64.660" x2="50" y2="66.541" stroke-width="33.33"/>
    <line id="bar-11" x1="50" y1="68.133" x2="50" y2="70.015" stroke-width="33.33"/>
    <line id="bar-12" x1="50" y1="71.608" x2="50" y2="73.489" stroke-width="33.33"/>
  </g>

</svg>`,fe={alert:{svg:me,orientation:"square",features:["multi-segment","state-based-styling","animation-targets","presets","text-overlay"],segments:{shape:{selector:"#alert-shape path",style:{fill:"theme:components.alert.shape.fill"}},bars:{selector:'[id^="bar-"]',style:{stroke:"theme:components.alert.bars.stroke"}}},zones:{alert_line:{x:15.1,y:25.26,width:69.67,height:13},sub_line:{x:15.1,y:38.26,width:69.67,height:10.11}},text:{alert_text:{zone:"alert_line",content:"ALERT",show:true,position:"center",stretch:true,font_family:"lcards_microgramma, Antonio",font_size_percent:100,padding:{top:2,right:2,bottom:0,left:2}},sub_text:{zone:"sub_line",content:"CONDITION",show:true,stretch:true,font_family:"lcards_microgramma, Antonio",position:"center",font_size_percent:58,padding:{right:2,left:2}}},animations:[{id:"bars-top-sweep",trigger:"on_load",target:"#bar-1, #bar-2, #bar-3, #bar-4, #bar-5, #bar-6",preset:"stagger-flash",params:{grid:[1,6],from:"first",property:"stroke",lead_color:"var(--lcards-moonlight, #dfe1e8)",trail_color:"var(--lcars-ui-quaternary, var(--lcards-gray-dark, #363636))",lead_pct:20,with_opacity:true,trail_opacity:.25,duration:2e3,loop:true}},{id:"bars-bottom-sweep",trigger:"on_load",target:"#bar-7, #bar-8, #bar-9, #bar-10, #bar-11, #bar-12",preset:"stagger-flash",params:{grid:[1,6],from:"last",property:"stroke",lead_color:"var(--lcards-moonlight, #dfe1e8)",trail_color:"var(--lcars-ui-quaternary, var(--lcards-gray-dark, #363636))",lead_pct:20,with_opacity:true,trail_opacity:.25,duration:2e3,loop:true}}],presets:{default:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcars-alert-blue, #0000ff))",trail_color:"base(var(--lcars-ui-quaternary, var(--lcards-gray-dark, #2f3749)))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcars-alert-blue, #0000ff))",trail_color:"base(var(--lcars-ui-quaternary, var(--lcards-gray-dark, #2f3749)))"}}],text:{alert_text:{content:"ALERT",color:"base(var(--lcars-alert-red, #cc0000))"},sub_text:{content:"CONDITION",color:"theme:base(colors.alert.gray)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.gray)"}},bars:{style:{stroke:"theme:base(colors.alert.gray)"}}}},condition_red:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcards-orange-lightest, #ffb399))",trail_color:"base(var(--lcars-alert-red, #cc0000))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcards-orange-lightest, #ffb399))",trail_color:"base(var(--lcars-alert-red, #cc0000))"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.red)"},sub_text:{content:"CONDITION: RED",color:"theme:base(colors.alert.red)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.red)"}},bars:{style:{stroke:"theme:base(colors.alert.red)"}}}},condition_blue:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcards-blue-light, #93e1ff))",trail_color:"base(var(--lcars-alert-blue, #0000ff))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcards-blue-light, #93e1ff))",trail_color:"base(var(--lcars-alert-blue, #0000ff))"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.blue)"},sub_text:{content:"CONDITION: BLUE",color:"theme:base(colors.alert.blue)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.blue)"}},bars:{style:{stroke:"theme:base(colors.alert.blue)"}}}},condition_yellow:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcards-yellow-lightest, #f5f5dc))",trail_color:"base(var(--lcars-alert-yellow, #ffcc00))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcards-yellow-lightest, #f5f5dc))",trail_color:"base(var(--lcars-alert-yellow, #ffcc00))"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.yellow)"},sub_text:{content:"CONDITION: YELLOW",color:"theme:base(colors.alert.yellow)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.yellow)"}},bars:{style:{stroke:"theme:base(colors.alert.yellow)"}}}},condition_green:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcards-green-lightest, #b8e0c1))",trail_color:"base(var(--lcars-green, #33cc99))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcards-green-lightest, #b8e0c1))",trail_color:"base(var(--lcars-green, #33cc99))"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.green)"},sub_text:{content:"CONDITION: GREEN",color:"theme:base(colors.alert.green)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.green)"}},bars:{style:{stroke:"theme:base(colors.alert.green)"}}}},condition_gray:{animations:[{id:"bars-top-sweep",params:{lead_color:"base(var(--lcards-moonlight, #dfe1e8))",trail_color:"base(var(--lcards-gray, #6d748c))"}},{id:"bars-bottom-sweep",params:{lead_color:"base(var(--lcards-moonlight, #dfe1e8))",trail_color:"base(var(--lcards-gray, #6d748c))"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.gray)"},sub_text:{content:"CONDITION: GRAY",color:"theme:base(colors.alert.gray)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.gray)"}},bars:{style:{stroke:"theme:base(colors.alert.gray)"}}}},condition_black:{animations:[{id:"bars-top-sweep",params:{lead_color:"black",trail_color:"theme:base(colors.alert.black)"}},{id:"bars-bottom-sweep",params:{lead_color:"black",trail_color:"theme:base(colors.alert.black)"}}],text:{alert_text:{content:"ALERT",color:"theme:base(colors.alert.black)"},sub_text:{content:"CONDITION: BLACK",color:"theme:base(colors.alert.black)"}},segments:{shape:{style:{fill:"theme:base(colors.alert.black)"}},bars:{style:{stroke:"theme:base(colors.alert.black)"}}}}},validatePreset(a){return a in this.presets},getPresetNames(){return Object.keys(this.presets)},metadata:{type:"alert",card_type:"button",pack:"lcards_buttons",id:"alert",name:"Alert Symbol",description:"LCARS alert symbol: shield design with animated bars and condition presets",version:"2.0.0"}}},ue=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path id="left" d="M26.00 91.57 A48 48 0 0 1 26.00 8.43 L29.00 13.63 A42 42 0 0 0 29.00 86.37 Z" />
  <path id="right" d="M74.00 8.43 A48 48 0 0 1 74.00 91.57 L71.00 86.37 A42 42 0 0 0 71.00 13.63 Z" />
</svg>`,we={brackets:{svg:ue,orientation:"square",features:["multi-segment","state-based-styling","zones","text-overlay"],zones:{center:{x:18,y:18,width:64,height:64},left:{x:2,y:8,width:10,height:84},right:{x:88,y:8,width:10,height:84}},segments:{left:{style:{fill:"theme:colors.ui.secondary",stroke:"none"}},right:{style:{fill:"theme:colors.ui.secondary",stroke:"none"}}},presets:{default:{}},metadata:{type:"brackets",card_type:"button",pack:"lcards_buttons",id:"brackets",name:"Bracket Arcs",description:"Two arcs framing a round display; content goes in the center zone",version:"1.0.0"}}},ke=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path id="sweep" d="M50 50 L50 6 A44 44 0 0 1 78.28 16.29 Z" />
  <circle id="rings" cx="50" cy="50" r="30" />
  <circle id="inner-ring" cx="50" cy="50" r="15" />
  <path id="cross" d="M50 6 V94 M6 50 H94" />
  <circle id="rim" cx="50" cy="50" r="46" />
</svg>`,ye={radar:{svg:ke,orientation:"square",features:["multi-segment","state-based-styling","zones","text-overlay"],zones:{center:{x:30,y:30,width:40,height:40}},segments:{sweep:{style:{fill:"theme:colors.ui.secondary","fill-opacity":.35,stroke:"none"}},rings:{style:{fill:"none",stroke:"theme:colors.ui.secondary","stroke-width":.8}},"inner-ring":{style:{fill:"none",stroke:"theme:colors.ui.secondary","stroke-width":.8}},cross:{style:{fill:"none",stroke:"theme:colors.card.topColor","stroke-width":.8}},rim:{style:{fill:"none",stroke:"theme:colors.ui.primary","stroke-width":3}}},presets:{default:{}},metadata:{type:"radar",card_type:"button",pack:"lcards_buttons",id:"radar",name:"Radar Scope",description:"Round scope with rim, range rings, cross hairs and a sweep wedge",version:"1.0.0"}}},S={...G,...Y,...ge,...W,...fe,...we,...ye};function $e(a){return S[a]}h($e,"getComponent");function xe(a){return a in S}h(xe,"hasComponent");function ve(){return Object.keys(S)}h(ve,"getComponentNames");function ze(a){return Object.entries(S).filter(([,o])=>{var e;return((e=o==null?void 0:o.metadata)==null?void 0:e.card_type)===a}).map(([o])=>o)}h(ze,"getComponentsForCard");function Me(a){const o=S[a];return o?{id:o.id,name:o.name,description:o.description,version:o.version}:null}h(Me,"getComponentMetadata");export{S as components,$e as getComponent,Me as getComponentMetadata,ve as getComponentNames,ze as getComponentsForCard,xe as hasComponent};
//# sourceMappingURL=index-XveABGDs.js.map
