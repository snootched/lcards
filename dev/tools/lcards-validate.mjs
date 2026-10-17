#!/usr/bin/env node
import { realpathSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
function getDefaultExportFromCjs$1(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject2(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject2;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException) return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact2) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark) return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact2 && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact2) {
    return this.name + ": " + formatError(this, compact2);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet) return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
      pos: position - lineStart + head.length
      // relative position
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer) return null;
    if (!options.maxLength) options.maxLength = 79;
    if (typeof options.indent !== "number") options.indent = 1;
    if (typeof options.linesBefore !== "number") options.linesBefore = 3;
    if (typeof options.linesAfter !== "number") options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1; i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo - i],
        lineEnds[foundLineNo - i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
        maxLineLength
      );
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
    for (let i = 1; i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo + i],
        lineEnds[foundLineNo + i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
        maxLineLength
      );
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type$2;
var hasRequiredType;
function requireType() {
  if (hasRequiredType) return type$2;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type$2 = Type2;
  return type$2;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema) return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr) return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq) return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap) return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe) return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null) return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null) return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool) return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null) return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt) return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null) return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max) return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1") return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (; index < max; index++) {
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (; index < max; index++) {
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (; index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits) return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-") sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
      if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat) return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null) return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core$3;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core$3;
  hasRequiredCore = 1;
  core$3 = requireJson();
  return core$3;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp) return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  const YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 6e4;
      if (match[9] === "-") delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge) return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary) return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null) return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      const code2 = map2.indexOf(data.charAt(idx));
      if (code2 > 64) continue;
      if (code2 < 0) return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap) return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null) return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]") return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }
      if (!pairHasKey) return false;
      if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs) return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null) return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]") return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1) return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null) return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet) return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null) return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default) return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader) return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return "\n";
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode(
      (c - 65536 >> 10) + 55296,
      (c - 65536 & 1023) + 56320
    );
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      // omit trailing \0
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0) return;
    const parent = transactions[transactions.length - 1];
    const names2 = Object.keys(transaction);
    for (let index = 0, length = names2.length; index < length; index += 1) {
      const name = names2[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names2 = Object.keys(transaction);
    for (let index = names2.length - 1; index >= 0; index -= 1) {
      const entry = transaction[names2[index]];
      if (entry.existed) {
        state.anchorMap[names2[index]] = entry.value;
      } else {
        delete state.anchorMap[names2[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function chargeMergeWork(state) {
    state.totalMergeKeys++;
    if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) {
      throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    chargeMergeWork(state);
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      const key = sourceKeys[index];
      chargeMergeWork(state);
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        if (valueNode.length > 100) {
          throwError(state, "abnormal merge sequence size");
        }
        for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat("\n", count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += "\n";
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat("\n", emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat("\n", emptyLines);
        }
      } else {
        state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33) return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38) return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42) return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(
            state,
            propertyStart,
            propertyStart.position - propertyStart.lineStart,
            flowIndent
          )) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch)) break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0) readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += "\n";
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\0");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\0";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return void 0;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper) return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null) return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length; index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n") result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && // - b-char
    c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && // - c-flow-indicator
      c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && // ns-plain-char
      c !== CHAR_SHARP && // false on '#'
      !(prev === CHAR_COLON && !cIsNsChar) || // false on ': '
      isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || // change to true on '[^ ]#'
      prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
    c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || // No block styles in flow mode.
      state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = function() {
      let nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536) result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact2) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact2 || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "") pairBuffer += ", ";
      if (state.condenseFlow) pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024) pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact2) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (!compact2 || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length; index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact2, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact2 = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact2);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact2);
          } else {
            writeBlockSequence(state, level, state.dump, compact2);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid) return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length; i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length; i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml) return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
const yaml = /* @__PURE__ */ getDefaultExportFromCjs$1(jsYamlExports);
const {
  Type: Type$1,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types: types$1,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;
const CSS_NAMED_COLORS = Object.freeze({
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
});
const CSS_COLOR_KEYWORDS = Object.freeze(["transparent", "currentcolor"]);
const CSS_COLOR_FUNCTIONS = Object.freeze([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix"
]);
const COMPUTED_COLOR_FUNCTIONS = Object.freeze([
  "alpha",
  "darken",
  "lighten",
  "saturate",
  "desaturate",
  "mix",
  "base"
]);
const fnAlternation = (names2) => names2.join("|");
new RegExp(`^\\s*(${fnAlternation(COMPUTED_COLOR_FUNCTIONS)})\\s*\\(`);
new RegExp(`^(${fnAlternation(CSS_COLOR_FUNCTIONS)})\\(`, "i");
const COLOR_VALUE_PATTERN = `^(#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$|(${[...Object.keys(CSS_NAMED_COLORS), ...CSS_COLOR_KEYWORDS, "currentColor", "match-light"].join("|")})$|theme:|var\\(--|(${fnAlternation(CSS_COLOR_FUNCTIONS)})\\(|(${fnAlternation(COMPUTED_COLOR_FUNCTIONS)})\\()`;
const simpleColorSchema$2 = {
  type: "string",
  pattern: COLOR_VALUE_PATTERN,
  description: "Colour value (hex, rgb, named colour, theme token, or CSS variable)",
  "x-ui-hints": { widget: "lcards-color-picker" }
};
const _CANONICAL_REDECLARED = {
  duration: {
    type: ["number", "object"],
    minimum: 0,
    maximum: 1e4,
    description: "Also accepted nested here (top-level wins if both set). Also accepts a map_range descriptor for entity-driven, live-adjusting duration on looping animations."
  },
  ease: {
    type: ["string", "object"],
    description: "Also accepted nested here (top-level wins if both set)."
  },
  loop: {
    oneOf: [{ type: "boolean" }, { type: "integer", minimum: 1 }],
    description: "Also accepted nested here (top-level wins if both set)."
  },
  alternate: {
    type: "boolean",
    description: "Also accepted nested here (top-level wins if both set)."
  },
  delay: {
    type: ["number", "object"],
    minimum: 0,
    description: "Also accepted nested here (top-level wins if both set). Also accepts a map_range descriptor."
  }
};
const pulseParamsSchema = {
  type: "object",
  description: 'Params for the "pulse" preset: breathing scale/brightness effect.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_scale: {
      type: "number",
      minimum: 0.5,
      maximum: 3,
      default: 1.15,
      description: "How much to grow. Falls back to `scale` if set, else 1.15.",
      "x-ui-hints": { label: "Max Scale", selector: { number: { min: 0.5, max: 3, step: 0.05, mode: "slider" } } }
    },
    scale: {
      type: "number",
      minimum: 0.5,
      maximum: 3,
      description: "Legacy alias for max_scale (max_scale wins if both set)."
    },
    max_brightness: {
      type: "number",
      minimum: 1,
      maximum: 3,
      default: 1.4,
      description: "How much to brighten (1.0 = normal).",
      "x-ui-hints": { label: "Max Brightness", selector: { number: { min: 1, max: 3, step: 0.1, mode: "slider" } } }
    }
  },
  additionalProperties: "warn"
};
const fadeParamsSchema = {
  type: "object",
  description: 'Params for the "fade" preset: simple opacity transition.',
  properties: {
    ..._CANONICAL_REDECLARED,
    from: { type: "number", minimum: 0, maximum: 1, default: 1, description: "Starting opacity." },
    to: { type: "number", minimum: 0, maximum: 1, default: 0.3, description: "Target opacity." }
  },
  additionalProperties: "warn"
};
const glowParamsSchema = {
  type: "object",
  description: 'Params for the "glow" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color: { ...simpleColorSchema$2, default: "var(--lcars-blue, #66ccff)", description: "Glow colour. Falls back to `glow_color` if set." },
    glow_color: { ...simpleColorSchema$2, description: "Legacy alias for color, lower precedence." },
    blur_min: { type: "number", minimum: 0, maximum: 50, default: 0 },
    blur_max: { type: "number", minimum: 0, maximum: 50, default: 10 }
  },
  additionalProperties: "warn"
};
const drawParamsSchema = {
  type: "object",
  description: 'Params for the "draw" preset: SVG stroke reveal via anime.js createDrawable.',
  properties: {
    ..._CANONICAL_REDECLARED,
    reverse: {
      type: "boolean",
      default: false,
      description: "If true, draws from end to start. Only affects the default `draw` value: ignored if `draw` is explicitly supplied."
    },
    draw: {
      oneOf: [
        { type: "array", items: { type: "string" }, description: "e.g. ['0 0', '0 1']" },
        { type: "object", properties: { values: { type: "array", items: { type: "string" }, required: true } } }
      ],
      description: "Draw values or {values: [...]}. Defaults to ['0 0','0 1'] (or reversed) based on `reverse`.",
      // A oneOf with an array branch hits a known, separately-tracked bug in
      // FormField's oneOf/choose handling (_prepareValueForSelector has no
      // Array.isArray branch, so an array value always resets to the first
      // choice) — bypass via the code editor rather than ship a broken toggle.
      "x-ui-hints": { widget: "json", label: "Draw Values" }
    }
  },
  additionalProperties: "warn"
};
const marchParamsSchema = {
  type: "object",
  description: 'Params for the "march" preset: CSS-based marching dashed line (bypasses anime.js).',
  properties: {
    ..._CANONICAL_REDECLARED,
    duration: {
      ..._CANONICAL_REDECLARED.duration,
      description: "Used only if `speed` is absent (converted to seconds for a CSS animation-duration). `speed` takes precedence if both are set."
    },
    loop: {
      ..._CANONICAL_REDECLARED.loop,
      default: true,
      description: "Maps to CSS animation-iteration-count: true→infinite, false/0→1, N→N. Uses CSS keyframes, not the generic anime.js loop mechanism."
    },
    speed: { type: "number", minimum: 0, description: "Seconds per cycle. Takes precedence over `duration` if present.", "x-ui-hints": { label: "Speed (sec/cycle, lower = faster)" } },
    direction: { type: "string", enum: ["forward", "reverse"], default: "forward" },
    dash_length: { type: "number", minimum: 0, description: "Auto-detected from the element's stroke-dasharray if absent; fallback 10." },
    gap_length: { type: "number", minimum: 0, description: "Auto-detected from the element's stroke-dasharray if absent; fallback 5." }
  },
  additionalProperties: "warn"
};
const blinkParamsSchema = {
  type: "object",
  description: 'Params for the "blink" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_opacity: { type: "number", minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.3 }
  },
  additionalProperties: "warn"
};
const shimmerParamsSchema$1 = {
  type: "object",
  description: 'Params for the "shimmer" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color_from: { ...simpleColorSchema$2, description: "Must be paired with color_to, else color animation is skipped (opacity still animates)." },
    color_to: { ...simpleColorSchema$2, description: "Falls back to `shimmer_color`. Must be paired with color_from." },
    shimmer_color: { ...simpleColorSchema$2, description: "Legacy alias for color_to, lower precedence." },
    opacity_from: { type: "number", minimum: 0, maximum: 1, default: 1 },
    opacity_to: { type: "number", minimum: 0, maximum: 1, default: 0.5 }
  },
  additionalProperties: "warn"
};
const strobeParamsSchema = {
  type: "object",
  description: 'Params for the "strobe" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    duration: { ..._CANONICAL_REDECLARED.duration, default: 100, description: "Unusually short vs. most presets; strobe is fast by design." },
    max_opacity: { type: "number", minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: "number", minimum: 0, maximum: 1, default: 0 }
  },
  additionalProperties: "warn"
};
const flickerParamsSchema = {
  type: "object",
  description: 'Params for the "flicker" preset. Randomized keyframes are generated once at setup time (not re-randomized per loop cycle). `alternate` has no effect.',
  properties: {
    ..._CANONICAL_REDECLARED,
    max_opacity: { type: "number", minimum: 0, maximum: 1, default: 1 },
    min_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.3 }
  },
  additionalProperties: "warn"
};
const cascadeParamsSchema$1 = {
  type: "object",
  description: 'Params for the "cascade" preset: staggered fade/property tween across multiple targets.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    stagger: { type: "number", minimum: 0, default: 100, description: "Per-element delay (ms). NOT the canonical `delay` field, which is unused here." },
    property: { type: "string", default: "opacity", description: "Arbitrary anime/CSS property name: unvalidated passthrough." },
    from: { type: "number", default: 0 },
    to: { type: "number", default: 1 }
  },
  additionalProperties: "warn"
};
const cascadeColorParamsSchema = {
  type: "object",
  description: 'Params for the "cascade-color" preset: staggered color cascade across a grid/row of targets. NOTE: the default `property` ("color") is correct for its primary intended use (data-grid cells, plain HTML/CSS-rendered) but won\'t visibly work on an SVG-shape target (LCARdS\'s own button/elbow/slider/MSD cards). Set `property` to `fill` or `stroke` for those.',
  properties: {
    ..._CANONICAL_REDECLARED,
    colors: {
      anyOf: [
        { type: "array", minItems: 3, items: { ...simpleColorSchema$2 } },
        {
          type: "object",
          description: "Data grid form: { start, text, end }",
          properties: { start: { ...simpleColorSchema$2 }, text: { ...simpleColorSchema$2 }, end: { ...simpleColorSchema$2 } }
        }
      ],
      description: "Only indices [0],[1],[2] are used; defaults to 3 theme tokens if omitted.",
      "x-ui-hints": { widget: "json", label: "Colors" }
    },
    // Read by lcards-data-grid, which runs one cascade per row (buildCascadeRowTimings).
    pattern: { type: "string", enum: ["default", "niagara", "fast", "custom"], description: "Data grid: per-row timing pattern." },
    speed_multiplier: { type: "number", exclusiveMinimum: 0, description: "Data grid: 2 = twice as fast. Ignored when duration is set." },
    timing: {
      type: "array",
      description: "Data grid: per-row timing for pattern: custom (repeats for further rows).",
      items: {
        type: "object",
        properties: {
          duration: { type: "number", minimum: 0, description: "Colour cycle length in ms" },
          delay: { type: "number", minimum: 0, description: "Row start delay in seconds" }
        }
      }
    },
    property: { type: "string", default: "color", description: "Passthrough key used inside keyframe objects. 'fill'/'stroke' for SVG shapes, 'color'/'background-color' only for plain HTML/CSS-rendered targets." },
    mode: {
      type: "string",
      enum: ["css", "animejs"],
      description: "Both modes actually run through anime.js. Despite the naming, this isn't a CSS-vs-anime.js engine choice. 'animejs' mode adds per-cell stagger (interactive/stagger_from/axis) on top of the base cascade; 'css' mode is the plain synchronized version. Auto-computed from interactive/stagger_from/axis when unset, and force-upgraded to 'animejs' whenever any of those are set even if `mode` was also set explicitly: those fields have no effect at all in 'css' mode, so silently ignoring them would be more surprising than the override."
    },
    interactive: { type: "boolean", default: false, description: "Only wired up (mouseenter/mouseleave pause/play) when mode==='animejs'." },
    stagger_from: { type: "string", enum: ["first", "last", "center", "random"], description: "Not validated in code today: documented values only." },
    stagger_delay: { type: "number", minimum: 0, default: 100, description: "Only relevant in animejs mode." },
    axis: { type: "string", enum: ["row", "column"], default: "row", description: "Not validated in code today: documented values only." },
    delay: { type: "number", minimum: 0, default: 0, description: "Row-level start delay: a legitimate use of the canonical start-offset meaning (unlike the stagger-* presets)." }
  },
  additionalProperties: "warn"
};
const rippleParamsSchema = {
  type: "object",
  description: 'Params for the "ripple" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale_max: { type: "number", minimum: 1, maximum: 5, default: 1.5 },
    opacity_min: { type: "number", minimum: 0, maximum: 1, default: 0 }
  },
  additionalProperties: "warn"
};
const scaleParamsSchema = {
  type: "object",
  description: 'Params for the "scale" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale: { type: "number", minimum: 0.1, maximum: 10, default: 1.1, description: "Target scale." },
    from: { type: "number", minimum: 0.1, maximum: 10, default: 1, description: "Starting scale." }
  },
  additionalProperties: "warn"
};
const scaleResetParamsSchema = {
  type: "object",
  description: 'Params for the "scale-reset" preset. `loop`/`alternate` are hardcoded false in code today and have no effect even if set; see Phase 13.6.',
  properties: {
    ..._CANONICAL_REDECLARED
  },
  additionalProperties: "warn"
};
const slideParamsSchema = {
  type: "object",
  description: 'Params for the "slide" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    from: {
      type: "string",
      enum: ["right", "left", "top", "bottom", "up", "down"],
      default: "right",
      description: "Falls back to `direction`. Actual code default is 'right' (doc previously said 'up'; corrected here, see Phase 13.6)."
    },
    direction: {
      type: "string",
      enum: ["right", "left", "top", "bottom", "up", "down"],
      description: "Legacy alias for `from`, lower precedence."
    },
    distance: {
      oneOf: [{ type: "number" }, { type: "string" }],
      default: 100,
      description: "Number → px. String containing '%' → treated as a percentage."
    }
  },
  additionalProperties: "warn"
};
const rotateParamsSchema = {
  type: "object",
  description: 'Params for the "rotate" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    direction: {
      type: "string",
      enum: ["clockwise", "counterclockwise"],
      description: "If present, entirely overrides from/to: clockwise → [0,360], counterclockwise → [0,-360]."
    },
    from: { type: "number", default: 0, description: "Only used if `direction` is absent." },
    to: { type: "number", default: 360, description: "Only used if `direction` is absent." }
  },
  additionalProperties: "warn"
};
const shakeParamsSchema = {
  type: "object",
  description: 'Params for the "shake" preset. `alternate` has no effect: keyframes always return to 0 regardless.',
  properties: {
    ..._CANONICAL_REDECLARED,
    intensity: { type: "number", minimum: 0, default: 10, description: "Max px displacement." },
    frequency: { type: "number", minimum: 1, default: 4, description: "Number of alternating keyframes generated." }
  },
  additionalProperties: "warn"
};
const bounceParamsSchema = {
  type: "object",
  description: 'Params for the "bounce" preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    scale_max: { type: "number", minimum: 1, maximum: 3, default: 1.2 },
    bounces: {
      type: "number",
      minimum: 1,
      default: 3,
      description: "If > 1, `ease` is force-overridden to 'outQuad' and `duration` is multiplied by `bounces` (see Phase 13.6 re: whether ease should stay overridable here). If <= 1, the user's ease/duration are used unmodified."
    }
  },
  additionalProperties: "warn"
};
const colorShiftParamsSchema = {
  type: "object",
  description: 'Params for the "color-shift" preset. NOTE: the default `property` ("color") only visibly works on plain HTML/CSS-rendered targets; LCARdS\'s own cards (button/elbow/slider/MSD) draw their shapes as SVG paths, which don\'t respond to the CSS `color` property at all. Set `property` to `fill` or `stroke` when targeting an SVG shape.',
  properties: {
    ..._CANONICAL_REDECLARED,
    color_from: { ...simpleColorSchema$2, description: "Required: omitting either color_from or color_to makes the preset a no-op with a warning." },
    color_to: { ...simpleColorSchema$2, description: "Required, see color_from." },
    property: { type: "string", default: "color", description: "'fill'/'stroke' for SVG shapes (LCARdS's own cards), 'color'/'background-color' only for plain HTML/CSS-rendered targets." }
  },
  additionalProperties: "warn"
};
const skewParamsSchema = {
  type: "object",
  description: 'Params for the "skew" preset. Presence of EITHER from_skewX or from_skewY switches skewX/skewY into "to" targets instead of direct targets from 0: a genuine conditional shape (kept as hardcoded editor UI, not schema-driven form, per Phase 13.5).',
  properties: {
    ..._CANONICAL_REDECLARED,
    skewX: { type: "number", default: 0, description: "Degrees." },
    skewY: { type: "number", default: 0, description: "Degrees." },
    from_skewX: { type: "number", default: 0 },
    from_skewY: { type: "number", default: 0 }
  },
  additionalProperties: "warn"
};
const glitchParamsSchema = {
  type: "object",
  description: "Params for the \"glitch\" preset. `ease` is hardcoded to 'linear', ignored. `alternate` has no effect.",
  properties: {
    ..._CANONICAL_REDECLARED,
    intensity: { type: "number", minimum: 0, default: 5, description: "Max px displacement, symmetric around 0." },
    frequency: { type: "number", minimum: 1, default: 10, description: "Number of random keyframes generated." }
  },
  additionalProperties: "warn"
};
const setParamsSchema = {
  type: "object",
  description: 'Params for the "set" preset: direct property assignment (duration/ease/loop/alternate/delay are all ignored; duration is hardcoded 0).',
  properties: {
    properties: {
      type: "object",
      additionalProperties: true,
      default: {},
      description: "Free-form key→value map spread directly into anime params, e.g. {opacity: 0.5, fill: 'red'}. Completely unvalidated shape.",
      "x-ui-hints": { widget: "json", label: "Properties" }
    }
  },
  additionalProperties: "warn"
};
const motionpathParamsSchema = {
  type: "object",
  description: 'Params for the "motionpath" preset: animates an element (or, with `shape` set, a self-created tracer shape) along an SVG path.',
  properties: {
    ..._CANONICAL_REDECLARED,
    path: { type: "string", description: "Required. CSS selector (#id or .class) for the motion-path SVG element." },
    rotate: { type: "boolean", default: true, description: 'Auto-rotate along path (different meaning from the top-level "rotate" preset\'s numeric from/to). A sibling of `shape` below, not a field inside it; controls the motion itself, applies whether or not `shape` is set.' },
    anchor: { type: "string", default: "50% 50%", description: "CSS transform-origin syntax, unvalidated. A sibling of `shape` below, not a field inside it." },
    shape: {
      type: "object",
      description: 'Opt-in: motionpath creates and animates its own shape (a "tracer") instead of moving target/targets, e.g. a traveling dot suggesting energy flow along a line. Mutually exclusive with target/targets (shape wins, with a console warning, if both are set). Field names deliberately mirror line markers\' (marker_start/marker_end) styling options. Appearance only; `rotate`/`anchor` (motion behavior) are separate, sibling `params` fields, not part of this object.',
      properties: {
        type: { type: "string", enum: ["circle", "rect", "diamond"], default: "circle" },
        size: { type: "number", minimum: 1, default: 10, description: "Diameter (circle/diamond) or width/height fallback (rect) in px." },
        width: { type: "number", minimum: 1, description: "rect only: overrides size for width." },
        height: { type: "number", minimum: 1, description: "rect only: overrides size for height." },
        fill: { type: "string", default: "currentColor", "x-ui-hints": { widget: "lcards-color-picker" } },
        stroke: { type: "string", default: "none", "x-ui-hints": { widget: "lcards-color-picker" } },
        stroke_width: { type: "number", minimum: 0, default: 0 }
      },
      additionalProperties: "warn",
      // Fixed, known set of sub-properties — rendered as a structured sub-form
      // (_renderNestedObjectField() in lcards-animation-editor.js), not JSON text.
      "x-ui-hints": { label: "Tracer Shape" }
    }
  },
  additionalProperties: "warn"
};
const sequenceParamsSchema = {
  type: "object",
  description: 'Params for the "sequence" preset: timeline of steps. Each step may set its own duration/ease (falling back to this preset\'s own duration/ease as per-step defaults). Step positioning uses `offset`; the preset factory also accepts the older `at` name as a fallback (translated to `offset` internally); `offset` wins if a step sets both.',
  properties: {
    duration: { type: "number", minimum: 0, maximum: 1e4, default: 2e3, description: "Fallback duration for steps missing their own duration." },
    ease: { type: ["string", "object"], description: "Fallback easing for steps missing their own ease. Default 'outQuad'." },
    loop: { ..._CANONICAL_REDECLARED.loop, default: false },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: true,
        description: "Arbitrary anime.js tween properties at the top level, plus optional duration/ease/offset (or legacy at) overrides."
      },
      description: "Required, at least one step.",
      "x-ui-hints": { widget: "json", label: "Steps" }
    }
  },
  additionalProperties: "warn"
};
const chaosParamsSchema = {
  type: "object",
  description: 'Params for the "chaos" preset: randomized multi-property glitch motion. Does not use the top-level `duration` field at all.',
  properties: {
    ..._CANONICAL_REDECLARED,
    loop: { ..._CANONICAL_REDECLARED.loop, default: true },
    properties: {
      type: "array",
      items: { type: "string" },
      default: ["x", "y", "rotate"],
      description: "'x'/'y' tokens are remapped to translateX/translateY; other tokens (e.g. 'rotate','opacity') used verbatim as the anime property name. Not validated as an array in code today; a non-array truthy value will throw.",
      "x-ui-hints": { widget: "json", label: "Properties" }
    },
    range: {
      type: "object",
      additionalProperties: { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } },
      default: { x: [-50, 50], y: [-50, 50], rotate: [-15, 15] },
      description: "Min/max range per property. Keys should match `properties`. Each value must be a 2-element array or that property's animation is silently skipped.",
      "x-ui-hints": { widget: "json", label: "Range" }
    },
    duration_min: { type: "number", minimum: 0, default: 200, description: "Replaces the canonical `duration` entirely for this preset." },
    duration_max: { type: "number", minimum: 0, default: 800 },
    composition: { type: "string", enum: ["blend", "replace"], default: "blend", description: "Not validated in code today: documented values only." }
  },
  additionalProperties: "warn"
};
const physicsSpringParamsSchema = {
  type: "object",
  description: 'Params for the "physics-spring" preset. `ease`, `duration`, and `alternate` (canonical) are entirely bypassed; spring dynamics determine the effective duration internally. `loop`, however, genuinely is read and respected. Has its own parallel spring-config system separate from the generic `ease: {type:"spring", params:{...}}` path: see Phase 13.6.',
  properties: {
    property: { type: "string", default: "scale", description: "Passthrough anime property name." },
    from: { type: ["number", "string"], description: "Required (typically a number; a color string is also valid for color-like properties)." },
    to: { type: ["number", "string"], description: "Required, see from." },
    stiffness: { type: "number", minimum: 0, default: 100 },
    damping: { type: "number", minimum: 0, default: 10 },
    mass: { type: "number", minimum: 0, default: 1 },
    velocity: { type: "number", default: 0 },
    loop: { ..._CANONICAL_REDECLARED.loop, default: false }
  },
  additionalProperties: "warn"
};
const staggerGridParamsSchema = {
  type: "object",
  description: 'Params for the "stagger-grid" preset: stagger across a [cols, rows] grid of targets.',
  properties: {
    ..._CANONICAL_REDECLARED,
    ease: { ..._CANONICAL_REDECLARED.ease, description: "Default 'outQuad'." },
    alternate: { ..._CANONICAL_REDECLARED.alternate, default: false },
    delay: {
      ..._CANONICAL_REDECLARED.delay,
      default: 100,
      description: "Repurposed as per-element stagger step (ms), NOT the canonical single start-offset."
    },
    grid: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: { type: "number" },
      default: [1, 1],
      description: "Validated in code: warns and no-ops if provided with the wrong shape.",
      "x-ui-hints": { widget: "json", label: "Grid [cols, rows]" }
    },
    from: {
      oneOf: [
        { type: "string", enum: ["start", "end", "center", "edges"] },
        { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } }
      ],
      default: "start",
      description: "Not validated in code today.",
      // A oneOf with an array branch hits a known, separately-tracked bug in
      // FormField's oneOf/choose handling (_prepareValueForSelector has no
      // Array.isArray branch, so an array value always resets to the first
      // choice) — bypass via the code editor rather than ship a broken toggle.
      "x-ui-hints": { widget: "json", label: "From" }
    },
    property: { type: "string", default: "scale" },
    from_value: { type: "number", default: 0.8 },
    to_value: { type: "number", default: 1 }
  },
  additionalProperties: "warn"
};
const staggerWaveParamsSchema = {
  type: "object",
  description: 'Params for the "stagger-wave" preset: wave effect across a linear sequence of targets. Actual code default for `alternate` is false (doc previously said true; corrected here, see Phase 13.6).',
  properties: {
    ..._CANONICAL_REDECLARED,
    alternate: { ..._CANONICAL_REDECLARED.alternate, default: false },
    delay: {
      ..._CANONICAL_REDECLARED.delay,
      default: 100,
      description: "Repurposed as per-element stagger step (ms), NOT the canonical single start-offset."
    },
    direction: {
      type: "string",
      enum: ["normal", "reverse"],
      default: "normal",
      description: "Any value other than 'reverse' collapses to 'normal' in code."
    },
    property: { type: "string", default: "translateY" },
    amplitude: { type: "number", default: -20, description: "Used in a 3-point path [0, amplitude, 0]." }
  },
  additionalProperties: "warn"
};
const staggerRadialParamsSchema = {
  type: "object",
  description: 'Params for the "stagger-radial" preset: stagger radiating from a point. `alternate` is not read at all by this preset.',
  properties: {
    ..._CANONICAL_REDECLARED,
    delay: {
      ..._CANONICAL_REDECLARED.delay,
      default: 50,
      description: "Repurposed as per-element stagger step (ms), NOT the canonical single start-offset."
    },
    from: {
      oneOf: [
        { type: "string", enum: ["center"] },
        { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } }
      ],
      default: "center",
      description: "'center' or an [x,y] pixel position. Unvalidated.",
      // See stagger-grid.from's comment — same known oneOf/array selector bug.
      "x-ui-hints": { widget: "json", label: "From" }
    },
    property: { type: "string", default: "scale" },
    from_value: { type: "number", default: 0 },
    to_value: { type: "number", default: 1 }
  },
  additionalProperties: "warn"
};
const staggerFlashParamsSchema = {
  type: "object",
  description: 'Params for the "stagger-flash" preset: WAAPI-driven flash sweep, bypassing anime.js entirely for the real visual effect.',
  properties: {
    lead_color: { ...simpleColorSchema$2, default: "var(--primary-color)" },
    trail_color: { ...simpleColorSchema$2, default: "#444444" },
    lead_pct: { type: "number", minimum: 1, maximum: 50, default: 20, description: "Clamped in code to [1, 50]." },
    duration: { type: "number", minimum: 0, default: 2e3, description: "Total WAAPI cycle duration." },
    delay: {
      type: "number",
      minimum: 0,
      description: "Per-element stagger step (ms). Dynamic default: round(duration / 12). NOT the canonical single start-offset."
    },
    grid: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: { type: "number" },
      description: "No length validation. Only forwarded into the (mostly inert) anime stagger config.",
      "x-ui-hints": { widget: "json", label: "Grid [cols, rows]" }
    },
    from: { type: "string", enum: ["first", "last", "center"], default: "first" },
    property: { type: "string", default: "stroke", description: "Used as a Web Animations API keyframe property name; must be WAAPI-animatable." },
    with_opacity: { type: "boolean", default: true },
    trail_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.25 },
    loop: { type: "boolean", default: true, description: "Maps to WAAPI iterations: Infinity vs 1, not the generic anime.js loop mechanism." }
  },
  additionalProperties: "warn"
};
const textRevealParamsSchema = {
  type: "object",
  description: 'Params for the "text-reveal" preset: character/word/line reveal.',
  properties: {
    ..._CANONICAL_REDECLARED,
    split: { type: "string", enum: ["chars", "words", "lines"], default: "chars", description: 'Not a strict whitelist in code: anything not exactly "lines"/"words" falls back to chars.' },
    direction: {
      type: "string",
      default: "first",
      description: "Stagger origin (same family as anime's stagger() `from`: first/last/center/random/numeric index). Unvalidated."
    },
    stagger: { type: "number", minimum: 0, default: 50, description: "Per-unit delay step. Canonical `delay` is unused here." },
    from_opacity: { type: "number", minimum: 0, maximum: 1, default: 0 },
    from_y: { type: "number", default: 20, description: "px, used in translateY." }
  },
  additionalProperties: "warn"
};
const textScrambleParamsSchema = {
  type: "object",
  description: 'Params for the "text-scramble" preset: self-managed per-character scramble, bypassing the normal preset-level anime dispatch. `ease`/`alternate` (canonical) are accepted but ignored.',
  properties: {
    duration: { type: "number", minimum: 0, default: 800, description: "ms each character spends scrambling before settling." },
    stagger: { type: "number", minimum: 0, default: 40, description: "ms between each character starting." },
    delay: { type: "number", minimum: 0, default: 0, description: "A legitimate use of the canonical meaning: ms before the first character begins." },
    loop: { type: "boolean", default: false },
    settle_at: { type: "number", minimum: 0, maximum: 1, default: 0.85, description: "Fraction of duration. Not clamped in code today; values outside 0-1 produce nonsensical results." },
    characters: { type: "string", default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*", description: "Character pool. An empty string is an unguarded edge case in code today." }
  },
  additionalProperties: "warn"
};
const textGlitchParamsSchema = {
  type: "object",
  description: "Params for the \"text-glitch\" preset. `ease` (canonical) is hardcoded to 'inOutQuad', ignored.",
  properties: {
    intensity: { type: "number", minimum: 0, default: 5, description: "Max px/SVG-unit displacement." },
    duration: { type: "number", minimum: 0, default: 300, description: "ms per glitch cycle." },
    stagger: { type: "number", minimum: 0, default: 50, description: "ms offset between characters. Canonical `delay` is unused here." },
    color_shift: { type: "boolean", default: false, description: "HTML target path only: silently ignored for SVG elements." },
    loop: { type: "boolean", default: false }
  },
  additionalProperties: "warn"
};
const textTypewriterParamsSchema = {
  type: "object",
  description: "Params for the \"text-typewriter\" preset. `duration` (canonical) is hardcoded to 1, ignored. `ease` hardcoded 'linear'. `alternate`/`delay` (canonical) never read.",
  properties: {
    speed: { type: "number", minimum: 0, default: 100, description: "ms per character." },
    loop: { type: "boolean", default: false }
  },
  additionalProperties: "warn"
};
const timelineCascadeParamsSchema = {
  type: "object",
  description: "Params for the \"timeline-cascade\" preset: multi-step timeline. Timing/easing for each step lives in that step's own config; the top-level canonical `duration`/`ease` are genuinely inert (confirmed against anime.js's own source: Timeline recomputes its own duration from its children regardless, and `ease` isn't read by the underlying Timer class at all; only a separate `playbackEase` is). `loop`/`alternate`/`delay`, however, do still apply: they govern the whole timeline's repeat/reverse/start-delay behavior, since Timeline extends Timer and inherits those from the same top-level params.",
  properties: {
    loop: { type: "boolean", default: false },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          targets: { type: "string", description: "CSS selector. Falls back to the element being animated if absent." },
          params: { type: "object", additionalProperties: true, description: "Arbitrary anime.js props, e.g. scale/opacity." },
          duration: { type: "number", minimum: 0 },
          offset: {
            oneOf: [{ type: "number" }, { type: "string" }],
            description: "'+=' relative, '<' overlap-with-previous, or an absolute ms number."
          }
        },
        additionalProperties: true
      },
      "x-ui-hints": { widget: "json", label: "Steps" }
    }
  },
  additionalProperties: "warn"
};
const timelineAttentionParamsSchema = {
  type: "object",
  description: "Params for the \"timeline-attention\" preset: 3-phase scale/shake/settle sequence. The top-level canonical `duration`/`ease` are genuinely inert (durations are hardcoded to the duration_* fields below, and each phase's easing is hardcoded in source with no override; confirmed via anime.js's own source that Timeline discards a top-level duration and never reads `ease` at all). Of the remaining canonical fields, only `loop` is actually forwarded by the preset factory (repeats the whole 3-phase sequence); `alternate`/`delay` are never read by this preset's code despite being generically available on the Timeline class, so they were deliberately left out of this schema.",
  properties: {
    loop: { type: "boolean", default: false, description: "Repeats the whole 3-phase sequence." },
    scale_max: { type: "number", minimum: 1, default: 1.15 },
    shake_intensity: { type: "number", minimum: 0, default: 5, description: "Used to build a fixed 5-point translateX keyframe array." },
    duration_scale: { type: "number", minimum: 0, default: 200, description: "Duration of phase 1 (scale up)." },
    duration_shake: { type: "number", minimum: 0, default: 300, description: "Duration of phase 2 (shake)." },
    duration_settle: { type: "number", minimum: 0, default: 400, description: "Duration of phase 3 (settle back)." }
  },
  additionalProperties: "warn"
};
const ANIMATION_PRESET_PARAMS_SCHEMAS = {
  pulse: pulseParamsSchema,
  fade: fadeParamsSchema,
  glow: glowParamsSchema,
  draw: drawParamsSchema,
  march: marchParamsSchema,
  blink: blinkParamsSchema,
  shimmer: shimmerParamsSchema$1,
  strobe: strobeParamsSchema,
  flicker: flickerParamsSchema,
  cascade: cascadeParamsSchema$1,
  "cascade-color": cascadeColorParamsSchema,
  ripple: rippleParamsSchema,
  scale: scaleParamsSchema,
  "scale-reset": scaleResetParamsSchema,
  slide: slideParamsSchema,
  rotate: rotateParamsSchema,
  shake: shakeParamsSchema,
  bounce: bounceParamsSchema,
  "color-shift": colorShiftParamsSchema,
  skew: skewParamsSchema,
  glitch: glitchParamsSchema,
  set: setParamsSchema,
  motionpath: motionpathParamsSchema,
  sequence: sequenceParamsSchema,
  chaos: chaosParamsSchema,
  "physics-spring": physicsSpringParamsSchema,
  "stagger-grid": staggerGridParamsSchema,
  "stagger-wave": staggerWaveParamsSchema,
  "stagger-radial": staggerRadialParamsSchema,
  "stagger-flash": staggerFlashParamsSchema,
  "text-reveal": textRevealParamsSchema,
  "text-scramble": textScrambleParamsSchema,
  "text-glitch": textGlitchParamsSchema,
  "text-typewriter": textTypewriterParamsSchema,
  "timeline-cascade": timelineCascadeParamsSchema,
  "timeline-attention": timelineAttentionParamsSchema
};
function _mapRangeAware(fieldSchema) {
  return {
    oneOf: [
      fieldSchema,
      {
        type: "object",
        properties: { map_range: { type: "object", additionalProperties: true, required: true } },
        additionalProperties: false
      }
    ]
  };
}
function _mapRangeAwareVariant(paramsSchema) {
  if (!paramsSchema || !paramsSchema.properties) return paramsSchema;
  const wrappedProperties = {};
  for (const [key, fieldSchema] of Object.entries(paramsSchema.properties)) {
    wrappedProperties[key] = _mapRangeAware(fieldSchema);
  }
  return { ...paramsSchema, properties: wrappedProperties };
}
const ANIMATION_PRESET_PARAMS_SCHEMAS_MAPRANGE_AWARE = Object.fromEntries(
  Object.entries(ANIMATION_PRESET_PARAMS_SCHEMAS).map(([name, schema2]) => [name, _mapRangeAwareVariant(schema2)])
);
const simpleColorSchema$1 = {
  type: "string",
  pattern: COLOR_VALUE_PATTERN,
  description: "Colour value (hex, rgb, theme token, CSS variable, or a computed alpha()/lighten()/darken() expression).",
  "x-ui-hints": { widget: "lcards-color-picker" }
};
const _opacitySchema = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 1,
  description: "Overall effect opacity.",
  "x-ui-hints": { label: "Opacity", selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } }
};
const gridParamsSchema = {
  type: "object",
  description: 'Params for the "grid" preset: orthogonal scrolling grid with optional major/minor divisions.',
  properties: {
    line_spacing: {
      type: "number",
      minimum: 1,
      default: 40,
      description: "Pixel spacing between minor lines. Confirmed unclamped in code: 0 or unset-with-falsy hangs the tile loop (Infinity tiles), hence the minimum.",
      "x-ui-hints": { selector: { number: { min: 1, max: 200, step: 1, mode: "slider" } } }
    },
    num_rows: { type: "integer", minimum: 1, maximum: 100, description: "Cell-based sizing alternative to line_spacing: exact row count." },
    num_cols: { type: "integer", minimum: 1, maximum: 100, description: "Cell-based sizing alternative to line_spacing: exact column count." },
    line_width_minor: { type: "number", minimum: 0, default: 1, description: "Minor line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    line_width_major: { type: "number", minimum: 0, default: 2, description: "Major (emphasised) line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    color: { ...simpleColorSchema$1, default: "rgba(255, 153, 102, 0.3)", description: "Minor line color." },
    color_major: { ...simpleColorSchema$1, description: "Major line color: falls back to color if unset." },
    major_row_interval: { type: "integer", minimum: 0, default: 0, description: "Draw a major line every N rows (0 = disabled).", "x-ui-hints": { selector: { number: { min: 0, max: 20, step: 1, mode: "slider" } } } },
    major_col_interval: { type: "integer", minimum: 0, default: 0, description: "Draw a major line every N columns (0 = disabled).", "x-ui-hints": { selector: { number: { min: 0, max: 20, step: 1, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 20, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 20, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    pattern: {
      type: "string",
      enum: ["both", "horizontal", "vertical", "diagonal", "hexagonal", "dots"],
      default: "both",
      description: "Grid line pattern: all 6 values are fully working (GridEffect.js's _drawDotsPattern etc.), and all 6 are exposed in the editor's Pattern dropdown."
    },
    dot_radius: { type: "number", minimum: 0, default: 2, description: 'Dot radius in px: only used when pattern is "dots".', "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    hex_radius: { type: "number", minimum: 1, default: 40, description: 'Hexagon size in px: only used when pattern is "hexagonal". Unclamped in code: 0 collapses the hex tiling, hence the minimum.', "x-ui-hints": { selector: { number: { min: 1, max: 150, step: 1, mode: "slider" } } } },
    show_border_lines: { type: "boolean", default: true, description: "Draw lines at canvas edges." },
    fill_color: { ...simpleColorSchema$1, default: "transparent", description: "Solid fill painted behind each cell." },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const gridDiagonalParamsSchema = {
  type: "object",
  description: 'Params for the "grid-diagonal" preset: 45° hatched variant of grid. Pattern is hardcoded to diagonal, not user-overridable.',
  properties: {
    line_spacing: { type: "number", minimum: 1, default: 30, description: "Pixel spacing between lines. Unclamped in code: 0 hangs the tile loop, hence the minimum.", "x-ui-hints": { selector: { number: { min: 1, max: 200, step: 1, mode: "slider" } } } },
    line_width: { type: "number", minimum: 0, default: 1, description: "Line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    color: { ...simpleColorSchema$1, default: "rgba(255, 153, 102, 0.25)", description: "Line color." },
    scroll_speed_x: { type: "number", default: 15, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 15, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    fill_color: { ...simpleColorSchema$1, default: "transparent", description: "Solid fill painted behind each cell." },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const gridHexagonalParamsSchema = {
  type: "object",
  description: 'Params for the "grid-hexagonal" preset: honeycomb hex-grid variant of grid. Pattern is hardcoded to hexagonal, not user-overridable.',
  properties: {
    hex_radius: { type: "number", minimum: 1, default: 40, description: "Hexagon size in px. Unclamped in code: 0 hangs the tile loop (patternWidth=0), hence the minimum.", "x-ui-hints": { selector: { number: { min: 1, max: 150, step: 1, mode: "slider" } } } },
    line_width_minor: { type: "number", minimum: 0, default: 1, description: "Minor line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    line_width_major: { type: "number", minimum: 0, default: 2, description: "Major line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    color: { ...simpleColorSchema$1, default: "rgba(255, 153, 102, 0.3)", description: "Minor line color." },
    color_major: { ...simpleColorSchema$1, default: "rgba(255, 153, 102, 0.6)", description: "Major line color." },
    major_row_interval: { type: "integer", minimum: 0, default: 3, description: "Draw a major line every N rows.", "x-ui-hints": { selector: { number: { min: 0, max: 20, step: 1, mode: "slider" } } } },
    major_col_interval: { type: "integer", minimum: 0, default: 3, description: "Draw a major line every N columns.", "x-ui-hints": { selector: { number: { min: 0, max: 20, step: 1, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 20, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 20, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    fill_color: { ...simpleColorSchema$1, default: "transparent", description: "Solid fill painted behind each cell." },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const starfieldParamsSchema = {
  type: "object",
  description: 'Params for the "starfield" preset: scrolling parallax star field.',
  properties: {
    seed: { type: "integer", description: "Random seed: same seed always generates the same star layout. Random by default when unset." },
    count: { type: "integer", minimum: 0, default: 150, description: "Number of stars.", "x-ui-hints": { selector: { number: { min: 0, max: 500, step: 10, mode: "slider" } } } },
    min_radius: { type: "number", minimum: 0, default: 0.5, description: "Smallest star radius in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.1, mode: "slider" } } } },
    max_radius: { type: "number", minimum: 0, default: 2, description: "Largest star radius in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.1, mode: "slider" } } } },
    min_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.3, description: "Dimmest star opacity.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    max_opacity: { type: "number", minimum: 0, maximum: 1, default: 1, description: "Brightest star opacity.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    colors: {
      type: "array",
      items: simpleColorSchema$1,
      default: ["#ffffff"],
      description: "Star color(s); also accepts a single color via the legacy `color` field.",
      "x-ui-hints": { widget: "json", label: "Colors" }
    },
    scroll_speed_x: { type: "number", default: 30, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 0, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    parallax_layers: { type: "integer", minimum: 1, maximum: 5, default: 3, description: "Number of depth layers: more layers = more depth. Clamped in code to 1-5.", "x-ui-hints": { selector: { number: { min: 1, max: 5, step: 1, mode: "slider" } } } },
    depth_factor: { type: "number", minimum: 0, maximum: 1, default: 0.5, description: "Speed variation between layers. Clamped in code to 0-1.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const nebulaParamsSchema = {
  type: "object",
  description: 'Params for the "nebula" preset: layered Perlin-noise cloud blobs.',
  properties: {
    seed: { type: "integer", description: "Random seed: same seed always generates the same cloud layout. Random by default when unset." },
    cloud_count: { type: "integer", minimum: 1, maximum: 10, default: 4, description: "Number of cloud blobs. Clamped in code to 1-10.", "x-ui-hints": { selector: { number: { min: 1, max: 10, step: 1, mode: "slider" } } } },
    min_radius: { type: "number", minimum: 0, maximum: 1, default: 0.15, description: "Smallest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.01, mode: "slider" } } } },
    max_radius: { type: "number", minimum: 0, maximum: 1, default: 0.4, description: "Largest cloud radius, as a fraction of canvas size. Clamped in code to 0-1.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.01, mode: "slider" } } } },
    min_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.3, description: "Dimmest cloud opacity.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    max_opacity: { type: "number", minimum: 0, maximum: 1, default: 0.8, description: "Brightest cloud opacity.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    colors: {
      type: "array",
      items: simpleColorSchema$1,
      default: ["#FF00FF"],
      description: "Cloud color(s); also accepts a single color via the legacy `color` field.",
      "x-ui-hints": { widget: "json", label: "Colors" }
    },
    turbulence: { type: "number", minimum: 0, maximum: 1, default: 0.5, description: "How ragged/organic the cloud edges are. Clamped in code to 0-1.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    noise_scale: { type: "number", minimum: 1e-4, default: 3e-3, description: "Noise detail: lower = larger, smoother features.", "x-ui-hints": { selector: { number: { min: 5e-4, max: 0.02, step: 5e-4, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 5, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 5, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const contourFieldParamsSchema = {
  type: "object",
  description: 'Params for the "contour-field" preset: topographic-style banded noise field. Defaults below are the REAL zero-config resolved values (verified against ContourFieldEffect.js/presets/index.js), not the sparser set previously shown in guide.params; the shipped default is a visible tinted fill with a 5-stop gradient, not transparent/single-color.',
  properties: {
    seed: { type: "integer", description: "Random seed: same seed + settings always generates the same field. Random by default when unset." },
    noise_scale: { type: "number", minimum: 1e-4, default: 5e-3, description: "Smaller = a few large drifting blobs; larger = many small, busy ripples.", "x-ui-hints": { selector: { number: { min: 5e-4, max: 0.02, step: 5e-4, mode: "slider" } } } },
    num_octaves: { type: "integer", minimum: 1, maximum: 8, default: 2, description: "Layers of fine detail: 1 = smooth blobs, 8 = rough, cloud-like fuzz. Clamped in code to 1-8.", "x-ui-hints": { selector: { number: { min: 1, max: 8, step: 1, mode: "slider" } } } },
    num_bands: { type: "integer", minimum: 2, maximum: 64, default: 5, description: "Low = bold stepped contour rings; high = a smooth, near-continuous gradient. Clamped in code to 2-64; this floor is load-bearing (num_bands=1 divides by zero internally).", "x-ui-hints": { selector: { number: { min: 2, max: 64, step: 1, mode: "slider" } } } },
    cell_size: { type: "integer", minimum: 1, maximum: 16, default: 1, description: "Sample resolution: larger is blockier/cheaper, smaller is crisper/costlier. Clamped in code to 1-16.", "x-ui-hints": { selector: { number: { min: 1, max: 16, step: 1, mode: "slider" } } } },
    fill_level: { type: "number", minimum: 0, maximum: 0.95, default: 0.45, description: "0 = no water, full terrain visible; raise it to flood the lowest rings. Clamped in code to 0-0.95.", "x-ui-hints": { selector: { number: { min: 0, max: 0.95, step: 0.05, mode: "slider" } } } },
    fill_color: { ...simpleColorSchema$1, default: "rgba(19, 11, 129, 0.3)", description: `Color painted over flooded rings. Real zero-config default resolves to this (the var()-token fallback's literal hex/alpha equivalent); leave unset only if you actually want it, "leave empty for transparency" in older docs was misleading since fill_level defaults to a non-zero 0.45.` },
    blend_colors: { type: "boolean", default: true, description: "On = colors fade smoothly between rings; off = hard-cutoff flat rings." },
    colors: {
      type: "array",
      items: simpleColorSchema$1,
      default: ["alpha(#130b81, 0.08)", "alpha(#130b81, 0.25)", "alpha(#130b81, 0.42)", "alpha(#130b81, 0.62)", "alpha(#130b81, 0.80)"],
      description: "One color, or several stops spread across the full contour range. Default shown here is the exact shipped default (5 alpha-graded stops of the same base hue).",
      "x-ui-hints": { widget: "json", label: "Colors" }
    },
    scroll_speed_x: { type: "number", default: -3, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -20, max: 20, step: 0.5, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 0.45, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -20, max: 20, step: 0.5, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const cascadeParamsSchema = {
  type: "object",
  description: `Params for the "cascade" preset: LCARS waterfall colour-cycling data grid. A single instance changes every matched cell in sync (mode: css's delay is one flat value); the row-by-row "waterfall" look (including the niagara timing pattern) requires declaring multiple separate instances, one per row; see lcards-data-grid's animation.pattern option, which automates that.`,
  properties: {
    num_rows: { type: "integer", minimum: 1, description: "Explicit row count. Unclamped in code: 0 or negative throws a RangeError, hence the minimum." },
    num_cols: { type: "integer", minimum: 1, description: "Explicit column count. Unclamped in code: 0 or negative throws a RangeError, hence the minimum." },
    format: {
      type: "string",
      enum: ["digit", "float", "alpha", "hex", "mixed"],
      default: "hex",
      description: 'Character set. Confirmed real enum from code; guide.params only vaguely said "hex digits" without enumerating the other 4.'
    },
    pattern: {
      type: "string",
      enum: ["default", "niagara", "fast", "custom"],
      default: "default",
      description: '"default" = authentic LCARS rhythm, "niagara" = uniform waterfall, "fast", or "custom" (requires a hand-authored `timing` array, YAML only). Unrecognized values silently fall back to "default".'
    },
    speed_multiplier: { type: "number", minimum: 0.1, default: 1, description: "Overall cycling speed multiplier. Unclamped in code: 0 makes the cycle duration Infinity (frozen), hence the practical floor.", "x-ui-hints": { selector: { number: { min: 0.1, max: 5, step: 0.1, mode: "slider" } } } },
    colors: {
      type: "object",
      description: "The three-stop color cycle. Real runtime shape is a genuinely nested object (config.colors.start/text/end), not flattened keys.",
      properties: {
        start: { ...simpleColorSchema$1, default: "#93e1ff", description: "Color a cell starts at. Shown here as the concrete hex equivalent of the real fallback (var(--lcards-blue-light, #93e1ff))." },
        text: { ...simpleColorSchema$1, default: "#002241", description: "Color a cell settles at mid-cycle. Concrete equivalent of var(--lcards-blue-darkest, #002241)." },
        end: { ...simpleColorSchema$1, default: "#dfe1e8", description: "Color a cell ends at. Concrete equivalent of var(--lcards-moonlight, #dfe1e8)." }
      },
      additionalProperties: false,
      "x-ui-hints": { label: "Colors" }
    },
    font_size: { type: "number", minimum: 1, default: 10, description: "Character font size in px. Unclamped: 0 combined with gap:0 throws a RangeError, hence the minimum.", "x-ui-hints": { selector: { number: { min: 4, max: 40, step: 1, mode: "slider" } } } },
    gap: { type: "number", minimum: 0, default: 4, description: "Spacing between cells in px.", "x-ui-hints": { selector: { number: { min: 0, max: 20, step: 1, mode: "slider" } } } },
    refresh_interval: { type: "integer", minimum: 0, default: 0, description: "How often cells re-randomize, in ms (0 = continuous).", "x-ui-hints": { selector: { number: { min: 0, max: 5e3, step: 100, mode: "slider" } } } },
    duration: { type: "integer", minimum: 1, description: "Explicit cycle duration override in ms." },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const levelParamsSchema = {
  type: "object",
  description: 'Params for the "level" preset: animated tank/gauge fill bar.',
  properties: {
    color_a: { ...simpleColorSchema$1, default: "rgba(0,200,100,0.7)", description: "Primary fill color (or gradient start)." },
    color_b: { ...simpleColorSchema$1, description: "Gradient end color: omit for a flat fill." },
    gradient_crossover: { type: "number", minimum: 0, maximum: 100, default: 80, description: "Percent of fill height where the gradient crosses over. Clamped in code to 0-100.", "x-ui-hints": { selector: { number: { min: 0, max: 100, step: 1, mode: "slider" } } } },
    fill_pct: { type: "number", minimum: 0, maximum: 100, default: 50, description: "Fill level, 0-100. Clamped in code.", "x-ui-hints": { selector: { number: { min: 0, max: 100, step: 1, mode: "slider" } } } },
    direction: {
      type: "string",
      enum: ["up", "down", "left", "right"],
      default: "up",
      description: "Fill direction: all 4 values render correctly ('down'/'left' are implemented as a Canvas2D mirror of the 'up'/'right' geometry)."
    },
    edge_glow: { type: "boolean", default: true, description: "Whether to draw a glow along the fill edge." },
    edge_glow_color: { ...simpleColorSchema$1, default: "rgba(255,255,255,0.7)", description: "Edge glow color." },
    edge_glow_width: { type: "number", minimum: 0, default: 6, description: "Edge glow width in px.", "x-ui-hints": { selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } } },
    wave_height: { type: "number", minimum: 0, default: 4, description: "Primary wave amplitude in px.", "x-ui-hints": { selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } } },
    wave_speed: { type: "number", default: 20, description: "Primary wave speed.", "x-ui-hints": { selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } },
    wave_count: { type: "integer", minimum: 1, default: 4, description: "Primary wave count across the width. Not rounded in code if fractional; a non-integer produces a visible seam at the wrap edge, hence typed integer here.", "x-ui-hints": { selector: { number: { min: 1, max: 20, step: 1, mode: "slider" } } } },
    wave2_height: { type: "number", minimum: 0, default: 0, description: "Secondary wave amplitude in px (0 = disabled).", "x-ui-hints": { selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } } },
    wave2_count: { type: "integer", minimum: 1, default: 5, description: "Secondary wave count. Same integer-only reasoning as wave_count.", "x-ui-hints": { selector: { number: { min: 1, max: 20, step: 1, mode: "slider" } } } },
    wave2_speed: { type: "number", default: -15, description: "Secondary wave speed.", "x-ui-hints": { selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } },
    slosh_amount: { type: "number", minimum: 0, maximum: 1, default: 0, description: "Sloshing displacement amount (0 = disabled). Clamped in code to 0-1.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    slosh_period: { type: "number", minimum: 0.5, default: 3, description: "Sloshing cycle period in seconds. Code enforces an effective 0.5 floor (Math.max(0.5, ...)).", "x-ui-hints": { selector: { number: { min: 0.5, max: 10, step: 0.5, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const fluidParamsSchema = {
  type: "object",
  description: 'Params for the "fluid" preset: swirling single-colour noise wash.',
  properties: {
    color: { ...simpleColorSchema$1, default: "rgba(100,180,255,0.8)", description: "Wash color." },
    base_frequency: { type: "number", minimum: 1e-4, default: 0.01, description: "Noise detail: lower = larger features.", "x-ui-hints": { selector: { number: { min: 1e-3, max: 0.05, step: 1e-3, mode: "slider" } } } },
    num_octaves: { type: "integer", minimum: 1, maximum: 8, default: 4, description: "Layers of noise detail: perf cost scales with this, practical max ~8.", "x-ui-hints": { selector: { number: { min: 1, max: 8, step: 1, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 7, description: "Horizontal drift speed.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 10, description: "Vertical drift speed.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const plasmaParamsSchema = {
  type: "object",
  description: 'Params for the "plasma" preset: two-colour plasma noise bands.',
  properties: {
    color_a: { ...simpleColorSchema$1, default: "rgba(80,0,255,0.9)", description: "First plasma color." },
    color_b: { ...simpleColorSchema$1, default: "rgba(255,40,120,0.9)", description: "Second plasma color." },
    base_frequency: { type: "number", minimum: 1e-4, default: 0.012, description: "Noise detail: lower = larger features.", "x-ui-hints": { selector: { number: { min: 1e-3, max: 0.05, step: 1e-3, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 8, description: "Horizontal drift speed.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 5, description: "Vertical drift speed.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const flowParamsSchema = {
  type: "object",
  description: 'Params for the "flow" preset: directional streaming noise streaks.',
  properties: {
    color: { ...simpleColorSchema$1, default: "rgba(0,200,255,0.7)", description: "Streak color." },
    base_frequency: { type: "number", minimum: 1e-4, default: 0.012, description: "Noise detail: lower = larger features.", "x-ui-hints": { selector: { number: { min: 1e-3, max: 0.05, step: 1e-3, mode: "slider" } } } },
    wave_scale: { type: "number", minimum: 0, default: 8, description: "Streak waviness.", "x-ui-hints": { selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } } },
    scroll_speed_x: { type: "number", default: 50, description: "Horizontal stream speed.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 0, description: "Vertical stream speed.", "x-ui-hints": { selector: { number: { min: -100, max: 100, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const shimmerParamsSchema = {
  type: "object",
  description: 'Params for the "shimmer" preset: sweeping highlight band.',
  properties: {
    color: { ...simpleColorSchema$1, default: "rgba(255,255,255,0.55)", description: "Highlight color." },
    highlight_width: { type: "number", minimum: 0, default: 0.35, description: "Band width as a fraction of canvas size.", "x-ui-hints": { selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } } },
    speed: { type: "number", default: 2.5, description: "Sweep speed.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.1, mode: "slider" } } } },
    angle: { type: "number", minimum: 0, maximum: 360, default: 30, description: "Sweep angle in degrees. Unbounded in code (raw sin/cos of the angle) but periodic, so 0-360 is the sensible UI range.", "x-ui-hints": { selector: { number: { min: 0, max: 360, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const scanlinesParamsSchema = {
  type: "object",
  description: 'Params for the "scanlines" preset: static CRT-style scanline overlay.',
  properties: {
    color: { ...simpleColorSchema$1, default: "rgba(0,0,0,0.25)", description: "Scanline color." },
    line_spacing: { type: "number", minimum: 1, default: 4, description: "Pixel spacing between lines.", "x-ui-hints": { selector: { number: { min: 1, max: 30, step: 1, mode: "slider" } } } },
    line_width: { type: "number", minimum: 0, default: 1.5, description: "Line thickness in px.", "x-ui-hints": { selector: { number: { min: 0, max: 10, step: 0.5, mode: "slider" } } } },
    direction: { type: "string", enum: ["horizontal", "vertical"], default: "horizontal", description: "Both values confirmed correctly implemented in code." },
    scroll_speed_x: { type: "number", default: 0, description: "Horizontal scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    scroll_speed_y: { type: "number", default: 0, description: "Vertical scroll speed in px/s.", "x-ui-hints": { selector: { number: { min: -30, max: 30, step: 1, mode: "slider" } } } },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const imageParamsSchema = {
  type: "object",
  description: 'Params for the "image" preset: user-supplied image rendered behind the full card area. Field is `source` (not `url`; a page of docs previously used `url` throughout, which never worked; fixed).',
  properties: {
    source: { type: "string", default: "", description: "/local/ path, https:// URL, builtin:<key> reference, media-source://… content ID, or a template string (e.g. entity_picture)." },
    size: {
      oneOf: [
        { type: "string", enum: ["cover", "contain", "fill"] },
        { type: "string", pattern: "^\\d+px$" }
      ],
      default: "cover",
      description: '"cover"/"contain"/"fill", or an explicit "<n>px" size for the shorter axis. Any other string silently falls back to "cover".'
    },
    position: { type: "string", default: "center", description: "CSS background-position string. Not enum-validated in code: free-form." },
    repeat: { type: "boolean", default: false, description: "Tile the image instead of scaling it." },
    opacity: _opacitySchema
  },
  additionalProperties: "warn"
};
const solidParamsSchema = {
  type: "object",
  description: 'Params for the "solid" preset: flat single-colour fill, the cheapest background preset (no procedural noise).',
  properties: {
    color: { ...simpleColorSchema$1, default: "rgba(0, 0, 0, 0.4)", description: "Fill color: the alpha channel controls how much shows through base_svg." },
    opacity: { ..._opacitySchema, description: "Multiplies with any alpha already present in color." }
  },
  additionalProperties: "warn"
};
const BACKGROUND_ANIMATION_PARAMS_SCHEMAS = {
  grid: gridParamsSchema,
  "grid-diagonal": gridDiagonalParamsSchema,
  "grid-hexagonal": gridHexagonalParamsSchema,
  starfield: starfieldParamsSchema,
  nebula: nebulaParamsSchema,
  "contour-field": contourFieldParamsSchema,
  cascade: cascadeParamsSchema,
  level: levelParamsSchema,
  fluid: fluidParamsSchema,
  plasma: plasmaParamsSchema,
  flow: flowParamsSchema,
  shimmer: shimmerParamsSchema,
  scanlines: scanlinesParamsSchema,
  image: imageParamsSchema,
  solid: solidParamsSchema
};
function _reactiveAware(fieldSchema) {
  return {
    oneOf: [
      fieldSchema,
      { type: "string", description: "Template string, evaluated on every HASS update." },
      {
        type: "object",
        properties: {
          template: { type: "string", required: true },
          default: {}
        },
        additionalProperties: false
      },
      {
        type: "object",
        properties: { map_range: { type: "object", additionalProperties: true, required: true } },
        additionalProperties: false
      }
    ]
  };
}
function _reactiveAwareVariant(paramsSchema) {
  if (!paramsSchema || !paramsSchema.properties) return paramsSchema;
  const wrappedProperties = {};
  for (const [key, fieldSchema] of Object.entries(paramsSchema.properties)) {
    wrappedProperties[key] = _reactiveAware(fieldSchema);
  }
  return { ...paramsSchema, properties: wrappedProperties };
}
const BACKGROUND_ANIMATION_PARAMS_SCHEMAS_REACTIVE_AWARE = Object.fromEntries(
  Object.entries(BACKGROUND_ANIMATION_PARAMS_SCHEMAS).map(([name, schema2]) => [name, _reactiveAwareVariant(schema2)])
);
const blurParamsSchema = {
  type: "string",
  default: "0px",
  pattern: "^\\d+(\\.\\d+)?px$",
  description: "Gaussian blur radius, a CSS length in px.",
  "x-ui-hints": { label: "Blur Radius", selector: { number: { min: 0, max: 50, step: 0.5, mode: "slider" } }, unit: "px" }
};
const brightnessParamsSchema = {
  type: "number",
  minimum: 0,
  default: 1,
  description: "0 = black, 1 = normal, 2+ = brighter. No hard ceiling in code; 3 is a practical UI limit.",
  "x-ui-hints": { label: "Brightness", selector: { number: { min: 0, max: 3, step: 0.1, mode: "slider" } } }
};
const contrastParamsSchema = {
  type: "number",
  minimum: 0,
  default: 1,
  description: "0 = gray, 1 = normal, 2+ = higher contrast. No hard ceiling in code; 3 is a practical UI limit.",
  "x-ui-hints": { label: "Contrast", selector: { number: { min: 0, max: 3, step: 0.1, mode: "slider" } } }
};
const saturateParamsSchema = {
  type: "number",
  minimum: 0,
  default: 1,
  description: "0 = grayscale, 1 = normal, 2+ = oversaturated. No hard ceiling in code; 3 is a practical UI limit.",
  "x-ui-hints": { label: "Saturation", selector: { number: { min: 0, max: 3, step: 0.1, mode: "slider" } } }
};
const hueRotateParamsSchema = {
  type: "string",
  default: "0deg",
  pattern: "^-?\\d+(\\.\\d+)?deg$",
  description: "Angle to rotate hue by, a CSS angle in deg (0-360 is the meaningful range; it wraps beyond that).",
  "x-ui-hints": { label: "Hue Rotation", selector: { number: { min: 0, max: 360, step: 1, mode: "slider" } }, unit: "deg" }
};
const grayscaleParamsSchema = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 0,
  description: "0 = full color, 1 = complete grayscale. CSS-spec-clamped to 0-1.",
  "x-ui-hints": { label: "Grayscale Amount", selector: { number: { min: 0, max: 1, step: 0.1, mode: "slider" } } }
};
const sepiaParamsSchema = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 0,
  description: "0 = normal, 1 = full sepia tone. CSS-spec-clamped to 0-1.",
  "x-ui-hints": { label: "Sepia Amount", selector: { number: { min: 0, max: 1, step: 0.1, mode: "slider" } } }
};
const invertParamsSchema = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 0,
  description: "0 = normal, 1 = fully inverted. CSS-spec-clamped to 0-1.",
  "x-ui-hints": { label: "Invert Amount", selector: { number: { min: 0, max: 1, step: 0.1, mode: "slider" } } }
};
const opacityParamsSchema = {
  type: "number",
  minimum: 0,
  maximum: 1,
  default: 1,
  description: "0 = fully transparent, 1 = fully opaque. CSS-spec-clamped to 0-1; values above 1 have no additional effect.",
  "x-ui-hints": { label: "Opacity", selector: { number: { min: 0, max: 1, step: 0.1, mode: "slider" } } }
};
const dropShadowParamsSchema = {
  type: "object",
  description: "Drop shadow behind the element.",
  properties: {
    x: { type: "number", default: 0, description: "Horizontal offset in px.", "x-ui-hints": { label: "X Offset", selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } }, unit: "px" } },
    y: { type: "number", default: 0, description: "Vertical offset in px.", "x-ui-hints": { label: "Y Offset", selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } }, unit: "px" } },
    blur: { type: "string", default: "0px", pattern: "^\\d+(\\.\\d+)?px$", description: "Shadow blur radius, a CSS length in px.", "x-ui-hints": { label: "Blur Radius", selector: { number: { min: 0, max: 50, step: 0.5, mode: "slider" } }, unit: "px" } },
    color: { type: "string", default: "#000000", description: "Shadow color.", "x-ui-hints": { widget: "lcards-color-picker", label: "Shadow Color" } }
  },
  additionalProperties: false
};
const feGaussianBlurParamsSchema = {
  type: "object",
  description: "SVG Gaussian blur: smoother than CSS blur, chains with other SVG filters.",
  properties: {
    stdDeviation: { type: "number", minimum: 0, default: 0, description: "Amount of blur: 0 = none, higher = more blur.", "x-ui-hints": { label: "Standard Deviation", selector: { number: { min: 0, max: 50, step: 0.5, mode: "slider" } } } }
  },
  additionalProperties: false
};
const feColorMatrixParamsSchema = {
  type: "object",
  description: "Color transformation via matrix operations: hue rotation, saturation, luminance-to-alpha, or a custom 4x5 matrix.",
  properties: {
    type: {
      type: "string",
      default: "saturate",
      enum: ["matrix", "saturate", "hueRotate", "luminanceToAlpha"],
      description: "Matrix operation type.",
      "x-ui-hints": { label: "Matrix Type" }
    },
    values: {
      default: 1,
      oneOf: [
        { type: "number", description: "Saturation multiplier (type: saturate) or hue-rotate angle in degrees (type: hueRotate)." },
        { type: "string", description: "Space-separated 4x5 matrix: 20 numbers (type: matrix)." },
        { type: "array", items: { type: "number" }, description: "4x5 matrix as an array: 20 numbers (type: matrix)." }
      ],
      description: "Meaning depends on `type`. Not used when type is luminanceToAlpha."
    }
  },
  additionalProperties: false
};
const feOffsetParamsSchema = {
  type: "object",
  description: "Shifts the filter result by dx/dy pixels; combine with blur for shadow effects.",
  properties: {
    dx: { type: "number", default: 0, description: "Horizontal offset: positive = right, negative = left.", "x-ui-hints": { label: "dx (horizontal offset)", selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } },
    dy: { type: "number", default: 0, description: "Vertical offset: positive = down, negative = up.", "x-ui-hints": { label: "dy (vertical offset)", selector: { number: { min: -50, max: 50, step: 1, mode: "slider" } } } }
  },
  additionalProperties: false
};
const feBlendParamsSchema = {
  type: "object",
  description: "Blends the current filter result with SourceGraphic using a standard CSS blend mode.",
  properties: {
    mode: {
      type: "string",
      default: "normal",
      enum: ["normal", "multiply", "screen", "darken", "lighten", "overlay", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"],
      description: "Blend mode: try screen/lighten after a blur for glow effects.",
      "x-ui-hints": { label: "Blend Mode" }
    }
  },
  additionalProperties: false
};
const feCompositeParamsSchema = {
  type: "object",
  description: "Combines the previous filter result and SourceGraphic using a Porter-Duff operator, or a custom arithmetic formula.",
  properties: {
    operator: {
      type: "string",
      default: "over",
      enum: ["over", "in", "out", "atop", "xor", "arithmetic"],
      description: "Compositing operator.",
      "x-ui-hints": { label: "Composite Operator" }
    },
    k1: { type: "number", default: 0, description: "Arithmetic coefficient: only used when operator is arithmetic. result = k1*i1*i2 + k2*i1 + k3*i2 + k4.", "x-ui-hints": { label: "k1", selector: { number: { min: -2, max: 2, step: 0.1, mode: "slider" } } } },
    k2: { type: "number", default: 0, description: "Arithmetic coefficient: only used when operator is arithmetic.", "x-ui-hints": { label: "k2", selector: { number: { min: -2, max: 2, step: 0.1, mode: "slider" } } } },
    k3: { type: "number", default: 0, description: "Arithmetic coefficient: only used when operator is arithmetic.", "x-ui-hints": { label: "k3", selector: { number: { min: -2, max: 2, step: 0.1, mode: "slider" } } } },
    k4: { type: "number", default: 0, description: "Arithmetic coefficient: only used when operator is arithmetic.", "x-ui-hints": { label: "k4", selector: { number: { min: -2, max: 2, step: 0.1, mode: "slider" } } } }
  },
  additionalProperties: false
};
const feMorphologyParamsSchema = {
  type: "object",
  description: "Erodes (thins) or dilates (fattens) shapes, useful for outlines or edge-thickness adjustment.",
  properties: {
    operator: {
      type: "string",
      default: "erode",
      enum: ["erode", "dilate"],
      description: "'erode' thins shapes, 'dilate' fattens them.",
      "x-ui-hints": { label: "Operator" }
    },
    radius: { type: "number", minimum: 0, default: 1, description: "How far to erode/dilate, in filter units.", "x-ui-hints": { label: "Radius", selector: { number: { min: 0, max: 20, step: 0.5, mode: "slider" } } } }
  },
  additionalProperties: false
};
const feTurbulenceParamsSchema = {
  type: "object",
  description: "Generates Perlin noise for organic textures, commonly paired with feDisplacementMap.",
  properties: {
    type: {
      type: "string",
      default: "turbulence",
      enum: ["turbulence", "fractalNoise"],
      description: "'turbulence' (cloudy) | 'fractalNoise' (softer).",
      "x-ui-hints": { label: "Noise Type" }
    },
    baseFrequency: { type: "number", minimum: 0, maximum: 1, default: 0.05, description: "Noise detail: lower = larger features.", "x-ui-hints": { label: "Base Frequency", selector: { number: { min: 0, max: 1, step: 0.01, mode: "slider" } } } },
    numOctaves: { type: "integer", minimum: 1, maximum: 10, default: 1, description: "Layers of noise detail.", "x-ui-hints": { label: "Octaves (Detail Level)", selector: { number: { min: 1, max: 10, step: 1, mode: "slider" } } } },
    seed: { type: "number", default: 0, description: "Randomization seed: change for a different pattern.", "x-ui-hints": { label: "Seed", selector: { number: { min: 0, max: 100, step: 1, mode: "slider" } } } }
  },
  additionalProperties: false
};
const feDisplacementMapParamsSchema = {
  type: "object",
  description: "Warps the image based on color values from a preceding source (typically feTurbulence): wavy/liquid/turbulent distortion.",
  properties: {
    scale: { type: "number", minimum: 0, default: 10, description: "Displacement strength: higher = more distortion.", "x-ui-hints": { label: "Displacement Scale", selector: { number: { min: 0, max: 200, step: 5, mode: "slider" } } } },
    xChannelSelector: { type: "string", default: "R", enum: ["R", "G", "B", "A"], description: "Color channel driving horizontal displacement.", "x-ui-hints": { label: "X Channel" } },
    yChannelSelector: { type: "string", default: "G", enum: ["R", "G", "B", "A"], description: "Color channel driving vertical displacement.", "x-ui-hints": { label: "Y Channel" } }
  },
  additionalProperties: false
};
const tintParamsSchema = {
  type: "object",
  description: "Composites a flat color wash over the content: a cheap alert/status tint. Requires an SVG root (not supported on data-grid).",
  properties: {
    color: {
      type: "string",
      default: "rgba(0,0,0,0.4)",
      pattern: COLOR_VALUE_PATTERN,
      description: "Tint color: the alpha channel controls how much content shows through.",
      "x-ui-hints": { widget: "lcards-color-picker", label: "Tint Color" }
    }
  },
  additionalProperties: false
};
const FILTER_PARAMS_SCHEMAS = {
  // CSS
  blur: blurParamsSchema,
  brightness: brightnessParamsSchema,
  contrast: contrastParamsSchema,
  saturate: saturateParamsSchema,
  "hue-rotate": hueRotateParamsSchema,
  grayscale: grayscaleParamsSchema,
  sepia: sepiaParamsSchema,
  invert: invertParamsSchema,
  opacity: opacityParamsSchema,
  "drop-shadow": dropShadowParamsSchema,
  // SVG
  feGaussianBlur: feGaussianBlurParamsSchema,
  feColorMatrix: feColorMatrixParamsSchema,
  feOffset: feOffsetParamsSchema,
  feBlend: feBlendParamsSchema,
  feComposite: feCompositeParamsSchema,
  feMorphology: feMorphologyParamsSchema,
  feTurbulence: feTurbulenceParamsSchema,
  feDisplacementMap: feDisplacementMapParamsSchema,
  tint: tintParamsSchema
};
const colorValueSchema = {
  type: "string",
  pattern: COLOR_VALUE_PATTERN,
  description: "Colour value: hex (#RRGGBB / #RRGGBBAA), rgb/rgba/hsl/hsla(), CSS variable (var(--name)), theme token (theme:colors.ui.primary), or computed expression (alpha(…,opacity), darken(…,amount), lighten(…,amount), saturate(…,amount), desaturate(…,amount), base(…))",
  examples: [
    "#FF9900",
    "#FF990080",
    "transparent",
    "match-light",
    "theme:colors.ui.active",
    "var(--lcars-orange)",
    "alpha(var(--lcards-orange), 0.08)",
    "darken(theme:colors.ui.primary, 0.2)",
    "lighten(#FF9900, 0.15)",
    "saturate(var(--lcars-blue), 0.3)",
    "base(colors.ui.primary)"
  ]
};
const dataSourcesSchema = {
  type: "object",
  description: "Data sources for real-time entity tracking, historical data, and processing pipelines. Each key defines a named data source accessible in templates.",
  $comment: "Data sources enable entity subscriptions, history preload, and unified processing pipeline",
  examples: [
    {
      temp: {
        entity: "sensor.temperature",
        history: { hours: 6 },
        processing: {
          fahrenheit: { type: "convert_unit", from: "c", to: "f" },
          smoothed: { type: "smooth", input_source: "fahrenheit", method: "exponential", alpha: 0.3 },
          rounded: { type: "round", input_source: "smoothed", precision: 1 }
        }
      },
      power: {
        entity: "sensor.power",
        update_interval: 1e3,
        processing: {
          kilowatts: { type: "scale", input_range: [0, 1e3], output_range: [0, 1] }
        }
      }
    }
  ],
  additionalProperties: {
    type: "object",
    properties: {
      entity: {
        type: "string",
        format: "entity",
        pattern: "^[a-z_]+\\.[a-z0-9_]+$",
        description: "Entity ID to track (format: domain.object_id)",
        examples: ["sensor.temperature", "light.living_room"]
      },
      attribute: {
        type: "string",
        description: "Entity attribute to track instead of state",
        examples: ["temperature", "brightness", "current"]
      },
      enum_mapping: {
        type: "object",
        description: "Map non-numeric states to numbers so they can be plotted or processed (on/off map to 1/0 automatically)",
        additionalProperties: { type: "number" },
        examples: [{ heat: 2, cool: 1, off: 0 }]
      },
      update_interval: {
        type: "number",
        minimum: 0,
        maximum: 1e4,
        description: "Minimum milliseconds between updates (throttling, default: 100)",
        examples: [100, 1e3, 5e3]
      },
      history: {
        type: "object",
        description: "Historical data preload configuration",
        properties: {
          enabled: {
            type: "boolean",
            description: "Enable historical data preload (default: true)"
          },
          preload: {
            type: "boolean",
            deprecated: true,
            "x-replacement": "history.enabled",
            description: "Older name for history.enabled"
          },
          hours: {
            type: "number",
            minimum: 1,
            maximum: 168,
            description: "Hours of history to preload (1-168, default: 6)"
          },
          days: {
            type: "number",
            minimum: 1,
            maximum: 7,
            description: "Days of history to preload (1-7)"
          }
        }
      },
      processing: {
        type: "object",
        description: "Processing pipeline with named processors. Each processor transforms data and stores results in a buffer accessible via templates.",
        additionalProperties: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "convert_unit",
                "scale",
                "smooth",
                "expression",
                "statistics",
                "rate",
                "trend",
                "duration",
                "threshold",
                "clamp",
                "round",
                "delta"
              ],
              description: "Processor type",
              examples: ["convert_unit", "smooth", "expression"]
            },
            input_source: {
              type: "string",
              description: "Name of another processor in this pipeline whose output this one reads (creates a dependency chain). If omitted, uses the raw entity value.",
              examples: ["fahrenheit", "smoothed", "scaled"]
            },
            enabled: { type: "boolean", description: "Set false to pass values through unchanged (default true)" },
            // Per-type parameters (see doc/core/datasources/processor-reference.md).
            from: { type: "string", description: "convert_unit: source unit (e.g. c, f, w, kw). Not a chaining key: use input_source." },
            to: { type: "string", description: "convert_unit: target unit" },
            input_range: { type: "array", items: { type: "number" }, description: "scale: [min, max] of the input" },
            output_range: { type: "array", items: { type: "number" }, description: "scale: [min, max] of the output" },
            curve: { type: "string", enum: ["linear", "exponential", "logarithmic", "sigmoid"], description: "scale: mapping curve" },
            method: { type: "string", description: "smooth: exponential | moving_average | gaussian. round: round | floor | ceil" },
            alpha: { type: "number", description: "smooth (exponential): weight of the newest value, 0 to 1 (default 0.3)" },
            window: { type: ["number", "string"], description: 'smooth: sample count (default 10). statistics: time window like "5m" or "session"' },
            expression: { type: "string", description: "expression: JavaScript expression using value/v, t, sources, entity and Math helpers" },
            sources: { type: "array", items: { type: "string" }, description: "expression: processor names available as sources[0], sources[1], ..." },
            stats: { type: "array", items: { type: "string" }, description: "statistics: min, max, mean, median, std_dev, q1, q3, range, count, sum" },
            max_points: { type: "number", description: "statistics: keep a time series of this many results" },
            unit: { type: "string", enum: ["per_second", "per_minute", "per_hour"], description: "rate: time unit" },
            smoothing: { type: "boolean", description: "rate: smooth the rate" },
            samples: { type: "number", description: "trend: samples in the slope window (default 5)" },
            threshold: { type: "number", description: "trend: slope below which the trend is stable. threshold: switch point" },
            above: { description: "threshold: output when above (default 1)" },
            below: { description: "threshold: output when below (default 0)" },
            hysteresis: { type: "number", description: "threshold: dead band around the switch point" },
            condition: { type: "string", description: 'duration: condition like "> 20" that starts the timer' },
            reset_on: { type: "string", description: "duration: condition that resets the timer" },
            min: { type: "number", description: "clamp: lower bound" },
            max: { type: "number", description: "clamp: upper bound" },
            precision: { type: "number", description: "round: decimal places (default 0)" },
            absolute: { type: "boolean", description: "delta: report the absolute change" }
          },
          required: ["type"]
        }
      },
      window_seconds: {
        type: ["number", "string"],
        description: 'Rolling buffer window: seconds, or a duration like "5m" or "1h". About 10 points per second are kept, at most 1,000 (default 60)',
        examples: [60, 300, "1h"]
      },
      min_emit_ms: {
        type: "number",
        minimum: 10,
        description: "Minimum ms between updates sent to cards (throttle, default 100)"
      },
      coalesce_ms: {
        type: "number",
        minimum: 0,
        description: "Window in ms for merging rapid changes into one update (default: 40% of min_emit_ms, at least 20)"
      },
      max_delay_ms: {
        type: "number",
        minimum: 0,
        description: "Longest ms an update may be held back while merging (default: 3 x coalesce_ms)"
      },
      emit_on_same_value: {
        type: "boolean",
        description: "Send updates even when the value did not change (default true)"
      },
      // Older camelCase spellings: still read by DataSource, snake_case wins.
      windowSeconds: { type: ["number", "string"], deprecated: true, "x-replacement": "window_seconds" },
      minEmitMs: { type: "number", deprecated: true, "x-replacement": "min_emit_ms" },
      sampleMs: { type: "number", deprecated: true, "x-replacement": "min_emit_ms" },
      coalesceMs: { type: "number", deprecated: true, "x-replacement": "coalesce_ms" },
      maxDelayMs: { type: "number", deprecated: true, "x-replacement": "max_delay_ms" },
      emitOnSameValue: { type: "boolean", deprecated: true, "x-replacement": "emit_on_same_value" }
    },
    required: ["entity"]
  }
};
const actionSchema = {
  type: "object",
  description: "Action to perform on interaction (tap, hold, or double-tap). Supports toggle, service calls, navigation, more-info dialog, or no action.",
  examples: [
    {
      action: "toggle",
      entity: "light.living_room"
    },
    {
      action: "call-service",
      service: "light.turn_on",
      service_data: {
        brightness: 255,
        color_name: "red"
      }
    },
    {
      action: "navigate",
      navigation_path: "/lovelace/dashboard"
    },
    {
      action: "more-info",
      entity: "sensor.temperature"
    }
  ],
  properties: {
    action: {
      type: "string",
      enum: ["toggle", "call-service", "perform-action", "navigate", "url", "more-info", "assist", "none"],
      default: "toggle",
      description: "Type of action to perform",
      enumDescriptions: [
        "Toggle entity on/off",
        "Call a Home Assistant service",
        "Navigate to another view/dashboard",
        "Show entity more-info dialog",
        "No action (disabled)"
      ]
    },
    service: {
      type: "string",
      pattern: "^[a-z_]+\\.[a-z0-9_]+$",
      description: "Service to call (format: domain.service)",
      examples: ["light.turn_on", "switch.toggle", "notify.mobile_app"]
    },
    service_data: {
      type: "object",
      description: "Data to pass to the service",
      examples: [{ brightness: 255, color_name: "red" }]
    },
    data: {
      type: "object",
      description: "Alias for service_data",
      examples: [{ brightness: 255 }]
    },
    navigation_path: {
      type: "string",
      pattern: "^/",
      description: "Path to navigate to (must start with /)",
      examples: ["/lovelace/dashboard", "/lovelace/0"]
    },
    entity: {
      type: "string",
      format: "entity",
      pattern: "^[a-z_]+\\.[a-z0-9_]+$",
      description: "Entity ID (format: domain.object_id)",
      examples: ["light.living_room", "sensor.temperature", "switch.fan"]
    },
    target: {
      type: "object",
      description: "Service target selector",
      examples: [{ entity_id: "light.living_room" }]
    }
  }
};
const animationSchema = {
  type: "object",
  description: "Visual animation triggered by user interactions or entity state changes",
  examples: [
    {
      trigger: "on_tap",
      preset: "pulse",
      duration: 500,
      color: "#FF9900"
    },
    {
      trigger: "on_entity_change",
      preset: "flash",
      loop: true
    }
  ],
  properties: {
    trigger: {
      type: "string",
      enum: ["on_load", "on_show", "on_tap", "on_double_tap", "on_hold", "on_hover", "on_leave", "on_entity_change", "on_datasource_change"],
      default: "on_load",
      description: "When to trigger the animation (default: on_load)",
      enumDescriptions: [
        "Once, when the card first renders",
        "Every time the card appears: when the view opens, a visibility condition shows it, or you come back from another view",
        "When card is tapped/clicked",
        "When card is double-tapped",
        "When card is held (long press)",
        "When mouse enters card",
        "When mouse leaves card",
        "When associated entity state changes",
        "When the DataSource named in `datasource` changes"
      ]
    },
    preset: {
      type: "string",
      description: "Animation preset name",
      examples: ["pulse", "flash", "bounce", "shake", "glow"]
    },
    duration: {
      type: ["number", "object"],
      minimum: 0,
      maximum: 1e4,
      default: 500,
      description: "Animation duration in milliseconds (0-10000). Also accepts a map_range descriptor for entity-driven, live-adjusting duration on looping animations."
    },
    ease: {
      type: ["string", "object"],
      description: "Easing function (string name or object with type and params)",
      examples: ["inOutQuad", "outElastic", "linear", { type: "spring", params: { stiffness: 150 } }]
    },
    loop: {
      oneOf: [
        { type: "boolean", description: "true = loop infinitely, false = play once" },
        { type: "integer", minimum: 1, description: "Number of additional times to loop (1 = play twice total)" }
      ],
      default: false,
      description: "Loop the animation. true = infinite, false = play once, N = loop N times"
    },
    alternate: {
      type: "boolean",
      default: false,
      description: "Whether animation should alternate direction on each loop"
    },
    delay: {
      type: ["number", "object"],
      minimum: 0,
      maximum: 1e4,
      default: 0,
      description: "Delay before animation starts (milliseconds). Also accepts a map_range descriptor, matching rulesSchema's equivalent field."
    },
    entity: {
      type: "string",
      description: "Entity ID to monitor (required for on_entity_change trigger)",
      pattern: "^[a-zA-Z_]+\\.[a-zA-Z0-9_]+$",
      examples: ["light.bedroom", "sensor.temperature", "binary_sensor.door", "climate.Home_HVAC"]
    },
    attribute: {
      type: "string",
      description: 'Attribute to read instead of entity state. Applies uniformly to to_state, from_state, and the while condition. Use "brightness_pct" for a computed 0–100 light brightness percentage (avoids converting raw 0–255 values).',
      examples: ["brightness", "brightness_pct", "color_temp", "hvac_action", "current_position"]
    },
    from_state: {
      type: "string",
      description: "Fire-and-forget gate: Only trigger when the entity (or attribute) transitions FROM this value. The animation runs until completion and does not auto-stop a looping animation. For auto-stop on loops, use while.",
      examples: ["on", "off", "home", "unavailable"]
    },
    to_state: {
      type: "string",
      description: "Fire-and-forget gate: Only trigger when the entity (or attribute) transitions TO this value. The animation runs until completion and does not auto-stop a looping animation. For auto-stop on loops, use while.",
      examples: ["on", "off", "home", "unavailable"]
    },
    check_on_load: {
      type: "boolean",
      default: true,
      description: "Evaluate the condition when the card first loads (default: true). For while conditions, starts a looping animation immediately if the condition is already met. For to_state/from_state, plays the animation if the entity is already in to_state. Set to false to suppress the initial evaluation and only react to state transitions. (on_entity_change only)"
    },
    while: {
      type: "object",
      description: "Lifecycle condition for looping animations (requires the top-level loop: true field). The animation plays while the condition is true and stops automatically when it becomes false. Note: to_state/from_state are fire-and-forget gates: they control when the animation starts but will not stop it. Use while to auto-stop a looping animation. The 4 numeric bound keys (above/at_least/below/at_most) AND-combine when more than one is present, so a range can be expressed by combining two of them, e.g. { at_least: 20, at_most: 80 } for an inclusive range, or { above: 20, below: 80 } for an exclusive one.",
      properties: {
        state: { type: "string", description: "Play while entity value equals this string" },
        not_state: { type: "string", description: "Play while entity value does NOT equal this string" },
        above: { type: "number", description: "Play while numeric entity value is strictly above this threshold" },
        at_least: { type: "number", description: "Play while numeric entity value is greater than or equal to this threshold" },
        below: { type: "number", description: "Play while numeric entity value is strictly below this threshold" },
        at_most: { type: "number", description: "Play while numeric entity value is less than or equal to this threshold" }
      },
      examples: [
        { state: "on" },
        { not_state: "unavailable" },
        { above: 50 },
        { at_least: 50 },
        { below: 100 },
        { at_most: 100 },
        { at_least: 20, at_most: 80 },
        { above: 20, below: 80 }
      ]
    },
    id: {
      type: "string",
      pattern: "^[a-zA-Z0-9_-]+$",
      description: "Optional identifier for this animation entry (referenced by system animations, debugging)."
    },
    enabled: {
      type: "boolean",
      default: true,
      description: "Set false to disable this animation entry without deleting it."
    },
    target: {
      type: "string",
      description: "CSS selector for a single animation target element."
    },
    targets: {
      type: ["string", "array"],
      items: { type: "string" },
      description: "CSS selector(s) for multiple animation target elements."
    },
    params: {
      type: "object",
      discriminatedBy: {
        field: "preset",
        schemas: ANIMATION_PRESET_PARAMS_SCHEMAS,
        default: { type: "object", additionalProperties: true }
      },
      description: "Preset-specific parameters. Shape depends on the sibling `preset` field."
    }
  },
  // 'warn', not false: an unrecognized top-level field here is worth surfacing but
  // must never itself block a card from initializing — same reasoning as the
  // per-preset params schemas (see animation-preset-params-schemas.js).
  additionalProperties: "warn",
  // trigger defaults to on_load (AnimationConfigProcessor, AnimationManager)
  required: ["preset"]
};
const filterSchema = {
  type: "object",
  description: "Filter configuration (CSS or SVG filter primitives)",
  examples: [
    {
      mode: "css",
      type: "blur",
      value: { blur: 2 }
    },
    {
      mode: "svg",
      type: "feGaussianBlur",
      value: { stdDeviation: 3 }
    }
  ],
  properties: {
    mode: {
      type: "string",
      enum: ["css", "svg"],
      default: "css",
      description: "Filter mode - CSS filters or SVG filter primitives",
      enumDescriptions: [
        "CSS filters (blur, brightness, contrast, etc.) - simpler, good performance",
        "SVG filter primitives (feGaussianBlur, feColorMatrix, etc.) - more powerful, complex effects"
      ]
    },
    type: {
      type: "string",
      description: "Filter type - depends on mode (CSS: blur, brightness, etc. / SVG: feGaussianBlur, feColorMatrix, etc.)"
    },
    value: {
      discriminatedBy: {
        field: "type",
        schemas: FILTER_PARAMS_SCHEMAS,
        default: {
          oneOf: [
            { type: "string", description: 'Simple value for CSS filters (e.g., "5px", "1.5", "180deg")' },
            { type: "number", description: "Numeric value for CSS filters (e.g., 1.5, 0.8)" },
            { type: "object", description: "Object parameters for SVG filters", additionalProperties: true }
          ]
        }
      },
      description: "Filter parameters - shape depends on the sibling `type` field. Simple value for CSS filters, object for SVG filters."
    }
  },
  required: ["type"]
};
const simpleColorSchema = {
  type: "string",
  pattern: COLOR_VALUE_PATTERN,
  description: "Colour value (hex, rgb, named colour, theme token, or CSS variable)",
  examples: ["#FF9900", "transparent", "theme:colors.text.onDark", "rgb(255, 153, 0)", "var(--lcars-orange)"]
};
const stateColorSchema = {
  oneOf: [
    {
      ...colorValueSchema,
      title: "Simple Colour",
      description: "Single colour value applied to all entity states"
    },
    {
      type: "object",
      title: "State-Dependent Colours",
      description: 'Map of entity state names to colour values. Well-known keys: default, active, inactive, unavailable, zero, non_zero, hover, pressed. Any custom state name (e.g. "heating", "above:90") is also accepted.',
      examples: [{
        default: "#888888",
        active: "alpha(var(--lcards-orange), 0.08)",
        inactive: "#444444"
      }],
      properties: {
        default: { ...colorValueSchema, description: "Fallback colour when no other state key matches" },
        active: { ...colorValueSchema, description: "Colour when entity is on/active" },
        inactive: { ...colorValueSchema, description: "Colour when entity is off/inactive" },
        unavailable: { ...colorValueSchema, description: "Colour when entity is unavailable" },
        zero: { ...colorValueSchema, description: "Colour when entity state is numeric 0" },
        non_zero: { ...colorValueSchema, description: "Colour when entity state is a non-zero number" },
        hover: { ...colorValueSchema, description: "Colour on hover interaction" },
        pressed: { ...colorValueSchema, description: "Colour on press/tap interaction" }
      },
      additionalProperties: {
        ...colorValueSchema,
        description: 'Colour for a custom state key (e.g. "heating", "cooling", "above:90", "below:20")'
      }
    }
  ]
};
const stateIconSchema = {
  oneOf: [
    {
      type: "string",
      title: "Single Icon",
      description: "One icon for all states",
      examples: ["mdi:lightbulb", "mdi:home", "si:github", "entity"]
    },
    {
      type: "object",
      title: "State-Dependent Icons",
      description: "Different icons for different entity states",
      examples: [{
        active: "mdi:lightbulb",
        inactive: "mdi:lightbulb-off"
      }],
      properties: {
        default: {
          type: "string",
          description: "Default icon (fallback when no other state matches)",
          examples: ["mdi:lightbulb"]
        },
        active: {
          type: "string",
          description: "Icon when entity is on/active",
          examples: ["mdi:lightbulb"]
        },
        inactive: {
          type: "string",
          description: "Icon when entity is off/inactive",
          examples: ["mdi:lightbulb-off"]
        },
        unavailable: {
          type: "string",
          description: "Icon when entity is unavailable or unknown",
          examples: ["mdi:help-circle-outline"]
        },
        zero: {
          type: "string",
          description: "Icon when entity state is numeric 0",
          examples: ["mdi:numeric-0-circle"]
        },
        non_zero: {
          type: "string",
          description: "Icon when entity state is a non-zero number",
          examples: ["mdi:numeric-positive-1"]
        }
      },
      additionalProperties: {
        type: "string",
        description: 'Custom state icon (e.g., "on", "off", "heat", "cool")'
      }
    }
  ],
  "x-ui-hints": {
    label: "Icon",
    helper: 'Specify an icon per entity state. Falls back to the top-level "icon" field when no state matches.',
    selector: {
      icon: {}
    }
  }
};
const paddingSchema = {
  oneOf: [
    {
      type: "number",
      title: "Uniform Padding",
      minimum: 0,
      maximum: 200,
      description: "Same padding on all sides (in pixels)",
      examples: [8, 16, 24]
    },
    {
      type: "object",
      title: "Per-Side Padding",
      description: "Different padding for each side",
      examples: [{
        top: 8,
        right: 16,
        bottom: 8,
        left: 16
      }],
      properties: {
        top: { type: "number", minimum: 0, maximum: 200, description: "Top padding in pixels" },
        right: { type: "number", minimum: 0, maximum: 200, description: "Right padding in pixels" },
        bottom: { type: "number", minimum: 0, maximum: 200, description: "Bottom padding in pixels" },
        left: { type: "number", minimum: 0, maximum: 200, description: "Left padding in pixels" }
      }
    }
  ],
  "x-ui-hints": {
    label: "Padding",
    helper: "Use number for uniform padding, or object for per-side control",
    defaultOneOfBranch: 0,
    selector: {
      number: {
        mode: "slider",
        step: 1,
        unit_of_measurement: "px"
      }
    }
  }
};
const entitySchema = {
  type: "string",
  format: "entity",
  pattern: "^[a-z_]+\\.[a-z0-9_]+$",
  description: "Home Assistant entity ID to control or monitor (format: domain.object_id)",
  examples: ["light.living_room", "switch.fan", "sensor.temperature"],
  "x-ui-hints": {
    label: "Entity",
    helper: "Select the Home Assistant entity this card controls",
    selector: {
      entity: {}
    }
  }
};
const cardIdSchema = {
  type: "string",
  pattern: "^[a-zA-Z0-9_-]+$",
  description: "Unique card identifier for rule targeting, animations, and debugging (alphanumeric, underscore, hyphen)",
  examples: ["main-button", "nav_home", "control123"]
};
const tagsSchema = {
  type: "array",
  items: {
    type: "string",
    pattern: "^[a-zA-Z0-9_-]+$"
  },
  description: "Tags for bulk rule targeting and grouping. Allows applying rules to multiple cards at once using tag selectors.",
  examples: [["navigation", "primary"], ["control", "lights"]]
};
const gridOptionsSchema = {
  type: "object",
  description: "Home Assistant grid layout options. Controls how many rows and columns this card occupies in the dashboard grid.",
  properties: {
    columns: {
      oneOf: [
        {
          type: "string",
          enum: ["full"],
          description: 'Set to "full" to span all available columns'
        },
        {
          type: "number",
          minimum: 1,
          maximum: 24,
          description: "Number of columns this card spans (1-24)"
        }
      ],
      description: 'Number of columns (1-24) or "full" to span all columns'
    },
    rows: {
      type: "number",
      minimum: 1,
      maximum: 100,
      description: "Number of rows this card spans (1-100)"
    }
  }
};
const rulesSchema = {
  type: "array",
  optional: true,
  description: "Dynamic styling rules evaluated by RulesEngine singleton. Rules can target overlays across all cards using IDs, tags, types, or patterns.",
  items: {
    type: "object",
    required: ["id", "when", "apply"],
    properties: {
      id: {
        type: "string",
        description: "Unique rule identifier used for debugging and tracing",
        examples: ["temp_alert", "high_cpu_warning", "offline_status"]
      },
      name: {
        type: "string",
        description: "A readable label for the rule (shown in the editor)"
      },
      when: {
        type: "object",
        description: "Condition(s) that must be met for rule to apply. Supports 20+ condition types including entity state, time, performance, DataSources, and logical composition (all/any/not). Numeric comparisons accept above/below (strict) and at_least/at_most (inclusive).",
        additionalProperties: true,
        examples: [
          { entity: "sensor.temperature", above: 25 },
          { entity: "sensor.temperature", at_least: 25 },
          { all: [{ entity: "light.bedroom", state: "on" }, { time: { after: "22:00" } }] },
          { datasource: "cpu_usage", above: 80 }
        ]
      },
      apply: {
        type: "object",
        description: "Style changes, animations and base SVG filters to apply when conditions are met",
        properties: {
          overlays: {
            type: "object",
            description: "Overlay style changes using direct IDs or selectors (all, type:, tag:, pattern:, exclude:)",
            additionalProperties: true,
            examples: [
              { temp_display: { style: { color: "var(--lcars-red)" } } },
              { "tag:critical": { style: { color: "var(--lcars-alert-red)", border_width: "3px" } } },
              { all: { style: { opacity: 0.5 } }, exclude: ["main_display"] }
            ]
          },
          base_svg: {
            type: "object",
            description: "Base SVG filter updates (MSD cards only)",
            properties: {
              filters: {
                type: ["array", "object"],
                description: "Filters to apply: a stackable filter list [{mode, type, value}] (or the legacy CSS filter object); an empty list clears them"
              },
              transition: {
                type: "number",
                minimum: 0,
                description: "Transition duration in milliseconds",
                default: 300
              }
            }
          },
          // Retired with pack-level style profiles (PackManager ignores those);
          // the rules engine never applied it. Kept only to warn.
          profiles: {
            type: "array",
            items: { type: "string" },
            deprecated: true,
            "x-replacement": "overlays (rule profiles were retired and have no effect)",
            description: "Retired: has no effect"
          },
          animations: {
            type: "array",
            description: "Animations to trigger when rule matches. Supports overlay targeting (ID, tag, type, pattern) and automatic lifecycle management (start on match, stop on unmatch).",
            items: {
              type: "object",
              properties: {
                overlay: {
                  type: "string",
                  description: "Target specific overlay by ID",
                  examples: ["temp_display_1", "cpu_gauge"]
                },
                tag: {
                  type: "string",
                  description: "Target all overlays with this tag (recommended for cross-card coordination)",
                  examples: ["temperature", "critical_alert", "system_status"]
                },
                type: {
                  type: "string",
                  description: "Target all overlays of this type",
                  examples: ["gauge", "text", "icon"]
                },
                pattern: {
                  type: "string",
                  description: "Target overlays matching regex pattern",
                  examples: ["^temp_.*", ".*_gauge$"]
                },
                preset: {
                  type: "string",
                  description: "Animation preset name",
                  examples: ["pulse", "flash", "glow", "alert_pulse"]
                },
                duration: {
                  type: ["number", "object"],
                  minimum: 0,
                  description: "Animation duration in milliseconds. Also accepts a map_range descriptor for entity-driven dynamic duration."
                },
                loop: {
                  oneOf: [
                    { type: "boolean", description: "true = loop infinitely, false = play once" },
                    { type: "integer", minimum: 1, description: "Number of additional times to loop" }
                  ],
                  default: false,
                  description: "Loop animation. Automatically stops when the rule unmatches. true = infinite, N = loop N times"
                },
                delay: {
                  type: ["number", "object"],
                  minimum: 0,
                  description: "Delay before animation starts (milliseconds). Also accepts a map_range descriptor for entity-driven dynamic delay."
                },
                ease: {
                  type: "string",
                  description: "Animation easing function (anime.js v4 name). Simple strings like 'inOutQuad', 'outBounce', 'inElastic' or parametric types via ease_params.",
                  examples: ["inOutQuad", "linear", "outElastic", "inOutBounce"]
                },
                params: {
                  type: "object",
                  discriminatedBy: {
                    field: "preset",
                    schemas: ANIMATION_PRESET_PARAMS_SCHEMAS_MAPRANGE_AWARE,
                    default: { type: "object", additionalProperties: true }
                  },
                  description: "Preset-specific parameters. Values may be static or use map_range to proportionally interpolate from an entity value.",
                  additionalProperties: true,
                  examples: [
                    { speed: 2, color: "#00ff88" },
                    {
                      speed: { map_range: { entity: "sensor.grid_power", input: [0, 5e3], output: [8, 0.5], clamp: true } },
                      color: { map_range: { entity: "sensor.grid_power", input: [0, 5e3], output: ["#00ff88", "#ff4400"], clamp: true } }
                    }
                  ]
                }
              },
              required: ["preset"],
              examples: [
                { tag: "temp_widgets", preset: "alert_pulse", loop: true },
                { overlay: "cpu_gauge", preset: "glow", duration: 500 },
                { type: "gauge", preset: "pulse", duration: 800 }
              ]
            },
            examples: [
              [{ tag: "alert_targets", preset: "flash", loop: true }],
              [{ overlay: "temp_display", preset: "glow", duration: 600 }],
              [
                { tag: "temperature", preset: "pulse", loop: true },
                { tag: "status_icon", preset: "flash", duration: 300 }
              ]
            ]
          }
        },
        examples: [
          { overlays: { temp_display: { style: { color: "var(--lcars-red)" } } } },
          { overlays: { "tag:warning": { style: { opacity: 1 } } }, animations: ["pulse"] },
          { base_svg: { filters: [{ mode: "svg", type: "tint", value: { color: "rgba(180,0,0,0.35)" } }], transition: 500 } }
        ]
      },
      stop: {
        type: "boolean",
        default: false,
        description: "Stop evaluation after this rule if it matches (rule priority control)"
      },
      priority: {
        type: "number",
        description: "Rule evaluation priority (higher values evaluated first, default: 0)",
        default: 0
      },
      enabled: {
        type: "boolean",
        default: true,
        description: "Enable or disable rule evaluation"
      }
    },
    examples: [
      {
        id: "temp_alert",
        when: { entity: "sensor.temperature", above: 25 },
        apply: { overlays: { temp_display: { style: { color: "var(--lcars-red)" } } } }
      },
      {
        id: "high_priority_alert",
        when: { entity: "binary_sensor.critical", state: "on" },
        apply: {
          overlays: { "tag:critical": { style: { color: "var(--lcars-alert-red)" } } },
          animations: ["pulse_alert"]
        },
        priority: 100,
        stop: true
      }
    ]
  },
  "x-ui": {
    control: "array",
    label: "Rules",
    helper: "Conditional styling rules evaluated by RulesEngine singleton"
  }
};
function getTextSchema(options = {}) {
  const { positionEnum = [] } = options;
  return {
    type: "object",
    description: "Multi-text label system",
    $comment: 'Text fields use arbitrary keys. "default" provides styling inherited by all other text fields. All other keys create actual rendered text elements.',
    examples: [
      {
        label1: {
          content: "Temperature",
          position: "top-left",
          font_size: 18,
          color: "#FF9900"
        },
        status: {
          content: "{entity.state}",
          position: "center"
        }
      }
    ],
    properties: {
      default: {
        type: "object",
        description: "Default styling inherited by all text fields (does not render)",
        $comment: "This is NOT rendered as a text element - it only provides default styles",
        properties: {
          position: {
            type: "string",
            enum: positionEnum,
            description: 'Default text position (e.g., "top-left", "center")'
          },
          rotation: {
            type: "number",
            minimum: -360,
            maximum: 360,
            default: 0,
            description: "Text rotation in degrees (-360 to 360)",
            "x-ui-hints": {
              label: "Rotation",
              helper: "Rotate text in degrees",
              selector: {
                number: {
                  mode: "slider",
                  min: -360,
                  max: 360,
                  step: 1,
                  unit_of_measurement: "°"
                }
              }
            }
          },
          padding: paddingSchema,
          font_size: {
            oneOf: [
              {
                type: "number",
                minimum: 1,
                maximum: 200,
                default: 14,
                description: "Font size in pixels (1-200)"
              },
              {
                type: "string",
                pattern: "^(\\d+px|\\d+\\.?\\d*rem|\\d+\\.?\\d*em|var\\(--[a-z-]+\\))$",
                description: "CSS value or theme token",
                examples: ["14px", "1.2rem", "var(--lcars-text-size)"]
              }
            ],
            "x-ui-hints": {
              label: "Font Size",
              helper: "Font size in pixels (1-200). Use YAML for theme tokens.",
              selector: {
                number: {
                  mode: "box",
                  min: 1,
                  max: 200,
                  step: 1,
                  unit_of_measurement: "px"
                }
              }
            }
          },
          color: stateColorSchema,
          font_weight: {
            type: ["string", "number"],
            default: "normal",
            description: "Font weight: CSS keyword (normal, bold) or numeric value (100–900)",
            examples: ["normal", "bold", 100, 300, 400, 700, 900]
          },
          font_family: {
            type: "string",
            format: "font-family",
            description: "CSS font-family (single font, comma-separated stack, or CSS variable)",
            examples: ["Arial", "lcards_title", "Antonio, sans-serif", '"Roboto Mono", monospace', "var(--lcars-font), Antonio, sans-serif"]
          },
          text_transform: {
            type: "string",
            enum: ["none", "uppercase", "lowercase", "capitalize"],
            default: "none",
            description: "Text transformation",
            enumDescriptions: [
              "No transformation (original case)",
              "ALL UPPERCASE",
              "all lowercase",
              "Capitalize First Letter"
            ]
          },
          anchor: {
            type: "string",
            enum: ["start", "middle", "end"],
            default: "middle",
            description: "Horizontal text alignment",
            enumDescriptions: [
              "Left-aligned",
              "Center-aligned",
              "Right-aligned"
            ]
          },
          baseline: {
            type: "string",
            enum: ["hanging", "middle", "central", "alphabetic"],
            default: "middle",
            description: "Vertical text alignment",
            enumDescriptions: [
              "Top of text box",
              "Center of text box",
              "Mathematical center",
              "Bottom of text (baseline)"
            ]
          },
          display_format: {
            type: "string",
            enum: ["friendly", "raw", "parts", "unit"],
            default: "friendly",
            description: `Default display format for entity state/attribute tokens. "friendly" uses HA's translated display string. "raw" returns the unmodified value. "parts" joins value and unit. "unit" returns only the unit.`,
            "x-ui-hints": {
              label: "Display Format (Default)",
              helper: 'friendly = HA-translated (e.g. "Open"), raw = actual state (e.g. "on"), parts = value+unit joined, unit = unit only'
            }
          },
          background: stateColorSchema,
          background_padding: {
            type: "number",
            minimum: 0,
            default: 8,
            description: "Horizontal padding between text glyphs and the background rect edges (px).",
            "x-ui-hints": {
              label: "Background Padding",
              selector: { number: { mode: "box", min: 0, max: 100, step: 1, unit_of_measurement: "px" } }
            }
          },
          background_radius: {
            type: "number",
            minimum: 0,
            default: 4,
            description: "Corner radius of the background rect (px).",
            "x-ui-hints": {
              label: "Background Corner Radius",
              selector: { number: { mode: "box", min: 0, max: 50, step: 1, unit_of_measurement: "px" } }
            }
          },
          background_width: {
            type: ["number", "null"],
            minimum: 1,
            description: "Fixed explicit width of the background rect (px). Overrides auto-sizing from text metrics. Text will overflow if content is wider than this value.",
            "x-ui-hints": {
              label: "Background Width (Fixed)",
              helper: "Pin to an exact px width. Use background_min_width for a safe lower bound with dynamic content.",
              selector: { number: { mode: "box", min: 1, max: 2e3, step: 1, unit_of_measurement: "px" } }
            }
          },
          background_min_width: {
            type: ["number", "null"],
            minimum: 1,
            description: "Minimum width of the background rect (px). Auto-sizes to text width but never smaller than this value. Safe for dynamic content.",
            "x-ui-hints": {
              label: "Background Min Width",
              helper: "Auto-sizes with text but will not shrink below this value, so safe for dynamic content.",
              selector: { number: { mode: "box", min: 1, max: 2e3, step: 1, unit_of_measurement: "px" } }
            }
          },
          font_size_percent: {
            type: "number",
            minimum: 1,
            maximum: 100,
            description: "Default font size as a percentage of the card height. All fields inherit this unless they set an explicit font_size. Useful for bar-label style presets that should auto-scale with the configured card height.",
            "x-ui-hints": {
              label: "Font Size (% of height)",
              helper: "Sets the default font size relative to the card height for all fields. 100 = full-height glyphs.",
              selector: {
                number: {
                  mode: "slider",
                  min: 1,
                  max: 100,
                  step: 1,
                  unit_of_measurement: "%"
                }
              }
            }
          },
          cap_height_ratio: {
            type: "number",
            minimum: 0.1,
            maximum: 1,
            description: "Ratio of the font cap-height to the em-square (font-size). Used to correct font_size_percent so visible glyph height matches the requested percentage of the container. Defaults to the theme token value (0.86 for Antonio). Override when using a different font family.",
            "x-ui-hints": {
              label: "Cap Height Ratio",
              helper: "Correction factor for font_size_percent. Antonio = 0.86. 1.0 = no correction. Lower values increase the rendered font-size.",
              selector: {
                number: {
                  mode: "box",
                  min: 0.1,
                  max: 1,
                  step: 0.01
                }
              }
            }
          }
        }
      }
    },
    // Additional text fields with arbitrary names
    additionalProperties: {
      type: "object",
      description: "Text field configuration (key becomes field name)",
      $comment: 'Each key creates a separate SVG text element. Use descriptive names like "label1", "status", "title"',
      properties: {
        content: {
          type: "string",
          description: "Text content. Templates are evaluated by default (set template:false to disable)",
          examples: ["Temperature", "{entity.state}", "{entity.attributes.brightness}", "{{ states(...) }}"]
        },
        show: {
          type: "boolean",
          default: true,
          description: "Whether to show this text field"
        },
        position: {
          type: "string",
          enum: positionEnum,
          description: "Text position (overrides default)"
        },
        x: {
          type: "number",
          description: "Absolute X coordinate in pixels"
        },
        y: {
          type: "number",
          description: "Absolute Y coordinate in pixels"
        },
        x_percent: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "X position as percentage of card width (0-100)"
        },
        y_percent: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Y position as percentage of card height (0-100)"
        },
        rotation: {
          type: "number",
          minimum: -360,
          maximum: 360,
          default: 0,
          description: "Text rotation in degrees (-360 to 360)",
          "x-ui-hints": {
            label: "Rotation",
            helper: "Rotate text in degrees (negative = counter-clockwise)",
            selector: {
              number: {
                mode: "slider",
                min: -360,
                max: 360,
                step: 1,
                unit_of_measurement: "°"
              }
            }
          }
        },
        padding: paddingSchema,
        font_size: {
          oneOf: [
            {
              type: "number",
              minimum: 1,
              maximum: 200,
              description: "Font size in pixels (1-200)"
            },
            {
              type: "string",
              pattern: "^(\\d+px|\\d+\\.?\\d*rem|\\d+\\.?\\d*em|var\\(--[a-z-]+\\))$",
              description: "CSS value or theme token",
              examples: ["14px", "1.2rem", "var(--lcars-text-size)"]
            }
          ],
          "x-ui-hints": {
            label: "Font Size",
            helper: "Font size in pixels (1-200). Use YAML for theme tokens.",
            selector: {
              number: {
                mode: "box",
                min: 1,
                max: 200,
                step: 1,
                unit_of_measurement: "px"
              }
            }
          }
        },
        color: stateColorSchema,
        font_weight: {
          type: ["string", "number"],
          default: "normal",
          description: "Font weight: CSS keyword (normal, bold) or numeric value (100–900)",
          examples: ["normal", "bold", 100, 300, 400, 700, 900]
        },
        font_family: {
          type: "string",
          format: "font-family",
          description: "CSS font-family (single font, comma-separated stack, or CSS variable)",
          examples: ["Arial", "lcards_title", "Antonio, sans-serif", '"Roboto Mono", monospace', "var(--lcars-font), Antonio, sans-serif"]
        },
        text_transform: {
          type: "string",
          enum: ["none", "uppercase", "lowercase", "capitalize"],
          default: "none",
          description: "Text transformation",
          enumDescriptions: [
            "No transformation (original case)",
            "ALL UPPERCASE",
            "all lowercase",
            "Capitalize First Letter"
          ]
        },
        anchor: {
          type: "string",
          enum: ["start", "middle", "end"],
          default: "middle",
          description: "Horizontal text alignment",
          enumDescriptions: [
            "Left-aligned",
            "Center-aligned",
            "Right-aligned"
          ]
        },
        baseline: {
          type: "string",
          enum: ["hanging", "middle", "central", "alphabetic"],
          default: "middle",
          description: "Vertical text alignment",
          enumDescriptions: [
            "Top of text box",
            "Center of text box",
            "Mathematical center",
            "Bottom of text (baseline)"
          ]
        },
        template: {
          type: "boolean",
          default: true,
          description: "Template evaluation is enabled by default for this field’s content (e.g. {entity.state}, {{ states(...) }}, [[[ ... ]]]). Set to false to render {...} / [[[...]]] text literally without evaluating it."
        },
        stretch: {
          oneOf: [
            {
              type: "boolean",
              description: "true = stretch text to fill 100% of the available width"
            },
            {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Fraction of available width to stretch text to (0–1)"
            }
          ],
          description: 'Stretch text to fill a fraction of the available width using SVG textLength / lengthAdjust="spacingAndGlyphs". true = 100%, 0.8 = 80%.',
          "x-ui-hints": {
            label: "Stretch Text",
            helper: "Expand or compress glyph spacing to fill the specified width fraction"
          }
        },
        font_size_percent: {
          type: "number",
          minimum: 1,
          maximum: 100,
          description: "Font size as a percentage of the text area height (component mode). Overrides font_size when set.",
          "x-ui-hints": {
            label: "Font Size (%)",
            helper: "Sets font size relative to the text area height. 50 = 50% of the area height.",
            selector: {
              number: {
                mode: "slider",
                min: 1,
                max: 100,
                step: 1,
                unit_of_measurement: "%"
              }
            }
          }
        },
        cap_height_ratio: {
          type: "number",
          minimum: 0.1,
          maximum: 1,
          description: "Ratio of the font cap-height to the em-square. Used to correct font_size_percent so visible glyph height matches the requested percentage. Defaults to the theme token value (0.86 for Antonio). Override when using a different font.",
          "x-ui-hints": {
            label: "Cap Height Ratio",
            helper: "Correction factor for font_size_percent. Antonio = 0.86. 1.0 = no correction. Lower values increase rendered font-size.",
            selector: {
              number: {
                mode: "box",
                min: 0.1,
                max: 1,
                step: 0.01
              }
            }
          }
        },
        zone: {
          type: "string",
          description: "Named zone key to route this text field to. For component cards this matches a key in the component's zones map. For slider/elbow cards this matches a named layout zone (e.g. left, track, vertical_bar). Defaults to the first zone if not set.",
          "x-ui-hints": {
            label: "Zone",
            helper: "Which named layout zone this text field is routed to"
          }
        },
        display_format: {
          type: "string",
          enum: ["friendly", "raw", "parts", "unit"],
          default: "friendly",
          description: `How to format entity state or attribute values in this text field. "friendly" (default) uses HA's translated display string matching native cards. "raw" returns the unmodified state/attribute value. "parts" joins value and unit from HA's ToParts API. "unit" returns only the unit portion.`,
          examples: ["friendly", "raw", "parts", "unit"],
          "x-ui-hints": {
            label: "Display Format",
            helper: 'friendly = HA-translated (e.g. "Open"), raw = actual state (e.g. "on"), parts = value+unit joined, unit = unit only'
          }
        },
        background: stateColorSchema,
        background_padding: {
          type: "number",
          minimum: 0,
          default: 8,
          description: "Horizontal padding between text glyphs and the background rect edges (px).",
          "x-ui-hints": {
            label: "Background Padding",
            selector: { number: { mode: "box", min: 0, max: 100, step: 1, unit_of_measurement: "px" } }
          }
        },
        background_radius: {
          type: "number",
          minimum: 0,
          default: 4,
          description: "Corner radius of the background rect (px).",
          "x-ui-hints": {
            label: "Background Corner Radius",
            selector: { number: { mode: "box", min: 0, max: 50, step: 1, unit_of_measurement: "px" } }
          }
        },
        background_width: {
          type: ["number", "null"],
          minimum: 1,
          description: "Fixed explicit width of the background rect (px). Overrides auto-sizing from text metrics. Text will overflow if content is wider than this value.",
          "x-ui-hints": {
            label: "Background Width (Fixed)",
            helper: "Pin to an exact px width. Use background_min_width for a safe lower bound with dynamic content.",
            selector: { number: { mode: "box", min: 1, max: 2e3, step: 1, unit_of_measurement: "px" } }
          }
        },
        background_min_width: {
          type: ["number", "null"],
          minimum: 1,
          description: "Minimum width of the background rect (px). Auto-sizes to text width but never smaller than this value. Safe for dynamic content.",
          "x-ui-hints": {
            label: "Background Min Width",
            helper: "Auto-sizes with text but will not shrink below this value, so safe for dynamic content.",
            selector: { number: { mode: "box", min: 1, max: 2e3, step: 1, unit_of_measurement: "px" } }
          }
        }
      }
    }
  };
}
const soundsSchema = {
  type: "object",
  description: "Per-card sound configuration. Overrides global sound settings for this card.",
  properties: {
    enabled: {
      type: "boolean",
      description: "Whether this card fires sounds. Set to false to completely silence this card. Default: true (omit to keep default).",
      "x-ui-hints": {
        label: "Card Sounds Enabled",
        helper: "When off, this card makes no sounds regardless of global settings"
      }
    },
    card_tap: {
      type: ["string", "null"],
      description: "Asset key for card tap, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Card Tap" }
    },
    card_hold: {
      type: ["string", "null"],
      description: "Asset key for card hold, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Card Hold" }
    },
    card_double_tap: {
      type: ["string", "null"],
      description: "Asset key for card double-tap, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Card Double-Tap" }
    },
    card_hover: {
      type: ["string", "null"],
      description: "Asset key for card hover (desktop), or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Card Hover (Desktop)" }
    },
    slider_drag_start: {
      type: ["string", "null"],
      description: "Asset key for slider grab, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Slider Grab" }
    },
    slider_change: {
      type: ["string", "null"],
      description: "Asset key for slider value change, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Slider Value Change" }
    },
    slider_drag_end: {
      type: ["string", "null"],
      description: "Asset key for slider release, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Slider Release" }
    },
    toggle_on: {
      type: ["string", "null"],
      description: "Asset key for toggle-on, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Toggle → On" }
    },
    toggle_off: {
      type: ["string", "null"],
      description: "Asset key for toggle-off, or null to mute. Omit to use global scheme.",
      "x-ui-hints": { label: "Toggle → Off" }
    }
  },
  additionalProperties: false
};
const backgroundAnimationEffectSchema = {
  type: "object",
  required: ["preset"],
  properties: {
    preset: {
      type: "string",
      description: "Background animation preset name (e.g. grid, starfield, cascade)"
    },
    config: {
      type: "object",
      discriminatedBy: {
        field: "preset",
        schemas: BACKGROUND_ANIMATION_PARAMS_SCHEMAS_REACTIVE_AWARE,
        default: { type: "object", additionalProperties: true }
      },
      description: "Preset-specific configuration options. Shape depends on the sibling `preset` field. Supports entity-reactive values via map_range descriptor ({ map_range: { attribute, input, output } }) or template strings ([[[...]]]). entity_id defaults to the card-bound entity."
    },
    enabled: {
      type: "boolean",
      description: "Set to false to disable this effect without removing it",
      default: true
    },
    zoom: {
      type: "object",
      description: "Optional zoom wrapper: creates layered depth effect",
      properties: {
        layers: { type: "number", minimum: 1, default: 4 },
        scale_from: { type: "number", default: 0.5 },
        scale_to: { type: "number", default: 2 },
        duration: { type: "number", default: 15 },
        opacity_fade_in: { type: "number", default: 15 },
        opacity_fade_out: { type: "number", default: 75 }
      }
    }
  },
  additionalProperties: false
};
const backgroundAnimationInsetSchema = {
  oneOf: [
    {
      type: "string",
      enum: ["auto"],
      description: "Auto-compute inset from card geometry (elbow cards only)"
    },
    {
      type: "object",
      description: "Per-side pixel inset for the animation canvas",
      properties: {
        top: { type: "number", minimum: 0, default: 0 },
        right: { type: "number", minimum: 0, default: 0 },
        bottom: { type: "number", minimum: 0, default: 0 },
        left: { type: "number", minimum: 0, default: 0 }
      },
      additionalProperties: false
    }
  ]
};
const backgroundAnimationSchema = {
  oneOf: [
    {
      type: "array",
      description: "Background animation effects (bare array, no canvas inset)",
      items: backgroundAnimationEffectSchema
    },
    {
      type: "object",
      description: "Background animation with canvas-level inset",
      required: ["effects"],
      properties: {
        inset: backgroundAnimationInsetSchema,
        effects: {
          type: "array",
          description: "Stack of background effects rendered in order (bottom → top)",
          items: backgroundAnimationEffectSchema
        }
      },
      additionalProperties: false
    }
  ]
};
const cardHeightSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 1,
      description: "Card height in pixels (bare integer, e.g. 56 = 56px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Card height with CSS unit (e.g. 200px, 50vh, 10em) or a CSS function: calc(), min(), max(), clamp(), var()"
    }
  ],
  description: "Card height override. Bare integer = px (e.g. 200 = 200px). CSS units accepted: 200px, 50vh, 10em.",
  "x-ui-hints": {
    label: "Height",
    helper: "Bare integer = px (e.g. 200 = 200px). CSS units accepted: 200px, 50vh, 10em.",
    selector: { text: {} }
  }
};
const cardWidthSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 1,
      description: "Card width in pixels (bare integer, e.g. 300 = 300px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Card width with CSS unit (e.g. 400px, 50vw, 10em) or a CSS function: calc(), min(), max(), clamp(), var()"
    }
  ],
  description: "Card width override. Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 50vw, 10em.",
  "x-ui-hints": {
    label: "Width",
    helper: "Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 50vw, 10em.",
    selector: { text: {} }
  }
};
const cardMinHeightSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 0,
      description: "Minimum card height in pixels (bare integer, e.g. 40 = 40px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Minimum card height with CSS unit (e.g. 40px, 10vh)"
    }
  ],
  description: "Minimum card height floor. Overrides the --lcards-button-min-height CSS token. Bare integer = px.",
  "x-ui-hints": {
    label: "Min Height",
    helper: "Floor height (e.g. 40)",
    selector: { text: {} }
  }
};
const triggersUpdateSchema = {
  type: "array",
  items: {
    type: "string",
    format: "entity",
    pattern: "^[a-z_]+\\.[a-z0-9_]+$",
    description: "Entity ID whose state change should trigger a re-render",
    examples: ["sensor.temperature", "binary_sensor.motion"]
  },
  description: "Extra entity IDs to watch for state changes. When any listed entity changes, all templates on this card are re-evaluated. Use this for JavaScript templates ([[[...]]]) that reference entities LCARdS cannot detect automatically via static analysis.",
  examples: [
    ["sensor.outdoor_temperature"],
    ["binary_sensor.motion_kitchen", "sensor.toronto_temperature"]
  ],
  "x-ui-hints": {
    label: "Extra entity triggers",
    helper: "Entity IDs whose state changes should re-evaluate this card's templates. Only needed for JS templates: Jinja2 entity references are tracked automatically.",
    selector: { entity: {} }
  }
};
const cardMinWidthSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 0,
      description: "Minimum card width in pixels (bare integer, e.g. 80 = 80px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Minimum card width with CSS unit (e.g. 80px, 10vw)"
    }
  ],
  description: "Minimum card width floor. Bare integer = px.",
  "x-ui-hints": {
    label: "Min Width",
    helper: "Floor width (e.g. 80)",
    selector: { text: {} }
  }
};
const cardMaxHeightSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 1,
      description: "Maximum card height in pixels (bare integer, e.g. 400 = 400px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Maximum card height with CSS unit (e.g. 400px, 80vh, 20em)"
    }
  ],
  description: "Maximum card height ceiling. Bare integer = px (e.g. 400 = 400px). CSS units accepted: 400px, 80vh, 10em.",
  "x-ui-hints": {
    label: "Max Height",
    helper: "Ceiling height (e.g. 400). Bare integer = px, or CSS units (400px, 80vh, etc).",
    selector: { text: {} }
  }
};
const cardMaxWidthSchema = {
  oneOf: [
    {
      type: "number",
      minimum: 1,
      description: "Maximum card width in pixels (bare integer, e.g. 600 = 600px)"
    },
    {
      type: "string",
      pattern: "^([\\d.]+(\\s*(px|vh|vw|%|em|rem|vmin|vmax))?|(calc|min|max|clamp|var)\\(.+\\))$",
      description: "Maximum card width with CSS unit (e.g. 600px, 80vw, 20em)"
    }
  ],
  description: "Maximum card width ceiling. Bare integer = px (e.g. 600 = 600px). CSS units accepted: 600px, 80vw, 10em.",
  "x-ui-hints": {
    label: "Max Width",
    helper: "Ceiling width (e.g. 600). Bare integer = px, or CSS units (600px, 80vw, etc).",
    selector: { text: {} }
  }
};
const _overflowOptions = [
  { value: "visible", label: "Visible: content paints outside the box" },
  { value: "hidden", label: "Hidden: clips without scroll" },
  { value: "clip", label: "Clip: hard clip, no programmatic scroll" },
  { value: "scroll", label: "Scroll: always shows scrollbar" },
  { value: "auto", label: "Auto: scrollbar only when needed" }
];
const cardOverflowSchema = {
  type: "string",
  enum: ["visible", "hidden", "clip", "scroll", "auto"],
  description: "CSS overflow shorthand on the card host element (sets both axes unless overridden per-axis).",
  "x-ui-hints": {
    label: "Overflow",
    helper: "Sets both axes. Use overflow_x / overflow_y to control axes independently.",
    selector: { select: { mode: "dropdown", options: _overflowOptions } }
  }
};
const cardOverflowXSchema = {
  type: "string",
  enum: ["visible", "hidden", "clip", "scroll", "auto"],
  description: "CSS overflow-x on the card host element. Overrides the overflow shorthand for the horizontal axis.",
  "x-ui-hints": {
    label: "Overflow X",
    helper: "Horizontal axis overflow. Overrides the overflow shorthand.",
    selector: { select: { mode: "dropdown", options: _overflowOptions } }
  }
};
const cardOverflowYSchema = {
  type: "string",
  enum: ["visible", "hidden", "clip", "scroll", "auto"],
  description: "CSS overflow-y on the card host element. Overrides the overflow shorthand for the vertical axis.",
  "x-ui-hints": {
    label: "Overflow Y",
    helper: "Vertical axis overflow. Overrides the overflow shorthand.",
    selector: { select: { mode: "dropdown", options: _overflowOptions } }
  }
};
const cardZIndexSchema = {
  type: "integer",
  description: "CSS z-index stacking order on the card host element.",
  "x-ui-hints": {
    label: "Z-Index",
    helper: "Stacking order within a shared stacking context. Higher = in front.",
    selector: { number: { min: -999, max: 9999, step: 1, mode: "box" } }
  }
};
const stateClassificationSchema = {
  type: "object",
  description: "Override how raw entity states are mapped to style buckets. Use built-in buckets (active/inactive/default) or define your own named buckets. Explicit state keys in style config always take priority over this.",
  properties: {
    active: {
      type: "array",
      items: { type: "string" },
      description: 'Additional states to classify as "active" (augments the built-in active list).',
      examples: [["home", "work", "gym"]],
      "x-ui-hints": { label: "Active states", helper: "Extra states treated as active." }
    },
    inactive: {
      type: "array",
      items: { type: "string" },
      description: 'States to explicitly classify as "inactive".',
      examples: [["not_home", "away"]],
      "x-ui-hints": { label: "Inactive states", helper: "States treated as inactive." }
    },
    else: {
      type: "string",
      description: 'Bucket for states not matched by any list (built-in or custom). Accepts built-in bucket names (active/inactive/default) or a custom bucket name. Defaults to "inactive" when omitted.',
      "x-ui-hints": {
        label: "Unmapped state class",
        helper: 'What bucket unrecognised states fall into. Use "default" to reach your default colour instead of the preset inactive colour.',
        selector: { select: { options: [
          { value: "inactive", label: "Inactive (default)" },
          { value: "default", label: "Default" },
          { value: "active", label: "Active" }
        ] } }
      }
    }
  },
  additionalProperties: {
    type: "array",
    items: { type: "string" },
    description: "Custom bucket: an array of raw entity states that map to this bucket name."
  }
};
const cardLevelProperties = {
  rules: rulesSchema,
  sounds: soundsSchema,
  variables: {
    type: "object",
    description: "Your own named values, available to templates as variables.<name> and {variables.<name>}.",
    additionalProperties: true
  },
  zones: {
    type: "object",
    description: "Named rectangles (px or *_percent of the card) that text fields and animations can target.",
    additionalProperties: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        x_percent: { type: "number" },
        y_percent: { type: "number" },
        width_percent: { type: "number" },
        height_percent: { type: "number" }
      }
    }
  },
  debug_zones: { type: "boolean", description: "Outline every zone on the card (development aid)." }
};
function getButtonSchema(options = {}) {
  const {
    availablePresets = [],
    positionEnum = []
  } = options;
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/snootched/lcards/schemas/button-schema",
    title: "LCARdS Button Card Configuration",
    description: "Complete configuration schema for lcards-button custom card",
    type: "object",
    properties: {
      // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
      ...cardLevelProperties,
      // ============================================================================
      // HOME ASSISTANT REQUIRED PROPERTIES
      // ============================================================================
      type: {
        type: "string",
        const: "custom:lcards-button",
        description: "Home Assistant card type identifier (required)"
      },
      // ============================================================================
      // SHARED LCARDS PROPERTIES
      // ============================================================================
      data_sources: dataSourcesSchema,
      triggers_update: triggersUpdateSchema,
      // ============================================================================
      // CORE PROPERTIES
      // ============================================================================
      entity: entitySchema,
      id: cardIdSchema,
      tags: tagsSchema,
      // ============================================================================
      // SIZING
      // ============================================================================
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      // ============================================================================
      // INTERACTIVE / DECORATIVE MODE
      // ============================================================================
      interactive: {
        type: "boolean",
        default: true,
        description: "When false, hover colour changes and hover animations are suppressed. The cursor defaults to the arrow unless overridden via style.cursor. Tap/hold actions still fire if configured.",
        "x-ui-hints": {
          label: "Show hover effects",
          helper: "Disable to suppress colour change and hover animations on mouse-over. Does not affect tap/hold actions."
        }
      },
      // ============================================================================
      // CONTROL BEHAVIOR
      // ============================================================================
      control: {
        type: "object",
        description: "Control behavior configuration",
        properties: {
          attribute: {
            type: "string",
            description: "Entity attribute to control (leave blank to control entity state)",
            examples: ["brightness", "temperature", "position", "percentage"]
          }
        },
        additionalProperties: true
      },
      // ============================================================================
      // MODE: PRESET OR COMPONENT
      // ============================================================================
      preset: {
        type: "string",
        description: "Style preset name (button preset when used alone; component preset name when component is set)",
        examples: availablePresets,
        "x-ui-hints": {
          label: "Style Preset",
          helper: 'Choose a pre-configured button style. Use "component" instead for advanced layouts like D-pad.'
        }
      },
      component: {
        type: "string",
        enum: ["dpad", "dpad_voyager", "alert"],
        description: "Component type (mutually exclusive with preset)",
        enumDescriptions: [
          "D-pad directional control (up/down/left/right/center)",
          "D-pad directional control, Voyager LCARS ring styling (up/down/left/right/center)",
          "Alert symbol with animated bar segments (red/blue/green/yellow/grey/black)"
        ]
      },
      // ============================================================================
      // TEXT CONFIGURATION
      // ============================================================================
      text: getTextSchema({ positionEnum }),
      // ============================================================================
      // ICON CONFIGURATION
      // ============================================================================
      show_icon: {
        type: "boolean",
        default: true,
        description: "Whether to show the icon"
      },
      icon_area: {
        type: "string",
        enum: ["left", "right", "top", "bottom", "none"],
        default: "left",
        description: "Icon area position relative to main area",
        enumDescriptions: [
          "Vertical bar on left side",
          "Vertical bar on right side",
          "Horizontal bar at top",
          "Horizontal bar at bottom",
          "No separate icon area (icon in main area)"
        ]
      },
      icon: {
        type: "string",
        examples: ["mdi:lightbulb", "mdi:home", "si:github", "mdi:thermometer"],
        "x-ui-hints": {
          label: "Icon",
          selector: {
            icon: {}
          }
        }
      },
      icon_area_background: {
        title: "Icon Area Background Colour",
        description: "Background colour for the icon area (supports state-based colours)",
        default: "transparent",
        $comment: "Icon area background is independent of main card background. Useful for creating visual separation.",
        ...stateColorSchema
      },
      icon_area_size: {
        type: "number",
        minimum: 20,
        maximum: 500,
        default: 60,
        description: "Fixed size for icon area in pixels (width for left/right, height for top/bottom, default: 60)",
        "x-ui-hints": {
          label: "Icon Area Size",
          helper: "Size in pixels",
          selector: {
            number: {
              mode: "box",
              min: 20,
              max: 500,
              step: 1,
              unit_of_measurement: "px"
            }
          }
        }
      },
      divider: {
        type: "object",
        description: "Divider line between icon area and main area",
        examples: [{
          width: 2,
          color: "#FF9900"
        }],
        properties: {
          width: {
            type: "number",
            minimum: 0,
            maximum: 200,
            default: 0,
            description: "Divider width in pixels (0 = no divider, default: 0)",
            "x-ui-hints": {
              label: "Width",
              helper: "Divider line width",
              selector: {
                number: {
                  mode: "box",
                  min: 0,
                  max: 200,
                  step: 1,
                  unit_of_measurement: "px"
                }
              }
            }
          },
          color: {
            type: "string",
            pattern: COLOR_VALUE_PATTERN,
            description: "Divider colour",
            examples: ["#FF9900", "rgba(255, 153, 0, 0.5)"]
          }
        }
      },
      icon_style: {
        type: "object",
        description: "Advanced icon styling configuration",
        examples: [{
          type: "mdi",
          color: "#FF9900",
          size: 32,
          position: "center"
        }],
        properties: {
          type: {
            type: "string",
            enum: ["mdi", "si", "entity"],
            default: "mdi",
            description: "Icon type",
            enumDescriptions: [
              "Material Design Icons",
              "Simple Icons",
              "Entity state icon"
            ]
          },
          color: stateColorSchema,
          icon: {
            title: "State-Dependent Icons",
            description: 'Override icon per entity state. Falls back to the top-level "icon" field when no state matches.',
            ...stateIconSchema,
            "x-ui-hints": {
              ...stateIconSchema["x-ui-hints"],
              label: "Per-state Icon Override",
              helper: 'Set a different icon per entity state (active, inactive, unavailable, etc.). Falls back to the top-level "icon" field.'
            }
          },
          size: {
            type: "number",
            minimum: 8,
            maximum: 200,
            default: 24,
            description: "Icon size in pixels (8-200, default: 24)",
            "x-ui-hints": {
              label: "Size",
              helper: "Icon size in pixels",
              selector: {
                number: {
                  mode: "box",
                  min: 8,
                  max: 200,
                  step: 1,
                  unit_of_measurement: "px"
                }
              }
            }
          },
          rotation: {
            type: "number",
            minimum: -360,
            maximum: 360,
            default: 0,
            description: "Icon rotation in degrees (-360 to 360)",
            "x-ui-hints": {
              label: "Rotation",
              helper: "Rotate icon in degrees",
              selector: {
                number: {
                  mode: "slider",
                  min: -360,
                  max: 360,
                  step: 1,
                  unit_of_measurement: "°"
                }
              }
            }
          },
          position: {
            type: "string",
            enum: positionEnum,
            default: "center",
            description: "Icon position within icon area"
          },
          x: {
            type: "number",
            description: "Absolute X coordinate in pixels"
          },
          y: {
            type: "number",
            description: "Absolute Y coordinate in pixels"
          },
          x_percent: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "X position as percentage (0-100)"
          },
          y_percent: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Y position as percentage (0-100)"
          },
          spacing: {
            type: "number",
            minimum: 0,
            maximum: 100,
            default: 8,
            description: "Spacing between icon and text in pixels (default: 8)",
            "x-ui-hints": {
              label: "Spacing",
              helper: "Space between icon and text",
              selector: {
                number: {
                  mode: "box",
                  min: 0,
                  max: 100,
                  step: 1,
                  unit_of_measurement: "px"
                }
              }
            }
          },
          padding: paddingSchema,
          padding_left: {
            type: "number",
            minimum: 0,
            maximum: 200,
            description: "Left padding in pixels (overrides padding)"
          },
          padding_right: {
            type: "number",
            minimum: 0,
            maximum: 200,
            description: "Right padding in pixels (overrides padding)"
          },
          padding_top: {
            type: "number",
            minimum: 0,
            maximum: 200,
            description: "Top padding in pixels (overrides padding)"
          },
          padding_bottom: {
            type: "number",
            minimum: 0,
            maximum: 200,
            description: "Bottom padding in pixels (overrides padding)"
          }
        }
      },
      // ============================================================================
      // STYLE CONFIGURATION
      // ============================================================================
      style: {
        type: "object",
        properties: {
          cursor: {
            type: "string",
            description: "CSS cursor style shown when hovering over the button. Overrides the automatic cursor derived from the interactive flag.",
            examples: ["pointer", "default", "none", "not-allowed", "crosshair", "grab", "zoom-in", "help", "wait", "progress", "move", "copy", "text"],
            "x-ui-hints": {
              label: "Cursor style",
              helper: "Any valid CSS cursor value. Leave unset to use the automatic default."
            }
          },
          card: {
            type: "object",
            properties: {
              color: {
                type: "object",
                properties: {
                  background: stateColorSchema
                }
              }
            }
          },
          border: {
            type: "object",
            properties: {
              width: {
                oneOf: [
                  { type: "number" },
                  { type: "string", description: "Theme token reference" },
                  {
                    type: "object",
                    properties: {
                      top: { oneOf: [{ type: "number" }, { type: "string" }] },
                      right: { oneOf: [{ type: "number" }, { type: "string" }] },
                      bottom: { oneOf: [{ type: "number" }, { type: "string" }] },
                      left: { oneOf: [{ type: "number" }, { type: "string" }] }
                    }
                  }
                ]
              },
              color: stateColorSchema,
              radius: {
                oneOf: [
                  { type: "number", minimum: 0, maximum: 100, default: 12 },
                  { type: "string", pattern: "^(\\{theme:.*\\}|var\\(--.*\\))$", description: "Theme token reference" },
                  {
                    type: "object",
                    properties: {
                      top_left: { oneOf: [{ type: "number" }, { type: "string" }] },
                      top_right: { oneOf: [{ type: "number" }, { type: "string" }] },
                      bottom_right: { oneOf: [{ type: "number" }, { type: "string" }] },
                      bottom_left: { oneOf: [{ type: "number" }, { type: "string" }] }
                    }
                  }
                ],
                "x-ui-hints": {
                  label: "Border Radius",
                  helper: "Corner roundness (pixels, theme token, or per-corner)",
                  selector: {
                    choose: {
                      choices: {
                        pixels: {
                          selector: {
                            number: {
                              mode: "slider",
                              min: 0,
                              max: 100,
                              step: 1,
                              slider_ticks: false,
                              unit_of_measurement: "px"
                            }
                          }
                        },
                        theme: {
                          selector: {
                            text: {
                              placeholder: "{theme:borders.radius.base}"
                            }
                          }
                        },
                        per_corner: {
                          selector: {
                            object: {
                              properties: {
                                top_left: {
                                  title: "Top Left",
                                  number: { min: 0, max: 100, step: 1 }
                                },
                                top_right: {
                                  title: "Top Right",
                                  number: { min: 0, max: 100, step: 1 }
                                },
                                bottom_right: {
                                  title: "Bottom Right",
                                  number: { min: 0, max: 100, step: 1 }
                                },
                                bottom_left: {
                                  title: "Bottom Left",
                                  number: { min: 0, max: 100, step: 1 }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          text: {
            type: "object",
            properties: {
              default: {
                type: "object",
                properties: {
                  color: stateColorSchema,
                  font_size: {
                    oneOf: [
                      { type: "number" },
                      { type: "string", description: 'CSS value or theme token (e.g., "14px", "var(--lcars-text-size)")' }
                    ]
                  },
                  font_weight: { type: ["string", "number"] },
                  font_family: { type: "string", format: "font-family" }
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // ACTIONS
      // ============================================================================
      tap_action: actionSchema,
      hold_action: actionSchema,
      double_tap_action: actionSchema,
      // ============================================================================
      // ANIMATIONS
      // ============================================================================
      animations: {
        type: "array",
        items: animationSchema
      },
      // ============================================================================
      // BACKGROUND ANIMATION
      // ============================================================================
      background_animation: backgroundAnimationSchema,
      // ============================================================================
      // SHAPE TEXTURE
      // ============================================================================
      shape_texture: {
        type: "object",
        description: "SVG-native texture/animation rendered inside the button shape boundary",
        properties: {
          preset: {
            type: "string",
            description: "Texture preset name",
            enum: ["grid", "diagonal", "hexagonal", "dots", "fluid", "shimmer", "plasma", "flow", "level", "pulse", "scanlines", "image"]
          },
          opacity: {
            description: "Texture opacity (0-1). Supports state-based object.",
            oneOf: [
              { type: "number", minimum: 0, maximum: 1 },
              { type: "object", description: "State-based values: keys are states (default, active, inactive, unavailable, ...), values are numbers" }
            ]
          },
          speed: {
            description: "Animation speed multiplier. Supports state-based object.",
            oneOf: [
              { type: "number", minimum: 0 },
              { type: "object" }
            ]
          },
          mix_blend_mode: {
            type: "string",
            description: "CSS mix-blend-mode for texture blending",
            enum: ["normal", "multiply", "screen", "overlay", "hard-light", "soft-light", "color-burn", "color-dodge"]
          },
          config: {
            type: "object",
            description: "Preset-specific configuration. Supports entity-reactive values: map_range descriptor ({ map_range: { attribute, input, output } }) or template strings ([[[...]]]), including { template, default } form for numeric params like fill_pct.",
            additionalProperties: true
          }
        },
        additionalProperties: false
      },
      // FILTERS
      // ============================================================================
      filters: {
        type: "array",
        description: "Visual filters applied to entire button (CSS and SVG filter primitives)",
        items: filterSchema
      },
      // ============================================================================
      // SVG BACKGROUND
      // ============================================================================
      svg: {
        type: "object",
        properties: {
          content: { type: "string" },
          src: { type: "string" },
          viewBox: { type: "string" },
          preserveAspectRatio: { type: "string" },
          enable_tokens: { type: "boolean" },
          allow_scripts: { type: "boolean" },
          segments: {
            type: "object",
            description: 'Segment configurations keyed by ID. Use "default" for shared config.',
            properties: {
              default: {
                type: "object",
                description: "Default configuration inherited by all segments",
                properties: {
                  entity: {
                    type: "string",
                    format: "entity",
                    pattern: "^[a-z_]+\\.[a-z0-9_]+$",
                    description: "Entity ID (format: domain.object_id)",
                    examples: ["light.living_room", "switch.fan"]
                  },
                  tap_action: actionSchema,
                  hold_action: actionSchema,
                  double_tap_action: actionSchema,
                  style: {
                    type: "object",
                    properties: {
                      fill: stateColorSchema,
                      stroke: stateColorSchema,
                      "stroke-width": {
                        title: "Stroke Width",
                        description: "SVG stroke width (number in pixels or CSS string)",
                        oneOf: [
                          {
                            type: "number",
                            minimum: 0,
                            maximum: 50,
                            description: "Uniform stroke width in pixels (0-50)"
                          },
                          {
                            type: "string",
                            pattern: "^\\d+(\\.\\d+)?(px|em|rem)?$",
                            description: "CSS stroke width value",
                            examples: ["2px", "1.5", "0.5em"]
                          },
                          {
                            type: "object",
                            description: "State-based stroke width",
                            properties: {
                              default: {
                                oneOf: [
                                  { type: "number", minimum: 0, maximum: 50 },
                                  { type: "string" }
                                ]
                              },
                              active: {
                                oneOf: [
                                  { type: "number", minimum: 0, maximum: 50 },
                                  { type: "string" }
                                ]
                              },
                              inactive: {
                                oneOf: [
                                  { type: "number", minimum: 0, maximum: 50 },
                                  { type: "string" }
                                ]
                              }
                            }
                          }
                        ]
                      },
                      opacity: {
                        oneOf: [
                          {
                            type: "number",
                            minimum: 0,
                            maximum: 1,
                            description: "Opacity value (0.0 = transparent, 1.0 = opaque)"
                          },
                          {
                            type: "object",
                            description: "State-based opacity",
                            properties: {
                              default: { type: "number", minimum: 0, maximum: 1 },
                              active: { type: "number", minimum: 0, maximum: 1 },
                              inactive: { type: "number", minimum: 0, maximum: 1 }
                            }
                          }
                        ]
                      }
                    }
                  },
                  animations: {
                    type: "array",
                    items: animationSchema
                  }
                }
              }
            },
            additionalProperties: {
              type: "object",
              description: "Per-segment configuration (overrides default)",
              properties: {
                selector: {
                  type: "string",
                  description: 'CSS selector override (defaults to "#<segment-id>")'
                },
                entity: {
                  type: "string",
                  format: "entity",
                  pattern: "^[a-z_]+\\.[a-z0-9_]+$",
                  description: "Entity ID (format: domain.object_id)",
                  examples: ["light.living_room", "switch.fan"]
                },
                tap_action: actionSchema,
                hold_action: actionSchema,
                double_tap_action: actionSchema,
                style: {
                  type: "object",
                  properties: {
                    fill: stateColorSchema,
                    stroke: stateColorSchema,
                    "stroke-width": {
                      title: "Stroke Width",
                      description: "SVG stroke width (number in pixels or CSS string)",
                      oneOf: [
                        {
                          type: "number",
                          minimum: 0,
                          maximum: 50,
                          description: "Uniform stroke width in pixels (0-50)"
                        },
                        {
                          type: "string",
                          pattern: "^\\d+(\\.\\d+)?(px|em|rem)?$",
                          description: "CSS stroke width value",
                          examples: ["2px", "1.5", "0.5em"]
                        },
                        {
                          type: "object",
                          description: "State-based stroke width",
                          properties: {
                            default: {
                              oneOf: [
                                { type: "number", minimum: 0, maximum: 50 },
                                { type: "string" }
                              ]
                            },
                            active: {
                              oneOf: [
                                { type: "number", minimum: 0, maximum: 50 },
                                { type: "string" }
                              ]
                            },
                            inactive: {
                              oneOf: [
                                { type: "number", minimum: 0, maximum: 50 },
                                { type: "string" }
                              ]
                            }
                          }
                        }
                      ]
                    },
                    opacity: {
                      oneOf: [
                        {
                          type: "number",
                          minimum: 0,
                          maximum: 1,
                          description: "Opacity value (0.0 = transparent, 1.0 = opaque)"
                        },
                        {
                          type: "object",
                          description: "State-based opacity",
                          properties: {
                            default: { type: "number", minimum: 0, maximum: 1 },
                            active: { type: "number", minimum: 0, maximum: 1 },
                            inactive: { type: "number", minimum: 0, maximum: 1 }
                          }
                        }
                      ]
                    }
                  }
                },
                animations: {
                  type: "array",
                  items: animationSchema
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // ALERT COMPONENT
      // ============================================================================
      alert: {
        type: "object",
        description: "Alert component configuration",
        properties: {
          // Color shorthand: expands to segment style overrides at runtime.
          //   alert.color.shape → shape.style.fill
          //   alert.color.bars  → bars.style.stroke
          color: {
            type: "object",
            description: "Colour shorthand: overrides the active preset's colours",
            properties: {
              shape: {
                type: "string",
                description: "Fill colour for the shield shape",
                examples: ["var(--lcards-orange)", "#ff9800", "theme:colors.ui.tertiary"]
              },
              bars: {
                type: "string",
                description: "Stroke colour for the bar lines",
                examples: ["var(--lcards-orange)", "#ff9800", "theme:colors.ui.tertiary"]
              }
            }
          },
          // User-defined presets merged over built-in presets.
          // Same key as a built-in (e.g. condition_red) overrides it;
          // a new key creates an additional preset selectable by name.
          custom_presets: {
            type: "object",
            description: "Custom or override presets (merged over built-ins)",
            additionalProperties: {
              type: "object",
              properties: {
                segments: {
                  type: "object",
                  properties: {
                    shape: {
                      type: "object",
                      properties: { style: { type: "object", properties: { fill: { type: "string" } } } }
                    },
                    bars: {
                      type: "object",
                      properties: { style: { type: "object", properties: { stroke: { type: "string" } } } }
                    }
                  }
                },
                text: {
                  type: "object",
                  additionalProperties: {
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      color: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          segments: {
            type: "object",
            description: "Per-segment fine-grained overrides (managed by Segments tab)",
            additionalProperties: {
              type: "object",
              properties: {
                style: {
                  type: "object",
                  properties: {
                    fill: { type: "string" },
                    stroke: { type: "string" }
                  }
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // DPAD COMPONENT
      // ============================================================================
      dpad: {
        type: "object",
        properties: {
          segments: {
            type: "object",
            description: 'Segment configurations. Use "default" key for common properties applied to all segments. Other keys are segment IDs (up, down, left, right, up-left, up-right, down-left, down-right, center).',
            additionalProperties: {
              type: "object",
              properties: {
                selector: {
                  type: "string",
                  description: "CSS selector for SVG element (defaults to #{segment-id} if not specified)"
                },
                entity: {
                  type: "string",
                  format: "entity",
                  pattern: "^[a-z_]+\\.[a-z0-9_]+$",
                  description: "Entity ID for this segment (format: domain.object_id, overrides card entity)",
                  examples: ["light.living_room", "media_player.tv"]
                },
                tap_action: actionSchema,
                hold_action: actionSchema,
                double_tap_action: actionSchema,
                style: {
                  type: "object",
                  description: "SVG styling for the segment",
                  properties: {
                    fill: stateColorSchema,
                    stroke: stateColorSchema,
                    "stroke-width": {
                      title: "Stroke Width",
                      description: "SVG stroke width (number in pixels, CSS string, or state-based)",
                      oneOf: [
                        {
                          type: "number",
                          minimum: 0,
                          maximum: 50,
                          description: "Stroke width in pixels (0-50)"
                        },
                        {
                          type: "string",
                          pattern: "^\\d+(\\.\\d+)?(px|em|rem)?$",
                          description: "CSS stroke width value",
                          examples: ["2px", "1.5", "0.5em"]
                        },
                        stateColorSchema
                      ]
                    }
                  }
                },
                animations: {
                  type: "array",
                  items: animationSchema
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // RANGES: STATE-DRIVEN PRESET SWITCHING
      // ============================================================================
      ranges_attribute: {
        type: "string",
        description: 'Entity attribute to use as the numeric value for ALL state-based range conditions (above:/below:/between: keys) across the entire card: icon_style.icon, icon_style.color, text color, background, border, and config.ranges preset switching. Use "brightness_pct" for a computed 0-100 light brightness value. Defaults to evaluating the raw entity state string.',
        examples: ["brightness_pct", "brightness", "temperature", "percentage", "current_position"],
        "x-ui-hints": {
          label: "Range Attribute",
          helper: 'Attribute to compare against range thresholds (above:/below:/between:) for all state-based configs. Use "brightness_pct" for lights. Leave blank to use entity state.'
        }
      },
      state_attribute: {
        type: "string",
        description: 'Entity attribute whose String() value is used as the highest-priority key for ALL exact-match state-color lookups across the card. Booleans become "true"/"false"; null becomes "null"; strings are used as-is. Classified state (active/inactive) is always derived from entity.state and is unaffected. Can be used alongside ranges_attribute.',
        examples: ["effect", "hvac_action", "charging", "preset_mode", "color_mode"],
        "x-ui-hints": {
          label: "State Attribute",
          helper: 'Attribute whose value is matched against color-config keys. Write YAML keys as strings (e.g. "fade", "true", "null"). Leave blank to match entity state directly.'
        }
      },
      state_classification: stateClassificationSchema,
      ranges: {
        type: "array",
        description: "State-driven preset switching: evaluates entity value against thresholds and applies matching preset",
        items: {
          type: "object",
          required: ["preset"],
          properties: {
            preset: {
              type: "string",
              description: "Component preset name to apply when this range matches"
            },
            attribute: {
              type: "string",
              description: "Override ranges_attribute for this entry only"
            },
            above: {
              type: "number",
              description: "Match when value is > this threshold (strictly greater)"
            },
            at_least: {
              type: "number",
              description: "Match when value is >= this threshold (inclusive)"
            },
            below: {
              type: "number",
              description: "Match when value is < this threshold (strictly less)"
            },
            at_most: {
              type: "number",
              description: "Match when value is <= this threshold (inclusive)"
            },
            equals: {
              description: "Match when value equals this (string comparison)",
              type: ["string", "number", "boolean"]
            },
            color: {
              type: "object",
              description: "Transient segment colour overrides applied while this range is active",
              properties: {
                shape: { type: "string", description: "Override fill for the shape segment" },
                bars: { type: "string", description: "Override stroke for the bars segment" }
              }
            }
          },
          additionalProperties: false
        },
        "x-ui-hints": {
          label: "State-Driven Presets"
        }
      },
      grid_options: gridOptionsSchema
    }
  };
}
const _valueTweenEaseOptions = [
  { value: "linear", label: "Linear" },
  { value: "in", label: "Power - In" },
  { value: "out", label: "Power - Out" },
  { value: "inOut", label: "Power - In/Out" },
  { value: "outIn", label: "Power - Out/In" },
  { value: "inQuad", label: "Quad - In" },
  { value: "outQuad", label: "Quad - Out (default)" },
  { value: "inOutQuad", label: "Quad - In/Out" },
  { value: "outInQuad", label: "Quad - Out/In" },
  { value: "inCubic", label: "Cubic - In" },
  { value: "outCubic", label: "Cubic - Out" },
  { value: "inOutCubic", label: "Cubic - In/Out" },
  { value: "outInCubic", label: "Cubic - Out/In" },
  { value: "inQuart", label: "Quart - In" },
  { value: "outQuart", label: "Quart - Out" },
  { value: "inOutQuart", label: "Quart - In/Out" },
  { value: "outInQuart", label: "Quart - Out/In" },
  { value: "inQuint", label: "Quint - In" },
  { value: "outQuint", label: "Quint - Out" },
  { value: "inOutQuint", label: "Quint - In/Out" },
  { value: "outInQuint", label: "Quint - Out/In" },
  { value: "inSine", label: "Sine - In" },
  { value: "outSine", label: "Sine - Out" },
  { value: "inOutSine", label: "Sine - In/Out" },
  { value: "outInSine", label: "Sine - Out/In" },
  { value: "inExpo", label: "Expo - In" },
  { value: "outExpo", label: "Expo - Out" },
  { value: "inOutExpo", label: "Expo - In/Out" },
  { value: "outInExpo", label: "Expo - Out/In" },
  { value: "inCirc", label: "Circ - In" },
  { value: "outCirc", label: "Circ - Out" },
  { value: "inOutCirc", label: "Circ - In/Out" },
  { value: "outInCirc", label: "Circ - Out/In" },
  { value: "inBack", label: "Back - In" },
  { value: "outBack", label: "Back - Out" },
  { value: "inOutBack", label: "Back - In/Out" },
  { value: "outInBack", label: "Back - Out/In" },
  { value: "inElastic", label: "Elastic - In" },
  { value: "outElastic", label: "Elastic - Out" },
  { value: "inOutElastic", label: "Elastic - In/Out" },
  { value: "outInElastic", label: "Elastic - Out/In" },
  { value: "inBounce", label: "Bounce - In" },
  { value: "outBounce", label: "Bounce - Out" },
  { value: "inOutBounce", label: "Bounce - In/Out" },
  { value: "outInBounce", label: "Bounce - Out/In" },
  { value: "spring", label: "Spring - Physics-based" }
];
function getSliderSchema(options = {}) {
  const {
    availablePresets = [],
    availableComponents = [],
    positionEnum = []
  } = options;
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/snootched/lcards/schemas/slider-schema",
    title: "LCARdS Slider Card Configuration",
    description: "Complete configuration schema for lcards-slider custom card",
    type: "object",
    properties: {
      // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
      ...cardLevelProperties,
      // ============================================================================
      // HOME ASSISTANT REQUIRED PROPERTIES
      // ============================================================================
      type: {
        type: "string",
        const: "custom:lcards-slider",
        description: "Home Assistant card type identifier (required)"
      },
      // ============================================================================
      // SHARED LCARDS PROPERTIES
      // ============================================================================
      data_sources: dataSourcesSchema,
      triggers_update: triggersUpdateSchema,
      // ============================================================================
      // CORE PROPERTIES
      // ============================================================================
      entity: entitySchema,
      ranges_attribute: {
        type: "string",
        description: 'Entity attribute to use as the numeric value for all range conditions (above:/below:/between: keys) in any state-based style config. Use "brightness_pct" for a computed 0–100 light brightness value. Defaults to evaluating the raw entity state string.',
        examples: ["brightness_pct", "brightness", "temperature", "percentage", "current_position"],
        "x-ui-hints": {
          label: "Range Attribute",
          helper: 'Attribute to compare against range thresholds (above:/below:/between:). Use "brightness_pct" for lights. Leave blank to use entity state.'
        }
      },
      state_attribute: {
        type: "string",
        description: 'Entity attribute whose String() value is used as the highest-priority key for ALL exact-match state-color lookups across the card. Booleans become "true"/"false"; null becomes "null"; strings are used as-is. Classified state (active/inactive) is always derived from entity.state and is unaffected. Can be used alongside ranges_attribute.',
        examples: ["effect", "hvac_action", "charging", "preset_mode", "color_mode"],
        "x-ui-hints": {
          label: "State Attribute",
          helper: 'Attribute whose value is matched against color-config keys. Write YAML keys as strings (e.g. "fade", "true", "null"). Leave blank to match entity state directly.'
        }
      },
      state_classification: stateClassificationSchema,
      id: cardIdSchema,
      tags: tagsSchema,
      // ============================================================================
      // SIZING
      // ============================================================================
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      // ============================================================================
      // MODE: PRESET OR COMPONENT
      // ============================================================================
      preset: {
        type: "string",
        enum: availablePresets,
        description: "Style preset name (mutually exclusive with advanced component)",
        examples: ["pills-basic", "gauge-basic"],
        "x-ui-hints": {
          label: "Style Preset",
          helper: "Choose a pre-configured slider style"
          // No selector - let auto-generation build it from enum
        }
      },
      component: {
        type: "string",
        // Only enforce enum when components are actually registered;
        // if availableComponents is empty the enum would reject all values
        ...availableComponents.length > 0 ? { enum: availableComponents } : {},
        description: "Advanced SVG component name (provides the SVG shell)",
        examples: ["default", "horizontal", "vertical", "picard-vertical"]
      },
      // ============================================================================
      // CONTROL CONFIGURATION
      // ============================================================================
      control: {
        type: "object",
        description: "Control behavior configuration",
        properties: {
          min: {
            type: "number",
            description: "Minimum value",
            examples: [0, -100, 16],
            "x-ui-hints": {
              label: "Minimum Value",
              helper: "Lowest value the slider can reach",
              selector: {
                number: {
                  mode: "box",
                  step: 1
                }
              }
            }
          },
          max: {
            type: "number",
            description: "Maximum value",
            examples: [100, 255, 30],
            "x-ui-hints": {
              label: "Maximum Value",
              helper: "Highest value the slider can reach",
              selector: {
                number: {
                  mode: "box",
                  step: 1
                }
              }
            }
          },
          step: {
            type: "number",
            minimum: 0.01,
            description: "Step increment",
            examples: [1, 0.5, 5],
            "x-ui-hints": {
              label: "Step",
              helper: "Value increment/decrement step",
              selector: {
                number: {
                  mode: "box",
                  step: 0.01
                }
              }
            }
          },
          attribute: {
            type: "string",
            description: "Entity attribute to control (default varies by domain)",
            examples: ["brightness", "temperature", "position", "percentage"]
          },
          locked: {
            type: "boolean",
            description: "Whether slider is read-only (auto-determined by domain)",
            examples: [true, false]
          },
          invert_value: {
            type: "boolean",
            default: false,
            description: "Invert value mapping (flip min↔max). When true, slider at min position sends max value to entity.",
            examples: [false, true]
          }
        }
      },
      // ============================================================================
      // TEXT CONFIGURATION
      // ============================================================================
      text: getTextSchema({ positionEnum }),
      // ============================================================================
      // STYLE CONFIGURATION
      // ============================================================================
      style: {
        type: "object",
        description: "Visual style configuration",
        properties: {
          track: {
            type: "object",
            description: "Track appearance configuration",
            properties: {
              display: {
                type: "object",
                description: "Visual display range configuration (what pills/gauge render). Defaults to control range if not specified.",
                properties: {
                  min: {
                    type: "number",
                    description: "Minimum value shown on visual scale (default: control.min)",
                    examples: [0, -20, 10]
                  },
                  max: {
                    type: "number",
                    description: "Maximum value shown on visual scale (default: control.max)",
                    examples: [100, 60, 35]
                  },
                  unit: {
                    type: "string",
                    description: "Display unit for labels (overrides entity unit_of_measurement)",
                    examples: ["°C", "%", "rpm", "lux"]
                  }
                }
              },
              type: {
                type: "string",
                enum: ["pills", "gauge", "shaped"],
                description: "Track visual style (pills = segmented, gauge = ruler, shaped = solid fill inside a clip-path shape)",
                enumDescriptions: [
                  "Segmented pill style (interactive sliders)",
                  "Ruler gauge style (typically for display)",
                  "Solid fill clipped to a shape boundary (use with component: shaped)"
                ]
              },
              height: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 10,
                    maximum: 200,
                    description: "Track height in pixels"
                  },
                  {
                    type: "string",
                    pattern: "^(\\d+px|\\d+\\.?\\d*rem|theme:)",
                    description: "CSS value or theme token",
                    examples: ["40px", "2rem", "theme:components.slider.track.height"]
                  }
                ],
                "x-ui-hints": {
                  selector: { number: { min: 10, max: 200, mode: "box", unit_of_measurement: "px" } },
                  label: "Height",
                  helper: "Track height in pixels (use YAML for theme tokens)"
                }
              },
              margin: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Track margin in pixels (applies to all sides)",
                    examples: [10, 0]
                  },
                  {
                    type: "object",
                    description: "Per-side margin configuration",
                    properties: {
                      top: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        description: "Top margin in pixels"
                      },
                      right: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        description: "Right margin in pixels"
                      },
                      bottom: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        description: "Bottom margin in pixels"
                      },
                      left: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        description: "Left margin in pixels"
                      }
                    },
                    examples: [
                      { top: 10, right: 5, bottom: 10, left: 5 },
                      { top: 0, right: 0, bottom: 0, left: 0 }
                    ]
                  }
                ]
              },
              orientation: {
                type: "string",
                enum: ["horizontal", "vertical"],
                default: "horizontal",
                description: "Slider orientation - affects track rendering direction",
                enumDescriptions: [
                  "Horizontal slider (left to right)",
                  "Vertical slider (bottom to top)"
                ]
              },
              invert_fill: {
                type: "boolean",
                default: false,
                description: "Invert visual fill direction. When true, fills from opposite end (right/top instead of left/bottom).",
                examples: [false, true]
              },
              segments: {
                type: "object",
                description: "Pills/segments configuration (for type: pills)",
                properties: {
                  enabled: {
                    type: "boolean",
                    default: true,
                    description: "Enable segmented pills"
                  },
                  count: {
                    type: "number",
                    minimum: 2,
                    maximum: 200,
                    default: 15,
                    description: 'Number of pill segments (or "auto" to calculate based on size)'
                  },
                  gap: {
                    oneOf: [
                      {
                        type: "number",
                        minimum: 0,
                        maximum: 50,
                        default: 4,
                        description: "Gap between pills in pixels"
                      },
                      {
                        type: "string",
                        pattern: "^(\\d+px|theme:|\\{theme:)",
                        description: "CSS value or theme token"
                      }
                    ],
                    "x-ui-hints": {
                      selector: { number: { min: 0, max: 50, mode: "box", unit_of_measurement: "px" } },
                      label: "Gap Size",
                      helper: "Space between segments in pixels (use YAML for theme tokens)"
                    }
                  },
                  shape: {
                    type: "object",
                    properties: {
                      radius: {
                        oneOf: [
                          {
                            type: "number",
                            minimum: 0,
                            maximum: 50,
                            default: 4,
                            description: "Border radius in pixels"
                          },
                          {
                            type: "string",
                            pattern: "^(\\d+px|theme:)",
                            description: "CSS value or theme token"
                          }
                        ],
                        "x-ui-hints": {
                          selector: { number: { min: 0, max: 50, mode: "box", unit_of_measurement: "px" } },
                          label: "Border Radius",
                          helper: "Corner roundness in pixels (use YAML for theme tokens)"
                        }
                      }
                    }
                  },
                  size: {
                    type: "object",
                    description: "Pill dimensions (width for horizontal, height for vertical)",
                    properties: {
                      width: {
                        type: "number",
                        minimum: 1,
                        maximum: 200,
                        default: 12,
                        description: "Fixed width of each pill in horizontal mode (pixels)"
                      },
                      height: {
                        type: "number",
                        minimum: 1,
                        maximum: 200,
                        default: 12,
                        description: "Fixed height of each pill in vertical mode (pixels)"
                      }
                    }
                  },
                  gradient: {
                    type: "object",
                    description: "Colour gradient configuration",
                    properties: {
                      start: stateColorSchema,
                      end: stateColorSchema
                    }
                  },
                  appearance: {
                    type: "object",
                    properties: {
                      unfilled: {
                        type: "object",
                        properties: {
                          opacity: {
                            type: "number",
                            minimum: 0,
                            maximum: 1
                          }
                        }
                      },
                      filled: {
                        type: "object",
                        properties: {
                          opacity: {
                            type: "number",
                            minimum: 0,
                            maximum: 1
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          gauge: {
            type: "object",
            description: "Gauge-specific configuration (for type: gauge)",
            properties: {
              progress_bar: {
                type: "object",
                description: "Progress indicator bar",
                properties: {
                  color: stateColorSchema,
                  layer: {
                    type: "string",
                    enum: ["background", "foreground"],
                    default: "background",
                    "x-ui-hints": {
                      selector: {
                        select: {
                          mode: "dropdown",
                          options: [
                            { value: "background", label: "Background (behind ticks)" },
                            { value: "foreground", label: "Foreground (in front of ticks)" }
                          ]
                        }
                      },
                      label: "Layer",
                      helper: "Whether the progress bar renders behind or in front of gauge tick marks"
                    }
                  },
                  height: {
                    oneOf: [
                      { type: "number", minimum: 1, maximum: 100 },
                      { type: "string" }
                    ],
                    "x-ui-hints": {
                      selector: { number: { min: 1, max: 100, mode: "box", unit_of_measurement: "px" } },
                      label: "Height",
                      helper: "Cross-sectional thickness (width in vertical, height in horizontal)"
                    }
                  },
                  align: {
                    type: "string",
                    enum: ["start", "middle", "end"],
                    default: "middle",
                    "x-ui-hints": {
                      selector: {
                        select: {
                          mode: "dropdown",
                          options: [
                            { value: "start", label: "Start" },
                            { value: "middle", label: "Middle" },
                            { value: "end", label: "End" }
                          ]
                        }
                      },
                      label: "Alignment",
                      helper: "Cross-sectional alignment (left/middle/right in vertical, top/middle/bottom in horizontal)"
                    }
                  },
                  padding: {
                    type: "object",
                    description: "Padding to offset from aligned position",
                    properties: {
                      top: { type: "number", minimum: 0 },
                      right: { type: "number", minimum: 0 },
                      bottom: { type: "number", minimum: 0 },
                      left: { type: "number", minimum: 0 }
                    }
                  },
                  background: {
                    type: "object",
                    description: "Background track drawn behind the progress bar fill, clamped to control range. Leave unset for no background.",
                    properties: {
                      color: {
                        ...stateColorSchema,
                        description: "Background track colour. Supports state-based maps.",
                        "x-ui-hints": {
                          label: "Background Colour",
                          helper: "Colour for the background track. Supports state-reactive values."
                        }
                      },
                      height: {
                        oneOf: [
                          { type: "number", minimum: 1, maximum: 100 },
                          { type: "string" }
                        ],
                        "x-ui-hints": {
                          selector: { number: { min: 1, max: 100, mode: "box", unit_of_measurement: "px" } },
                          label: "Background Thickness",
                          helper: "Cross-section of the background track. Defaults to the same as the progress bar height."
                        }
                      },
                      radius: {
                        oneOf: [
                          { type: "number", minimum: 0 },
                          {
                            type: "object",
                            properties: {
                              start: { type: "number", minimum: 0 },
                              end: { type: "number", minimum: 0 }
                            }
                          }
                        ],
                        "x-ui-hints": {
                          selector: { number: { min: 0, max: 50, mode: "box", unit_of_measurement: "px" } },
                          label: "Background Radius",
                          helper: "Corner radius for the background track. Defaults to progress_bar.radius if unset."
                        }
                      },
                      min: {
                        type: "number",
                        "x-ui-hints": {
                          label: "Background Start",
                          helper: "Value at which the background track starts. Defaults to control.min (clamped to display range)."
                        }
                      },
                      max: {
                        type: "number",
                        "x-ui-hints": {
                          label: "Background End",
                          helper: "Value at which the background track ends. Defaults to control.max (clamped to display range)."
                        }
                      }
                    },
                    "x-ui-hints": {
                      label: "Background Track",
                      helper: "Optional track behind the progress bar fill, clamped to control range."
                    }
                  },
                  radius: {
                    oneOf: [
                      { type: "number", minimum: 0 },
                      {
                        type: "object",
                        properties: {
                          start: { type: "number", minimum: 0, description: "Radius on start end (left for horizontal, bottom for vertical)" },
                          end: { type: "number", minimum: 0, description: "Radius on end (right for horizontal, top for vertical)" }
                        },
                        "x-ui-hints": { label: "Per-End Radius" }
                      }
                    ],
                    "x-ui-hints": {
                      selector: { number: { min: 0, max: 50, mode: "box", unit_of_measurement: "px" } },
                      label: "Corner Radius",
                      helper: "Uniform radius (number) or per-end via YAML: { start: 6, end: 0 }. start = left/bottom, end = right/top."
                    }
                  }
                }
              },
              scale: {
                type: "object",
                description: "Gauge scale configuration",
                properties: {
                  tick_marks: {
                    type: "object",
                    properties: {
                      major: {
                        type: "object",
                        properties: {
                          enabled: { type: "boolean" },
                          interval: {
                            type: "number",
                            minimum: 1,
                            description: "Interval for major tick marks"
                          },
                          color: stateColorSchema,
                          height: { type: "number" },
                          width: { type: "number" }
                        }
                      },
                      minor: {
                        type: "object",
                        properties: {
                          enabled: { type: "boolean" },
                          interval: {
                            type: "number",
                            minimum: 1,
                            description: "Interval for minor tick marks"
                          },
                          color: stateColorSchema,
                          height: { type: "number" },
                          width: { type: "number" }
                        }
                      }
                    }
                  },
                  labels: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      show_unit: {
                        type: "boolean",
                        description: "Show unit suffix on scale labels. Set false to hide even when entity has unit_of_measurement.",
                        examples: [true, false]
                      },
                      unit: {
                        type: "string",
                        description: "Unit suffix for labels. Takes priority over entity unit_of_measurement.",
                        examples: ["°C", "%", "lux"]
                      },
                      color: stateColorSchema,
                      font_size: { type: "number" },
                      padding: { type: "number" }
                    }
                  }
                }
              },
              indicator: {
                type: "object",
                description: "Current value indicator configuration",
                properties: {
                  enabled: {
                    type: ["boolean", "string"],
                    description: `Show/hide current value indicator. Also accepts a Jinja2/JS template string resolving to a boolean (e.g. "{{ not is_state('sensor.x', 'unavailable') }}") for state-driven visibility.`,
                    "x-ui-hints": {
                      selector: { boolean: {} }
                    }
                  },
                  type: {
                    type: "string",
                    enum: ["line", "round", "triangle"],
                    description: "Indicator shape type"
                  },
                  size: {
                    type: "object",
                    description: "Indicator dimensions",
                    properties: {
                      width: {
                        type: "number",
                        minimum: 0,
                        description: "Indicator width in pixels (or rx for round type)"
                      },
                      height: {
                        type: "number",
                        minimum: 0,
                        description: "Indicator height in pixels (or ry for round type)"
                      }
                    }
                  },
                  rotation: {
                    type: "number",
                    minimum: -180,
                    maximum: 180,
                    default: 0,
                    description: "Rotation angle in degrees (for triangle type)",
                    "x-ui-hints": {
                      label: "Rotation",
                      helper: "Rotate indicator in degrees",
                      selector: {
                        number: {
                          mode: "slider",
                          min: -180,
                          max: 180,
                          step: 1,
                          unit_of_measurement: "°"
                        }
                      }
                    }
                  },
                  offset: {
                    type: "object",
                    description: "Position offset relative to progress bar end",
                    properties: {
                      x: {
                        type: "number",
                        description: "Horizontal offset in pixels"
                      },
                      y: {
                        type: "number",
                        description: "Vertical offset in pixels"
                      }
                    }
                  },
                  color: stateColorSchema,
                  border: {
                    type: "object",
                    description: "Indicator border configuration",
                    properties: {
                      enabled: {
                        type: "boolean",
                        description: "Enable indicator border"
                      },
                      width: {
                        type: "number",
                        minimum: 0,
                        description: "Border width in pixels"
                      },
                      color: stateColorSchema
                    }
                  }
                }
              },
              marker_indicator: {
                type: "object",
                description: `Default shape for value-marker indicators (ranges with a "value" key). Overrides global defaults for this preset/component. Can still be overridden per-range via the range's own "indicator" block. Defaults: type=triangle, size=20×20, rotation=180.`,
                properties: {
                  type: {
                    type: "string",
                    enum: ["line", "round", "triangle"],
                    description: "Marker indicator shape type (default: triangle)"
                  },
                  align: {
                    type: "string",
                    enum: ["start", "center", "end"],
                    default: "center",
                    description: "Cross-axis alignment within the track zone. start=left edge (vertical)/top (horizontal), center=middle, end=right/bottom. Use start on Picard to pin the marker to the tick column regardless of card width.",
                    "x-ui-hints": {
                      label: "Cross-axis Align",
                      helper: "Where to pin the marker along the non-value axis (start = tick-edge on Picard)",
                      selector: { select: { mode: "dropdown", options: [
                        { value: "start", label: "Start (left / top)" },
                        { value: "center", label: "Center (default)" },
                        { value: "end", label: "End (right / bottom)" }
                      ] } }
                    }
                  },
                  size: {
                    type: "object",
                    properties: {
                      width: { type: "number", minimum: 0, description: "Width in pixels" },
                      height: { type: "number", minimum: 0, description: "Height in pixels" }
                    }
                  },
                  rotation: {
                    type: "number",
                    minimum: -180,
                    maximum: 180,
                    default: 180,
                    description: "Rotation in degrees (default: 180, triangle points toward ticks)",
                    "x-ui-hints": {
                      selector: { number: { mode: "slider", min: -180, max: 180, step: 1, unit_of_measurement: "°" } }
                    }
                  },
                  offset: {
                    type: "object",
                    description: "Fine-tune position within the track zone after align is applied. offset.x=minorHeight+trimWidth (default 20) places the triangle tip at the outer edge of minor ticks when align=start.",
                    properties: {
                      x: { type: "number", description: "Horizontal offset in pixels" },
                      y: { type: "number", description: "Vertical offset in pixels" }
                    }
                  },
                  color: stateColorSchema,
                  border: {
                    type: "object",
                    properties: {
                      enabled: { type: "boolean" },
                      width: { type: "number", minimum: 0 },
                      color: stateColorSchema
                    }
                  }
                }
              }
            }
          },
          border: {
            type: "object",
            description: "Per-side border configuration with optional corner radius",
            properties: {
              radius: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 0,
                    description: "Uniform corner radius in pixels applied to all four card corners",
                    examples: [12, 8, 0]
                  },
                  {
                    type: "string",
                    description: "CSS variable or px/rem value for uniform corner radius, resolved at render time",
                    examples: [
                      "var(--ha-card-border-radius)",
                      "var(--ha-card-border-radius, 12px)",
                      "12px",
                      "0.75rem"
                    ]
                  },
                  {
                    type: "object",
                    description: "Per-corner radius: use to round only specific corners (e.g. only the free end on a bordered LCARS slider). Each corner also accepts a CSS variable string.",
                    properties: {
                      top_left: { oneOf: [{ type: "number", minimum: 0 }, { type: "string" }] },
                      top_right: { oneOf: [{ type: "number", minimum: 0 }, { type: "string" }] },
                      bottom_right: { oneOf: [{ type: "number", minimum: 0 }, { type: "string" }] },
                      bottom_left: { oneOf: [{ type: "number", minimum: 0 }, { type: "string" }] }
                    }
                  }
                ],
                description: "Corner radius: number or CSS variable string for uniform rounding, or per-corner object. Supports var(--ha-card-border-radius), px values, and rem values.",
                examples: [
                  12,
                  "var(--ha-card-border-radius)",
                  "var(--ha-card-border-radius, 12px)",
                  { top_left: 0, bottom_left: 0, top_right: "var(--ha-card-border-radius)", bottom_right: "var(--ha-card-border-radius)" }
                ],
                "x-ui-hints": {
                  label: "Corner Radius",
                  helper: "Round the card corners. Accepts a pixel number, a CSS variable (e.g. var(--ha-card-border-radius)), or YAML per-corner object for individual corner control.",
                  selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } }
                }
              },
              left: {
                type: "object",
                description: "Left border cap configuration",
                properties: {
                  enabled: {
                    type: "boolean",
                    description: "Enable left border"
                  },
                  size: {
                    type: "number",
                    minimum: 0,
                    description: "Border width in pixels"
                  },
                  color: stateColorSchema
                }
              },
              top: {
                type: "object",
                description: "Top border cap configuration",
                properties: {
                  enabled: {
                    type: "boolean",
                    description: "Enable top border"
                  },
                  size: {
                    type: "number",
                    minimum: 0,
                    description: "Border height in pixels"
                  },
                  color: stateColorSchema
                }
              },
              right: {
                type: "object",
                description: "Right border cap configuration",
                properties: {
                  enabled: {
                    type: "boolean",
                    description: "Enable right border"
                  },
                  size: {
                    type: "number",
                    minimum: 0,
                    description: "Border width in pixels"
                  },
                  color: stateColorSchema
                }
              },
              bottom: {
                type: "object",
                description: "Bottom border cap configuration",
                properties: {
                  enabled: {
                    type: "boolean",
                    description: "Enable bottom border"
                  },
                  size: {
                    type: "number",
                    minimum: 0,
                    description: "Border height in pixels"
                  },
                  color: stateColorSchema
                }
              }
            }
          },
          range: {
            type: "object",
            description: "Visual styling for range-band frame/border elements (used by components like Picard that render a decorative frame around the ranges track).",
            properties: {
              border: {
                type: "object",
                description: "Range track border styling",
                properties: {
                  color: { ...stateColorSchema, description: "Range border colour (default: theme:components.slider.range.border.color)" }
                }
              },
              frame: {
                type: "object",
                description: "Range track frame styling (decorative outline, e.g. Picard component)",
                properties: {
                  color: { ...stateColorSchema, description: "Range frame colour. Falls back to the top border colour if unset." }
                }
              }
            }
          },
          solid_bar: {
            type: "object",
            description: "Solid value-bar styling (used by components with a dedicated solid-bar zone, e.g. Picard).",
            properties: {
              color: { ...stateColorSchema, description: "Solid bar colour. Falls back to the top border colour if unset." }
            }
          },
          animation: {
            type: "object",
            description: "Styling for the built-in scanning/activity animation indicator (used by components like Picard/Demo).",
            properties: {
              indicator: {
                type: "object",
                properties: {
                  color: { ...stateColorSchema, description: "Animation indicator colour (default: theme:components.slider.animation.indicator.color)" }
                }
              }
            }
          },
          // ====================================================================
          // RANGES CONFIGURATION (Phase 2)
          // ====================================================================
          ranges: {
            type: "array",
            description: "Colour-coded value ranges and point markers.\n\nTwo item types:\n• Band range (min+max): coloured background zone, rect in gauge mode, segment overrides in pills mode.\n• Value marker (value): live point indicator, triangle on gauge ticks, highlighted pill in pills mode.\n\nmin/max/value resolve static numbers, {entity.state}/{entity.attributes.x}/{states.domain.object_id.state} tokens, {datasource:name}, {config.x}/{variables.x} tokens, theme token references, and [[[JS]]], evaluated synchronously (no Jinja2; see range.label.text for full Jinja2/DataSource async support on the label caption).",
            items: {
              type: "object",
              properties: {
                min: {
                  type: ["number", "string"],
                  description: "Range start value (in display space). Supports static numbers or templates: {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, [[[JS return expr]]]. (Synchronous only; no Jinja2.)",
                  examples: [0, 18, 80, "{entity.attributes.min_temp}", "{states.input_number.low.state}", "{datasource:low_threshold}", "[[[return Number(entity.state) - 5]]]"]
                },
                max: {
                  type: ["number", "string"],
                  description: "Range end value (in display space). Supports static numbers or templates: {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, [[[JS return expr]]]. (Synchronous only; no Jinja2.)",
                  examples: [20, 24, 100, "{entity.attributes.max_temp}", "{states.input_number.high.state}", "{datasource:high_threshold}", "[[[return Number(entity.state) + 5]]]"]
                },
                color: stateColorSchema,
                opacity: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  default: 0.3,
                  description: "Background opacity (0=transparent, 1=solid, default: 0.3)"
                },
                value: {
                  type: ["string", "number"],
                  description: "Numeric value or template resolving to a position on the track. When present (instead of min/max), renders a point marker rather than a coloured band. Supports {entity.state}, {entity.attributes.xxx}, {states.domain.object_id.state}, {datasource:name}, {config.x}, {variables.x}, and [[[JS]]] templates. (Synchronous only; no Jinja2.)",
                  "x-ui-hints": {
                    label: "Marker Value",
                    helper: "Template or number: places a visual marker at this value rather than drawing a coloured band"
                  }
                },
                indicator: {
                  type: "object",
                  description: "Gauge mode: per-marker indicator shape override. Fallback chain: this block → style.gauge.marker_indicator (preset default) → hardcoded defaults (triangle 20×20, rotation 180, no border). Values not specified here inherit from the next level in the chain.",
                  properties: {
                    type: { type: "string", enum: ["line", "round", "triangle"], description: "Indicator shape type (default: triangle)" },
                    align: {
                      type: "string",
                      enum: ["start", "center", "end"],
                      default: "center",
                      description: "Cross-axis alignment: start=left/top edge, center=middle, end=right/bottom. Overrides the preset marker_indicator.align for this range only."
                    },
                    color: { ...stateColorSchema, description: "Indicator fill color (defaults to range color). Supports state-object syntax ({ active, inactive, above:N, … }) and theme:/var()/computed colour tokens." },
                    size: {
                      type: "object",
                      properties: {
                        width: { type: "number", description: "Width in pixels" },
                        height: { type: "number", description: "Height in pixels" }
                      }
                    },
                    offset: {
                      type: "object",
                      properties: {
                        x: { type: "number", description: "Horizontal offset in pixels" },
                        y: { type: "number", description: "Vertical offset in pixels" }
                      }
                    },
                    rotation: { type: "number", description: "Rotation angle in degrees" },
                    border: {
                      type: "object",
                      properties: {
                        enabled: { type: "boolean", default: true },
                        color: stateColorSchema,
                        width: { type: "number" }
                      }
                    }
                  }
                },
                pill_style: {
                  type: "object",
                  description: "Pills mode: visual appearance of the marker pill.",
                  properties: {
                    stroke: { type: "boolean", default: true, description: "Show an outline border on the marker pill to distinguish it from neighbours" },
                    stroke_width: { type: "number", default: 2, description: "Border thickness in pixels" },
                    stroke_color: { ...stateColorSchema, description: "Outline border colour. Falls back to the pill fill colour (range.color) if unset." }
                  },
                  "x-ui-hints": {
                    label: "Pill Marker Style",
                    helper: "Controls how the marker pill appears in pills mode"
                  }
                },
                label: {
                  type: "object",
                  description: "Optional text caption shown next to the marker (gauge mode) or highlighted pill (pills mode).",
                  properties: {
                    text: {
                      type: "string",
                      description: "Label text. Supports the full template system: {entity.attributes.xxx} / {states.entity_id.state} tokens, {{ Jinja2 }}, [[[ JS ]]], and {datasource:name} references, or a plain static string.",
                      "x-ui-hints": {
                        label: "Label Text",
                        helper: "Static text or a template: {entity.attributes.x} / {states.entity_id.state} tokens, {{ Jinja2 }}, [[[ JS ]]], or {datasource:name} are all supported."
                      }
                    },
                    color: { ...stateColorSchema, description: "State-based colour of the label text. Falls back to theme:components.slider.indicator.label.color." },
                    font_size: { type: "number", description: "Label font size in pixels. Defaults to the gauge tick-label size." },
                    offset: {
                      type: "object",
                      description: "Pixel offset from the marker’s default label position (above the marker in horizontal orientation, beside it in vertical).",
                      properties: {
                        x: { type: "number", description: "Horizontal offset in pixels" },
                        y: { type: "number", description: "Vertical offset in pixels" }
                      }
                    }
                  },
                  "x-ui-hints": {
                    label: "Label",
                    helper: "Optional text caption shown next to the marker"
                  }
                }
              }
            },
            examples: [
              [
                { min: 0, max: 20, color: "var(--error-color)", opacity: 0.3 },
                { min: 20, max: 80, color: "var(--success-color)", opacity: 0.3 },
                { min: 80, max: 100, color: "var(--warning-color)", opacity: 0.3 }
              ]
            ],
            "x-ui-hints": {
              label: "Value Ranges",
              helper: "Define colour-coded zones to provide visual context for values (e.g., cold/comfort/hot)"
            }
          },
          // ====================================================================
          // SHAPED COMPONENT CONFIGURATION
          // ====================================================================
          shaped: {
            type: "object",
            description: "Shaped component configuration (used with component: shaped)",
            properties: {
              type: {
                type: "string",
                enum: ["lozenge", "rect", "rounded", "diamond", "hexagon", "polygon", "path"],
                default: "lozenge",
                description: "Shape boundary for the clip path",
                "x-ui-hints": {
                  label: "Shape Type",
                  helper: "Geometry used to clip the slider fill"
                }
              },
              radius: {
                type: "number",
                description: "Corner radius in pixels: lozenge auto = min(w,h)/2, rounded default = 8",
                examples: [8, 20, 40],
                "x-ui-hints": {
                  label: "Corner Radius",
                  helper: "Override automatic corner radius (lozenge / rounded shapes)",
                  selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } }
                }
              },
              fill: {
                type: "object",
                description: "Value fill appearance (the “filled” portion of the shape)",
                properties: {
                  color: {
                    ...stateColorSchema,
                    description: "Fill colour. Supports state-object syntax ({ active, inactive, above:N, … }) and theme:/var()/computed colour tokens."
                  }
                }
              },
              text_bands: {
                type: "object",
                description: "Band sizes (pixels reserved outside the shape body for text fields)",
                properties: {
                  top: {
                    type: "object",
                    description: "Top band (vertical mode only)",
                    properties: { size: { type: "number", default: 36, "x-ui-hints": { selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } } } } }
                  },
                  bottom: {
                    type: "object",
                    description: "Bottom band (vertical mode only)",
                    properties: { size: { type: "number", default: 36, "x-ui-hints": { selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } } } } }
                  },
                  left: {
                    type: "object",
                    description: "Left band (horizontal mode only)",
                    properties: { size: { type: "number", default: 60, "x-ui-hints": { selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } } } } }
                  },
                  right: {
                    type: "object",
                    description: "Right band (horizontal mode only)",
                    properties: { size: { type: "number", default: 60, "x-ui-hints": { selector: { number: { min: 0, max: 200, mode: "box", unit_of_measurement: "px" } } } } }
                  }
                }
              },
              track: {
                type: "object",
                description: "Shape track appearance",
                properties: {
                  background: {
                    ...stateColorSchema,
                    description: "Shape interior background colour (the “empty” portion). Supports state-object syntax and theme:/var()/computed colour tokens."
                  }
                }
              },
              polygon: {
                type: "object",
                description: "Polygon shape options (shape type: polygon)",
                properties: {
                  points: {
                    type: "array",
                    description: "Array of [xPct, yPct] pairs (0–1) defining polygon vertices relative to shape bounds",
                    items: {
                      type: "array",
                      items: { type: "number", minimum: 0, maximum: 1 },
                      minItems: 2,
                      maxItems: 2
                    }
                  }
                }
              },
              path: {
                type: "object",
                description: "Raw SVG path options (shape type: path)",
                properties: {
                  d: {
                    type: "string",
                    description: "SVG path d-attribute (absolute coordinates)"
                  },
                  translate: {
                    type: "boolean",
                    default: false,
                    description: "Wrap path in translate(bodyX, bodyY) so coordinates are relative to the shape body origin"
                  }
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // ACTIONS
      // ============================================================================
      tap_action: actionSchema,
      hold_action: actionSchema,
      double_tap_action: actionSchema,
      // ============================================================================
      // ANIMATIONS
      // ============================================================================
      animations: {
        type: "array",
        description: "Visual animations triggered by user interactions or entity state changes",
        items: animationSchema
      },
      // ============================================================================
      // BACKGROUND ANIMATION
      // ============================================================================
      background_animation: backgroundAnimationSchema,
      // ============================================================================
      // VALUE TWEEN
      // ============================================================================
      value_tween: {
        type: "object",
        description: "Eases the gauge/pills track and markers between old and new positions on entity-driven state changes (does not affect direct drag interaction). Distinct from the animations array, which is trigger/preset based.",
        examples: [
          { enabled: true, duration: 500, ease: "outQuad" },
          { enabled: true, duration: 700, ease: "spring", targets: { track: true, markers: false } }
        ],
        properties: {
          enabled: {
            type: "boolean",
            default: true,
            description: "Enable value tweening. Automatically forced off when the OS-level prefers-reduced-motion setting is active, regardless of this value.",
            "x-ui-hints": {
              label: "Enable Value Tween",
              selector: { boolean: {} }
            }
          },
          duration: {
            type: "number",
            minimum: 0,
            maximum: 5e3,
            default: 500,
            description: "Tween duration in milliseconds (0-5000)",
            "x-ui-hints": {
              label: "Duration",
              selector: { number: { mode: "box", min: 0, max: 5e3, step: 50, unit_of_measurement: "ms" } }
            }
          },
          ease: {
            type: "string",
            enum: _valueTweenEaseOptions.map((o) => o.value),
            default: "outQuad",
            description: "anime.js v4 easing function used for the tween",
            "x-ui-hints": {
              label: "Easing",
              selector: { select: { mode: "dropdown", options: _valueTweenEaseOptions } }
            }
          },
          targets: {
            type: "object",
            description: "Which elements the tween applies to. All default to true.",
            properties: {
              track: {
                type: "boolean",
                default: true,
                description: "Tween the gauge/shaped fill or the pills opacity sweep, whichever the card's track type uses.",
                "x-ui-hints": { label: "Track", selector: { boolean: {} } }
              },
              markers: {
                type: "boolean",
                default: true,
                description: "Tween threshold/range marker position (and, in pills mode, which pill is highlighted). Applies to `gauge` and `pills` track types: `shaped` never renders markers at all.",
                "x-ui-hints": { label: "Markers", selector: { boolean: {} } }
              }
            }
          }
        }
      },
      // ============================================================================
      // DRAG VALUE BADGE
      // ============================================================================
      drag_badge: {
        type: "object",
        description: "Live value badge that follows the drag position while the slider is being actively dragged by the user (never shown for entity-driven/external state changes). Mirrors HA's native slider drag badge.",
        examples: [
          { enabled: true },
          { enabled: true, format: { decimals: 0, show_unit: true }, release: { behavior: "instant" } }
        ],
        properties: {
          enabled: {
            type: "boolean",
            default: false,
            description: "Show a live value badge that tracks the drag position while dragging",
            "x-ui-hints": {
              label: "Enable Value Badge",
              selector: { boolean: {} }
            }
          },
          format: {
            type: "object",
            description: "Number formatting for the badge text",
            properties: {
              decimals: {
                type: "number",
                minimum: 0,
                maximum: 4,
                description: "Fixed number of decimal places. Leave blank to use locale-default formatting.",
                "x-ui-hints": {
                  label: "Decimal Places",
                  helper: "Leave blank for locale-default formatting",
                  selector: { number: { mode: "box", min: 0, max: 4, step: 1 } }
                }
              },
              show_unit: {
                type: "boolean",
                default: true,
                description: "Show the unit suffix on the badge",
                "x-ui-hints": {
                  label: "Show Unit",
                  selector: { boolean: {} }
                }
              },
              unit: {
                type: "string",
                description: "Unit suffix override. Leave blank to use the track's display unit (style.track.display.unit / entity unit_of_measurement).",
                examples: ["°C", "%", "lux"],
                "x-ui-hints": {
                  label: "Unit Override",
                  helper: "Leave blank to use the track's display unit"
                }
              }
            }
          },
          font_size: {
            type: "number",
            minimum: 8,
            maximum: 48,
            default: 14,
            description: "Badge text size in pixels",
            "x-ui-hints": {
              label: "Font Size",
              selector: { number: { mode: "box", min: 8, max: 48, unit_of_measurement: "px" } }
            }
          },
          offset: {
            type: "object",
            description: "Pixel offset from the default anchor point (above the track in horizontal orientation, beside it in vertical).",
            properties: {
              x: { type: "number", description: "Horizontal offset in pixels" },
              y: { type: "number", description: "Vertical offset in pixels" }
            }
          },
          color: { ...stateColorSchema, description: "Badge text colour. Falls back to theme:components.slider.drag_badge.text.color." },
          background: {
            type: "object",
            description: "Badge background chip",
            properties: {
              enabled: {
                type: "boolean",
                default: true,
                description: "Show a background chip behind the badge text",
                "x-ui-hints": { label: "Show Background", selector: { boolean: {} } }
              },
              color: { ...stateColorSchema, description: "Badge background colour. Falls back to a theme-aware translucent surface colour." }
            }
          },
          border: {
            type: "object",
            description: "Badge border",
            properties: {
              enabled: {
                type: "boolean",
                default: true,
                description: "Show a border around the badge",
                "x-ui-hints": { label: "Show Border", selector: { boolean: {} } }
              },
              width: {
                type: "number",
                minimum: 0,
                maximum: 10,
                default: 1,
                description: "Border width in pixels"
              },
              color: { ...stateColorSchema, description: "Badge border colour. Falls back to theme:components.slider.border.color.default." }
            }
          },
          release: {
            type: "object",
            description: "What happens to the badge when the drag is released (pointer-up), before the entity commit.",
            properties: {
              behavior: {
                type: "string",
                enum: ["fade", "instant"],
                default: "fade",
                description: "fade = linger briefly then fade out; instant = hide immediately on release. Automatically forced to instant when prefers-reduced-motion is active.",
                "x-ui-hints": {
                  label: "Release Behaviour",
                  selector: {
                    select: {
                      mode: "dropdown",
                      options: [
                        { value: "fade", label: "Fade out (default)" },
                        { value: "instant", label: "Hide instantly" }
                      ]
                    }
                  }
                }
              },
              duration: {
                type: "number",
                minimum: 0,
                maximum: 2e3,
                default: 500,
                description: "Fade-out duration in milliseconds (only used when behavior = fade)",
                "x-ui-hints": {
                  label: "Fade Duration",
                  selector: { number: { mode: "box", min: 0, max: 2e3, step: 50, unit_of_measurement: "ms" } }
                }
              }
            }
          }
        }
      },
      // ============================================================================
      // SOUNDS
      // ============================================================================
      sounds: soundsSchema,
      grid_options: gridOptionsSchema
    }
  };
}
const elbowComponents = {
  "header-left": {
    orientation: "header-left",
    features: ["simple", "segmented"],
    layout: {
      position: "header",
      side: "left"
    },
    /**
     * Generate header-left elbow path
     * Elbow in top-left corner: vertical bar on left, horizontal bar on top
     *
     * Shape description (drawing clockwise from top-left):
     * - Start at top edge where outer arc ends
     * - Right along top edge
     * - Down to horizontal bar bottom
     * - Left to inner arc start
     * - Inner arc (concave) to vertical bar
     * - Down vertical bar
     * - Left along bottom
     * - Up vertical bar left edge
     * - Outer arc (convex) back to start
     *
     * Arc geometry:
     * - Outer arc center: (outerRadius, outerRadius)
     * - Inner arc center: (horizontal, vertical)
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry (position, side, horizontal, vertical, outerRadius, innerRadius)
     * @param {Object} config.container - Container dimensions (width, height)
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const path = [
        // Start at where outer arc meets top edge (tangent is vertical)
        `M ${outerRadius} 0`,
        // Line along top edge to the right
        `L ${width} 0`,
        // Line down to bottom of horizontal bar
        `L ${width} ${vertical}`,
        // Line left along bottom of horizontal bar to inner arc start (tangent is horizontal)
        `L ${horizontal + innerRadius} ${vertical}`,
        // Inner arc: curves inward (concave)
        // From (horizontal + innerRadius, vertical) to (horizontal, vertical + innerRadius)
        // Goes counter-clockwise (sweep-flag = 0) to curve inward
        `A ${innerRadius} ${innerRadius} 0 0 0 ${horizontal} ${vertical + innerRadius}`,
        // Line down right edge of vertical bar
        `L ${horizontal} ${height}`,
        // Line left along bottom
        `L 0 ${height}`,
        // Line up left edge of vertical bar to outer arc start (tangent is horizontal)
        `L 0 ${outerRadius}`,
        // Outer arc: curves outward (convex)
        // From (0, outerRadius) to (outerRadius, 0)
        // Goes clockwise (sweep-flag = 1) to curve outward
        `A ${outerRadius} ${outerRadius} 0 0 1 ${outerRadius} 0`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Header Left Elbow",
      description: "Top-left corner elbow (vertical bar on left, horizontal bar on top)",
      version: "1.0.0"
    }
  },
  "header-right": {
    orientation: "header-right",
    features: ["simple", "segmented"],
    layout: {
      position: "header",
      side: "right"
    },
    /**
     * Generate header-right elbow path
     * Elbow in top-right corner: vertical bar on right, horizontal bar on top
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const vBarLeft = width - horizontal;
      const path = [
        // Start at top-right corner (with outer arc radius offset)
        `M ${width - outerRadius} 0`,
        // Outer arc: curves from top to right edge
        `A ${outerRadius} ${outerRadius} 0 0 1 ${width} ${outerRadius}`,
        // Line down right edge to bottom
        `L ${width} ${height}`,
        // Line left along bottom of vertical bar
        `L ${vBarLeft} ${height}`,
        // Line up right edge of content area (left edge of vertical bar)
        `L ${vBarLeft} ${vertical + innerRadius}`,
        // Inner arc: curves inward from vertical bar to horizontal bar
        // Goes counter-clockwise (sweep-flag = 0) to curve inward
        `A ${innerRadius} ${innerRadius} 0 0 0 ${vBarLeft - innerRadius} ${vertical}`,
        // Line left along bottom of horizontal bar
        `L 0 ${vertical}`,
        // Line up left edge
        `L 0 0`,
        // Line right along top to arc start
        `L ${width - outerRadius} 0`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Header Right Elbow",
      description: "Top-right corner elbow (vertical bar on right, horizontal bar on top)",
      version: "1.0.0"
    }
  },
  "footer-left": {
    orientation: "footer-left",
    features: ["simple", "segmented"],
    layout: {
      position: "footer",
      side: "left"
    },
    /**
     * Generate footer-left elbow path
     * Elbow in bottom-left corner: vertical bar on left, horizontal bar on bottom
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const hBarTop = height - vertical;
      const path = [
        // Start at bottom-left corner (with outer arc radius offset)
        `M 0 ${height - outerRadius}`,
        // Outer arc: curves from left edge to bottom
        `A ${outerRadius} ${outerRadius} 0 0 0 ${outerRadius} ${height}`,
        // Line right along bottom edge
        `L ${width} ${height}`,
        // Line up right edge of horizontal bar
        `L ${width} ${hBarTop}`,
        // Line left along top of horizontal bar to inner arc start
        `L ${horizontal + innerRadius} ${hBarTop}`,
        // Inner arc: curves inward from horizontal bar to vertical bar
        // Goes clockwise (sweep-flag = 1) to curve inward
        `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${hBarTop - innerRadius}`,
        // Line up left edge of vertical bar
        `L ${horizontal} 0`,
        // Line left along top
        `L 0 0`,
        // Line down left edge to arc start
        `L 0 ${height - outerRadius}`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Footer Left Elbow",
      description: "Bottom-left corner elbow (vertical bar on left, horizontal bar on bottom)",
      version: "1.0.0"
    }
  },
  "footer-right": {
    orientation: "footer-right",
    features: ["simple", "segmented"],
    layout: {
      position: "footer",
      side: "right"
    },
    /**
     * Generate footer-right elbow path
     * Elbow in bottom-right corner: vertical bar on right, horizontal bar on bottom
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { position, side, horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const vBarLeft = width - horizontal;
      const hBarTop = height - vertical;
      const path = [
        // Start at bottom-right corner (with outer arc radius offset)
        `M ${width} ${height - outerRadius}`,
        // Line up right edge
        `L ${width} 0`,
        // Line left along top
        `L ${vBarLeft} 0`,
        // Line down left edge of vertical bar to inner arc start
        `L ${vBarLeft} ${hBarTop - innerRadius}`,
        // Inner arc: curves inward from vertical bar to horizontal bar
        // Goes clockwise (sweep-flag = 1) to curve inward
        `A ${innerRadius} ${innerRadius} 0 0 1 ${vBarLeft - innerRadius} ${hBarTop}`,
        // Line left along top of horizontal bar
        `L 0 ${hBarTop}`,
        // Line down left edge
        `L 0 ${height}`,
        // Line right along bottom to arc start
        `L ${width - outerRadius} ${height}`,
        // Outer arc: curves from bottom to right edge
        `A ${outerRadius} ${outerRadius} 0 0 0 ${width} ${height - outerRadius}`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Footer Right Elbow",
      description: "Bottom-right corner elbow (vertical bar on right, horizontal bar on bottom)",
      version: "1.0.0"
    }
  },
  // ============================================================================
  // CONTAINED VARIANTS - Mirrored elbows on both ends
  // ============================================================================
  "header-contained": {
    orientation: "header-contained",
    features: ["simple"],
    layout: {
      position: "header",
      side: "contained"
    },
    /**
     * Generate header-contained elbow path
     * Horizontal bar with mirrored elbows on both left and right ends (top)
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const path = [
        // Start at left outer arc
        `M ${outerRadius} 0`,
        // Outer arc on left (top-left corner)
        `A ${outerRadius} ${outerRadius} 0 0 0 0 ${outerRadius}`,
        // Line down left edge
        `L 0 ${height}`,
        // Line right along bottom of left vertical bar
        `L ${horizontal} ${height}`,
        // Line up to inner arc start (left side)
        `L ${horizontal} ${vertical + innerRadius}`,
        // Inner arc on left (curves outward to match outer arc)
        `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal + innerRadius} ${vertical}`,
        // Line right along horizontal bar to right inner arc start
        `L ${width - (horizontal + innerRadius)} ${vertical}`,
        // Inner arc on right (curves outward to match outer arc)
        `A ${innerRadius} ${innerRadius} 0 0 1 ${width - horizontal} ${vertical + innerRadius}`,
        // Line down to bottom of right vertical bar
        `L ${width - horizontal} ${height}`,
        // Line right along bottom
        `L ${width} ${height}`,
        // Line up right edge
        `L ${width} ${outerRadius}`,
        // Outer arc on right (top-right corner)
        `A ${outerRadius} ${outerRadius} 0 0 0 ${width - outerRadius} 0`,
        // Line left along top to start
        `L ${outerRadius} 0`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Header Contained",
      description: "Horizontal bar with mirrored elbows on both ends (top)",
      version: "1.0.0"
    }
  },
  "footer-contained": {
    orientation: "footer-contained",
    features: ["simple"],
    layout: {
      position: "footer",
      side: "contained"
    },
    /**
     * Generate footer-contained elbow path
     * Horizontal bar with mirrored elbows on both left and right ends (bottom)
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius } = config.geometry;
      const { width, height } = config.container;
      const hBarTop = height - vertical;
      const path = [
        // Start at bottom-left outer arc
        `M 0 ${height - outerRadius}`,
        // Outer arc on left (bottom-left corner)
        `A ${outerRadius} ${outerRadius} 0 0 0 ${outerRadius} ${height}`,
        // Line right along bottom
        `L ${width - outerRadius} ${height}`,
        // Outer arc on right (bottom-right corner)
        `A ${outerRadius} ${outerRadius} 0 0 0 ${width} ${height - outerRadius}`,
        // Line up right edge
        `L ${width} 0`,
        // Line left along top of right vertical bar
        `L ${width - horizontal} 0`,
        // Line down to inner arc start (right side)
        `L ${width - horizontal} ${hBarTop - innerRadius}`,
        // Inner arc on right (curves inward)
        `A ${innerRadius} ${innerRadius} 0 0 1 ${width - (horizontal + innerRadius)} ${hBarTop}`,
        // Line left along horizontal bar to left inner arc start
        `L ${horizontal + innerRadius} ${hBarTop}`,
        // Inner arc on left (curves inward)
        `A ${innerRadius} ${innerRadius} 0 0 1 ${horizontal} ${hBarTop - innerRadius}`,
        // Line up to top of left vertical bar
        `L ${horizontal} 0`,
        // Line left along top
        `L 0 0`,
        // Line down left edge to start
        `L 0 ${height - outerRadius}`,
        // Close path
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Footer Contained",
      description: "Horizontal bar with mirrored elbows on both ends (bottom)",
      version: "1.0.0"
    }
  },
  // ============================================================================
  // OPEN VARIANTS - Horizontal bar only, no vertical arms
  // ============================================================================
  "header-open": {
    orientation: "header-open",
    features: ["simple"],
    layout: {
      position: "header",
      side: "open"
    },
    /**
     * Generate header-open elbow path
     * Simple horizontal bar at top (no vertical arms)
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { vertical } = config.geometry;
      const { width } = config.container;
      const path = [
        // Simple rectangle across the top
        `M 0 0`,
        `L ${width} 0`,
        `L ${width} ${vertical}`,
        `L 0 ${vertical}`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Header Open",
      description: "Simple horizontal bar at top (no vertical arms)",
      version: "1.0.0"
    }
  },
  "footer-open": {
    orientation: "footer-open",
    features: ["simple"],
    layout: {
      position: "footer",
      side: "open"
    },
    /**
     * Generate footer-open elbow path
     * Simple horizontal bar at bottom (no vertical arms)
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { vertical } = config.geometry;
      const { width, height } = config.container;
      const hBarTop = height - vertical;
      const path = [
        // Simple rectangle across the bottom
        `M 0 ${hBarTop}`,
        `L ${width} ${hBarTop}`,
        `L ${width} ${height}`,
        `L 0 ${height}`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Footer Open",
      description: "Simple horizontal bar at bottom (no vertical arms)",
      version: "1.0.0"
    }
  },
  // ============================================================================
  // DIAGONAL-CAP VARIANTS - Configurable angular cuts
  // ============================================================================
  "diagonal-cap-left": {
    orientation: "diagonal-cap-left",
    features: ["simple", "segmented"],
    layout: {
      position: "header",
      side: "left"
    },
    /**
     * Generate diagonal-cap-left elbow path
     * Top-left with configurable diagonal cuts on both corners
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
      const { width, height } = config.container;
      const angleRad = diagonalAngle * Math.PI / 180;
      const outerCutH = outerRadius * Math.cos(angleRad);
      const outerCutV = outerRadius * Math.sin(angleRad);
      const innerCutH = innerRadius * Math.cos(angleRad);
      const innerCutV = innerRadius * Math.sin(angleRad);
      const path = [
        // Start after outer diagonal cut
        `M ${outerCutH} 0`,
        `L ${width} 0`,
        `L ${width} ${vertical}`,
        // Approach inner corner from right
        `L ${horizontal + innerCutH} ${vertical}`,
        // Inner diagonal cut
        `L ${horizontal} ${vertical + innerCutV}`,
        // Down to bottom
        `L ${horizontal} ${height}`,
        `L 0 ${height}`,
        // Up left edge to outer diagonal start
        `L 0 ${outerCutV}`,
        // Outer diagonal cut back to start
        `L ${outerCutH} 0`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Diagonal Cap Left",
      description: "Top-left with configurable diagonal cut (0° = square, 45° = diagonal)",
      version: "1.0.0"
    }
  },
  "diagonal-cap-right": {
    orientation: "diagonal-cap-right",
    features: ["simple", "segmented"],
    layout: {
      position: "header",
      side: "right"
    },
    /**
     * Generate diagonal-cap-right elbow path
     * Top-right with configurable diagonal cuts on both corners
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
      const { width, height } = config.container;
      const vBarLeft = width - horizontal;
      const angleRad = diagonalAngle * Math.PI / 180;
      const outerCutH = outerRadius * Math.cos(angleRad);
      const outerCutV = outerRadius * Math.sin(angleRad);
      const innerCutH = innerRadius * Math.cos(angleRad);
      const innerCutV = innerRadius * Math.sin(angleRad);
      const path = [
        // Start at top-left
        `M 0 0`,
        // Line to outer diagonal start
        `L ${width - outerCutH} 0`,
        // Outer diagonal cut down to right edge
        `L ${width} ${outerCutV}`,
        // Down right edge
        `L ${width} ${height}`,
        `L ${vBarLeft} ${height}`,
        // Up to inner corner
        `L ${vBarLeft} ${vertical + innerCutV}`,
        // Inner diagonal cut
        `L ${vBarLeft - innerCutH} ${vertical}`,
        // Back to left
        `L 0 ${vertical}`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Diagonal Cap Right",
      description: "Top-right with configurable diagonal cut (0° = square, 45° = diagonal)",
      version: "1.0.0"
    }
  },
  "diagonal-cap-footer-left": {
    orientation: "diagonal-cap-footer-left",
    features: ["simple", "segmented"],
    layout: {
      position: "footer",
      side: "left"
    },
    /**
     * Generate diagonal-cap-footer-left elbow path
     * Bottom-left with configurable diagonal cuts on both corners
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
      const { width, height } = config.container;
      const angleRad = diagonalAngle * Math.PI / 180;
      const outerCutH = outerRadius * Math.cos(angleRad);
      const outerCutV = outerRadius * Math.sin(angleRad);
      const innerCutH = innerRadius * Math.cos(angleRad);
      const innerCutV = innerRadius * Math.sin(angleRad);
      const path = [
        // Start at top-left
        `M 0 0`,
        `L ${horizontal} 0`,
        // Down left edge to inner corner
        `L ${horizontal} ${height - vertical - innerCutV}`,
        // Inner diagonal cut
        `L ${horizontal + innerCutH} ${height - vertical}`,
        // Across to right edge
        `L ${width} ${height - vertical}`,
        `L ${width} ${height}`,
        // Along bottom edge
        `L ${outerCutH} ${height}`,
        // Outer diagonal cut
        `L 0 ${height - outerCutV}`,
        // Up left edge
        `L 0 0`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Diagonal Cap Footer Left",
      description: "Bottom-left with configurable diagonal cut (0° = square, 45° = diagonal)",
      version: "1.0.0"
    }
  },
  "diagonal-cap-footer-right": {
    orientation: "diagonal-cap-footer-right",
    features: ["simple", "segmented"],
    layout: {
      position: "footer",
      side: "right"
    },
    /**
     * Generate diagonal-cap-footer-right elbow path
     * Bottom-right with configurable diagonal cuts on both corners
     *
     * @param {Object} config - Path generator configuration
     * @param {Object} config.geometry - Elbow geometry (includes diagonalAngle)
     * @param {Object} config.container - Container dimensions
     * @returns {string} SVG path string
     */
    pathGenerator: (config) => {
      const { horizontal, vertical, outerRadius, innerRadius, diagonalAngle = 45 } = config.geometry;
      const { width, height } = config.container;
      const vBarLeft = width - horizontal;
      const angleRad = diagonalAngle * Math.PI / 180;
      const outerCutH = outerRadius * Math.cos(angleRad);
      const outerCutV = outerRadius * Math.sin(angleRad);
      const innerCutH = innerRadius * Math.cos(angleRad);
      const innerCutV = innerRadius * Math.sin(angleRad);
      const path = [
        // Start at top-left
        `M 0 0`,
        `L ${width} 0`,
        `L ${width} ${height - outerCutV}`,
        // Outer diagonal cut
        `L ${width - outerCutH} ${height}`,
        // Along bottom edge
        `L 0 ${height}`,
        `L 0 ${height - vertical}`,
        // Approach inner corner
        `L ${vBarLeft - innerCutH} ${height - vertical}`,
        // Inner diagonal cut
        `L ${vBarLeft} ${height - vertical - innerCutV}`,
        // Up right edge
        `L ${vBarLeft} 0`,
        `Z`
      ];
      return path.join(" ");
    },
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Diagonal Cap Footer Right",
      description: "Bottom-right with configurable diagonal cut (0° = square, 45° = diagonal)",
      version: "1.0.0"
    }
  },
  // ============================================================================
  // FRAME VARIANTS - Full border around content area
  // ============================================================================
  /**
   * The 'frame' type draws a rectangular ring (2–4 sided border) around the card.
   * Per-side widths, per-corner outer/inner curves, optional open sides, and
   * segmented (double-ring) support are all handled in LCARdSElbow._generateFrameSVG().
   * This component entry supplies registry metadata and layout hints only —
   * actual path generation is NOT delegated to pathGenerator here.
   */
  "frame": {
    orientation: "frame",
    features: ["simple", "segmented"],
    layout: {
      position: "frame",
      side: "frame"
    },
    /**
     * Frame paths are generated entirely inside LCARdSElbow._generateFrameSVG().
     * This stub exists so the component registry can return valid feature/layout
     * metadata for type 'frame'.
     */
    pathGenerator: (_config) => "",
    metadata: {
      type: "elbow",
      pack: "core",
      name: "Frame",
      description: "Full rectangular frame (2–4 sided border with per-side widths and per-corner curves)",
      version: "1.0.0"
    }
  }
};
function getElbowTypeNames() {
  return Object.keys(elbowComponents);
}
const frameLength = (description2) => ({ type: ["number", "string"], description: description2 });
const frameSideSchema = (side, defaultFrom) => ({
  type: "object",
  description: `The ${side} side.`,
  properties: {
    enabled: { type: "boolean", default: true, description: `Draw the ${side} side (false leaves it open).` },
    bar_width: frameLength(`Thickness of the ${side} side (default: ${defaultFrom}).`),
    bar_height: frameLength(`Thickness of the ${side} side (same as bar_width).`),
    thickness: frameLength(`Thickness of the ${side} side (same as bar_width).`)
  }
});
const frameCornersSchema = (defaults2) => ({
  type: "object",
  description: "Per-corner curves.",
  properties: Object.fromEntries(["top_left", "top_right", "bottom_left", "bottom_right"].map((corner) => [corner, {
    type: "object",
    description: `The ${corner.replace("_", "-")} corner.`,
    properties: {
      outer_curve: frameLength(`Outer radius (default: ${defaults2}).`),
      inner_curve: frameLength("Inner radius (default: half the outer curve).")
    }
  }]))
});
const frameRingProperties = (defaultBarWidth) => ({
  bar_width: frameLength(`Thickness of the left and right sides (default: ${defaultBarWidth}).`),
  bar_height: frameLength("Thickness of the top and bottom sides (default: bar_width)."),
  outer_curve: frameLength("Outer radius of every corner (default: half of bar_width)."),
  inner_curve: frameLength("Inner radius of every corner (default: half of outer_curve)."),
  top: frameSideSchema("top", "bar_height"),
  bottom: frameSideSchema("bottom", "bar_height"),
  left: frameSideSchema("left", "bar_width"),
  right: frameSideSchema("right", "bar_width"),
  corners: frameCornersSchema("outer_curve")
});
const frameSchema = {
  type: "object",
  // Colour: the outer ring is painted with elbow.segment.color like every elbow;
  // the inner ring has its own colour (inner_frame.color). There is no frame-level
  // or per-side colour.
  description: "Frame elbow (elbow.type: frame): a 2 to 4 sided rectangular border with per-side thickness and per-corner curves. Its colour is elbow.segment.color.",
  properties: {
    ...frameRingProperties(90),
    segments: {
      type: "object",
      description: "style: segmented only: a second, inner ring inside the frame.",
      properties: {
        gap: frameLength("Space between the outer and inner ring (default: 4)."),
        inner_frame: {
          type: "object",
          description: "The inner ring: the same keys as the frame itself, plus its own colour.",
          properties: {
            ...frameRingProperties(28),
            color: { ...stateColorSchema, description: "Colour of the inner ring (default: the outer ring colour, elbow.segment.color). State maps supported." }
          }
        }
      }
    }
  }
};
function getElbowSchema(options = {}) {
  const {
    availablePresets = [],
    positionEnum = []
  } = options;
  const availableElbowTypes = getElbowTypeNames();
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/snootched/lcards/schemas/elbow-schema",
    title: "LCARdS Elbow Card Configuration",
    description: "Complete configuration schema for lcards-elbow custom card with LCARS corner treatments. Supports dynamic theme integration via HA-LCARS input_number helpers (input_number.lcars_horizontal, input_number.lcars_vertical).",
    type: "object",
    required: ["type"],
    examples: [
      {
        type: "custom:lcards-elbow",
        elbow: {
          type: "header-left",
          style: "simple",
          segment: {
            bar_width: "theme",
            bar_height: "theme",
            outer_curve: "auto",
            color: { default: "#FF9900" }
          }
        },
        text: {
          name: {
            show: true,
            value: "Navigation"
          }
        }
      },
      {
        type: "custom:lcards-elbow",
        elbow: {
          type: "footer-right",
          style: "simple",
          segment: {
            bar_width: 120,
            bar_height: 30,
            outer_curve: 60,
            inner_curve: 30
          }
        }
      }
    ],
    properties: {
      // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
      ...cardLevelProperties,
      // ============================================================================
      // HOME ASSISTANT REQUIRED PROPERTIES
      // ============================================================================
      type: {
        type: "string",
        const: "custom:lcards-elbow",
        description: "Home Assistant card type identifier (required)"
      },
      // ============================================================================
      // CORE PROPERTIES (inherited from button)
      // ============================================================================
      entity: entitySchema,
      ranges_attribute: {
        type: "string",
        description: 'Entity attribute to use as the numeric value for all range conditions (above:/below:/between: keys) in any state-based style config. Use "brightness_pct" for a computed 0–100 light brightness value. Defaults to evaluating the raw entity state string.',
        examples: ["brightness_pct", "brightness", "temperature", "percentage", "current_position"],
        "x-ui-hints": {
          label: "Range Attribute",
          helper: 'Attribute to compare against range thresholds (above:/below:/between:). Use "brightness_pct" for lights. Leave blank to use entity state.'
        }
      },
      state_attribute: {
        type: "string",
        description: 'Entity attribute whose String() value is used as the highest-priority key for ALL exact-match state-color lookups across the card. Booleans become "true"/"false"; null becomes "null"; strings are used as-is. Classified state (active/inactive) is always derived from entity.state and is unaffected. Can be used alongside ranges_attribute.',
        examples: ["effect", "hvac_action", "charging", "preset_mode", "color_mode"],
        "x-ui-hints": {
          label: "State Attribute",
          helper: 'Attribute whose value is matched against color-config keys. Write YAML keys as strings (e.g. "fade", "true", "null"). Leave blank to match entity state directly.'
        }
      },
      interactive: {
        type: "boolean",
        default: true,
        description: "When false, hover colour changes and hover animations are suppressed. The cursor defaults to the arrow unless overridden via style.cursor. Tap/hold actions still fire if configured.",
        "x-ui-hints": {
          label: "Show hover effects",
          helper: "Disable to suppress colour change and hover animations on mouse-over. Does not affect tap/hold actions."
        }
      },
      state_classification: stateClassificationSchema,
      id: cardIdSchema,
      tags: tagsSchema,
      // ============================================================================
      // SIZING
      // ============================================================================
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      preset: {
        type: "string",
        enum: availablePresets,
        description: "Style preset name (inherits from button presets)",
        examples: ["lozenge", "bullet", "outline", "pill"]
      },
      // ============================================================================
      // ELBOW CONFIGURATION (elbow-specific)
      // ============================================================================
      elbow: {
        type: "object",
        required: ["type"],
        description: "Elbow geometry and styling configuration",
        properties: {
          type: {
            type: "string",
            enum: availableElbowTypes,
            // Dynamically generated from component registry
            description: "Position of the elbow corner on the card",
            enumDescriptions: [
              "Top-left corner: vertical bar on left, horizontal bar on top",
              "Top-right corner: vertical bar on right, horizontal bar on top",
              "Bottom-left corner: vertical bar on left, horizontal bar on bottom",
              "Bottom-right corner: vertical bar on right, horizontal bar on bottom"
            ],
            examples: ["header-left", "footer-right"]
          },
          style: {
            type: "string",
            enum: ["simple", "segmented"],
            default: "simple",
            description: "Elbow rendering style",
            enumDescriptions: [
              "Simple: Single elbow with one curved corner",
              "Segmented: Double concentric elbows with gap (TNG Picard aesthetic)"
            ],
            examples: ["simple", "segmented"]
          },
          // ===== SIMPLE STYLE CONFIGURATION =====
          segment: {
            type: "object",
            description: "Configuration for simple style (single elbow)",
            default: {
              bar_width: 120,
              bar_height: 20,
              outer_curve: "auto"
            },
            examples: [
              {
                bar_width: 90,
                bar_height: 20,
                outer_curve: "auto",
                color: {
                  default: "#888888",
                  active: "#FF9900",
                  inactive: "#444444"
                }
              },
              {
                bar_width: 150,
                bar_height: 150,
                outer_curve: 75,
                inner_curve: 37.5
              }
            ],
            properties: {
              bar_width: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 10,
                    maximum: 500,
                    default: 90,
                    description: "Width of vertical sidebar (pixels)",
                    examples: [90, 120, 150]
                  },
                  {
                    type: "string",
                    description: "Use 'theme' to bind to input_number.lcars_vertical, or a CSS length expression (e.g. 'clamp(60px, 8vw, 120px)')",
                    examples: ["theme", "clamp(60px, 8vw, 120px)"]
                  }
                ],
                default: 90,
                description: 'Width of vertical sidebar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_vertical',
                examples: [90, 120, 150, "theme"],
                "x-ui-hints": {
                  label: "Bar Width",
                  helper: "Vertical bar thickness (pixels or theme binding)",
                  selector: {
                    choose: {
                      choices: {
                        pixels: {
                          selector: {
                            number: {
                              mode: "slider",
                              min: 10,
                              max: 500,
                              step: 5,
                              slider_ticks: false,
                              unit_of_measurement: "px"
                            }
                          }
                        },
                        theme: {
                          selector: {
                            select: {
                              options: [
                                {
                                  value: "theme",
                                  label: "Bind to input_number.lcars_vertical"
                                }
                              ]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              bar_height: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 10,
                    maximum: 500,
                    default: 20,
                    description: "Height of horizontal bar (pixels)",
                    examples: [20, 30, 90]
                  },
                  {
                    type: "string",
                    description: "Use 'theme' to bind to input_number.lcars_horizontal, or a CSS length expression (e.g. 'clamp(20px, 4vh, 60px)')",
                    examples: ["theme", "clamp(20px, 4vh, 60px)"]
                  }
                ],
                description: 'Height of horizontal bar. Use number for static value or "theme" for dynamic binding to HA-LCARS input_number.lcars_horizontal. Defaults to bar_width if not specified.',
                examples: [20, 30, 90, "theme"],
                "x-ui-hints": {
                  label: "Bar Height",
                  helper: "Horizontal bar thickness (pixels or theme binding)",
                  selector: {
                    choose: {
                      choices: {
                        pixels: {
                          selector: {
                            number: {
                              mode: "slider",
                              min: 10,
                              max: 500,
                              step: 5,
                              slider_ticks: false,
                              unit_of_measurement: "px"
                            }
                          }
                        },
                        theme: {
                          selector: {
                            select: {
                              options: [
                                {
                                  value: "theme",
                                  label: "Bind to input_number.lcars_horizontal"
                                }
                              ]
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              outer_curve: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 0,
                    maximum: 500,
                    description: "Outer corner radius in pixels",
                    examples: [45, 75, 100]
                  },
                  {
                    type: "string",
                    description: "Keyword or CSS expression. Keywords: 'auto'/'arm_width' = bar_width/2, 'arm_height' = bar_height/2, 'arm_max' = max(bar_width,bar_height)/2 (recommended), 'arm_min' = min(bar_width,bar_height)/2, 'arm_fill' = max(bar_width,bar_height). CSS: e.g. 'clamp(30px, 4vw, 60px)'",
                    examples: ["auto", "arm_width", "arm_height", "arm_max", "arm_min", "arm_fill", "clamp(30px, 4vw, 60px)"]
                  }
                ],
                default: "auto",
                description: "Outer corner radius. Keywords: 'auto'/'arm_width' = bar_width/2 (LCARS classic), 'arm_height' = bar_height/2, 'arm_max' = max(bar_width,bar_height)/2 (recommended for paired elbows, same as auto for typical configs), 'arm_min' = min(bar_width,bar_height)/2, 'arm_fill' = max(bar_width,bar_height) (fills dominant arm). Or set explicit pixels.",
                $comment: "Arc tangent points always arrive at 0° to their edges. Render-time clamp: outerRadius ≤ min(card_w, card_h) keeps tangent points within card viewport. Use arm_max for consistent paired elbows; equals auto (bar_width/2) when bar_width >= bar_height.",
                "x-ui-hints": {
                  label: "Outer Curve",
                  helper: "Arc radius mode: arm_max recommended for consistent paired elbows",
                  defaultOneOfBranch: 0,
                  selector: {
                    number: {
                      mode: "slider",
                      step: 1,
                      unit_of_measurement: "px"
                    }
                  }
                }
              },
              inner_curve: {
                oneOf: [
                  {
                    type: "number",
                    minimum: 0,
                    maximum: 500,
                    description: "Inner corner radius in pixels",
                    examples: [22.5, 37.5, 50]
                  },
                  {
                    type: "string",
                    description: "Keyword or CSS expression. Keywords: 'auto' = outer_curve/2 (LCARS formula), 'arm_width' = bar_width/2, 'arm_height' = bar_height/2, 'arm_max' = max(w,h)/2, 'arm_min' = min(w,h)/2, 'arm_fill' = max(w,h). CSS: e.g. 'clamp(10px, 2vw, 30px)'",
                    examples: ["auto", "arm_max", "arm_height", "arm_min", "clamp(10px, 2vw, 30px)"]
                  }
                ],
                $comment: "LCARS formula default: inner_curve = outer_curve / 2. Keywords use the same bar dimension formulas as outer_curve, independently of the outer value.",
                "x-ui-hints": {
                  label: "Inner Curve",
                  helper: "Inner arc radius: auto = outer_curve / 2 (LCARS formula)",
                  selector: {
                    number: {
                      mode: "slider",
                      step: 0.5,
                      unit_of_measurement: "px"
                    }
                  }
                }
              },
              outer_curve_clamp: {
                oneOf: [
                  {
                    type: "string",
                    enum: ["card", "none"],
                    description: "'card' (default) clamps outer_curve to min(card_w, card_h), keeps arc within viewport. 'none' disables clamping: arc is exactly the computed value; SVG overflow:hidden clips any overflow. Use 'none' for consistent paired elbows regardless of card height."
                  },
                  {
                    type: "number",
                    minimum: 0,
                    maximum: 500,
                    description: "Explicit px ceiling for outer radius: hard cap independent of card or arm dimensions"
                  }
                ],
                default: "card",
                $comment: "Issue #361: two same-config elbows in differently-sized cards get different radii because 'card' clamp uses the card height. Set 'none' to decouple radius from card height.",
                "x-ui-hints": {
                  label: "Curve Clamp",
                  helper: "card = clamp to viewport (default), none = no clamp (use for paired elbows)"
                }
              },
              color: {
                ...stateColorSchema,
                description: "Segment colour (string or state-based object)",
                examples: [
                  "#FF9900",
                  "theme:colors.text.onDark",
                  {
                    default: "#888888",
                    active: "#FF9900",
                    inactive: "#444444",
                    unavailable: "#666666"
                  }
                ]
              }
            }
          },
          // ===== SEGMENTED STYLE CONFIGURATION =====
          segments: {
            type: "object",
            description: "Configuration for segmented style (double concentric elbows with gap)",
            default: {
              gap: 4,
              outer_segment: {
                bar_width: 88,
                bar_height: 10
              },
              inner_segment: {
                bar_width: 28,
                bar_height: 10
              }
            },
            examples: [
              {
                gap: 4,
                outer_segment: {
                  bar_width: 90,
                  bar_height: 90,
                  outer_curve: 45,
                  inner_curve: 22.5,
                  color: "#FF9900"
                },
                inner_segment: {
                  bar_width: 60,
                  bar_height: 60,
                  color: "#FFCC99"
                }
              }
            ],
            properties: {
              gap: {
                type: "number",
                minimum: 0,
                maximum: 50,
                default: 4,
                description: "Gap between outer and inner segments (pixels)",
                examples: [2, 4, 6, 8]
              },
              outer_segment: {
                type: "object",
                required: ["bar_width"],
                description: "Outer segment (frame) configuration",
                examples: [
                  {
                    bar_width: 90,
                    bar_height: 90,
                    outer_curve: 45,
                    inner_curve: 22.5,
                    color: "#FF9900",
                    entity_id: "light.outer"
                  }
                ],
                properties: {
                  entity_id: {
                    type: "string",
                    format: "entity",
                    pattern: "^[a-z_]+\\.[a-z0-9_]+$",
                    description: "Entity ID for state-based colour (format: domain.object_id)",
                    examples: ["light.outer_frame", "switch.outer_power"]
                  },
                  bar_width: {
                    oneOf: [
                      { type: "number", minimum: 1, maximum: 500 },
                      { type: "string", description: "CSS length expression (e.g. 'clamp(60px, 8vw, 120px)')" }
                    ],
                    description: "Vertical bar thickness (pixels or CSS length) - REQUIRED",
                    examples: [90, 120, 150, "clamp(60px, 8vw, 120px)"]
                  },
                  bar_height: {
                    oneOf: [
                      // Any positive thickness: the shell strategy uses 0.01 to leave the bar out.
                      { type: "number", exclusiveMinimum: 0, maximum: 500 },
                      { type: "string", description: "CSS length expression (e.g. 'clamp(20px, 4vh, 60px)')" }
                    ],
                    description: "Horizontal bar thickness (pixels or CSS length, defaults to bar_width). A value near 0 (e.g. 0.01) leaves the horizontal bar out.",
                    examples: [20, 90, 150, "clamp(20px, 4vh, 60px)"]
                  },
                  outer_curve: {
                    oneOf: [
                      { type: "number", minimum: 0, maximum: 500 },
                      { type: "string", description: "Keyword: 'auto'/'arm_width', 'arm_height', 'arm_max' (recommended), 'arm_min', 'arm_fill', or CSS expression" }
                    ],
                    description: "Outer corner radius. Keywords: 'auto'/'arm_width'=bar_width/2, 'arm_height'=bar_height/2, 'arm_max'=max(w,h)/2 (recommended), 'arm_min'=min(w,h)/2, 'arm_fill'=max(w,h). Or explicit pixels.",
                    examples: [45, 60, 75, "auto", "arm_max", "arm_fill", "clamp(30px, 4vw, 60px)"]
                  },
                  inner_curve: {
                    oneOf: [
                      { type: "number", minimum: 0, maximum: 500 },
                      { type: "string", description: "CSS length expression (e.g. 'clamp(15px, 2vw, 30px)')" }
                    ],
                    description: "Inner corner radius (pixels or CSS length, defaults to outer_curve / 2)",
                    examples: [22.5, 30, 37.5, "clamp(15px, 2vw, 30px)"]
                  },
                  color: stateColorSchema,
                  tap_action: actionSchema,
                  hold_action: actionSchema,
                  double_tap_action: actionSchema
                }
              },
              inner_segment: {
                type: "object",
                required: ["bar_width"],
                description: "Inner segment (content area) configuration",
                examples: [
                  {
                    bar_width: 60,
                    bar_height: 60,
                    outer_curve: 18,
                    inner_curve: 9,
                    color: "#FFCC99",
                    entity_id: "light.inner"
                  }
                ],
                properties: {
                  entity_id: {
                    type: "string",
                    format: "entity",
                    pattern: "^[a-z_]+\\.[a-z0-9_]+$",
                    description: "Entity ID for state-based colour (format: domain.object_id)",
                    examples: ["light.inner_zone", "switch.inner_power"]
                  },
                  bar_width: {
                    oneOf: [
                      { type: "number", minimum: 1, maximum: 500 },
                      { type: "string", description: "CSS length expression (e.g. 'clamp(40px, 6vw, 80px)')" }
                    ],
                    description: "Vertical bar thickness (pixels or CSS length) - REQUIRED",
                    examples: [60, 80, 100, "clamp(40px, 6vw, 80px)"]
                  },
                  bar_height: {
                    oneOf: [
                      // Any positive thickness: the shell strategy uses 0.01 to leave the bar out.
                      { type: "number", exclusiveMinimum: 0, maximum: 500 },
                      { type: "string", description: "CSS length expression (e.g. 'clamp(20px, 4vh, 60px)')" }
                    ],
                    description: "Horizontal bar thickness (pixels or CSS length, defaults to bar_width). A value near 0 (e.g. 0.01) leaves the horizontal bar out.",
                    examples: [20, 60, 100, "clamp(20px, 4vh, 60px)"]
                  },
                  outer_curve: {
                    oneOf: [
                      { type: "number", minimum: 0, maximum: 500 },
                      { type: "string", description: "Keyword: 'auto'/'arm_width', 'arm_height', 'arm_max' (recommended), 'arm_min', 'arm_fill', or CSS expression" }
                    ],
                    description: "Outer corner radius. Omit for auto concentric (outer_segment.inner_curve - gap). Keywords: 'auto'/'arm_width'=bar_width/2, 'arm_height'=bar_height/2, 'arm_max'=max(w,h)/2 (recommended), 'arm_min'=min(w,h)/2, 'arm_fill'=max(w,h).",
                    examples: [18, 30, 40, "arm_max", "arm_fill"],
                    $comment: "Auto-calculation (when omitted): outer_segment.inner_curve - gap. Keyword modes use bar dimensions of inner_segment."
                  },
                  inner_curve: {
                    oneOf: [
                      { type: "number", minimum: 0, maximum: 500 },
                      { type: "string", description: "CSS length expression for inner corner radius" }
                    ],
                    description: "Inner corner radius (pixels or CSS length, defaults to outer_curve / 2)",
                    examples: [9, 15, 20]
                  },
                  color: stateColorSchema,
                  tap_action: actionSchema,
                  hold_action: actionSchema,
                  double_tap_action: actionSchema
                }
              }
            }
          },
          frame: frameSchema,
          colors: {
            type: "object",
            description: "Legacy colour override (use segment.color or segments.*.color instead)",
            deprecated: true,
            "x-replacement": "segment.color or segments.*.color",
            properties: {
              background: {
                type: "string",
                pattern: COLOR_VALUE_PATTERN,
                description: "Background colour override (deprecated - use segment.color instead)"
              }
            }
          }
        }
      },
      // ============================================================================
      // STYLE CONFIGURATION (inherited from button)
      // ============================================================================
      style: {
        type: "object",
        properties: {
          cursor: {
            type: "string",
            description: "CSS cursor style shown when hovering over the elbow. Overrides the automatic cursor derived from the interactive flag.",
            examples: ["pointer", "default", "none", "not-allowed", "crosshair", "grab", "zoom-in", "help", "wait", "progress", "move", "copy", "text"],
            "x-ui-hints": {
              label: "Cursor style",
              helper: "Any valid CSS cursor value. Leave unset to use the automatic default."
            }
          }
        }
      },
      // ============================================================================
      // TEXT CONFIGURATION (inherited from button)
      // ============================================================================
      text: getTextSchema({ positionEnum }),
      // ============================================================================
      // ACTIONS (inherited from button)
      // ============================================================================
      tap_action: actionSchema,
      hold_action: actionSchema,
      double_tap_action: actionSchema,
      // ============================================================================
      // DATA SOURCES (shared across all lcards)
      // ============================================================================
      data_sources: dataSourcesSchema,
      triggers_update: triggersUpdateSchema,
      // ============================================================================
      // ANIMATIONS & FILTERS
      // ============================================================================
      animations: {
        type: "array",
        description: "Visual animations triggered by user interactions or entity state changes",
        items: animationSchema
      },
      // ============================================================================
      // BACKGROUND ANIMATION
      // ============================================================================
      background_animation: backgroundAnimationSchema,
      sounds: soundsSchema,
      // ============================================================================
      // SHAPE TEXTURE
      // ============================================================================
      shape_texture: {
        type: "object",
        description: "Canvas texture/animation rendered inside the elbow shape boundary",
        properties: {
          preset: {
            type: "string",
            description: "Texture preset name",
            enum: ["grid", "diagonal", "hexagonal", "dots", "fluid", "shimmer", "plasma", "flow", "level", "pulse", "scanlines", "image"]
          },
          opacity: {
            description: "Texture opacity (0-1). Supports state-based object.",
            oneOf: [
              { type: "number", minimum: 0, maximum: 1 },
              { type: "object", description: "State-based values: keys are states (default, active, inactive, unavailable, ...), values are numbers" }
            ]
          },
          speed: {
            description: "Animation speed multiplier. Supports state-based object.",
            oneOf: [
              { type: "number", minimum: 0 },
              { type: "object" }
            ]
          },
          mix_blend_mode: {
            type: "string",
            description: "CSS mix-blend-mode for texture blending",
            enum: ["normal", "multiply", "screen", "overlay", "hard-light", "soft-light", "color-burn", "color-dodge"]
          },
          config: {
            type: "object",
            description: "Preset-specific configuration. Supports entity-reactive values: map_range descriptor or template strings.",
            additionalProperties: true
          }
        },
        additionalProperties: false
      },
      filters: {
        type: "array",
        description: "Visual filters applied to entire elbow (CSS and SVG filter primitives)",
        items: filterSchema
      },
      // ============================================================================
      // LAYOUT (HA Grid System)
      // ============================================================================
      grid_options: gridOptionsSchema,
      // ============================================================================
      // SYMBIONT (embedded card with optional style imprinting)
      // ============================================================================
      symbiont: {
        type: "object",
        description: "Embed another HA card inside the elbow content area with optional style imprinting",
        properties: {
          enabled: {
            type: "boolean",
            default: false,
            description: "Enable symbiont card embedding"
          },
          overflow: {
            type: "string",
            enum: ["visible", "hidden", "clip", "scroll", "auto"],
            description: "CSS overflow for both axes of the symbiont container. Overridden per-axis by overflow_x / overflow_y. Default: hidden."
          },
          overflow_x: {
            type: "string",
            enum: ["visible", "hidden", "clip", "scroll", "auto"],
            description: "CSS overflow-x for the symbiont container (horizontal axis). Overrides overflow shorthand."
          },
          overflow_y: {
            type: "string",
            enum: ["visible", "hidden", "clip", "scroll", "auto"],
            description: "CSS overflow-y for the symbiont container (vertical axis). Overrides overflow shorthand."
          },
          position: {
            type: "object",
            description: "Padding within the elbow content area (px)",
            properties: {
              top: { type: "number", default: 10 },
              left: { type: "number", default: 10 },
              right: { type: "number", default: 10 },
              bottom: { type: "number", default: 0 }
            }
          },
          size: {
            type: "object",
            description: "Constrain the embedded card to an explicit size within the content area (placed by `anchor`). Omit for the full content area.",
            properties: {
              width: { type: ["number", "string"], description: "Width: a number is px; a string is any CSS length (e.g. 50%, 12rem)." },
              height: { type: ["number", "string"], description: "Height: a number is px; a string is any CSS length." }
            }
          },
          anchor: {
            type: "string",
            enum: ["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"],
            default: "top-left",
            description: "Where a sized embedded card (`size`) sits within the content area."
          },
          imprint: {
            type: "object",
            description: "Style imprinting: injects resolved styles into the embedded card shadow root",
            properties: {
              enabled: { type: "boolean", default: true },
              background: {
                ...stateColorSchema,
                description: "Background colour to inject into embedded card. Null = do not imprint."
              },
              text: {
                type: "object",
                properties: {
                  color: {
                    ...stateColorSchema,
                    description: "Text colour to inject into embedded card. Null = do not imprint."
                  },
                  font_size: {
                    type: "string",
                    description: 'Font size to inject (e.g. "14px"). Null = do not imprint.'
                  },
                  font_family: {
                    type: "string",
                    description: "Font family string to inject. Null = do not imprint."
                  }
                }
              },
              border_radius: {
                type: "object",
                properties: {
                  match_host: {
                    type: "boolean",
                    default: true,
                    description: "Derive border radius from elbow inner arc geometry"
                  },
                  top_left: {
                    oneOf: [
                      { type: "number", description: "Top-left border radius (px)" },
                      { type: "string", enum: ["match"], description: "Use 'match' to mirror the elbow's inner arc radius" }
                    ],
                    description: "Top-left border radius: number (px) or 'match' to mirror elbow inner arc"
                  },
                  top_right: {
                    oneOf: [
                      { type: "number", description: "Top-right border radius (px)" },
                      { type: "string", enum: ["match"], description: "Use 'match' to mirror the elbow's inner arc radius" }
                    ],
                    description: "Top-right border radius: number (px) or 'match' to mirror elbow inner arc"
                  },
                  bottom_left: {
                    oneOf: [
                      { type: "number", description: "Bottom-left border radius (px)" },
                      { type: "string", enum: ["match"], description: "Use 'match' to mirror the elbow's inner arc radius" }
                    ],
                    description: "Bottom-left border radius: number (px) or 'match' to mirror elbow inner arc"
                  },
                  bottom_right: {
                    oneOf: [
                      { type: "number", description: "Bottom-right border radius (px)" },
                      { type: "string", enum: ["match"], description: "Use 'match' to mirror the elbow's inner arc radius" }
                    ],
                    description: "Bottom-right border radius: number (px) or 'match' to mirror elbow inner arc"
                  }
                }
              }
            }
          },
          custom_style: {
            type: "string",
            description: "Raw CSS injected into child card shadowRoot after imprint styles. Does not require card-mod."
          },
          card: {
            type: "object",
            description: "Any valid HA card configuration (type + properties). card_mod blocks are passed through as-is."
          }
        }
      }
    }
  };
}
function getChartSchema(options = {}) {
  const {
    availableAnimationPresets = [
      "lcars_standard",
      "lcars_dramatic",
      "lcars_minimal",
      "lcars_realtime",
      "lcars_alert",
      "none"
    ]
  } = options;
  const colorArraySchema = {
    type: "array",
    items: simpleColorSchema,
    description: "Array of colour values for multiple series",
    examples: [["#FF9900", "#99CCFF", "#FFCC00"]]
  };
  const VALID_CHART_TYPES = [
    "line",
    "area",
    "bar",
    "column",
    "scatter",
    "pie",
    "donut",
    "heatmap",
    "radialBar",
    "radar",
    "polarArea",
    "treemap",
    "rangeBar",
    "rangeArea",
    "candlestick",
    "boxPlot"
  ];
  const SPAN_UNITS = ["minute", "hour", "day", "week", "month", "year"];
  const DURATION_PATTERN = "^\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$";
  const seriesDisplayProperties = {
    name: { type: "string", description: "Legend name (default: entity friendly name or source id)" },
    unit: { type: "string", description: "Unit shown in tooltips and axis labels (default: entity unit_of_measurement)" },
    float_precision: { type: "number", minimum: 0, maximum: 6, description: "Decimal places in tooltips" },
    type: {
      type: "string",
      enum: ["line", "area", "bar", "column", "scatter"],
      description: "Per-series chart type for mixed charts"
    },
    curve: {
      type: "string",
      enum: ["smooth", "straight", "stepline", "monotoneCubic"],
      description: "Line interpolation for this series"
    },
    stroke_width: { type: "number", minimum: 0, maximum: 20, description: "Line width for this series" },
    stroke_dash: { type: "number", minimum: 0, maximum: 20, description: "Dash length for this series (0 = solid)" },
    color: { ...simpleColorSchema, description: "Series colour (overrides style.colors.series)" },
    opacity: { type: "number", minimum: 0, maximum: 1, description: "Fill opacity for area/bar series" },
    yaxis_id: { type: "string", description: "Id of the yaxis[] entry this series uses" },
    group_by: {
      type: "object",
      description: "Bucket points into fixed time intervals. minmax, box and ohlc produce the data rangeArea, boxPlot and candlestick charts need.",
      properties: {
        // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
        ...cardLevelProperties,
        func: {
          type: "string",
          enum: ["avg", "min", "max", "first", "last", "sum", "median", "delta", "diff", "minmax", "box", "ohlc"],
          default: "avg",
          description: "How each bucket is reduced"
        },
        duration: {
          type: "string",
          pattern: DURATION_PATTERN,
          description: "Bucket length, e.g. 10min, 1h, 1d",
          examples: ["10min", "1h"]
        },
        fill: {
          type: "string",
          enum: ["null", "last", "zero"],
          default: "last",
          description: "Value for empty buckets: leave a gap, repeat the last value, or zero"
        }
      },
      required: ["duration"],
      additionalProperties: false
    }
  };
  const seriesSchema = {
    anyOf: [
      {
        type: "object",
        title: "Entity series",
        properties: {
          entity: {
            type: "string",
            format: "entity",
            pattern: "^[a-z_]+\\.[a-z0-9_]+$",
            description: "Entity to plot (history is fetched from Home Assistant)"
          },
          attribute: { type: "string", description: "Plot this attribute instead of the state" },
          statistics: {
            type: "object",
            description: "Use long-term statistics instead of state history (sensors with a state_class)",
            properties: {
              type: {
                type: "string",
                enum: ["mean", "min", "max", "sum", "state", "change"],
                default: "mean",
                description: "Which statistic to plot"
              },
              period: {
                type: "string",
                enum: ["5minute", "hour", "day", "week", "month"],
                default: "hour",
                description: "Statistics period"
              }
            },
            additionalProperties: false
          },
          ...seriesDisplayProperties
        },
        required: ["entity"],
        additionalProperties: false
      },
      {
        type: "object",
        title: "DataSource series",
        properties: {
          datasource: { type: "string", description: "Name of a DataSource (in data_sources or defined by another card)" },
          buffer: { type: "string", description: "Processor key to plot instead of the raw values" },
          ...seriesDisplayProperties
        },
        required: ["datasource"],
        additionalProperties: false
      },
      {
        type: "string",
        deprecated: true,
        "x-replacement": "{ entity: ... } or { datasource: ... }",
        description: "Legacy: entity id or DataSource name"
      },
      {
        type: "object",
        title: "Legacy DataSource reference",
        deprecated: true,
        "x-replacement": "{ datasource, buffer, name, type }",
        properties: {
          datasource: { type: "string" },
          id: { type: "string" },
          name: { type: "string" },
          buffer: { type: "string" },
          key: { type: "string" },
          type: { type: "string" },
          yaxis: { type: "number" }
        },
        additionalProperties: false
      }
    ]
  };
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/snootched/lcards/schemas/chart-schema",
    title: "LCARdS Chart Card Configuration",
    description: "Complete configuration schema for lcards-chart custom card (v1.18.0+ nested structure)",
    type: "object",
    properties: {
      // ====================================================================
      // HOME ASSISTANT REQUIRED PROPERTIES
      // ====================================================================
      type: {
        type: "string",
        const: "custom:lcards-chart",
        description: "Home Assistant card type identifier (required)",
        "x-ui-hints": {
          hidden: true
        }
      },
      // ====================================================================
      // CORE PROPERTIES
      // ====================================================================
      id: {
        ...cardIdSchema,
        description: "Custom card ID for rule targeting (optional - auto-generated if omitted)",
        "x-ui-hints": {
          label: "Card ID",
          helper: "Unique identifier for targeting with rules (auto-generated if not specified)",
          selector: {
            text: {
              placeholder: "chart-main"
            }
          }
        }
      },
      tags: {
        ...tagsSchema,
        "x-ui-hints": {
          label: "Tags",
          helper: "Tags for grouping and targeting multiple cards with rules",
          selector: {
            select: {
              multiple: true,
              custom_value: true
            }
          },
          examples: ["dashboard-main", "temperature-monitors", "energy"]
        }
      },
      // ====================================================================
      // SERIES AND TIME WINDOW
      // ====================================================================
      sources: {
        type: "array",
        description: "Chart series. Each item plots an entity (history or long-term statistics) or a named DataSource buffer.",
        items: seriesSchema,
        "x-ui-hints": {
          label: "Series",
          helper: "Edit series in Chart Studio",
          examples: [
            [{ entity: "sensor.indoor_temp", name: "Indoor" }, { entity: "sensor.outdoor_temp", name: "Outdoor" }],
            [{ entity: "sensor.power", statistics: { type: "max", period: "day" } }],
            [{ datasource: "temp", buffer: "smoothed", name: "Smoothed" }]
          ]
        }
      },
      graph_span: {
        type: "string",
        pattern: "^\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$",
        default: "24h",
        description: "How much time the chart shows, e.g. 6h, 2d, 1w, 1mo (default 24h)",
        examples: ["24h", "7d", "1mo"],
        "x-ui-hints": {
          label: "Time span",
          selector: { text: { placeholder: "24h" } }
        }
      },
      span: {
        type: "object",
        description: "Align the time window to calendar boundaries and/or shift it",
        properties: {
          start: {
            type: "string",
            enum: SPAN_UNITS,
            description: "Start the window at the beginning of the current minute/hour/day/week/month/year (it then lasts graph_span)"
          },
          end: {
            type: "string",
            enum: SPAN_UNITS,
            description: "End the window at the end of the current minute/hour/day/week/month/year (it then starts graph_span earlier)"
          },
          offset: {
            type: "string",
            pattern: "^[+-]\\d+(\\.\\d+)?\\s*(s|sec|m|min|h|hour|d|day|w|week|mo|month|y|year)s?$",
            description: "Shift the window, e.g. -1d for the same window yesterday",
            examples: ["-1d", "+2h"]
          }
        },
        additionalProperties: false
      },
      yaxis: {
        type: "array",
        description: "Y axes for multi-axis charts. Series pick one with yaxis_id; series without one use the first axis.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Axis id referenced by series yaxis_id" },
            show: { type: "boolean", default: true, description: "Show this axis" },
            opposite: { type: "boolean", default: false, description: "Draw the axis on the right" },
            min: { type: "number", description: "Fixed minimum (omit for automatic)" },
            max: { type: "number", description: "Fixed maximum (omit for automatic)" },
            decimals: { type: "number", minimum: 0, maximum: 6, description: "Decimal places for axis labels" }
          },
          required: ["id"],
          additionalProperties: false
        },
        examples: [[{ id: "temp" }, { id: "humidity", opposite: true, min: 0, max: 100 }]]
      },
      data_sources: dataSourcesSchema,
      // Legacy series keys: still accepted (the card and editor migrate
      // them to sources[]) but never written by the editor.
      source: {
        type: "string",
        deprecated: true,
        "x-replacement": "sources: [{ entity: ... }]",
        description: "Legacy single entity or DataSource reference"
      },
      data_source: {
        anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
        deprecated: true,
        "x-replacement": "sources",
        description: "Legacy alias of source/sources"
      },
      attribute: {
        type: "string",
        deprecated: true,
        "x-replacement": "sources[].attribute",
        description: "Legacy attribute for source"
      },
      series_names: {
        type: "array",
        items: { type: "string" },
        deprecated: true,
        "x-replacement": "sources[].name",
        description: "Legacy legend names in sources order"
      },
      history_hours: {
        type: "number",
        deprecated: true,
        "x-replacement": "graph_span",
        description: "Legacy history window in hours"
      },
      // ====================================================================
      // CHART CONFIGURATION
      // ====================================================================
      chart_type: {
        type: "string",
        enum: VALID_CHART_TYPES,
        default: "line",
        description: "ApexCharts chart type",
        "x-ui-hints": {
          label: "Chart Type",
          helper: "Select the type of chart to display",
          selector: {
            select: {
              options: VALID_CHART_TYPES.map((type2) => ({
                value: type2,
                label: type2.charAt(0).toUpperCase() + type2.slice(1).replace(/([A-Z])/g, " $1")
              }))
            }
          },
          enumDescriptions: [
            "Line chart - Best for trends over time",
            "Area chart - Best for showing volume/magnitude",
            "Bar chart - Horizontal bars for comparisons",
            "Column chart - Vertical bars for comparisons",
            "Scatter plot - Best for correlations",
            "Pie chart - Full circle for proportions",
            "Donut chart - Ring shape for proportions",
            "Heatmap - Heat map grid",
            "Radial bar - Circular progress/gauge",
            "Radar chart - Spider/radar chart",
            "Polar area - Directional data visualization",
            "Treemap - Hierarchical data",
            "Range bar - Timeline/schedule visualization",
            "Range area - Data ranges/confidence intervals",
            "Candlestick - Financial OHLC data",
            "Box plot - Statistical distributions"
          ]
        }
      },
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      show_legend: {
        type: "boolean",
        deprecated: true,
        "x-replacement": "style.legend.show",
        description: "Legacy legend toggle"
      },
      xaxis_type: {
        type: "string",
        enum: ["datetime", "category", "numeric"],
        default: "datetime",
        description: "X-axis type",
        "x-ui-hints": {
          label: "X-Axis Type",
          helper: "Type of data on the x-axis",
          selector: {
            select: {
              options: [
                { value: "datetime", label: "Date/Time" },
                { value: "category", label: "Category" },
                { value: "numeric", label: "Numeric" }
              ]
            }
          }
        }
      },
      max_points: {
        type: "number",
        deprecated: true,
        "x-replacement": "sources[].group_by",
        description: "Legacy point limit (never had an effect)"
      },
      // ====================================================================
      // NESTED STYLE CONFIGURATION
      // ====================================================================
      style: {
        type: "object",
        description: "Nested style configuration for chart appearance",
        properties: {
          // ================================================================
          // GROUP 1: COLORS - All color properties
          // ================================================================
          colors: {
            type: "object",
            description: "Complete colour configuration for all chart elements",
            "x-ui-hints": {
              label: "Colours",
              helper: "Configure colours for all chart elements",
              collapsible: true,
              defaultCollapsed: false
            },
            properties: {
              series: colorArraySchema,
              stroke: colorArraySchema,
              fill: colorArraySchema,
              background: simpleColorSchema,
              foreground: simpleColorSchema,
              grid: simpleColorSchema,
              marker: {
                type: "object",
                description: "Marker colours",
                "x-ui-hints": {
                  label: "Marker Colours",
                  helper: "Configure fill and stroke colours for data point markers",
                  collapsible: true,
                  defaultCollapsed: true
                },
                properties: {
                  fill: colorArraySchema,
                  stroke: colorArraySchema
                }
              },
              axis: {
                type: "object",
                description: "Axis colours",
                "x-ui-hints": {
                  label: "Axis Colours",
                  helper: "Configure colours for x-axis, y-axis, borders, and tick marks",
                  collapsible: true,
                  defaultCollapsed: true
                },
                properties: {
                  x: simpleColorSchema,
                  y: simpleColorSchema,
                  border: simpleColorSchema,
                  ticks: simpleColorSchema
                }
              },
              legend: {
                type: "object",
                description: "Legend colours",
                "x-ui-hints": {
                  label: "Legend Colours",
                  helper: "Configure default legend text colour and per-series item colours",
                  collapsible: true,
                  defaultCollapsed: true
                },
                properties: {
                  default: simpleColorSchema,
                  items: colorArraySchema
                }
              },
              data_labels: colorArraySchema
            }
          },
          // ================================================================
          // GROUP 2: STROKE - Line styling
          // ================================================================
          stroke: {
            type: "object",
            description: "Line stroke configuration",
            "x-ui-hints": {
              label: "Stroke",
              helper: "Configure line width, curve, and dash pattern",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              width: {
                type: "number",
                minimum: 0,
                maximum: 10,
                default: 2,
                description: "Stroke width in pixels",
                "x-ui-hints": {
                  label: "Width",
                  selector: {
                    number: {
                      mode: "slider",
                      min: 0,
                      max: 10,
                      step: 0.5
                    }
                  }
                }
              },
              curve: {
                type: "string",
                enum: ["smooth", "straight", "stepline", "monotoneCubic"],
                default: "smooth",
                description: "Line curve type",
                "x-ui-hints": {
                  label: "Curve",
                  selector: {
                    select: {
                      options: [
                        { value: "smooth", label: "Smooth" },
                        { value: "straight", label: "Straight" },
                        { value: "stepline", label: "Stepline" },
                        { value: "monotoneCubic", label: "Monotone Cubic" }
                      ]
                    }
                  }
                }
              },
              dash_array: {
                type: "number",
                minimum: 0,
                maximum: 20,
                default: 0,
                description: "Dashed line pattern (0 = solid)",
                "x-ui-hints": {
                  label: "Dash Pattern",
                  selector: {
                    number: {
                      mode: "slider",
                      min: 0,
                      max: 20,
                      step: 1
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 3: FILL - Fill styling
          // ================================================================
          fill: {
            type: "object",
            description: "Fill configuration for area and bar charts",
            "x-ui-hints": {
              label: "Fill",
              helper: "Configure fill type, opacity, and gradients",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              type: {
                type: "string",
                enum: ["solid", "gradient", "pattern", "image"],
                default: "solid",
                description: "Fill type",
                "x-ui-hints": {
                  label: "Type",
                  selector: {
                    select: {
                      options: [
                        { value: "solid", label: "Solid" },
                        { value: "gradient", label: "Gradient" },
                        { value: "pattern", label: "Pattern" },
                        { value: "image", label: "Image" }
                      ]
                    }
                  }
                }
              },
              opacity: {
                type: "number",
                minimum: 0,
                maximum: 1,
                default: 0.7,
                description: "Fill opacity (0-1)",
                "x-ui-hints": {
                  label: "Opacity",
                  selector: {
                    number: {
                      mode: "slider",
                      min: 0,
                      max: 1,
                      step: 0.1
                    }
                  }
                }
              },
              gradient: {
                type: "object",
                description: "Gradient fill configuration",
                "x-ui-hints": {
                  label: "Gradient",
                  helper: "Configure gradient fill direction, intensity, and opacity",
                  collapsible: true,
                  defaultCollapsed: true
                },
                properties: {
                  shade: {
                    type: "string",
                    enum: ["light", "dark"],
                    description: "Gradient shade direction",
                    "x-ui-hints": {
                      label: "Shade",
                      helper: "Light or dark gradient shading",
                      selector: {
                        select: {
                          options: [
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" }
                          ]
                        }
                      }
                    }
                  },
                  type: {
                    type: "string",
                    enum: ["horizontal", "vertical", "diagonal1", "diagonal2"],
                    description: "Gradient direction",
                    "x-ui-hints": {
                      label: "Type",
                      helper: "Direction of gradient flow",
                      selector: {
                        select: {
                          options: [
                            { value: "horizontal", label: "Horizontal" },
                            { value: "vertical", label: "Vertical" },
                            { value: "diagonal1", label: "Diagonal 1" },
                            { value: "diagonal2", label: "Diagonal 2" }
                          ]
                        }
                      }
                    }
                  },
                  shadeIntensity: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "Intensity of shading",
                    "x-ui-hints": {
                      label: "Shade Intensity",
                      helper: "How strong the gradient shading effect is (0-1)",
                      selector: {
                        number: {
                          mode: "slider",
                          min: 0,
                          max: 1,
                          step: 0.1
                        }
                      }
                    }
                  },
                  opacityFrom: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "Starting opacity",
                    "x-ui-hints": {
                      label: "Opacity From",
                      helper: "Starting opacity value for gradient (0-1)",
                      selector: {
                        number: {
                          mode: "slider",
                          min: 0,
                          max: 1,
                          step: 0.1
                        }
                      }
                    }
                  },
                  opacityTo: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    description: "Ending opacity",
                    "x-ui-hints": {
                      label: "Opacity To",
                      helper: "Ending opacity value for gradient (0-1)",
                      selector: {
                        number: {
                          mode: "slider",
                          min: 0,
                          max: 1,
                          step: 0.1
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 4: MARKERS - Data point markers
          // ================================================================
          markers: {
            type: "object",
            description: "Data point marker configuration",
            "x-ui-hints": {
              label: "Markers",
              helper: "Configure data point markers",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              size: {
                type: "number",
                minimum: 0,
                maximum: 20,
                default: 4,
                description: "Marker size in pixels",
                "x-ui-hints": {
                  label: "Size",
                  selector: {
                    number: {
                      mode: "slider",
                      min: 0,
                      max: 20,
                      step: 1
                    }
                  }
                }
              },
              shape: {
                type: "string",
                enum: ["circle", "square", "rect", "diamond", "triangle", "star", "cross", "plus", "line", "rhombus"],
                default: "circle",
                description: "Marker shape",
                "x-ui-hints": {
                  label: "Shape",
                  selector: {
                    select: {
                      options: [
                        { value: "circle", label: "Circle" },
                        { value: "square", label: "Square" },
                        { value: "rect", label: "Rectangle" },
                        { value: "diamond", label: "Diamond" },
                        { value: "triangle", label: "Triangle" },
                        { value: "star", label: "Star" },
                        { value: "cross", label: "Cross" },
                        { value: "plus", label: "Plus" }
                      ]
                    }
                  }
                }
              },
              stroke: {
                type: "object",
                description: "Marker stroke configuration",
                properties: {
                  width: {
                    type: "number",
                    minimum: 0,
                    maximum: 10,
                    default: 2,
                    description: "Marker stroke width",
                    "x-ui-hints": {
                      label: "Stroke Width",
                      selector: {
                        number: {
                          min: 0,
                          max: 10,
                          step: 0.5
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 5: GRID - Grid configuration
          // ================================================================
          grid: {
            type: "object",
            description: "Grid line configuration",
            "x-ui-hints": {
              label: "Grid",
              helper: "Configure grid lines and colours",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              show: {
                type: "boolean",
                default: true,
                description: "Show/hide grid lines",
                "x-ui-hints": {
                  label: "Show Grid",
                  selector: {
                    boolean: {}
                  }
                }
              },
              opacity: {
                type: "number",
                deprecated: true,
                "x-replacement": "an rgba/alpha() colour in style.colors.grid",
                description: "Not an ApexCharts option; it never had an effect"
              },
              stroke_dash_array: {
                type: "number",
                minimum: 0,
                maximum: 20,
                default: 4,
                description: "Grid line dash pattern",
                "x-ui-hints": {
                  label: "Dash Pattern",
                  selector: {
                    number: {
                      mode: "slider",
                      min: 0,
                      max: 20,
                      step: 1
                    }
                  }
                }
              },
              row_colors: colorArraySchema,
              column_colors: colorArraySchema
            }
          },
          // ================================================================
          // GROUP 6: LEGEND - Legend configuration
          // ================================================================
          legend: {
            type: "object",
            description: "Legend configuration",
            "x-ui-hints": {
              label: "Legend",
              helper: "Configure chart legend",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              show: {
                type: "boolean",
                default: false,
                description: "Show/hide legend",
                "x-ui-hints": {
                  label: "Show Legend",
                  selector: {
                    boolean: {}
                  }
                }
              },
              position: {
                type: "string",
                enum: ["top", "right", "bottom", "left"],
                default: "bottom",
                description: "Legend position",
                "x-ui-hints": {
                  label: "Position",
                  selector: {
                    select: {
                      options: [
                        { value: "top", label: "Top" },
                        { value: "right", label: "Right" },
                        { value: "bottom", label: "Bottom" },
                        { value: "left", label: "Left" }
                      ]
                    }
                  }
                }
              },
              horizontalAlign: {
                type: "string",
                enum: ["left", "center", "right"],
                default: "center",
                description: "Legend horizontal alignment",
                "x-ui-hints": {
                  label: "Horizontal Alignment",
                  selector: {
                    select: {
                      options: [
                        { value: "left", label: "Left" },
                        { value: "center", label: "Center" },
                        { value: "right", label: "Right" }
                      ]
                    }
                  }
                }
              },
              font_size: {
                type: "number",
                minimum: 8,
                maximum: 24,
                default: 14,
                description: "Legend font size",
                "x-ui-hints": {
                  label: "Font Size",
                  selector: {
                    number: {
                      min: 8,
                      max: 24,
                      step: 1
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 7: DATA LABELS - Data label configuration
          // ================================================================
          data_labels: {
            type: "object",
            description: "Data label configuration",
            "x-ui-hints": {
              label: "Data Labels",
              helper: "Configure data point labels",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              show: {
                type: "boolean",
                default: false,
                description: "Show/hide data labels",
                "x-ui-hints": {
                  label: "Show Data Labels",
                  selector: {
                    boolean: {}
                  }
                }
              },
              offsetY: {
                type: "number",
                minimum: -50,
                maximum: 50,
                default: 0,
                description: "Vertical offset for data labels",
                "x-ui-hints": {
                  label: "Vertical Offset",
                  selector: {
                    number: {
                      mode: "slider",
                      min: -50,
                      max: 50,
                      step: 1
                    }
                  }
                }
              },
              font_size: {
                type: "number",
                minimum: 8,
                maximum: 24,
                default: 12,
                description: "Data label font size",
                "x-ui-hints": {
                  label: "Font Size",
                  selector: {
                    number: {
                      min: 8,
                      max: 24,
                      step: 1
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 7A: XAXIS - X-axis configuration
          // ================================================================
          xaxis: {
            type: "object",
            description: "X-axis configuration",
            "x-ui-hints": {
              label: "X-Axis",
              helper: "Configure horizontal axis",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              labels: {
                type: "object",
                description: "X-axis label configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: true,
                    description: "Show/hide x-axis labels",
                    "x-ui-hints": {
                      label: "Show Labels",
                      selector: {
                        boolean: {}
                      }
                    }
                  },
                  rotate: {
                    type: "number",
                    minimum: -90,
                    maximum: 90,
                    default: 0,
                    description: "Label rotation in degrees",
                    "x-ui-hints": {
                      label: "Rotation",
                      selector: {
                        number: {
                          mode: "slider",
                          min: -90,
                          max: 90,
                          step: 15,
                          unit_of_measurement: "°"
                        }
                      }
                    }
                  }
                }
              },
              border: {
                type: "object",
                description: "X-axis border configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: false,
                    description: "Show/hide x-axis border",
                    "x-ui-hints": {
                      label: "Show Border",
                      selector: {
                        boolean: {}
                      }
                    }
                  }
                }
              },
              ticks: {
                type: "object",
                description: "X-axis tick marks configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: false,
                    description: "Show/hide x-axis tick marks",
                    "x-ui-hints": {
                      label: "Show Ticks",
                      selector: {
                        boolean: {}
                      }
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 7B: YAXIS - Y-axis configuration
          // ================================================================
          yaxis: {
            type: "object",
            description: "Y-axis configuration",
            "x-ui-hints": {
              label: "Y-Axis",
              helper: "Configure vertical axis",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              labels: {
                type: "object",
                description: "Y-axis label configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: true,
                    description: "Show/hide y-axis labels",
                    "x-ui-hints": {
                      label: "Show Labels",
                      selector: {
                        boolean: {}
                      }
                    }
                  }
                }
              },
              border: {
                type: "object",
                description: "Y-axis border configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: false,
                    description: "Show/hide y-axis border",
                    "x-ui-hints": {
                      label: "Show Border",
                      selector: {
                        boolean: {}
                      }
                    }
                  }
                }
              },
              ticks: {
                type: "object",
                description: "Y-axis tick marks configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: false,
                    description: "Show/hide y-axis tick marks",
                    "x-ui-hints": {
                      label: "Show Ticks",
                      selector: {
                        boolean: {}
                      }
                    }
                  }
                }
              },
              decimals: {
                type: "number",
                minimum: 0,
                maximum: 10,
                description: "Round displayed values to N decimal places (axis labels, tooltips, and data labels)",
                "x-ui-hints": {
                  label: "Decimal Places",
                  helper: "Round values to N decimal places. Leave unset for full precision.",
                  selector: {
                    number: {
                      min: 0,
                      max: 10,
                      step: 1
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 8: TYPOGRAPHY - Font configuration
          // ================================================================
          typography: {
            type: "object",
            description: "Typography configuration",
            "x-ui-hints": {
              label: "Typography",
              helper: "Configure fonts for chart text",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              font_family: {
                type: "string",
                default: "Antonio, Helvetica Neue, sans-serif",
                description: "Font family",
                "x-ui-hints": {
                  label: "Font Family",
                  selector: {
                    text: {}
                  }
                }
              },
              font_size: {
                type: "number",
                minimum: 8,
                maximum: 24,
                default: 12,
                description: "Base font size",
                "x-ui-hints": {
                  label: "Font Size",
                  selector: {
                    number: {
                      min: 8,
                      max: 24,
                      step: 1
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 9: DISPLAY - Display options
          // ================================================================
          display: {
            type: "object",
            description: "Display options",
            "x-ui-hints": {
              label: "Display",
              helper: "Configure toolbar and tooltip display",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              toolbar: {
                type: "boolean",
                default: false,
                description: "Show/hide toolbar",
                "x-ui-hints": {
                  label: "Show Toolbar",
                  selector: {
                    boolean: {}
                  }
                }
              },
              tooltip: {
                type: "object",
                description: "Tooltip configuration",
                properties: {
                  show: {
                    type: "boolean",
                    default: true,
                    description: "Show/hide tooltip",
                    "x-ui-hints": {
                      label: "Show Tooltip",
                      selector: {
                        boolean: {}
                      }
                    }
                  },
                  theme: {
                    type: "string",
                    enum: ["light", "dark"],
                    default: "dark",
                    description: "Tooltip theme",
                    "x-ui-hints": {
                      label: "Theme",
                      selector: {
                        select: {
                          options: [
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 10: ANIMATION - Animation configuration
          // ================================================================
          animation: {
            type: "object",
            description: "Animation configuration",
            "x-ui-hints": {
              label: "Animation",
              helper: "Configure chart animations",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              preset: {
                type: "string",
                enum: availableAnimationPresets,
                description: "Animation preset name",
                "x-ui-hints": {
                  label: "Preset",
                  selector: {
                    select: {
                      options: availableAnimationPresets.map((preset) => ({
                        value: preset,
                        label: preset.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                      }))
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 11: THEME - Theme configuration
          // ================================================================
          theme: {
            type: "object",
            description: "Theme configuration",
            "x-ui-hints": {
              label: "Theme",
              helper: "Configure chart theme settings",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              mode: {
                type: "string",
                enum: ["light", "dark"],
                default: "dark",
                description: "Theme mode",
                "x-ui-hints": {
                  label: "Mode",
                  selector: {
                    select: {
                      options: [
                        { value: "light", label: "Light" },
                        { value: "dark", label: "Dark" }
                      ]
                    }
                  }
                }
              },
              palette: {
                type: "string",
                description: "Theme palette name",
                "x-ui-hints": {
                  label: "Palette",
                  selector: {
                    text: {}
                  }
                }
              },
              monochrome: {
                type: "object",
                description: "Monochrome theme configuration",
                properties: {
                  enabled: {
                    type: "boolean",
                    default: false,
                    description: "Enable monochrome theme",
                    "x-ui-hints": {
                      label: "Enabled",
                      selector: {
                        boolean: {}
                      }
                    }
                  },
                  color: simpleColorSchema,
                  shade_to: {
                    type: "string",
                    enum: ["light", "dark"],
                    default: "dark",
                    description: "Shade direction",
                    "x-ui-hints": {
                      label: "Shade To",
                      selector: {
                        select: {
                          options: [
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" }
                          ]
                        }
                      }
                    }
                  },
                  shade_intensity: {
                    type: "number",
                    minimum: 0,
                    maximum: 1,
                    default: 0.65,
                    description: "Shade intensity",
                    "x-ui-hints": {
                      label: "Intensity",
                      selector: {
                        number: {
                          mode: "slider",
                          min: 0,
                          max: 1,
                          step: 0.05
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          // ================================================================
          // GROUP 12: FORMATTERS - Label and tooltip formatters
          // ================================================================
          formatters: {
            type: "object",
            description: "Label and tooltip formatters",
            "x-ui-hints": {
              label: "Formatters",
              helper: "Configure label and tooltip formatting",
              collapsible: true,
              defaultCollapsed: true
            },
            properties: {
              xaxis_label: {
                type: "string",
                description: "X-axis label format template",
                "x-ui-hints": {
                  label: "X-Axis Label",
                  helper: 'Template for x-axis labels (e.g., "HH:mm")',
                  selector: {
                    text: {
                      placeholder: "HH:mm"
                    }
                  },
                  examples: ["HH:mm", "MMM DD", "YYYY-MM-DD HH:mm"]
                }
              },
              yaxis_label: {
                type: "string",
                description: "Y-axis label format template",
                "x-ui-hints": {
                  label: "Y-Axis Label",
                  helper: 'Template for y-axis labels (e.g., "{value}°C")',
                  selector: {
                    text: {
                      placeholder: "{value}°C"
                    }
                  },
                  examples: ["{value}°C", "{value}%", "${value}"]
                }
              },
              tooltip: {
                type: "string",
                description: "Tooltip format template",
                "x-ui-hints": {
                  label: "Tooltip",
                  helper: 'Template for tooltip (e.g., "{x|MMM DD HH:mm}: {y}°C")',
                  selector: {
                    text: {
                      placeholder: "{x|MMM DD HH:mm}: {y}°C"
                    }
                  },
                  examples: [
                    "{x|MMM DD HH:mm}: {y}°C",
                    "{x}: {y}",
                    "{seriesName}: {y}"
                  ]
                }
              }
            }
          },
          // ================================================================
          // GROUP 12b: REFERENCE LINES and chart-type options
          // ================================================================
          zero_line: {
            type: "boolean",
            default: false,
            description: "Draw a horizontal reference line at 0"
          },
          zero_line_color: {
            ...simpleColorSchema,
            description: "Colour of the zero line"
          },
          thresholds: {
            type: "array",
            description: "Horizontal reference lines at fixed values",
            items: {
              type: "object",
              properties: {
                value: { type: "number", description: "Y value of the line" },
                label: { type: "string", description: "Text shown on the line" },
                color: { ...simpleColorSchema, description: "Line and label colour" },
                width: { type: "number", minimum: 0, description: "Line width (default 2)" },
                dash: { type: "boolean", description: "Dashed line" },
                opacity: { type: "number", minimum: 0, maximum: 1, description: "Line opacity (default 0.7)" }
              },
              required: ["value"],
              additionalProperties: false
            },
            examples: [[{ value: 25, label: "High", color: "var(--lcars-red)" }]]
          },
          value_format: {
            type: "string",
            enum: ["percent"],
            description: "radialBar: show values as percentages"
          },
          gauge_start_angle: {
            type: "number",
            minimum: -360,
            maximum: 360,
            description: "radialBar: arc start angle in degrees (default -90)"
          },
          gauge_total: {
            type: "boolean",
            default: false,
            description: "radialBar: show the sum of all gauges in the centre"
          },
          gauge_end_angle: {
            type: "number",
            minimum: -360,
            maximum: 360,
            description: "radialBar: arc end angle in degrees (default 90)"
          },
          group_rows: {
            type: "boolean",
            default: true,
            description: "rangeBar: put bars with the same label on one row"
          },
          show_labels: {
            type: "boolean",
            default: true,
            description: "rangeBar: show labels on the bars"
          },
          // ================================================================
          // GROUP 13: CHART_OPTIONS - Raw ApexCharts pass-through
          // ================================================================
          chart_options: {
            type: "object",
            description: "Raw ApexCharts options (highest precedence - overrides all other settings)",
            "x-ui-hints": {
              label: "Chart Options",
              helper: "Raw ApexCharts options object - overrides all other settings",
              collapsible: true,
              defaultCollapsed: true,
              examples: [{
                plotOptions: {
                  bar: {
                    borderRadius: 4,
                    horizontal: false
                  }
                }
              }]
            }
          }
        }
      }
    },
    required: ["type"]
  };
}
const lengthSchema = (description2, examples) => ({
  type: ["number", "string"],
  description: description2,
  ...examples ? { examples } : {}
});
const FORMAT_ENUM = ["digit", "float", "alpha", "hex", "mixed"];
const dataGridCellStyleSchema = {
  type: "object",
  description: "Cell style. Keys are CSS properties in snake_case (font_size, border_bottom_color, ...). Numbers become px.",
  properties: {
    // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
    ...cardLevelProperties,
    color: { ...stateColorSchema, description: "Text colour, or a state map (default, active, above:80, ...) resolved against the cell entity" },
    background: { ...stateColorSchema, description: "Background colour, or a state map resolved against the cell entity" },
    font_size: lengthSchema("Font size: number (px) or CSS length", [18, "1.2rem"]),
    font_family: { type: "string", description: "CSS font-family", examples: ["Antonio, sans-serif"] },
    font_weight: { type: ["number", "string"], description: "CSS font-weight", examples: [400, "bold"] },
    align: { type: "string", enum: ["left", "center", "right"], description: "Horizontal text alignment (default right)" },
    padding: {
      oneOf: [
        { type: ["number", "string"], description: "Number (px) or CSS padding" },
        {
          type: "object",
          description: "Per-side padding in px",
          properties: { top: { type: "number" }, right: { type: "number" }, bottom: { type: "number" }, left: { type: "number" } }
        }
      ]
    },
    text_transform: { type: "string", enum: ["none", "uppercase", "lowercase", "capitalize"] },
    letter_spacing: lengthSchema("CSS letter-spacing"),
    line_height: { type: ["number", "string"], description: "CSS line-height (numbers are unitless)" },
    white_space: { type: "string", enum: ["nowrap", "normal", "pre", "pre-wrap", "pre-line"], description: "nowrap (default) truncates with an ellipsis" },
    border_width: lengthSchema("Border width"),
    border_color: { type: "string", description: "Border colour" },
    border_style: { type: "string", enum: ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset", "none"] },
    border_radius: lengthSchema("Border radius")
  }
};
const cellSchema = {
  anyOf: [
    { type: "string", description: "Static text, an entity id (shows its state) or a template ({{ }}, {datasource:...}, [[[ ]]])" },
    { type: "number" },
    {
      type: "object",
      title: "Cell object",
      description: "A cell with its own style, entity context or actions",
      properties: {
        value: { type: ["string", "number"], description: "What the cell shows: text, entity id or template" },
        entity: { type: "string", format: "entity", description: "Entity to show (when value is empty) and to resolve state-map colours and actions against" },
        attribute: { type: "string", description: "Show this attribute of the entity instead of its state" },
        style: dataGridCellStyleSchema,
        tap_action: actionSchema,
        hold_action: actionSchema,
        double_tap_action: actionSchema
      }
    }
  ]
};
const dataGridSchema = {
  type: "object",
  required: ["type"],
  properties: {
    type: {
      type: "string",
      const: "custom:lcards-data-grid",
      "x-ui-hints": { hidden: true }
    },
    // ── Mode ────────────────────────────────────────────────────────────
    data_mode: {
      oneOf: [
        {
          type: "string",
          enum: ["decorative", "data"],
          description: "decorative: generated values; data: your rows. Defaults to data when rows are set, otherwise decorative."
        },
        {
          type: "string",
          enum: ["random", "template", "datasource"],
          deprecated: true,
          "x-replacement": "data_mode: decorative (random) or data (template, datasource)"
        }
      ]
    },
    // ── Decorative mode ─────────────────────────────────────────────────
    format: {
      type: "string",
      enum: FORMAT_ENUM,
      default: "mixed",
      description: "Generated value format: digit (0042), float (42.17), alpha (AB), hex (A3F1) or mixed"
    },
    refresh_interval: {
      type: "number",
      minimum: 0,
      default: 0,
      description: "Regenerate values every N ms (0 = never)"
    },
    refresh_cells: {
      type: "number",
      minimum: 0,
      maximum: 1,
      default: 1,
      description: "Fraction of cells that change on each refresh (1 = all)"
    },
    // ── Data mode ───────────────────────────────────────────────────────
    rows: {
      type: "array",
      description: "Data rows. Each row is a list of cells, or { values, style, header }.",
      items: {
        oneOf: [
          { type: "array", title: "Row", items: cellSchema },
          {
            type: "object",
            title: "Styled row",
            properties: {
              values: { type: "array", items: cellSchema },
              style: dataGridCellStyleSchema,
              header: { type: "boolean", description: "Header row: header defaults plus header_style" },
              cellStyles: {
                type: "array",
                deprecated: true,
                "x-replacement": "cell objects: { value, style }"
              },
              sources: { type: "array", deprecated: true, "x-replacement": "values" }
            },
            required: ["values"]
          }
        ]
      }
    },
    cell_tap_action: {
      ...actionSchema,
      description: "Tap action for every entity cell that has no tap_action of its own (e.g. { action: more-info })"
    },
    data_sources: dataSourcesSchema,
    triggers_update: triggersUpdateSchema,
    // ── Layout ──────────────────────────────────────────────────────────
    grid: {
      type: "object",
      description: "CSS Grid layout of the cells",
      properties: {
        "grid-template-columns": { type: "string", description: "Column tracks, e.g. 'repeat(12, 1fr)' or '100px 1fr 2fr'. Decorative mode takes the column count from here." },
        "grid-template-rows": { type: "string", description: "Row tracks, e.g. 'repeat(8, auto)'. Decorative mode takes the row count from here." },
        gap: lengthSchema("Gap between cells (default 8px)", ["8px", 0]),
        "row-gap": lengthSchema("Gap between rows"),
        "column-gap": lengthSchema("Gap between columns"),
        "grid-auto-flow": { type: "string", enum: ["row", "column", "dense", "row dense", "column dense"] },
        "justify-items": { type: "string", enum: ["stretch", "start", "end", "center"] },
        "align-items": { type: "string", enum: ["stretch", "start", "end", "center"] },
        "justify-content": { type: "string", enum: ["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"] },
        "align-content": { type: "string", enum: ["start", "end", "center", "stretch", "space-between", "space-around", "space-evenly"] },
        "grid-auto-columns": { type: "string" },
        "grid-auto-rows": { type: "string" },
        "grid-template-areas": { type: "string" },
        rows: { type: "number", deprecated: true, "x-replacement": "grid-template-rows: 'repeat(N, auto)'" },
        columns: { type: "number", deprecated: true, "x-replacement": "grid-template-columns: 'repeat(N, 1fr)'" },
        cell_width: { type: ["number", "string"], deprecated: true, "x-replacement": "grid-template-columns" }
      }
    },
    // ── Styling ─────────────────────────────────────────────────────────
    style: { ...dataGridCellStyleSchema, description: "Grid-wide style for every cell" },
    header_style: { ...dataGridCellStyleSchema, description: "Style for rows marked header: true (on top of the header defaults)" },
    columns: {
      type: "array",
      description: "Per-column settings, by position",
      items: {
        type: "object",
        properties: {
          style: dataGridCellStyleSchema,
          format: { type: "string", enum: FORMAT_ENUM, description: "Decorative mode: format for this column" }
        }
      }
    },
    // ── Animation ───────────────────────────────────────────────────────
    animations: {
      type: "array",
      description: "Card animations. preset: cascade-color runs row by row (params: pattern, speed_multiplier, duration, timing, colors).",
      items: animationSchema
    },
    highlight_changes: {
      oneOf: [
        { type: "boolean", description: "Pulse cells when their value changes" },
        {
          type: "object",
          description: "Animate cells when their value changes",
          properties: {
            preset: { type: "string", default: "pulse", description: "Animation preset, e.g. pulse or glow" },
            duration: { type: "number", minimum: 0, default: 500 },
            ease: { type: "string", default: "outQuad" },
            params: { type: "object", description: "Preset params, e.g. { max_scale: 1.08 } or { color, blur_max }" },
            max_cells: { type: "number", minimum: 0, description: "Most cells to animate at once (default: all, capped at 100)" }
          }
        }
      ]
    },
    filters: {
      type: "array",
      description: "CSS filters applied to the whole grid",
      items: filterSchema
    },
    // ── Identity & sizing ───────────────────────────────────────────────
    id: cardIdSchema,
    tags: tagsSchema,
    grid_options: gridOptionsSchema,
    height: cardHeightSchema,
    width: cardWidthSchema,
    min_height: cardMinHeightSchema,
    min_width: cardMinWidthSchema,
    max_height: cardMaxHeightSchema,
    max_width: cardMaxWidthSchema,
    overflow: cardOverflowSchema,
    overflow_x: cardOverflowXSchema,
    overflow_y: cardOverflowYSchema,
    z_index: cardZIndexSchema,
    // ── Legacy (migrated on load) ───────────────────────────────────────
    animation: {
      type: "object",
      deprecated: true,
      "x-replacement": "highlight_changes, and cascade-color params (pattern, timing) in animations"
    },
    font_size: { type: ["number", "string"], deprecated: true, "x-replacement": "style.font_size" },
    font_family: { type: "string", deprecated: true, "x-replacement": "style.font_family" },
    font_weight: { type: ["number", "string"], deprecated: true, "x-replacement": "style.font_weight" },
    align: { type: "string", deprecated: true, "x-replacement": "style.align" }
  }
};
const alertOverlaySchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://github.com/snootched/lcards/schemas/alert-overlay-schema",
  title: "LCARdS Alert Overlay",
  description: "Full-screen alert overlay card that reacts to the lcards_alert_mode input_select",
  type: "object",
  properties: {
    type: {
      type: "string",
      const: "custom:lcards-alert-overlay"
    },
    dismiss_mode: {
      type: "string",
      enum: ["dismiss", "reset", "auto-dismiss", "auto-reset"],
      description: "dismiss = hide overlay only; reset = hide + set alert_mode back to green_alert; auto-dismiss = automatically hide after auto_dismiss_seconds; auto-reset = automatically hide and reset alert_mode after auto_dismiss_seconds",
      default: "dismiss"
    },
    auto_dismiss_seconds: {
      type: "number",
      minimum: 1,
      description: "Seconds before the overlay auto-dismisses. Required when dismiss_mode is auto-dismiss or auto-reset. Can be overridden per condition under conditions.<key>.auto_dismiss_seconds.",
      examples: [10, 30, 60]
    },
    backdrop: {
      type: "object",
      description: "[DEPRECATED] Migrated at runtime to layers.backdrop + layers.color. Still accepted for backward compatibility.",
      properties: {
        blur: { type: "string", description: "CSS backdrop-filter blur value", default: "8px" },
        opacity: { type: "number", minimum: 0, maximum: 1, description: "Backdrop opacity (0–1)", default: 0.6 },
        color: { type: "string", description: "Backdrop background colour (CSS colour value)", default: "rgba(0,0,0,0.5)" }
      },
      additionalProperties: false
    },
    layers: {
      oneOf: [
        { type: "null", description: "null: explicitly disables all screen effect layers (useful as a per-condition override)." },
        {
          type: "object",
          description: "Screen effect layers applied independently behind the overlay. Absent slot = disabled; null slot = explicitly cleared.",
          properties: {
            backdrop: {
              oneOf: [
                { type: "null", description: "Explicitly disable this layer for a condition override" },
                {
                  type: "object",
                  description: "CSS backdrop-filter layer. Preset: blur | grayscale | saturate | contrast | hue-rotate",
                  properties: { preset: { type: "string", examples: ["blur", "grayscale", "saturate", "contrast", "hue-rotate"] } },
                  required: ["preset"],
                  additionalProperties: true
                }
              ]
            },
            color: {
              oneOf: [
                { type: "null", description: "Explicitly disable this layer for a condition override" },
                {
                  type: "object",
                  description: "Colour overlay layer. Preset: color-tint | vignette",
                  properties: { preset: { type: "string", examples: ["color-tint", "vignette"] } },
                  required: ["preset"],
                  additionalProperties: true
                }
              ]
            },
            canvas: {
              oneOf: [
                { type: "null", description: "Explicitly disable this layer for a condition override" },
                {
                  type: "object",
                  description: "Canvas animation layer. Preset: static | pixelate | glitch | scanlines",
                  properties: { preset: { type: "string", examples: ["static", "pixelate", "glitch", "scanlines"] } },
                  required: ["preset"],
                  additionalProperties: true
                }
              ]
            }
          },
          additionalProperties: false
        }
      ]
    },
    position: {
      type: "string",
      enum: [
        "top-left",
        "top",
        "top-center",
        "top-right",
        "left",
        "center-left",
        "left-center",
        "center",
        "right",
        "center-right",
        "right-center",
        "bottom-left",
        "bottom",
        "bottom-center",
        "bottom-right"
      ],
      default: "center"
    },
    width: {
      type: "string",
      description: "Content card width (CSS value). Percentages are of the screen. Default 60%.",
      default: "60%",
      examples: ["60%", "400px", "50vw"]
    },
    height: {
      type: "string",
      description: "Content card height (CSS value). Percentages are of the screen. Default: 50% for the built-in alert symbol when no width is set either; otherwise the content sizes itself (auto).",
      examples: ["50%", "300px", "auto"]
    },
    conditions: {
      type: "object",
      description: "Per-condition overrides. Keys match alert mode values (red_alert, yellow_alert, etc.)",
      additionalProperties: {
        type: "object",
        properties: {
          content: {
            type: "object",
            description: "HA card config to render inside the overlay for this condition",
            properties: {
              type: { type: "string", description: "Card type (e.g. custom:lcards-button)" }
            },
            required: ["type"],
            additionalProperties: true
          },
          alert_button: {
            type: "object",
            description: "Patch merged on top of the default lcards-button alert card for this condition. Only specify fields to override: type, component, and preset are inherited from the built-in default. Supports all lcards-button text and alert config keys. Ignored when `content` is also specified (content takes full precedence).",
            properties: {
              text: {
                type: "object",
                description: "Text field overrides: e.g. text.sub_text.content or text.alert_text.content",
                additionalProperties: true
              },
              alert: {
                type: "object",
                description: "Alert component config overrides: e.g. alert.color.shape, alert.color.bars",
                additionalProperties: true
              }
            },
            additionalProperties: true
          },
          backdrop: {
            type: "object",
            description: "[DEPRECATED] Migrated at runtime to layers. Still accepted for backward compatibility.",
            properties: {
              blur: { type: "string" },
              opacity: { type: "number", minimum: 0, maximum: 1 },
              color: { type: "string" }
            },
            additionalProperties: false
          },
          layers: {
            type: "object",
            description: "Per-condition screen effect layer overrides. Unset slots inherit from the global layers config. null = explicitly disable that slot.",
            properties: {
              backdrop: { oneOf: [{ type: "null" }, { type: "object", properties: { preset: { type: "string" } }, required: ["preset"], additionalProperties: true }] },
              color: { oneOf: [{ type: "null" }, { type: "object", properties: { preset: { type: "string" } }, required: ["preset"], additionalProperties: true }] },
              canvas: { oneOf: [{ type: "null" }, { type: "object", properties: { preset: { type: "string" } }, required: ["preset"], additionalProperties: true }] }
            },
            additionalProperties: false
          },
          position: {
            type: "string",
            enum: [
              "top-left",
              "top",
              "top-center",
              "top-right",
              "left",
              "center-left",
              "left-center",
              "center",
              "right",
              "center-right",
              "right-center",
              "bottom-left",
              "bottom",
              "bottom-center",
              "bottom-right"
            ]
          },
          width: { type: "string", description: "Content card width for this condition (CSS value); falls back to the card width" },
          height: { type: "string", description: "Content card height for this condition (CSS value); falls back to the card height" },
          auto_dismiss_seconds: {
            type: "number",
            minimum: 1,
            description: "Override auto-dismiss duration for this specific condition. Only relevant when the global dismiss_mode is auto-dismiss or auto-reset.",
            examples: [10, 30, 60]
          }
        },
        additionalProperties: false
      }
    }
  },
  required: ["type"],
  additionalProperties: false
};
function getAlertOverlaySchema() {
  return alertOverlaySchema;
}
function getSelectMenuSchema(options = {}) {
  const { availablePresets = [] } = options;
  const optionOverrideSchema = {
    type: "object",
    description: "Per-option visual overrides",
    properties: {
      // rules, sounds, variables, zones, debug_zones (LCARdSCard base); card entries below win.
      ...cardLevelProperties,
      value: {
        type: "string",
        description: "Option value (required in array form, must match entity option)"
      },
      label: {
        type: "string",
        description: "Display label override (default: option value)"
      },
      icon: {
        type: "string",
        description: "MDI icon (e.g. mdi:home) or Simple Icons (si:github)",
        examples: ["mdi:home", "mdi:shield-star", "mdi:medical-bag"]
      },
      style: {
        type: "object",
        description: "Style overrides for this option (same shape as card-level style)",
        properties: {
          card: {
            type: "object",
            properties: { color: { type: "object" } }
          },
          text: {
            type: "object",
            properties: { default: { type: "object" } }
          }
        },
        additionalProperties: true
      },
      tap_action: actionSchema,
      hold_action: actionSchema,
      double_tap_action: actionSchema
    },
    additionalProperties: false
  };
  const selectGridSchema = {
    type: "object",
    description: "Grid layout config for option buttons. Supports CSS Grid shorthand or full properties.",
    properties: {
      columns: {
        oneOf: [
          { type: "number", minimum: 1, maximum: 24 },
          { type: "string", description: 'CSS grid-template-columns value, e.g. "repeat(4, 1fr)"' }
        ],
        description: "Number of columns (shorthand → repeat(N, 1fr)) or full CSS grid-template-columns value"
      },
      rows: {
        type: ["number", "string"],
        description: "Number of rows or CSS grid-template-rows value"
      },
      gap: {
        type: "string",
        description: "CSS gap shorthand (applies to both row and column gap)",
        examples: ["4px", "8px", "0.5rem"]
      },
      "row-gap": {
        type: "string",
        description: "Override row gap",
        examples: ["4px", "8px"]
      },
      "column-gap": {
        type: "string",
        description: "Override column gap",
        examples: ["4px", "8px"]
      },
      "grid-auto-flow": {
        type: "string",
        enum: ["row", "column", "dense", "row dense", "column dense"],
        description: "CSS grid-auto-flow direction"
      },
      "grid-template-columns": {
        type: "string",
        description: "Full CSS grid-template-columns (overrides columns shorthand)",
        examples: ["repeat(4, 1fr)", "100px 1fr 2fr"]
      },
      "grid-auto-rows": {
        type: "string",
        description: "CSS grid-auto-rows for implicit row height",
        examples: ["auto", "40px", "1fr"]
      },
      "justify-items": {
        type: "string",
        enum: ["stretch", "start", "end", "center"],
        description: "CSS justify-items for cell alignment"
      },
      "align-items": {
        type: "string",
        enum: ["stretch", "start", "end", "center"],
        description: "CSS align-items for cell alignment"
      },
      height: {
        type: "string",
        enum: ["fit", "100%"],
        description: '"fit": sizes the card host to the exact height of all buttons (useful for outer grid track sizing). "100%": proportionally fills a bounded parent row, resizing buttons to fit without overflow. For a fixed card height with scrolling, use the top-level height + overflow_y config instead.'
      }
    },
    additionalProperties: true
  };
  const selectStyleSchema = {
    type: "object",
    description: "Style applied to all option buttons. Uses the same stateColor schema as lcards-button. active = selected, inactive = unselected.",
    properties: {
      card: {
        type: "object",
        properties: {
          color: {
            type: "object",
            properties: {
              background: {
                oneOf: [
                  { type: "string" },
                  {
                    type: "object",
                    properties: {
                      active: { type: "string", description: "Selected option background" },
                      inactive: { type: "string", description: "Unselected option background" },
                      hover: { type: "string", description: "Hovered option background" },
                      pressed: { type: "string", description: "Pressed option background" },
                      unavailable: { type: "string", description: "Background when entity unavailable" },
                      default: { type: "string", description: "Fallback background color" }
                    },
                    additionalProperties: true
                  }
                ],
                description: "Option button background color (state-based or static)"
              }
            },
            additionalProperties: true
          }
        },
        additionalProperties: true
      },
      text: {
        type: "object",
        properties: {
          default: {
            type: "object",
            properties: {
              color: stateColorSchema,
              font_size: { type: ["number", "string"] },
              font_weight: { type: ["number", "string"] },
              text_transform: { type: "string", enum: ["uppercase", "lowercase", "capitalize", "none"] },
              letter_spacing: { type: "string" }
            },
            additionalProperties: true
          }
        },
        additionalProperties: true
      },
      border: {
        type: "object",
        properties: {
          radius: {
            oneOf: [
              { type: "number" },
              { type: "string" },
              {
                type: "object",
                properties: {
                  top_left: { type: "number" },
                  top_right: { type: "number" },
                  bottom_right: { type: "number" },
                  bottom_left: { type: "number" }
                }
              }
            ],
            description: "Border radius (px or CSS string). Object form for per-corner control."
          },
          width: {
            oneOf: [{ type: "number" }, { type: "string" }],
            description: "Border width (px)"
          },
          color: {
            oneOf: [{ type: "string" }, { type: "object" }],
            description: "Border color (static or state-based)"
          }
        },
        additionalProperties: true
      },
      opacity: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Base opacity for unselected options (0-1). Defaults to 0.88 if not specified."
      }
    },
    additionalProperties: true
  };
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://github.com/snootched/lcards/schemas/select-menu-schema",
    title: "LCARdS Select Menu Card Configuration",
    description: 'Renders an input_select entity as a grid of LCARS-styled option buttons. Each button calls input_select.select_option when tapped. The selected option is styled as "active", all others as "inactive".',
    type: "object",
    required: ["type"],
    examples: [
      {
        type: "custom:lcards-select-menu",
        entity: "input_select.view_selector",
        preset: "lozenge",
        grid: { columns: 1, gap: "4px" }
      }
    ],
    properties: {
      // ── HA required ───────────────────────────────────────────────
      type: {
        type: "string",
        const: "custom:lcards-select-menu",
        description: "Home Assistant card type identifier (required)"
      },
      // ── Shared LCARdS ─────────────────────────────────────────────
      data_sources: dataSourcesSchema,
      // ── Core ──────────────────────────────────────────────────────
      entity: {
        ...entitySchema,
        description: "input_select (or select) entity whose options become buttons",
        "x-ui-hints": { label: "Entity (input_select)", domain: "input_select,select" }
      },
      id: cardIdSchema,
      tags: tagsSchema,
      // ── Sizing ────────────────────────────────────────────────────
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      // ── Appearance ────────────────────────────────────────────────
      preset: {
        type: "string",
        description: "Button style preset applied to all option buttons (e.g. lozenge, filled, outline)",
        examples: availablePresets,
        "x-ui-hints": {
          label: "Button Preset",
          helper: "Pick a button style preset. Controls shape, colors, and typography of all option buttons."
        }
      },
      // ── Grid layout ───────────────────────────────────────────────
      grid: selectGridSchema,
      // ── Option source ─────────────────────────────────────────────
      options: {
        oneOf: [
          {
            type: "object",
            description: "Object form: per-option overrides keyed by option value. Entity order is preserved.",
            additionalProperties: optionOverrideSchema
          },
          {
            type: "array",
            description: 'Array form: explicit ordered list (also filters which options are shown). Each item must have a "value" key.',
            items: {
              ...optionOverrideSchema,
              required: ["value"]
            }
          }
        ],
        description: "Per-option configuration. Object: override by name (entity order preserved). Array: explicit order + filter."
      },
      // ── Style ─────────────────────────────────────────────────────
      style: selectStyleSchema,
      // ── Actions ───────────────────────────────────────────────────
      tap_action: {
        ...actionSchema,
        description: "Override the default select_option tap action for ALL option buttons (per-option tap_action takes priority)."
      },
      hold_action: actionSchema,
      double_tap_action: actionSchema,
      // ── Grid options (HA dashboard) ──────────────────────────────
      grid_options: gridOptionsSchema
    },
    additionalProperties: true
  };
}
const trackString = { type: "string" };
const spacing = (what) => ({
  description: `${what}: a CSS length (e.g. 8px, 1rem 0) or 0`,
  oneOf: [{ type: "string" }, { type: "number", enum: [0] }]
});
const areaSettingsSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    "background": { type: "string" },
    "background-image": { type: "string" },
    "background-size": { type: "string" },
    "background-position": { type: "string" },
    "background-repeat": { type: "string" },
    "border-width": { type: "string" },
    "border-style": { type: "string" },
    "border-color": { type: "string" },
    "border-radius": { type: "string" },
    "place-self": { type: "string" },
    "margin": { type: "string" },
    "overflow": { type: "string" },
    "z-index": { type: ["string", "number"] }
  }
};
const viewLayoutSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    "grid-area": { type: "string" },
    "grid-column": { type: ["string", "number"], description: 'CSS grid-column: a line number (2), a span ("span 2") or a range ("1 / 3").' },
    "grid-row": { type: ["string", "number"], description: 'CSS grid-row: a line number (3), a span ("span 2") or a range ("2 / 4").' },
    "place-self": { type: "string" },
    "align-self": { type: "string" },
    "justify-self": { type: "string" },
    "margin": { type: "string" },
    "overflow": { type: "string" },
    "z-index": { type: ["string", "number"] }
  }
};
const layoutSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    "grid-template-columns": trackString,
    "grid-template-rows": trackString,
    "grid-template-areas": trackString,
    "grid-gap": trackString,
    "gap": trackString,
    "height": trackString,
    "margin": spacing("Margin around the grid"),
    "padding": spacing("Padding inside the grid"),
    "card_margin": spacing("Margin around each card in the grid"),
    "card_overflow": trackString,
    "place-items": trackString,
    "place-content": trackString,
    "grid-auto-flow": trackString,
    "grid-auto-rows": trackString,
    "grid-auto-columns": trackString,
    "mediaquery": { type: "object", additionalProperties: true },
    "areas": {
      type: "object",
      additionalProperties: areaSettingsSchema
    }
  }
};
const childCardsSchema = {
  type: "array",
  description: "Cards placed in the grid. Each is any HA card config; `view_layout` places it in a grid area.",
  items: {
    type: "object",
    required: ["type"],
    additionalProperties: true,
    properties: {
      type: { type: "string" },
      view_layout: viewLayoutSchema
    }
  }
};
const layoutCardSchema = {
  type: "object",
  required: ["type"],
  additionalProperties: true,
  properties: {
    type: {
      type: "string",
      const: "custom:lcards-layout-card",
      "x-ui-hints": { hidden: true }
    },
    layout: layoutSchema,
    // The card itself may carry view_layout when placed inside a layout view.
    view_layout: viewLayoutSchema,
    cards: childCardsSchema
  }
};
const layoutViewSchema = {
  type: "object",
  title: "LCARdS Layout View",
  description: "Dashboard view type whose whole view is a CSS grid. Uses the lovelace-layout-card grid-layout schema: a `layout` block plus `cards` placed by `view_layout.grid-area`.",
  required: ["type"],
  additionalProperties: true,
  properties: {
    type: {
      type: "string",
      const: "custom:lcards-layout-view"
    },
    layout: layoutSchema,
    cards: childCardsSchema
  }
};
function getMsdSchema() {
  const msdConfigSchema = {
    type: "object",
    properties: {
      base_svg: {
        type: "object",
        title: "Base SVG Configuration",
        description: "Background SVG the overlays draw on. Optional when view_box is set (a blank canvas).",
        required: ["source"],
        "x-ui": {
          control: "object",
          expanded: true
        },
        properties: {
          source: {
            type: "string",
            minLength: 1,
            description: 'SVG source: builtin:key, /local/path.svg, a media-source://… content ID (picked via the HA media library), or "none"',
            examples: ["builtin:ncc-1701-a-blue", "/local/my-ship.svg", "media-source://media_source/local/my-ship.svg", "none"],
            "x-ui": {
              control: "text",
              label: "SVG Source",
              placeholder: "builtin:ncc-1701-a-blue"
            },
            errorMessage: "base_svg.source is required"
          },
          filters: {
            type: "array",
            optional: true,
            description: "Stackable CSS/SVG filters applied in sequence",
            items: filterSchema,
            "x-ui": {
              control: "filter-editor",
              label: "Filters"
            }
          },
          render_visual: {
            type: "boolean",
            optional: true,
            default: true,
            description: "Whether the base SVG is painted as the visible background. Set false to use background_animation (e.g. a static image or animated layers) as the visual background instead, while the SVG is still parsed for anchors as normal."
          },
          harvest_landmarks: {
            type: "boolean",
            optional: true,
            default: true,
            description: "Compute geometric landmark anchors (hull_center, extremity_bow/stern/top/bottom, lateral_a/b) from the base SVG silhouette."
          },
          harvest_svg_elements: {
            type: "boolean",
            optional: true,
            default: true,
            description: "Harvest anchors from named <circle>/<ellipse>/<text>/<rect>/<g> elements embedded in the base SVG."
          },
          animations: {
            type: "array",
            optional: true,
            description: "Animations targeting elements inside the base SVG (by id/class, same target syntax as overlay animations)",
            items: animationSchema,
            "x-ui": {
              control: "animation-editor",
              label: "Base SVG Animations"
            }
          }
        }
      },
      background_animation: backgroundAnimationSchema,
      view_box: {
        oneOf: [
          {
            type: "string",
            enum: ["auto"],
            description: "Auto-extract from base_svg"
          },
          {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "number" },
            description: "[minX, minY, width, height]"
          }
        ],
        optional: true,
        default: "auto",
        "x-ui": {
          control: "text",
          label: "View Box",
          helper: "Auto-extract or [minX, minY, width, height]"
        }
      },
      anchors: {
        type: "object",
        optional: true,
        description: "Named anchor points for overlay positioning",
        additionalProperties: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: {
            oneOf: [
              { type: "number" },
              { type: "string", pattern: "^\\d+%$" }
            ]
          }
        },
        "x-ui": {
          control: "yaml",
          label: "Anchors",
          helper: "Define anchor points: anchor_id: [x, y]"
        }
      },
      overlays: {
        type: "array",
        optional: true,
        description: "Array of overlay configurations (validated by overlay schemas)",
        items: {
          type: "object",
          required: ["id", "type"],
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for this overlay"
            },
            tags: {
              ...tagsSchema,
              optional: true,
              description: "Tags for rule targeting: a rule selector `tag:<name>` matches every overlay carrying that tag."
            },
            type: {
              type: "string",
              enum: ["line", "control", "shape"],
              errorMessage: 'Only "line", "control", and "shape" overlay types supported. Use LCARdS cards for buttons/charts.'
            },
            kind: {
              type: "string",
              enum: ["polyline", "rect", "circle"],
              optional: true,
              description: "Shape overlays only: geometry primitive. polyline uses `points` (+ optional `closed`); rect/circle use `position` + `size` like control overlays."
            },
            points: {
              type: "array",
              optional: true,
              description: "Shape overlays (kind: polyline) only: ordered vertex list. Each entry is either [x, y] in viewBox units or a static anchor-name string. Minimum 2 points.",
              items: {
                oneOf: [
                  { type: "array", minItems: 2, maxItems: 2, items: { type: "number" } },
                  { type: "string" }
                ]
              }
            },
            closed: {
              type: "boolean",
              optional: true,
              default: false,
              description: "Shape overlays (kind: polyline) only: close the path back to its first point and allow `style.fill`."
            },
            entity: {
              ...entitySchema,
              optional: true,
              description: "Line overlays: entity to bind style.color to (state-color object); see style.color. Not used by control overlays, which already have their own entity via the embedded card."
            },
            state_attribute: {
              type: "string",
              optional: true,
              description: `Line overlays: attribute whose string value is matched against style.color state keys instead of the raw entity state (e.g. "fade", "true"); mirrors the button card's state_attribute, scoped per-line`
            },
            ranges_attribute: {
              type: "string",
              optional: true,
              description: "Line overlays: attribute value compared against above:/below:/between: keys in style.color; mirrors the button card's ranges_attribute, scoped per-line"
            },
            animations: {
              type: "array",
              optional: true,
              description: "Line and shape overlays: animations on this overlay (same syntax as card animations; e.g. trigger: on_show with preset: draw to draw the line in each time the card appears)",
              items: animationSchema
            },
            style: {
              type: "object",
              optional: true,
              description: "Line/shape overlay styling (color, width, opacity, dash pattern, markers, gradient/pattern fill, etc.)",
              properties: {
                color: {
                  ...stateColorSchema,
                  description: "Stroke color: a literal/token/CSS value, or a state-color object resolved against `entity` (same state-color pipeline as buttons/sliders; requires `entity` to be set)"
                },
                width: {
                  type: "number",
                  optional: true,
                  default: 2,
                  description: "Stroke width in viewBox units (alias: stroke_width)"
                },
                opacity: {
                  type: "number",
                  min: 0,
                  max: 1,
                  optional: true,
                  default: 1,
                  description: "Stroke opacity"
                },
                line_cap: {
                  type: "string",
                  enum: ["butt", "round", "square"],
                  optional: true,
                  default: "butt",
                  description: 'Stroke line cap style, applied to every dash segment (use with dash_array "0,N" and line_cap: round for true circular dots). Has no visible effect on a solid (non-dashed) closed shape.'
                },
                line_join: {
                  type: "string",
                  enum: ["miter", "round", "bevel"],
                  optional: true,
                  description: "Stroke line join style at path vertices. Meaningful for polyline and rect; no effect on circle/ellipse."
                },
                miter_limit: {
                  type: "number",
                  optional: true,
                  default: 4,
                  description: 'Miter limit, used when line_join is "miter"'
                },
                dash_array: {
                  type: ["string", "array"],
                  optional: true,
                  description: 'Dash pattern, e.g. "5,5" or [5, 5]'
                },
                dash_offset: {
                  type: "number",
                  optional: true,
                  default: 0,
                  description: "Dash pattern offset"
                },
                fill: {
                  ...stateColorSchema,
                  description: "Fill color: a literal/token/CSS value, or a state-color object resolved against `entity` (same state-color pipeline as `color`). Only visible on closed shapes (rect, circle, closed polyline)."
                },
                fill_opacity: {
                  type: "number",
                  min: 0,
                  max: 1,
                  optional: true,
                  default: 1,
                  description: "Fill opacity"
                },
                gradient: {
                  type: "object",
                  optional: true,
                  description: "Gradient fill/stroke configuration (linear or radial)"
                },
                pattern: {
                  type: "object",
                  optional: true,
                  description: "Pattern fill configuration (dots, lines, diagonal, grid, or custom SVG content)"
                },
                marker_start: {
                  type: ["string", "object"],
                  optional: true,
                  description: "Marker (arrowhead/dot/etc.) at the path start. Polyline shapes only; meaningless for rect/circle."
                },
                marker_mid: {
                  type: ["string", "object"],
                  optional: true,
                  description: "Marker at each interior path vertex. Polyline shapes only; meaningless for rect/circle."
                },
                marker_end: {
                  type: ["string", "object"],
                  optional: true,
                  description: "Marker at the path end. Polyline shapes only; meaningless for rect/circle."
                },
                animatable: {
                  type: "boolean",
                  optional: true,
                  default: true,
                  description: "Whether this overlay is eligible as an anime.js animation target"
                }
              }
            },
            // Shared positioning (control overlays use position; line overlays use anchor + attach_to)
            position: {
              type: ["string", "array"],
              optional: true,
              description: 'Control overlay, or shape overlay (kind: rect/circle): named anchor (e.g. "hub") or absolute coordinates [x, y]. The anchor is the center of the card/shape by default.'
            },
            size: {
              type: "array",
              optional: true,
              description: "Control overlay, or shape overlay (kind: rect/circle) size [width, height] in SVG coordinates. For kind: circle, an ellipse is drawn with rx=width/2, ry=height/2 (use equal width/height for a perfect circle)."
            },
            attachment: {
              type: "string",
              enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right"],
              optional: true,
              default: "center",
              description: "Which point of the control card aligns with the anchor position. Default: center"
            },
            position_side: {
              type: "string",
              enum: ["center", "top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right"],
              optional: true,
              default: "center",
              description: "Control overlays only: when position references another control's id, which point of that target control to align to (instead of its center). Ignored for named-anchor or coordinate positions."
            },
            card: {
              type: "object",
              optional: true,
              description: "HA card config embedded in this control overlay"
            },
            triggers_update: {
              oneOf: [
                {
                  type: "array",
                  items: { type: "string" },
                  description: "Extra entity IDs (or MSD data-source refs) this overlay depends on, beyond what static analysis of `card` can detect. HA entity IDs are folded into a control overlay's HASS change-detection set; non-entity refs are subscribed as MSD data-source updates (existing behavior, any overlay type)."
                },
                {
                  type: "string",
                  enum: ["all"],
                  description: "Control overlays only: this control receives every HASS update unconditionally, bypassing the per-control entity-diff optimization. Use when the embedded card's entity dependencies genuinely can't be enumerated (e.g. wildcard/device-class auto-discovery alert cards). Prefer the array form when possible."
                }
              ],
              optional: true,
              "x-ui": {
                control: "yaml",
                label: "Triggers Update",
                helper: `Array of entity IDs, or "all" for control overlays: declares extra HASS dependencies static analysis can't detect`
              }
            },
            z_index: {
              type: "number",
              optional: true,
              description: "Stacking order for overlapping overlays"
            },
            locked: {
              type: "boolean",
              optional: true,
              default: false,
              description: "Control/shape overlays only: when true, MSD Studio's editor canvas disables drag/resize/vertex-editing for this overlay (Edit/Duplicate/Delete in the list panel remain available). Editor-only; has no effect on runtime rendering or line overlays."
            },
            // Line overlay anchor/endpoint fields
            anchor: {
              type: ["string", "array"],
              optional: true,
              description: "Line overlays: start-point anchor name or [x,y]. Control overlays: deprecated alias for position; use position instead."
            },
            anchor_side: {
              type: "string",
              optional: true,
              description: "Line overlays: which side of the anchor overlay the line departs from (top, bottom, left, right, center)"
            },
            anchor_gap: {
              type: "number",
              optional: true,
              default: 0,
              description: "Line overlays: gap in SVG units between line endpoint and anchor edge"
            },
            attach_to: {
              type: ["string", "array"],
              optional: true,
              description: "Line overlays: destination anchor name, overlay ID, or [x, y]"
            },
            attach_side: {
              type: "string",
              optional: true,
              description: "Line overlays: which side of the attach_to overlay the line arrives at (top, bottom, left, right, center)"
            },
            attach_gap: {
              type: "number",
              optional: true,
              default: 0,
              description: "Line overlays: gap in SVG units between line endpoint and attach_to edge"
            },
            // Line overlay routing properties
            route: {
              type: "string",
              enum: ["auto", "direct", "manhattan", "smart", "grid", "manual"],
              optional: true,
              default: "auto",
              description: "Routing algorithm. auto (recommended): always full pathfinding (obstacle avoidance, trunk bundling, crossing avoidance) regardless of whether obstacles/channels are present. direct: straight line, no pathfinding. manual: explicit waypoints. Escape hatches for the cheap/non-participating alternative: manhattan (fixed 2-elbow shape, no pathfinding, no bundling, no crossing avoidance) or grid (pathfinding + bundling/crossing avoidance, without the extra local-search refinement pass smart adds). smart is what auto resolves to."
            },
            waypoints: {
              type: "array",
              optional: true,
              description: "Array of waypoints for manual routing. Each waypoint is a coordinate pair [x, y], optionally [x, y, radius] to override this corner's rounding radius (round) or chamfer size (bevel); omit the 3rd slot to inherit corner_radius. A waypoint can also be an anchor name string. Line will pass through waypoints in order.",
              items: {
                oneOf: [
                  { type: "array", minItems: 2, maxItems: 3, items: { type: "number" } },
                  { type: "string" }
                ]
              }
            },
            route_hint: {
              type: "string",
              enum: ["", "xy", "yx"],
              optional: true,
              description: "Initial segment direction hint: empty/auto (geometry-based), xy = horizontal first, yx = vertical first"
            },
            route_hint_last: {
              type: "string",
              enum: ["", "xy", "yx"],
              optional: true,
              description: "Final segment direction hint: empty/auto (same as route_hint), xy = vertical last, yx = horizontal last"
            },
            route_channels: {
              type: "array",
              items: { type: "string" },
              optional: true,
              description: "Array of channel IDs this line should route through"
            },
            clearance: {
              type: "number",
              min: 0,
              optional: true,
              description: "Minimum clearance around obstacles in viewBox units (overrides global default)"
            },
            corner_style: {
              type: "string",
              enum: ["miter", "round", "bevel"],
              optional: true,
              default: "round",
              description: "Line overlays, or shape overlays (kind: polyline): how corners are rendered. For shape kind: rect, maps to rx/ry (round only); no effect on circle/ellipse."
            },
            corner_radius: {
              type: "number",
              min: 0,
              optional: true,
              default: 34,
              description: "Line overlays, or shape overlays (kind: polyline): corner cut size in viewBox units: arc radius for round corners, or diagonal chamfer size for bevel corners. For shape kind: rect, sets rx/ry directly."
            },
            corner_radius_mode: {
              type: "string",
              enum: ["auto", "forced"],
              optional: true,
              default: "auto",
              description: "Line overlays only (routing behavior, not shape overlay rendering): whether corner_radius is a target or a hard requirement for round/bevel corners. auto (default): corner size may shrink so the router stays free to avoid forcing a detour or an unnecessary line crossing near tight geometry. forced: always reserves room for the full configured radius, matching pre-2026.07 behavior; can force routing detours or crossings."
            },
            corner_room_weight: {
              type: "number",
              min: 0,
              optional: true,
              description: "Line overlays only, round/bevel corner_style: how strongly the smart-routing refinement pass tries to recover this line's full corner_radius when a tight detour would otherwise shrink it. On by default (card-wide default in routing.corner_room_weight); a route that leaves more room for the configured corner is preferred over the plain-cheapest route, when the difference is small. Set to 0 on a line to opt it out."
            },
            corner_angle: {
              type: "number",
              min: 0,
              max: 90,
              optional: true,
              default: 45,
              description: "Bevel corners only (line overlays, or shape overlays of kind: polyline): angle of the diagonal cut in degrees (0=cut flush with incoming edge, 90=flush with outgoing edge, 45=symmetric diagonal), matching the elbow card's diagonal-cap angle"
            },
            stub_length: {
              type: "number",
              min: 0,
              optional: true,
              description: "Line overlays only: overrides the mandatory cardinal stub length (viewBox units) departing/arriving anchor_side or attach_side, instead of the router's own auto-computed floor (which scales with grid_resolution and can force a longer straight lead-out than a specific line's own geometry needs). Leave unset for the default. Going below one grid cell risks re-triggering an internal same-cell short-circuit; use window.lcards.debug.msd.routing.inspect(id).meta.debug to see the router's own resolved value first."
            },
            smoothing_mode: {
              type: "string",
              enum: ["none", "chaikin"],
              optional: true,
              default: "none",
              description: "Line overlays, or shape overlays (kind: polyline) only: path smoothing algorithm"
            },
            smoothing_iterations: {
              type: "number",
              min: 0,
              max: 5,
              optional: true,
              default: 0,
              description: "Line overlays, or shape overlays (kind: polyline) only: number of smoothing iterations to apply"
            }
          }
        },
        "x-ui": {
          control: "array",
          label: "Overlays",
          addLabel: "Add Overlay"
        }
      },
      animations: {
        type: "array",
        optional: true,
        description: 'Animations that bulk-target overlays in the shared overlay group by CSS selector (data-overlay-id, class, etc.), e.g. animate every overlay whose id starts with "shield_" with one declaration, instead of repeating the animation on each overlay. Same target/targets selector syntax as base_svg.animations and per-overlay animations; matches shape, line, and control overlays uniformly.',
        items: animationSchema,
        "x-ui": {
          control: "animation-editor",
          label: "Overlay Group Animations"
        }
      },
      routing: {
        type: "object",
        optional: true,
        description: "Global line routing configuration (lines can override with per-line properties)",
        properties: {
          // Routing intelligence
          default_mode: {
            type: "string",
            enum: ["manhattan", "smart", "grid", "auto"],
            optional: true,
            default: "auto",
            description: "Card-wide override for every line whose own route is unset/auto (per-line route: still wins). auto (default): full pathfinding: obstacle avoidance, trunk bundling, crossing avoidance (this is what an unset line gets). manhattan/grid: force the whole card to the cheap/non-participating or no-refinement alternative instead. smart: same as auto, spelled out explicitly.",
            "x-ui": {
              control: "select",
              label: "Default Routing Mode",
              helper: "Global routing strategy applied to every line that leaves route unset; per-line route: always overrides this"
            }
          },
          // Basic routing
          clearance: {
            type: "number",
            min: 0,
            optional: true,
            default: 0,
            description: "Minimum clearance around obstacles (viewBox units)"
          },
          grid_resolution: {
            type: "number",
            min: 5,
            optional: true,
            default: 64,
            description: "Grid cell size for grid-based routing (viewBox units; values below 5 are coerced to 32). Unset by default; auto-scales from view_box size instead of a fixed number (~1/12th of the shorter dimension, clamped to [16, 64]; 64 shown here is that ceiling, not a fixed default)"
          },
          min_stub_length_factor: {
            type: "number",
            min: 0,
            optional: true,
            default: 1,
            description: `Multiplier on the resolved grid_resolution for the minimum mandatory lead-out/lead-in stub every line reserves before routing runs. 1 (default) reproduces the router's own "at least one grid cell" floor; raise it to reserve more room for large corner_radius values, lower it (e.g. on a small view_box, where a flat floor would otherwise be disproportionately long) to let lines turn sooner`
          },
          turn_penalty: {
            type: "number",
            min: 0,
            optional: true,
            default: 2,
            description: "A* cost for changing direction: higher values produce straighter paths with fewer turns"
          },
          route_hint_penalty: {
            type: "number",
            min: 0,
            optional: true,
            default: 6,
            description: "A* cost for a first/last move that disagrees with route_hint/route_hint_last (soft, so obstacles still win)"
          },
          // Path smoothing (flat format)
          smoothing_mode: {
            type: "string",
            enum: ["none", "chaikin"],
            optional: true,
            default: "none",
            description: "Path smoothing algorithm"
          },
          smoothing_iterations: {
            type: "number",
            min: 1,
            max: 5,
            optional: true,
            default: 1,
            description: "Number of smoothing iterations"
          },
          smoothing_max_points: {
            type: "number",
            min: 1,
            optional: true,
            default: 160,
            description: "Maximum points after smoothing"
          },
          // Path smoothing (nested format - alternate)
          smoothing: {
            type: "object",
            optional: true,
            description: "Nested smoothing configuration (alternate format)",
            properties: {
              mode: {
                type: "string",
                enum: ["none", "chaikin"],
                optional: true,
                default: "none",
                description: "Smoothing algorithm (same as smoothing_mode)"
              },
              iterations: {
                type: "number",
                min: 1,
                max: 5,
                optional: true,
                default: 1,
                description: "Number of iterations (same as smoothing_iterations)"
              },
              max_points: {
                type: "number",
                min: 1,
                optional: true,
                default: 160,
                description: "Max points (same as smoothing_max_points)"
              }
            }
          },
          // Smart routing
          smart_proximity: {
            type: "number",
            min: 0,
            optional: true,
            default: 0,
            description: "Proximity band for smart routing (viewBox units)"
          },
          smart_detour_span: {
            type: "number",
            min: 1,
            optional: true,
            default: 48,
            description: "Maximum detour distance for smart routing (viewBox units)"
          },
          smart_max_extra_bends: {
            type: "number",
            min: 0,
            optional: true,
            default: 3,
            description: "Maximum additional bends allowed by smart routing"
          },
          smart_min_improvement: {
            type: "number",
            min: 0,
            optional: true,
            default: 4,
            description: "Minimum cost improvement to accept detour (viewBox units)"
          },
          smart_max_detours_per_elbow: {
            type: "number",
            min: 1,
            optional: true,
            default: 4,
            description: "Maximum detour attempts per elbow"
          },
          corner_room_weight: {
            type: "number",
            min: 0,
            optional: true,
            default: 4,
            description: "Card-wide default strength for recovering a line's full corner_radius near tight detours (see the per-line field of the same name for the full explanation). On by default; the LCARS rounded-corner look is the intended out-of-the-box result. Set to 0 to disable card-wide; individual lines can still opt back in via their own corner_room_weight."
          },
          // Channel configuration
          channel_force_penalty: {
            type: "number",
            min: 0,
            optional: true,
            default: 800,
            description: "Penalty for lines outside forced channels"
          },
          channel_avoid_multiplier: {
            type: "number",
            min: 0,
            optional: true,
            default: 1,
            description: "Multiplier for avoid channel penalties"
          },
          channel_prefer_bias: {
            type: "number",
            min: 0,
            optional: true,
            default: 0.9,
            description: "Per-cell A* discount for traveling along a prefer channel's own direction (scaled by channel weight)"
          },
          channel_avoid_bias: {
            type: "number",
            min: 0,
            optional: true,
            default: 3,
            description: "Per-cell A* penalty for entering an avoid channel (scaled by channel weight and channel_avoid_multiplier)"
          },
          // Trunk-and-branch (spontaneous line bundling)
          trunk_bundling_enabled: {
            type: "boolean",
            optional: true,
            default: true,
            description: "Lines whose paths run close and parallel spontaneously bundle together and branch apart where needed"
          },
          trunk_proximity: {
            type: "number",
            min: 0,
            optional: true,
            default: 32,
            description: 'Maximum distance to a trunk lane to be considered "nearby" (viewBox units)'
          },
          trunk_min_overlap: {
            type: "number",
            min: 0,
            optional: true,
            default: 60,
            description: "Minimum shared travel distance for joining a trunk to be worthwhile (viewBox units)"
          },
          trunk_min_length: {
            type: "number",
            min: 0,
            optional: true,
            default: 60,
            description: "Minimum straight-run length to register as a new joinable trunk (viewBox units)"
          },
          trunk_max_join_candidates: {
            type: "number",
            min: 1,
            optional: true,
            default: 2,
            description: "Maximum number of discovered trunks a single line will try to chain through"
          },
          trunk_bundle_weight: {
            type: "number",
            min: 0,
            optional: true,
            default: 0.5,
            description: "Reward strength for joining a discovered trunk (same role as a channel's weight)"
          },
          trunk_line_spacing: {
            type: "number",
            min: 0,
            optional: true,
            default: 8,
            description: "Default lane spacing for lines bundled on a discovered trunk (viewBox units)"
          },
          trunk_discovery_max_passes: {
            type: "number",
            min: 1,
            optional: true,
            default: 4,
            description: "Cap on discovery passes before rendering, so every line's trunk/crossing data is known regardless of YAML order (safety limit against rare oscillation)"
          },
          // Crossing avoidance (lines shouldn't cross each other unless necessary)
          crossing_avoid_enabled: {
            type: "boolean",
            optional: true,
            default: true,
            description: "Penalize a line's path for cutting orthogonally across another already-routed line's segment"
          },
          crossing_avoid_bias: {
            type: "number",
            min: 0,
            optional: true,
            default: 4,
            description: "Per-cell penalty for crossing another line's segment: a deterrent, not a hard block"
          },
          crossing_min_length: {
            type: "number",
            min: 0,
            optional: true,
            default: 12,
            description: "Minimum straight-run length to register as avoidable (viewBox units), smaller than trunk_min_length so short stub legs are still avoidable"
          },
          // Cost function weights
          cost_defaults: {
            type: "object",
            optional: true,
            description: "Cost function weights for routing algorithms",
            properties: {
              bend: {
                type: "number",
                optional: true,
                default: 10,
                description: "Cost weight for each bend/elbow in path"
              },
              proximity: {
                type: "number",
                optional: true,
                default: 4,
                description: "Cost weight for proximity to obstacles"
              }
            }
          }
        }
      },
      channels: {
        type: "object",
        optional: true,
        description: "Named routing channels for bundling/separating lines with optional forced routing",
        patternProperties: {
          "^[a-zA-Z0-9_-]+$": {
            type: "object",
            required: ["bounds"],
            properties: {
              bounds: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: { type: "number" },
                description: "Channel rectangle [x, y, width, height]"
              },
              mode: {
                type: "string",
                enum: ["prefer", "avoid", "force"],
                optional: true,
                default: "prefer",
                description: "Channel behavior: prefer=encourage bundling, avoid=stay away, force=must route through"
              },
              direction: {
                type: "string",
                enum: ["horizontal", "vertical", "auto"],
                optional: true,
                default: "auto",
                description: "Flow direction through channel (auto = infer from shape: wide=horizontal, tall=vertical)"
              },
              weight: {
                type: "number",
                min: 0,
                max: 1,
                optional: true,
                default: 0.5,
                description: "Channel influence strength (0-1, higher = stronger pull/push)"
              },
              line_spacing: {
                type: "number",
                min: 0,
                max: 100,
                optional: true,
                default: 8,
                description: "Gap between bundled lines in viewBox units (for prefer/force modes)"
              },
              discoverable: {
                type: "boolean",
                optional: true,
                default: true,
                description: "Whether nearby lines that do NOT list this channel in their own route_channels may still spontaneously bundle into it. Default true matches automatic zero-config bundling; set false to scope this channel to only the lines that explicitly reference it via route_channels."
              },
              type: {
                type: "string",
                enum: ["bundling", "avoiding", "waypoint"],
                optional: true,
                deprecated: true,
                "x-replacement": "mode (bundling→prefer, avoiding→avoid, waypoint→force)",
                description: "DEPRECATED: Use mode instead (bundling→prefer, avoiding→avoid, waypoint→force)"
              }
            }
          }
        },
        "x-ui": {
          control: "yaml",
          label: "Routing Channels",
          helper: "Define channels: channel_id: { bounds: [x,y,w,h], mode: prefer|avoid|force, direction: auto|horizontal|vertical, discoverable: true|false }"
        }
      },
      triggers_update: {
        type: "string",
        enum: ["all"],
        optional: true,
        description: "Card-wide escape hatch: every control overlay receives every HASS update unconditionally, bypassing the per-control entity-diff optimization for the whole card. Discouraged; prefer the per-overlay control `triggers_update: all` scoped to just the problem control.",
        "x-ui": {
          control: "select",
          label: "Update All Controls (discouraged)",
          helper: "Bypasses per-control HASS optimization for the entire card. Prefer per-overlay triggers_update: all instead."
        }
      }
      // NOTE: 'theme' field removed - theme is now global via ThemeManager singleton
      // Per-card theme configuration is no longer supported
    }
  };
  return {
    type: "object",
    title: "MSD Card",
    description: "Master Systems Display card with overlays and routing",
    "x-ui": {
      category: "advanced",
      icon: "mdi:monitor-dashboard",
      documentation: "doc/architecture/schemas/msd-schema-definition.md"
    },
    required: ["type", "msd"],
    properties: {
      type: {
        type: "string",
        enum: ["custom:lcards-msd", "custom:lcards-msd-card", "custom:cb-lcars-card"],
        description: "Card type identifier",
        "x-ui": {
          control: "select",
          label: "Card Type"
        }
      },
      // ============================================================================
      // CORE METADATA PROPERTIES
      // ============================================================================
      id: {
        ...cardIdSchema,
        description: "Custom card ID for rule targeting (optional - auto-generated if omitted)",
        "x-ui-hints": {
          label: "Card ID",
          helper: "Unique identifier for targeting with rules (auto-generated if not specified)",
          selector: {
            text: {
              placeholder: "msd-main"
            }
          }
        }
      },
      tags: {
        ...tagsSchema,
        "x-ui-hints": {
          label: "Tags",
          helper: "Tags for grouping and targeting multiple cards with rules",
          selector: {
            select: {
              multiple: true,
              custom_value: true
            }
          },
          examples: ["dashboard-main", "navigation", "status"]
        }
      },
      // ============================================================================
      // SIZING
      // ============================================================================
      height: cardHeightSchema,
      width: cardWidthSchema,
      min_height: cardMinHeightSchema,
      min_width: cardMinWidthSchema,
      max_height: cardMaxHeightSchema,
      max_width: cardMaxWidthSchema,
      overflow: cardOverflowSchema,
      overflow_x: cardOverflowXSchema,
      overflow_y: cardOverflowYSchema,
      z_index: cardZIndexSchema,
      msd: msdConfigSchema,
      // Root-level properties (shared across cards)
      data_sources: dataSourcesSchema,
      rules: rulesSchema
    }
  };
}
const shellStrategySchema = {
  type: "object",
  title: "LCARS Shell Dashboard Strategy",
  description: "Dashboard strategy that generates a full LCARS shell (header, sidebars, content panel) on a custom:lcards-layout-view. Set it as the dashboard's `strategy:` block. The room light list needs auto-entities (HACS).",
  required: ["type"],
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      const: "custom:lcars-shell",
      description: "Strategy identifier."
    },
    room_selector_entity: {
      type: "string",
      title: "Room Controller Entity",
      description: "Controls the room light controller. input_select or select: its options become the room list (entity mode). input_text: room list is built from your HA area registry automatically; the selected area is stored in this entity (auto-areas mode). Leave blank to show a placeholder.",
      "x-ui-hints": { selector: { entity: { domain: ["input_select", "select", "input_text"] } } }
    },
    page_selector_entity: {
      type: "string",
      title: "Page Selector Entity",
      description: "input_select entity used for sidebar page/section navigation",
      "x-ui-hints": { selector: { entity: { domain: ["input_select", "select"] } } }
    },
    top_bar_entity: {
      type: "string",
      title: "Top Bar Toggle",
      description: "input_boolean that shows/hides the top header bar (also bound to the first header-left button)",
      "x-ui-hints": { selector: { entity: { domain: ["input_boolean"] } } }
    },
    right_sidebar_entity: {
      type: "string",
      title: "Right Sidebar Toggle",
      description: "input_boolean that shows/hides the right sidebar (also bound to the second header-left button)",
      "x-ui-hints": { selector: { entity: { domain: ["input_boolean"] } } }
    }
  }
};
const TEXT_POSITIONS = Object.freeze([
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
  "top",
  "bottom",
  "left",
  "right",
  "left-center",
  "right-center"
  // accepted aliases (deprecated)
]);
const BUTTON_PRESETS = {
  // =====================================
  // BASE BUTTON - Foundation for all buttons
  // =====================================
  base: {
    // Layout dimensions
    //height: 'theme:components.button.layout.height.standard',
    min_height: "theme:components.button.layout.minHeight",
    // Visibility defaults
    show_icon: false,
    // Card styling (nested structure for background colors)
    card: {
      color: {
        background: {
          default: "theme:components.button.background.default",
          active: "theme:components.button.background.active",
          inactive: "theme:components.button.background.inactive",
          unavailable: "theme:components.button.background.unavailable",
          hover: "theme:components.button.background.hover",
          pressed: "theme:components.button.background.pressed"
        }
      }
    },
    // Text styling (nested structure) - ALL text properties go here
    text: {
      default: {
        position: "center-right",
        // Default text position (right-aligned, vertically centered)
        // Default text styling - applies to all text fields unless overridden
        font_family: "theme:components.button.text.font_family",
        font_size: "theme:components.button.text.font_size",
        font_weight: "theme:components.button.text.font_weight",
        text_transform: "theme:components.button.text.text_transform",
        // Cap-height ratio — propagated from the theme token so changing the
        // primary font family in the theme updates all font_size_percent calculations.
        cap_height_ratio: "theme:components.button.text.cap_height_ratio",
        color: {
          default: "theme:components.button.text.color.active",
          active: "theme:components.button.text.color.active",
          inactive: "theme:components.button.text.color.inactive",
          unavailable: "theme:components.button.text.color.unavailable"
        }
      },
      name: {
        // Name-specific overrides (if any)
        position: "bottom-right",
        content: "{entity.attributes.friendly_name}",
        show: false
      },
      state: {
        // Label-specific overrides (if any)
        position: "top-right",
        content: "{entity.state}",
        show: false
      },
      label: {
        // State-specific overrides (if any)
        position: "center",
        content: `[[[ return (((Math.floor(Math.random() * 256).toString(16).padStart(2, '0')) + "-" + (Math.floor(Math.random() * 4096).toString(16).padStart(3, '0')))) ]]]`,
        show: false
      }
    },
    // Border styling (nested structure)
    border: {
      width: 0,
      color: {
        default: "theme:components.button.border.color.default",
        active: "theme:components.button.border.color.active",
        inactive: "theme:components.button.border.color.inactive",
        unavailable: "theme:components.button.border.color.unavailable",
        hover: "theme:components.button.border.color.hover",
        pressed: "theme:components.button.border.color.pressed"
      },
      radius: "theme:components.button.radius.none"
    },
    // Icon styling (nested structure)
    icon_style: {
      size: "theme:components.button.icon.size",
      layout_spacing: "theme:components.button.icon.layout_spacing",
      position: "center",
      color: {
        default: "theme:components.button.icon.color.default",
        active: "theme:components.button.icon.color.active",
        inactive: "theme:components.button.icon.color.inactive",
        unavailable: "theme:components.button.icon.color.unavailable"
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      divider: {
        width: "theme:components.button.icon.divider.width",
        color: "theme:components.button.icon.divider.color.default"
      }
    }
  },
  // =====================================
  // LOZENGE BUTTONS - Fully rounded
  // =====================================
  lozenge: {
    extends: "button.base",
    icon_area: "left",
    // Icon area on left with divider
    border: {
      width: 0,
      // No border for lozenge (filled buttons)
      radius: {
        top_left: "theme:components.button.radius.full",
        top_right: "theme:components.button.radius.full",
        bottom_left: "theme:components.button.radius.full",
        bottom_right: "theme:components.button.radius.full"
      }
    },
    icon_style: {
      position: "center",
      // Icon centered within left area
      padding: {
        right: 0,
        left: 2
      }
    },
    text: {
      name: {
        padding: {
          right: 24,
          left: 0
        }
      },
      state: {
        padding: {
          right: 24,
          left: 0
        }
      }
    }
  },
  "lozenge-right": {
    extends: "button.lozenge",
    show_icon: true,
    // Enable icons by default for lozenge buttons
    icon_area: "right",
    // Icon area on right
    icon_style: {
      position: "center",
      // Icon centered within left area
      padding: {
        right: 2,
        left: 0
      }
    },
    text: {
      name: {
        position: "bottom-left",
        padding: {
          right: 0,
          left: 24
        }
      },
      state: {
        position: "top-left",
        padding: {
          right: 0,
          left: 24
        }
      }
    }
  },
  // =====================================
  // BULLET BUTTONS - Half rounded
  // =====================================
  bullet: {
    extends: "button.lozenge",
    border: {
      width: 0,
      // No border for bullet (filled buttons)
      radius: {
        top_left: "theme:components.button.radius.none",
        bottom_left: "theme:components.button.radius.none",
        top_right: "theme:components.button.radius.full",
        bottom_right: "theme:components.button.radius.full"
      }
    },
    icon_style: {
      position: "center",
      // Icon centered within left area
      padding: 0
    }
  },
  "bullet-right": {
    extends: "button.lozenge-right",
    border: {
      width: 0,
      // No border for bullet (filled buttons)
      radius: {
        top_left: "theme:components.button.radius.full",
        bottom_left: "theme:components.button.radius.full",
        top_right: "theme:components.button.radius.none",
        bottom_right: "theme:components.button.radius.none"
      }
    },
    icon_style: {
      position: "center",
      // Icon centered within left area
      padding: 0
    }
  },
  // =====================================
  // CAPPED BUTTONS - Single side rounded
  // =====================================
  capped: {
    extends: "button.lozenge",
    border: {
      width: 0,
      // No border for capped (filled buttons)
      radius: {
        top_left: "theme:components.button.radius.full",
        bottom_left: "theme:components.button.radius.full",
        top_right: "theme:components.button.radius.none",
        bottom_right: "theme:components.button.radius.none"
      }
    },
    text: {
      name: {
        position: "bottom-right",
        padding: null
      },
      state: {
        position: "top-right",
        padding: null
      }
    }
  },
  "capped-right": {
    extends: "button.lozenge-right",
    border: {
      width: 0,
      // No border for capped (filled buttons)
      radius: {
        top_left: "theme:components.button.radius.none",
        bottom_left: "theme:components.button.radius.none",
        top_right: "theme:components.button.radius.full",
        bottom_right: "theme:components.button.radius.full"
      }
    },
    text: {
      name: {
        position: "bottom-left",
        padding: null
      },
      state: {
        position: "top-left",
        padding: null
      }
    }
  },
  // =====================================
  // BARREL BUTTONS - Solid backgrounds
  // =====================================
  "barrel": {
    extends: "button.base",
    // Filled buttons have no border, just background
    border: {
      width: 0,
      radius: "theme:components.button.radius.none"
    }
  },
  "barrel-right": {
    extends: "button.barrel",
    icon_area: "right",
    // Swap text and icon positions
    text: {
      default: {
        position: "center-left"
        // Text on left when icon is on right
      },
      name: {
        position: "bottom-left"
      },
      state: {
        position: "top-left"
      }
    }
  },
  // =====================================
  // FILLED BUTTONS - Filled (larger text - Picard style)
  // =====================================
  "filled": {
    extends: "button.base",
    icon_area: "left",
    // Text styling - left aligned for outline style
    text: {
      name: {
        position: "right",
        show: true,
        padding: {
          right: 12
        }
      },
      state: {
        position: "left",
        font_size: "theme:components.button.text.font_size",
        show: false
      }
    }
  },
  "filled-right": {
    extends: "button.base",
    icon_area: "right",
    text: {
      name: {
        position: "left",
        show: true,
        padding: {
          left: 12
        }
      },
      state: {
        position: "right",
        font_size: "theme:components.button.text.font_size",
        show: false
      }
    }
  },
  // =====================================
  // OUTLINE BUTTONS - Border only, large text (Picard style)
  // =====================================
  "outline": {
    extends: "button.base",
    show_icon: false,
    icon_area: "left",
    // Outline style - transparent background with colored borders
    card: {
      color: {
        background: {
          default: "theme:components.button.background.transparent",
          active: "theme:components.button.background.transparent",
          inactive: "theme:components.button.background.transparent",
          unavailable: "theme:components.button.background.transparent",
          hover: "theme:components.button.background.transparent",
          pressed: "theme:components.button.background.transparent"
        }
      }
    },
    // Border styled by state (active=black, inactive=gray, unavailable=darkgray)
    border: {
      width: "theme:components.button.border.width",
      radius: "theme:components.button.radius.none",
      color: {
        default: "theme:components.button.border.color.default",
        active: "theme:components.button.border.color.active",
        inactive: "theme:components.button.border.color.inactive",
        unavailable: "theme:components.button.border.color.unavailable",
        hover: "theme:components.button.border.color.hover",
        pressed: "theme:components.button.border.color.pressed"
      }
    },
    // Text styling - left aligned for outline style
    text: {
      default: {
        color: {
          default: "theme:components.button.background.active",
          active: "theme:components.button.background.active",
          inactive: "theme:components.button.background.inactive",
          unavailable: "theme:components.button.text.color.unavailable"
        }
      },
      name: {
        position: "right",
        show: false,
        padding: {
          right: 12
        }
      },
      state: {
        position: "left",
        show: false
      }
    },
    // Icon styled by state
    icon_style: {
      color: {
        default: "theme:components.button.border.color.active",
        active: "theme:components.button.border.color.active",
        inactive: "theme:components.button.border.color.inactive",
        unavailable: "theme:components.button.border.color.unavailable"
      }
    }
  },
  "outline-right": {
    extends: "button.outline",
    icon_area: "right",
    text: {
      default: {
        position: "center-left"
        // Text on left when icon is on right
      },
      name: {
        position: "left",
        show: false,
        padding: {
          left: 12
        }
      },
      state: {
        position: "right",
        show: false
      }
    }
  },
  // =====================================
  // ICON - Icon-only compact
  // =====================================
  "icon": {
    extends: "button.base",
    // Square dimensions for icon button
    width: "theme:components.button.layout.height.icon",
    height: "theme:components.button.layout.height.icon",
    min_height: "theme:components.button.layout.height.icon",
    // Rounded corners
    border: {
      radius: {
        top_left: "theme:components.button.radius.large",
        top_right: "theme:components.button.radius.large",
        bottom_left: "theme:components.button.radius.large",
        bottom_right: "theme:components.button.radius.large"
      }
    },
    // Icon-only layout (center everything)
    show_icon: true,
    icon_style: {
      size: 30,
      border: {
        left: {
          width: 0
        },
        right: {
          width: 0
        }
      }
    },
    text: {
      default: {
        show: false
      }
    }
  },
  // =====================================
  // TEXT-ONLY - Pure text label with no background or border
  // =====================================
  "text-only": {
    extends: "button.base",
    description: "Pure text label with no background or border",
    // No border
    border: {
      width: 0
    },
    // Transparent background for all states
    card: {
      color: {
        background: {
          active: "transparent",
          inactive: "transparent",
          unavailable: "transparent",
          default: "transparent"
        }
      }
    },
    // Text styling — mirrors button background state colors (active color on text, off/unavailable muted)
    text: {
      default: {
        font_size: 16,
        font_weight: "normal",
        color: {
          active: "theme:components.button.background.active",
          inactive: "theme:components.button.background.inactive",
          unavailable: "theme:components.button.background.unavailable",
          default: "theme:components.button.background.active"
        }
      },
      label: {
        position: "center"
      }
    },
    // No icon by default
    show_icon: false,
    // Full opacity
    opacity: 1
  },
  // =====================================
  // BAR LABEL PRESETS - Horizontal bars with positioned text
  // These create LCARS-style labels with opaque text backgrounds
  // that "break" colored horizontal bars.
  // =====================================
  // Base Bar Label - Foundation for all bar labels
  "bar-label-base": {
    extends: "button.base",
    description: 'Base bar label - filled button with text overlay that creates bar "break" effect',
    // Default height = one HA grid row.  Override height in your card config to get a taller/
    // shorter bar; font size auto-scales because text.default uses font_size_percent below.
    height: 56,
    // Filled background (uses normal button state colors) - no border
    // This is essentially a filled button with special text overlay
    card: {
      color: {
        background: {
          default: "theme:components.button.background.active",
          active: "theme:components.button.background.active",
          inactive: "theme:components.button.background.inactive",
          unavailable: "theme:components.button.background.unavailable"
        }
      }
    },
    // No border for filled style
    border: {
      width: 0,
      radius: 0
      // Square corners by default
    },
    // Text styling with opaque background for bar-break effect
    text: {
      default: {
        // font_size_percent: font fills 100 % of the card height (auto-scales when the user
        // overrides `height` in their card config).  Set an explicit `font_size` on a field
        // in your card's text config to override this behaviour for that field.
        font_size_percent: 100,
        font_weight: 100,
        // Thin weight for LCARS aesthetic
        text_transform: "uppercase",
        color: {
          default: "var(--lcards-yellow, #FFCC99)",
          // LCARS yellow for labels
          active: "var(--lcards-yellow, #FFCC99)",
          inactive: "var(--lcards-yellow, #FFCC99)",
          unavailable: "theme:colors.status.error"
        },
        // Opaque background creates the bar "break" effect
        background: { default: "black" },
        background_padding: 15,
        // Space between text and colored bars
        background_radius: 0,
        // Sharp corners for LCARS aesthetic
        // Explicit numeric value (not a token reference) so the cap-height block in
        // _processTextFields always receives a finite number regardless of token resolution.
        cap_height_ratio: 0.86,
        padding: {
          top: 0,
          bottom: 4,
          // Small breathing room so cap glyphs don't touch the zone edges
          left: 15,
          right: 15
        },
        position: "center"
        // Center text within button area
      },
      label: {
        show: true,
        position: "center",
        // Mirror key text.default values at the field level so they are available via the
        // presetFieldConfig waterfall branch in _resolveTextConfiguration, which has higher
        // priority than presetTextDefaults.  Without this, a user-supplied text.default that
        // omits padding/cap_height_ratio would silently drop the preset values.
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 0, left: 50, right: 50 }
      },
      state: {
        show: false,
        position: "center",
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 0, left: 50, right: 50 }
      },
      name: {
        show: false,
        position: "center",
        font_size_percent: 100,
        cap_height_ratio: 0.86,
        padding: { top: 0, bottom: 4, left: 50, right: 50 }
      }
    },
    // No icon by default for bar labels
    show_icon: false
  },
  // Bar Label Left - Text positioned on left side of bar
  "bar-label-left": {
    extends: "button.bar-label-base",
    description: "Bar label with left-aligned text",
    text: {
      default: {
        position: "center-left"
      },
      label: {
        show: true,
        position: "center-left"
      }
    }
  },
  // Bar Label Center - Text centered in bar
  "bar-label-center": {
    extends: "button.bar-label-base",
    description: "Bar label with centered text",
    text: {
      default: {
        position: "center"
      },
      label: {
        show: true,
        position: "center"
      }
    }
  },
  // Bar Label Right - Text positioned on right side of bar
  "bar-label-right": {
    extends: "button.bar-label-base",
    description: "Bar label with right-aligned text",
    text: {
      default: {
        position: "center-right"
      },
      label: {
        show: true,
        position: "center-right"
      }
    }
  },
  // Bar Label Square - Full-height bar with square corners
  "bar-label-square": {
    extends: "button.bar-label-base",
    description: "Bar label with square corners for large indicators",
    border: {
      radius: {
        top_left: 0,
        top_right: 0,
        bottom_left: 0,
        bottom_right: 0
      }
    },
    text: {
      default: {
        position: "center"
      }
    }
  },
  // Bar Label Lozenge - Full-height bar with rounded ends (pill shape)
  "bar-label-lozenge": {
    extends: "button.bar-label-base",
    description: "Bar label with rounded ends (pill shape)",
    border: {
      radius: {
        top_left: "theme:components.button.radius.full",
        top_right: "theme:components.button.radius.full",
        bottom_left: "theme:components.button.radius.full",
        bottom_right: "theme:components.button.radius.full"
      }
    },
    text: {
      default: {
        position: "center"
      },
      label: {
        show: true,
        position: "center"
      }
    }
  },
  // Bar Label Bullet Left - Half-lozenge with rounded right, flat left
  "bar-label-bullet-left": {
    extends: "button.bar-label-left",
    description: "Bar label with rounded right side, flat left (right-pointing)",
    border: {
      radius: {
        top_left: 0,
        top_right: "theme:components.button.radius.full",
        bottom_left: 0,
        bottom_right: "theme:components.button.radius.full"
      }
    },
    text: {
      default: {
        position: "center-right"
      },
      label: {
        show: true,
        position: "center-right"
      }
    }
  },
  // Bar Label Bullet Right - Half-lozenge with flat right, rounded left
  "bar-label-bullet-right": {
    extends: "button.bar-label-right",
    description: "Bar label with flat right side, rounded left (left-pointing)",
    icon_area: "right",
    border: {
      radius: {
        top_left: "theme:components.button.radius.full",
        top_right: 0,
        bottom_left: "theme:components.button.radius.full",
        bottom_right: 0
      }
    },
    text: {
      default: {
        position: "center-left"
      },
      label: {
        show: true,
        position: "center-left"
      }
    }
  },
  // Bar Label Capped Left - Half-lozenge with rounded left, flat right
  "bar-label-capped-left": {
    extends: "button.bar-label-left",
    description: "Bar label with rounded left side, flat right (left-pointing)",
    icon_area: "right",
    border: {
      radius: {
        top_left: "theme:components.button.radius.full",
        top_right: 0,
        bottom_left: "theme:components.button.radius.full",
        bottom_right: 0
      }
    },
    text: {
      default: {
        position: "center-left"
      },
      label: {
        show: true,
        position: "center-left"
      }
    }
  },
  // Bar Label Capped Right - Half-lozenge with rounded right, flat left
  "bar-label-capped-right": {
    extends: "button.bar-label-left",
    description: "Bar label with rounded right side, flat left (right-pointing)",
    border: {
      radius: {
        top_left: 0,
        top_right: "theme:components.button.radius.full",
        bottom_left: 0,
        bottom_right: "theme:components.button.radius.full"
      }
    },
    text: {
      default: {
        position: "center-right"
      },
      label: {
        show: true,
        position: "center-right"
      }
    }
  },
  "panel-light": {
    extends: "button.barrel",
    description: "non-interactive square-cornered panel with LCARS random label",
    text: {
      label: {
        show: true,
        position: "bottom-right"
      }
    },
    interactive: false,
    style: {
      card: {
        color: {
          background: {
            default: "var(--lcars-ui-primary)"
          }
        }
      }
    }
  },
  "panel-dark": {
    extends: "button.barrel",
    description: "non-interactive square-cornered panel with LCARS random label",
    text: {
      label: {
        show: true,
        position: "bottom-right"
      }
    },
    interactive: false,
    style: {
      card: {
        color: {
          background: {
            default: "var(--lcars-ui-quaternary)"
          }
        }
      }
    }
  }
};
const SLIDER_PRESETS = {
  // =====================================
  // BASE SLIDER - Foundation
  // =====================================
  base: {
    style: {
      track: {
        orientation: "horizontal",
        height: "theme:components.slider.track.height",
        background: "theme:components.slider.track.background",
        margin: "theme:components.slider.track.margin"
      },
      border: {
        left: {
          enabled: false,
          size: 0,
          color: {
            default: "theme:components.slider.border.color.default",
            active: "theme:components.slider.border.color.active",
            inactive: "theme:components.slider.border.color.inactive",
            unavailable: "theme:components.slider.border.color.unavailable",
            hover: "theme:components.slider.border.color.hover",
            pressed: "theme:components.slider.border.color.pressed"
          }
        },
        top: {
          enabled: false,
          size: 0,
          color: {
            default: "theme:components.slider.border.color.default",
            active: "theme:components.slider.border.color.active",
            inactive: "theme:components.slider.border.color.inactive",
            unavailable: "theme:components.slider.border.color.unavailable",
            hover: "theme:components.slider.border.color.hover",
            pressed: "theme:components.slider.border.color.pressed"
          }
        },
        right: {
          enabled: false,
          size: 0,
          color: {
            default: "theme:components.slider.border.color.default",
            active: "theme:components.slider.border.color.active",
            inactive: "theme:components.slider.border.color.inactive",
            unavailable: "theme:components.slider.border.color.unavailable",
            hover: "theme:components.slider.border.color.hover",
            pressed: "theme:components.slider.border.color.pressed"
          }
        },
        bottom: {
          enabled: false,
          size: 0,
          color: {
            default: "theme:components.slider.border.color.default",
            active: "theme:components.slider.border.color.active",
            inactive: "theme:components.slider.border.color.inactive",
            unavailable: "theme:components.slider.border.color.unavailable",
            hover: "theme:components.slider.border.color.hover",
            pressed: "theme:components.slider.border.color.pressed"
          }
        }
      },
      gauge: {
        scale: {
          tick_marks: {
            major: {
              color: {
                default: "theme:components.slider.gauge.tick.major.color.default",
                active: "theme:components.slider.gauge.tick.major.color.active",
                inactive: "theme:components.slider.gauge.tick.major.color.inactive",
                unavailable: "theme:components.slider.gauge.tick.major.color.unavailable"
              }
            },
            minor: {
              color: {
                default: "theme:components.slider.gauge.tick.minor.color.default",
                active: "theme:components.slider.gauge.tick.minor.color.active",
                inactive: "theme:components.slider.gauge.tick.minor.color.inactive",
                unavailable: "theme:components.slider.gauge.tick.minor.color.unavailable"
              }
            }
          },
          labels: {
            color: {
              default: "theme:components.slider.gauge.label.color.default",
              active: "theme:components.slider.gauge.label.color.active",
              inactive: "theme:components.slider.gauge.label.color.inactive",
              unavailable: "theme:components.slider.gauge.label.color.unavailable"
            }
          }
        }
      }
    },
    // end style
    text: {
      default: {
        font_family: "theme:typography.fontFamily.primary",
        font_size: "theme:typography.fontSize.base",
        text_transform: "uppercase",
        color: {
          default: "theme:components.button.text.color.active",
          active: "theme:components.button.text.color.active",
          inactive: "theme:components.button.text.color.inactive",
          unavailable: "theme:components.button.text.color.unavailable"
        }
      },
      name: {
        content: "[[[return entity ? entity.attributes.friendly_name : null]]]",
        show: false
      },
      state: {
        content: "[[[if (!entity) return null; if (entity.entity_id.split('.')[0] === 'light' && entity.attributes.brightness != null) return Math.round(entity.attributes.brightness / 2.55) + '%'; return entity.state;]]]",
        show: false
      }
    }
  },
  // =====================================
  // PILLS PRESET - Segmented slider
  // =====================================
  "pills-basic": {
    extends: "slider.base",
    description: "Segmented pill slider",
    compatibleComponents: ["default"],
    style: {
      track: {
        type: "pills",
        margin: { top: 5, left: 5, right: 0, bottom: 0 },
        segments: {
          enabled: true,
          gap: "theme:components.slider.pills.gap",
          size: { width: "theme:components.slider.pills.segment.width" },
          shape: { radius: "theme:components.slider.pills.radius" },
          gradient: {
            start: "theme:components.slider.pills.gradient.start",
            end: "theme:components.slider.pills.gradient.end"
          },
          appearance: {
            unfilled: { opacity: 0.2 },
            filled: { opacity: 1 }
          }
        }
      }
    }
  },
  // =====================================
  // PILLS PRESET - Pills with left border
  // =====================================
  "pills-left-border": {
    extends: "slider.pills-basic",
    description: "Left border with pills slider.",
    compatibleComponents: ["default"],
    style: {
      border: {
        top: { enabled: true, size: 10 },
        left: { enabled: true, size: 120 }
      }
    }
  },
  // =====================================
  // GAUGE PRESET - Ruler style
  // =====================================
  "gauge-basic": {
    extends: "slider.base",
    description: "Ruler-style gauge for displays and controls",
    compatibleComponents: ["default"],
    style: {
      track: {
        type: "gauge",
        margin: 0
      },
      gauge: {
        progress_bar: {
          color: {
            default: "theme:components.slider.gauge.progress_bar.color.default",
            active: "theme:components.slider.gauge.progress_bar.color.active",
            inactive: "theme:components.slider.gauge.progress_bar.color.inactive",
            unavailable: "theme:components.slider.gauge.progress_bar.color.unavailable"
          }
        }
      }
    }
  },
  // =====================================
  // GAUGE PRESET - Ruler style with left border
  // =====================================
  "gauge-left-border": {
    extends: "slider.gauge-basic",
    description: "Left border with gauge slider.",
    compatibleComponents: ["default"],
    style: {
      border: {
        top: { enabled: true, size: 10 },
        left: { enabled: true, size: 120 }
      },
      gauge: {
        // Horizontal gauge: offset.y = minorHeight(10) + top-border(10) = 20
        // so the marker tip aligns with the outer edge of the minor ticks.
        marker_indicator: {
          align: "start",
          offset: { y: 20 }
        }
      }
    }
  },
  // =====================================
  // PILLS PRESET - Pills with rounded corners (LCARS end-cap style)
  // =====================================
  "pills-left-border-rounded": {
    extends: "slider.pills-left-border",
    description: "Pills slider with left border and rounded free-end corners. The left (bordered) end stays flat; only the right end is rounded, classic LCARS end-cap look. Override style.border.radius for a different radius or per-corner control.",
    compatibleComponents: ["default"],
    style: {
      border: {
        radius: { top_left: 0, bottom_left: 0, top_right: 12, bottom_right: 12 }
      }
    }
  },
  // =====================================
  // GAUGE PRESET - Gauge with rounded corners (LCARS end-cap style)
  // =====================================
  "gauge-left-border-rounded": {
    extends: "slider.gauge-left-border",
    description: "Gauge slider with left border and rounded free-end corners. The left (bordered) end stays flat; only the right end is rounded. Override style.border.radius for a different radius or per-corner control.",
    compatibleComponents: ["default"],
    style: {
      border: {
        radius: { top_left: 0, bottom_left: 0, top_right: 12, bottom_right: 12 }
      }
    }
  },
  // =====================================
  // SHAPED PRESETS — Generic clip-path fill
  // =====================================
  //
  // Both presets default to shape type 'lozenge' but the user can override
  // style.shaped.type to any supported shape (rect, rounded, diamond, etc.).
  // component and text stay at the preset root — same as they'd appear in card YAML.
  /**
   * shaped-vertical: Vertical shaped slider.  Fill rises from the bottom.
   * Text: state value at top-center, entity name at bottom-center.
   */
  "shaped-vertical": {
    extends: "slider.base",
    description: "Vertical shaped slider with exterior text labels. Change style.shaped.type for different shapes (lozenge, rounded, diamond…).",
    compatibleComponents: ["shaped"],
    component: "shaped",
    style: {
      track: {
        type: "shaped",
        orientation: "vertical",
        invert_fill: false,
        margin: 0
      },
      shaped: {
        type: "lozenge",
        text_bands: {
          top: { size: 36 },
          bottom: { size: 36 },
          left: { size: 0 },
          right: { size: 0 }
        },
        fill: { color: "theme:components.slider.shaped.fill.color" },
        track: { background: "theme:alpha(colors.card.buttonOff, 0.2)" }
      }
    },
    text: {
      name: {
        zone: "bottom",
        position: "center",
        show: true,
        font_size: "theme:typography.fontSize.2xl",
        padding: 0,
        color: {
          default: "theme:colors.text.onDark",
          active: "theme:lighten(colors.text.onDark, 0.2)",
          inactive: "theme:darken(colors.text.onDark, 0.2)",
          unavailable: "theme:darken(colors.text.onDark, 0.3)"
        }
      },
      state: {
        zone: "top",
        position: "center",
        show: true,
        font_size: "theme:typography.fontSize.2xl",
        padding: 0,
        color: {
          default: "theme:colors.text.onDark",
          active: "theme:lighten(colors.text.onDark, 0.2)",
          inactive: "theme:darken(colors.text.onDark, 0.2)",
          unavailable: "theme:darken(colors.text.onDark, 0.3)"
        }
      }
    }
  },
  /**
   * shaped-horizontal: Horizontal shaped slider.  Fill grows from the left.
   * Text: entity name at center-left, state value at center-right.
   */
  "shaped-horizontal": {
    extends: "slider.base",
    description: "Horizontal shaped slider with exterior text labels. Change style.shaped.type for different shapes (lozenge, rounded, diamond…).",
    compatibleComponents: ["shaped"],
    component: "shaped",
    style: {
      track: {
        type: "shaped",
        orientation: "horizontal",
        invert_fill: false,
        margin: 0
      },
      shaped: {
        type: "lozenge",
        text_bands: {
          top: { size: 0 },
          bottom: { size: 0 },
          left: { size: 60 },
          right: { size: 60 }
        },
        fill: { color: "theme:components.slider.shaped.fill.color" },
        track: { background: "theme:alpha(colors.card.buttonOff, 0.2)" }
      }
    },
    text: {
      name: {
        zone: "left",
        position: "center",
        show: true,
        font_size: "theme:typography.fontSize.2xl",
        padding: 0,
        color: {
          default: "theme:colors.text.onDark",
          active: "theme:lighten(colors.text.onDark, 0.2)",
          inactive: "theme:darken(colors.text.onDark, 0.2)",
          unavailable: "theme:darken(colors.text.onDark, 0.3)"
        }
      },
      state: {
        zone: "right",
        position: "center",
        show: true,
        font_size: "theme:typography.fontSize.2xl",
        padding: 0,
        color: {
          default: "theme:colors.text.onDark",
          active: "theme:lighten(colors.text.onDark, 0.2)",
          inactive: "theme:darken(colors.text.onDark, 0.2)",
          unavailable: "theme:darken(colors.text.onDark, 0.3)"
        }
      }
    }
  },
  // =====================================
  // PICARD PRESET - Picard-style vertical slider
  // =====================================
  "picard-gauge-vertical": {
    extends: "slider.gauge-basic",
    description: "Picard-style vertical slider",
    compatibleComponents: ["picard"],
    style: {
      track: {
        orientation: "vertical",
        invert_fill: false
      },
      gauge: {
        indicator: {
          enabled: true,
          size: { height: 20, width: 52 },
          type: "round",
          border: { enabled: true }
        },
        // Default shape for value-marker indicators on the Picard component.
        // align: 'start' pins the marker to the left edge of the track zone (where ticks live).
        // offset.x = minorHeight + trimWidth (10 + 10 = 20px): shifts the triangle centre
        // rightward so the tip lands at the outer edge of the minor ticks. Scale-independent.
        marker_indicator: {
          type: "triangle",
          size: { width: 20, height: 20 },
          rotation: 180,
          align: "start",
          border: { enabled: true },
          offset: { x: 20 }
        }
      }
    }
  }
};
const dpadSvg = `<?xml version="1.0" encoding="UTF-8"?>
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
</svg>`;
const dpadComponents = {
  "dpad": {
    // Inline SVG content (migrated from shapes registry)
    svg: dpadSvg,
    // Orientation (locked for d-pad due to directional nature)
    orientation: "square",
    // Features supported by this component
    features: ["multi-segment", "state-based-styling", "zones", "text-overlay"],
    // -----------------------------------------------------------------------
    // zones — named map of rectangular regions in viewBox coordinate space
    // (viewBox: 0 0 80 80).
    //
    // Directional arrow zones match the tight bounding boxes of each arrow
    // path.  These are narrow strips (~9–12 viewBox units on one axis); use
    // font_size_percent to size text relative to zone height/width.
    //
    // The center zone covers the inner intersection square of the cross/plus
    // shape (x 33–47, y 33–47).
    //
    // The cross arms have outer edges at x=10/70 and y=10/70.
    // Corner zones fill the four diagonal quadrants snapped to those edges:
    //   x: 10→33 (left corners) or 47→70 (right corners)
    //   y: 10→33 (top corners)  or 47→70 (bottom corners)
    // Center zone spans the full interior between all four arms (10→70 × 10→70).
    // -----------------------------------------------------------------------
    zones: {
      // Directional arrows
      up: { x: 34, y: 0.5, width: 12, height: 9.5 },
      down: { x: 34, y: 70, width: 12, height: 9.5 },
      left: { x: 0.5, y: 34, width: 9.5, height: 12 },
      right: { x: 70, y: 34, width: 9.5, height: 12 },
      // Center — full interior between all four directional arms
      center: { x: 10, y: 10, width: 60, height: 60 },
      // Diagonal corner sections — outer edges at card boundary (0/80), inner edges at cross arm (33/47)
      up_left: { x: 0, y: 0, width: 33, height: 33 },
      up_right: { x: 47, y: 0, width: 33, height: 33 },
      down_left: { x: 0, y: 47, width: 33, height: 33 },
      down_right: { x: 47, y: 47, width: 33, height: 33 }
    },
    // Default segment configurations with theme token references
    segments: {
      // Directional arrows
      up: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      down: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      left: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      right: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      // Diagonal corners
      "up-left": {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      "up-right": {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      "down-left": {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      "down-right": {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      // Center button
      center: {
        style: {
          fill: "theme:components.dpad.segment.center.fill",
          stroke: "theme:components.dpad.segment.center.stroke",
          "stroke-width": "theme:components.dpad.segment.center.stroke-width"
        }
      }
    },
    // Preset support (backward-compatible stub so validatePreset / getPresetNames
    // are available on all components without special-casing in the button card)
    presets: { default: {} },
    /*
            presets: {
                default: {
                    segments: {
                        default: {
                            animations: [
                                {
                                    trigger: 'on_load',
                                    preset: 'draw',
                                    params: {
                                        duration: 2500,
                                        ease: 'inOutQuad',
                                        loop: false,
                                        alternate: true,
                                        max_scale: 1.15,
                                        max_brightness: 1.4
                                    }
                                }
                            ]
                        }
                    }
    
                }
            },*/
    validatePreset(presetName) {
      return presetName in this.presets;
    },
    getPresetNames() {
      return Object.keys(this.presets);
    },
    // Metadata for discovery and documentation
    metadata: {
      type: "dpad",
      // Explicit type for ComponentManager
      card_type: "button",
      // Which card editor this component is valid for
      pack: "lcards_buttons",
      id: "dpad",
      name: "D-Pad Control",
      description: "Interactive directional control with 9 segments",
      version: "1.0.0",
      // Example usage documentation
      examples: {
        basic: {
          description: "Basic media player control",
          config: {
            component: "dpad",
            entity: "media_player.living_room",
            dpad: {
              segments: {
                up: { tap_action: { action: "call-service", service: "media_player.volume_up" } },
                down: { tap_action: { action: "call-service", service: "media_player.volume_down" } },
                left: { tap_action: { action: "call-service", service: "media_player.media_previous_track" } },
                right: { tap_action: { action: "call-service", service: "media_player.media_next_track" } },
                center: { tap_action: { action: "call-service", service: "media_player.media_play_pause" } }
              }
            }
          }
        },
        advanced: {
          description: "Remote control with full directional navigation",
          config: {
            component: "dpad",
            entity: "remote.roku",
            dpad: {
              segments: {
                up: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "up" } } },
                down: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "down" } } },
                left: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "left" } } },
                right: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "right" } } },
                center: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "select" } } },
                "up-left": { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "home" } } },
                "up-right": { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "back" } } }
              }
            }
          }
        }
      }
    }
  }
};
const dpadVoyagerSvg = `<?xml version="1.0" encoding="UTF-8"?>
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
</svg>`;
const dpadVoyagerComponents = {
  "dpad_voyager": {
    // Inline SVG content
    svg: dpadVoyagerSvg,
    // Orientation (locked for d-pad due to directional nature)
    orientation: "square",
    // Features supported by this component
    features: ["multi-segment", "state-based-styling", "zones", "text-overlay"],
    // -----------------------------------------------------------------------
    // zones — named map of rectangular regions in viewBox coordinate space
    // (viewBox: 0 0 209.47815 215.10629). Coordinates were derived directly
    // from the bounding boxes of the restructured button paths below — one
    // zone per real segment, see the naming scheme documented above.
    // -----------------------------------------------------------------------
    zones: {
      up_left: { x: 52.4, y: 73.4, width: 40.3, height: 40.3 },
      up_right: { x: 112.7, y: 73.4, width: 40.3, height: 40.3 },
      down_left: { x: 52.4, y: 133.7, width: 40.3, height: 40.3 },
      down_right: { x: 112.7, y: 133.7, width: 40.3, height: 40.3 },
      center: { x: 95.8, y: 116.9, width: 14, height: 14 },
      up_inner: { x: 95.8, y: 107.7, width: 13.7, height: 6 },
      up_shaft: { x: 95.8, y: 98, width: 13.7, height: 8 },
      up_seam: { x: 95.8, y: 91.7, width: 14, height: 4.6 },
      up_arrow: { x: 97.2, y: 84.2, width: 11, height: 5.8 },
      up_outer: { x: 95.8, y: 72.5, width: 14, height: 10.1 },
      up_ring: { x: 92.1, y: 47.1, width: 21.2, height: 22.7 },
      down_shaft: { x: 95.8, y: 133.7, width: 13.7, height: 22 },
      down_arrow: { x: 97.2, y: 157.7, width: 11, height: 5.7 },
      down_outer: { x: 95.8, y: 165.1, width: 14, height: 9.9 },
      down_ring: { x: 92.2, y: 177.8, width: 21, height: 22.4 },
      left_shaft: { x: 70.7, y: 116.9, width: 22, height: 13.7 },
      left_arrow: { x: 62.9, y: 118.5, width: 6.1, height: 10.6 },
      left_outer: { x: 51.4, y: 116.9, width: 9.8, height: 14 },
      left_ring: { x: 26.1, y: 113.2, width: 22.5, height: 21.1 },
      right_shaft: { x: 112.7, y: 116.9, width: 22, height: 13.7 },
      right_arrow: { x: 136.4, y: 118.2, width: 6, height: 10.9 },
      right_outer: { x: 144.1, y: 116.9, width: 9.8, height: 14 },
      right_ring: { x: 156.7, y: 113.4, width: 22.7, height: 20.9 },
      ring_down: { x: 90.1, y: 202.5, width: 24.9, height: 12.6 },
      ring_downright: { x: 153.5, y: 189.1, width: 25.5, height: 24 },
      ring_left_1: { x: 27.2, y: 90.3, width: 26.3, height: 23.4 },
      ring_left_2: { x: 11.3, y: 110.8, width: 12.6, height: 26 },
      ring_left_3: { x: 12.4, y: 84, width: 18.3, height: 26 },
      ring_right_1: { x: 151.9, y: 90.2, width: 26.4, height: 23.5 },
      ring_right_2: { x: 181.5, y: 111.4, width: 13.2, height: 25.1 },
      ring_right_3: { x: 174.4, y: 76, width: 35.1, height: 33.9 },
      ring_right_4: { x: 197.2, y: 110.9, width: 12.3, height: 26.3 },
      ring_up_1: { x: 69.3, y: 48.3, width: 23.4, height: 26.3 },
      ring_up_2: { x: 112.6, y: 48.3, width: 23.7, height: 26.2 },
      ring_up_3: { x: 62.4, y: 33.5, width: 26.3, height: 18.5 },
      ring_up_4: { x: 116.5, y: 33.4, width: 26.4, height: 18.6 },
      ring_up_5: { x: 87.5, y: 20.3, width: 29.7, height: 24.6 },
      ring_upleft_1: { x: 49.5, y: 56, width: 27.2, height: 28.3 },
      ring_upleft_2: { x: 21.8, y: 60.3, width: 23.5, height: 26 },
      ring_upright_1: { x: 142.3, y: 70.8, width: 28.1, height: 26.9 },
      ring_upright_2: { x: 128.7, y: 56, width: 27, height: 28 },
      ring_upright_3: { x: 140.1, y: 42.9, width: 26.1, height: 23.4 },
      ring_upright_4: { x: 160.1, y: 48.5, width: 38.5, height: 37.8 },
      top_bar_1: { x: 0, y: 20.3, width: 65, height: 46 },
      top_bar_2: { x: 0.1, y: 0.3, width: 47.4, height: 16 },
      top_bar_3: { x: 60.3, y: 0, width: 24.6, height: 16.3 },
      top_bar_4: { x: 87, y: 0.3, width: 30, height: 16 },
      top_bar_5: { x: 118.9, y: 0.3, width: 24.3, height: 16 },
      top_bar_6: { x: 146.6, y: 0.3, width: 44.3, height: 16.3 },
      top_bar_7: { x: 146.7, y: 23.8, width: 44.5, height: 16.3 },
      accent_1: { x: 5.3, y: 133.8, width: 48.3, height: 37.9 },
      accent_2: { x: 5.3, y: 150.1, width: 71.3, height: 65 },
      accent_3: { x: 57.8, y: 172.9, width: 34.9, height: 42.2 },
      accent_4: { x: 160.9, y: 198.5, width: 48.6, height: 16.6 },
      accent_5: { x: 112.6, y: 133.7, width: 65.5, height: 65.7 },
      accent_6: { x: 116.6, y: 137.7, width: 76.3, height: 76.2 }
    },
    // Default segment configurations with theme token references.
    // Directional arm pieces + diagonals + center reuse the same tokens as
    // the base `dpad` component; every other segment (the ring band, top
    // bar, and bottom accent cluster) uses the subdued `ring` token family
    // so the primary 9-zone controls still read as the main interactive
    // elements.
    segments: {
      up_left: {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      up_right: {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      down_left: {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      down_right: {
        style: {
          fill: "theme:components.dpad.segment.diagonal.fill",
          stroke: "theme:components.dpad.segment.diagonal.stroke",
          "stroke-width": "theme:components.dpad.segment.diagonal.stroke-width"
        }
      },
      center: {
        style: {
          fill: "theme:components.dpad.segment.center.fill",
          stroke: "theme:components.dpad.segment.center.stroke",
          "stroke-width": "theme:components.dpad.segment.center.stroke-width"
        }
      },
      up_inner: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      up_shaft: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      up_seam: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      up_arrow: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      up_outer: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      up_ring: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      down_shaft: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      down_arrow: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      down_outer: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      down_ring: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      left_shaft: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      left_arrow: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      left_outer: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      left_ring: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      right_shaft: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      right_arrow: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      right_outer: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      right_ring: {
        style: {
          fill: "theme:components.dpad.segment.directional.fill",
          stroke: "theme:components.dpad.segment.directional.stroke",
          "stroke-width": "theme:components.dpad.segment.directional.stroke-width"
        }
      },
      ring_down: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_downright: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_left_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_left_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_left_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_right_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_right_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_right_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_right_4: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_up_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_up_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_up_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_up_4: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_up_5: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upleft_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upleft_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upright_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upright_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upright_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      ring_upright_4: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_4: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_5: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_6: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      top_bar_7: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_1: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_2: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_3: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_4: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_5: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      },
      accent_6: {
        style: {
          fill: "theme:components.dpad.segment.ring.fill",
          stroke: "theme:components.dpad.segment.ring.stroke",
          "stroke-width": "theme:components.dpad.segment.ring.stroke-width"
        }
      }
    },
    // Preset support (backward-compatible stub so validatePreset / getPresetNames
    // are available on all components without special-casing in the button card)
    presets: { default: {} },
    validatePreset(presetName) {
      return presetName in this.presets;
    },
    getPresetNames() {
      return Object.keys(this.presets);
    },
    // Metadata for discovery and documentation
    metadata: {
      type: "dpad_voyager",
      // Explicit type for ComponentManager
      card_type: "button",
      // Which card editor this component is valid for
      pack: "lcards_buttons",
      id: "dpad_voyager",
      name: "D-Pad Control (Voyager)",
      description: "Interactive 56-segment directional control styled after Voyager-era LCARS consoles",
      version: "1.0.0",
      // Example usage documentation
      examples: {
        basic: {
          description: "Basic media player control using the primary directional segments",
          config: {
            component: "dpad_voyager",
            entity: "media_player.living_room",
            dpad_voyager: {
              segments: {
                up_arrow: { tap_action: { action: "call-service", service: "media_player.volume_up" } },
                down_arrow: { tap_action: { action: "call-service", service: "media_player.volume_down" } },
                left_arrow: { tap_action: { action: "call-service", service: "media_player.media_previous_track" } },
                right_arrow: { tap_action: { action: "call-service", service: "media_player.media_next_track" } },
                center: { tap_action: { action: "call-service", service: "media_player.media_play_pause" } }
              }
            }
          }
        },
        advanced: {
          description: "Remote control with full directional navigation and diagonal shortcuts",
          config: {
            component: "dpad_voyager",
            entity: "remote.roku",
            dpad_voyager: {
              segments: {
                up_arrow: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "up" } } },
                down_arrow: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "down" } } },
                left_arrow: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "left" } } },
                right_arrow: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "right" } } },
                center: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "select" } } },
                up_left: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "home" } } },
                up_right: { tap_action: { action: "call-service", service: "remote.send_command", data: { command: "back" } } }
              }
            }
          }
        }
      }
    }
  }
};
function calculateZones$3(width, height) {
  const sharedBounds = {
    x: 0,
    y: 0,
    width,
    height
  };
  return {
    progress: { ...sharedBounds },
    control: { ...sharedBounds },
    range: { ...sharedBounds },
    track: { ...sharedBounds },
    // Internal SVG structure zone — used by the render() template, not exposed as a user zone.
    // The slider card filters this out of this._zones in _calculateZones().
    text: {
      x: 5,
      y: 5,
      width: width - 10,
      height: Math.min(30, height / 2)
    }
  };
}
function render$3(context) {
  const { width, height, colors, zones: contextZones } = context;
  const zones = contextZones || calculateZones$3(width, height);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- Background (transparent by default, can be styled via config) -->
  <rect width="${width}" height="${height}" fill="transparent"></rect>

  <!-- Range indicators zone (overlapping with track) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
  </g>

  <!-- Progress bar background zone — rendered before track so ticks paint over the fill -->
  <g id="progress-zone-bg" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Track zone (gauge or pills) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Progress bar foreground zone — rendered after track so value indicator overlays tick marks -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Control overlay zone (overlapping with progress/track for interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
    `.trim();
}
function getMetadata$1() {
  return {
    type: "slider",
    pack: "lcards_sliders",
    id: "default",
    name: "Default",
    description: "Simple rectangular slider with state-aware colours and overlapping zones",
    orientation: "auto",
    // Adapts to style.track.orientation
    supportsOrientation: ["horizontal", "vertical"],
    defaultOrientation: "horizontal",
    features: [
      "state-colors",
      "progress-bar",
      "gauge",
      "pills",
      "ranges",
      "text-fields"
    ],
    configSchema: {
      style: {
        border: {
          color: {
            description: "Border colour (state-aware: object with state keys or single colour)",
            type: ["string", "object"]
          },
          width: {
            description: "Border width in pixels",
            type: "number",
            default: 2
          },
          radius: {
            description: "Corner radius: uniform number (e.g. 12) or per-corner object { top_left, top_right, bottom_right, bottom_left }. LCARS tip: set left corners to 0 and right corners to 12 for end-cap rounding on a left-bordered slider.",
            type: ["number", "object"],
            default: 0
          }
        },
        background: {
          color: {
            description: "Background colour (state-aware: object with state keys or single colour)",
            type: ["string", "object"]
          }
        }
      }
    }
  };
}
const defaultComponent = {
  calculateZones: calculateZones$3,
  render: render$3,
  metadata: getMetadata$1()
};
function calculateZones$2(width, height) {
  const scaleX = width / 365;
  const scaleY = height / 601;
  return {
    progress: {
      x: 100 * scaleX,
      y: 72 * scaleY,
      width: 19 * scaleX,
      height: 441 * scaleY
    },
    control: {
      x: 100 * scaleX,
      y: 72 * scaleY,
      width: 19 * scaleX,
      height: 441 * scaleY
    },
    range: {
      x: 148 * scaleX,
      y: 84 * scaleY,
      width: 18 * scaleX,
      // Wider to better display ranges (was 16)
      height: 418 * scaleY
    },
    solidBar: {
      x: 183 * scaleX,
      y: 72 * scaleY,
      width: 16 * scaleX,
      height: 441 * scaleY
    },
    track: {
      x: 199 * scaleX,
      y: 72 * scaleY,
      width: 120 * scaleX,
      height: 441 * scaleY
    },
    text: {
      x: 0 * scaleX,
      // After left border decorations with padding
      y: 16 * scaleY,
      // After top horizontal arm (arm thickness = 16)
      width: 365 * scaleX,
      // Usable width (365 - 20 left - 20 right padding)
      height: 552 * scaleY
      // To y:522 (before bottom vertical arm starts)
    }
  };
}
function renderRangeSegments(zoneSpec, colors, style, config) {
  const ranges = style?.ranges || [];
  if (ranges.length === 0) return "";
  const displayMin = config.min ?? 0;
  const displayMax = config.max ?? 100;
  const displayRange = displayMax - displayMin;
  const borderColor = colors?.rangeBorder || style?.range?.border?.color || "black";
  const borderGap = style?.range?.border?.gap ?? 2;
  const height = zoneSpec.height;
  const width = zoneSpec.width;
  let svg = "";
  ranges.forEach((range, index) => {
    const rangeMin = range.min ?? displayMin;
    const rangeMax = range.max ?? displayMax;
    const rangeColor = range.color || "var(--lcards-gray-medium, #cccccc)";
    const startPercent = (rangeMin - displayMin) / displayRange;
    const endPercent = (rangeMax - displayMin) / displayRange;
    const sizePercent = endPercent - startPercent;
    const isFirstRange = index === 0;
    const isLastRange = index === ranges.length - 1;
    const rangeHeight = height * sizePercent;
    const rangeY = height * (1 - endPercent);
    svg += `<rect x="${-borderGap}" y="${rangeY}" width="${width + borderGap}" height="${rangeHeight}" fill="${borderColor}" />`;
    const topInset = isFirstRange ? borderGap : 0;
    const bottomInset = isLastRange ? borderGap : 0;
    const innerWidth = width - borderGap;
    const innerHeight = Math.max(1, rangeHeight - topInset - bottomInset);
    svg += `<rect x="${-borderGap}" y="${rangeY + topInset}" width="${innerWidth}" height="${innerHeight}" fill="${rangeColor}" />`;
  });
  return svg;
}
function render$2(context) {
  const { width, height, colors, config, style, zones: contextZones } = context;
  const zones = contextZones || calculateZones$2(width, height);
  const sx = width / 365;
  const sy = height / 601;
  const showAnimation = config.show_animation !== false;
  const animationSpeed = config.animation_speed || 2;
  const hasRanges = style?.ranges && style.ranges.length > 0;
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background (transparent) -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Top-left border ] shape (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,0 L${175 * sx},0 L${175 * sx},${64 * sy} L${145 * sx},${64 * sy} L${145 * sx},${16 * sy} L0,${16 * sy} Z" />

  <!-- Top-right border [ shape (gray) -->
  <path fill="${colors.borderBottom}" d="M${183 * sx},0 L${width},0 L${width},${16 * sy} L${199 * sx},${16 * sy} L${199 * sx},${64 * sy} L${183 * sx},${64 * sy} Z" />

  <!-- Bottom-left border ] shape (state-aware: blue when active) -->
  <path fill="${colors.borderTop}" d="M0,${570 * sy} L${145 * sx},${570 * sy} L${145 * sx},${522 * sy} L${175 * sx},${522 * sy} L${175 * sx},${height} L0,${height} Z" />

  <!-- Bottom-right border [ shape (gray) -->
  <path fill="${colors.borderBottom}" d="M${183 * sx},${522 * sy} L${199 * sx},${522 * sy} L${199 * sx},${570 * sy} L${width},${570 * sy} L${width},${height} L${183 * sx},${height} Z" />

  <!-- Range zone: solid bar when no ranges, notched frame when ranges exist -->
  ${hasRanges ? `
  <!-- Range area border frame (notched, customizable color) -->
  <path fill="${colors.rangeFrame}" d="M${145 * sx},${72 * sy} L${175 * sx},${72 * sy} L${175 * sx},${514 * sy} L${145 * sx},${514 * sy} L${145 * sx},${509 * sy} L${170 * sx},${509 * sy} L${170 * sx},${77 * sy} L${145 * sx},${77 * sy} Z" />
  ` : `
  <!-- Solid range bar (no ranges defined) - fills the frame area -->
  <rect x="${145 * sx}" y="${72 * sy}" width="${30 * sx}" height="${442 * sy}" fill="${colors.rangeFrame}" />
  `}

  <!-- Solid vertical bar (connector between range and track) -->
  <rect x="${zones.solidBar.x}" y="${zones.solidBar.y}" width="${zones.solidBar.width}" height="${zones.solidBar.height}" fill="${colors.solidBar}" />

  <!-- Animation indicators (3 squares with staggered timing) -->
  ${showAnimation ? `
  <rect x="${2 * sx}" y="${28 * sy}" width="${26 * sx}" height="${24 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" repeatCount="indefinite" />
  </rect>
  <rect x="${38 * sx}" y="${28 * sy}" width="${26 * sx}" height="${24 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" begin="${animationSpeed / 3}s" repeatCount="indefinite" />
  </rect>
  <rect x="${74 * sx}" y="${28 * sy}" width="${26 * sx}" height="${24 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" begin="${animationSpeed * 2 / 3}s" repeatCount="indefinite" />
  </rect>
  ` : ""}

  <!-- Range indicators zone (render first so progress thumb appears on top) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
    ${hasRanges ? renderRangeSegments(zones.range, colors, style, config) : ""}
  </g>

  <!-- Progress bar zone (leftmost, renders after ranges for proper z-order) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Control overlay zone (overlaps progress bar for slider interaction) -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Track zone (pills or gauge - rightmost) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Text zone -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
  `.trim();
}
const metadata$2 = {
  type: "slider",
  pack: "lcards_sliders",
  name: "picard",
  displayName: "Picard",
  orientation: "vertical",
  features: [
    "state-aware-borders",
    "animated-indicator",
    "progress-bar",
    "range-indicators",
    "decorative-frame"
  ],
  defaultSize: {
    width: 365,
    height: 601
  },
  configurableOptions: [
    {
      key: "show_animation",
      type: "boolean",
      default: true,
      description: "Show pulsing animation indicators in top-left",
      "x-ui-hints": {
        label: "Show Animation",
        helper: "Show 3 pulsing animation indicators in top-left (default: true)",
        selector: { boolean: {} }
      }
    },
    {
      key: "animation_speed",
      type: "number",
      default: 2,
      description: "Animation pulse speed in seconds",
      "x-ui-hints": {
        label: "Animation Speed",
        helper: "Animation pulse speed in seconds (default: 2)",
        selector: {
          number: {
            mode: "box",
            step: 0.1,
            min: 0.1,
            max: 10
          }
        }
      }
    }
  ],
  description: "Star Trek LCARS-inspired vertical slider with state-aware borders and animated indicator"
};
const picardComponent = {
  render: render$2,
  calculateZones: calculateZones$2,
  metadata: metadata$2
};
function calculateZones$1(width, height) {
  const scaleX = width / 400;
  const scaleY = height / 600;
  return {
    // REQUIRED: Track zone - Where pills/gauge are rendered
    track: {
      x: 200 * scaleX,
      // Right side of component
      y: 80 * scaleY,
      // Top margin
      width: 160 * scaleX,
      // Main content area
      height: 440 * scaleY
      // Full height minus margins
    },
    // REQUIRED: Control zone - Mouse/touch interaction overlay
    // Usually overlaps track or progress bar for user input
    control: {
      x: 80 * scaleX,
      // Overlaps progress bar
      y: 80 * scaleY,
      width: 40 * scaleX,
      // Thin vertical strip
      height: 440 * scaleY
    },
    // OPTIONAL: Progress bar zone - Dedicated progress bar area
    // Used in gauge mode when component has separate progress visualization
    progress: {
      x: 80 * scaleX,
      // Left side, separate from track
      y: 80 * scaleY,
      width: 40 * scaleX,
      height: 440 * scaleY
    },
    // OPTIONAL: Range indicator zone - Colored range backgrounds
    // Card injects range segments based on style.ranges config
    range: {
      x: 140 * scaleX,
      // Between progress and track
      y: 80 * scaleY,
      width: 40 * scaleX,
      height: 440 * scaleY
    },
    // REQUIRED: Text zone - Text field container
    // Card injects text elements based on text config
    text: {
      x: 0 * scaleX,
      y: 0 * scaleY,
      width: 80 * scaleX,
      // Left border area
      height: 600 * scaleY
    },
    // OPTIONAL: Border zone - If component uses card's border system
    // Usually not needed if component has custom borders
    border: {
      x: 0,
      y: 0,
      width,
      height
    }
  };
}
function render$1(context) {
  const { width, height, colors, config, style, state, zones: contextZones } = context;
  const zones = contextZones || calculateZones$1(width, height);
  const showDecorations = config.show_decorations !== false;
  const showAnimation = config.show_animation !== false;
  const showGrid = config.show_grid !== false;
  const decorationSize = config.decoration_size || 10;
  const animationSpeed = config.animation_speed || 2;
  const borderThickness = config.border_thickness || 5;
  const decorationColor = config.decoration_color || colors.animationIndicator;
  style?.border?.radius ?? 0;
  style?.range?.show_labels !== false;
  state?.entity?.state === "on";
  state?.value ?? 50;
  const sx = width / 400;
  const sy = height / 600;
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- ============================================================ -->
  <!-- DECORATIVE ELEMENTS (User-configurable) -->
  <!-- ============================================================ -->

  ${showDecorations ? `
  <!-- Top border decoration (state-aware color) -->
  <rect x="0" y="0" width="${width}" height="${borderThickness * sy}" fill="${colors.borderTop}" />

  <!-- Bottom border decoration -->
  <rect x="0" y="${height - borderThickness * sy}" width="${width}" height="${borderThickness * sy}" fill="${colors.borderBottom}" />

  <!-- Left decorative panel -->
  <rect x="0" y="${20 * sy}" width="${60 * sx}" height="${560 * sy}" fill="${colors.borderTop}" opacity="0.3" />

  <!-- Corner decorations -->
  <circle cx="${20 * sx}" cy="${30 * sy}" r="${decorationSize * sx}" fill="${decorationColor}" />
  <circle cx="${20 * sx}" cy="${570 * sy}" r="${decorationSize * sx}" fill="${decorationColor}" />
  ` : ""}

  ${showGrid ? `
  <!-- Grid lines (helpful for layout visualization) -->
  <line x1="0" y1="${height / 3}" x2="${width}" y2="${height / 3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="0" y1="${height * 2 / 3}" x2="${width}" y2="${height * 2 / 3}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width / 4}" y1="0" x2="${width / 4}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  <line x1="${width * 3 / 4}" y1="0" x2="${width * 3 / 4}" y2="${height}" stroke="#ffffff" stroke-width="0.5" opacity="0.2" />
  ` : ""}

  <!-- ============================================================ -->
  <!-- ANIMATION EXAMPLE (User-configurable speed) -->
  <!-- ============================================================ -->

  ${showAnimation ? `
  <!-- Pulsing indicator -->
  <rect x="${10 * sx}" y="${40 * sy}" width="${20 * sx}" height="${20 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="opacity" values="1;0.3;1" dur="${animationSpeed}s" repeatCount="indefinite" />
  </rect>

  <!-- Scrolling indicator -->
  <rect x="${10 * sx}" y="${70 * sy}" width="${20 * sx}" height="${5 * sy}" fill="${colors.animationIndicator}">
    <animate attributeName="y" values="${70 * sy};${100 * sy};${70 * sy}" dur="${animationSpeed * 1.5}s" repeatCount="indefinite" />
  </rect>
  ` : ""}

  <!-- ============================================================ -->
  <!-- ZONE MARKERS (Visual guides - remove in production) -->
  <!-- These show zone boundaries for development/testing -->
  <!-- ============================================================ -->

  ${config.show_zone_markers ? `
  <!-- Track zone marker -->
  <rect x="${zones.track.x}" y="${zones.track.y}"
        width="${zones.track.width}" height="${zones.track.height}"
        fill="none" stroke="#ff0000" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.track.x + 5}" y="${zones.track.y + 15}" font-size="12" fill="#ff0000">track</text>

  <!-- Progress zone marker -->
  <rect x="${zones.progress.x}" y="${zones.progress.y}"
        width="${zones.progress.width}" height="${zones.progress.height}"
        fill="none" stroke="#00ff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.progress.x + 5}" y="${zones.progress.y + 15}" font-size="12" fill="#00ff00">progress</text>

  <!-- Range zone marker -->
  <rect x="${zones.range.x}" y="${zones.range.y}"
        width="${zones.range.width}" height="${zones.range.height}"
        fill="none" stroke="#0000ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.range.x + 5}" y="${zones.range.y + 15}" font-size="12" fill="#0000ff">range</text>

  <!-- Control zone marker -->
  <rect x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="#ffff00" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.control.x + 5}" y="${zones.control.y + 15}" font-size="12" fill="#ffff00">control</text>

  <!-- Text zone marker -->
  <rect x="${zones.text.x}" y="${zones.text.y}"
        width="${zones.text.width}" height="${zones.text.height}"
        fill="none" stroke="#ff00ff" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
  <text x="${zones.text.x + 5}" y="${zones.text.y + 15}" font-size="12" fill="#ff00ff">text</text>
  ` : ""}

  <!-- ============================================================ -->
  <!-- REQUIRED ZONES -->
  <!-- These MUST be present for card to inject content -->
  <!-- ============================================================ -->

  <!-- Progress bar zone (OPTIONAL but common in gauge mode) -->
  <g id="progress-zone" data-zone="progress"
     transform="translate(${zones.progress.x}, ${zones.progress.y})"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
    <!-- Card injects progress bar rect here -->
  </g>

  <!-- Range indicator zone (OPTIONAL - for colored range backgrounds) -->
  <g id="range-zone" data-zone="range"
     transform="translate(${zones.range.x}, ${zones.range.y})"
     data-bounds="${zones.range.x},${zones.range.y},${zones.range.width},${zones.range.height}">
    <!-- Card injects range segment rects here -->
  </g>

  <!-- Control overlay zone (REQUIRED - must have pointer-events="all") -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Track zone (REQUIRED - pills or gauge rendered here) -->
  <g id="track-zone" data-zone="track"
     transform="translate(${zones.track.x}, ${zones.track.y})"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
    <!-- Card injects pills or gauge SVG here -->
  </g>

  <!-- Text zone (REQUIRED - text fields rendered here) -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
    <!-- Card injects text elements here -->
  </g>

  <!-- Border zone (OPTIONAL - only if using card's border system) -->
  <g id="border-zone" data-zone="border">
    <!-- Card injects border rects here if style.border configured -->
  </g>
</svg>
    `.trim();
}
const metadata$1 = {
  // ================================================================
  // REQUIRED METADATA
  // ================================================================
  type: "slider",
  // Component type (always 'slider')
  pack: "lcards_sliders",
  // Pack this component belongs to
  name: "demo",
  // Unique identifier (kebab-case)
  displayName: "Demo Component",
  // Human-readable name for UI
  // ================================================================
  // ORIENTATION
  // ================================================================
  orientation: "auto",
  // 'vertical', 'horizontal', or 'auto'
  // 'auto' adapts to style.track.orientation config
  // ================================================================
  // FEATURE FLAGS
  // Optional tags for documentation and filtering
  // ================================================================
  features: [
    "state-aware-borders",
    // Borders change color based on entity state
    "animated-indicator",
    // Includes animation elements
    "progress-bar",
    // Has dedicated progress bar zone
    "range-indicators",
    // Has dedicated range indicator zone
    "decorative-elements",
    // Has decorative visual elements
    "zone-markers"
    // Can show zone boundaries for debugging
  ],
  // ================================================================
  // DEFAULT SIZE
  // Used when card is first added to dashboard
  // ================================================================
  defaultSize: {
    width: 400,
    height: 600
  },
  // ================================================================
  // CONFIGURABLE OPTIONS
  // User-facing configuration exposed in visual editor
  // All types and selectors demonstrated
  // ================================================================
  configurableOptions: [
    // ============================================================
    // BOOLEAN OPTIONS
    // ============================================================
    {
      key: "show_decorations",
      type: "boolean",
      default: true,
      description: "Show decorative border elements",
      "x-ui-hints": {
        label: "Show Decorations",
        helper: "Display decorative visual elements (default: true)",
        selector: { boolean: {} }
      }
    },
    {
      key: "show_animation",
      type: "boolean",
      default: true,
      description: "Show animated indicators",
      "x-ui-hints": {
        label: "Show Animation",
        helper: "Enable pulsing and scrolling animations (default: true)",
        selector: { boolean: {} }
      }
    },
    {
      key: "show_grid",
      type: "boolean",
      default: false,
      description: "Show layout grid lines",
      "x-ui-hints": {
        label: "Show Grid",
        helper: "Display grid lines for layout visualization (default: false)",
        selector: { boolean: {} }
      }
    },
    {
      key: "show_zone_markers",
      type: "boolean",
      default: false,
      description: "Show zone boundary markers",
      "x-ui-hints": {
        label: "Show Zone Markers",
        helper: "Display coloured outlines for all zones (development only, default: false)",
        selector: { boolean: {} }
      }
    },
    // ============================================================
    // NUMBER OPTIONS
    // ============================================================
    {
      key: "decoration_size",
      type: "number",
      default: 10,
      description: "Size of decorative elements in pixels",
      "x-ui-hints": {
        label: "Decoration Size",
        helper: "Size of corner decorations in pixels (default: 10)",
        selector: {
          number: {
            mode: "box",
            step: 1,
            min: 5,
            max: 30
          }
        }
      }
    },
    {
      key: "animation_speed",
      type: "number",
      default: 2,
      description: "Animation speed in seconds",
      "x-ui-hints": {
        label: "Animation Speed",
        helper: "Duration of animation cycle in seconds (default: 2)",
        selector: {
          number: {
            mode: "slider",
            step: 0.1,
            min: 0.1,
            max: 10
          }
        }
      }
    },
    {
      key: "border_thickness",
      type: "number",
      default: 5,
      description: "Border thickness in pixels",
      "x-ui-hints": {
        label: "Border Thickness",
        helper: "Thickness of top/bottom borders in pixels (default: 5)",
        selector: {
          number: {
            mode: "box",
            step: 1,
            min: 0,
            max: 20
          }
        }
      }
    },
    // ============================================================
    // COLOR OPTIONS
    // ============================================================
    {
      key: "decoration_color",
      type: "color",
      default: "#66ccff",
      description: "Colour of decorative elements",
      "x-ui-hints": {
        label: "Decoration Colour",
        helper: "Colour for corner decorations and animations (default: #66ccff)",
        format: "color-lcards"
        // Use LCARdS color picker
      }
    },
    // ============================================================
    // STYLE-NESTED OPTIONS
    // Demonstrates accessing nested style properties
    // ============================================================
    {
      key: "style.border.radius",
      type: "number",
      default: 0,
      description: "Border radius for rounded corners",
      "x-ui-hints": {
        label: "Border Radius",
        helper: "Rounded corner radius in pixels (default: 0)",
        selector: {
          number: {
            mode: "box",
            step: 1,
            min: 0,
            max: 50
          }
        }
      }
    },
    {
      key: "style.range.show_labels",
      type: "boolean",
      default: true,
      description: "Show labels on range indicators",
      "x-ui-hints": {
        label: "Show Range Labels",
        helper: "Display labels on coloured range segments (default: true)",
        selector: { boolean: {} }
      }
    }
  ],
  // ================================================================
  // DESCRIPTION
  // Long-form description for documentation
  // ================================================================
  description: "Comprehensive demo component showcasing all available zones, configurable options, and rendering features. Use this as a reference for component development and testing."
};
const demoComponent = {
  render: render$1,
  calculateZones: calculateZones$1,
  metadata: metadata$1
};
const SUPPORTED_SHAPES = [
  "lozenge",
  // Fully rounded rect — rx = min(w, h) / 2
  "rect",
  // Plain rectangle — no rounding
  "rounded",
  // Rect with configurable corner radius
  "diamond",
  // 4-point diamond polygon
  "hexagon",
  // 6-point hexagon (flat-top, oriented to track)
  "polygon",
  // N-point user-defined polygon (points as % of w/h)
  "path"
  // Raw SVG path d-attribute (fully custom)
];
const SHAPE_BUILDERS = {
  /**
   * Fully-rounded rectangle (pill / lozenge).
   * rx = ry = Math.floor(min(w, h) / 2) unless overridden by options.radius.
   */
  lozenge(x, y, w, h, options = {}) {
    const rx = options.radius != null ? Number(options.radius) : Math.floor(Math.min(w, h) / 2);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" />`;
  },
  /**
   * Plain rectangle — sharp corners.
   */
  rect(x, y, w, h) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" />`;
  },
  /**
   * Rectangle with configurable corner radius.
   * options.radius (px) defaults to 8.
   */
  rounded(x, y, w, h, options = {}) {
    const rx = options.radius != null ? Number(options.radius) : 8;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" />`;
  },
  /**
   * Diamond — polygon connecting the four edge midpoints.
   *   top-center → center-right → bottom-center → center-left
   */
  diamond(x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const points = [
      `${cx},${y}`,
      // top
      `${x + w},${cy}`,
      // right
      `${cx},${y + h}`,
      // bottom
      `${x},${cy}`
      // left
    ].join(" ");
    return `<polygon points="${points}" />`;
  },
  /**
   * Flat-top hexagon.
   * When width ≥ height the long axis is horizontal; otherwise vertical.
   * options.orientation overrides auto-detection ('horizontal' | 'vertical').
   */
  hexagon(x, y, w, h, options = {}) {
    const orientation = options.orientation ?? (w >= h ? "horizontal" : "vertical");
    let points;
    if (orientation === "horizontal") {
      const inset = w * 0.15;
      points = [
        `${x + inset},${y}`,
        `${x + w - inset},${y}`,
        `${x + w},${y + h / 2}`,
        `${x + w - inset},${y + h}`,
        `${x + inset},${y + h}`,
        `${x},${y + h / 2}`
      ].join(" ");
    } else {
      const inset = h * 0.15;
      points = [
        `${x + w / 2},${y}`,
        `${x + w},${y + inset}`,
        `${x + w},${y + h - inset}`,
        `${x + w / 2},${y + h}`,
        `${x},${y + h - inset}`,
        `${x},${y + inset}`
      ].join(" ");
    }
    return `<polygon points="${points}" />`;
  },
  /**
   * User-defined polygon.
   * options.points: array of [xPct, yPct] pairs (0–1 relative to w/h).
   * Defaults to a safe rectangle if points are missing.
   */
  polygon(x, y, w, h, options = {}) {
    const pts = options.points;
    if (!Array.isArray(pts) || pts.length < 3) {
      return SHAPE_BUILDERS.rect(x, y, w, h);
    }
    const points = pts.map(([px, py]) => `${x + px * w},${y + py * h}`).join(" ");
    return `<polygon points="${points}" />`;
  },
  /**
   * Raw SVG path.
   * options.d: SVG path d-attribute string (in absolute coordinates relative to
   * the lozenge body origin — i.e., the caller is responsible for translating
   * by x/y if needed, or pass a path that already accounts for x/y offsets).
   * options.translate: if true, prepend a transform translate(x, y) wrapper.
   */
  path(x, y, w, h, options = {}) {
    const d = options.d || `M${x},${y} H${x + w} V${y + h} H${x} Z`;
    if (options.translate) {
      return `<g transform="translate(${x}, ${y})"><path d="${d}" /></g>`;
    }
    return `<path d="${d}" />`;
  }
};
function buildClipPath(id2, shapeType, x, y, w, h, options = {}) {
  const builder = SHAPE_BUILDERS[shapeType] ?? SHAPE_BUILDERS.lozenge;
  const inner = builder(x, y, w, h, options);
  return `<clipPath id="${id2}">
    ${inner}
  </clipPath>`;
}
let _uidCounter = 0;
function calculateZones(width, height, context) {
  const shapedStyle = context?.style?.shaped;
  const orientation = context?.style?.track?.orientation ?? "vertical";
  let bodyX, bodyY, bodyW, bodyH;
  if (orientation === "horizontal") {
    const leftW = shapedStyle?.text_bands?.left?.size ?? 60;
    const rightW = shapedStyle?.text_bands?.right?.size ?? 60;
    bodyX = leftW;
    bodyY = 0;
    bodyW = Math.max(1, width - leftW - rightW);
    bodyH = height;
  } else {
    const topH = shapedStyle?.text_bands?.top?.size ?? 36;
    const botH = shapedStyle?.text_bands?.bottom?.size ?? 36;
    bodyX = 0;
    bodyY = topH;
    bodyW = width;
    bodyH = Math.max(1, height - topH - botH);
  }
  const bodyZone = { x: bodyX, y: bodyY, width: bodyW, height: bodyH };
  const bandZones = {};
  if (orientation === "horizontal") {
    const leftW = shapedStyle?.text_bands?.left?.size ?? 60;
    const rightW = shapedStyle?.text_bands?.right?.size ?? 60;
    if (leftW > 0) bandZones.left = { x: 0, y: 0, width: leftW, height };
    if (rightW > 0) bandZones.right = { x: width - rightW, y: 0, width: rightW, height };
  } else {
    const topH = shapedStyle?.text_bands?.top?.size ?? 36;
    const botH = shapedStyle?.text_bands?.bottom?.size ?? 36;
    if (topH > 0) bandZones.top = { x: 0, y: 0, width, height: topH };
    if (botH > 0) bandZones.bottom = { x: 0, y: height - botH, width, height: botH };
  }
  return {
    track: { ...bodyZone },
    control: { ...bodyZone },
    progress: { ...bodyZone },
    // No range zone — ranges are embedded in track content
    text: { x: 0, y: 0, width, height },
    // Internal hint for render() — body bounds
    _shaped: { ...bodyZone },
    // Named band zones for text field routing (top/bottom or left/right)
    ...bandZones
  };
}
function render(context) {
  const { width, height, colors, config, style } = context;
  const zones = context.zones || calculateZones(width, height, context);
  const body = zones._shaped ?? zones.control;
  const bodyX = body.x;
  const bodyY = body.y;
  const bodyW = body.width;
  const bodyH = body.height;
  const shapeType = style?.shaped?.type ?? "lozenge";
  const shapeOptions = {
    radius: style?.shaped?.radius,
    orientation: style?.track?.orientation,
    points: style?.shaped?.polygon?.points,
    d: style?.shaped?.path?.d,
    translate: style?.shaped?.path?.translate
  };
  const uid = config?.id ?? `shaped-${++_uidCounter}`;
  const clipId = `shaped-clip-${uid}`;
  const trackBg = colors?.trackBackground ?? style?.shaped?.track?.background ?? "var(--lcards-gray-dark, #12121c)";
  const clipPathElement = buildClipPath(clipId, shapeType, bodyX, bodyY, bodyW, bodyH, shapeOptions);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <!-- Clip path constrains all injected content to the shape boundary -->
    ${clipPathElement}
  </defs>

  <!-- Full-card transparent background -->
  <rect width="${width}" height="${height}" fill="transparent" />

  <!-- Shape background (the "empty" portion of the track) -->
  <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}"
        clip-path="url(#${clipId})"
        fill="${trackBg}" />

  <!-- Progress bar zone — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="progress-zone" data-zone="progress"
     clip-path="url(#${clipId})"
     transform="translate(0, 0)"
     data-bounds="${zones.progress.x},${zones.progress.y},${zones.progress.width},${zones.progress.height}">
  </g>

  <!-- Track zone (fill + ranges, injected by card) — clipped to shape -->
  <!-- Content injected here uses absolute SVG coordinates; clip-path handles boundary -->
  <g id="track-zone" data-zone="track"
     clip-path="url(#${clipId})"
     transform="translate(0, 0)"
     data-bounds="${zones.track.x},${zones.track.y},${zones.track.width},${zones.track.height}">
  </g>

  <!-- Control overlay — full body area for pointer interaction -->
  <rect id="control-zone" data-zone="control"
        x="${zones.control.x}" y="${zones.control.y}"
        width="${zones.control.width}" height="${zones.control.height}"
        fill="none" stroke="none" pointer-events="all"
        data-bounds="${zones.control.x},${zones.control.y},${zones.control.width},${zones.control.height}" />

  <!-- Text zone — full card area so labels can sit in exterior bands -->
  <g id="text-zone" data-zone="text"
     transform="translate(${zones.text.x}, ${zones.text.y})"
     data-bounds="${zones.text.x},${zones.text.y},${zones.text.width},${zones.text.height}">
  </g>
</svg>
    `.trim();
}
function getMetadata() {
  return {
    type: "slider",
    pack: "lcards_sliders",
    id: "shaped",
    name: "Shaped",
    description: "Generic clip-path slider with exterior text bands. Shape is configurable via style.shaped.type (lozenge, rect, rounded, diamond, hexagon, polygon, path). Band widths/heights are set via style.shaped.text_bands.*.",
    orientation: "auto",
    supportsOrientation: ["horizontal", "vertical"],
    defaultOrientation: "vertical",
    features: [
      "clip-shape",
      "exterior-labels",
      "solid-fill",
      "range-bands",
      "invert-fill",
      "state-colors",
      "text-fields",
      "configurable-shape"
    ],
    supportedShapes: SUPPORTED_SHAPES,
    configSchema: {
      style: {
        shaped: {
          type: {
            description: "Shape to use as the clip boundary",
            type: "string",
            enum: SUPPORTED_SHAPES,
            default: "lozenge"
          },
          radius: {
            description: "Corner radius in px (lozenge defaults to auto = min(w,h)/2, rounded defaults to 8)",
            type: "number"
          },
          fill: {
            color: {
              description: "Value fill colour",
              type: "string",
              default: "theme:components.slider.shaped.fill.color"
            }
          },
          text_bands: {
            description: "Pixel space reserved outside the shape body on each side, used by text.* fields for their position zones",
            top: { size: { type: "number", default: 36 } },
            bottom: { size: { type: "number", default: 36 } },
            left: { size: { type: "number", default: 60 } },
            right: { size: { type: "number", default: 60 } }
          },
          track: {
            background: {
              description: "Shape track background colour (the empty portion)",
              type: "string",
              default: "theme:components.slider.track.background"
            }
          },
          polygon: {
            points: {
              description: "Array of [xPct, yPct] pairs (0-1) for polygon shape type",
              type: "array"
            }
          },
          path: {
            d: {
              description: "SVG path d-attribute for path shape type",
              type: "string"
            },
            translate: {
              description: "If true, wrap path in translate(bodyX, bodyY) transform",
              type: "boolean",
              default: false
            }
          }
        }
      }
    }
  };
}
const shapedComponent = {
  calculateZones,
  render,
  metadata: getMetadata()
};
const sliderComponents = {
  // Default component - render function architecture
  "default": defaultComponent,
  // Picard component - render function architecture
  "picard": picardComponent,
  // Demo component - comprehensive feature showcase (development/testing)
  "demo": demoComponent,
  // Shaped component - generic clip-path shell with exterior label bands
  // Shape type (lozenge, rect, rounded, diamond, hexagon, polygon, path) is
  // configured via style.shaped.type — defaults to lozenge.
  "shaped": shapedComponent
};
const alertSvg = `<svg viewBox="0 0 100 85.56" xmlns="http://www.w3.org/2000/svg">

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

</svg>`;
const alertComponents = {
  "alert": {
    svg: alertSvg,
    orientation: "square",
    features: ["multi-segment", "state-based-styling", "animation-targets", "presets", "text-overlay"],
    // ---------------------------------------------------------------------------
    // Default segment definitions
    // Styles use theme: tokens so they adapt to the active theme automatically.
    // The bars segment selector targets all 12 bars in one go.
    // ---------------------------------------------------------------------------
    segments: {
      shape: {
        selector: "#alert-shape path",
        style: {
          fill: "theme:components.alert.shape.fill"
        }
      },
      bars: {
        selector: '[id^="bar-"]',
        style: {
          stroke: "theme:components.alert.bars.stroke"
        }
      }
    },
    // ---------------------------------------------------------------------------
    // zones — named map of interior cavities, in viewBox coordinate space
    // (viewBox: 0 0 100 85.56).  _buildComponentTextMarkup() uses these directly
    // to position text in viewBox units so it scales 1:1 with the shape.
    //
    // Each text field declares which zone it lives in via its `zone` key.
    // Position / x_percent / y_percent are resolved relative to that zone.
    // font_size is in viewBox units; font_size_percent (% of zone height) is
    // an alternative that is independent of the viewBox scale.
    //
    // 'center' cavity — between the two bar-cap sections, clear of side panels:
    //   Top wing join:    y = 25.26  (where diagonals meet the centre section)
    //   Bottom wing join: y = 48.37
    //   Left side panel:  x = 15.10  (inner edge of left slab)
    //   Right side panel: x = 84.77  (inner edge of right slab)
    //
    // Split into two named zones (one per label) so the editor can expose a
    // zone dropdown and each label can be independently sized/positioned.
    // ---------------------------------------------------------------------------
    zones: {
      alert_line: {
        x: 15.1,
        y: 25.26,
        width: 69.67,
        height: 13
        // upper portion of the cavity (~56% of 23.11)
      },
      sub_line: {
        x: 15.1,
        y: 38.26,
        // 25.26 + 13.00
        width: 69.67,
        height: 10.11
        // lower portion (25.26 + 23.11 − 38.26 ≈ 10.11)
      }
    },
    // ---------------------------------------------------------------------------
    // Default text field configs.
    // font_size is in viewBox units (same coordinate space as x/y).
    // Each field is centred within its own named text area.
    //   alert_line height = 13.00  →  font_size 10 ≈ 77% of area height
    //   sub_line   height = 10.11  →  font_size  7 ≈ 69% of area height
    // Use font_size_percent for a more intuitive size declaration.
    // ---------------------------------------------------------------------------
    text: {
      alert_text: {
        zone: "alert_line",
        content: "ALERT",
        show: true,
        position: "center",
        stretch: true,
        // stretch text to fill width of area
        font_family: "lcards_microgramma, Antonio",
        font_size_percent: 100,
        padding: {
          top: 2,
          right: 2,
          bottom: 0,
          left: 2
        }
      },
      sub_text: {
        zone: "sub_line",
        content: "CONDITION",
        show: true,
        stretch: true,
        // stretch text to fill width of area
        font_family: "lcards_microgramma, Antonio",
        position: "center",
        font_size_percent: 58,
        padding: {
          right: 2,
          left: 2
        }
      }
    },
    // ---------------------------------------------------------------------------
    // Component-level animations
    // These are registered with the SVG *container* element as the animation scope
    // (not with a single segment element), which lets querySelectorAll resolve
    // all 12 bars correctly for the stagger-flash preset.
    // ---------------------------------------------------------------------------
    // Two-group converging sweep — replicates the legacy CB-LCARS flashLine pattern:
    //   Top cap  (bar-1 … bar-6):  flash starts at bar-1, sweeps DOWN toward centre.
    //   Bottom cap (bar-7 … bar-12): flash starts at bar-12, sweeps UP toward centre.
    // Both groups converge toward the middle of the shield simultaneously.
    //
    // stagger-flash uses 2-color WAAPI keyframes (matching legacy @keyframes flashLine):
    //   0%        → lead_color,  opacity 1           (snap)
    //   lead_pct% → trail_color, opacity 1           (ease-in-out)
    //   100%      → trail_color, opacity trail_opacity (ease-in-out, stays dim)
    //
    // Colors come from the active preset's animations overrides; the values below
    // are fallbacks used when no preset is active.
    animations: [
      {
        id: "bars-top-sweep",
        trigger: "on_load",
        target: "#bar-1, #bar-2, #bar-3, #bar-4, #bar-5, #bar-6",
        preset: "stagger-flash",
        params: {
          grid: [1, 6],
          from: "first",
          property: "stroke",
          lead_color: "var(--lcards-moonlight, #dfe1e8)",
          trail_color: "var(--lcars-ui-quaternary, var(--lcards-gray-dark, #363636))",
          lead_pct: 20,
          with_opacity: true,
          trail_opacity: 0.25,
          duration: 2e3,
          loop: true
        }
      },
      {
        id: "bars-bottom-sweep",
        trigger: "on_load",
        target: "#bar-7, #bar-8, #bar-9, #bar-10, #bar-11, #bar-12",
        preset: "stagger-flash",
        params: {
          grid: [1, 6],
          from: "last",
          // bar-12 gets delay 0 → sweeps upward toward centre
          property: "stroke",
          lead_color: "var(--lcards-moonlight, #dfe1e8)",
          trail_color: "var(--lcars-ui-quaternary, var(--lcards-gray-dark, #363636))",
          lead_pct: 20,
          with_opacity: true,
          trail_opacity: 0.25,
          duration: 2e3,
          loop: true
        }
      }
    ],
    // ---------------------------------------------------------------------------
    // Presets
    // Each preset provides segment overrides for style and/or text.
    // Styles use theme: token paths so they are resolved through ThemeTokenResolver
    // and therefore pick up LCARS palette variables correctly.
    // ---------------------------------------------------------------------------
    presets: {
      default: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcars-alert-blue, #0000ff))", trail_color: "base(var(--lcars-ui-quaternary, var(--lcards-gray-dark, #2f3749)))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcars-alert-blue, #0000ff))", trail_color: "base(var(--lcars-ui-quaternary, var(--lcards-gray-dark, #2f3749)))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "base(var(--lcars-alert-red, #cc0000))" },
          sub_text: { content: "CONDITION", color: "theme:base(colors.alert.gray)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.gray)" } },
          bars: { style: { stroke: "theme:base(colors.alert.gray)" } }
        }
      },
      condition_red: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcards-orange-lightest, #ffb399))", trail_color: "base(var(--lcars-alert-red, #cc0000))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcards-orange-lightest, #ffb399))", trail_color: "base(var(--lcars-alert-red, #cc0000))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.red)" },
          sub_text: { content: "CONDITION: RED", color: "theme:base(colors.alert.red)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.red)" } },
          bars: { style: { stroke: "theme:base(colors.alert.red)" } }
        }
      },
      condition_blue: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcards-blue-light, #93e1ff))", trail_color: "base(var(--lcars-alert-blue, #0000ff))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcards-blue-light, #93e1ff))", trail_color: "base(var(--lcars-alert-blue, #0000ff))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.blue)" },
          sub_text: { content: "CONDITION: BLUE", color: "theme:base(colors.alert.blue)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.blue)" } },
          bars: { style: { stroke: "theme:base(colors.alert.blue)" } }
        }
      },
      condition_yellow: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcards-yellow-lightest, #f5f5dc))", trail_color: "base(var(--lcars-alert-yellow, #ffcc00))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcards-yellow-lightest, #f5f5dc))", trail_color: "base(var(--lcars-alert-yellow, #ffcc00))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.yellow)" },
          sub_text: { content: "CONDITION: YELLOW", color: "theme:base(colors.alert.yellow)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.yellow)" } },
          bars: { style: { stroke: "theme:base(colors.alert.yellow)" } }
        }
      },
      condition_green: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcards-green-lightest, #b8e0c1))", trail_color: "base(var(--lcars-green, #33cc99))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcards-green-lightest, #b8e0c1))", trail_color: "base(var(--lcars-green, #33cc99))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.green)" },
          sub_text: { content: "CONDITION: GREEN", color: "theme:base(colors.alert.green)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.green)" } },
          bars: { style: { stroke: "theme:base(colors.alert.green)" } }
        }
      },
      condition_gray: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "base(var(--lcards-moonlight, #dfe1e8))", trail_color: "base(var(--lcards-gray, #6d748c))" } },
          { id: "bars-bottom-sweep", params: { lead_color: "base(var(--lcards-moonlight, #dfe1e8))", trail_color: "base(var(--lcards-gray, #6d748c))" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.gray)" },
          sub_text: { content: "CONDITION: GRAY", color: "theme:base(colors.alert.gray)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.gray)" } },
          bars: { style: { stroke: "theme:base(colors.alert.gray)" } }
        }
      },
      condition_black: {
        animations: [
          { id: "bars-top-sweep", params: { lead_color: "black", trail_color: "theme:base(colors.alert.black)" } },
          { id: "bars-bottom-sweep", params: { lead_color: "black", trail_color: "theme:base(colors.alert.black)" } }
        ],
        text: {
          alert_text: { content: "ALERT", color: "theme:base(colors.alert.black)" },
          sub_text: { content: "CONDITION: BLACK", color: "theme:base(colors.alert.black)" }
        },
        segments: {
          shape: { style: { fill: "theme:base(colors.alert.black)" } },
          bars: { style: { stroke: "theme:base(colors.alert.black)" } }
        }
      }
    },
    /**
     * Validate that a given preset name is defined on this component.
     * @param {string} presetName
     * @returns {boolean}
     */
    validatePreset(presetName) {
      return presetName in this.presets;
    },
    /**
     * Return the list of available preset names.
     * @returns {string[]}
     */
    getPresetNames() {
      return Object.keys(this.presets);
    },
    metadata: {
      type: "alert",
      card_type: "button",
      // Which card editor this component is valid for
      pack: "lcards_buttons",
      id: "alert",
      name: "Alert Symbol",
      description: "LCARS alert symbol: shield design with animated bars and condition presets",
      version: "2.0.0"
    }
  }
};
const components = {
  ...dpadComponents,
  // D-Pad components (dpad)
  ...dpadVoyagerComponents,
  // D-Pad components (dpad_voyager)
  ...sliderComponents,
  // Slider components (basic, picard, picard-vertical)
  ...elbowComponents,
  // Elbow components (header-left, header-right, footer-left, footer-right)
  ...alertComponents
  // Alert components (alert)
};
const presetNames = (presets) => Object.keys(presets).filter((name) => name !== "base");
const BUILTIN_OPTIONS = Object.freeze({
  buttonPresets: presetNames(BUTTON_PRESETS),
  sliderPresets: presetNames(SLIDER_PRESETS),
  sliderComponents: Object.entries(components).filter(([, c]) => c.metadata?.type === "slider").map(([name]) => name),
  positionEnum: [...TEXT_POSITIONS]
});
function getSchemaEntries() {
  const o = BUILTIN_OPTIONS;
  return [
    { kind: "card", tag: "lcards-button", schema: getButtonSchema({ availablePresets: o.buttonPresets, positionEnum: o.positionEnum }) },
    { kind: "card", tag: "lcards-slider", schema: getSliderSchema({ availablePresets: o.sliderPresets, availableComponents: o.sliderComponents, positionEnum: o.positionEnum }) },
    { kind: "card", tag: "lcards-elbow", schema: getElbowSchema({ availablePresets: o.buttonPresets, positionEnum: o.positionEnum }) },
    { kind: "card", tag: "lcards-chart", schema: getChartSchema() },
    { kind: "card", tag: "lcards-data-grid", schema: dataGridSchema },
    { kind: "card", tag: "lcards-alert-overlay", schema: getAlertOverlaySchema() },
    { kind: "card", tag: "lcards-select-menu", schema: getSelectMenuSchema({ availablePresets: o.buttonPresets }) },
    { kind: "card", tag: "lcards-layout-card", schema: layoutCardSchema },
    { kind: "card", tag: "lcards-msd-card", schema: getMsdSchema() },
    { kind: "view", tag: "lcards-layout-view", schema: layoutViewSchema },
    { kind: "strategy", tag: "lcars-shell", schema: shellStrategySchema }
  ];
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var ajv = { exports: {} };
var core$2 = {};
var validate = {};
var boolSchema = {};
var errors = {};
var codegen = {};
var code$1 = {};
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.regexpCode = exports$1.getEsmExportName = exports$1.getProperty = exports$1.safeStringify = exports$1.stringify = exports$1.strConcat = exports$1.addCodeArg = exports$1.str = exports$1._ = exports$1.nil = exports$1._Code = exports$1.Name = exports$1.IDENTIFIER = exports$1._CodeOrName = void 0;
  class _CodeOrName {
  }
  exports$1._CodeOrName = _CodeOrName;
  exports$1.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports$1.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports$1.Name = Name;
  class _Code extends _CodeOrName {
    constructor(code2) {
      super();
      this._items = typeof code2 === "string" ? [code2] : code2;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names2, c) => {
        if (c instanceof Name)
          names2[c.str] = (names2[c.str] || 0) + 1;
        return names2;
      }, {});
    }
  }
  exports$1._Code = _Code;
  exports$1.nil = new _Code("");
  function _(strs, ...args) {
    const code2 = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code2, args[i]);
      code2.push(strs[++i]);
    }
    return new _Code(code2);
  }
  exports$1._ = _;
  const plus = new _Code("+");
  function str2(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports$1.str = str2;
  function addCodeArg(code2, arg) {
    if (arg instanceof _Code)
      code2.push(...arg._items);
    else if (arg instanceof Name)
      code2.push(arg);
    else
      code2.push(interpolate(arg));
  }
  exports$1.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== void 0) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str2`${c1}${c2}`;
  }
  exports$1.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports$1.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports$1.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports$1.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports$1.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports$1.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports$1.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports$1.regexpCode = regexpCode;
})(code$1);
var scope = {};
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.ValueScope = exports$1.ValueScopeName = exports$1.Scope = exports$1.varKinds = exports$1.UsedValueState = void 0;
  const code_12 = code$1;
  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports$1.UsedValueState = UsedValueState = {}));
  exports$1.varKinds = {
    const: new code_12.Name("const"),
    let: new code_12.Name("let"),
    var: new code_12.Name("var")
  };
  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_12.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_12.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports$1.Scope = Scope;
  class ValueScopeName extends code_12.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_12._)`.${new code_12.Name(property)}[${itemIndex}]`;
    }
  }
  exports$1.ValueScopeName = ValueScopeName;
  const line = (0, code_12._)`\n`;
  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_12.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === void 0)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = /* @__PURE__ */ new Map();
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === void 0)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_12._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === void 0)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code2 = code_12.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def2 = this.opts.es5 ? exports$1.varKinds.var : exports$1.varKinds.const;
            code2 = (0, code_12._)`${code2}${def2} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
            code2 = (0, code_12._)`${code2}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code2;
    }
  }
  exports$1.ValueScope = ValueScope;
})(scope);
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.or = exports$1.and = exports$1.not = exports$1.CodeGen = exports$1.operators = exports$1.varKinds = exports$1.ValueScopeName = exports$1.ValueScope = exports$1.Scope = exports$1.Name = exports$1.regexpCode = exports$1.stringify = exports$1.getProperty = exports$1.nil = exports$1.strConcat = exports$1.str = exports$1._ = void 0;
  const code_12 = code$1;
  const scope_1 = scope;
  var code_2 = code$1;
  Object.defineProperty(exports$1, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports$1, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports$1, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports$1, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports$1, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports$1, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports$1, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports$1, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = scope;
  Object.defineProperty(exports$1, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports$1, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports$1, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports$1, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports$1.operators = {
    GT: new code_12._Code(">"),
    GTE: new code_12._Code(">="),
    LT: new code_12._Code("<"),
    LTE: new code_12._Code("<="),
    EQ: new code_12._Code("==="),
    NEQ: new code_12._Code("!=="),
    NOT: new code_12._Code("!"),
    OR: new code_12._Code("||"),
    AND: new code_12._Code("&&"),
    ADD: new code_12._Code("+")
  };
  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }
  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names2, constants) {
      if (!names2[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names2, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_12._CodeOrName ? this.rhs.names : {};
    }
  }
  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names2, constants) {
      if (this.lhs instanceof code_12.Name && !names2[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names2, constants);
      return this;
    }
    get names() {
      const names2 = this.lhs instanceof code_12.Name ? {} : { ...this.lhs.names };
      return addExprNames(names2, this.rhs);
    }
  }
  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }
  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }
  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }
  class Throw extends Node {
    constructor(error2) {
      super();
      this.error = error2;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }
  class AnyCode extends Node {
    constructor(code2) {
      super();
      this.code = code2;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : void 0;
    }
    optimizeNames(names2, constants) {
      this.code = optimizeExpr(this.code, names2, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_12._CodeOrName ? this.code.names : {};
    }
  }
  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code2, n) => code2 + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : void 0;
    }
    optimizeNames(names2, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names2, constants))
          continue;
        subtractNames(names2, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : void 0;
    }
    get names() {
      return this.nodes.reduce((names2, n) => addNames(names2, n.names), {});
    }
  }
  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }
  class Root extends ParentNode {
  }
  class Else extends BlockNode {
  }
  Else.kind = "else";
  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code2 = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code2 += "else " + this.else.render(opts);
      return code2;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not2(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return void 0;
      return this;
    }
    optimizeNames(names2, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names2, constants);
      if (!(super.optimizeNames(names2, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names2, constants);
      return this;
    }
    get names() {
      const names2 = super.names;
      addExprNames(names2, this.condition);
      if (this.else)
        addNames(names2, this.else.names);
      return names2;
    }
  }
  If.kind = "if";
  class For extends BlockNode {
  }
  For.kind = "for";
  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names2, constants) {
      if (!super.optimizeNames(names2, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names2, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }
  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names2 = addExprNames(super.names, this.from);
      return addExprNames(names2, this.to);
    }
  }
  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names2, constants) {
      if (!super.optimizeNames(names2, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names2, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }
  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";
  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";
  class Try extends BlockNode {
    render(opts) {
      let code2 = "try" + super.render(opts);
      if (this.catch)
        code2 += this.catch.render(opts);
      if (this.finally)
        code2 += this.finally.render(opts);
      return code2;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
      (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
      return this;
    }
    optimizeNames(names2, constants) {
      var _a, _b;
      super.optimizeNames(names2, constants);
      (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names2, constants);
      (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names2, constants);
      return this;
    }
    get names() {
      const names2 = super.names;
      if (this.catch)
        addNames(names2, this.catch.names);
      if (this.finally)
        addNames(names2, this.finally.names);
      return names2;
    }
  }
  class Catch extends BlockNode {
    constructor(error2) {
      super();
      this.error = error2;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";
  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";
  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root()];
    }
    toString() {
      return this._root.render(this.opts);
    }
    // returns unique name in the internal scope
    name(prefix) {
      return this._scope.name(prefix);
    }
    // reserves unique name in the external scope
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    // reserves unique name in the external scope and assigns value to it
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    // return code that assigns values in the external scope to the names that are used internally
    // (same names that were returned by gen.scopeName or gen.scopeValue)
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== void 0 && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    // `const` declaration (`var` in es5 mode)
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    // `let` declaration with optional assignment (`var` in es5 mode)
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    // `var` declaration with optional assignment
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    // assignment code
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    // `+=` code
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports$1.operators.ADD, rhs));
    }
    // appends passed SafeExpr to code or executes Block
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_12.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    // returns code for object literal for the passed argument list of key-value pairs
    object(...keyValues) {
      const code2 = ["{"];
      for (const [key, value] of keyValues) {
        if (code2.length > 1)
          code2.push(",");
        code2.push(key);
        if (key !== value || this.opts.es5) {
          code2.push(":");
          (0, code_12.addCodeArg)(code2, value);
        }
      }
      code2.push("}");
      return new code_12._Code(code2);
    }
    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    // `else if` clause - invalid without `if` or after `else` clauses
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    // `else` clause - only valid after `if` or `else if` clauses
    else() {
      return this._elseNode(new Else());
    }
    // end `if` statement (needed if gen.if was used only with condition)
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    // a generic `for` clause (or statement if `forBody` is passed)
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    // `for` statement for a range of values
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    // `for-of` statement (in es5 mode replace with a normal for loop)
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_12.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_12._)`${arr}.length`, (i) => {
          this.var(name, (0, code_12._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    // `for-in` statement.
    // With option `ownProperties` replaced with a `for-of` loop for object keys
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_12._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    // end `for` loop
    endFor() {
      return this._endBlockNode(For);
    }
    // `label` statement
    label(label) {
      return this._leafNode(new Label(label));
    }
    // `break` statement
    break(label) {
      return this._leafNode(new Break(label));
    }
    // `return` statement
    return(value) {
      const node = new Return();
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    // `try` statement
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try();
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error2 = this.name("e");
        this._currNode = node.catch = new Catch(error2);
        catchCode(error2);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally();
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    // `throw` statement
    throw(error2) {
      return this._leafNode(new Throw(error2));
    }
    // start self-balancing block
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    // end the current self-balancing block
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === void 0)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    // `function` heading (or definition if funcBody is passed)
    func(name, args = code_12.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    // end function definition
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports$1.CodeGen = CodeGen;
  function addNames(names2, from) {
    for (const n in from)
      names2[n] = (names2[n] || 0) + (from[n] || 0);
    return names2;
  }
  function addExprNames(names2, from) {
    return from instanceof code_12._CodeOrName ? addNames(names2, from.names) : names2;
  }
  function optimizeExpr(expr, names2, constants) {
    if (expr instanceof code_12.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_12._Code(expr._items.reduce((items2, c) => {
      if (c instanceof code_12.Name)
        c = replaceName(c);
      if (c instanceof code_12._Code)
        items2.push(...c._items);
      else
        items2.push(c);
      return items2;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === void 0 || names2[n.str] !== 1)
        return n;
      delete names2[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_12._Code && e._items.some((c) => c instanceof code_12.Name && names2[c.str] === 1 && constants[c.str] !== void 0);
    }
  }
  function subtractNames(names2, from) {
    for (const n in from)
      names2[n] = (names2[n] || 0) - (from[n] || 0);
  }
  function not2(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_12._)`!${par(x)}`;
  }
  exports$1.not = not2;
  const andCode = mappend(exports$1.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports$1.and = and;
  const orCode = mappend(exports$1.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports$1.or = or;
  function mappend(op) {
    return (x, y) => x === code_12.nil ? y : y === code_12.nil ? x : (0, code_12._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_12.Name ? x : (0, code_12._)`(${x})`;
  }
})(codegen);
var util = {};
Object.defineProperty(util, "__esModule", { value: true });
util.checkStrictMode = util.getErrorPath = util.Type = util.useFunc = util.setEvaluated = util.evaluatedPropsToName = util.mergeEvaluated = util.eachItem = util.unescapeJsonPointer = util.escapeJsonPointer = util.escapeFragment = util.unescapeFragment = util.schemaRefOrVal = util.schemaHasRulesButRef = util.schemaHasRules = util.checkUnknownRules = util.alwaysValidSchema = util.toHash = void 0;
const codegen_1$v = codegen;
const code_1$a = code$1;
function toHash(arr) {
  const hash = {};
  for (const item of arr)
    hash[item] = true;
  return hash;
}
util.toHash = toHash;
function alwaysValidSchema(it, schema2) {
  if (typeof schema2 == "boolean")
    return schema2;
  if (Object.keys(schema2).length === 0)
    return true;
  checkUnknownRules(it, schema2);
  return !schemaHasRules(schema2, it.self.RULES.all);
}
util.alwaysValidSchema = alwaysValidSchema;
function checkUnknownRules(it, schema2 = it.schema) {
  const { opts, self } = it;
  if (!opts.strictSchema)
    return;
  if (typeof schema2 === "boolean")
    return;
  const rules2 = self.RULES.keywords;
  for (const key in schema2) {
    if (!rules2[key])
      checkStrictMode(it, `unknown keyword: "${key}"`);
  }
}
util.checkUnknownRules = checkUnknownRules;
function schemaHasRules(schema2, rules2) {
  if (typeof schema2 == "boolean")
    return !schema2;
  for (const key in schema2)
    if (rules2[key])
      return true;
  return false;
}
util.schemaHasRules = schemaHasRules;
function schemaHasRulesButRef(schema2, RULES) {
  if (typeof schema2 == "boolean")
    return !schema2;
  for (const key in schema2)
    if (key !== "$ref" && RULES.all[key])
      return true;
  return false;
}
util.schemaHasRulesButRef = schemaHasRulesButRef;
function schemaRefOrVal({ topSchemaRef, schemaPath }, schema2, keyword2, $data) {
  if (!$data) {
    if (typeof schema2 == "number" || typeof schema2 == "boolean")
      return schema2;
    if (typeof schema2 == "string")
      return (0, codegen_1$v._)`${schema2}`;
  }
  return (0, codegen_1$v._)`${topSchemaRef}${schemaPath}${(0, codegen_1$v.getProperty)(keyword2)}`;
}
util.schemaRefOrVal = schemaRefOrVal;
function unescapeFragment(str2) {
  return unescapeJsonPointer(decodeURIComponent(str2));
}
util.unescapeFragment = unescapeFragment;
function escapeFragment(str2) {
  return encodeURIComponent(escapeJsonPointer(str2));
}
util.escapeFragment = escapeFragment;
function escapeJsonPointer(str2) {
  if (typeof str2 == "number")
    return `${str2}`;
  return str2.replace(/~/g, "~0").replace(/\//g, "~1");
}
util.escapeJsonPointer = escapeJsonPointer;
function unescapeJsonPointer(str2) {
  return str2.replace(/~1/g, "/").replace(/~0/g, "~");
}
util.unescapeJsonPointer = unescapeJsonPointer;
function eachItem(xs, f) {
  if (Array.isArray(xs)) {
    for (const x of xs)
      f(x);
  } else {
    f(xs);
  }
}
util.eachItem = eachItem;
function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
  return (gen, from, to, toName) => {
    const res = to === void 0 ? from : to instanceof codegen_1$v.Name ? (from instanceof codegen_1$v.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1$v.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
    return toName === codegen_1$v.Name && !(res instanceof codegen_1$v.Name) ? resultToName(gen, res) : res;
  };
}
util.mergeEvaluated = {
  props: makeMergeEvaluated({
    mergeNames: (gen, from, to) => gen.if((0, codegen_1$v._)`${to} !== true && ${from} !== undefined`, () => {
      gen.if((0, codegen_1$v._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1$v._)`${to} || {}`).code((0, codegen_1$v._)`Object.assign(${to}, ${from})`));
    }),
    mergeToName: (gen, from, to) => gen.if((0, codegen_1$v._)`${to} !== true`, () => {
      if (from === true) {
        gen.assign(to, true);
      } else {
        gen.assign(to, (0, codegen_1$v._)`${to} || {}`);
        setEvaluated(gen, to, from);
      }
    }),
    mergeValues: (from, to) => from === true ? true : { ...from, ...to },
    resultToName: evaluatedPropsToName
  }),
  items: makeMergeEvaluated({
    mergeNames: (gen, from, to) => gen.if((0, codegen_1$v._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1$v._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
    mergeToName: (gen, from, to) => gen.if((0, codegen_1$v._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1$v._)`${to} > ${from} ? ${to} : ${from}`)),
    mergeValues: (from, to) => from === true ? true : Math.max(from, to),
    resultToName: (gen, items2) => gen.var("items", items2)
  })
};
function evaluatedPropsToName(gen, ps) {
  if (ps === true)
    return gen.var("props", true);
  const props = gen.var("props", (0, codegen_1$v._)`{}`);
  if (ps !== void 0)
    setEvaluated(gen, props, ps);
  return props;
}
util.evaluatedPropsToName = evaluatedPropsToName;
function setEvaluated(gen, props, ps) {
  Object.keys(ps).forEach((p) => gen.assign((0, codegen_1$v._)`${props}${(0, codegen_1$v.getProperty)(p)}`, true));
}
util.setEvaluated = setEvaluated;
const snippets = {};
function useFunc(gen, f) {
  return gen.scopeValue("func", {
    ref: f,
    code: snippets[f.code] || (snippets[f.code] = new code_1$a._Code(f.code))
  });
}
util.useFunc = useFunc;
var Type;
(function(Type2) {
  Type2[Type2["Num"] = 0] = "Num";
  Type2[Type2["Str"] = 1] = "Str";
})(Type || (util.Type = Type = {}));
function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
  if (dataProp instanceof codegen_1$v.Name) {
    const isNumber = dataPropType === Type.Num;
    return jsPropertySyntax ? isNumber ? (0, codegen_1$v._)`"[" + ${dataProp} + "]"` : (0, codegen_1$v._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1$v._)`"/" + ${dataProp}` : (0, codegen_1$v._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
  }
  return jsPropertySyntax ? (0, codegen_1$v.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
}
util.getErrorPath = getErrorPath;
function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
  if (!mode)
    return;
  msg = `strict mode: ${msg}`;
  if (mode === true)
    throw new Error(msg);
  it.self.logger.warn(msg);
}
util.checkStrictMode = checkStrictMode;
var names$1 = {};
Object.defineProperty(names$1, "__esModule", { value: true });
const codegen_1$u = codegen;
const names = {
  // validation function arguments
  data: new codegen_1$u.Name("data"),
  // data passed to validation function
  // args passed from referencing schema
  valCxt: new codegen_1$u.Name("valCxt"),
  // validation/data context - should not be used directly, it is destructured to the names below
  instancePath: new codegen_1$u.Name("instancePath"),
  parentData: new codegen_1$u.Name("parentData"),
  parentDataProperty: new codegen_1$u.Name("parentDataProperty"),
  rootData: new codegen_1$u.Name("rootData"),
  // root data - same as the data passed to the first/top validation function
  dynamicAnchors: new codegen_1$u.Name("dynamicAnchors"),
  // used to support recursiveRef and dynamicRef
  // function scoped variables
  vErrors: new codegen_1$u.Name("vErrors"),
  // null or array of validation errors
  errors: new codegen_1$u.Name("errors"),
  // counter of validation errors
  this: new codegen_1$u.Name("this"),
  // "globals"
  self: new codegen_1$u.Name("self"),
  scope: new codegen_1$u.Name("scope"),
  // JTD serialize/parse name for JSON string and position
  json: new codegen_1$u.Name("json"),
  jsonPos: new codegen_1$u.Name("jsonPos"),
  jsonLen: new codegen_1$u.Name("jsonLen"),
  jsonPart: new codegen_1$u.Name("jsonPart")
};
names$1.default = names;
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.extendErrors = exports$1.resetErrorsCount = exports$1.reportExtraError = exports$1.reportError = exports$1.keyword$DataError = exports$1.keywordError = void 0;
  const codegen_12 = codegen;
  const util_12 = util;
  const names_12 = names$1;
  exports$1.keywordError = {
    message: ({ keyword: keyword2 }) => (0, codegen_12.str)`must pass "${keyword2}" keyword validation`
  };
  exports$1.keyword$DataError = {
    message: ({ keyword: keyword2, schemaType }) => schemaType ? (0, codegen_12.str)`"${keyword2}" keyword must be ${schemaType} ($data)` : (0, codegen_12.str)`"${keyword2}" keyword is invalid ($data)`
  };
  function reportError(cxt, error2 = exports$1.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error2, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_12._)`[${errObj}]`);
    }
  }
  exports$1.reportError = reportError;
  function reportExtraError(cxt, error2 = exports$1.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error2, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_12.default.vErrors);
    }
  }
  exports$1.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_12.default.errors, errsCount);
    gen.if((0, codegen_12._)`${names_12.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_12._)`${names_12.default.vErrors}.length`, errsCount), () => gen.assign(names_12.default.vErrors, null)));
  }
  exports$1.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword: keyword2, schemaValue, data, errsCount, it }) {
    if (errsCount === void 0)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_12.default.errors, (i) => {
      gen.const(err, (0, codegen_12._)`${names_12.default.vErrors}[${i}]`);
      gen.if((0, codegen_12._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_12._)`${err}.instancePath`, (0, codegen_12.strConcat)(names_12.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_12._)`${err}.schemaPath`, (0, codegen_12.str)`${it.errSchemaPath}/${keyword2}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_12._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_12._)`${err}.data`, data);
      }
    });
  }
  exports$1.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_12._)`${names_12.default.vErrors} === null`, () => gen.assign(names_12.default.vErrors, (0, codegen_12._)`[${err}]`), (0, codegen_12._)`${names_12.default.vErrors}.push(${err})`);
    gen.code((0, codegen_12._)`${names_12.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_12._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_12._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  const E = {
    keyword: new codegen_12.Name("keyword"),
    schemaPath: new codegen_12.Name("schemaPath"),
    // also used in JTD errors
    params: new codegen_12.Name("params"),
    propertyName: new codegen_12.Name("propertyName"),
    message: new codegen_12.Name("message"),
    schema: new codegen_12.Name("schema"),
    parentSchema: new codegen_12.Name("parentSchema")
  };
  function errorObjectCode(cxt, error2, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_12._)`{}`;
    return errorObject(cxt, error2, errorPaths);
  }
  function errorObject(cxt, error2, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error2, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_12.str)`${errorPath}${(0, util_12.getErrorPath)(instancePath, util_12.Type.Str)}` : errorPath;
    return [names_12.default.instancePath, (0, codegen_12.strConcat)(names_12.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword: keyword2, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_12.str)`${errSchemaPath}/${keyword2}`;
    if (schemaPath) {
      schPath = (0, codegen_12.str)`${schPath}${(0, util_12.getErrorPath)(schemaPath, util_12.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword: keyword2, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword2], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_12._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_12._)`${topSchemaRef}${schemaPath}`], [names_12.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
})(errors);
Object.defineProperty(boolSchema, "__esModule", { value: true });
boolSchema.boolOrEmptySchema = boolSchema.topBoolOrEmptySchema = void 0;
const errors_1$3 = errors;
const codegen_1$t = codegen;
const names_1$6 = names$1;
const boolError = {
  message: "boolean schema is false"
};
function topBoolOrEmptySchema(it) {
  const { gen, schema: schema2, validateName } = it;
  if (schema2 === false) {
    falseSchemaError(it, false);
  } else if (typeof schema2 == "object" && schema2.$async === true) {
    gen.return(names_1$6.default.data);
  } else {
    gen.assign((0, codegen_1$t._)`${validateName}.errors`, null);
    gen.return(true);
  }
}
boolSchema.topBoolOrEmptySchema = topBoolOrEmptySchema;
function boolOrEmptySchema(it, valid) {
  const { gen, schema: schema2 } = it;
  if (schema2 === false) {
    gen.var(valid, false);
    falseSchemaError(it);
  } else {
    gen.var(valid, true);
  }
}
boolSchema.boolOrEmptySchema = boolOrEmptySchema;
function falseSchemaError(it, overrideAllErrors) {
  const { gen, data } = it;
  const cxt = {
    gen,
    keyword: "false schema",
    data,
    schema: false,
    schemaCode: false,
    schemaValue: false,
    params: {},
    it
  };
  (0, errors_1$3.reportError)(cxt, boolError, void 0, overrideAllErrors);
}
var dataType = {};
var rules = {};
Object.defineProperty(rules, "__esModule", { value: true });
rules.getRules = rules.isJSONType = void 0;
const _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
const jsonTypes = new Set(_jsonTypes);
function isJSONType(x) {
  return typeof x == "string" && jsonTypes.has(x);
}
rules.isJSONType = isJSONType;
function getRules() {
  const groups = {
    number: { type: "number", rules: [] },
    string: { type: "string", rules: [] },
    array: { type: "array", rules: [] },
    object: { type: "object", rules: [] }
  };
  return {
    types: { ...groups, integer: true, boolean: true, null: true },
    rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
    post: { rules: [] },
    all: {},
    keywords: {}
  };
}
rules.getRules = getRules;
var applicability = {};
Object.defineProperty(applicability, "__esModule", { value: true });
applicability.shouldUseRule = applicability.shouldUseGroup = applicability.schemaHasRulesForType = void 0;
function schemaHasRulesForType({ schema: schema2, self }, type2) {
  const group = self.RULES.types[type2];
  return group && group !== true && shouldUseGroup(schema2, group);
}
applicability.schemaHasRulesForType = schemaHasRulesForType;
function shouldUseGroup(schema2, group) {
  return group.rules.some((rule) => shouldUseRule(schema2, rule));
}
applicability.shouldUseGroup = shouldUseGroup;
function shouldUseRule(schema2, rule) {
  var _a;
  return schema2[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema2[kwd] !== void 0));
}
applicability.shouldUseRule = shouldUseRule;
Object.defineProperty(dataType, "__esModule", { value: true });
dataType.reportTypeError = dataType.checkDataTypes = dataType.checkDataType = dataType.coerceAndCheckDataType = dataType.getJSONTypes = dataType.getSchemaTypes = dataType.DataType = void 0;
const rules_1 = rules;
const applicability_1$1 = applicability;
const errors_1$2 = errors;
const codegen_1$s = codegen;
const util_1$r = util;
var DataType;
(function(DataType2) {
  DataType2[DataType2["Correct"] = 0] = "Correct";
  DataType2[DataType2["Wrong"] = 1] = "Wrong";
})(DataType || (dataType.DataType = DataType = {}));
function getSchemaTypes(schema2) {
  const types2 = getJSONTypes(schema2.type);
  const hasNull = types2.includes("null");
  if (hasNull) {
    if (schema2.nullable === false)
      throw new Error("type: null contradicts nullable: false");
  } else {
    if (!types2.length && schema2.nullable !== void 0) {
      throw new Error('"nullable" cannot be used without "type"');
    }
    if (schema2.nullable === true)
      types2.push("null");
  }
  return types2;
}
dataType.getSchemaTypes = getSchemaTypes;
function getJSONTypes(ts) {
  const types2 = Array.isArray(ts) ? ts : ts ? [ts] : [];
  if (types2.every(rules_1.isJSONType))
    return types2;
  throw new Error("type must be JSONType or JSONType[]: " + types2.join(","));
}
dataType.getJSONTypes = getJSONTypes;
function coerceAndCheckDataType(it, types2) {
  const { gen, data, opts } = it;
  const coerceTo = coerceToTypes(types2, opts.coerceTypes);
  const checkTypes = types2.length > 0 && !(coerceTo.length === 0 && types2.length === 1 && (0, applicability_1$1.schemaHasRulesForType)(it, types2[0]));
  if (checkTypes) {
    const wrongType = checkDataTypes(types2, data, opts.strictNumbers, DataType.Wrong);
    gen.if(wrongType, () => {
      if (coerceTo.length)
        coerceData(it, types2, coerceTo);
      else
        reportTypeError(it);
    });
  }
  return checkTypes;
}
dataType.coerceAndCheckDataType = coerceAndCheckDataType;
const COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
function coerceToTypes(types2, coerceTypes) {
  return coerceTypes ? types2.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
}
function coerceData(it, types2, coerceTo) {
  const { gen, data, opts } = it;
  const dataType2 = gen.let("dataType", (0, codegen_1$s._)`typeof ${data}`);
  const coerced = gen.let("coerced", (0, codegen_1$s._)`undefined`);
  if (opts.coerceTypes === "array") {
    gen.if((0, codegen_1$s._)`${dataType2} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1$s._)`${data}[0]`).assign(dataType2, (0, codegen_1$s._)`typeof ${data}`).if(checkDataTypes(types2, data, opts.strictNumbers), () => gen.assign(coerced, data)));
  }
  gen.if((0, codegen_1$s._)`${coerced} !== undefined`);
  for (const t of coerceTo) {
    if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
      coerceSpecificType(t);
    }
  }
  gen.else();
  reportTypeError(it);
  gen.endIf();
  gen.if((0, codegen_1$s._)`${coerced} !== undefined`, () => {
    gen.assign(data, coerced);
    assignParentData(it, coerced);
  });
  function coerceSpecificType(t) {
    switch (t) {
      case "string":
        gen.elseIf((0, codegen_1$s._)`${dataType2} == "number" || ${dataType2} == "boolean"`).assign(coerced, (0, codegen_1$s._)`"" + ${data}`).elseIf((0, codegen_1$s._)`${data} === null`).assign(coerced, (0, codegen_1$s._)`""`);
        return;
      case "number":
        gen.elseIf((0, codegen_1$s._)`${dataType2} == "boolean" || ${data} === null
              || (${dataType2} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1$s._)`+${data}`);
        return;
      case "integer":
        gen.elseIf((0, codegen_1$s._)`${dataType2} === "boolean" || ${data} === null
              || (${dataType2} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1$s._)`+${data}`);
        return;
      case "boolean":
        gen.elseIf((0, codegen_1$s._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1$s._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
        return;
      case "null":
        gen.elseIf((0, codegen_1$s._)`${data} === "" || ${data} === 0 || ${data} === false`);
        gen.assign(coerced, null);
        return;
      case "array":
        gen.elseIf((0, codegen_1$s._)`${dataType2} === "string" || ${dataType2} === "number"
              || ${dataType2} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1$s._)`[${data}]`);
    }
  }
}
function assignParentData({ gen, parentData, parentDataProperty }, expr) {
  gen.if((0, codegen_1$s._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1$s._)`${parentData}[${parentDataProperty}]`, expr));
}
function checkDataType(dataType2, data, strictNums, correct = DataType.Correct) {
  const EQ = correct === DataType.Correct ? codegen_1$s.operators.EQ : codegen_1$s.operators.NEQ;
  let cond;
  switch (dataType2) {
    case "null":
      return (0, codegen_1$s._)`${data} ${EQ} null`;
    case "array":
      cond = (0, codegen_1$s._)`Array.isArray(${data})`;
      break;
    case "object":
      cond = (0, codegen_1$s._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
      break;
    case "integer":
      cond = numCond((0, codegen_1$s._)`!(${data} % 1) && !isNaN(${data})`);
      break;
    case "number":
      cond = numCond();
      break;
    default:
      return (0, codegen_1$s._)`typeof ${data} ${EQ} ${dataType2}`;
  }
  return correct === DataType.Correct ? cond : (0, codegen_1$s.not)(cond);
  function numCond(_cond = codegen_1$s.nil) {
    return (0, codegen_1$s.and)((0, codegen_1$s._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1$s._)`isFinite(${data})` : codegen_1$s.nil);
  }
}
dataType.checkDataType = checkDataType;
function checkDataTypes(dataTypes, data, strictNums, correct) {
  if (dataTypes.length === 1) {
    return checkDataType(dataTypes[0], data, strictNums, correct);
  }
  let cond;
  const types2 = (0, util_1$r.toHash)(dataTypes);
  if (types2.array && types2.object) {
    const notObj = (0, codegen_1$s._)`typeof ${data} != "object"`;
    cond = types2.null ? notObj : (0, codegen_1$s._)`!${data} || ${notObj}`;
    delete types2.null;
    delete types2.array;
    delete types2.object;
  } else {
    cond = codegen_1$s.nil;
  }
  if (types2.number)
    delete types2.integer;
  for (const t in types2)
    cond = (0, codegen_1$s.and)(cond, checkDataType(t, data, strictNums, correct));
  return cond;
}
dataType.checkDataTypes = checkDataTypes;
const typeError = {
  message: ({ schema: schema2 }) => `must be ${schema2}`,
  params: ({ schema: schema2, schemaValue }) => typeof schema2 == "string" ? (0, codegen_1$s._)`{type: ${schema2}}` : (0, codegen_1$s._)`{type: ${schemaValue}}`
};
function reportTypeError(it) {
  const cxt = getTypeErrorContext(it);
  (0, errors_1$2.reportError)(cxt, typeError);
}
dataType.reportTypeError = reportTypeError;
function getTypeErrorContext(it) {
  const { gen, data, schema: schema2 } = it;
  const schemaCode = (0, util_1$r.schemaRefOrVal)(it, schema2, "type");
  return {
    gen,
    keyword: "type",
    data,
    schema: schema2.type,
    schemaCode,
    schemaValue: schemaCode,
    parentSchema: schema2,
    params: {},
    it
  };
}
var defaults = {};
Object.defineProperty(defaults, "__esModule", { value: true });
defaults.assignDefaults = void 0;
const codegen_1$r = codegen;
const util_1$q = util;
function assignDefaults(it, ty) {
  const { properties: properties2, items: items2 } = it.schema;
  if (ty === "object" && properties2) {
    for (const key in properties2) {
      assignDefault(it, key, properties2[key].default);
    }
  } else if (ty === "array" && Array.isArray(items2)) {
    items2.forEach((sch, i) => assignDefault(it, i, sch.default));
  }
}
defaults.assignDefaults = assignDefaults;
function assignDefault(it, prop, defaultValue) {
  const { gen, compositeRule, data, opts } = it;
  if (defaultValue === void 0)
    return;
  const childData = (0, codegen_1$r._)`${data}${(0, codegen_1$r.getProperty)(prop)}`;
  if (compositeRule) {
    (0, util_1$q.checkStrictMode)(it, `default is ignored for: ${childData}`);
    return;
  }
  let condition = (0, codegen_1$r._)`${childData} === undefined`;
  if (opts.useDefaults === "empty") {
    condition = (0, codegen_1$r._)`${condition} || ${childData} === null || ${childData} === ""`;
  }
  gen.if(condition, (0, codegen_1$r._)`${childData} = ${(0, codegen_1$r.stringify)(defaultValue)}`);
}
var keyword = {};
var code = {};
Object.defineProperty(code, "__esModule", { value: true });
code.validateUnion = code.validateArray = code.usePattern = code.callValidateCode = code.schemaProperties = code.allSchemaProperties = code.noPropertyInData = code.propertyInData = code.isOwnProperty = code.hasPropFunc = code.reportMissingProp = code.checkMissingProp = code.checkReportMissingProp = void 0;
const codegen_1$q = codegen;
const util_1$p = util;
const names_1$5 = names$1;
const util_2$1 = util;
function checkReportMissingProp(cxt, prop) {
  const { gen, data, it } = cxt;
  gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
    cxt.setParams({ missingProperty: (0, codegen_1$q._)`${prop}` }, true);
    cxt.error();
  });
}
code.checkReportMissingProp = checkReportMissingProp;
function checkMissingProp({ gen, data, it: { opts } }, properties2, missing) {
  return (0, codegen_1$q.or)(...properties2.map((prop) => (0, codegen_1$q.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1$q._)`${missing} = ${prop}`)));
}
code.checkMissingProp = checkMissingProp;
function reportMissingProp(cxt, missing) {
  cxt.setParams({ missingProperty: missing }, true);
  cxt.error();
}
code.reportMissingProp = reportMissingProp;
function hasPropFunc(gen) {
  return gen.scopeValue("func", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ref: Object.prototype.hasOwnProperty,
    code: (0, codegen_1$q._)`Object.prototype.hasOwnProperty`
  });
}
code.hasPropFunc = hasPropFunc;
function isOwnProperty(gen, data, property) {
  return (0, codegen_1$q._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
}
code.isOwnProperty = isOwnProperty;
function propertyInData(gen, data, property, ownProperties) {
  const cond = (0, codegen_1$q._)`${data}${(0, codegen_1$q.getProperty)(property)} !== undefined`;
  return ownProperties ? (0, codegen_1$q._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
}
code.propertyInData = propertyInData;
function noPropertyInData(gen, data, property, ownProperties) {
  const cond = (0, codegen_1$q._)`${data}${(0, codegen_1$q.getProperty)(property)} === undefined`;
  return ownProperties ? (0, codegen_1$q.or)(cond, (0, codegen_1$q.not)(isOwnProperty(gen, data, property))) : cond;
}
code.noPropertyInData = noPropertyInData;
function allSchemaProperties(schemaMap) {
  return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
}
code.allSchemaProperties = allSchemaProperties;
function schemaProperties(it, schemaMap) {
  return allSchemaProperties(schemaMap).filter((p) => !(0, util_1$p.alwaysValidSchema)(it, schemaMap[p]));
}
code.schemaProperties = schemaProperties;
function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
  const dataAndSchema = passSchema ? (0, codegen_1$q._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
  const valCxt = [
    [names_1$5.default.instancePath, (0, codegen_1$q.strConcat)(names_1$5.default.instancePath, errorPath)],
    [names_1$5.default.parentData, it.parentData],
    [names_1$5.default.parentDataProperty, it.parentDataProperty],
    [names_1$5.default.rootData, names_1$5.default.rootData]
  ];
  if (it.opts.dynamicRef)
    valCxt.push([names_1$5.default.dynamicAnchors, names_1$5.default.dynamicAnchors]);
  const args = (0, codegen_1$q._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
  return context !== codegen_1$q.nil ? (0, codegen_1$q._)`${func}.call(${context}, ${args})` : (0, codegen_1$q._)`${func}(${args})`;
}
code.callValidateCode = callValidateCode;
const newRegExp = (0, codegen_1$q._)`new RegExp`;
function usePattern({ gen, it: { opts } }, pattern2) {
  const u = opts.unicodeRegExp ? "u" : "";
  const { regExp } = opts.code;
  const rx = regExp(pattern2, u);
  return gen.scopeValue("pattern", {
    key: rx.toString(),
    ref: rx,
    code: (0, codegen_1$q._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2$1.useFunc)(gen, regExp)}(${pattern2}, ${u})`
  });
}
code.usePattern = usePattern;
function validateArray(cxt) {
  const { gen, data, keyword: keyword2, it } = cxt;
  const valid = gen.name("valid");
  if (it.allErrors) {
    const validArr = gen.let("valid", true);
    validateItems(() => gen.assign(validArr, false));
    return validArr;
  }
  gen.var(valid, true);
  validateItems(() => gen.break());
  return valid;
  function validateItems(notValid) {
    const len = gen.const("len", (0, codegen_1$q._)`${data}.length`);
    gen.forRange("i", 0, len, (i) => {
      cxt.subschema({
        keyword: keyword2,
        dataProp: i,
        dataPropType: util_1$p.Type.Num
      }, valid);
      gen.if((0, codegen_1$q.not)(valid), notValid);
    });
  }
}
code.validateArray = validateArray;
function validateUnion(cxt) {
  const { gen, schema: schema2, keyword: keyword2, it } = cxt;
  if (!Array.isArray(schema2))
    throw new Error("ajv implementation error");
  const alwaysValid = schema2.some((sch) => (0, util_1$p.alwaysValidSchema)(it, sch));
  if (alwaysValid && !it.opts.unevaluated)
    return;
  const valid = gen.let("valid", false);
  const schValid = gen.name("_valid");
  gen.block(() => schema2.forEach((_sch, i) => {
    const schCxt = cxt.subschema({
      keyword: keyword2,
      schemaProp: i,
      compositeRule: true
    }, schValid);
    gen.assign(valid, (0, codegen_1$q._)`${valid} || ${schValid}`);
    const merged = cxt.mergeValidEvaluated(schCxt, schValid);
    if (!merged)
      gen.if((0, codegen_1$q.not)(valid));
  }));
  cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
}
code.validateUnion = validateUnion;
Object.defineProperty(keyword, "__esModule", { value: true });
keyword.validateKeywordUsage = keyword.validSchemaType = keyword.funcKeywordCode = keyword.macroKeywordCode = void 0;
const codegen_1$p = codegen;
const names_1$4 = names$1;
const code_1$9 = code;
const errors_1$1 = errors;
function macroKeywordCode(cxt, def2) {
  const { gen, keyword: keyword2, schema: schema2, parentSchema, it } = cxt;
  const macroSchema = def2.macro.call(it.self, schema2, parentSchema, it);
  const schemaRef = useKeyword(gen, keyword2, macroSchema);
  if (it.opts.validateSchema !== false)
    it.self.validateSchema(macroSchema, true);
  const valid = gen.name("valid");
  cxt.subschema({
    schema: macroSchema,
    schemaPath: codegen_1$p.nil,
    errSchemaPath: `${it.errSchemaPath}/${keyword2}`,
    topSchemaRef: schemaRef,
    compositeRule: true
  }, valid);
  cxt.pass(valid, () => cxt.error(true));
}
keyword.macroKeywordCode = macroKeywordCode;
function funcKeywordCode(cxt, def2) {
  var _a;
  const { gen, keyword: keyword2, schema: schema2, parentSchema, $data, it } = cxt;
  checkAsyncKeyword(it, def2);
  const validate2 = !$data && def2.compile ? def2.compile.call(it.self, schema2, parentSchema, it) : def2.validate;
  const validateRef = useKeyword(gen, keyword2, validate2);
  const valid = gen.let("valid");
  cxt.block$data(valid, validateKeyword);
  cxt.ok((_a = def2.valid) !== null && _a !== void 0 ? _a : valid);
  function validateKeyword() {
    if (def2.errors === false) {
      assignValid();
      if (def2.modifying)
        modifyData(cxt);
      reportErrs(() => cxt.error());
    } else {
      const ruleErrs = def2.async ? validateAsync() : validateSync();
      if (def2.modifying)
        modifyData(cxt);
      reportErrs(() => addErrs(cxt, ruleErrs));
    }
  }
  function validateAsync() {
    const ruleErrs = gen.let("ruleErrs", null);
    gen.try(() => assignValid((0, codegen_1$p._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1$p._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1$p._)`${e}.errors`), () => gen.throw(e)));
    return ruleErrs;
  }
  function validateSync() {
    const validateErrs = (0, codegen_1$p._)`${validateRef}.errors`;
    gen.assign(validateErrs, null);
    assignValid(codegen_1$p.nil);
    return validateErrs;
  }
  function assignValid(_await = def2.async ? (0, codegen_1$p._)`await ` : codegen_1$p.nil) {
    const passCxt = it.opts.passContext ? names_1$4.default.this : names_1$4.default.self;
    const passSchema = !("compile" in def2 && !$data || def2.schema === false);
    gen.assign(valid, (0, codegen_1$p._)`${_await}${(0, code_1$9.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def2.modifying);
  }
  function reportErrs(errors2) {
    var _a2;
    gen.if((0, codegen_1$p.not)((_a2 = def2.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors2);
  }
}
keyword.funcKeywordCode = funcKeywordCode;
function modifyData(cxt) {
  const { gen, data, it } = cxt;
  gen.if(it.parentData, () => gen.assign(data, (0, codegen_1$p._)`${it.parentData}[${it.parentDataProperty}]`));
}
function addErrs(cxt, errs) {
  const { gen } = cxt;
  gen.if((0, codegen_1$p._)`Array.isArray(${errs})`, () => {
    gen.assign(names_1$4.default.vErrors, (0, codegen_1$p._)`${names_1$4.default.vErrors} === null ? ${errs} : ${names_1$4.default.vErrors}.concat(${errs})`).assign(names_1$4.default.errors, (0, codegen_1$p._)`${names_1$4.default.vErrors}.length`);
    (0, errors_1$1.extendErrors)(cxt);
  }, () => cxt.error());
}
function checkAsyncKeyword({ schemaEnv }, def2) {
  if (def2.async && !schemaEnv.$async)
    throw new Error("async keyword in sync schema");
}
function useKeyword(gen, keyword2, result) {
  if (result === void 0)
    throw new Error(`keyword "${keyword2}" failed to compile`);
  return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1$p.stringify)(result) });
}
function validSchemaType(schema2, schemaType, allowUndefined = false) {
  return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema2) : st === "object" ? schema2 && typeof schema2 == "object" && !Array.isArray(schema2) : typeof schema2 == st || allowUndefined && typeof schema2 == "undefined");
}
keyword.validSchemaType = validSchemaType;
function validateKeywordUsage({ schema: schema2, opts, self, errSchemaPath }, def2, keyword2) {
  if (Array.isArray(def2.keyword) ? !def2.keyword.includes(keyword2) : def2.keyword !== keyword2) {
    throw new Error("ajv implementation error");
  }
  const deps = def2.dependencies;
  if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema2, kwd))) {
    throw new Error(`parent schema must have dependencies of ${keyword2}: ${deps.join(",")}`);
  }
  if (def2.validateSchema) {
    const valid = def2.validateSchema(schema2[keyword2]);
    if (!valid) {
      const msg = `keyword "${keyword2}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def2.validateSchema.errors);
      if (opts.validateSchema === "log")
        self.logger.error(msg);
      else
        throw new Error(msg);
    }
  }
}
keyword.validateKeywordUsage = validateKeywordUsage;
var subschema = {};
Object.defineProperty(subschema, "__esModule", { value: true });
subschema.extendSubschemaMode = subschema.extendSubschemaData = subschema.getSubschema = void 0;
const codegen_1$o = codegen;
const util_1$o = util;
function getSubschema(it, { keyword: keyword2, schemaProp, schema: schema2, schemaPath, errSchemaPath, topSchemaRef }) {
  if (keyword2 !== void 0 && schema2 !== void 0) {
    throw new Error('both "keyword" and "schema" passed, only one allowed');
  }
  if (keyword2 !== void 0) {
    const sch = it.schema[keyword2];
    return schemaProp === void 0 ? {
      schema: sch,
      schemaPath: (0, codegen_1$o._)`${it.schemaPath}${(0, codegen_1$o.getProperty)(keyword2)}`,
      errSchemaPath: `${it.errSchemaPath}/${keyword2}`
    } : {
      schema: sch[schemaProp],
      schemaPath: (0, codegen_1$o._)`${it.schemaPath}${(0, codegen_1$o.getProperty)(keyword2)}${(0, codegen_1$o.getProperty)(schemaProp)}`,
      errSchemaPath: `${it.errSchemaPath}/${keyword2}/${(0, util_1$o.escapeFragment)(schemaProp)}`
    };
  }
  if (schema2 !== void 0) {
    if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
      throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
    }
    return {
      schema: schema2,
      schemaPath,
      topSchemaRef,
      errSchemaPath
    };
  }
  throw new Error('either "keyword" or "schema" must be passed');
}
subschema.getSubschema = getSubschema;
function extendSubschemaData(subschema2, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
  if (data !== void 0 && dataProp !== void 0) {
    throw new Error('both "data" and "dataProp" passed, only one allowed');
  }
  const { gen } = it;
  if (dataProp !== void 0) {
    const { errorPath, dataPathArr, opts } = it;
    const nextData = gen.let("data", (0, codegen_1$o._)`${it.data}${(0, codegen_1$o.getProperty)(dataProp)}`, true);
    dataContextProps(nextData);
    subschema2.errorPath = (0, codegen_1$o.str)`${errorPath}${(0, util_1$o.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
    subschema2.parentDataProperty = (0, codegen_1$o._)`${dataProp}`;
    subschema2.dataPathArr = [...dataPathArr, subschema2.parentDataProperty];
  }
  if (data !== void 0) {
    const nextData = data instanceof codegen_1$o.Name ? data : gen.let("data", data, true);
    dataContextProps(nextData);
    if (propertyName !== void 0)
      subschema2.propertyName = propertyName;
  }
  if (dataTypes)
    subschema2.dataTypes = dataTypes;
  function dataContextProps(_nextData) {
    subschema2.data = _nextData;
    subschema2.dataLevel = it.dataLevel + 1;
    subschema2.dataTypes = [];
    it.definedProperties = /* @__PURE__ */ new Set();
    subschema2.parentData = it.data;
    subschema2.dataNames = [...it.dataNames, _nextData];
  }
}
subschema.extendSubschemaData = extendSubschemaData;
function extendSubschemaMode(subschema2, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
  if (compositeRule !== void 0)
    subschema2.compositeRule = compositeRule;
  if (createErrors !== void 0)
    subschema2.createErrors = createErrors;
  if (allErrors !== void 0)
    subschema2.allErrors = allErrors;
  subschema2.jtdDiscriminator = jtdDiscriminator;
  subschema2.jtdMetadata = jtdMetadata;
}
subschema.extendSubschemaMode = extendSubschemaMode;
var resolve$2 = {};
var fastDeepEqual = function equal(a, b) {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;
    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; )
        if (!equal(a[i], b[i])) return false;
      return true;
    }
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    for (i = length; i-- !== 0; ) {
      var key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }
    return true;
  }
  return a !== a && b !== b;
};
var jsonSchemaTraverse = { exports: {} };
var traverse$1 = jsonSchemaTraverse.exports = function(schema2, opts, cb) {
  if (typeof opts == "function") {
    cb = opts;
    opts = {};
  }
  cb = opts.cb || cb;
  var pre = typeof cb == "function" ? cb : cb.pre || function() {
  };
  var post = cb.post || function() {
  };
  _traverse(opts, pre, post, schema2, "", schema2);
};
traverse$1.keywords = {
  additionalItems: true,
  items: true,
  contains: true,
  additionalProperties: true,
  propertyNames: true,
  not: true,
  if: true,
  then: true,
  else: true
};
traverse$1.arrayKeywords = {
  items: true,
  allOf: true,
  anyOf: true,
  oneOf: true
};
traverse$1.propsKeywords = {
  $defs: true,
  definitions: true,
  properties: true,
  patternProperties: true,
  dependencies: true
};
traverse$1.skipKeywords = {
  default: true,
  enum: true,
  const: true,
  required: true,
  maximum: true,
  minimum: true,
  exclusiveMaximum: true,
  exclusiveMinimum: true,
  multipleOf: true,
  maxLength: true,
  minLength: true,
  pattern: true,
  format: true,
  maxItems: true,
  minItems: true,
  uniqueItems: true,
  maxProperties: true,
  minProperties: true
};
function _traverse(opts, pre, post, schema2, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
  if (schema2 && typeof schema2 == "object" && !Array.isArray(schema2)) {
    pre(schema2, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    for (var key in schema2) {
      var sch = schema2[key];
      if (Array.isArray(sch)) {
        if (key in traverse$1.arrayKeywords) {
          for (var i = 0; i < sch.length; i++)
            _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema2, i);
        }
      } else if (key in traverse$1.propsKeywords) {
        if (sch && typeof sch == "object") {
          for (var prop in sch)
            _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema2, prop);
        }
      } else if (key in traverse$1.keywords || opts.allKeys && !(key in traverse$1.skipKeywords)) {
        _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema2);
      }
    }
    post(schema2, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
  }
}
function escapeJsonPtr(str2) {
  return str2.replace(/~/g, "~0").replace(/\//g, "~1");
}
var jsonSchemaTraverseExports = jsonSchemaTraverse.exports;
Object.defineProperty(resolve$2, "__esModule", { value: true });
resolve$2.getSchemaRefs = resolve$2.resolveUrl = resolve$2.normalizeId = resolve$2._getFullPath = resolve$2.getFullPath = resolve$2.inlineRef = void 0;
const util_1$n = util;
const equal$3 = fastDeepEqual;
const traverse = jsonSchemaTraverseExports;
const SIMPLE_INLINED = /* @__PURE__ */ new Set([
  "type",
  "format",
  "pattern",
  "maxLength",
  "minLength",
  "maxProperties",
  "minProperties",
  "maxItems",
  "minItems",
  "maximum",
  "minimum",
  "uniqueItems",
  "multipleOf",
  "required",
  "enum",
  "const"
]);
function inlineRef(schema2, limit = true) {
  if (typeof schema2 == "boolean")
    return true;
  if (limit === true)
    return !hasRef(schema2);
  if (!limit)
    return false;
  return countKeys(schema2) <= limit;
}
resolve$2.inlineRef = inlineRef;
const REF_KEYWORDS = /* @__PURE__ */ new Set([
  "$ref",
  "$recursiveRef",
  "$recursiveAnchor",
  "$dynamicRef",
  "$dynamicAnchor"
]);
function hasRef(schema2) {
  for (const key in schema2) {
    if (REF_KEYWORDS.has(key))
      return true;
    const sch = schema2[key];
    if (Array.isArray(sch) && sch.some(hasRef))
      return true;
    if (typeof sch == "object" && hasRef(sch))
      return true;
  }
  return false;
}
function countKeys(schema2) {
  let count = 0;
  for (const key in schema2) {
    if (key === "$ref")
      return Infinity;
    count++;
    if (SIMPLE_INLINED.has(key))
      continue;
    if (typeof schema2[key] == "object") {
      (0, util_1$n.eachItem)(schema2[key], (sch) => count += countKeys(sch));
    }
    if (count === Infinity)
      return Infinity;
  }
  return count;
}
function getFullPath(resolver, id2 = "", normalize2) {
  if (normalize2 !== false)
    id2 = normalizeId(id2);
  const p = resolver.parse(id2);
  return _getFullPath(resolver, p);
}
resolve$2.getFullPath = getFullPath;
function _getFullPath(resolver, p) {
  const serialized = resolver.serialize(p);
  return serialized.split("#")[0] + "#";
}
resolve$2._getFullPath = _getFullPath;
const TRAILING_SLASH_HASH = /#\/?$/;
function normalizeId(id2) {
  return id2 ? id2.replace(TRAILING_SLASH_HASH, "") : "";
}
resolve$2.normalizeId = normalizeId;
function resolveUrl(resolver, baseId, id2) {
  id2 = normalizeId(id2);
  return resolver.resolve(baseId, id2);
}
resolve$2.resolveUrl = resolveUrl;
const ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
function getSchemaRefs(schema2, baseId) {
  if (typeof schema2 == "boolean")
    return {};
  const { schemaId, uriResolver } = this.opts;
  const schId = normalizeId(schema2[schemaId] || baseId);
  const baseIds = { "": schId };
  const pathPrefix = getFullPath(uriResolver, schId, false);
  const localRefs = {};
  const schemaRefs = /* @__PURE__ */ new Set();
  traverse(schema2, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
    if (parentJsonPtr === void 0)
      return;
    const fullPath = pathPrefix + jsonPtr;
    let innerBaseId = baseIds[parentJsonPtr];
    if (typeof sch[schemaId] == "string")
      innerBaseId = addRef.call(this, sch[schemaId]);
    addAnchor.call(this, sch.$anchor);
    addAnchor.call(this, sch.$dynamicAnchor);
    baseIds[jsonPtr] = innerBaseId;
    function addRef(ref2) {
      const _resolve = this.opts.uriResolver.resolve;
      ref2 = normalizeId(innerBaseId ? _resolve(innerBaseId, ref2) : ref2);
      if (schemaRefs.has(ref2))
        throw ambiguos(ref2);
      schemaRefs.add(ref2);
      let schOrRef = this.refs[ref2];
      if (typeof schOrRef == "string")
        schOrRef = this.refs[schOrRef];
      if (typeof schOrRef == "object") {
        checkAmbiguosRef(sch, schOrRef.schema, ref2);
      } else if (ref2 !== normalizeId(fullPath)) {
        if (ref2[0] === "#") {
          checkAmbiguosRef(sch, localRefs[ref2], ref2);
          localRefs[ref2] = sch;
        } else {
          this.refs[ref2] = fullPath;
        }
      }
      return ref2;
    }
    function addAnchor(anchor) {
      if (typeof anchor == "string") {
        if (!ANCHOR.test(anchor))
          throw new Error(`invalid anchor "${anchor}"`);
        addRef.call(this, `#${anchor}`);
      }
    }
  });
  return localRefs;
  function checkAmbiguosRef(sch1, sch2, ref2) {
    if (sch2 !== void 0 && !equal$3(sch1, sch2))
      throw ambiguos(ref2);
  }
  function ambiguos(ref2) {
    return new Error(`reference "${ref2}" resolves to more than one schema`);
  }
}
resolve$2.getSchemaRefs = getSchemaRefs;
Object.defineProperty(validate, "__esModule", { value: true });
validate.getData = validate.KeywordCxt = validate.validateFunctionCode = void 0;
const boolSchema_1 = boolSchema;
const dataType_1$1 = dataType;
const applicability_1 = applicability;
const dataType_2 = dataType;
const defaults_1 = defaults;
const keyword_1 = keyword;
const subschema_1 = subschema;
const codegen_1$n = codegen;
const names_1$3 = names$1;
const resolve_1$2 = resolve$2;
const util_1$m = util;
const errors_1 = errors;
function validateFunctionCode(it) {
  if (isSchemaObj(it)) {
    checkKeywords(it);
    if (schemaCxtHasRules(it)) {
      topSchemaObjCode(it);
      return;
    }
  }
  validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
}
validate.validateFunctionCode = validateFunctionCode;
function validateFunction({ gen, validateName, schema: schema2, schemaEnv, opts }, body) {
  if (opts.code.es5) {
    gen.func(validateName, (0, codegen_1$n._)`${names_1$3.default.data}, ${names_1$3.default.valCxt}`, schemaEnv.$async, () => {
      gen.code((0, codegen_1$n._)`"use strict"; ${funcSourceUrl(schema2, opts)}`);
      destructureValCxtES5(gen, opts);
      gen.code(body);
    });
  } else {
    gen.func(validateName, (0, codegen_1$n._)`${names_1$3.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema2, opts)).code(body));
  }
}
function destructureValCxt(opts) {
  return (0, codegen_1$n._)`{${names_1$3.default.instancePath}="", ${names_1$3.default.parentData}, ${names_1$3.default.parentDataProperty}, ${names_1$3.default.rootData}=${names_1$3.default.data}${opts.dynamicRef ? (0, codegen_1$n._)`, ${names_1$3.default.dynamicAnchors}={}` : codegen_1$n.nil}}={}`;
}
function destructureValCxtES5(gen, opts) {
  gen.if(names_1$3.default.valCxt, () => {
    gen.var(names_1$3.default.instancePath, (0, codegen_1$n._)`${names_1$3.default.valCxt}.${names_1$3.default.instancePath}`);
    gen.var(names_1$3.default.parentData, (0, codegen_1$n._)`${names_1$3.default.valCxt}.${names_1$3.default.parentData}`);
    gen.var(names_1$3.default.parentDataProperty, (0, codegen_1$n._)`${names_1$3.default.valCxt}.${names_1$3.default.parentDataProperty}`);
    gen.var(names_1$3.default.rootData, (0, codegen_1$n._)`${names_1$3.default.valCxt}.${names_1$3.default.rootData}`);
    if (opts.dynamicRef)
      gen.var(names_1$3.default.dynamicAnchors, (0, codegen_1$n._)`${names_1$3.default.valCxt}.${names_1$3.default.dynamicAnchors}`);
  }, () => {
    gen.var(names_1$3.default.instancePath, (0, codegen_1$n._)`""`);
    gen.var(names_1$3.default.parentData, (0, codegen_1$n._)`undefined`);
    gen.var(names_1$3.default.parentDataProperty, (0, codegen_1$n._)`undefined`);
    gen.var(names_1$3.default.rootData, names_1$3.default.data);
    if (opts.dynamicRef)
      gen.var(names_1$3.default.dynamicAnchors, (0, codegen_1$n._)`{}`);
  });
}
function topSchemaObjCode(it) {
  const { schema: schema2, opts, gen } = it;
  validateFunction(it, () => {
    if (opts.$comment && schema2.$comment)
      commentKeyword(it);
    checkNoDefault(it);
    gen.let(names_1$3.default.vErrors, null);
    gen.let(names_1$3.default.errors, 0);
    if (opts.unevaluated)
      resetEvaluated(it);
    typeAndKeywords(it);
    returnResults(it);
  });
  return;
}
function resetEvaluated(it) {
  const { gen, validateName } = it;
  it.evaluated = gen.const("evaluated", (0, codegen_1$n._)`${validateName}.evaluated`);
  gen.if((0, codegen_1$n._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1$n._)`${it.evaluated}.props`, (0, codegen_1$n._)`undefined`));
  gen.if((0, codegen_1$n._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1$n._)`${it.evaluated}.items`, (0, codegen_1$n._)`undefined`));
}
function funcSourceUrl(schema2, opts) {
  const schId = typeof schema2 == "object" && schema2[opts.schemaId];
  return schId && (opts.code.source || opts.code.process) ? (0, codegen_1$n._)`/*# sourceURL=${schId} */` : codegen_1$n.nil;
}
function subschemaCode(it, valid) {
  if (isSchemaObj(it)) {
    checkKeywords(it);
    if (schemaCxtHasRules(it)) {
      subSchemaObjCode(it, valid);
      return;
    }
  }
  (0, boolSchema_1.boolOrEmptySchema)(it, valid);
}
function schemaCxtHasRules({ schema: schema2, self }) {
  if (typeof schema2 == "boolean")
    return !schema2;
  for (const key in schema2)
    if (self.RULES.all[key])
      return true;
  return false;
}
function isSchemaObj(it) {
  return typeof it.schema != "boolean";
}
function subSchemaObjCode(it, valid) {
  const { schema: schema2, gen, opts } = it;
  if (opts.$comment && schema2.$comment)
    commentKeyword(it);
  updateContext(it);
  checkAsyncSchema(it);
  const errsCount = gen.const("_errs", names_1$3.default.errors);
  typeAndKeywords(it, errsCount);
  gen.var(valid, (0, codegen_1$n._)`${errsCount} === ${names_1$3.default.errors}`);
}
function checkKeywords(it) {
  (0, util_1$m.checkUnknownRules)(it);
  checkRefsAndKeywords(it);
}
function typeAndKeywords(it, errsCount) {
  if (it.opts.jtd)
    return schemaKeywords(it, [], false, errsCount);
  const types2 = (0, dataType_1$1.getSchemaTypes)(it.schema);
  const checkedTypes = (0, dataType_1$1.coerceAndCheckDataType)(it, types2);
  schemaKeywords(it, types2, !checkedTypes, errsCount);
}
function checkRefsAndKeywords(it) {
  const { schema: schema2, errSchemaPath, opts, self } = it;
  if (schema2.$ref && opts.ignoreKeywordsWithRef && (0, util_1$m.schemaHasRulesButRef)(schema2, self.RULES)) {
    self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
  }
}
function checkNoDefault(it) {
  const { schema: schema2, opts } = it;
  if (schema2.default !== void 0 && opts.useDefaults && opts.strictSchema) {
    (0, util_1$m.checkStrictMode)(it, "default is ignored in the schema root");
  }
}
function updateContext(it) {
  const schId = it.schema[it.opts.schemaId];
  if (schId)
    it.baseId = (0, resolve_1$2.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
}
function checkAsyncSchema(it) {
  if (it.schema.$async && !it.schemaEnv.$async)
    throw new Error("async schema in sync schema");
}
function commentKeyword({ gen, schemaEnv, schema: schema2, errSchemaPath, opts }) {
  const msg = schema2.$comment;
  if (opts.$comment === true) {
    gen.code((0, codegen_1$n._)`${names_1$3.default.self}.logger.log(${msg})`);
  } else if (typeof opts.$comment == "function") {
    const schemaPath = (0, codegen_1$n.str)`${errSchemaPath}/$comment`;
    const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
    gen.code((0, codegen_1$n._)`${names_1$3.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
  }
}
function returnResults(it) {
  const { gen, schemaEnv, validateName, ValidationError: ValidationError2, opts } = it;
  if (schemaEnv.$async) {
    gen.if((0, codegen_1$n._)`${names_1$3.default.errors} === 0`, () => gen.return(names_1$3.default.data), () => gen.throw((0, codegen_1$n._)`new ${ValidationError2}(${names_1$3.default.vErrors})`));
  } else {
    gen.assign((0, codegen_1$n._)`${validateName}.errors`, names_1$3.default.vErrors);
    if (opts.unevaluated)
      assignEvaluated(it);
    gen.return((0, codegen_1$n._)`${names_1$3.default.errors} === 0`);
  }
}
function assignEvaluated({ gen, evaluated, props, items: items2 }) {
  if (props instanceof codegen_1$n.Name)
    gen.assign((0, codegen_1$n._)`${evaluated}.props`, props);
  if (items2 instanceof codegen_1$n.Name)
    gen.assign((0, codegen_1$n._)`${evaluated}.items`, items2);
}
function schemaKeywords(it, types2, typeErrors, errsCount) {
  const { gen, schema: schema2, data, allErrors, opts, self } = it;
  const { RULES } = self;
  if (schema2.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1$m.schemaHasRulesButRef)(schema2, RULES))) {
    gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
    return;
  }
  if (!opts.jtd)
    checkStrictTypes(it, types2);
  gen.block(() => {
    for (const group of RULES.rules)
      groupKeywords(group);
    groupKeywords(RULES.post);
  });
  function groupKeywords(group) {
    if (!(0, applicability_1.shouldUseGroup)(schema2, group))
      return;
    if (group.type) {
      gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
      iterateKeywords(it, group);
      if (types2.length === 1 && types2[0] === group.type && typeErrors) {
        gen.else();
        (0, dataType_2.reportTypeError)(it);
      }
      gen.endIf();
    } else {
      iterateKeywords(it, group);
    }
    if (!allErrors)
      gen.if((0, codegen_1$n._)`${names_1$3.default.errors} === ${errsCount || 0}`);
  }
}
function iterateKeywords(it, group) {
  const { gen, schema: schema2, opts: { useDefaults } } = it;
  if (useDefaults)
    (0, defaults_1.assignDefaults)(it, group.type);
  gen.block(() => {
    for (const rule of group.rules) {
      if ((0, applicability_1.shouldUseRule)(schema2, rule)) {
        keywordCode(it, rule.keyword, rule.definition, group.type);
      }
    }
  });
}
function checkStrictTypes(it, types2) {
  if (it.schemaEnv.meta || !it.opts.strictTypes)
    return;
  checkContextTypes(it, types2);
  if (!it.opts.allowUnionTypes)
    checkMultipleTypes(it, types2);
  checkKeywordTypes(it, it.dataTypes);
}
function checkContextTypes(it, types2) {
  if (!types2.length)
    return;
  if (!it.dataTypes.length) {
    it.dataTypes = types2;
    return;
  }
  types2.forEach((t) => {
    if (!includesType(it.dataTypes, t)) {
      strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
    }
  });
  narrowSchemaTypes(it, types2);
}
function checkMultipleTypes(it, ts) {
  if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
    strictTypesError(it, "use allowUnionTypes to allow union type keyword");
  }
}
function checkKeywordTypes(it, ts) {
  const rules2 = it.self.RULES.all;
  for (const keyword2 in rules2) {
    const rule = rules2[keyword2];
    if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
      const { type: type2 } = rule.definition;
      if (type2.length && !type2.some((t) => hasApplicableType(ts, t))) {
        strictTypesError(it, `missing type "${type2.join(",")}" for keyword "${keyword2}"`);
      }
    }
  }
}
function hasApplicableType(schTs, kwdT) {
  return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
}
function includesType(ts, t) {
  return ts.includes(t) || t === "integer" && ts.includes("number");
}
function narrowSchemaTypes(it, withTypes) {
  const ts = [];
  for (const t of it.dataTypes) {
    if (includesType(withTypes, t))
      ts.push(t);
    else if (withTypes.includes("integer") && t === "number")
      ts.push("integer");
  }
  it.dataTypes = ts;
}
function strictTypesError(it, msg) {
  const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
  msg += ` at "${schemaPath}" (strictTypes)`;
  (0, util_1$m.checkStrictMode)(it, msg, it.opts.strictTypes);
}
class KeywordCxt {
  constructor(it, def2, keyword2) {
    (0, keyword_1.validateKeywordUsage)(it, def2, keyword2);
    this.gen = it.gen;
    this.allErrors = it.allErrors;
    this.keyword = keyword2;
    this.data = it.data;
    this.schema = it.schema[keyword2];
    this.$data = def2.$data && it.opts.$data && this.schema && this.schema.$data;
    this.schemaValue = (0, util_1$m.schemaRefOrVal)(it, this.schema, keyword2, this.$data);
    this.schemaType = def2.schemaType;
    this.parentSchema = it.schema;
    this.params = {};
    this.it = it;
    this.def = def2;
    if (this.$data) {
      this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
    } else {
      this.schemaCode = this.schemaValue;
      if (!(0, keyword_1.validSchemaType)(this.schema, def2.schemaType, def2.allowUndefined)) {
        throw new Error(`${keyword2} value must be ${JSON.stringify(def2.schemaType)}`);
      }
    }
    if ("code" in def2 ? def2.trackErrors : def2.errors !== false) {
      this.errsCount = it.gen.const("_errs", names_1$3.default.errors);
    }
  }
  result(condition, successAction, failAction) {
    this.failResult((0, codegen_1$n.not)(condition), successAction, failAction);
  }
  failResult(condition, successAction, failAction) {
    this.gen.if(condition);
    if (failAction)
      failAction();
    else
      this.error();
    if (successAction) {
      this.gen.else();
      successAction();
      if (this.allErrors)
        this.gen.endIf();
    } else {
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
  }
  pass(condition, failAction) {
    this.failResult((0, codegen_1$n.not)(condition), void 0, failAction);
  }
  fail(condition) {
    if (condition === void 0) {
      this.error();
      if (!this.allErrors)
        this.gen.if(false);
      return;
    }
    this.gen.if(condition);
    this.error();
    if (this.allErrors)
      this.gen.endIf();
    else
      this.gen.else();
  }
  fail$data(condition) {
    if (!this.$data)
      return this.fail(condition);
    const { schemaCode } = this;
    this.fail((0, codegen_1$n._)`${schemaCode} !== undefined && (${(0, codegen_1$n.or)(this.invalid$data(), condition)})`);
  }
  error(append, errorParams, errorPaths) {
    if (errorParams) {
      this.setParams(errorParams);
      this._error(append, errorPaths);
      this.setParams({});
      return;
    }
    this._error(append, errorPaths);
  }
  _error(append, errorPaths) {
    (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
  }
  $dataError() {
    (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
  }
  reset() {
    if (this.errsCount === void 0)
      throw new Error('add "trackErrors" to keyword definition');
    (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
  }
  ok(cond) {
    if (!this.allErrors)
      this.gen.if(cond);
  }
  setParams(obj, assign) {
    if (assign)
      Object.assign(this.params, obj);
    else
      this.params = obj;
  }
  block$data(valid, codeBlock, $dataValid = codegen_1$n.nil) {
    this.gen.block(() => {
      this.check$data(valid, $dataValid);
      codeBlock();
    });
  }
  check$data(valid = codegen_1$n.nil, $dataValid = codegen_1$n.nil) {
    if (!this.$data)
      return;
    const { gen, schemaCode, schemaType, def: def2 } = this;
    gen.if((0, codegen_1$n.or)((0, codegen_1$n._)`${schemaCode} === undefined`, $dataValid));
    if (valid !== codegen_1$n.nil)
      gen.assign(valid, true);
    if (schemaType.length || def2.validateSchema) {
      gen.elseIf(this.invalid$data());
      this.$dataError();
      if (valid !== codegen_1$n.nil)
        gen.assign(valid, false);
    }
    gen.else();
  }
  invalid$data() {
    const { gen, schemaCode, schemaType, def: def2, it } = this;
    return (0, codegen_1$n.or)(wrong$DataType(), invalid$DataSchema());
    function wrong$DataType() {
      if (schemaType.length) {
        if (!(schemaCode instanceof codegen_1$n.Name))
          throw new Error("ajv implementation error");
        const st = Array.isArray(schemaType) ? schemaType : [schemaType];
        return (0, codegen_1$n._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
      }
      return codegen_1$n.nil;
    }
    function invalid$DataSchema() {
      if (def2.validateSchema) {
        const validateSchemaRef = gen.scopeValue("validate$data", { ref: def2.validateSchema });
        return (0, codegen_1$n._)`!${validateSchemaRef}(${schemaCode})`;
      }
      return codegen_1$n.nil;
    }
  }
  subschema(appl, valid) {
    const subschema2 = (0, subschema_1.getSubschema)(this.it, appl);
    (0, subschema_1.extendSubschemaData)(subschema2, this.it, appl);
    (0, subschema_1.extendSubschemaMode)(subschema2, appl);
    const nextContext = { ...this.it, ...subschema2, items: void 0, props: void 0 };
    subschemaCode(nextContext, valid);
    return nextContext;
  }
  mergeEvaluated(schemaCxt, toName) {
    const { it, gen } = this;
    if (!it.opts.unevaluated)
      return;
    if (it.props !== true && schemaCxt.props !== void 0) {
      it.props = util_1$m.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
    }
    if (it.items !== true && schemaCxt.items !== void 0) {
      it.items = util_1$m.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
    }
  }
  mergeValidEvaluated(schemaCxt, valid) {
    const { it, gen } = this;
    if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
      gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1$n.Name));
      return true;
    }
  }
}
validate.KeywordCxt = KeywordCxt;
function keywordCode(it, keyword2, def2, ruleType) {
  const cxt = new KeywordCxt(it, def2, keyword2);
  if ("code" in def2) {
    def2.code(cxt, ruleType);
  } else if (cxt.$data && def2.validate) {
    (0, keyword_1.funcKeywordCode)(cxt, def2);
  } else if ("macro" in def2) {
    (0, keyword_1.macroKeywordCode)(cxt, def2);
  } else if (def2.compile || def2.validate) {
    (0, keyword_1.funcKeywordCode)(cxt, def2);
  }
}
const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
function getData($data, { dataLevel, dataNames, dataPathArr }) {
  let jsonPointer;
  let data;
  if ($data === "")
    return names_1$3.default.rootData;
  if ($data[0] === "/") {
    if (!JSON_POINTER.test($data))
      throw new Error(`Invalid JSON-pointer: ${$data}`);
    jsonPointer = $data;
    data = names_1$3.default.rootData;
  } else {
    const matches = RELATIVE_JSON_POINTER.exec($data);
    if (!matches)
      throw new Error(`Invalid JSON-pointer: ${$data}`);
    const up = +matches[1];
    jsonPointer = matches[2];
    if (jsonPointer === "#") {
      if (up >= dataLevel)
        throw new Error(errorMsg("property/index", up));
      return dataPathArr[dataLevel - up];
    }
    if (up > dataLevel)
      throw new Error(errorMsg("data", up));
    data = dataNames[dataLevel - up];
    if (!jsonPointer)
      return data;
  }
  let expr = data;
  const segments = jsonPointer.split("/");
  for (const segment of segments) {
    if (segment) {
      data = (0, codegen_1$n._)`${data}${(0, codegen_1$n.getProperty)((0, util_1$m.unescapeJsonPointer)(segment))}`;
      expr = (0, codegen_1$n._)`${expr} && ${data}`;
    }
  }
  return expr;
  function errorMsg(pointerType, up) {
    return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
  }
}
validate.getData = getData;
var validation_error = {};
Object.defineProperty(validation_error, "__esModule", { value: true });
class ValidationError extends Error {
  constructor(errors2) {
    super("validation failed");
    this.errors = errors2;
    this.ajv = this.validation = true;
  }
}
validation_error.default = ValidationError;
var ref_error = {};
Object.defineProperty(ref_error, "__esModule", { value: true });
const resolve_1$1 = resolve$2;
class MissingRefError extends Error {
  constructor(resolver, baseId, ref2, msg) {
    super(msg || `can't resolve reference ${ref2} from id ${baseId}`);
    this.missingRef = (0, resolve_1$1.resolveUrl)(resolver, baseId, ref2);
    this.missingSchema = (0, resolve_1$1.normalizeId)((0, resolve_1$1.getFullPath)(resolver, this.missingRef));
  }
}
ref_error.default = MissingRefError;
var compile = {};
Object.defineProperty(compile, "__esModule", { value: true });
compile.resolveSchema = compile.getCompilingSchema = compile.resolveRef = compile.compileSchema = compile.SchemaEnv = void 0;
const codegen_1$m = codegen;
const validation_error_1 = validation_error;
const names_1$2 = names$1;
const resolve_1 = resolve$2;
const util_1$l = util;
const validate_1$1 = validate;
class SchemaEnv {
  constructor(env) {
    var _a;
    this.refs = {};
    this.dynamicAnchors = {};
    let schema2;
    if (typeof env.schema == "object")
      schema2 = env.schema;
    this.schema = env.schema;
    this.schemaId = env.schemaId;
    this.root = env.root || this;
    this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema2 === null || schema2 === void 0 ? void 0 : schema2[env.schemaId || "$id"]);
    this.schemaPath = env.schemaPath;
    this.localRefs = env.localRefs;
    this.meta = env.meta;
    this.$async = schema2 === null || schema2 === void 0 ? void 0 : schema2.$async;
    this.refs = {};
  }
}
compile.SchemaEnv = SchemaEnv;
function compileSchema(sch) {
  const _sch = getCompilingSchema.call(this, sch);
  if (_sch)
    return _sch;
  const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
  const { es5, lines } = this.opts.code;
  const { ownProperties } = this.opts;
  const gen = new codegen_1$m.CodeGen(this.scope, { es5, lines, ownProperties });
  let _ValidationError;
  if (sch.$async) {
    _ValidationError = gen.scopeValue("Error", {
      ref: validation_error_1.default,
      code: (0, codegen_1$m._)`require("ajv/dist/runtime/validation_error").default`
    });
  }
  const validateName = gen.scopeName("validate");
  sch.validateName = validateName;
  const schemaCxt = {
    gen,
    allErrors: this.opts.allErrors,
    data: names_1$2.default.data,
    parentData: names_1$2.default.parentData,
    parentDataProperty: names_1$2.default.parentDataProperty,
    dataNames: [names_1$2.default.data],
    dataPathArr: [codegen_1$m.nil],
    // TODO can its length be used as dataLevel if nil is removed?
    dataLevel: 0,
    dataTypes: [],
    definedProperties: /* @__PURE__ */ new Set(),
    topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1$m.stringify)(sch.schema) } : { ref: sch.schema }),
    validateName,
    ValidationError: _ValidationError,
    schema: sch.schema,
    schemaEnv: sch,
    rootId,
    baseId: sch.baseId || rootId,
    schemaPath: codegen_1$m.nil,
    errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
    errorPath: (0, codegen_1$m._)`""`,
    opts: this.opts,
    self: this
  };
  let sourceCode;
  try {
    this._compilations.add(sch);
    (0, validate_1$1.validateFunctionCode)(schemaCxt);
    gen.optimize(this.opts.code.optimize);
    const validateCode = gen.toString();
    sourceCode = `${gen.scopeRefs(names_1$2.default.scope)}return ${validateCode}`;
    if (this.opts.code.process)
      sourceCode = this.opts.code.process(sourceCode, sch);
    const makeValidate = new Function(`${names_1$2.default.self}`, `${names_1$2.default.scope}`, sourceCode);
    const validate2 = makeValidate(this, this.scope.get());
    this.scope.value(validateName, { ref: validate2 });
    validate2.errors = null;
    validate2.schema = sch.schema;
    validate2.schemaEnv = sch;
    if (sch.$async)
      validate2.$async = true;
    if (this.opts.code.source === true) {
      validate2.source = { validateName, validateCode, scopeValues: gen._values };
    }
    if (this.opts.unevaluated) {
      const { props, items: items2 } = schemaCxt;
      validate2.evaluated = {
        props: props instanceof codegen_1$m.Name ? void 0 : props,
        items: items2 instanceof codegen_1$m.Name ? void 0 : items2,
        dynamicProps: props instanceof codegen_1$m.Name,
        dynamicItems: items2 instanceof codegen_1$m.Name
      };
      if (validate2.source)
        validate2.source.evaluated = (0, codegen_1$m.stringify)(validate2.evaluated);
    }
    sch.validate = validate2;
    return sch;
  } catch (e) {
    delete sch.validate;
    delete sch.validateName;
    if (sourceCode)
      this.logger.error("Error compiling schema, function code:", sourceCode);
    throw e;
  } finally {
    this._compilations.delete(sch);
  }
}
compile.compileSchema = compileSchema;
function resolveRef(root, baseId, ref2) {
  var _a;
  ref2 = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref2);
  const schOrFunc = root.refs[ref2];
  if (schOrFunc)
    return schOrFunc;
  let _sch = resolve$1.call(this, root, ref2);
  if (_sch === void 0) {
    const schema2 = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref2];
    const { schemaId } = this.opts;
    if (schema2)
      _sch = new SchemaEnv({ schema: schema2, schemaId, root, baseId });
  }
  if (_sch === void 0)
    return;
  return root.refs[ref2] = inlineOrCompile.call(this, _sch);
}
compile.resolveRef = resolveRef;
function inlineOrCompile(sch) {
  if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
    return sch.schema;
  return sch.validate ? sch : compileSchema.call(this, sch);
}
function getCompilingSchema(schEnv) {
  for (const sch of this._compilations) {
    if (sameSchemaEnv(sch, schEnv))
      return sch;
  }
}
compile.getCompilingSchema = getCompilingSchema;
function sameSchemaEnv(s1, s2) {
  return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
}
function resolve$1(root, ref2) {
  let sch;
  while (typeof (sch = this.refs[ref2]) == "string")
    ref2 = sch;
  return sch || this.schemas[ref2] || resolveSchema.call(this, root, ref2);
}
function resolveSchema(root, ref2) {
  const p = this.opts.uriResolver.parse(ref2);
  const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
  let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
  if (Object.keys(root.schema).length > 0 && refPath === baseId) {
    return getJsonPointer.call(this, p, root);
  }
  const id2 = (0, resolve_1.normalizeId)(refPath);
  const schOrRef = this.refs[id2] || this.schemas[id2];
  if (typeof schOrRef == "string") {
    const sch = resolveSchema.call(this, root, schOrRef);
    if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
      return;
    return getJsonPointer.call(this, p, sch);
  }
  if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
    return;
  if (!schOrRef.validate)
    compileSchema.call(this, schOrRef);
  if (id2 === (0, resolve_1.normalizeId)(ref2)) {
    const { schema: schema2 } = schOrRef;
    const { schemaId } = this.opts;
    const schId = schema2[schemaId];
    if (schId)
      baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
    return new SchemaEnv({ schema: schema2, schemaId, root, baseId });
  }
  return getJsonPointer.call(this, p, schOrRef);
}
compile.resolveSchema = resolveSchema;
const PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "enum",
  "dependencies",
  "definitions"
]);
function getJsonPointer(parsedRef, { baseId, schema: schema2, root }) {
  var _a;
  if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
    return;
  for (const part of parsedRef.fragment.slice(1).split("/")) {
    if (typeof schema2 === "boolean")
      return;
    const partSchema = schema2[(0, util_1$l.unescapeFragment)(part)];
    if (partSchema === void 0)
      return;
    schema2 = partSchema;
    const schId = typeof schema2 === "object" && schema2[this.opts.schemaId];
    if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
      baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
    }
  }
  let env;
  if (typeof schema2 != "boolean" && schema2.$ref && !(0, util_1$l.schemaHasRulesButRef)(schema2, this.RULES)) {
    const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema2.$ref);
    env = resolveSchema.call(this, root, $ref);
  }
  const { schemaId } = this.opts;
  env = env || new SchemaEnv({ schema: schema2, schemaId, root, baseId });
  if (env.schema !== env.root.schema)
    return env;
  return void 0;
}
const $id$1 = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
const description = "Meta-schema for $data reference (JSON AnySchema extension proposal)";
const type$1 = "object";
const required$1 = [
  "$data"
];
const properties$2 = {
  $data: {
    type: "string",
    anyOf: [
      {
        format: "relative-json-pointer"
      },
      {
        format: "json-pointer"
      }
    ]
  }
};
const additionalProperties$1 = false;
const require$$9 = {
  $id: $id$1,
  description,
  type: type$1,
  required: required$1,
  properties: properties$2,
  additionalProperties: additionalProperties$1
};
var uri$1 = {};
var fastUri$1 = { exports: {} };
const isUUID$1 = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
const isIPv4$1 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
const isPort = RegExp.prototype.test.bind(/^\d*$/u);
const isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
const isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
const isPathCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/u);
const isQueryFragmentCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/u);
const isUserinfoCharacter = RegExp.prototype.test.bind(/^[A-Za-z0-9\-._~!$&'()*+,;=:]$/u);
const BYTE_HEX = new Array(256);
{
  const HEX_DIGITS = "0123456789ABCDEF";
  for (let i = 0; i < 256; i++) {
    BYTE_HEX[i] = "%" + HEX_DIGITS[i >> 4] + HEX_DIGITS[i & 15];
  }
}
function percentEncodeNonAscii(cp) {
  if (cp < 2048) {
    return BYTE_HEX[192 | cp >> 6] + BYTE_HEX[128 | cp & 63];
  }
  if (cp < 65536) {
    return BYTE_HEX[224 | cp >> 12] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
  }
  return BYTE_HEX[240 | cp >> 18] + BYTE_HEX[128 | cp >> 12 & 63] + BYTE_HEX[128 | cp >> 6 & 63] + BYTE_HEX[128 | cp & 63];
}
const isHextet = RegExp.prototype.test.bind(/^[\dA-Fa-f]{1,4}$/);
const isIPvFuture = RegExp.prototype.test.bind(/^[vV][\dA-Fa-f]+\.[A-Za-z\d\-._~!$&'()*+,;=:]+$/);
const isZoneCharacter = RegExp.prototype.test.bind(/^[A-Za-z\d\-._~]$/);
const nonSimpleDomain$1 = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
function isZoneIdentifier(zone) {
  if (zone.length === 0) return false;
  for (let i = 0; i < zone.length; i++) {
    if (isZoneCharacter(zone[i])) continue;
    if (zone[i] === "%" && i + 2 < zone.length && isHexPair(zone.slice(i + 1, i + 3))) {
      i += 2;
      continue;
    }
    return false;
  }
  return true;
}
function compressIPv6ZeroRun(hextets) {
  let bestStart = -1;
  let bestLength = 0;
  let runStart = -1;
  let runLength = 0;
  for (let i = 0; i < hextets.length; i++) {
    if (hextets[i] === "0") {
      if (runStart === -1) runStart = i;
      runLength++;
      if (runLength > bestLength) {
        bestLength = runLength;
        bestStart = runStart;
      }
    } else {
      runStart = -1;
      runLength = 0;
    }
  }
  if (bestLength < 2) return hextets.join(":");
  const head = hextets.slice(0, bestStart).join(":");
  const tail = hextets.slice(bestStart + bestLength).join(":");
  return head + "::" + tail;
}
function normalizeIPv6Address(input) {
  const compression = input.indexOf("::");
  if (compression !== -1 && input.indexOf("::", compression + 1) !== -1) return void 0;
  const left = compression === -1 ? input.split(":") : input.slice(0, compression).split(":");
  const right = compression === -1 ? [] : input.slice(compression + 2).split(":");
  if (compression !== -1) {
    if (left.length === 1 && left[0] === "") left.length = 0;
    if (right.length === 1 && right[0] === "") right.length = 0;
  }
  const parts = left.concat(right);
  let hextetCount = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "") return void 0;
    if (part.indexOf(".") !== -1) {
      if (i !== parts.length - 1 || compression !== -1 && right.length === 0 || !isIPv4$1(part)) return void 0;
      hextetCount += 2;
      continue;
    }
    if (!isHextet(part)) return void 0;
    parts[i] = parseInt(part, 16).toString(16);
    hextetCount++;
  }
  if (compression === -1) {
    if (hextetCount !== 8) return void 0;
    return compressIPv6ZeroRun(parts);
  }
  if (hextetCount >= 8) return void 0;
  const expanded = parts.slice(0, left.length);
  for (let i = hextetCount; i < 8; i++) expanded.push("0");
  for (let i = left.length; i < parts.length; i++) expanded.push(parts[i]);
  return compressIPv6ZeroRun(expanded);
}
function normalizeIPv6$1(host) {
  const bracketed = host[0] === "[" && host[host.length - 1] === "]";
  const hasBracket = host[0] === "[" || host[host.length - 1] === "]";
  if (hasBracket && !bracketed) return { host, isIPV6: false, error: true };
  let input = bracketed ? host.slice(1, -1) : host;
  if (bracketed && isIPvFuture(input)) {
    input = input.toLowerCase();
    return { host: `[${input}]`, escapedHost: input, isIPV6: false, isIPVFuture: true };
  }
  if (findToken(input, ":") < 2) {
    return { host, isIPV6: false, error: bracketed };
  }
  let zoneIdentifier = "";
  const zoneSeparator = input.indexOf("%");
  if (zoneSeparator !== -1) {
    const separatorLength = input.slice(zoneSeparator, zoneSeparator + 3).toLowerCase() === "%25" ? 3 : 1;
    zoneIdentifier = input.slice(zoneSeparator + separatorLength);
    if (!isZoneIdentifier(zoneIdentifier)) return { host, isIPV6: false, error: true };
    input = input.slice(0, zoneSeparator);
  }
  const address = normalizeIPv6Address(input);
  if (address === void 0) return { host, isIPV6: false, error: true };
  return {
    host: address + (zoneIdentifier ? "%" + zoneIdentifier : ""),
    escapedHost: address + (zoneIdentifier ? "%25" + zoneIdentifier : ""),
    isIPV6: true
  };
}
function findToken(str2, token) {
  let ind = 0;
  for (let i = 0; i < str2.length; i++) {
    if (str2[i] === token) ind++;
  }
  return ind;
}
function removeDotSegments$1(path) {
  let input = path;
  const output = [];
  let nextSlash = -1;
  let len = 0;
  while (len = input.length) {
    if (len === 1) {
      if (input === ".") {
        break;
      } else if (input === "/") {
        output.push("/");
        break;
      } else {
        output.push(input);
        break;
      }
    } else if (len === 2) {
      if (input[0] === ".") {
        if (input[1] === ".") {
          break;
        } else if (input[1] === "/") {
          input = input.slice(2);
          continue;
        }
      } else if (input[0] === "/") {
        if (input[1] === "." || input[1] === "/") {
          output.push("/");
          break;
        }
      }
    } else if (len === 3) {
      if (input === "/..") {
        if (output.length !== 0) {
          output.pop();
        }
        output.push("/");
        break;
      }
    }
    if (input[0] === ".") {
      if (input[1] === ".") {
        if (input[2] === "/") {
          input = input.slice(3);
          continue;
        }
      } else if (input[1] === "/") {
        input = input.slice(2);
        continue;
      }
    } else if (input[0] === "/") {
      if (input[1] === ".") {
        if (input[2] === "/") {
          input = input.slice(2);
          continue;
        } else if (input[2] === ".") {
          if (input[3] === "/") {
            input = input.slice(3);
            if (output.length !== 0) {
              output.pop();
            }
            continue;
          }
        }
      }
    }
    if ((nextSlash = input.indexOf("/", 1)) === -1) {
      output.push(input);
      break;
    } else {
      output.push(input.slice(0, nextSlash));
      input = input.slice(nextSlash);
    }
  }
  return output.join("");
}
const HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" };
const HOST_DELIM_RE = /[@/?#:]/g;
const HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
function reescapeHostDelimiters$1(host, isIP) {
  const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
  re.lastIndex = 0;
  return host.replace(re, (ch) => HOST_DELIMS[ch]);
}
function normalizePercentEncoding$1(input, decodeUnreserved = false) {
  if (input.indexOf("%") === -1) {
    return input;
  }
  let output = "";
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "%" && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3);
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase();
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
        if (decodeUnreserved && isUnreserved(decoded)) {
          output += decoded;
        } else {
          output += "%" + normalizedHex;
        }
        i += 2;
        continue;
      }
    }
    output += input[i];
  }
  return output;
}
function normalizePathEncoding$1(input) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "%" && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3);
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase();
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
        if (decoded !== "." && isUnreserved(decoded)) {
          output += decoded;
        } else {
          output += "%" + normalizedHex;
        }
        i += 2;
        continue;
      }
    }
    if (isPathCharacter(ch)) {
      output += ch;
    } else {
      const code2 = input.charCodeAt(i);
      if (code2 < 128) {
        output += isEscapeSafe(code2) ? ch : BYTE_HEX[code2];
      } else if (code2 < 55296 || code2 > 57343) {
        output += percentEncodeNonAscii(code2);
      } else if (code2 <= 56319 && i + 1 < input.length) {
        const low = input.charCodeAt(i + 1);
        if (low >= 56320 && low <= 57343) {
          output += percentEncodeNonAscii(65536 + (code2 - 55296 << 10) + (low - 56320));
          i++;
        } else {
          output += percentEncodeNonAscii(65533);
        }
      } else {
        output += percentEncodeNonAscii(65533);
      }
    }
  }
  return output;
}
function serializePathEncoding$1(input, pathNoScheme = false) {
  let output = "";
  let firstSegment = pathNoScheme && input[0] !== "/";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "%" && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3);
      if (isHexPair(hex)) {
        output += "%" + hex.toUpperCase();
        i += 2;
        continue;
      }
    }
    if (ch === "/") {
      firstSegment = false;
    }
    if (isPathCharacter(ch) && (ch !== ":" || !firstSegment)) {
      output += ch;
    } else {
      const code2 = input.charCodeAt(i);
      if (code2 < 128) {
        output += BYTE_HEX[code2];
      } else if (code2 < 55296 || code2 > 57343) {
        output += percentEncodeNonAscii(code2);
      } else if (code2 <= 56319 && i + 1 < input.length) {
        const low = input.charCodeAt(i + 1);
        if (low >= 56320 && low <= 57343) {
          output += percentEncodeNonAscii(65536 + (code2 - 55296 << 10) + (low - 56320));
          i++;
        } else {
          output += percentEncodeNonAscii(65533);
        }
      } else {
        output += percentEncodeNonAscii(65533);
      }
    }
  }
  return output;
}
function encodeComponent(input, isAllowed) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "%" && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3);
      if (isHexPair(hex)) {
        output += "%" + hex.toUpperCase();
        i += 2;
        continue;
      }
    }
    if (isAllowed(ch)) {
      output += ch;
    } else {
      const code2 = input.charCodeAt(i);
      if (code2 < 128) {
        output += BYTE_HEX[code2];
      } else if (code2 < 55296 || code2 > 57343) {
        output += percentEncodeNonAscii(code2);
      } else if (code2 <= 56319 && i + 1 < input.length) {
        const low = input.charCodeAt(i + 1);
        if (low >= 56320 && low <= 57343) {
          output += percentEncodeNonAscii(65536 + (code2 - 55296 << 10) + (low - 56320));
          i++;
        } else {
          output += percentEncodeNonAscii(65533);
        }
      } else {
        output += percentEncodeNonAscii(65533);
      }
    }
  }
  return output;
}
function encodeUserinfo(input) {
  return encodeComponent(input, isUserinfoCharacter);
}
function encodeQuery$1(input) {
  return encodeComponent(input, isQueryFragmentCharacter);
}
function encodeFragment$1(input) {
  return encodeComponent(input, isQueryFragmentCharacter);
}
function isEscapeSafe(cp) {
  return cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 42 || cp === 43 || cp === 45 || cp === 46 || cp === 47 || cp === 64 || cp === 95;
}
function normalizeQueryFragmentEncoding$1(input) {
  let output = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "%" && i + 2 < input.length) {
      const hex = input.slice(i + 1, i + 3);
      if (isHexPair(hex)) {
        const normalizedHex = hex.toUpperCase();
        const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
        if (isUnreserved(decoded)) {
          output += decoded;
        } else {
          output += "%" + normalizedHex;
        }
        i += 2;
        continue;
      }
    }
    if (isQueryFragmentCharacter(ch)) {
      output += ch;
    } else {
      const code2 = input.charCodeAt(i);
      if (code2 < 128) {
        output += isEscapeSafe(code2) ? ch : BYTE_HEX[code2];
      } else if (code2 < 55296 || code2 > 57343) {
        output += percentEncodeNonAscii(code2);
      } else if (code2 <= 56319 && i + 1 < input.length) {
        const low = input.charCodeAt(i + 1);
        if (low >= 56320 && low <= 57343) {
          output += percentEncodeNonAscii(65536 + (code2 - 55296 << 10) + (low - 56320));
          i++;
        } else {
          output += percentEncodeNonAscii(65533);
        }
      } else {
        output += percentEncodeNonAscii(65533);
      }
    }
  }
  return output;
}
function recomposeAuthority$1(component) {
  const uriTokens = [];
  if (component.userinfo !== void 0) {
    uriTokens.push(encodeUserinfo(component.userinfo));
    uriTokens.push("@");
  }
  if (component.host !== void 0) {
    let host = component.host;
    if (!isIPv4$1(host)) {
      let ipV6res = normalizeIPv6$1(host);
      if (ipV6res.isIPV6 !== true && ipV6res.isIPVFuture !== true) {
        host = normalizePercentEncoding$1(host, true);
        ipV6res = normalizeIPv6$1(host);
      }
      if (ipV6res.isIPV6 === true || ipV6res.isIPVFuture === true) {
        host = `[${ipV6res.escapedHost}]`;
      } else {
        host = reescapeHostDelimiters$1(host, false);
      }
    }
    uriTokens.push(host);
  }
  if (typeof component.port === "number" || typeof component.port === "string") {
    const port = String(component.port);
    if (!isPort(port)) {
      throw new TypeError("URI port is malformed.");
    }
    uriTokens.push(":");
    uriTokens.push(port);
  }
  return uriTokens.length ? uriTokens.join("") : void 0;
}
var utils = {
  nonSimpleDomain: nonSimpleDomain$1,
  recomposeAuthority: recomposeAuthority$1,
  reescapeHostDelimiters: reescapeHostDelimiters$1,
  normalizePercentEncoding: normalizePercentEncoding$1,
  normalizePathEncoding: normalizePathEncoding$1,
  serializePathEncoding: serializePathEncoding$1,
  normalizeQueryFragmentEncoding: normalizeQueryFragmentEncoding$1,
  encodeQuery: encodeQuery$1,
  encodeFragment: encodeFragment$1,
  removeDotSegments: removeDotSegments$1,
  isIPv4: isIPv4$1,
  isUUID: isUUID$1,
  normalizeIPv6: normalizeIPv6$1
};
const { isUUID } = utils;
const URN_REG = /^([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-./:;=@]|%[\da-f]{2})+)$/iu;
function wsIsSecure(wsComponent) {
  if (wsComponent.secure === true) {
    return true;
  } else if (wsComponent.secure === false) {
    return false;
  } else if (wsComponent.scheme) {
    return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
  } else {
    return false;
  }
}
function httpParse(component) {
  if (!component.host) {
    component.error = component.error || "HTTP URIs must have a host.";
  }
  return component;
}
function httpSerialize(component) {
  const secure = String(component.scheme).toLowerCase() === "https";
  if (component.port === (secure ? 443 : 80) || component.port === "") {
    component.port = void 0;
  }
  if (!component.path) {
    component.path = "/";
  }
  return component;
}
function wsParse(wsComponent) {
  wsComponent.secure = wsIsSecure(wsComponent);
  wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
  wsComponent.path = void 0;
  wsComponent.query = void 0;
  return wsComponent;
}
function wsSerialize(wsComponent) {
  if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
    wsComponent.port = void 0;
  }
  if (typeof wsComponent.secure === "boolean") {
    wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
    wsComponent.secure = void 0;
  }
  if (wsComponent.resourceName) {
    const queryIndex = wsComponent.resourceName.indexOf("?");
    const path = queryIndex === -1 ? wsComponent.resourceName : wsComponent.resourceName.slice(0, queryIndex);
    wsComponent.path = path && path !== "/" ? path : void 0;
    wsComponent.query = queryIndex === -1 ? void 0 : wsComponent.resourceName.slice(queryIndex + 1);
    wsComponent.resourceName = void 0;
  }
  wsComponent.fragment = void 0;
  return wsComponent;
}
function urnParse(urnComponent, options) {
  if (!urnComponent.path) {
    urnComponent.error = "URN can not be parsed";
    return urnComponent;
  }
  const matches = urnComponent.path.match(URN_REG);
  if (matches && matches[0] === urnComponent.path) {
    const scheme = options.scheme || urnComponent.scheme || "urn";
    urnComponent.nid = matches[1].toLowerCase();
    urnComponent.nss = matches[2];
    const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
    const schemeHandler = getSchemeHandler$1(urnScheme);
    urnComponent.path = void 0;
    if (schemeHandler) {
      urnComponent = schemeHandler.parse(urnComponent, options);
    }
  } else {
    urnComponent.error = urnComponent.error || "URN can not be parsed.";
  }
  return urnComponent;
}
function urnSerialize(urnComponent, options) {
  if (urnComponent.nid === void 0) {
    throw new Error("URN without nid cannot be serialized");
  }
  const scheme = options.scheme || urnComponent.scheme || "urn";
  const nid = urnComponent.nid.toLowerCase();
  const urnScheme = `${scheme}:${options.nid || nid}`;
  const schemeHandler = getSchemeHandler$1(urnScheme);
  if (schemeHandler) {
    urnComponent = schemeHandler.serialize(urnComponent, options);
  }
  const uriComponent = urnComponent;
  const nss = urnComponent.nss;
  uriComponent.path = `${nid || options.nid}:${nss}`;
  options.skipEscape = true;
  return uriComponent;
}
function urnuuidParse(urnComponent, options) {
  const uuidComponent = urnComponent;
  uuidComponent.uuid = uuidComponent.nss;
  uuidComponent.nss = void 0;
  if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
    uuidComponent.error = uuidComponent.error || "UUID is not valid.";
  }
  return uuidComponent;
}
function urnuuidSerialize(uuidComponent) {
  const urnComponent = uuidComponent;
  urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
  return urnComponent;
}
const http = (
  /** @type {SchemeHandler} */
  {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  }
);
const https = (
  /** @type {SchemeHandler} */
  {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  }
);
const ws = (
  /** @type {SchemeHandler} */
  {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  }
);
const wss = (
  /** @type {SchemeHandler} */
  {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  }
);
const urn = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  }
);
const urnuuid = (
  /** @type {SchemeHandler} */
  {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  }
);
const SCHEMES$1 = (
  /** @type {Record<SchemeName, SchemeHandler>} */
  {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  }
);
Object.setPrototypeOf(SCHEMES$1, null);
function getSchemeHandler$1(scheme) {
  return scheme && (SCHEMES$1[
    /** @type {SchemeName} */
    scheme
  ] || SCHEMES$1[
    /** @type {SchemeName} */
    scheme.toLowerCase()
  ]) || void 0;
}
var schemes = {
  SCHEMES: SCHEMES$1,
  getSchemeHandler: getSchemeHandler$1
};
const { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, serializePathEncoding, normalizeQueryFragmentEncoding, encodeQuery, encodeFragment, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = utils;
const { SCHEMES, getSchemeHandler } = schemes;
const VALID_SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*$/u;
const MALFORMED_SCHEME_ERROR = "URI scheme is malformed.";
function decodeValidScheme(scheme) {
  const decodedScheme = unescape(String(scheme));
  if (!VALID_SCHEME.test(decodedScheme)) {
    throw new TypeError(MALFORMED_SCHEME_ERROR);
  }
  return decodedScheme;
}
function normalize(uri2, options) {
  if (typeof uri2 === "string") {
    uri2 = /** @type {T} */
    normalizeString(uri2, options);
  } else if (typeof uri2 === "object") {
    uri2 = /** @type {T} */
    parse(serialize(uri2, options), options);
  }
  return uri2;
}
function resolve(baseURI, relativeURI, options) {
  const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
  const {
    parsed: baseParsed,
    malformedAuthorityOrPort: baseMalformed,
    malformedPercentEncoding: baseMalformedPercentEncoding,
    malformedSchemeSpecific: baseMalformedSchemeSpecific,
    malformedHost: baseMalformedHost,
    malformedScheme: baseMalformedScheme
  } = parseWithStatus(baseURI, schemelessOptions);
  const {
    parsed: relativeParsed,
    malformedAuthorityOrPort: relativeMalformed,
    malformedPercentEncoding: relativeMalformedPercentEncoding,
    malformedSchemeSpecific: relativeMalformedSchemeSpecific,
    malformedHost: relativeMalformedHost,
    malformedScheme: relativeMalformedScheme
  } = parseWithStatus(relativeURI, schemelessOptions);
  if (baseMalformed || relativeMalformed || baseMalformedPercentEncoding || relativeMalformedPercentEncoding || baseMalformedSchemeSpecific || relativeMalformedSchemeSpecific || baseMalformedHost || relativeMalformedHost || baseMalformedScheme || relativeMalformedScheme) {
    throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
  }
  const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
  const resolvedSchemeHandler = getSchemeHandler(options && options.scheme || resolved.scheme);
  const resolvedHost = resolved.host;
  const resolvedHostIsIP = resolvedHost !== void 0 && resolvedHost !== "" && (isIPv4(resolvedHost) || normalizeIPv6(resolvedHost).isIPV6);
  canonicalizeHost(resolved, options || {}, resolvedSchemeHandler, resolvedHostIsIP);
  const encodedASCIIHost = resolvedHost && resolvedHost.indexOf("%") !== -1 && !new RegExp("\\P{ASCII}", "u").test(resolvedHost);
  if (resolved.error && !encodedASCIIHost) {
    throw new Error(resolved.error);
  }
  schemelessOptions.skipEscape = true;
  return serialize(resolved, schemelessOptions);
}
function resolveComponent(base, relative, options, skipNormalization) {
  const target = {};
  if (!skipNormalization) {
    base = parse(serialize(base, options), options);
    relative = parse(serialize(relative, options), options);
  }
  options = options || {};
  if (!options.tolerant && relative.scheme) {
    target.scheme = relative.scheme;
    target.userinfo = relative.userinfo;
    target.host = relative.host;
    target.port = relative.port;
    target.path = removeDotSegments(relative.path || "");
    target.query = relative.query;
  } else {
    if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (!relative.path) {
        target.path = base.path;
        if (relative.query !== void 0) {
          target.query = relative.query;
        } else {
          target.query = base.query;
        }
      } else {
        if (relative.path[0] === "/") {
          target.path = removeDotSegments(relative.path);
        } else {
          if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
            target.path = "/" + relative.path;
          } else if (!base.path) {
            target.path = relative.path;
          } else {
            target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
          }
          target.path = removeDotSegments(target.path);
        }
        target.query = relative.query;
      }
      target.userinfo = base.userinfo;
      target.host = base.host;
      target.port = base.port;
    }
    target.scheme = base.scheme;
  }
  target.fragment = relative.fragment;
  return target;
}
function equal$2(uriA, uriB, options) {
  const normalizedA = normalizeComparableURI(uriA, options);
  const normalizedB = normalizeComparableURI(uriB, options);
  return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA === normalizedB;
}
function serialize(cmpts, opts) {
  const component = {
    host: cmpts.host,
    scheme: cmpts.scheme,
    userinfo: cmpts.userinfo,
    port: cmpts.port,
    path: cmpts.path,
    query: cmpts.query,
    nid: cmpts.nid,
    nss: cmpts.nss,
    uuid: cmpts.uuid,
    fragment: cmpts.fragment,
    reference: cmpts.reference,
    resourceName: cmpts.resourceName,
    secure: cmpts.secure,
    error: ""
  };
  const options = Object.assign({}, opts);
  const uriTokens = [];
  if (component.scheme) {
    component.scheme = decodeValidScheme(component.scheme);
  }
  const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
  if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
  const hasAuthority = component.userinfo !== void 0 || component.host !== void 0 || component.port !== void 0;
  const pathNoScheme = !options.skipEscape && component.scheme === void 0 && !hasAuthority;
  if (component.path !== void 0) {
    if (!options.skipEscape) {
      component.path = serializePathEncoding(component.path, pathNoScheme);
    } else {
      component.path = normalizePercentEncoding(component.path);
    }
  }
  if (options.reference !== "suffix" && component.scheme) {
    component.scheme = decodeValidScheme(component.scheme);
    uriTokens.push(component.scheme, ":");
  }
  const authority = recomposeAuthority(component);
  if (authority !== void 0) {
    if (options.reference !== "suffix") {
      uriTokens.push("//");
    }
    uriTokens.push(authority);
    if (component.path && component.path[0] !== "/") {
      uriTokens.push("/");
    }
  }
  if (component.path !== void 0) {
    let s = component.path;
    if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
      s = removeDotSegments(s);
    }
    if (pathNoScheme) {
      s = serializePathEncoding(s, true);
    }
    if (authority === void 0 && s[0] === "/" && s[1] === "/") {
      s = "/%2F" + s.slice(2);
    }
    uriTokens.push(s);
  }
  if (component.query !== void 0) {
    uriTokens.push("?", encodeQuery(component.query));
  }
  if (component.fragment !== void 0) {
    uriTokens.push("#", encodeFragment(component.fragment));
  }
  return uriTokens.join("");
}
const URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
const AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
const AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
function getParseError(parsed, matches) {
  if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") {
    return 'URI path must start with "/" when authority is present.';
  }
  if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) {
    return "URI port is malformed.";
  }
  return void 0;
}
function hasMalformedPercentEncoding(component) {
  if (component === void 0) return false;
  let percent = component.indexOf("%");
  while (percent !== -1) {
    if (percent + 2 >= component.length || !/^[\da-f]{2}$/iu.test(component.slice(percent + 1, percent + 3))) {
      return true;
    }
    percent = component.indexOf("%", percent + 3);
  }
  return false;
}
function isIPLiteral(host) {
  return host[0] === "[" && host[host.length - 1] === "]";
}
function hasMalformedComponentPercentEncoding(matches) {
  const host = matches[4];
  return hasMalformedPercentEncoding(matches[3]) || host !== void 0 && !isIPLiteral(host) && hasMalformedPercentEncoding(host) || hasMalformedPercentEncoding(matches[6]) || hasMalformedPercentEncoding(matches[7]) || hasMalformedPercentEncoding(matches[8]);
}
function canonicalizeHost(parsed, options, schemeHandler, isIP) {
  if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport) && parsed.host && !isIPLiteral(parsed.host) && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
    try {
      parsed.host = new URL("http://" + parsed.host).hostname;
    } catch (e) {
      parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
      return true;
    }
  }
  return false;
}
function parseWithStatus(uri2, opts) {
  const options = Object.assign({}, opts);
  const parsed = {
    scheme: void 0,
    userinfo: void 0,
    host: "",
    port: void 0,
    path: "",
    query: void 0,
    fragment: void 0
  };
  let malformedAuthorityOrPort = false;
  let malformedPercentEncoding = false;
  let malformedSchemeSpecific = false;
  let malformedHost = false;
  let malformedIPLiteral = false;
  let malformedScheme = false;
  let isIP = false;
  if (options.reference === "suffix") {
    if (options.scheme) {
      uri2 = options.scheme + ":" + uri2;
    } else {
      uri2 = "//" + uri2;
    }
  }
  const authorityMatch = uri2.match(AUTHORITY_PREFIX);
  if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
    parsed.error = "URI authority must not contain a literal backslash.";
    malformedAuthorityOrPort = true;
  }
  const introducerMatch = uri2.match(AUTHORITY_INTRODUCER_REGION);
  if (introducerMatch !== null) {
    const region = introducerMatch[1];
    const normalizedRegion = region.replace(/[\t\n\r]/g, "");
    if (normalizedRegion.length >= 2) {
      if (normalizedRegion.slice(0, 2) !== "//") {
        parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
        malformedAuthorityOrPort = true;
      } else if (region.length !== normalizedRegion.length) {
        parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
        malformedAuthorityOrPort = true;
      }
    }
  }
  const matches = uri2.match(URI_PARSE);
  if (matches) {
    parsed.scheme = matches[1];
    parsed.userinfo = matches[3];
    parsed.host = matches[4];
    parsed.port = parseInt(matches[5], 10);
    parsed.path = matches[6] || "";
    parsed.query = matches[7];
    parsed.fragment = matches[8];
    if (parsed.scheme !== void 0) {
      const decodedScheme = unescape(parsed.scheme);
      if (VALID_SCHEME.test(decodedScheme)) {
        parsed.scheme = decodedScheme.toLowerCase();
      } else {
        parsed.error = parsed.error || MALFORMED_SCHEME_ERROR;
        malformedScheme = true;
      }
    }
    malformedPercentEncoding = hasMalformedComponentPercentEncoding(matches);
    if (malformedPercentEncoding) {
      parsed.error = parsed.error || "URI contains malformed percent-encoding.";
    }
    if (isNaN(parsed.port)) {
      parsed.port = matches[5];
    }
    const parseError = getParseError(parsed, matches);
    if (parseError !== void 0) {
      parsed.error = parsed.error || parseError;
      malformedAuthorityOrPort = true;
    }
    if (parsed.host) {
      const ipv4result = isIPv4(parsed.host);
      if (ipv4result === false) {
        const bracketedIPLiteral = isIPLiteral(parsed.host);
        const hasIPLiteralBracket = parsed.host.indexOf("[") !== -1 || parsed.host.indexOf("]") !== -1;
        const ipv6result = normalizeIPv6(parsed.host);
        isIP = ipv6result.isIPV6 || ipv6result.isIPVFuture === true;
        malformedIPLiteral = hasIPLiteralBracket && (!bracketedIPLiteral || ipv6result.error === true);
        parsed.host = isIP ? ipv6result.host : ipv6result.host.toLowerCase();
        if (malformedIPLiteral) {
          parsed.error = parsed.error || "URI host is malformed.";
          malformedAuthorityOrPort = true;
        }
      } else {
        isIP = true;
      }
    }
    if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
      parsed.reference = "same-document";
    } else if (parsed.scheme === void 0) {
      parsed.reference = "relative";
    } else if (parsed.fragment === void 0) {
      parsed.reference = "absolute";
    } else {
      parsed.reference = "uri";
    }
    if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
      parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
    }
    const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
    if (!malformedIPLiteral) {
      malformedHost = canonicalizeHost(parsed, options, schemeHandler, isIP);
    }
    if (uri2.indexOf("%") !== -1 && parsed.host !== void 0 && !malformedIPLiteral) {
      let host = isIP ? parsed.host : normalizePercentEncoding(parsed.host, true);
      if (!isIP) {
        host = normalizePercentEncoding(host.toLowerCase());
      }
      parsed.host = reescapeHostDelimiters(host, isIP);
    }
    if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
      if (parsed.path) {
        parsed.path = normalizePathEncoding(parsed.path);
      }
      if (parsed.query) {
        parsed.query = normalizeQueryFragmentEncoding(parsed.query);
      }
      if (parsed.fragment) {
        parsed.fragment = normalizeQueryFragmentEncoding(parsed.fragment);
      }
    }
    if (schemeHandler && schemeHandler.parse) {
      schemeHandler.parse(parsed, options);
      if (schemeHandler === SCHEMES.urn && parsed.nid === void 0) {
        malformedSchemeSpecific = true;
      }
    }
  } else {
    parsed.error = parsed.error || "URI can not be parsed.";
  }
  return { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme };
}
function parse(uri2, opts) {
  return parseWithStatus(uri2, opts).parsed;
}
function normalizeString(uri2, opts) {
  return normalizeStringWithStatus(uri2, opts).normalized;
}
function normalizeStringWithStatus(uri2, opts) {
  const { parsed, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = parseWithStatus(uri2, opts);
  return {
    normalized: malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? uri2 : serialize(parsed, opts),
    malformedAuthorityOrPort,
    malformedPercentEncoding,
    malformedSchemeSpecific,
    malformedHost,
    malformedScheme
  };
}
function normalizeComparableURI(uri2, opts) {
  if (typeof uri2 !== "string" && typeof uri2 !== "object") {
    return void 0;
  }
  let value;
  try {
    value = typeof uri2 === "string" ? uri2 : serialize(uri2, opts);
  } catch {
    return void 0;
  }
  const { normalized, malformedAuthorityOrPort, malformedPercentEncoding, malformedSchemeSpecific, malformedHost, malformedScheme } = normalizeStringWithStatus(value, opts);
  return malformedAuthorityOrPort || malformedPercentEncoding || malformedSchemeSpecific || malformedHost || malformedScheme ? void 0 : normalized;
}
const fastUri = {
  SCHEMES,
  normalize,
  resolve,
  resolveComponent,
  equal: equal$2,
  serialize,
  parse
};
fastUri$1.exports = fastUri;
fastUri$1.exports.default = fastUri;
fastUri$1.exports.fastUri = fastUri;
var fastUriExports = fastUri$1.exports;
Object.defineProperty(uri$1, "__esModule", { value: true });
const uri = fastUriExports;
uri.code = 'require("ajv/dist/runtime/uri").default';
uri$1.default = uri;
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.CodeGen = exports$1.Name = exports$1.nil = exports$1.stringify = exports$1.str = exports$1._ = exports$1.KeywordCxt = void 0;
  var validate_12 = validate;
  Object.defineProperty(exports$1, "KeywordCxt", { enumerable: true, get: function() {
    return validate_12.KeywordCxt;
  } });
  var codegen_12 = codegen;
  Object.defineProperty(exports$1, "_", { enumerable: true, get: function() {
    return codegen_12._;
  } });
  Object.defineProperty(exports$1, "str", { enumerable: true, get: function() {
    return codegen_12.str;
  } });
  Object.defineProperty(exports$1, "stringify", { enumerable: true, get: function() {
    return codegen_12.stringify;
  } });
  Object.defineProperty(exports$1, "nil", { enumerable: true, get: function() {
    return codegen_12.nil;
  } });
  Object.defineProperty(exports$1, "Name", { enumerable: true, get: function() {
    return codegen_12.Name;
  } });
  Object.defineProperty(exports$1, "CodeGen", { enumerable: true, get: function() {
    return codegen_12.CodeGen;
  } });
  const validation_error_12 = validation_error;
  const ref_error_12 = ref_error;
  const rules_12 = rules;
  const compile_12 = compile;
  const codegen_2 = codegen;
  const resolve_12 = resolve$2;
  const dataType_12 = dataType;
  const util_12 = util;
  const $dataRefSchema = require$$9;
  const uri_1 = uri$1;
  const defaultRegExp = (str2, flags) => new RegExp(str2, flags);
  defaultRegExp.code = "new RegExp";
  const META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  const EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  const removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  const deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  const MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
    const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
      messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
      uriResolver
    };
  }
  class Ajv2 {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = /* @__PURE__ */ Object.create(null);
      this._compilations = /* @__PURE__ */ new Set();
      this._loading = {};
      this._cache = /* @__PURE__ */ new Map();
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_12.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema2, _meta) {
      const sch = this._addSchema(schema2, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema2, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema2, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_12.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref2, missingRef }) {
        if (this.refs[ref2]) {
          throw new Error(`AnySchema ${ref2} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref2) {
        const _schema = await _loadSchema.call(this, ref2);
        if (!this.refs[ref2])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref2])
          this.addSchema(_schema, ref2, meta);
      }
      async function _loadSchema(ref2) {
        const p = this._loading[ref2];
        if (p)
          return p;
        try {
          return await (this._loading[ref2] = loadSchema(ref2));
        } finally {
          delete this._loading[ref2];
        }
      }
    }
    // Adds schema to the instance
    addSchema(schema2, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema2)) {
        for (const sch of schema2)
          this.addSchema(sch, void 0, _meta, _validateSchema);
        return this;
      }
      let id2;
      if (typeof schema2 === "object") {
        const { schemaId } = this.opts;
        id2 = schema2[schemaId];
        if (id2 !== void 0 && typeof id2 != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_12.normalizeId)(key || id2);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema2, _meta, key, _validateSchema, true);
      return this;
    }
    // Add schema that will be used to validate other schemas
    // options in META_IGNORE_OPTIONS are alway set to false
    addMetaSchema(schema2, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema2, key, true, _validateSchema);
      return this;
    }
    //  Validate schema against its meta-schema
    validateSchema(schema2, throwOrLogError) {
      if (typeof schema2 == "boolean")
        return true;
      let $schema2;
      $schema2 = schema2.$schema;
      if ($schema2 !== void 0 && typeof $schema2 != "string") {
        throw new Error("$schema must be a string");
      }
      $schema2 = $schema2 || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema2) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema2, schema2);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    // Get compiled schema by `key` or `ref`.
    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === void 0) {
        const { schemaId } = this.opts;
        const root = new compile_12.SchemaEnv({ schema: {}, schemaId });
        sch = compile_12.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    // Remove cached schema(s).
    // If no parameter is passed all schemas but meta-schemas are removed.
    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id2 = schemaKeyRef[this.opts.schemaId];
          if (id2) {
            id2 = (0, resolve_12.normalizeId)(id2);
            delete this.schemas[id2];
            delete this.refs[id2];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    // add "vocabulary" - a collection of keywords
    addVocabulary(definitions2) {
      for (const def2 of definitions2)
        this.addKeyword(def2);
      return this;
    }
    addKeyword(kwdOrDef, def2) {
      let keyword2;
      if (typeof kwdOrDef == "string") {
        keyword2 = kwdOrDef;
        if (typeof def2 == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def2.keyword = keyword2;
        }
      } else if (typeof kwdOrDef == "object" && def2 === void 0) {
        def2 = kwdOrDef;
        keyword2 = def2.keyword;
        if (Array.isArray(keyword2) && !keyword2.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword2, def2);
      if (!def2) {
        (0, util_12.eachItem)(keyword2, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def2);
      const definition = {
        ...def2,
        type: (0, dataType_12.getJSONTypes)(def2.type),
        schemaType: (0, dataType_12.getJSONTypes)(def2.schemaType)
      };
      (0, util_12.eachItem)(keyword2, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword2) {
      const rule = this.RULES.all[keyword2];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    // Remove keyword
    removeKeyword(keyword2) {
      const { RULES } = this;
      delete RULES.keywords[keyword2];
      delete RULES.all[keyword2];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword2);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    // Add format
    addFormat(name, format2) {
      if (typeof format2 == "string")
        format2 = new RegExp(format2);
      this.formats[name] = format2;
      return this;
    }
    errorsText(errors2 = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors2 || errors2.length === 0)
        return "No errors";
      return errors2.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules2 = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules2) {
          const rule = rules2[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema2 = keywords[key];
          if ($data && schema2)
            keywords[key] = schemaOrData(schema2);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas, regex) {
      for (const keyRef in schemas) {
        const sch = schemas[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas[keyRef];
          }
        }
      }
    }
    _addSchema(schema2, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id2;
      const { schemaId } = this.opts;
      if (typeof schema2 == "object") {
        id2 = schema2[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema2 != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema2);
      if (sch !== void 0)
        return sch;
      baseId = (0, resolve_12.normalizeId)(id2 || baseId);
      const localRefs = resolve_12.getSchemaRefs.call(this, schema2, baseId);
      sch = new compile_12.SchemaEnv({ schema: schema2, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema2, true);
      return sch;
    }
    _checkUnique(id2) {
      if (this.schemas[id2] || this.refs[id2]) {
        throw new Error(`schema with key or id "${id2}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_12.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_12.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv2.ValidationError = validation_error_12.default;
  Ajv2.MissingRefError = ref_error_12.default;
  exports$1.default = Ajv2;
  function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_12.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format2 = this.opts.formats[name];
      if (format2)
        this.addFormat(name, format2);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword2 in defs) {
      const def2 = defs[keyword2];
      if (!def2.keyword)
        def2.keyword = keyword2;
      this.addKeyword(def2);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  const noLogs = { log() {
  }, warn() {
  }, error() {
  } };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === void 0)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  const KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword2, def2) {
    const { RULES } = this;
    (0, util_12.eachItem)(keyword2, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def2)
      return;
    if (def2.$data && !("code" in def2 || "validate" in def2)) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword2, definition, dataType2) {
    var _a;
    const post = definition === null || definition === void 0 ? void 0 : definition.post;
    if (dataType2 && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType2);
    if (!ruleGroup) {
      ruleGroup = { type: dataType2, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword2] = true;
    if (!definition)
      return;
    const rule = {
      keyword: keyword2,
      definition: {
        ...definition,
        type: (0, dataType_12.getJSONTypes)(definition.type),
        schemaType: (0, dataType_12.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword2] = rule;
    (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def2) {
    let { metaSchema } = def2;
    if (metaSchema === void 0)
      return;
    if (def2.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def2.validateSchema = this.compile(metaSchema, true);
  }
  const $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema2) {
    return { anyOf: [schema2, $dataRef] };
  }
})(core$2);
var draft7 = {};
var core$1 = {};
var id = {};
Object.defineProperty(id, "__esModule", { value: true });
const def$s = {
  keyword: "id",
  code() {
    throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
  }
};
id.default = def$s;
var ref = {};
Object.defineProperty(ref, "__esModule", { value: true });
ref.callRef = ref.getValidate = void 0;
const ref_error_1$1 = ref_error;
const code_1$8 = code;
const codegen_1$l = codegen;
const names_1$1 = names$1;
const compile_1$1 = compile;
const util_1$k = util;
const def$r = {
  keyword: "$ref",
  schemaType: "string",
  code(cxt) {
    const { gen, schema: $ref, it } = cxt;
    const { baseId, schemaEnv: env, validateName, opts, self } = it;
    const { root } = env;
    if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
      return callRootRef();
    const schOrEnv = compile_1$1.resolveRef.call(self, root, baseId, $ref);
    if (schOrEnv === void 0)
      throw new ref_error_1$1.default(it.opts.uriResolver, baseId, $ref);
    if (schOrEnv instanceof compile_1$1.SchemaEnv)
      return callValidate(schOrEnv);
    return inlineRefSchema(schOrEnv);
    function callRootRef() {
      if (env === root)
        return callRef(cxt, validateName, env, env.$async);
      const rootName = gen.scopeValue("root", { ref: root });
      return callRef(cxt, (0, codegen_1$l._)`${rootName}.validate`, root, root.$async);
    }
    function callValidate(sch) {
      const v = getValidate(cxt, sch);
      callRef(cxt, v, sch, sch.$async);
    }
    function inlineRefSchema(sch) {
      const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1$l.stringify)(sch) } : { ref: sch });
      const valid = gen.name("valid");
      const schCxt = cxt.subschema({
        schema: sch,
        dataTypes: [],
        schemaPath: codegen_1$l.nil,
        topSchemaRef: schName,
        errSchemaPath: $ref
      }, valid);
      cxt.mergeEvaluated(schCxt);
      cxt.ok(valid);
    }
  }
};
function getValidate(cxt, sch) {
  const { gen } = cxt;
  return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1$l._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
}
ref.getValidate = getValidate;
function callRef(cxt, v, sch, $async) {
  const { gen, it } = cxt;
  const { allErrors, schemaEnv: env, opts } = it;
  const passCxt = opts.passContext ? names_1$1.default.this : codegen_1$l.nil;
  if ($async)
    callAsyncRef();
  else
    callSyncRef();
  function callAsyncRef() {
    if (!env.$async)
      throw new Error("async schema referenced by sync schema");
    const valid = gen.let("valid");
    gen.try(() => {
      gen.code((0, codegen_1$l._)`await ${(0, code_1$8.callValidateCode)(cxt, v, passCxt)}`);
      addEvaluatedFrom(v);
      if (!allErrors)
        gen.assign(valid, true);
    }, (e) => {
      gen.if((0, codegen_1$l._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
      addErrorsFrom(e);
      if (!allErrors)
        gen.assign(valid, false);
    });
    cxt.ok(valid);
  }
  function callSyncRef() {
    cxt.result((0, code_1$8.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
  }
  function addErrorsFrom(source) {
    const errs = (0, codegen_1$l._)`${source}.errors`;
    gen.assign(names_1$1.default.vErrors, (0, codegen_1$l._)`${names_1$1.default.vErrors} === null ? ${errs} : ${names_1$1.default.vErrors}.concat(${errs})`);
    gen.assign(names_1$1.default.errors, (0, codegen_1$l._)`${names_1$1.default.vErrors}.length`);
  }
  function addEvaluatedFrom(source) {
    var _a;
    if (!it.opts.unevaluated)
      return;
    const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
    if (it.props !== true) {
      if (schEvaluated && !schEvaluated.dynamicProps) {
        if (schEvaluated.props !== void 0) {
          it.props = util_1$k.mergeEvaluated.props(gen, schEvaluated.props, it.props);
        }
      } else {
        const props = gen.var("props", (0, codegen_1$l._)`${source}.evaluated.props`);
        it.props = util_1$k.mergeEvaluated.props(gen, props, it.props, codegen_1$l.Name);
      }
    }
    if (it.items !== true) {
      if (schEvaluated && !schEvaluated.dynamicItems) {
        if (schEvaluated.items !== void 0) {
          it.items = util_1$k.mergeEvaluated.items(gen, schEvaluated.items, it.items);
        }
      } else {
        const items2 = gen.var("items", (0, codegen_1$l._)`${source}.evaluated.items`);
        it.items = util_1$k.mergeEvaluated.items(gen, items2, it.items, codegen_1$l.Name);
      }
    }
  }
}
ref.callRef = callRef;
ref.default = def$r;
Object.defineProperty(core$1, "__esModule", { value: true });
const id_1 = id;
const ref_1 = ref;
const core = [
  "$schema",
  "$id",
  "$defs",
  "$vocabulary",
  { keyword: "$comment" },
  "definitions",
  id_1.default,
  ref_1.default
];
core$1.default = core;
var validation$1 = {};
var limitNumber = {};
Object.defineProperty(limitNumber, "__esModule", { value: true });
const codegen_1$k = codegen;
const ops = codegen_1$k.operators;
const KWDs = {
  maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
  minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
  exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
  exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
};
const error$i = {
  message: ({ keyword: keyword2, schemaCode }) => (0, codegen_1$k.str)`must be ${KWDs[keyword2].okStr} ${schemaCode}`,
  params: ({ keyword: keyword2, schemaCode }) => (0, codegen_1$k._)`{comparison: ${KWDs[keyword2].okStr}, limit: ${schemaCode}}`
};
const def$q = {
  keyword: Object.keys(KWDs),
  type: "number",
  schemaType: "number",
  $data: true,
  error: error$i,
  code(cxt) {
    const { keyword: keyword2, data, schemaCode } = cxt;
    cxt.fail$data((0, codegen_1$k._)`${data} ${KWDs[keyword2].fail} ${schemaCode} || isNaN(${data})`);
  }
};
limitNumber.default = def$q;
var multipleOf = {};
Object.defineProperty(multipleOf, "__esModule", { value: true });
const codegen_1$j = codegen;
const error$h = {
  message: ({ schemaCode }) => (0, codegen_1$j.str)`must be multiple of ${schemaCode}`,
  params: ({ schemaCode }) => (0, codegen_1$j._)`{multipleOf: ${schemaCode}}`
};
const def$p = {
  keyword: "multipleOf",
  type: "number",
  schemaType: "number",
  $data: true,
  error: error$h,
  code(cxt) {
    const { gen, data, schemaCode, it } = cxt;
    const prec = it.opts.multipleOfPrecision;
    const res = gen.let("res");
    const invalid = prec ? (0, codegen_1$j._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1$j._)`${res} !== parseInt(${res})`;
    cxt.fail$data((0, codegen_1$j._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
  }
};
multipleOf.default = def$p;
var limitLength = {};
var ucs2length$1 = {};
Object.defineProperty(ucs2length$1, "__esModule", { value: true });
function ucs2length(str2) {
  const len = str2.length;
  let length = 0;
  let pos = 0;
  let value;
  while (pos < len) {
    length++;
    value = str2.charCodeAt(pos++);
    if (value >= 55296 && value <= 56319 && pos < len) {
      value = str2.charCodeAt(pos);
      if ((value & 64512) === 56320)
        pos++;
    }
  }
  return length;
}
ucs2length$1.default = ucs2length;
ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
Object.defineProperty(limitLength, "__esModule", { value: true });
const codegen_1$i = codegen;
const util_1$j = util;
const ucs2length_1 = ucs2length$1;
const error$g = {
  message({ keyword: keyword2, schemaCode }) {
    const comp = keyword2 === "maxLength" ? "more" : "fewer";
    return (0, codegen_1$i.str)`must NOT have ${comp} than ${schemaCode} characters`;
  },
  params: ({ schemaCode }) => (0, codegen_1$i._)`{limit: ${schemaCode}}`
};
const def$o = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  error: error$g,
  code(cxt) {
    const { keyword: keyword2, data, schemaCode, it } = cxt;
    const op = keyword2 === "maxLength" ? codegen_1$i.operators.GT : codegen_1$i.operators.LT;
    const len = it.opts.unicode === false ? (0, codegen_1$i._)`${data}.length` : (0, codegen_1$i._)`${(0, util_1$j.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
    cxt.fail$data((0, codegen_1$i._)`${len} ${op} ${schemaCode}`);
  }
};
limitLength.default = def$o;
var pattern = {};
Object.defineProperty(pattern, "__esModule", { value: true });
const code_1$7 = code;
const util_1$i = util;
const codegen_1$h = codegen;
const error$f = {
  message: ({ schemaCode }) => (0, codegen_1$h.str)`must match pattern "${schemaCode}"`,
  params: ({ schemaCode }) => (0, codegen_1$h._)`{pattern: ${schemaCode}}`
};
const def$n = {
  keyword: "pattern",
  type: "string",
  schemaType: "string",
  $data: true,
  error: error$f,
  code(cxt) {
    const { gen, data, $data, schema: schema2, schemaCode, it } = cxt;
    const u = it.opts.unicodeRegExp ? "u" : "";
    if ($data) {
      const { regExp } = it.opts.code;
      const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1$h._)`new RegExp` : (0, util_1$i.useFunc)(gen, regExp);
      const valid = gen.let("valid");
      gen.try(() => gen.assign(valid, (0, codegen_1$h._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
      cxt.fail$data((0, codegen_1$h._)`!${valid}`);
    } else {
      const regExp = (0, code_1$7.usePattern)(cxt, schema2);
      cxt.fail$data((0, codegen_1$h._)`!${regExp}.test(${data})`);
    }
  }
};
pattern.default = def$n;
var limitProperties = {};
Object.defineProperty(limitProperties, "__esModule", { value: true });
const codegen_1$g = codegen;
const error$e = {
  message({ keyword: keyword2, schemaCode }) {
    const comp = keyword2 === "maxProperties" ? "more" : "fewer";
    return (0, codegen_1$g.str)`must NOT have ${comp} than ${schemaCode} properties`;
  },
  params: ({ schemaCode }) => (0, codegen_1$g._)`{limit: ${schemaCode}}`
};
const def$m = {
  keyword: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: "number",
  $data: true,
  error: error$e,
  code(cxt) {
    const { keyword: keyword2, data, schemaCode } = cxt;
    const op = keyword2 === "maxProperties" ? codegen_1$g.operators.GT : codegen_1$g.operators.LT;
    cxt.fail$data((0, codegen_1$g._)`Object.keys(${data}).length ${op} ${schemaCode}`);
  }
};
limitProperties.default = def$m;
var required = {};
Object.defineProperty(required, "__esModule", { value: true });
const code_1$6 = code;
const codegen_1$f = codegen;
const util_1$h = util;
const error$d = {
  message: ({ params: { missingProperty } }) => (0, codegen_1$f.str)`must have required property '${missingProperty}'`,
  params: ({ params: { missingProperty } }) => (0, codegen_1$f._)`{missingProperty: ${missingProperty}}`
};
const def$l = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: true,
  error: error$d,
  code(cxt) {
    const { gen, schema: schema2, schemaCode, data, $data, it } = cxt;
    const { opts } = it;
    if (!$data && schema2.length === 0)
      return;
    const useLoop = schema2.length >= opts.loopRequired;
    if (it.allErrors)
      allErrorsMode();
    else
      exitOnErrorMode();
    if (opts.strictRequired) {
      const props = cxt.parentSchema.properties;
      const { definedProperties } = cxt.it;
      for (const requiredKey of schema2) {
        if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
          const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
          const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
          (0, util_1$h.checkStrictMode)(it, msg, it.opts.strictRequired);
        }
      }
    }
    function allErrorsMode() {
      if (useLoop || $data) {
        cxt.block$data(codegen_1$f.nil, loopAllRequired);
      } else {
        for (const prop of schema2) {
          (0, code_1$6.checkReportMissingProp)(cxt, prop);
        }
      }
    }
    function exitOnErrorMode() {
      const missing = gen.let("missing");
      if (useLoop || $data) {
        const valid = gen.let("valid", true);
        cxt.block$data(valid, () => loopUntilMissing(missing, valid));
        cxt.ok(valid);
      } else {
        gen.if((0, code_1$6.checkMissingProp)(cxt, schema2, missing));
        (0, code_1$6.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
    function loopAllRequired() {
      gen.forOf("prop", schemaCode, (prop) => {
        cxt.setParams({ missingProperty: prop });
        gen.if((0, code_1$6.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
      });
    }
    function loopUntilMissing(missing, valid) {
      cxt.setParams({ missingProperty: missing });
      gen.forOf(missing, schemaCode, () => {
        gen.assign(valid, (0, code_1$6.propertyInData)(gen, data, missing, opts.ownProperties));
        gen.if((0, codegen_1$f.not)(valid), () => {
          cxt.error();
          gen.break();
        });
      }, codegen_1$f.nil);
    }
  }
};
required.default = def$l;
var limitItems = {};
Object.defineProperty(limitItems, "__esModule", { value: true });
const codegen_1$e = codegen;
const error$c = {
  message({ keyword: keyword2, schemaCode }) {
    const comp = keyword2 === "maxItems" ? "more" : "fewer";
    return (0, codegen_1$e.str)`must NOT have ${comp} than ${schemaCode} items`;
  },
  params: ({ schemaCode }) => (0, codegen_1$e._)`{limit: ${schemaCode}}`
};
const def$k = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: true,
  error: error$c,
  code(cxt) {
    const { keyword: keyword2, data, schemaCode } = cxt;
    const op = keyword2 === "maxItems" ? codegen_1$e.operators.GT : codegen_1$e.operators.LT;
    cxt.fail$data((0, codegen_1$e._)`${data}.length ${op} ${schemaCode}`);
  }
};
limitItems.default = def$k;
var uniqueItems = {};
var equal$1 = {};
Object.defineProperty(equal$1, "__esModule", { value: true });
const equal2 = fastDeepEqual;
equal2.code = 'require("ajv/dist/runtime/equal").default';
equal$1.default = equal2;
Object.defineProperty(uniqueItems, "__esModule", { value: true });
const dataType_1 = dataType;
const codegen_1$d = codegen;
const util_1$g = util;
const equal_1$2 = equal$1;
const error$b = {
  message: ({ params: { i, j } }) => (0, codegen_1$d.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
  params: ({ params: { i, j } }) => (0, codegen_1$d._)`{i: ${i}, j: ${j}}`
};
const def$j = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  error: error$b,
  code(cxt) {
    const { gen, data, $data, schema: schema2, parentSchema, schemaCode, it } = cxt;
    if (!$data && !schema2)
      return;
    const valid = gen.let("valid");
    const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
    cxt.block$data(valid, validateUniqueItems, (0, codegen_1$d._)`${schemaCode} === false`);
    cxt.ok(valid);
    function validateUniqueItems() {
      const i = gen.let("i", (0, codegen_1$d._)`${data}.length`);
      const j = gen.let("j");
      cxt.setParams({ i, j });
      gen.assign(valid, true);
      gen.if((0, codegen_1$d._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
    }
    function canOptimize() {
      return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
    }
    function loopN(i, j) {
      const item = gen.name("item");
      const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
      const indices = gen.const("indices", (0, codegen_1$d._)`{}`);
      gen.for((0, codegen_1$d._)`;${i}--;`, () => {
        gen.let(item, (0, codegen_1$d._)`${data}[${i}]`);
        gen.if(wrongType, (0, codegen_1$d._)`continue`);
        if (itemTypes.length > 1)
          gen.if((0, codegen_1$d._)`typeof ${item} == "string"`, (0, codegen_1$d._)`${item} += "_"`);
        gen.if((0, codegen_1$d._)`typeof ${indices}[${item}] == "number"`, () => {
          gen.assign(j, (0, codegen_1$d._)`${indices}[${item}]`);
          cxt.error();
          gen.assign(valid, false).break();
        }).code((0, codegen_1$d._)`${indices}[${item}] = ${i}`);
      });
    }
    function loopN2(i, j) {
      const eql = (0, util_1$g.useFunc)(gen, equal_1$2.default);
      const outer = gen.name("outer");
      gen.label(outer).for((0, codegen_1$d._)`;${i}--;`, () => gen.for((0, codegen_1$d._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1$d._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
        cxt.error();
        gen.assign(valid, false).break(outer);
      })));
    }
  }
};
uniqueItems.default = def$j;
var _const = {};
Object.defineProperty(_const, "__esModule", { value: true });
const codegen_1$c = codegen;
const util_1$f = util;
const equal_1$1 = equal$1;
const error$a = {
  message: "must be equal to constant",
  params: ({ schemaCode }) => (0, codegen_1$c._)`{allowedValue: ${schemaCode}}`
};
const def$i = {
  keyword: "const",
  $data: true,
  error: error$a,
  code(cxt) {
    const { gen, data, $data, schemaCode, schema: schema2 } = cxt;
    if ($data || schema2 && typeof schema2 == "object") {
      cxt.fail$data((0, codegen_1$c._)`!${(0, util_1$f.useFunc)(gen, equal_1$1.default)}(${data}, ${schemaCode})`);
    } else {
      cxt.fail((0, codegen_1$c._)`${schema2} !== ${data}`);
    }
  }
};
_const.default = def$i;
var _enum = {};
Object.defineProperty(_enum, "__esModule", { value: true });
const codegen_1$b = codegen;
const util_1$e = util;
const equal_1 = equal$1;
const error$9 = {
  message: "must be equal to one of the allowed values",
  params: ({ schemaCode }) => (0, codegen_1$b._)`{allowedValues: ${schemaCode}}`
};
const def$h = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  error: error$9,
  code(cxt) {
    const { gen, data, $data, schema: schema2, schemaCode, it } = cxt;
    if (!$data && schema2.length === 0)
      throw new Error("enum must have non-empty array");
    const useLoop = schema2.length >= it.opts.loopEnum;
    let eql;
    const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1$e.useFunc)(gen, equal_1.default);
    let valid;
    if (useLoop || $data) {
      valid = gen.let("valid");
      cxt.block$data(valid, loopEnum);
    } else {
      if (!Array.isArray(schema2))
        throw new Error("ajv implementation error");
      const vSchema = gen.const("vSchema", schemaCode);
      valid = (0, codegen_1$b.or)(...schema2.map((_x, i) => equalCode(vSchema, i)));
    }
    cxt.pass(valid);
    function loopEnum() {
      gen.assign(valid, false);
      gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1$b._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
    }
    function equalCode(vSchema, i) {
      const sch = schema2[i];
      return typeof sch === "object" && sch !== null ? (0, codegen_1$b._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1$b._)`${data} === ${sch}`;
    }
  }
};
_enum.default = def$h;
Object.defineProperty(validation$1, "__esModule", { value: true });
const limitNumber_1 = limitNumber;
const multipleOf_1 = multipleOf;
const limitLength_1 = limitLength;
const pattern_1 = pattern;
const limitProperties_1 = limitProperties;
const required_1 = required;
const limitItems_1 = limitItems;
const uniqueItems_1 = uniqueItems;
const const_1 = _const;
const enum_1 = _enum;
const validation = [
  // number
  limitNumber_1.default,
  multipleOf_1.default,
  // string
  limitLength_1.default,
  pattern_1.default,
  // object
  limitProperties_1.default,
  required_1.default,
  // array
  limitItems_1.default,
  uniqueItems_1.default,
  // any
  { keyword: "type", schemaType: ["string", "array"] },
  { keyword: "nullable", schemaType: "boolean" },
  const_1.default,
  enum_1.default
];
validation$1.default = validation;
var applicator = {};
var additionalItems = {};
Object.defineProperty(additionalItems, "__esModule", { value: true });
additionalItems.validateAdditionalItems = void 0;
const codegen_1$a = codegen;
const util_1$d = util;
const error$8 = {
  message: ({ params: { len } }) => (0, codegen_1$a.str)`must NOT have more than ${len} items`,
  params: ({ params: { len } }) => (0, codegen_1$a._)`{limit: ${len}}`
};
const def$g = {
  keyword: "additionalItems",
  type: "array",
  schemaType: ["boolean", "object"],
  before: "uniqueItems",
  error: error$8,
  code(cxt) {
    const { parentSchema, it } = cxt;
    const { items: items2 } = parentSchema;
    if (!Array.isArray(items2)) {
      (0, util_1$d.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
      return;
    }
    validateAdditionalItems(cxt, items2);
  }
};
function validateAdditionalItems(cxt, items2) {
  const { gen, schema: schema2, data, keyword: keyword2, it } = cxt;
  it.items = true;
  const len = gen.const("len", (0, codegen_1$a._)`${data}.length`);
  if (schema2 === false) {
    cxt.setParams({ len: items2.length });
    cxt.pass((0, codegen_1$a._)`${len} <= ${items2.length}`);
  } else if (typeof schema2 == "object" && !(0, util_1$d.alwaysValidSchema)(it, schema2)) {
    const valid = gen.var("valid", (0, codegen_1$a._)`${len} <= ${items2.length}`);
    gen.if((0, codegen_1$a.not)(valid), () => validateItems(valid));
    cxt.ok(valid);
  }
  function validateItems(valid) {
    gen.forRange("i", items2.length, len, (i) => {
      cxt.subschema({ keyword: keyword2, dataProp: i, dataPropType: util_1$d.Type.Num }, valid);
      if (!it.allErrors)
        gen.if((0, codegen_1$a.not)(valid), () => gen.break());
    });
  }
}
additionalItems.validateAdditionalItems = validateAdditionalItems;
additionalItems.default = def$g;
var prefixItems = {};
var items = {};
Object.defineProperty(items, "__esModule", { value: true });
items.validateTuple = void 0;
const codegen_1$9 = codegen;
const util_1$c = util;
const code_1$5 = code;
const def$f = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "array", "boolean"],
  before: "uniqueItems",
  code(cxt) {
    const { schema: schema2, it } = cxt;
    if (Array.isArray(schema2))
      return validateTuple(cxt, "additionalItems", schema2);
    it.items = true;
    if ((0, util_1$c.alwaysValidSchema)(it, schema2))
      return;
    cxt.ok((0, code_1$5.validateArray)(cxt));
  }
};
function validateTuple(cxt, extraItems, schArr = cxt.schema) {
  const { gen, parentSchema, data, keyword: keyword2, it } = cxt;
  checkStrictTuple(parentSchema);
  if (it.opts.unevaluated && schArr.length && it.items !== true) {
    it.items = util_1$c.mergeEvaluated.items(gen, schArr.length, it.items);
  }
  const valid = gen.name("valid");
  const len = gen.const("len", (0, codegen_1$9._)`${data}.length`);
  schArr.forEach((sch, i) => {
    if ((0, util_1$c.alwaysValidSchema)(it, sch))
      return;
    gen.if((0, codegen_1$9._)`${len} > ${i}`, () => cxt.subschema({
      keyword: keyword2,
      schemaProp: i,
      dataProp: i
    }, valid));
    cxt.ok(valid);
  });
  function checkStrictTuple(sch) {
    const { opts, errSchemaPath } = it;
    const l = schArr.length;
    const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
    if (opts.strictTuples && !fullTuple) {
      const msg = `"${keyword2}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
      (0, util_1$c.checkStrictMode)(it, msg, opts.strictTuples);
    }
  }
}
items.validateTuple = validateTuple;
items.default = def$f;
Object.defineProperty(prefixItems, "__esModule", { value: true });
const items_1$1 = items;
const def$e = {
  keyword: "prefixItems",
  type: "array",
  schemaType: ["array"],
  before: "uniqueItems",
  code: (cxt) => (0, items_1$1.validateTuple)(cxt, "items")
};
prefixItems.default = def$e;
var items2020 = {};
Object.defineProperty(items2020, "__esModule", { value: true });
const codegen_1$8 = codegen;
const util_1$b = util;
const code_1$4 = code;
const additionalItems_1$1 = additionalItems;
const error$7 = {
  message: ({ params: { len } }) => (0, codegen_1$8.str)`must NOT have more than ${len} items`,
  params: ({ params: { len } }) => (0, codegen_1$8._)`{limit: ${len}}`
};
const def$d = {
  keyword: "items",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  error: error$7,
  code(cxt) {
    const { schema: schema2, parentSchema, it } = cxt;
    const { prefixItems: prefixItems2 } = parentSchema;
    it.items = true;
    if ((0, util_1$b.alwaysValidSchema)(it, schema2))
      return;
    if (prefixItems2)
      (0, additionalItems_1$1.validateAdditionalItems)(cxt, prefixItems2);
    else
      cxt.ok((0, code_1$4.validateArray)(cxt));
  }
};
items2020.default = def$d;
var contains = {};
Object.defineProperty(contains, "__esModule", { value: true });
const codegen_1$7 = codegen;
const util_1$a = util;
const error$6 = {
  message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1$7.str)`must contain at least ${min} valid item(s)` : (0, codegen_1$7.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
  params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1$7._)`{minContains: ${min}}` : (0, codegen_1$7._)`{minContains: ${min}, maxContains: ${max}}`
};
const def$c = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  before: "uniqueItems",
  trackErrors: true,
  error: error$6,
  code(cxt) {
    const { gen, schema: schema2, parentSchema, data, it } = cxt;
    let min;
    let max;
    const { minContains, maxContains } = parentSchema;
    if (it.opts.next) {
      min = minContains === void 0 ? 1 : minContains;
      max = maxContains;
    } else {
      min = 1;
    }
    const len = gen.const("len", (0, codegen_1$7._)`${data}.length`);
    cxt.setParams({ min, max });
    if (max === void 0 && min === 0) {
      (0, util_1$a.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
      return;
    }
    if (max !== void 0 && min > max) {
      (0, util_1$a.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
      cxt.fail();
      return;
    }
    if ((0, util_1$a.alwaysValidSchema)(it, schema2)) {
      let cond = (0, codegen_1$7._)`${len} >= ${min}`;
      if (max !== void 0)
        cond = (0, codegen_1$7._)`${cond} && ${len} <= ${max}`;
      cxt.pass(cond);
      return;
    }
    it.items = true;
    const valid = gen.name("valid");
    if (max === void 0 && min === 1) {
      validateItems(valid, () => gen.if(valid, () => gen.break()));
    } else if (min === 0) {
      gen.let(valid, true);
      if (max !== void 0)
        gen.if((0, codegen_1$7._)`${data}.length > 0`, validateItemsWithCount);
    } else {
      gen.let(valid, false);
      validateItemsWithCount();
    }
    cxt.result(valid, () => cxt.reset());
    function validateItemsWithCount() {
      const schValid = gen.name("_valid");
      const count = gen.let("count", 0);
      validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
    }
    function validateItems(_valid, block) {
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword: "contains",
          dataProp: i,
          dataPropType: util_1$a.Type.Num,
          compositeRule: true
        }, _valid);
        block();
      });
    }
    function checkLimits(count) {
      gen.code((0, codegen_1$7._)`${count}++`);
      if (max === void 0) {
        gen.if((0, codegen_1$7._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
      } else {
        gen.if((0, codegen_1$7._)`${count} > ${max}`, () => gen.assign(valid, false).break());
        if (min === 1)
          gen.assign(valid, true);
        else
          gen.if((0, codegen_1$7._)`${count} >= ${min}`, () => gen.assign(valid, true));
      }
    }
  }
};
contains.default = def$c;
var dependencies = {};
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.validateSchemaDeps = exports$1.validatePropertyDeps = exports$1.error = void 0;
  const codegen_12 = codegen;
  const util_12 = util;
  const code_12 = code;
  exports$1.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_12.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_12._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
    // TODO change to reference
  };
  const def2 = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports$1.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema: schema2 }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema2) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema2[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema2[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_12.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_12.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_12._)`${hasProperty} && (${(0, code_12.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_12.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports$1.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword: keyword2, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_12.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if(
        (0, code_12.propertyInData)(gen, data, prop, it.opts.ownProperties),
        () => {
          const schCxt = cxt.subschema({ keyword: keyword2, schemaProp: prop }, valid);
          cxt.mergeValidEvaluated(schCxt, valid);
        },
        () => gen.var(valid, true)
        // TODO var
      );
      cxt.ok(valid);
    }
  }
  exports$1.validateSchemaDeps = validateSchemaDeps;
  exports$1.default = def2;
})(dependencies);
var propertyNames = {};
Object.defineProperty(propertyNames, "__esModule", { value: true });
const codegen_1$6 = codegen;
const util_1$9 = util;
const error$5 = {
  message: "property name must be valid",
  params: ({ params }) => (0, codegen_1$6._)`{propertyName: ${params.propertyName}}`
};
const def$b = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  error: error$5,
  code(cxt) {
    const { gen, schema: schema2, data, it } = cxt;
    if ((0, util_1$9.alwaysValidSchema)(it, schema2))
      return;
    const valid = gen.name("valid");
    gen.forIn("key", data, (key) => {
      cxt.setParams({ propertyName: key });
      cxt.subschema({
        keyword: "propertyNames",
        data: key,
        dataTypes: ["string"],
        propertyName: key,
        compositeRule: true
      }, valid);
      gen.if((0, codegen_1$6.not)(valid), () => {
        cxt.error(true);
        if (!it.allErrors)
          gen.break();
      });
    });
    cxt.ok(valid);
  }
};
propertyNames.default = def$b;
var additionalProperties = {};
Object.defineProperty(additionalProperties, "__esModule", { value: true });
const code_1$3 = code;
const codegen_1$5 = codegen;
const names_1 = names$1;
const util_1$8 = util;
const error$4 = {
  message: "must NOT have additional properties",
  params: ({ params }) => (0, codegen_1$5._)`{additionalProperty: ${params.additionalProperty}}`
};
const def$a = {
  keyword: "additionalProperties",
  type: ["object"],
  schemaType: ["boolean", "object"],
  allowUndefined: true,
  trackErrors: true,
  error: error$4,
  code(cxt) {
    const { gen, schema: schema2, parentSchema, data, errsCount, it } = cxt;
    if (!errsCount)
      throw new Error("ajv implementation error");
    const { allErrors, opts } = it;
    it.props = true;
    if (opts.removeAdditional !== "all" && (0, util_1$8.alwaysValidSchema)(it, schema2))
      return;
    const props = (0, code_1$3.allSchemaProperties)(parentSchema.properties);
    const patProps = (0, code_1$3.allSchemaProperties)(parentSchema.patternProperties);
    checkAdditionalProperties();
    cxt.ok((0, codegen_1$5._)`${errsCount} === ${names_1.default.errors}`);
    function checkAdditionalProperties() {
      gen.forIn("key", data, (key) => {
        if (!props.length && !patProps.length)
          additionalPropertyCode(key);
        else
          gen.if(isAdditional(key), () => additionalPropertyCode(key));
      });
    }
    function isAdditional(key) {
      let definedProp;
      if (props.length > 8) {
        const propsSchema = (0, util_1$8.schemaRefOrVal)(it, parentSchema.properties, "properties");
        definedProp = (0, code_1$3.isOwnProperty)(gen, propsSchema, key);
      } else if (props.length) {
        definedProp = (0, codegen_1$5.or)(...props.map((p) => (0, codegen_1$5._)`${key} === ${p}`));
      } else {
        definedProp = codegen_1$5.nil;
      }
      if (patProps.length) {
        definedProp = (0, codegen_1$5.or)(definedProp, ...patProps.map((p) => (0, codegen_1$5._)`${(0, code_1$3.usePattern)(cxt, p)}.test(${key})`));
      }
      return (0, codegen_1$5.not)(definedProp);
    }
    function deleteAdditional(key) {
      gen.code((0, codegen_1$5._)`delete ${data}[${key}]`);
    }
    function additionalPropertyCode(key) {
      if (opts.removeAdditional === "all" || opts.removeAdditional && schema2 === false) {
        deleteAdditional(key);
        return;
      }
      if (schema2 === false) {
        cxt.setParams({ additionalProperty: key });
        cxt.error();
        if (!allErrors)
          gen.break();
        return;
      }
      if (typeof schema2 == "object" && !(0, util_1$8.alwaysValidSchema)(it, schema2)) {
        const valid = gen.name("valid");
        if (opts.removeAdditional === "failing") {
          applyAdditionalSchema(key, valid, false);
          gen.if((0, codegen_1$5.not)(valid), () => {
            cxt.reset();
            deleteAdditional(key);
          });
        } else {
          applyAdditionalSchema(key, valid);
          if (!allErrors)
            gen.if((0, codegen_1$5.not)(valid), () => gen.break());
        }
      }
    }
    function applyAdditionalSchema(key, valid, errors2) {
      const subschema2 = {
        keyword: "additionalProperties",
        dataProp: key,
        dataPropType: util_1$8.Type.Str
      };
      if (errors2 === false) {
        Object.assign(subschema2, {
          compositeRule: true,
          createErrors: false,
          allErrors: false
        });
      }
      cxt.subschema(subschema2, valid);
    }
  }
};
additionalProperties.default = def$a;
var properties$1 = {};
Object.defineProperty(properties$1, "__esModule", { value: true });
const validate_1 = validate;
const code_1$2 = code;
const util_1$7 = util;
const additionalProperties_1$1 = additionalProperties;
const def$9 = {
  keyword: "properties",
  type: "object",
  schemaType: "object",
  code(cxt) {
    const { gen, schema: schema2, parentSchema, data, it } = cxt;
    if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
      additionalProperties_1$1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1$1.default, "additionalProperties"));
    }
    const allProps = (0, code_1$2.allSchemaProperties)(schema2);
    for (const prop of allProps) {
      it.definedProperties.add(prop);
    }
    if (it.opts.unevaluated && allProps.length && it.props !== true) {
      it.props = util_1$7.mergeEvaluated.props(gen, (0, util_1$7.toHash)(allProps), it.props);
    }
    const properties2 = allProps.filter((p) => !(0, util_1$7.alwaysValidSchema)(it, schema2[p]));
    if (properties2.length === 0)
      return;
    const valid = gen.name("valid");
    for (const prop of properties2) {
      if (hasDefault(prop)) {
        applyPropertySchema(prop);
      } else {
        gen.if((0, code_1$2.propertyInData)(gen, data, prop, it.opts.ownProperties));
        applyPropertySchema(prop);
        if (!it.allErrors)
          gen.else().var(valid, true);
        gen.endIf();
      }
      cxt.it.definedProperties.add(prop);
      cxt.ok(valid);
    }
    function hasDefault(prop) {
      return it.opts.useDefaults && !it.compositeRule && schema2[prop].default !== void 0;
    }
    function applyPropertySchema(prop) {
      cxt.subschema({
        keyword: "properties",
        schemaProp: prop,
        dataProp: prop
      }, valid);
    }
  }
};
properties$1.default = def$9;
var patternProperties = {};
Object.defineProperty(patternProperties, "__esModule", { value: true });
const code_1$1 = code;
const codegen_1$4 = codegen;
const util_1$6 = util;
const util_2 = util;
const def$8 = {
  keyword: "patternProperties",
  type: "object",
  schemaType: "object",
  code(cxt) {
    const { gen, schema: schema2, data, parentSchema, it } = cxt;
    const { opts } = it;
    const patterns = (0, code_1$1.allSchemaProperties)(schema2);
    const alwaysValidPatterns = patterns.filter((p) => (0, util_1$6.alwaysValidSchema)(it, schema2[p]));
    if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
      return;
    }
    const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
    const valid = gen.name("valid");
    if (it.props !== true && !(it.props instanceof codegen_1$4.Name)) {
      it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
    }
    const { props } = it;
    validatePatternProperties();
    function validatePatternProperties() {
      for (const pat of patterns) {
        if (checkProperties)
          checkMatchingProperties(pat);
        if (it.allErrors) {
          validateProperties(pat);
        } else {
          gen.var(valid, true);
          validateProperties(pat);
          gen.if(valid);
        }
      }
    }
    function checkMatchingProperties(pat) {
      for (const prop in checkProperties) {
        if (new RegExp(pat).test(prop)) {
          (0, util_1$6.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
        }
      }
    }
    function validateProperties(pat) {
      gen.forIn("key", data, (key) => {
        gen.if((0, codegen_1$4._)`${(0, code_1$1.usePattern)(cxt, pat)}.test(${key})`, () => {
          const alwaysValid = alwaysValidPatterns.includes(pat);
          if (!alwaysValid) {
            cxt.subschema({
              keyword: "patternProperties",
              schemaProp: pat,
              dataProp: key,
              dataPropType: util_2.Type.Str
            }, valid);
          }
          if (it.opts.unevaluated && props !== true) {
            gen.assign((0, codegen_1$4._)`${props}[${key}]`, true);
          } else if (!alwaysValid && !it.allErrors) {
            gen.if((0, codegen_1$4.not)(valid), () => gen.break());
          }
        });
      });
    }
  }
};
patternProperties.default = def$8;
var not = {};
Object.defineProperty(not, "__esModule", { value: true });
const util_1$5 = util;
const def$7 = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: true,
  code(cxt) {
    const { gen, schema: schema2, it } = cxt;
    if ((0, util_1$5.alwaysValidSchema)(it, schema2)) {
      cxt.fail();
      return;
    }
    const valid = gen.name("valid");
    cxt.subschema({
      keyword: "not",
      compositeRule: true,
      createErrors: false,
      allErrors: false
    }, valid);
    cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
  },
  error: { message: "must NOT be valid" }
};
not.default = def$7;
var anyOf = {};
Object.defineProperty(anyOf, "__esModule", { value: true });
const code_1 = code;
const def$6 = {
  keyword: "anyOf",
  schemaType: "array",
  trackErrors: true,
  code: code_1.validateUnion,
  error: { message: "must match a schema in anyOf" }
};
anyOf.default = def$6;
var oneOf = {};
Object.defineProperty(oneOf, "__esModule", { value: true });
const codegen_1$3 = codegen;
const util_1$4 = util;
const error$3 = {
  message: "must match exactly one schema in oneOf",
  params: ({ params }) => (0, codegen_1$3._)`{passingSchemas: ${params.passing}}`
};
const def$5 = {
  keyword: "oneOf",
  schemaType: "array",
  trackErrors: true,
  error: error$3,
  code(cxt) {
    const { gen, schema: schema2, parentSchema, it } = cxt;
    if (!Array.isArray(schema2))
      throw new Error("ajv implementation error");
    if (it.opts.discriminator && parentSchema.discriminator)
      return;
    const schArr = schema2;
    const valid = gen.let("valid", false);
    const passing = gen.let("passing", null);
    const schValid = gen.name("_valid");
    cxt.setParams({ passing });
    gen.block(validateOneOf);
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    function validateOneOf() {
      schArr.forEach((sch, i) => {
        let schCxt;
        if ((0, util_1$4.alwaysValidSchema)(it, sch)) {
          gen.var(schValid, true);
        } else {
          schCxt = cxt.subschema({
            keyword: "oneOf",
            schemaProp: i,
            compositeRule: true
          }, schValid);
        }
        if (i > 0) {
          gen.if((0, codegen_1$3._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1$3._)`[${passing}, ${i}]`).else();
        }
        gen.if(schValid, () => {
          gen.assign(valid, true);
          gen.assign(passing, i);
          if (schCxt)
            cxt.mergeEvaluated(schCxt, codegen_1$3.Name);
        });
      });
    }
  }
};
oneOf.default = def$5;
var allOf = {};
Object.defineProperty(allOf, "__esModule", { value: true });
const util_1$3 = util;
const def$4 = {
  keyword: "allOf",
  schemaType: "array",
  code(cxt) {
    const { gen, schema: schema2, it } = cxt;
    if (!Array.isArray(schema2))
      throw new Error("ajv implementation error");
    const valid = gen.name("valid");
    schema2.forEach((sch, i) => {
      if ((0, util_1$3.alwaysValidSchema)(it, sch))
        return;
      const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
      cxt.ok(valid);
      cxt.mergeEvaluated(schCxt);
    });
  }
};
allOf.default = def$4;
var _if = {};
Object.defineProperty(_if, "__esModule", { value: true });
const codegen_1$2 = codegen;
const util_1$2 = util;
const error$2 = {
  message: ({ params }) => (0, codegen_1$2.str)`must match "${params.ifClause}" schema`,
  params: ({ params }) => (0, codegen_1$2._)`{failingKeyword: ${params.ifClause}}`
};
const def$3 = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  trackErrors: true,
  error: error$2,
  code(cxt) {
    const { gen, parentSchema, it } = cxt;
    if (parentSchema.then === void 0 && parentSchema.else === void 0) {
      (0, util_1$2.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
    }
    const hasThen = hasSchema(it, "then");
    const hasElse = hasSchema(it, "else");
    if (!hasThen && !hasElse)
      return;
    const valid = gen.let("valid", true);
    const schValid = gen.name("_valid");
    validateIf();
    cxt.reset();
    if (hasThen && hasElse) {
      const ifClause = gen.let("ifClause");
      cxt.setParams({ ifClause });
      gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
    } else if (hasThen) {
      gen.if(schValid, validateClause("then"));
    } else {
      gen.if((0, codegen_1$2.not)(schValid), validateClause("else"));
    }
    cxt.pass(valid, () => cxt.error(true));
    function validateIf() {
      const schCxt = cxt.subschema({
        keyword: "if",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, schValid);
      cxt.mergeEvaluated(schCxt);
    }
    function validateClause(keyword2, ifClause) {
      return () => {
        const schCxt = cxt.subschema({ keyword: keyword2 }, schValid);
        gen.assign(valid, schValid);
        cxt.mergeValidEvaluated(schCxt, valid);
        if (ifClause)
          gen.assign(ifClause, (0, codegen_1$2._)`${keyword2}`);
        else
          cxt.setParams({ ifClause: keyword2 });
      };
    }
  }
};
function hasSchema(it, keyword2) {
  const schema2 = it.schema[keyword2];
  return schema2 !== void 0 && !(0, util_1$2.alwaysValidSchema)(it, schema2);
}
_if.default = def$3;
var thenElse = {};
Object.defineProperty(thenElse, "__esModule", { value: true });
const util_1$1 = util;
const def$2 = {
  keyword: ["then", "else"],
  schemaType: ["object", "boolean"],
  code({ keyword: keyword2, parentSchema, it }) {
    if (parentSchema.if === void 0)
      (0, util_1$1.checkStrictMode)(it, `"${keyword2}" without "if" is ignored`);
  }
};
thenElse.default = def$2;
Object.defineProperty(applicator, "__esModule", { value: true });
const additionalItems_1 = additionalItems;
const prefixItems_1 = prefixItems;
const items_1 = items;
const items2020_1 = items2020;
const contains_1 = contains;
const dependencies_1 = dependencies;
const propertyNames_1 = propertyNames;
const additionalProperties_1 = additionalProperties;
const properties_1 = properties$1;
const patternProperties_1 = patternProperties;
const not_1 = not;
const anyOf_1 = anyOf;
const oneOf_1 = oneOf;
const allOf_1 = allOf;
const if_1 = _if;
const thenElse_1 = thenElse;
function getApplicator(draft2020 = false) {
  const applicator2 = [
    // any
    not_1.default,
    anyOf_1.default,
    oneOf_1.default,
    allOf_1.default,
    if_1.default,
    thenElse_1.default,
    // object
    propertyNames_1.default,
    additionalProperties_1.default,
    dependencies_1.default,
    properties_1.default,
    patternProperties_1.default
  ];
  if (draft2020)
    applicator2.push(prefixItems_1.default, items2020_1.default);
  else
    applicator2.push(additionalItems_1.default, items_1.default);
  applicator2.push(contains_1.default);
  return applicator2;
}
applicator.default = getApplicator;
var format$2 = {};
var format$1 = {};
Object.defineProperty(format$1, "__esModule", { value: true });
const codegen_1$1 = codegen;
const error$1 = {
  message: ({ schemaCode }) => (0, codegen_1$1.str)`must match format "${schemaCode}"`,
  params: ({ schemaCode }) => (0, codegen_1$1._)`{format: ${schemaCode}}`
};
const def$1 = {
  keyword: "format",
  type: ["number", "string"],
  schemaType: "string",
  $data: true,
  error: error$1,
  code(cxt, ruleType) {
    const { gen, data, $data, schema: schema2, schemaCode, it } = cxt;
    const { opts, errSchemaPath, schemaEnv, self } = it;
    if (!opts.validateFormats)
      return;
    if ($data)
      validate$DataFormat();
    else
      validateFormat();
    function validate$DataFormat() {
      const fmts = gen.scopeValue("formats", {
        ref: self.formats,
        code: opts.code.formats
      });
      const fDef = gen.const("fDef", (0, codegen_1$1._)`${fmts}[${schemaCode}]`);
      const fType = gen.let("fType");
      const format2 = gen.let("format");
      gen.if((0, codegen_1$1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1$1._)`${fDef}.type || "string"`).assign(format2, (0, codegen_1$1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1$1._)`"string"`).assign(format2, fDef));
      cxt.fail$data((0, codegen_1$1.or)(unknownFmt(), invalidFmt()));
      function unknownFmt() {
        if (opts.strictSchema === false)
          return codegen_1$1.nil;
        return (0, codegen_1$1._)`${schemaCode} && !${format2}`;
      }
      function invalidFmt() {
        const callFormat = schemaEnv.$async ? (0, codegen_1$1._)`(${fDef}.async ? await ${format2}(${data}) : ${format2}(${data}))` : (0, codegen_1$1._)`${format2}(${data})`;
        const validData = (0, codegen_1$1._)`(typeof ${format2} == "function" ? ${callFormat} : ${format2}.test(${data}))`;
        return (0, codegen_1$1._)`${format2} && ${format2} !== true && ${fType} === ${ruleType} && !${validData}`;
      }
    }
    function validateFormat() {
      const formatDef = self.formats[schema2];
      if (!formatDef) {
        unknownFormat();
        return;
      }
      if (formatDef === true)
        return;
      const [fmtType, format2, fmtRef] = getFormat(formatDef);
      if (fmtType === ruleType)
        cxt.pass(validCondition());
      function unknownFormat() {
        if (opts.strictSchema === false) {
          self.logger.warn(unknownMsg());
          return;
        }
        throw new Error(unknownMsg());
        function unknownMsg() {
          return `unknown format "${schema2}" ignored in schema at path "${errSchemaPath}"`;
        }
      }
      function getFormat(fmtDef) {
        const code2 = fmtDef instanceof RegExp ? (0, codegen_1$1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1$1._)`${opts.code.formats}${(0, codegen_1$1.getProperty)(schema2)}` : void 0;
        const fmt = gen.scopeValue("formats", { key: schema2, ref: fmtDef, code: code2 });
        if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
          return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1$1._)`${fmt}.validate`];
        }
        return ["string", fmtDef, fmt];
      }
      function validCondition() {
        if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
          if (!schemaEnv.$async)
            throw new Error("async format in sync schema");
          return (0, codegen_1$1._)`await ${fmtRef}(${data})`;
        }
        return typeof format2 == "function" ? (0, codegen_1$1._)`${fmtRef}(${data})` : (0, codegen_1$1._)`${fmtRef}.test(${data})`;
      }
    }
  }
};
format$1.default = def$1;
Object.defineProperty(format$2, "__esModule", { value: true });
const format_1$1 = format$1;
const format = [format_1$1.default];
format$2.default = format;
var metadata = {};
Object.defineProperty(metadata, "__esModule", { value: true });
metadata.contentVocabulary = metadata.metadataVocabulary = void 0;
metadata.metadataVocabulary = [
  "title",
  "description",
  "default",
  "deprecated",
  "readOnly",
  "writeOnly",
  "examples"
];
metadata.contentVocabulary = [
  "contentMediaType",
  "contentEncoding",
  "contentSchema"
];
Object.defineProperty(draft7, "__esModule", { value: true });
const core_1 = core$1;
const validation_1 = validation$1;
const applicator_1 = applicator;
const format_1 = format$2;
const metadata_1 = metadata;
const draft7Vocabularies = [
  core_1.default,
  validation_1.default,
  (0, applicator_1.default)(),
  format_1.default,
  metadata_1.metadataVocabulary,
  metadata_1.contentVocabulary
];
draft7.default = draft7Vocabularies;
var discriminator = {};
var types = {};
Object.defineProperty(types, "__esModule", { value: true });
types.DiscrError = void 0;
var DiscrError;
(function(DiscrError2) {
  DiscrError2["Tag"] = "tag";
  DiscrError2["Mapping"] = "mapping";
})(DiscrError || (types.DiscrError = DiscrError = {}));
Object.defineProperty(discriminator, "__esModule", { value: true });
const codegen_1 = codegen;
const types_1 = types;
const compile_1 = compile;
const ref_error_1 = ref_error;
const util_1 = util;
const error = {
  message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
  params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
};
const def = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  error,
  code(cxt) {
    const { gen, data, schema: schema2, parentSchema, it } = cxt;
    const { oneOf: oneOf2 } = parentSchema;
    if (!it.opts.discriminator) {
      throw new Error("discriminator: requires discriminator option");
    }
    const tagName = schema2.propertyName;
    if (typeof tagName != "string")
      throw new Error("discriminator: requires propertyName");
    if (schema2.mapping)
      throw new Error("discriminator: mapping is not supported");
    if (!oneOf2)
      throw new Error("discriminator: requires oneOf keyword");
    const valid = gen.let("valid", false);
    const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
    gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
    cxt.ok(valid);
    function validateMapping() {
      const mapping = getMapping();
      gen.if(false);
      for (const tagValue in mapping) {
        gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
        gen.assign(valid, applyTagSchema(mapping[tagValue]));
      }
      gen.else();
      cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
      gen.endIf();
    }
    function applyTagSchema(schemaProp) {
      const _valid = gen.name("valid");
      const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
      cxt.mergeEvaluated(schCxt, codegen_1.Name);
      return _valid;
    }
    function getMapping() {
      var _a;
      const oneOfMapping = {};
      const topRequired = hasRequired(parentSchema);
      let tagRequired = true;
      for (let i = 0; i < oneOf2.length; i++) {
        let sch = oneOf2[i];
        if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
          const ref2 = sch.$ref;
          sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref2);
          if (sch instanceof compile_1.SchemaEnv)
            sch = sch.schema;
          if (sch === void 0)
            throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref2);
        }
        const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
        if (typeof propSch != "object") {
          throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
        }
        tagRequired = tagRequired && (topRequired || hasRequired(sch));
        addMappings(propSch, i);
      }
      if (!tagRequired)
        throw new Error(`discriminator: "${tagName}" must be required`);
      return oneOfMapping;
      function hasRequired({ required: required2 }) {
        return Array.isArray(required2) && required2.includes(tagName);
      }
      function addMappings(sch, i) {
        if (sch.const) {
          addMapping(sch.const, i);
        } else if (sch.enum) {
          for (const tagValue of sch.enum) {
            addMapping(tagValue, i);
          }
        } else {
          throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
        }
      }
      function addMapping(tagValue, i) {
        if (typeof tagValue != "string" || tagValue in oneOfMapping) {
          throw new Error(`discriminator: "${tagName}" values must be unique strings`);
        }
        oneOfMapping[tagValue] = i;
      }
    }
  }
};
discriminator.default = def;
const $schema = "http://json-schema.org/draft-07/schema#";
const $id = "http://json-schema.org/draft-07/schema#";
const title = "Core schema meta-schema";
const definitions = {
  schemaArray: {
    type: "array",
    minItems: 1,
    items: {
      $ref: "#"
    }
  },
  nonNegativeInteger: {
    type: "integer",
    minimum: 0
  },
  nonNegativeIntegerDefault0: {
    allOf: [
      {
        $ref: "#/definitions/nonNegativeInteger"
      },
      {
        "default": 0
      }
    ]
  },
  simpleTypes: {
    "enum": [
      "array",
      "boolean",
      "integer",
      "null",
      "number",
      "object",
      "string"
    ]
  },
  stringArray: {
    type: "array",
    items: {
      type: "string"
    },
    uniqueItems: true,
    "default": []
  }
};
const type = [
  "object",
  "boolean"
];
const properties = {
  $id: {
    type: "string",
    format: "uri-reference"
  },
  $schema: {
    type: "string",
    format: "uri"
  },
  $ref: {
    type: "string",
    format: "uri-reference"
  },
  $comment: {
    type: "string"
  },
  title: {
    type: "string"
  },
  description: {
    type: "string"
  },
  "default": true,
  readOnly: {
    type: "boolean",
    "default": false
  },
  examples: {
    type: "array",
    items: true
  },
  multipleOf: {
    type: "number",
    exclusiveMinimum: 0
  },
  maximum: {
    type: "number"
  },
  exclusiveMaximum: {
    type: "number"
  },
  minimum: {
    type: "number"
  },
  exclusiveMinimum: {
    type: "number"
  },
  maxLength: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minLength: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  pattern: {
    type: "string",
    format: "regex"
  },
  additionalItems: {
    $ref: "#"
  },
  items: {
    anyOf: [
      {
        $ref: "#"
      },
      {
        $ref: "#/definitions/schemaArray"
      }
    ],
    "default": true
  },
  maxItems: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minItems: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  uniqueItems: {
    type: "boolean",
    "default": false
  },
  contains: {
    $ref: "#"
  },
  maxProperties: {
    $ref: "#/definitions/nonNegativeInteger"
  },
  minProperties: {
    $ref: "#/definitions/nonNegativeIntegerDefault0"
  },
  required: {
    $ref: "#/definitions/stringArray"
  },
  additionalProperties: {
    $ref: "#"
  },
  definitions: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    "default": {}
  },
  properties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    "default": {}
  },
  patternProperties: {
    type: "object",
    additionalProperties: {
      $ref: "#"
    },
    propertyNames: {
      format: "regex"
    },
    "default": {}
  },
  dependencies: {
    type: "object",
    additionalProperties: {
      anyOf: [
        {
          $ref: "#"
        },
        {
          $ref: "#/definitions/stringArray"
        }
      ]
    }
  },
  propertyNames: {
    $ref: "#"
  },
  "const": true,
  "enum": {
    type: "array",
    items: true,
    minItems: 1,
    uniqueItems: true
  },
  type: {
    anyOf: [
      {
        $ref: "#/definitions/simpleTypes"
      },
      {
        type: "array",
        items: {
          $ref: "#/definitions/simpleTypes"
        },
        minItems: 1,
        uniqueItems: true
      }
    ]
  },
  format: {
    type: "string"
  },
  contentMediaType: {
    type: "string"
  },
  contentEncoding: {
    type: "string"
  },
  "if": {
    $ref: "#"
  },
  then: {
    $ref: "#"
  },
  "else": {
    $ref: "#"
  },
  allOf: {
    $ref: "#/definitions/schemaArray"
  },
  anyOf: {
    $ref: "#/definitions/schemaArray"
  },
  oneOf: {
    $ref: "#/definitions/schemaArray"
  },
  not: {
    $ref: "#"
  }
};
const require$$3 = {
  $schema,
  $id,
  title,
  definitions,
  type,
  properties,
  "default": true
};
(function(module, exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.MissingRefError = exports$1.ValidationError = exports$1.CodeGen = exports$1.Name = exports$1.nil = exports$1.stringify = exports$1.str = exports$1._ = exports$1.KeywordCxt = exports$1.Ajv = void 0;
  const core_12 = core$2;
  const draft7_1 = draft7;
  const discriminator_1 = discriminator;
  const draft7MetaSchema = require$$3;
  const META_SUPPORT_DATA = ["/properties"];
  const META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
  class Ajv2 extends core_12.default {
    _addVocabularies() {
      super._addVocabularies();
      draft7_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      if (!this.opts.meta)
        return;
      const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
      this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
    }
  }
  exports$1.Ajv = Ajv2;
  module.exports = exports$1 = Ajv2;
  module.exports.Ajv = Ajv2;
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.default = Ajv2;
  var validate_12 = validate;
  Object.defineProperty(exports$1, "KeywordCxt", { enumerable: true, get: function() {
    return validate_12.KeywordCxt;
  } });
  var codegen_12 = codegen;
  Object.defineProperty(exports$1, "_", { enumerable: true, get: function() {
    return codegen_12._;
  } });
  Object.defineProperty(exports$1, "str", { enumerable: true, get: function() {
    return codegen_12.str;
  } });
  Object.defineProperty(exports$1, "stringify", { enumerable: true, get: function() {
    return codegen_12.stringify;
  } });
  Object.defineProperty(exports$1, "nil", { enumerable: true, get: function() {
    return codegen_12.nil;
  } });
  Object.defineProperty(exports$1, "Name", { enumerable: true, get: function() {
    return codegen_12.Name;
  } });
  Object.defineProperty(exports$1, "CodeGen", { enumerable: true, get: function() {
    return codegen_12.CodeGen;
  } });
  var validation_error_12 = validation_error;
  Object.defineProperty(exports$1, "ValidationError", { enumerable: true, get: function() {
    return validation_error_12.default;
  } });
  var ref_error_12 = ref_error;
  Object.defineProperty(exports$1, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_12.default;
  } });
})(ajv, ajv.exports);
var ajvExports = ajv.exports;
const Ajv = /* @__PURE__ */ getDefaultExportFromCjs(ajvExports);
const TEMPLATE_RE = /\[\[\[[\s\S]*\]\]\]|\{\{[\s\S]*\}\}|\{%|\{[a-zA-Z_][\w.:-]*\}/;
function isTemplateString(value) {
  return typeof value === "string" && TEMPLATE_RE.test(value);
}
const ENTITY_ID = /^[a-z_]+\.[a-z0-9_]+$/;
const EDITOR_SERIES = /^series_\d+$/;
const EDITOR_PLACEHOLDER = /^series_\d+_placeholder$/;
const INLINE_KEYS = /* @__PURE__ */ new Set(["entity", "attribute", "history", "name", "type", "yaxis"]);
const clone$1 = (value) => JSON.parse(JSON.stringify(value));
function cleanAttribute(attribute) {
  if (typeof attribute !== "string") return void 0;
  const trimmed = attribute.trim();
  return trimmed === "" || trimmed === "state" ? void 0 : trimmed;
}
function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== void 0 && v !== ""));
}
function legacyBuffer(item) {
  const raw = item.buffer && item.key && !String(item.buffer).includes(".") ? `${item.buffer}.${item.key}` : item.buffer ?? item.key;
  if (!raw) return void 0;
  const key = String(raw).split(".").pop();
  return key === "main" ? void 0 : key;
}
function isCanonicalItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  if ("key" in item || "id" in item || "yaxis" in item) return false;
  if (typeof item.entity === "string") return cleanAttribute(item.attribute) === item.attribute;
  if (typeof item.datasource === "string") {
    return !EDITOR_SERIES.test(item.datasource) && !EDITOR_PLACEHOLDER.test(item.datasource) && (item.buffer === void 0 || !String(item.buffer).includes(".") && item.buffer !== "main");
  }
  return false;
}
function isCanonical$1(config) {
  const legacyRootKeys = ["source", "data_source", "series_names", "history_hours", "show_legend", "max_points", "attribute"];
  if (legacyRootKeys.some((k) => k in config)) return false;
  if (config.sources !== void 0 && !Array.isArray(config.sources)) return false;
  if (!(config.sources ?? []).every(isCanonicalItem)) return false;
  const dataSources = config.data_sources ?? {};
  return Object.entries(dataSources).every(([name, ds]) => !EDITOR_SERIES.test(name) && !EDITOR_PLACEHOLDER.test(name) && !(ds && typeof ds === "object" && ("name" in ds || "type" in ds || ds.attribute === "state" || ds.attribute === "")));
}
function migrateChartConfig(config) {
  if (!config || typeof config !== "object" || isCanonical$1(config)) {
    return { config, changed: false, notes: [] };
  }
  const out = clone$1(config);
  const notes = [];
  const dataSources = out.data_sources && typeof out.data_sources === "object" ? out.data_sources : {};
  let rawSources = out.source ?? out.data_source ?? out.sources;
  if (rawSources !== void 0 && !Array.isArray(rawSources)) rawSources = [rawSources];
  rawSources = rawSources ?? [];
  const rootAttribute = cleanAttribute(out.attribute);
  const usedSingleSource = out.source !== void 0 || out.data_source !== void 0;
  if (usedSingleSource && Array.isArray(out.sources) && out.sources.length) {
    notes.push("sources ignored: source/data_source took precedence (as before)");
  }
  if (out.source !== void 0 || out.data_source !== void 0) {
    notes.push("source/data_source moved to sources[]");
  }
  const seriesNames = Array.isArray(out.series_names) ? out.series_names : out.series_names ? [out.series_names] : [];
  const refOf = (item) => typeof item === "string" ? item : item?.datasource ?? item?.id ?? (item?.entity ? void 0 : item?.name);
  const refCounts = /* @__PURE__ */ new Map();
  for (const item of rawSources) {
    const ref2 = refOf(item);
    if (ref2) refCounts.set(ref2, (refCounts.get(ref2) ?? 0) + 1);
  }
  let inlinedHours = 0;
  const inlined = /* @__PURE__ */ new Set();
  const sources = [];
  rawSources.forEach((item, index) => {
    if (isCanonicalItem(item)) {
      const series = { ...item };
      if (seriesNames[index] && series.name === void 0) series.name = seriesNames[index];
      sources.push(series);
      return;
    }
    const isObject2 = item && typeof item === "object";
    const ref2 = refOf(item);
    if (!ref2 && !(isObject2 && typeof item.entity === "string")) {
      notes.push(`sources[${index}] had no source reference and was dropped`);
      return;
    }
    const ds = ref2 ? dataSources[ref2] : void 0;
    const display = compact({
      name: (isObject2 && (item.datasource || item.id) ? item.name : void 0) ?? seriesNames[index] ?? ds?.name,
      type: (isObject2 ? item.type : void 0) ?? ds?.type
    });
    if (isObject2 && "yaxis" in item) notes.push(`sources[${index}].yaxis removed (it never had an effect; use yaxis_id)`);
    if (isObject2 && typeof item.entity === "string") {
      sources.push(compact({ ...item, attribute: cleanAttribute(item.attribute), yaxis: void 0, ...display }));
      return;
    }
    if (EDITOR_PLACEHOLDER.test(ref2)) {
      notes.push(`placeholder series ${ref2} removed`);
      inlined.add(ref2);
      return;
    }
    const buffer = isObject2 ? legacyBuffer(item) : void 0;
    const inlineable = ds && EDITOR_SERIES.test(ref2) && !buffer && !ds.processing && refCounts.get(ref2) === 1 && Object.keys(ds).every((k) => INLINE_KEYS.has(k));
    if (inlineable) {
      sources.push(compact({ entity: ds.entity, attribute: cleanAttribute(ds.attribute), ...display }));
      if (ds.history?.hours) inlinedHours = Math.max(inlinedHours, ds.history.hours);
      inlined.add(ref2);
      notes.push(`${ref2} inlined into sources[${sources.length - 1}]`);
      return;
    }
    if (ds || !ENTITY_ID.test(ref2)) {
      sources.push(compact({ datasource: ref2, buffer, ...display }));
      return;
    }
    const attribute = usedSingleSource ? rootAttribute : void 0;
    sources.push(compact({ entity: ref2, attribute, ...display }));
  });
  if (out.data_sources) {
    for (const name of inlined) delete dataSources[name];
    const stillUsed = new Set(sources.map((s) => s.datasource).filter(Boolean));
    for (const name of Object.keys(dataSources)) {
      if ((EDITOR_SERIES.test(name) || EDITOR_PLACEHOLDER.test(name)) && !stillUsed.has(name)) {
        delete dataSources[name];
        notes.push(`unused ${name} removed`);
      }
    }
    for (const ds of Object.values(dataSources)) {
      if (!ds || typeof ds !== "object") continue;
      delete ds.name;
      delete ds.type;
      delete ds.yaxis;
      if (cleanAttribute(ds.attribute) === void 0) delete ds.attribute;
    }
    if (Object.keys(dataSources).length === 0) delete out.data_sources;
  }
  if (out.graph_span === void 0) {
    const hours = out.history_hours ?? (inlinedHours || void 0);
    if (hours) {
      out.graph_span = `${hours}h`;
      notes.push(`history hours mapped to graph_span: ${out.graph_span}`);
    }
  }
  if ("show_legend" in out) {
    if (out.style?.legend?.show === void 0) {
      out.style = { ...out.style, legend: { ...out.style?.legend, show: out.show_legend } };
    }
    notes.push("show_legend moved to style.legend.show");
  }
  if ("max_points" in out) notes.push("max_points removed (it never had an effect; use group_by)");
  if ("attribute" in out && !usedSingleSource) notes.push("root attribute removed (it only applied to source)");
  for (const key of ["source", "data_source", "series_names", "history_hours", "show_legend", "max_points", "attribute"]) {
    delete out[key];
  }
  if (rawSources.length || sources.length) out.sources = sources;
  const changed = JSON.stringify(out) !== JSON.stringify(config);
  return { config: changed ? out : config, changed, notes };
}
const LEGACY_MODES = { random: "decorative", template: "data", datasource: "data" };
const LEGACY_ROOT_STYLE = ["font_size", "font_family", "font_weight", "align"];
const LEGACY_GRID = ["rows", "columns", "cell_width"];
const CASCADE_KEYS = ["pattern", "colors", "speed_multiplier", "duration", "ease", "easing", "timing"];
const HIGHLIGHT_KEYS = {
  change_preset: "preset",
  change_duration: "duration",
  change_easing: "ease",
  change_params: "params",
  max_highlight_cells: "max_cells"
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function isCanonical(config) {
  if ("animation" in config) return false;
  if (config.data_mode in LEGACY_MODES) return false;
  if (LEGACY_ROOT_STYLE.some((k) => k in config)) return false;
  if (isObject(config.grid) && LEGACY_GRID.some((k) => k in config.grid)) return false;
  if (Array.isArray(config.rows) && config.rows.some((r) => isObject(r) && ("cellStyles" in r || "sources" in r))) return false;
  return true;
}
function migrateDataGridConfig(config) {
  if (!config || typeof config !== "object" || isCanonical(config)) {
    return { config, changed: false, notes: [] };
  }
  const out = clone(config);
  const notes = [];
  if (out.data_mode in LEGACY_MODES) {
    notes.push(`data_mode: ${out.data_mode} is now ${LEGACY_MODES[out.data_mode]}`);
    out.data_mode = LEGACY_MODES[out.data_mode];
  }
  if (isObject(out.grid) && LEGACY_GRID.some((k) => k in out.grid)) {
    const grid = out.grid;
    const rows = Number(grid.rows);
    const columns = Number(grid.columns);
    const cellWidth = grid.cell_width;
    if (!grid["grid-template-rows"] && rows > 0) {
      grid["grid-template-rows"] = `repeat(${rows}, auto)`;
    }
    if (!grid["grid-template-columns"] && (columns > 0 || cellWidth !== void 0)) {
      const width = cellWidth === void 0 || cellWidth === "auto" ? "1fr" : typeof cellWidth === "number" ? `${cellWidth}px` : String(cellWidth);
      grid["grid-template-columns"] = `repeat(${columns > 0 ? columns : 12}, ${width})`;
    }
    for (const k of LEGACY_GRID) delete grid[k];
    notes.push("grid rows/columns/cell_width moved to grid-template-rows/grid-template-columns");
  }
  const rootStyle = LEGACY_ROOT_STYLE.filter((k) => k in out);
  if (rootStyle.length) {
    const style = isObject(out.style) ? out.style : {};
    for (const k of rootStyle) {
      if (style[k] === void 0) style[k] = out[k];
      delete out[k];
    }
    out.style = style;
    notes.push(`${rootStyle.join(", ")} moved into style`);
  }
  if ("animation" in out) {
    const legacy = isObject(out.animation) ? out.animation : {};
    delete out.animation;
    const animations = Array.isArray(out.animations) ? out.animations : [];
    let cascade = animations.find((a) => a?.preset === "cascade-color");
    if (legacy.type === "cascade" && !cascade) {
      cascade = { trigger: "on_load", preset: "cascade-color" };
      const params = {};
      for (const k of CASCADE_KEYS) {
        if (legacy[k] !== void 0) params[k === "easing" ? "ease" : k] = legacy[k];
      }
      if (Object.keys(params).length) cascade.params = params;
      animations.push(cascade);
      out.animations = animations;
      notes.push("animation.type: cascade moved to animations (cascade-color)");
    } else if (Array.isArray(legacy.timing)) {
      if (cascade) {
        cascade.params = isObject(cascade.params) ? cascade.params : {};
        if (cascade.params.timing === void 0) cascade.params.timing = legacy.timing;
        notes.push("animation.timing moved to the cascade-color params");
      } else {
        notes.push("animation.timing dropped: there is no cascade-color animation");
      }
    }
    if (legacy.highlight_changes) {
      const highlight = {};
      for (const [from, to] of Object.entries(HIGHLIGHT_KEYS)) {
        if (legacy[from] !== void 0) highlight[to] = legacy[from];
      }
      if (out.highlight_changes === void 0) {
        out.highlight_changes = Object.keys(highlight).length ? highlight : true;
      }
      notes.push("animation.highlight_changes moved to highlight_changes");
    }
  }
  if (Array.isArray(out.rows)) {
    let movedStyles = false;
    let droppedSources = false;
    out.rows = out.rows.map((row) => {
      if (!isObject(row)) return row;
      if ("sources" in row) {
        delete row.sources;
        droppedSources = true;
      }
      if ("cellStyles" in row) {
        const styles = Array.isArray(row.cellStyles) ? row.cellStyles : [];
        const values = Array.isArray(row.values) ? row.values : [];
        row.values = values.map((cell, i) => {
          const style = styles[i];
          if (!isObject(style) || !Object.keys(style).length) return cell;
          movedStyles = true;
          return isObject(cell) ? { ...cell, style: { ...style, ...cell.style || {} } } : { value: cell, style };
        });
        delete row.cellStyles;
      }
      return row;
    });
    if (movedStyles) notes.push("rows cellStyles moved onto each cell ({ value, style })");
    if (droppedSources) notes.push("rows sources dropped (an old format the card no longer reads)");
  }
  return { config: out, changed: true, notes };
}
const THEME_PATH_ALLOWED_PREFIXES = [
  "components.",
  // component pack internal defaults
  "colors.grid.",
  // data-grid pack colour namespace
  "colors.lcars.",
  // card-specific lcars colour overrides
  "palette.",
  // example pack / user palette overrides
  "colors.ui."
  // UI state colour namespace (active/inactive/default/unavailable)
];
const THEME_PATH_EXEMPTIONS = /* @__PURE__ */ new Set([
  "lighten",
  // theme:lighten(path, amount) colour function
  "darken",
  // theme:darken(path, amount) colour function
  "alpha",
  // theme:alpha(path, amount) colour function
  "mix",
  // theme:mix(path1, path2, ratio)
  "base",
  // theme:base(path): resolve to the pre-alert-mutation baseline value
  "token"
  // theme:token.path documentation placeholder
]);
function classifyThemePath(path, tokenPaths) {
  if (THEME_PATH_EXEMPTIONS.has(path.split(".")[0].split("(")[0])) return "exempt";
  if (THEME_PATH_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) return "open";
  return tokenPaths.has(path) ? "known" : "unknown";
}
const CARD_PLUMBING_KEYS = /* @__PURE__ */ new Set(["type", "grid_options", "view_layout", "visibility", "layout_options", "card_mod"]);
function stripSchemaRestrictions(node) {
  if (Array.isArray(node)) return node.map(stripSchemaRestrictions);
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "additionalProperties" && (v === false || v === "warn")) continue;
      if (k === "$ref") continue;
      if (typeof v === "function") continue;
      if (k === "enum" && Array.isArray(v) && v.length === 0) continue;
      if ((k === "oneOf" || k === "anyOf" || k === "allOf") && Array.isArray(v)) {
        const stripped = v.map(stripSchemaRestrictions).filter((item) => !(item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).length === 0));
        if (stripped.length > 0) out[k] = stripped;
        continue;
      }
      out[k] = stripSchemaRestrictions(v);
    }
    return out;
  }
  return node;
}
function schemaForKey(schema2, key) {
  if (!schema2 || typeof schema2 !== "object") return void 0;
  const branches = [schema2, ...schema2.anyOf ?? [], ...schema2.oneOf ?? [], ...schema2.allOf ?? []].filter((b) => b && typeof b === "object");
  let declaresProperties = false;
  for (const b of branches) {
    if (b !== schema2 && (b.anyOf || b.oneOf || b.allOf)) {
      const nested = schemaForKey(b, key);
      if (nested !== false) return nested;
      declaresProperties = true;
      continue;
    }
    if (b.properties && Object.prototype.hasOwnProperty.call(b.properties, key)) return b.properties[key];
    for (const [pattern2, sub] of Object.entries(b.patternProperties ?? {})) {
      if (new RegExp(pattern2).test(key)) return sub;
    }
    if (b.additionalProperties === true) return void 0;
    if (b.additionalProperties && typeof b.additionalProperties === "object") return b.additionalProperties;
    if (b.properties || b.patternProperties) declaresProperties = true;
  }
  return declaresProperties ? false : void 0;
}
function declaredKeys(schema2, out = /* @__PURE__ */ new Set()) {
  if (!schema2 || typeof schema2 !== "object") return out;
  for (const k of Object.keys(schema2.properties ?? {})) out.add(k);
  for (const b of [...schema2.anyOf ?? [], ...schema2.oneOf ?? [], ...schema2.allOf ?? []]) declaredKeys(b, out);
  return out;
}
function unknownKeys(value, schema2, pathPrefix = "", out = [], isCardRoot = false, hints = null) {
  if (!value || typeof value !== "object" || !schema2) return out;
  if (Array.isArray(value)) {
    const items2 = schema2.items ?? [schema2, ...schema2.anyOf ?? [], ...schema2.oneOf ?? []].find((b) => b?.items)?.items;
    value.forEach((v, i) => unknownKeys(v, items2, `${pathPrefix}[${i}]`, out, false, hints));
    return out;
  }
  for (const [key, v] of Object.entries(value)) {
    if (isCardRoot && CARD_PLUMBING_KEYS.has(key)) continue;
    const sub = schemaForKey(schema2, key);
    const p = pathPrefix ? `${pathPrefix}.${key}` : key;
    if (sub === false) {
      out.push(p);
      if (hints) {
        const hint = closest(key, [...declaredKeys(schema2)]);
        if (hint) hints.set(p, hint);
      }
      continue;
    }
    if (sub) unknownKeys(v, sub, p, out, false, hints);
  }
  return out;
}
function lcardsTag(type2) {
  if (typeof type2 !== "string") return null;
  const m = /^custom:(lcards-[a-z0-9-]+|lcars-shell)$/.exec(type2.trim());
  return m ? m[1] : null;
}
function collectLcardsNodes(root, path = "", out = []) {
  if (Array.isArray(root)) {
    root.forEach((item, i) => collectLcardsNodes(item, `${path}[${i}]`, out));
  } else if (root && typeof root === "object") {
    const tag = lcardsTag(root.type);
    if (tag) out.push({ node: root, path, tag });
    for (const [k, v] of Object.entries(root)) collectLcardsNodes(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}
const isLiteral = (v) => typeof v === "string" && v.trim() !== "" && !isTemplateString(v);
function walk(value, path, visit, isRoot = true) {
  if (!isRoot && value && typeof value === "object" && !Array.isArray(value) && lcardsTag(value.type)) return;
  visit(value, path);
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit, false));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, visit, false);
  }
}
function registryIssues(node, tag, reg) {
  const out = [];
  const tokenSet = new Set(reg.theme_tokens);
  const check = (path, value, list, what) => {
    if (isLiteral(value) && !list.includes(value)) out.push({ path, message: `unknown ${what} "${value}"${suggest(value, list)}` });
  };
  const componentPresets = isLiteral(node.component) && reg.component_presets?.[node.component] ? [...reg.component_presets[node.component], ...Object.keys(node[node.component]?.custom_presets ?? {})] : null;
  if (componentPresets) check("preset", node.preset, [...componentPresets, ...reg.button_presets], `${node.component} component preset or button preset`);
  else if (["lcards-button", "lcards-elbow", "lcards-select-menu"].includes(tag)) check("preset", node.preset, reg.button_presets, "button preset");
  if (componentPresets && Array.isArray(node.ranges)) {
    node.ranges.forEach((range, i) => check(`ranges[${i}].preset`, range?.preset, componentPresets, `${node.component} component preset`));
  }
  if (tag === "lcards-slider") {
    check("preset", node.preset, reg.slider_presets, "slider preset");
    check("component", node.component, reg.components.slider ?? [], "slider component");
  }
  if (tag === "lcards-button") check("component", node.component, Object.values(reg.components).flat(), "component");
  if (tag === "lcards-msd-card") check("msd.base_svg.source", builtinOnly(node.msd?.base_svg?.source), reg.msd_backgrounds, "built-in MSD background");
  walk(node, "", (value, path) => {
    if (typeof value === "string") {
      for (const m of value.matchAll(/theme:([a-zA-Z][a-zA-Z0-9._-]*)/g)) {
        if (classifyThemePath(m[1], tokenSet) === "unknown") out.push({ path, message: `unknown theme token "theme:${m[1]}"${suggest(m[1], reg.theme_tokens).replace('"', '"theme:')}` });
      }
      return;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const key = path.replace(/\[\d+\]$/, "").split(".").pop();
    const inList = /\[\d+\]$/.test(path);
    if (inList && key === "animations") check(`${path}.preset`, value.preset, reg.animation_presets, "animation preset");
    if (inList && (key === "background_animation" || key === "effects")) check(`${path}.preset`, value.preset, reg.background_presets, "background animation preset");
    if (inList && key === "filters") check(`${path}.type`, value.type, reg.filters, "filter");
    if (key === "sounds" && !inList) {
      for (const [event, asset] of Object.entries(value)) {
        if (event === "enabled" || typeof asset === "string" && asset.startsWith("media-source://")) continue;
        check(`${path}.${event}`, asset, reg.sound_assets, "sound asset");
      }
    }
  });
  return out;
}
function builtinOnly(source) {
  return typeof source === "string" && source.startsWith("builtin:") ? source : void 0;
}
function suggest(value, list) {
  const best = closest(value, list);
  return best ? ` (did you mean "${best}"?)` : "";
}
function closest(value, list) {
  let best = null;
  let bestScore = Infinity;
  for (const candidate of list) {
    const d = distance(value.toLowerCase(), candidate.toLowerCase());
    if (d < bestScore) {
      bestScore = d;
      best = candidate;
    }
  }
  return best && bestScore <= Math.max(2, Math.floor(value.length / 4)) ? best : null;
}
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}
function createConfigValidator({ entries, registries = null }) {
  const ajv2 = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  ajv2.removeKeyword("pattern");
  ajv2.addKeyword({
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    validate: (pattern2, data) => isTemplateString(data) || new RegExp(pattern2, "u").test(data)
  });
  const raw = /* @__PURE__ */ new Map();
  const compiled = /* @__PURE__ */ new Map();
  for (const { tag, schema: schema2 } of entries) {
    raw.set(tag, schema2);
    compiled.set(tag, ajv2.compile(stripSchemaRestrictions(schema2)));
  }
  function validateNode(node, tag, at) {
    const issues = [];
    const add = (severity, code2, path, message) => issues.push({ path: [at, path].filter(Boolean).join(".") || "(root)", tag, severity, code: code2, message });
    if (tag === "lcards-msd-card" && !node.msd?.base_svg?.source && !Array.isArray(node.msd?.view_box)) {
      add("error", "msd-canvas", "msd", "MSD has neither msd.base_svg.source nor a view_box [x, y, w, h]");
    }
    if (tag === "lcards-msd-card" && node.msd?.base_svg?.source === "none" && !Array.isArray(node.msd?.view_box)) {
      add("error", "msd-canvas", "msd.view_box", 'base_svg.source "none" needs a view_box [x, y, w, h]');
    }
    const validate2 = compiled.get(tag);
    if (!validate2) return issues;
    const migrator = { "lcards-chart": migrateChartConfig, "lcards-data-grid": migrateDataGridConfig }[tag];
    if (migrator) {
      const { changed, notes } = migrator(node);
      if (changed) add("warning", "legacy-format", "", `legacy ${tag === "lcards-chart" ? "chart" : "data grid"} format (still works; ${notes.join("; ") || "legacy keys"})`);
    }
    const hints = /* @__PURE__ */ new Map();
    for (const key of unknownKeys(node, raw.get(tag), "", [], true, hints)) {
      add("error", "unknown-key", key, `unknown key (not in the schema)${hints.has(key) ? ` (did you mean "${hints.get(key)}"?)` : ""}`);
    }
    if (!validate2(node)) {
      for (const err of validate2.errors ?? []) {
        const p = err.instancePath.replace(/^\//, "").replace(/\/(\d+)(?=\/|$)/g, "[$1]").replace(/\//g, ".");
        add("error", "schema", p, err.message ?? "invalid");
      }
    }
    if (registries) {
      for (const r of registryIssues(node, tag, registries)) add("warning", "registry", r.path, r.message);
    }
    return issues;
  }
  return {
    tags: [...compiled.keys()],
    /** Issues for every LCARdS node in a parsed config (a card, a view, a whole dashboard). */
    validateConfig(config) {
      return collectLcardsNodes(config).flatMap(({ node, path, tag }) => validateNode(node, tag, path));
    },
    validateNode
  };
}
async function buildRegistries() {
  throw new Error("registries are bundled");
}
const _lcardsRegistriesStub = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  buildRegistries
}, Symbol.toStringTag, { value: "Module" }));
var define_LCARDS_REGISTRIES_default = { $comment: "LCARdS 2026.10.0-dev.3: built-in names a config can refer to. Generated by scripts/generate-llm-schema.js; do not hand-edit. User packs can add more at runtime.", lcards_version: "2026.10.0-dev.3", button_presets: ["bar-label-base", "bar-label-bullet-left", "bar-label-bullet-right", "bar-label-capped-left", "bar-label-capped-right", "bar-label-center", "bar-label-left", "bar-label-lozenge", "bar-label-right", "bar-label-square", "barrel", "barrel-right", "bullet", "bullet-right", "capped", "capped-right", "filled", "filled-right", "icon", "lozenge", "lozenge-right", "outline", "outline-right", "panel-dark", "panel-light", "text-only"], slider_presets: ["gauge-basic", "gauge-left-border", "gauge-left-border-rounded", "picard-gauge-vertical", "pills-basic", "pills-left-border", "pills-left-border-rounded", "shaped-horizontal", "shaped-vertical"], components: { dpad: ["dpad"], dpad_voyager: ["dpad_voyager"], slider: ["default", "demo", "picard", "shaped"], elbow: ["diagonal-cap-footer-left", "diagonal-cap-footer-right", "diagonal-cap-left", "diagonal-cap-right", "footer-contained", "footer-left", "footer-open", "footer-right", "frame", "header-contained", "header-left", "header-open", "header-right"], alert: ["alert"] }, component_presets: { dpad: ["default"], dpad_voyager: ["default"], alert: ["condition_black", "condition_blue", "condition_gray", "condition_green", "condition_red", "condition_yellow", "default"] }, animation_presets: ["blink", "bounce", "cascade", "cascade-color", "chaos", "color-shift", "draw", "fade", "flicker", "glitch", "glow", "march", "motionpath", "physics-spring", "pulse", "ripple", "rotate", "scale", "scale-reset", "sequence", "set", "shake", "shimmer", "skew", "slide", "stagger-flash", "stagger-grid", "stagger-radial", "stagger-wave", "strobe", "text-glitch", "text-reveal", "text-scramble", "text-typewriter", "timeline-attention", "timeline-cascade"], background_presets: ["cascade", "contour-field", "flow", "fluid", "grid", "grid-diagonal", "grid-hexagonal", "image", "level", "nebula", "plasma", "scanlines", "shimmer", "solid", "starfield"], filters: ["blur", "brightness", "contrast", "drop-shadow", "feBlend", "feColorMatrix", "feComposite", "feDisplacementMap", "feGaussianBlur", "feMorphology", "feOffset", "feTurbulence", "grayscale", "hue-rotate", "invert", "opacity", "saturate", "sepia", "tint"], sound_events: ["alert_black", "alert_blue", "alert_clear", "alert_gray", "alert_red", "alert_yellow", "button_tap", "card_double_tap", "card_hold", "card_hover", "card_tap", "dashboard_edit_save", "dashboard_edit_start", "dialog_close", "dialog_open", "error", "menu_expand", "more_info_open", "nav_page", "notification", "slider_change", "slider_drag_end", "slider_drag_start", "system_ready", "toggle_off", "toggle_on"], sound_schemes: ["lcards_default"], sound_assets: ["alert_klaxon_1", "alert_klaxon_2", "astrometrics_controls", "computer_activate", "computer_beep_sequence_1", "computer_beep_sequence_2", "computer_beep_sequence_3", "computer_beep_sequence_4", "computer_beep_sequence_5", "computer_screen_off_button_push", "ds9_bajoran_comm", "ds9_doorchime", "ent_b_swoosh_clean", "ent_doorchime", "forcefield_powering_down", "helm_beep_sequence_1", "helm_beep_sequence_2", "helm_beep_sequence_3", "jefferies_tube", "key_ok_1", "key_ok_2", "key_ok_3", "key_ok_4", "key_ok_5", "key_ok_6", "lcards_default_alert_black", "lcards_default_alert_blue", "lcards_default_alert_clear", "lcards_default_alert_gray", "lcards_default_alert_red", "lcards_default_alert_yellow", "lcards_default_dashboard_edit_save", "lcards_default_dashboard_edit_start", "lcards_default_dialog_close", "lcards_default_dialog_open", "lcards_default_double_tap", "lcards_default_error", "lcards_default_hold", "lcards_default_hover", "lcards_default_menu_expand", "lcards_default_nav", "lcards_default_notification", "lcards_default_slider_grab", "lcards_default_slider_release", "lcards_default_system_ready", "lcards_default_tap", "lcards_default_toggle_off", "lcards_default_toggle_on", "ops_beep_sequence", "padd_1", "padd_2", "padd_3", "padd_button_sequence", "power_down", "power_hold_and_off", "power_up1", "power_up2", "power_up3", "power_up4", "screen_scroll_1", "screen_scroll_2", "screen_scroll_3", "sensors_1", "short", "tactical_beep_sequence", "ten_forward_doors", "tng_chime_clean", "tng_chirp_1", "tng_chirp_2", "tng_chirp_3", "tng_nemesis_intruder_alert", "tng_poweringdown", "tng_poweringup", "tng_powerloss", "tng_red_alert_1", "tng_red_alert_2", "tng_red_alert_3", "tng_red_alert_4", "tng_swoosh_clean", "voy_blue_alert", "voy_door_chime_1", "voy_door_chime_2", "voy_intruder_alert", "voy_red_alert_1", "voy_red_alert_2"], msd_backgrounds: ["builtin:enterprise-d-shuttlecraft15-anomaly", "builtin:ncc-1701-a", "builtin:ncc-1701-a-blue", "builtin:ncc-1701-kelvin"], text_positions: ["top-left", "top-center", "top-right", "center-left", "center", "center-right", "bottom-left", "bottom-center", "bottom-right", "top", "bottom", "left", "right", "left-center", "right-center"], theme_tokens: ["borders.radius.base", "borders.radius.full", "borders.radius.lg", "borders.radius.none", "borders.radius.sm", "borders.radius.xl", "borders.width.base", "borders.width.none", "borders.width.thick", "borders.width.thin", "colors.alert.black", "colors.alert.blue", "colors.alert.gray", "colors.alert.green", "colors.alert.red", "colors.alert.yellow", "colors.card.bottomColor", "colors.card.button", "colors.card.buttonOff", "colors.card.buttonOn", "colors.card.buttonUnavailable", "colors.card.topColor", "colors.chart.axis", "colors.chart.background", "colors.chart.grid", "colors.chart.series", "colors.chart.stroke", "colors.grid.cascadeEnd", "colors.grid.cascadeMid", "colors.grid.cascadeStart", "colors.status.error", "colors.status.success", "colors.status.unknown", "colors.status.warning", "colors.text.disabled", "colors.text.onDark", "colors.text.onLight", "colors.ui.primary", "colors.ui.quaternary", "colors.ui.secondary", "colors.ui.tertiary", "components.alert.bars.stroke.default", "components.alert.shape.fill.active", "components.alert.shape.fill.default", "components.alert.shape.fill.hover", "components.alert.shape.fill.inactive", "components.alert.shape.fill.pressed", "components.alert.shape.fill.unavailable", "components.alert.text.alert_text.fill.default", "components.alert.text.sub_text.fill.default", "components.backgroundAnimation.grid.fill.color", "components.backgroundAnimation.grid.intervals.majorCol", "components.backgroundAnimation.grid.intervals.majorRow", "components.backgroundAnimation.grid.line.color", "components.backgroundAnimation.grid.line.colorMajor", "components.backgroundAnimation.grid.line.width", "components.backgroundAnimation.grid.line.widthMajor", "components.backgroundAnimation.grid.scroll.speedDiagonal", "components.backgroundAnimation.grid.scroll.speedFilled", "components.backgroundAnimation.grid.scroll.speedX", "components.backgroundAnimation.grid.scroll.speedY", "components.backgroundAnimation.grid.spacing.default", "components.backgroundAnimation.grid.spacing.diagonal", "components.backgroundAnimation.grid.spacing.filled", "components.backgroundAnimation.grid.spacing.hexRadius", "components.backgroundAnimation.nebula.cloud.colors", "components.backgroundAnimation.nebula.cloud.count", "components.backgroundAnimation.nebula.cloud.maxOpacity", "components.backgroundAnimation.nebula.cloud.maxRadius", "components.backgroundAnimation.nebula.cloud.minOpacity", "components.backgroundAnimation.nebula.cloud.minRadius", "components.backgroundAnimation.nebula.scroll.speedX", "components.backgroundAnimation.nebula.scroll.speedY", "components.backgroundAnimation.nebula.turbulence.intensity", "components.backgroundAnimation.nebula.turbulence.noiseScale", "components.backgroundAnimation.starfield.parallax.depthFactor", "components.backgroundAnimation.starfield.parallax.layers", "components.backgroundAnimation.starfield.scroll.speedX", "components.backgroundAnimation.starfield.scroll.speedY", "components.backgroundAnimation.starfield.star.color", "components.backgroundAnimation.starfield.star.count", "components.backgroundAnimation.starfield.star.maxOpacity", "components.backgroundAnimation.starfield.star.maxRadius", "components.backgroundAnimation.starfield.star.minOpacity", "components.backgroundAnimation.starfield.star.minRadius", "components.button.background.active", "components.button.background.default", "components.button.background.hover", "components.button.background.inactive", "components.button.background.pressed", "components.button.background.transparent", "components.button.background.unavailable", "components.button.border.color.active", "components.button.border.color.default", "components.button.border.color.hover", "components.button.border.color.inactive", "components.button.border.color.pressed", "components.button.border.color.unavailable", "components.button.border.radius", "components.button.border.width", "components.button.icon.color.active", "components.button.icon.color.default", "components.button.icon.color.inactive", "components.button.icon.color.unavailable", "components.button.icon.divider.color.active", "components.button.icon.divider.color.default", "components.button.icon.divider.color.inactive", "components.button.icon.divider.color.unavailable", "components.button.icon.divider.width", "components.button.icon.layout_spacing", "components.button.icon.size", "components.button.layout.height.icon", "components.button.layout.height.standard", "components.button.layout.minHeight", "components.button.layout.minWidth", "components.button.radius.full", "components.button.radius.large", "components.button.radius.none", "components.button.text.cap_height_ratio", "components.button.text.color.active", "components.button.text.color.default", "components.button.text.color.inactive", "components.button.text.color.unavailable", "components.button.text.font_family", "components.button.text.font_size", "components.button.text.font_weight", "components.button.text.text_transform", "components.chart.axisColor", "components.chart.colors", "components.chart.fontFamily", "components.chart.fontSize", "components.chart.gridColor", "components.chart.strokeWidth", "components.dpad.segment.center.fill.active", "components.dpad.segment.center.fill.default", "components.dpad.segment.center.fill.hover", "components.dpad.segment.center.fill.inactive", "components.dpad.segment.center.fill.pressed", "components.dpad.segment.center.fill.unavailable", "components.dpad.segment.center.fill.unknown", "components.dpad.segment.center.stroke-width.active", "components.dpad.segment.center.stroke-width.hover", "components.dpad.segment.center.stroke-width.inactive", "components.dpad.segment.center.stroke-width.pressed", "components.dpad.segment.center.stroke-width.unavailable", "components.dpad.segment.center.stroke-width.unknown", "components.dpad.segment.center.stroke.active", "components.dpad.segment.center.stroke.hover", "components.dpad.segment.center.stroke.inactive", "components.dpad.segment.center.stroke.pressed", "components.dpad.segment.center.stroke.unavailable", "components.dpad.segment.center.stroke.unknown", "components.dpad.segment.diagonal.fill.active", "components.dpad.segment.diagonal.fill.default", "components.dpad.segment.diagonal.fill.hover", "components.dpad.segment.diagonal.fill.inactive", "components.dpad.segment.diagonal.fill.pressed", "components.dpad.segment.diagonal.fill.unavailable", "components.dpad.segment.diagonal.fill.unknown", "components.dpad.segment.diagonal.stroke-width.active", "components.dpad.segment.diagonal.stroke-width.hover", "components.dpad.segment.diagonal.stroke-width.inactive", "components.dpad.segment.diagonal.stroke-width.pressed", "components.dpad.segment.diagonal.stroke-width.unavailable", "components.dpad.segment.diagonal.stroke-width.unknown", "components.dpad.segment.diagonal.stroke.active", "components.dpad.segment.diagonal.stroke.hover", "components.dpad.segment.diagonal.stroke.inactive", "components.dpad.segment.diagonal.stroke.pressed", "components.dpad.segment.diagonal.stroke.unavailable", "components.dpad.segment.diagonal.stroke.unknown", "components.dpad.segment.directional.fill.active", "components.dpad.segment.directional.fill.default", "components.dpad.segment.directional.fill.hover", "components.dpad.segment.directional.fill.inactive", "components.dpad.segment.directional.fill.pressed", "components.dpad.segment.directional.fill.unavailable", "components.dpad.segment.directional.fill.unknown", "components.dpad.segment.directional.stroke-width.active", "components.dpad.segment.directional.stroke-width.hover", "components.dpad.segment.directional.stroke-width.inactive", "components.dpad.segment.directional.stroke-width.pressed", "components.dpad.segment.directional.stroke-width.unavailable", "components.dpad.segment.directional.stroke-width.unknown", "components.dpad.segment.directional.stroke.active", "components.dpad.segment.directional.stroke.hover", "components.dpad.segment.directional.stroke.inactive", "components.dpad.segment.directional.stroke.pressed", "components.dpad.segment.directional.stroke.unavailable", "components.dpad.segment.directional.stroke.unknown", "components.dpad.segment.ring.fill.active", "components.dpad.segment.ring.fill.default", "components.dpad.segment.ring.fill.hover", "components.dpad.segment.ring.fill.inactive", "components.dpad.segment.ring.fill.pressed", "components.dpad.segment.ring.fill.unavailable", "components.dpad.segment.ring.fill.unknown", "components.dpad.segment.ring.stroke-width.active", "components.dpad.segment.ring.stroke-width.hover", "components.dpad.segment.ring.stroke-width.inactive", "components.dpad.segment.ring.stroke-width.pressed", "components.dpad.segment.ring.stroke-width.unavailable", "components.dpad.segment.ring.stroke-width.unknown", "components.dpad.segment.ring.stroke.active", "components.dpad.segment.ring.stroke.hover", "components.dpad.segment.ring.stroke.inactive", "components.dpad.segment.ring.stroke.pressed", "components.dpad.segment.ring.stroke.unavailable", "components.dpad.segment.ring.stroke.unknown", "components.elbow.footer.background.active", "components.elbow.footer.background.default", "components.elbow.footer.background.hover", "components.elbow.footer.background.inactive", "components.elbow.footer.background.pressed", "components.elbow.footer.background.unavailable", "components.elbow.header.background.active", "components.elbow.header.background.default", "components.elbow.header.background.hover", "components.elbow.header.background.inactive", "components.elbow.header.background.pressed", "components.elbow.header.background.unavailable", "components.elbow.stroke.color.active", "components.elbow.stroke.color.default", "components.elbow.stroke.color.hover", "components.elbow.stroke.color.inactive", "components.elbow.stroke.color.pressed", "components.elbow.stroke.color.unavailable", "components.elbow.stroke.width", "components.elbow.text", "components.line.defaultColor", "components.line.defaultLineCap", "components.line.defaultLineJoin", "components.line.defaultOpacity", "components.line.defaultWidth", "components.slider.animation.indicator.color", "components.slider.border.color.active", "components.slider.border.color.default", "components.slider.border.color.hover", "components.slider.border.color.inactive", "components.slider.border.color.pressed", "components.slider.border.color.unavailable", "components.slider.border.radius", "components.slider.border.width", "components.slider.gauge.label.color.active", "components.slider.gauge.label.color.default", "components.slider.gauge.label.color.inactive", "components.slider.gauge.label.color.unavailable", "components.slider.gauge.progress_bar.color.active", "components.slider.gauge.progress_bar.color.default", "components.slider.gauge.progress_bar.color.inactive", "components.slider.gauge.progress_bar.color.unavailable", "components.slider.gauge.tick.major.color.active", "components.slider.gauge.tick.major.color.default", "components.slider.gauge.tick.major.color.inactive", "components.slider.gauge.tick.major.color.unavailable", "components.slider.gauge.tick.minor.color.active", "components.slider.gauge.tick.minor.color.default", "components.slider.gauge.tick.minor.color.inactive", "components.slider.gauge.tick.minor.color.unavailable", "components.slider.indicator.border.color", "components.slider.indicator.color", "components.slider.indicator.label.color", "components.slider.pills.gap", "components.slider.pills.gradient.end", "components.slider.pills.gradient.start", "components.slider.pills.radius", "components.slider.pills.segment.width", "components.slider.range.border.color", "components.slider.range.color", "components.slider.shaped.fill.color", "components.slider.text", "components.slider.track.background.active", "components.slider.track.background.default", "components.slider.track.height", "components.slider.track.margin", "effects.opacity.base", "effects.opacity.disabled", "effects.opacity.inactive", "effects.opacity.overlay", "effects.opacity.unavailable", "typography.fontFamily.primary", "typography.fontSize.2xl", "typography.fontSize.3xl", "typography.fontSize.base", "typography.fontSize.lg", "typography.fontSize.sm", "typography.fontSize.xl", "typography.fontWeight.bold", "typography.fontWeight.normal", "typography.textTransform.none", "typography.textTransform.uppercase"], theme_token_open_prefixes: ["components.", "colors.grid.", "colors.lcars.", "palette.", "colors.ui."] };
const BUNDLED_REGISTRIES = typeof define_LCARDS_REGISTRIES_default !== "undefined" ? define_LCARDS_REGISTRIES_default : null;
const BUNDLED_VERSION = "2026.10.0-dev.3";
const HA_TAGS = ["!include", "!include_dir_list", "!include_dir_named", "!include_dir_merge_list", "!include_dir_merge_named", "!secret", "!env_var", "!input"];
const HA_SCHEMA = yaml.DEFAULT_SCHEMA.extend(HA_TAGS.flatMap((tag) => ["scalar", "sequence", "mapping"].map((kind) => new yaml.Type(tag, { kind, construct: (data) => `${tag} ${typeof data === "string" ? data : JSON.stringify(data)}` }))));
const isHaTagValue = (v) => typeof v === "string" && HA_TAGS.some((tag) => v.startsWith(`${tag} `));
function valueAt(root, path) {
  let v = root;
  for (const part of path.match(/[^.[\]]+/g) ?? []) {
    if (v == null || typeof v !== "object") return void 0;
    v = v[/^\d+$/.test(part) ? Number(part) : part];
  }
  return v;
}
function parseConfig(text) {
  return yaml.load(text, { schema: HA_SCHEMA });
}
async function loadRegistries() {
  if (BUNDLED_REGISTRIES) return BUNDLED_REGISTRIES;
  const { buildRegistries: buildRegistries2 } = await Promise.resolve().then(() => _lcardsRegistriesStub);
  return buildRegistries2();
}
async function version() {
  return BUNDLED_VERSION;
}
async function validateTexts(inputs) {
  const checker = createConfigValidator({ entries: getSchemaEntries(), registries: await loadRegistries() });
  const out = [];
  for (const { name, text } of inputs) {
    let config;
    try {
      config = parseConfig(text);
    } catch (e) {
      out.push({ file: name, path: "(file)", tag: "", severity: "error", code: "yaml", message: `YAML does not parse: ${e.message.split("\n")[0]}` });
      continue;
    }
    for (const issue of checker.validateConfig(config)) {
      if (isHaTagValue(valueAt(config, issue.path))) continue;
      out.push({ file: name, ...issue });
    }
  }
  return out;
}
async function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const files = argv.filter((a) => !a.startsWith("--"));
  if (flags.has("--version")) {
    console.log(await version());
    return 0;
  }
  if (!files.length || flags.has("--help")) {
    console.error("Usage: lcards-validate [--strict] [--json] [--quiet] <file.yaml | -> [...]");
    return 2;
  }
  const inputs = [];
  for (const f of files) {
    try {
      inputs.push({ name: f === "-" ? "(stdin)" : f, text: readFileSync(f === "-" ? 0 : f, "utf8") });
    } catch (e) {
      console.error(`Cannot read ${f}: ${e.message}`);
      return 2;
    }
  }
  const issues = await validateTexts(inputs);
  const errors2 = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const failed = errors2.length > 0 || flags.has("--strict") && warnings.length > 0;
  if (flags.has("--json")) {
    console.log(JSON.stringify(issues, null, 2));
    return failed ? 1 : 0;
  }
  for (const i of issues) {
    const where = [i.file, i.path].join(": ");
    const tag = i.tag ? ` [${i.tag}]` : "";
    console.log(`${i.severity === "error" ? "error  " : "warning"} ${where}${tag} ${i.message}`);
  }
  if (!flags.has("--quiet") || issues.length) {
    const v = await version();
    const summary = `${errors2.length} error(s), ${warnings.length} warning(s) in ${inputs.length} file(s) (LCARdS ${v} schemas)`;
    console.log(issues.length ? `
${summary}` : `OK: ${summary}`);
  }
  return failed ? 1 : 0;
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
export {
  parseConfig,
  validateTexts
};
