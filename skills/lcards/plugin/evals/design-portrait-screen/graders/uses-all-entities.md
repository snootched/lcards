---
type: regex
target: { source: file, path: phone.yaml }
pattern: '^(?=[\s\S]*input_boolean\.porch_light)(?=[\s\S]*input_boolean\.garage_door)(?=[\s\S]*sensor\.outside_temperature)(?=[\s\S]*sensor\.battery_level)'
weight: 2
---
