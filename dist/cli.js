#!/usr/bin/env node
import { createRequire as __cgCreateRequire } from 'node:module';
import { fileURLToPath as __cgFileURLToPath } from 'node:url';
import { dirname as __cgDirname } from 'node:path';
const require = __cgCreateRequire(import.meta.url);
const __filename = __cgFileURLToPath(import.meta.url);
const __dirname = __cgDirname(__filename);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path2) {
      const ctrl = callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = visit_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path2) {
      const ctrl = await callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node, path2);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path2);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path2);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path2);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path2);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path2);
      return void 0;
    }
    function replaceNode(key, path2, node) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle2, prefix] = parts;
            this.tags[handle2] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle2, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle2];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle2 === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle2, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle2 + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle2, prefix] of tagEntries) {
          if (handle2 === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle2} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor2) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor2)) {
        const sa = JSON.stringify(anchor2);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor2 = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor2);
          return anchor2;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node2 = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node2.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor2 = anchors2 && source && anchors2.get(source);
        return anchor2 ? anchor2.count * anchor2.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node2 = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node2.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match2 = tags.filter((t) => t.tag === tagName);
        const tagObj = match2.find((t) => !t.format) ?? match2[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node2 = require_Node();
    function collectionFromPath(schema, path2, value) {
      let v = value;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node2.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value) {
        if (isEmptyPath(path2))
          this.add(value);
        else {
          const [key, ...rest] = path2;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start2 = i + 1;
      let ch = text[start2];
      while (ch === " " || ch === "	") {
        if (i < start2 + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start2 = i + 1;
          ch = text[start2];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start2 = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start2 > limit)
            return true;
          start2 = i + 1;
          if (strLen - start2 <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start2 = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str2 += json.slice(start2, i) + "\\ ";
          i += 1;
          start2 = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str2 += json.slice(start2, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json.substr(i, 6);
                }
                i += 5;
                start2 = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json.slice(start2, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start2 = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start2 ? str2 + json.slice(start2) : json;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start2 = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start2) {
        value = value.substring(start2.length);
        start2 = start2.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body2 = foldFlowLines.foldFlowLines(`${start2}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body2}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start2}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match2 = tags.filter((t) => t.tag === item.tag);
        if (match2.length > 0)
          return match2.find((t) => t.format === item.format) ?? match2[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match2 = tags.filter((t) => t.identify?.(obj));
        if (match2.length > 1) {
          const testMatch = match2.filter((t) => t.test);
          if (testMatch.length > 0)
            match2 = testMatch;
        }
        tagObj = match2.find((t) => t.format === item.format) ?? match2.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor2 = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor2 && anchors.anchorIsValid(anchor2)) {
        anchors$1.add(anchor2);
        props.push(`&${anchor2}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log2 = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log2.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start: start2, end } = flowChars;
      if (lines.length === 0) {
        return start2 + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start2;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start2}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary2 = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer2 = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer2[i] = str2.charCodeAt(i);
          return buffer2;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary2;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset, radix, { intAsBigInt }) {
      const sign = str2[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str2 = str2.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign = str2[0];
      const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match2 = str2.match(timestamp.test);
        if (!match2)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match2.map(Number);
        const millisec = match2[7] ? Number((match2[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match2[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary2 = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary2.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary2 = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary2.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary2.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body2 = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body2 += stringifyComment.lineComment(body2, "", commentString(contentComment));
        if ((body2[0] === "|" || body2[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body2}`;
        } else
          lines.push(body2);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path2, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor2 = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start2 = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor2 || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor2)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor2 = token;
            start2 ?? (start2 = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start2 ?? (start2 = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor2 || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor: anchor2,
        tag,
        newlineAfterProp,
        end,
        start: start2 ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start: start2, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start2, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start2[start2.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start2, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start: start2, value } of bs.items) {
        const props = resolveProps.resolveProps(start2, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start2, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start: start2, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start2, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start2) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start2, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor: anchor2, newlineAfterProp: nl } = props;
        const lastProp = anchor2 && tagToken ? anchor2.offset > tagToken.offset ? anchor2 : tagToken : anchor2 ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start2 = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start2, start2, start2] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start2 + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start2, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start2 + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start2, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match2 = line.exec(source);
      if (!match2)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match2[1].replace(trimEnd, "");
      let sep2 = " ";
      let pos = line.lastIndex;
      while (match2 = line.exec(source)) {
        const lm = match2[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + lm;
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match2 = last.exec(source);
      return res + sep2 + (match2?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range: range2 } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range2;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor: anchor2, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor2 || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor2)
            node.anchor = anchor2.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor2)
              node.anchor = anchor2.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor2 && node.anchor === "")
        onError(anchor2, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor: anchor2, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor2) {
        node.anchor = anchor2.source.substring(1);
        if (node.anchor === "")
          onError(anchor2, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start: start2, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start2, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start2, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body2 = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body2 };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body2 = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body2;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body2 });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start: start2, key, sep: sep2, value }) {
      let res = "";
      for (const st of start2)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path2) => {
      let item = cst;
      for (const [field, index] of path2) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path2) => {
      const parent = visit.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item, visitor) {
      let ctrl = visitor(item, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
    }
    exports2.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start2 = this.lineStarts[low - 1];
          return { line: low, col: offset - start2 + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser2 = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start2 = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start: start2, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start2 = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start2 = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start2.push(this.sourceToken);
                map.items.push({ start: start2 });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start2.push(this.sourceToken);
                map.items.push({ start: start2, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start3 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start3, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start3 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start3, key, sep: sep2 }]
                  });
                } else if (start2.length > 0) {
                  it.sep = it.sep.concat(start2, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start: start2, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start: start2, key: fs2, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs2);
              } else {
                Object.assign(it, { key: fs2, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start: start2 });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs2 = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs2, sep: [] });
              else if (it.sep)
                this.stack.push(fs2);
              else
                Object.assign(it, { key: fs2, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start: start2, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            start2.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: start2, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: start2, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start2, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start2.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser2;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log2 = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log2.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// node_modules/web-tree-sitter/tree-sitter.js
var require_tree_sitter = __commonJS({
  "node_modules/web-tree-sitter/tree-sitter.js"(exports, module) {
    var Module = void 0 !== Module ? Module : {};
    var TreeSitter = (function() {
      var initPromise, document = "object" == typeof window ? { currentScript: window.document.currentScript } : null;
      class Parser {
        constructor() {
          this.initialize();
        }
        initialize() {
          throw new Error("cannot construct a Parser before calling `init()`");
        }
        static init(moduleOptions) {
          return initPromise || (Module = Object.assign({}, Module, moduleOptions), initPromise = new Promise(((resolveInitPromise) => {
            var moduleOverrides = Object.assign({}, Module), arguments_ = [], thisProgram = "./this.program", quit_ = (e, t) => {
              throw t;
            }, ENVIRONMENT_IS_WEB = "object" == typeof window, ENVIRONMENT_IS_WORKER = "function" == typeof importScripts, ENVIRONMENT_IS_NODE = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node, scriptDirectory = "", read_, readAsync, readBinary, setWindowTitle;
            function locateFile(e) {
              return Module.locateFile ? Module.locateFile(e, scriptDirectory) : scriptDirectory + e;
            }
            function logExceptionOnExit(e) {
              if (e instanceof ExitStatus) return;
              err("exiting due to exception: " + e);
            }
            if (ENVIRONMENT_IS_NODE) {
              var fs = __require("fs"), nodePath = __require("path");
              scriptDirectory = ENVIRONMENT_IS_WORKER ? nodePath.dirname(scriptDirectory) + "/" : __dirname + "/", read_ = (e, t) => (e = isFileURI(e) ? new URL(e) : nodePath.normalize(e), fs.readFileSync(e, t ? void 0 : "utf8")), readBinary = (e) => {
                var t = read_(e, true);
                return t.buffer || (t = new Uint8Array(t)), t;
              }, readAsync = (e, t, r) => {
                e = isFileURI(e) ? new URL(e) : nodePath.normalize(e), fs.readFile(e, (function(e2, _) {
                  e2 ? r(e2) : t(_.buffer);
                }));
              }, process.argv.length > 1 && (thisProgram = process.argv[1].replace(/\\/g, "/")), arguments_ = process.argv.slice(2), "undefined" != typeof module && (module.exports = Module), quit_ = (e, t) => {
                if (keepRuntimeAlive()) throw process.exitCode = e, t;
                logExceptionOnExit(t), process.exit(e);
              }, Module.inspect = function() {
                return "[Emscripten Module object]";
              };
            } else (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && (ENVIRONMENT_IS_WORKER ? scriptDirectory = self.location.href : void 0 !== document && document.currentScript && (scriptDirectory = document.currentScript.src), scriptDirectory = 0 !== scriptDirectory.indexOf("blob:") ? scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1) : "", read_ = (e) => {
              var t = new XMLHttpRequest();
              return t.open("GET", e, false), t.send(null), t.responseText;
            }, ENVIRONMENT_IS_WORKER && (readBinary = (e) => {
              var t = new XMLHttpRequest();
              return t.open("GET", e, false), t.responseType = "arraybuffer", t.send(null), new Uint8Array(t.response);
            }), readAsync = (e, t, r) => {
              var _ = new XMLHttpRequest();
              _.open("GET", e, true), _.responseType = "arraybuffer", _.onload = () => {
                200 == _.status || 0 == _.status && _.response ? t(_.response) : r();
              }, _.onerror = r, _.send(null);
            }, setWindowTitle = (e) => document.title = e);
            var out = Module.print || console.log.bind(console), err = Module.printErr || console.warn.bind(console);
            Object.assign(Module, moduleOverrides), moduleOverrides = null, Module.arguments && (arguments_ = Module.arguments), Module.thisProgram && (thisProgram = Module.thisProgram), Module.quit && (quit_ = Module.quit);
            var STACK_ALIGN = 16, dynamicLibraries = Module.dynamicLibraries || [], wasmBinary;
            Module.wasmBinary && (wasmBinary = Module.wasmBinary);
            var noExitRuntime = Module.noExitRuntime || true, wasmMemory;
            "object" != typeof WebAssembly && abort("no native wasm support detected");
            var ABORT = false, EXITSTATUS, UTF8Decoder = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
            function UTF8ArrayToString(e, t, r) {
              for (var _ = t + r, n = t; e[n] && !(n >= _); ) ++n;
              if (n - t > 16 && e.buffer && UTF8Decoder) return UTF8Decoder.decode(e.subarray(t, n));
              for (var s = ""; t < n; ) {
                var a = e[t++];
                if (128 & a) {
                  var o = 63 & e[t++];
                  if (192 != (224 & a)) {
                    var i = 63 & e[t++];
                    if ((a = 224 == (240 & a) ? (15 & a) << 12 | o << 6 | i : (7 & a) << 18 | o << 12 | i << 6 | 63 & e[t++]) < 65536) s += String.fromCharCode(a);
                    else {
                      var l = a - 65536;
                      s += String.fromCharCode(55296 | l >> 10, 56320 | 1023 & l);
                    }
                  } else s += String.fromCharCode((31 & a) << 6 | o);
                } else s += String.fromCharCode(a);
              }
              return s;
            }
            function UTF8ToString(e, t) {
              return e ? UTF8ArrayToString(HEAPU8, e, t) : "";
            }
            function stringToUTF8Array(e, t, r, _) {
              if (!(_ > 0)) return 0;
              for (var n = r, s = r + _ - 1, a = 0; a < e.length; ++a) {
                var o = e.charCodeAt(a);
                if (o >= 55296 && o <= 57343) o = 65536 + ((1023 & o) << 10) | 1023 & e.charCodeAt(++a);
                if (o <= 127) {
                  if (r >= s) break;
                  t[r++] = o;
                } else if (o <= 2047) {
                  if (r + 1 >= s) break;
                  t[r++] = 192 | o >> 6, t[r++] = 128 | 63 & o;
                } else if (o <= 65535) {
                  if (r + 2 >= s) break;
                  t[r++] = 224 | o >> 12, t[r++] = 128 | o >> 6 & 63, t[r++] = 128 | 63 & o;
                } else {
                  if (r + 3 >= s) break;
                  t[r++] = 240 | o >> 18, t[r++] = 128 | o >> 12 & 63, t[r++] = 128 | o >> 6 & 63, t[r++] = 128 | 63 & o;
                }
              }
              return t[r] = 0, r - n;
            }
            function stringToUTF8(e, t, r) {
              return stringToUTF8Array(e, HEAPU8, t, r);
            }
            function lengthBytesUTF8(e) {
              for (var t = 0, r = 0; r < e.length; ++r) {
                var _ = e.charCodeAt(r);
                _ <= 127 ? t++ : _ <= 2047 ? t += 2 : _ >= 55296 && _ <= 57343 ? (t += 4, ++r) : t += 3;
              }
              return t;
            }
            function updateGlobalBufferAndViews(e) {
              buffer = e, Module.HEAP8 = HEAP8 = new Int8Array(e), Module.HEAP16 = HEAP16 = new Int16Array(e), Module.HEAP32 = HEAP32 = new Int32Array(e), Module.HEAPU8 = HEAPU8 = new Uint8Array(e), Module.HEAPU16 = HEAPU16 = new Uint16Array(e), Module.HEAPU32 = HEAPU32 = new Uint32Array(e), Module.HEAPF32 = HEAPF32 = new Float32Array(e), Module.HEAPF64 = HEAPF64 = new Float64Array(e);
            }
            var INITIAL_MEMORY = Module.INITIAL_MEMORY || 33554432;
            wasmMemory = Module.wasmMemory ? Module.wasmMemory : new WebAssembly.Memory({ initial: INITIAL_MEMORY / 65536, maximum: 32768 }), wasmMemory && (buffer = wasmMemory.buffer), INITIAL_MEMORY = buffer.byteLength, updateGlobalBufferAndViews(buffer);
            var wasmTable = new WebAssembly.Table({ initial: 20, element: "anyfunc" }), __ATPRERUN__ = [], __ATINIT__ = [], __ATMAIN__ = [], __ATPOSTRUN__ = [], __RELOC_FUNCS__ = [], runtimeInitialized = false;
            function keepRuntimeAlive() {
              return noExitRuntime;
            }
            function preRun() {
              if (Module.preRun) for ("function" == typeof Module.preRun && (Module.preRun = [Module.preRun]); Module.preRun.length; ) addOnPreRun(Module.preRun.shift());
              callRuntimeCallbacks(__ATPRERUN__);
            }
            function initRuntime() {
              runtimeInitialized = true, callRuntimeCallbacks(__RELOC_FUNCS__), callRuntimeCallbacks(__ATINIT__);
            }
            function preMain() {
              callRuntimeCallbacks(__ATMAIN__);
            }
            function postRun() {
              if (Module.postRun) for ("function" == typeof Module.postRun && (Module.postRun = [Module.postRun]); Module.postRun.length; ) addOnPostRun(Module.postRun.shift());
              callRuntimeCallbacks(__ATPOSTRUN__);
            }
            function addOnPreRun(e) {
              __ATPRERUN__.unshift(e);
            }
            function addOnInit(e) {
              __ATINIT__.unshift(e);
            }
            function addOnPostRun(e) {
              __ATPOSTRUN__.unshift(e);
            }
            var runDependencies = 0, runDependencyWatcher = null, dependenciesFulfilled = null;
            function addRunDependency(e) {
              runDependencies++, Module.monitorRunDependencies && Module.monitorRunDependencies(runDependencies);
            }
            function removeRunDependency(e) {
              if (runDependencies--, Module.monitorRunDependencies && Module.monitorRunDependencies(runDependencies), 0 == runDependencies && (null !== runDependencyWatcher && (clearInterval(runDependencyWatcher), runDependencyWatcher = null), dependenciesFulfilled)) {
                var t = dependenciesFulfilled;
                dependenciesFulfilled = null, t();
              }
            }
            function abort(e) {
              throw Module.onAbort && Module.onAbort(e), err(e = "Aborted(" + e + ")"), ABORT = true, EXITSTATUS = 1, e += ". Build with -sASSERTIONS for more info.", new WebAssembly.RuntimeError(e);
            }
            var dataURIPrefix = "data:application/octet-stream;base64,", wasmBinaryFile, tempDouble, tempI64;
            function isDataURI(e) {
              return e.startsWith(dataURIPrefix);
            }
            function isFileURI(e) {
              return e.startsWith("file://");
            }
            function getBinary(e) {
              try {
                if (e == wasmBinaryFile && wasmBinary) return new Uint8Array(wasmBinary);
                if (readBinary) return readBinary(e);
                throw "both async and sync fetching of the wasm failed";
              } catch (e2) {
                abort(e2);
              }
            }
            function getBinaryPromise() {
              if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                if ("function" == typeof fetch && !isFileURI(wasmBinaryFile)) return fetch(wasmBinaryFile, { credentials: "same-origin" }).then((function(e) {
                  if (!e.ok) throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
                  return e.arrayBuffer();
                })).catch((function() {
                  return getBinary(wasmBinaryFile);
                }));
                if (readAsync) return new Promise((function(e, t) {
                  readAsync(wasmBinaryFile, (function(t2) {
                    e(new Uint8Array(t2));
                  }), t);
                }));
              }
              return Promise.resolve().then((function() {
                return getBinary(wasmBinaryFile);
              }));
            }
            function createWasm() {
              var e = { env: asmLibraryArg, wasi_snapshot_preview1: asmLibraryArg, "GOT.mem": new Proxy(asmLibraryArg, GOTHandler), "GOT.func": new Proxy(asmLibraryArg, GOTHandler) };
              function t(e2, t2) {
                var r2 = e2.exports;
                r2 = relocateExports(r2, 1024);
                var _2 = getDylinkMetadata(t2);
                _2.neededDynlibs && (dynamicLibraries = _2.neededDynlibs.concat(dynamicLibraries)), mergeLibSymbols(r2, "main"), Module.asm = r2, addOnInit(Module.asm.__wasm_call_ctors), __RELOC_FUNCS__.push(Module.asm.__wasm_apply_data_relocs), removeRunDependency("wasm-instantiate");
              }
              function r(e2) {
                t(e2.instance, e2.module);
              }
              function _(t2) {
                return getBinaryPromise().then((function(t3) {
                  return WebAssembly.instantiate(t3, e);
                })).then((function(e2) {
                  return e2;
                })).then(t2, (function(e2) {
                  err("failed to asynchronously prepare wasm: " + e2), abort(e2);
                }));
              }
              if (addRunDependency("wasm-instantiate"), Module.instantiateWasm) try {
                return Module.instantiateWasm(e, t);
              } catch (e2) {
                return err("Module.instantiateWasm callback failed with error: " + e2), false;
              }
              return wasmBinary || "function" != typeof WebAssembly.instantiateStreaming || isDataURI(wasmBinaryFile) || isFileURI(wasmBinaryFile) || ENVIRONMENT_IS_NODE || "function" != typeof fetch ? _(r) : fetch(wasmBinaryFile, { credentials: "same-origin" }).then((function(t2) {
                return WebAssembly.instantiateStreaming(t2, e).then(r, (function(e2) {
                  return err("wasm streaming compile failed: " + e2), err("falling back to ArrayBuffer instantiation"), _(r);
                }));
              })), {};
            }
            wasmBinaryFile = "tree-sitter.wasm", isDataURI(wasmBinaryFile) || (wasmBinaryFile = locateFile(wasmBinaryFile));
            var ASM_CONSTS = {};
            function ExitStatus(e) {
              this.name = "ExitStatus", this.message = "Program terminated with exit(" + e + ")", this.status = e;
            }
            var GOT = {}, CurrentModuleWeakSymbols = /* @__PURE__ */ new Set([]), GOTHandler = { get: function(e, t) {
              var r = GOT[t];
              return r || (r = GOT[t] = new WebAssembly.Global({ value: "i32", mutable: true })), CurrentModuleWeakSymbols.has(t) || (r.required = true), r;
            } };
            function callRuntimeCallbacks(e) {
              for (; e.length > 0; ) e.shift()(Module);
            }
            function getDylinkMetadata(e) {
              var t = 0, r = 0;
              function _() {
                for (var r2 = 0, _2 = 1; ; ) {
                  var n2 = e[t++];
                  if (r2 += (127 & n2) * _2, _2 *= 128, !(128 & n2)) break;
                }
                return r2;
              }
              function n() {
                var r2 = _();
                return UTF8ArrayToString(e, (t += r2) - r2, r2);
              }
              function s(e2, t2) {
                if (e2) throw new Error(t2);
              }
              var a = "dylink.0";
              if (e instanceof WebAssembly.Module) {
                var o = WebAssembly.Module.customSections(e, a);
                0 === o.length && (a = "dylink", o = WebAssembly.Module.customSections(e, a)), s(0 === o.length, "need dylink section"), r = (e = new Uint8Array(o[0])).length;
              } else {
                s(!(1836278016 == new Uint32Array(new Uint8Array(e.subarray(0, 24)).buffer)[0]), "need to see wasm magic number"), s(0 !== e[8], "need the dylink section to be first"), t = 9;
                var i = _();
                r = t + i, a = n();
              }
              var l = { neededDynlibs: [], tlsExports: /* @__PURE__ */ new Set(), weakImports: /* @__PURE__ */ new Set() };
              if ("dylink" == a) {
                l.memorySize = _(), l.memoryAlign = _(), l.tableSize = _(), l.tableAlign = _();
                for (var u = _(), d = 0; d < u; ++d) {
                  var c = n();
                  l.neededDynlibs.push(c);
                }
              } else {
                s("dylink.0" !== a);
                for (; t < r; ) {
                  var m = e[t++], p = _();
                  if (1 === m) l.memorySize = _(), l.memoryAlign = _(), l.tableSize = _(), l.tableAlign = _();
                  else if (2 === m) for (u = _(), d = 0; d < u; ++d) c = n(), l.neededDynlibs.push(c);
                  else if (3 === m) for (var f = _(); f--; ) {
                    var h = n();
                    256 & _() && l.tlsExports.add(h);
                  }
                  else if (4 === m) for (f = _(); f--; ) {
                    n(), h = n();
                    1 == (3 & _()) && l.weakImports.add(h);
                  }
                  else t += p;
                }
              }
              return l;
            }
            function getValue(e, t = "i8") {
              switch (t.endsWith("*") && (t = "*"), t) {
                case "i1":
                case "i8":
                  return HEAP8[e >> 0];
                case "i16":
                  return HEAP16[e >> 1];
                case "i32":
                case "i64":
                  return HEAP32[e >> 2];
                case "float":
                  return HEAPF32[e >> 2];
                case "double":
                  return HEAPF64[e >> 3];
                case "*":
                  return HEAPU32[e >> 2];
                default:
                  abort("invalid type for getValue: " + t);
              }
              return null;
            }
            function asmjsMangle(e) {
              return 0 == e.indexOf("dynCall_") || ["stackAlloc", "stackSave", "stackRestore", "getTempRet0", "setTempRet0"].includes(e) ? e : "_" + e;
            }
            function mergeLibSymbols(e, t) {
              for (var r in e) if (e.hasOwnProperty(r)) {
                asmLibraryArg.hasOwnProperty(r) || (asmLibraryArg[r] = e[r]);
                var _ = asmjsMangle(r);
                Module.hasOwnProperty(_) || (Module[_] = e[r]), "__main_argc_argv" == r && (Module._main = e[r]);
              }
            }
            var LDSO = { loadedLibsByName: {}, loadedLibsByHandle: {} };
            function dynCallLegacy(e, t, r) {
              var _ = Module["dynCall_" + e];
              return r && r.length ? _.apply(null, [t].concat(r)) : _.call(null, t);
            }
            var wasmTableMirror = [];
            function getWasmTableEntry(e) {
              var t = wasmTableMirror[e];
              return t || (e >= wasmTableMirror.length && (wasmTableMirror.length = e + 1), wasmTableMirror[e] = t = wasmTable.get(e)), t;
            }
            function dynCall(e, t, r) {
              return e.includes("j") ? dynCallLegacy(e, t, r) : getWasmTableEntry(t).apply(null, r);
            }
            function createInvokeFunction(e) {
              return function() {
                var t = stackSave();
                try {
                  return dynCall(e, arguments[0], Array.prototype.slice.call(arguments, 1));
                } catch (e2) {
                  if (stackRestore(t), e2 !== e2 + 0) throw e2;
                  _setThrew(1, 0);
                }
              };
            }
            var ___heap_base = 78144;
            function zeroMemory(e, t) {
              return HEAPU8.fill(0, e, e + t), e;
            }
            function getMemory(e) {
              if (runtimeInitialized) return zeroMemory(_malloc(e), e);
              var t = ___heap_base, r = t + e + 15 & -16;
              return ___heap_base = r, GOT.__heap_base.value = r, t;
            }
            function isInternalSym(e) {
              return ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm"].includes(e);
            }
            function uleb128Encode(e, t) {
              e < 128 ? t.push(e) : t.push(e % 128 | 128, e >> 7);
            }
            function sigToWasmTypes(e) {
              for (var t = { i: "i32", j: "i32", f: "f32", d: "f64", p: "i32" }, r = { parameters: [], results: "v" == e[0] ? [] : [t[e[0]]] }, _ = 1; _ < e.length; ++_) r.parameters.push(t[e[_]]), "j" === e[_] && r.parameters.push("i32");
              return r;
            }
            function generateFuncType(e, t) {
              var r = e.slice(0, 1), _ = e.slice(1), n = { i: 127, p: 127, j: 126, f: 125, d: 124 };
              t.push(96), uleb128Encode(_.length, t);
              for (var s = 0; s < _.length; ++s) t.push(n[_[s]]);
              "v" == r ? t.push(0) : t.push(1, n[r]);
            }
            function convertJsFunctionToWasm(e, t) {
              if ("function" == typeof WebAssembly.Function) return new WebAssembly.Function(sigToWasmTypes(t), e);
              var r = [1];
              generateFuncType(t, r);
              var _ = [0, 97, 115, 109, 1, 0, 0, 0, 1];
              uleb128Encode(r.length, _), _.push.apply(_, r), _.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
              var n = new WebAssembly.Module(new Uint8Array(_));
              return new WebAssembly.Instance(n, { e: { f: e } }).exports.f;
            }
            function updateTableMap(e, t) {
              if (functionsInTableMap) for (var r = e; r < e + t; r++) {
                var _ = getWasmTableEntry(r);
                _ && functionsInTableMap.set(_, r);
              }
            }
            var functionsInTableMap = void 0, freeTableIndexes = [];
            function getEmptyTableSlot() {
              if (freeTableIndexes.length) return freeTableIndexes.pop();
              try {
                wasmTable.grow(1);
              } catch (e) {
                if (!(e instanceof RangeError)) throw e;
                throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
              }
              return wasmTable.length - 1;
            }
            function setWasmTableEntry(e, t) {
              wasmTable.set(e, t), wasmTableMirror[e] = wasmTable.get(e);
            }
            function addFunction(e, t) {
              if (functionsInTableMap || (functionsInTableMap = /* @__PURE__ */ new WeakMap(), updateTableMap(0, wasmTable.length)), functionsInTableMap.has(e)) return functionsInTableMap.get(e);
              var r = getEmptyTableSlot();
              try {
                setWasmTableEntry(r, e);
              } catch (_) {
                if (!(_ instanceof TypeError)) throw _;
                setWasmTableEntry(r, convertJsFunctionToWasm(e, t));
              }
              return functionsInTableMap.set(e, r), r;
            }
            function updateGOT(e, t) {
              for (var r in e) if (!isInternalSym(r)) {
                var _ = e[r];
                r.startsWith("orig$") && (r = r.split("$")[1], t = true), GOT[r] || (GOT[r] = new WebAssembly.Global({ value: "i32", mutable: true })), (t || 0 == GOT[r].value) && ("function" == typeof _ ? GOT[r].value = addFunction(_) : "number" == typeof _ ? GOT[r].value = _ : err("unhandled export type for `" + r + "`: " + typeof _));
              }
            }
            function relocateExports(e, t, r) {
              var _ = {};
              for (var n in e) {
                var s = e[n];
                "object" == typeof s && (s = s.value), "number" == typeof s && (s += t), _[n] = s;
              }
              return updateGOT(_, r), _;
            }
            function resolveGlobalSymbol(e, t) {
              var r;
              return t && (r = asmLibraryArg["orig$" + e]), r || (r = asmLibraryArg[e]) && r.stub && (r = void 0), r || (r = Module[asmjsMangle(e)]), !r && e.startsWith("invoke_") && (r = createInvokeFunction(e.split("_")[1])), r;
            }
            function alignMemory(e, t) {
              return Math.ceil(e / t) * t;
            }
            function loadWebAssemblyModule(binary, flags, handle) {
              var metadata = getDylinkMetadata(binary);
              function loadModule() {
                var firstLoad = !handle || !HEAP8[handle + 12 >> 0];
                if (firstLoad) {
                  var memAlign = Math.pow(2, metadata.memoryAlign);
                  memAlign = Math.max(memAlign, STACK_ALIGN);
                  var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0, tableBase = metadata.tableSize ? wasmTable.length : 0;
                  handle && (HEAP8[handle + 12 >> 0] = 1, HEAPU32[handle + 16 >> 2] = memoryBase, HEAP32[handle + 20 >> 2] = metadata.memorySize, HEAPU32[handle + 24 >> 2] = tableBase, HEAP32[handle + 28 >> 2] = metadata.tableSize);
                } else memoryBase = HEAPU32[handle + 16 >> 2], tableBase = HEAPU32[handle + 24 >> 2];
                var tableGrowthNeeded = tableBase + metadata.tableSize - wasmTable.length, moduleExports;
                function resolveSymbol(e) {
                  var t = resolveGlobalSymbol(e, false);
                  return t || (t = moduleExports[e]), t;
                }
                tableGrowthNeeded > 0 && wasmTable.grow(tableGrowthNeeded);
                var proxyHandler = { get: function(e, t) {
                  switch (t) {
                    case "__memory_base":
                      return memoryBase;
                    case "__table_base":
                      return tableBase;
                  }
                  if (t in asmLibraryArg) return asmLibraryArg[t];
                  var r;
                  t in e || (e[t] = function() {
                    return r || (r = resolveSymbol(t)), r.apply(null, arguments);
                  });
                  return e[t];
                } }, proxy = new Proxy({}, proxyHandler), info = { "GOT.mem": new Proxy({}, GOTHandler), "GOT.func": new Proxy({}, GOTHandler), env: proxy, wasi_snapshot_preview1: proxy };
                function postInstantiation(instance) {
                  function addEmAsm(addr, body) {
                    for (var args = [], arity = 0; arity < 16 && -1 != body.indexOf("$" + arity); arity++) args.push("$" + arity);
                    args = args.join(",");
                    var func = "(" + args + " ) => { " + body + "};";
                    ASM_CONSTS[start] = eval(func);
                  }
                  if (updateTableMap(tableBase, metadata.tableSize), moduleExports = relocateExports(instance.exports, memoryBase), flags.allowUndefined || reportUndefinedSymbols(), "__start_em_asm" in moduleExports) for (var start = moduleExports.__start_em_asm, stop = moduleExports.__stop_em_asm; start < stop; ) {
                    var jsString = UTF8ToString(start);
                    addEmAsm(start, jsString), start = HEAPU8.indexOf(0, start) + 1;
                  }
                  var applyRelocs = moduleExports.__wasm_apply_data_relocs;
                  applyRelocs && (runtimeInitialized ? applyRelocs() : __RELOC_FUNCS__.push(applyRelocs));
                  var init = moduleExports.__wasm_call_ctors;
                  return init && (runtimeInitialized ? init() : __ATINIT__.push(init)), moduleExports;
                }
                if (flags.loadAsync) {
                  if (binary instanceof WebAssembly.Module) {
                    var instance = new WebAssembly.Instance(binary, info);
                    return Promise.resolve(postInstantiation(instance));
                  }
                  return WebAssembly.instantiate(binary, info).then((function(e) {
                    return postInstantiation(e.instance);
                  }));
                }
                var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary), instance = new WebAssembly.Instance(module, info);
                return postInstantiation(instance);
              }
              return CurrentModuleWeakSymbols = metadata.weakImports, flags.loadAsync ? metadata.neededDynlibs.reduce((function(e, t) {
                return e.then((function() {
                  return loadDynamicLibrary(t, flags);
                }));
              }), Promise.resolve()).then((function() {
                return loadModule();
              })) : (metadata.neededDynlibs.forEach((function(e) {
                loadDynamicLibrary(e, flags);
              })), loadModule());
            }
            function loadDynamicLibrary(e, t, r) {
              t = t || { global: true, nodelete: true };
              var _ = LDSO.loadedLibsByName[e];
              if (_) return t.global && !_.global && (_.global = true, "loading" !== _.module && mergeLibSymbols(_.module, e)), t.nodelete && _.refcount !== 1 / 0 && (_.refcount = 1 / 0), _.refcount++, r && (LDSO.loadedLibsByHandle[r] = _), !t.loadAsync || Promise.resolve(true);
              function n(e2) {
                if (t.fs && t.fs.findObject(e2)) {
                  var r2 = t.fs.readFile(e2, { encoding: "binary" });
                  return r2 instanceof Uint8Array || (r2 = new Uint8Array(r2)), t.loadAsync ? Promise.resolve(r2) : r2;
                }
                if (e2 = locateFile(e2), t.loadAsync) return new Promise((function(t2, r3) {
                  readAsync(e2, ((e3) => t2(new Uint8Array(e3))), r3);
                }));
                if (!readBinary) throw new Error(e2 + ": file not found, and synchronous loading of external files is not available");
                return readBinary(e2);
              }
              function s() {
                if ("undefined" != typeof preloadedWasm && preloadedWasm[e]) {
                  var _2 = preloadedWasm[e];
                  return t.loadAsync ? Promise.resolve(_2) : _2;
                }
                return t.loadAsync ? n(e).then((function(e2) {
                  return loadWebAssemblyModule(e2, t, r);
                })) : loadWebAssemblyModule(n(e), t, r);
              }
              function a(t2) {
                _.global && mergeLibSymbols(t2, e), _.module = t2;
              }
              return _ = { refcount: t.nodelete ? 1 / 0 : 1, name: e, module: "loading", global: t.global }, LDSO.loadedLibsByName[e] = _, r && (LDSO.loadedLibsByHandle[r] = _), t.loadAsync ? s().then((function(e2) {
                return a(e2), true;
              })) : (a(s()), true);
            }
            function reportUndefinedSymbols() {
              for (var e in GOT) if (0 == GOT[e].value) {
                var t = resolveGlobalSymbol(e, true);
                if (!t && !GOT[e].required) continue;
                if ("function" == typeof t) GOT[e].value = addFunction(t, t.sig);
                else {
                  if ("number" != typeof t) throw new Error("bad export type for `" + e + "`: " + typeof t);
                  GOT[e].value = t;
                }
              }
            }
            function preloadDylibs() {
              dynamicLibraries.length ? (addRunDependency("preloadDylibs"), dynamicLibraries.reduce((function(e, t) {
                return e.then((function() {
                  return loadDynamicLibrary(t, { loadAsync: true, global: true, nodelete: true, allowUndefined: true });
                }));
              }), Promise.resolve()).then((function() {
                reportUndefinedSymbols(), removeRunDependency("preloadDylibs");
              }))) : reportUndefinedSymbols();
            }
            function setValue(e, t, r = "i8") {
              switch (r.endsWith("*") && (r = "*"), r) {
                case "i1":
                case "i8":
                  HEAP8[e >> 0] = t;
                  break;
                case "i16":
                  HEAP16[e >> 1] = t;
                  break;
                case "i32":
                  HEAP32[e >> 2] = t;
                  break;
                case "i64":
                  tempI64 = [t >>> 0, (tempDouble = t, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[e >> 2] = tempI64[0], HEAP32[e + 4 >> 2] = tempI64[1];
                  break;
                case "float":
                  HEAPF32[e >> 2] = t;
                  break;
                case "double":
                  HEAPF64[e >> 3] = t;
                  break;
                case "*":
                  HEAPU32[e >> 2] = t;
                  break;
                default:
                  abort("invalid type for setValue: " + r);
              }
            }
            var ___memory_base = new WebAssembly.Global({ value: "i32", mutable: false }, 1024), ___stack_pointer = new WebAssembly.Global({ value: "i32", mutable: true }, 78144), ___table_base = new WebAssembly.Global({ value: "i32", mutable: false }, 1), nowIsMonotonic = true, _emscripten_get_now;
            function __emscripten_get_now_is_monotonic() {
              return nowIsMonotonic;
            }
            function _abort() {
              abort("");
            }
            function _emscripten_date_now() {
              return Date.now();
            }
            function _emscripten_memcpy_big(e, t, r) {
              HEAPU8.copyWithin(e, t, t + r);
            }
            function getHeapMax() {
              return 2147483648;
            }
            function emscripten_realloc_buffer(e) {
              try {
                return wasmMemory.grow(e - buffer.byteLength + 65535 >>> 16), updateGlobalBufferAndViews(wasmMemory.buffer), 1;
              } catch (e2) {
              }
            }
            function _emscripten_resize_heap(e) {
              var t = HEAPU8.length;
              e >>>= 0;
              var r = getHeapMax();
              if (e > r) return false;
              for (var _ = 1; _ <= 4; _ *= 2) {
                var n = t * (1 + 0.2 / _);
                if (n = Math.min(n, e + 100663296), emscripten_realloc_buffer(Math.min(r, (s = Math.max(e, n)) + ((a = 65536) - s % a) % a))) return true;
              }
              var s, a;
              return false;
            }
            __emscripten_get_now_is_monotonic.sig = "i", Module._abort = _abort, _abort.sig = "v", _emscripten_date_now.sig = "d", _emscripten_get_now = ENVIRONMENT_IS_NODE ? () => {
              var e = process.hrtime();
              return 1e3 * e[0] + e[1] / 1e6;
            } : () => performance.now(), _emscripten_get_now.sig = "d", _emscripten_memcpy_big.sig = "vppp", _emscripten_resize_heap.sig = "ip";
            var SYSCALLS = { DEFAULT_POLLMASK: 5, calculateAt: function(e, t, r) {
              if (PATH.isAbs(t)) return t;
              var _;
              -100 === e ? _ = FS.cwd() : _ = SYSCALLS.getStreamFromFD(e).path;
              if (0 == t.length) {
                if (!r) throw new FS.ErrnoError(44);
                return _;
              }
              return PATH.join2(_, t);
            }, doStat: function(e, t, r) {
              try {
                var _ = e(t);
              } catch (e2) {
                if (e2 && e2.node && PATH.normalize(t) !== PATH.normalize(FS.getPath(e2.node))) return -54;
                throw e2;
              }
              HEAP32[r >> 2] = _.dev, HEAP32[r + 8 >> 2] = _.ino, HEAP32[r + 12 >> 2] = _.mode, HEAPU32[r + 16 >> 2] = _.nlink, HEAP32[r + 20 >> 2] = _.uid, HEAP32[r + 24 >> 2] = _.gid, HEAP32[r + 28 >> 2] = _.rdev, tempI64 = [_.size >>> 0, (tempDouble = _.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[r + 40 >> 2] = tempI64[0], HEAP32[r + 44 >> 2] = tempI64[1], HEAP32[r + 48 >> 2] = 4096, HEAP32[r + 52 >> 2] = _.blocks;
              var n = _.atime.getTime(), s = _.mtime.getTime(), a = _.ctime.getTime();
              return tempI64 = [Math.floor(n / 1e3) >>> 0, (tempDouble = Math.floor(n / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[r + 56 >> 2] = tempI64[0], HEAP32[r + 60 >> 2] = tempI64[1], HEAPU32[r + 64 >> 2] = n % 1e3 * 1e3, tempI64 = [Math.floor(s / 1e3) >>> 0, (tempDouble = Math.floor(s / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[r + 72 >> 2] = tempI64[0], HEAP32[r + 76 >> 2] = tempI64[1], HEAPU32[r + 80 >> 2] = s % 1e3 * 1e3, tempI64 = [Math.floor(a / 1e3) >>> 0, (tempDouble = Math.floor(a / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[r + 88 >> 2] = tempI64[0], HEAP32[r + 92 >> 2] = tempI64[1], HEAPU32[r + 96 >> 2] = a % 1e3 * 1e3, tempI64 = [_.ino >>> 0, (tempDouble = _.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[r + 104 >> 2] = tempI64[0], HEAP32[r + 108 >> 2] = tempI64[1], 0;
            }, doMsync: function(e, t, r, _, n) {
              if (!FS.isFile(t.node.mode)) throw new FS.ErrnoError(43);
              if (2 & _) return 0;
              var s = HEAPU8.slice(e, e + r);
              FS.msync(t, s, n, r, _);
            }, varargs: void 0, get: function() {
              return SYSCALLS.varargs += 4, HEAP32[SYSCALLS.varargs - 4 >> 2];
            }, getStr: function(e) {
              return UTF8ToString(e);
            }, getStreamFromFD: function(e) {
              var t = FS.getStream(e);
              if (!t) throw new FS.ErrnoError(8);
              return t;
            } };
            function _proc_exit(e) {
              EXITSTATUS = e, keepRuntimeAlive() || (Module.onExit && Module.onExit(e), ABORT = true), quit_(e, new ExitStatus(e));
            }
            function exitJS(e, t) {
              EXITSTATUS = e, _proc_exit(e);
            }
            _proc_exit.sig = "vi";
            var _exit = exitJS;
            function _fd_close(e) {
              try {
                var t = SYSCALLS.getStreamFromFD(e);
                return FS.close(t), 0;
              } catch (e2) {
                if ("undefined" == typeof FS || !(e2 instanceof FS.ErrnoError)) throw e2;
                return e2.errno;
              }
            }
            function convertI32PairToI53Checked(e, t) {
              return t + 2097152 >>> 0 < 4194305 - !!e ? (e >>> 0) + 4294967296 * t : NaN;
            }
            function _fd_seek(e, t, r, _, n) {
              try {
                var s = convertI32PairToI53Checked(t, r);
                if (isNaN(s)) return 61;
                var a = SYSCALLS.getStreamFromFD(e);
                return FS.llseek(a, s, _), tempI64 = [a.position >>> 0, (tempDouble = a.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (0 | Math.min(+Math.floor(tempDouble / 4294967296), 4294967295)) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[n >> 2] = tempI64[0], HEAP32[n + 4 >> 2] = tempI64[1], a.getdents && 0 === s && 0 === _ && (a.getdents = null), 0;
              } catch (e2) {
                if ("undefined" == typeof FS || !(e2 instanceof FS.ErrnoError)) throw e2;
                return e2.errno;
              }
            }
            function doWritev(e, t, r, _) {
              for (var n = 0, s = 0; s < r; s++) {
                var a = HEAPU32[t >> 2], o = HEAPU32[t + 4 >> 2];
                t += 8;
                var i = FS.write(e, HEAP8, a, o, _);
                if (i < 0) return -1;
                n += i, void 0 !== _ && (_ += i);
              }
              return n;
            }
            function _fd_write(e, t, r, _) {
              try {
                var n = doWritev(SYSCALLS.getStreamFromFD(e), t, r);
                return HEAPU32[_ >> 2] = n, 0;
              } catch (e2) {
                if ("undefined" == typeof FS || !(e2 instanceof FS.ErrnoError)) throw e2;
                return e2.errno;
              }
            }
            function _tree_sitter_log_callback(e, t) {
              if (currentLogCallback) {
                const r = UTF8ToString(t);
                currentLogCallback(r, 0 !== e);
              }
            }
            function _tree_sitter_parse_callback(e, t, r, _, n) {
              var s = currentParseCallback(t, { row: r, column: _ });
              "string" == typeof s ? (setValue(n, s.length, "i32"), stringToUTF16(s, e, 10240)) : setValue(n, 0, "i32");
            }
            function handleException(e) {
              if (e instanceof ExitStatus || "unwind" == e) return EXITSTATUS;
              quit_(1, e);
            }
            function allocateUTF8OnStack(e) {
              var t = lengthBytesUTF8(e) + 1, r = stackAlloc(t);
              return stringToUTF8Array(e, HEAP8, r, t), r;
            }
            function stringToUTF16(e, t, r) {
              if (void 0 === r && (r = 2147483647), r < 2) return 0;
              for (var _ = t, n = (r -= 2) < 2 * e.length ? r / 2 : e.length, s = 0; s < n; ++s) {
                var a = e.charCodeAt(s);
                HEAP16[t >> 1] = a, t += 2;
              }
              return HEAP16[t >> 1] = 0, t - _;
            }
            function AsciiToString(e) {
              for (var t = ""; ; ) {
                var r = HEAPU8[e++ >> 0];
                if (!r) return t;
                t += String.fromCharCode(r);
              }
            }
            _exit.sig = "vi", _fd_close.sig = "ii", _fd_seek.sig = "iijip", _fd_write.sig = "iippp";
            var asmLibraryArg = { __heap_base: ___heap_base, __indirect_function_table: wasmTable, __memory_base: ___memory_base, __stack_pointer: ___stack_pointer, __table_base: ___table_base, _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic, abort: _abort, emscripten_get_now: _emscripten_get_now, emscripten_memcpy_big: _emscripten_memcpy_big, emscripten_resize_heap: _emscripten_resize_heap, exit: _exit, fd_close: _fd_close, fd_seek: _fd_seek, fd_write: _fd_write, memory: wasmMemory, tree_sitter_log_callback: _tree_sitter_log_callback, tree_sitter_parse_callback: _tree_sitter_parse_callback }, asm = createWasm(), ___wasm_call_ctors = Module.___wasm_call_ctors = function() {
              return (___wasm_call_ctors = Module.___wasm_call_ctors = Module.asm.__wasm_call_ctors).apply(null, arguments);
            }, ___wasm_apply_data_relocs = Module.___wasm_apply_data_relocs = function() {
              return (___wasm_apply_data_relocs = Module.___wasm_apply_data_relocs = Module.asm.__wasm_apply_data_relocs).apply(null, arguments);
            }, _malloc = Module._malloc = function() {
              return (_malloc = Module._malloc = Module.asm.malloc).apply(null, arguments);
            }, _calloc = Module._calloc = function() {
              return (_calloc = Module._calloc = Module.asm.calloc).apply(null, arguments);
            }, _realloc = Module._realloc = function() {
              return (_realloc = Module._realloc = Module.asm.realloc).apply(null, arguments);
            }, _free = Module._free = function() {
              return (_free = Module._free = Module.asm.free).apply(null, arguments);
            }, _ts_language_symbol_count = Module._ts_language_symbol_count = function() {
              return (_ts_language_symbol_count = Module._ts_language_symbol_count = Module.asm.ts_language_symbol_count).apply(null, arguments);
            }, _ts_language_version = Module._ts_language_version = function() {
              return (_ts_language_version = Module._ts_language_version = Module.asm.ts_language_version).apply(null, arguments);
            }, _ts_language_field_count = Module._ts_language_field_count = function() {
              return (_ts_language_field_count = Module._ts_language_field_count = Module.asm.ts_language_field_count).apply(null, arguments);
            }, _ts_language_symbol_name = Module._ts_language_symbol_name = function() {
              return (_ts_language_symbol_name = Module._ts_language_symbol_name = Module.asm.ts_language_symbol_name).apply(null, arguments);
            }, _ts_language_symbol_for_name = Module._ts_language_symbol_for_name = function() {
              return (_ts_language_symbol_for_name = Module._ts_language_symbol_for_name = Module.asm.ts_language_symbol_for_name).apply(null, arguments);
            }, _ts_language_symbol_type = Module._ts_language_symbol_type = function() {
              return (_ts_language_symbol_type = Module._ts_language_symbol_type = Module.asm.ts_language_symbol_type).apply(null, arguments);
            }, _ts_language_field_name_for_id = Module._ts_language_field_name_for_id = function() {
              return (_ts_language_field_name_for_id = Module._ts_language_field_name_for_id = Module.asm.ts_language_field_name_for_id).apply(null, arguments);
            }, _memset = Module._memset = function() {
              return (_memset = Module._memset = Module.asm.memset).apply(null, arguments);
            }, _memcpy = Module._memcpy = function() {
              return (_memcpy = Module._memcpy = Module.asm.memcpy).apply(null, arguments);
            }, _ts_parser_delete = Module._ts_parser_delete = function() {
              return (_ts_parser_delete = Module._ts_parser_delete = Module.asm.ts_parser_delete).apply(null, arguments);
            }, _ts_parser_reset = Module._ts_parser_reset = function() {
              return (_ts_parser_reset = Module._ts_parser_reset = Module.asm.ts_parser_reset).apply(null, arguments);
            }, _ts_parser_set_language = Module._ts_parser_set_language = function() {
              return (_ts_parser_set_language = Module._ts_parser_set_language = Module.asm.ts_parser_set_language).apply(null, arguments);
            }, _ts_parser_timeout_micros = Module._ts_parser_timeout_micros = function() {
              return (_ts_parser_timeout_micros = Module._ts_parser_timeout_micros = Module.asm.ts_parser_timeout_micros).apply(null, arguments);
            }, _ts_parser_set_timeout_micros = Module._ts_parser_set_timeout_micros = function() {
              return (_ts_parser_set_timeout_micros = Module._ts_parser_set_timeout_micros = Module.asm.ts_parser_set_timeout_micros).apply(null, arguments);
            }, _memmove = Module._memmove = function() {
              return (_memmove = Module._memmove = Module.asm.memmove).apply(null, arguments);
            }, _memcmp = Module._memcmp = function() {
              return (_memcmp = Module._memcmp = Module.asm.memcmp).apply(null, arguments);
            }, _ts_query_new = Module._ts_query_new = function() {
              return (_ts_query_new = Module._ts_query_new = Module.asm.ts_query_new).apply(null, arguments);
            }, _ts_query_delete = Module._ts_query_delete = function() {
              return (_ts_query_delete = Module._ts_query_delete = Module.asm.ts_query_delete).apply(null, arguments);
            }, _iswspace = Module._iswspace = function() {
              return (_iswspace = Module._iswspace = Module.asm.iswspace).apply(null, arguments);
            }, _iswalnum = Module._iswalnum = function() {
              return (_iswalnum = Module._iswalnum = Module.asm.iswalnum).apply(null, arguments);
            }, _ts_query_pattern_count = Module._ts_query_pattern_count = function() {
              return (_ts_query_pattern_count = Module._ts_query_pattern_count = Module.asm.ts_query_pattern_count).apply(null, arguments);
            }, _ts_query_capture_count = Module._ts_query_capture_count = function() {
              return (_ts_query_capture_count = Module._ts_query_capture_count = Module.asm.ts_query_capture_count).apply(null, arguments);
            }, _ts_query_string_count = Module._ts_query_string_count = function() {
              return (_ts_query_string_count = Module._ts_query_string_count = Module.asm.ts_query_string_count).apply(null, arguments);
            }, _ts_query_capture_name_for_id = Module._ts_query_capture_name_for_id = function() {
              return (_ts_query_capture_name_for_id = Module._ts_query_capture_name_for_id = Module.asm.ts_query_capture_name_for_id).apply(null, arguments);
            }, _ts_query_string_value_for_id = Module._ts_query_string_value_for_id = function() {
              return (_ts_query_string_value_for_id = Module._ts_query_string_value_for_id = Module.asm.ts_query_string_value_for_id).apply(null, arguments);
            }, _ts_query_predicates_for_pattern = Module._ts_query_predicates_for_pattern = function() {
              return (_ts_query_predicates_for_pattern = Module._ts_query_predicates_for_pattern = Module.asm.ts_query_predicates_for_pattern).apply(null, arguments);
            }, _ts_tree_copy = Module._ts_tree_copy = function() {
              return (_ts_tree_copy = Module._ts_tree_copy = Module.asm.ts_tree_copy).apply(null, arguments);
            }, _ts_tree_delete = Module._ts_tree_delete = function() {
              return (_ts_tree_delete = Module._ts_tree_delete = Module.asm.ts_tree_delete).apply(null, arguments);
            }, _ts_init = Module._ts_init = function() {
              return (_ts_init = Module._ts_init = Module.asm.ts_init).apply(null, arguments);
            }, _ts_parser_new_wasm = Module._ts_parser_new_wasm = function() {
              return (_ts_parser_new_wasm = Module._ts_parser_new_wasm = Module.asm.ts_parser_new_wasm).apply(null, arguments);
            }, _ts_parser_enable_logger_wasm = Module._ts_parser_enable_logger_wasm = function() {
              return (_ts_parser_enable_logger_wasm = Module._ts_parser_enable_logger_wasm = Module.asm.ts_parser_enable_logger_wasm).apply(null, arguments);
            }, _ts_parser_parse_wasm = Module._ts_parser_parse_wasm = function() {
              return (_ts_parser_parse_wasm = Module._ts_parser_parse_wasm = Module.asm.ts_parser_parse_wasm).apply(null, arguments);
            }, _ts_language_type_is_named_wasm = Module._ts_language_type_is_named_wasm = function() {
              return (_ts_language_type_is_named_wasm = Module._ts_language_type_is_named_wasm = Module.asm.ts_language_type_is_named_wasm).apply(null, arguments);
            }, _ts_language_type_is_visible_wasm = Module._ts_language_type_is_visible_wasm = function() {
              return (_ts_language_type_is_visible_wasm = Module._ts_language_type_is_visible_wasm = Module.asm.ts_language_type_is_visible_wasm).apply(null, arguments);
            }, _ts_tree_root_node_wasm = Module._ts_tree_root_node_wasm = function() {
              return (_ts_tree_root_node_wasm = Module._ts_tree_root_node_wasm = Module.asm.ts_tree_root_node_wasm).apply(null, arguments);
            }, _ts_tree_edit_wasm = Module._ts_tree_edit_wasm = function() {
              return (_ts_tree_edit_wasm = Module._ts_tree_edit_wasm = Module.asm.ts_tree_edit_wasm).apply(null, arguments);
            }, _ts_tree_get_changed_ranges_wasm = Module._ts_tree_get_changed_ranges_wasm = function() {
              return (_ts_tree_get_changed_ranges_wasm = Module._ts_tree_get_changed_ranges_wasm = Module.asm.ts_tree_get_changed_ranges_wasm).apply(null, arguments);
            }, _ts_tree_cursor_new_wasm = Module._ts_tree_cursor_new_wasm = function() {
              return (_ts_tree_cursor_new_wasm = Module._ts_tree_cursor_new_wasm = Module.asm.ts_tree_cursor_new_wasm).apply(null, arguments);
            }, _ts_tree_cursor_delete_wasm = Module._ts_tree_cursor_delete_wasm = function() {
              return (_ts_tree_cursor_delete_wasm = Module._ts_tree_cursor_delete_wasm = Module.asm.ts_tree_cursor_delete_wasm).apply(null, arguments);
            }, _ts_tree_cursor_reset_wasm = Module._ts_tree_cursor_reset_wasm = function() {
              return (_ts_tree_cursor_reset_wasm = Module._ts_tree_cursor_reset_wasm = Module.asm.ts_tree_cursor_reset_wasm).apply(null, arguments);
            }, _ts_tree_cursor_goto_first_child_wasm = Module._ts_tree_cursor_goto_first_child_wasm = function() {
              return (_ts_tree_cursor_goto_first_child_wasm = Module._ts_tree_cursor_goto_first_child_wasm = Module.asm.ts_tree_cursor_goto_first_child_wasm).apply(null, arguments);
            }, _ts_tree_cursor_goto_next_sibling_wasm = Module._ts_tree_cursor_goto_next_sibling_wasm = function() {
              return (_ts_tree_cursor_goto_next_sibling_wasm = Module._ts_tree_cursor_goto_next_sibling_wasm = Module.asm.ts_tree_cursor_goto_next_sibling_wasm).apply(null, arguments);
            }, _ts_tree_cursor_goto_parent_wasm = Module._ts_tree_cursor_goto_parent_wasm = function() {
              return (_ts_tree_cursor_goto_parent_wasm = Module._ts_tree_cursor_goto_parent_wasm = Module.asm.ts_tree_cursor_goto_parent_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_node_type_id_wasm = Module._ts_tree_cursor_current_node_type_id_wasm = function() {
              return (_ts_tree_cursor_current_node_type_id_wasm = Module._ts_tree_cursor_current_node_type_id_wasm = Module.asm.ts_tree_cursor_current_node_type_id_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_node_is_named_wasm = Module._ts_tree_cursor_current_node_is_named_wasm = function() {
              return (_ts_tree_cursor_current_node_is_named_wasm = Module._ts_tree_cursor_current_node_is_named_wasm = Module.asm.ts_tree_cursor_current_node_is_named_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_node_is_missing_wasm = Module._ts_tree_cursor_current_node_is_missing_wasm = function() {
              return (_ts_tree_cursor_current_node_is_missing_wasm = Module._ts_tree_cursor_current_node_is_missing_wasm = Module.asm.ts_tree_cursor_current_node_is_missing_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_node_id_wasm = Module._ts_tree_cursor_current_node_id_wasm = function() {
              return (_ts_tree_cursor_current_node_id_wasm = Module._ts_tree_cursor_current_node_id_wasm = Module.asm.ts_tree_cursor_current_node_id_wasm).apply(null, arguments);
            }, _ts_tree_cursor_start_position_wasm = Module._ts_tree_cursor_start_position_wasm = function() {
              return (_ts_tree_cursor_start_position_wasm = Module._ts_tree_cursor_start_position_wasm = Module.asm.ts_tree_cursor_start_position_wasm).apply(null, arguments);
            }, _ts_tree_cursor_end_position_wasm = Module._ts_tree_cursor_end_position_wasm = function() {
              return (_ts_tree_cursor_end_position_wasm = Module._ts_tree_cursor_end_position_wasm = Module.asm.ts_tree_cursor_end_position_wasm).apply(null, arguments);
            }, _ts_tree_cursor_start_index_wasm = Module._ts_tree_cursor_start_index_wasm = function() {
              return (_ts_tree_cursor_start_index_wasm = Module._ts_tree_cursor_start_index_wasm = Module.asm.ts_tree_cursor_start_index_wasm).apply(null, arguments);
            }, _ts_tree_cursor_end_index_wasm = Module._ts_tree_cursor_end_index_wasm = function() {
              return (_ts_tree_cursor_end_index_wasm = Module._ts_tree_cursor_end_index_wasm = Module.asm.ts_tree_cursor_end_index_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_field_id_wasm = Module._ts_tree_cursor_current_field_id_wasm = function() {
              return (_ts_tree_cursor_current_field_id_wasm = Module._ts_tree_cursor_current_field_id_wasm = Module.asm.ts_tree_cursor_current_field_id_wasm).apply(null, arguments);
            }, _ts_tree_cursor_current_node_wasm = Module._ts_tree_cursor_current_node_wasm = function() {
              return (_ts_tree_cursor_current_node_wasm = Module._ts_tree_cursor_current_node_wasm = Module.asm.ts_tree_cursor_current_node_wasm).apply(null, arguments);
            }, _ts_node_symbol_wasm = Module._ts_node_symbol_wasm = function() {
              return (_ts_node_symbol_wasm = Module._ts_node_symbol_wasm = Module.asm.ts_node_symbol_wasm).apply(null, arguments);
            }, _ts_node_child_count_wasm = Module._ts_node_child_count_wasm = function() {
              return (_ts_node_child_count_wasm = Module._ts_node_child_count_wasm = Module.asm.ts_node_child_count_wasm).apply(null, arguments);
            }, _ts_node_named_child_count_wasm = Module._ts_node_named_child_count_wasm = function() {
              return (_ts_node_named_child_count_wasm = Module._ts_node_named_child_count_wasm = Module.asm.ts_node_named_child_count_wasm).apply(null, arguments);
            }, _ts_node_child_wasm = Module._ts_node_child_wasm = function() {
              return (_ts_node_child_wasm = Module._ts_node_child_wasm = Module.asm.ts_node_child_wasm).apply(null, arguments);
            }, _ts_node_named_child_wasm = Module._ts_node_named_child_wasm = function() {
              return (_ts_node_named_child_wasm = Module._ts_node_named_child_wasm = Module.asm.ts_node_named_child_wasm).apply(null, arguments);
            }, _ts_node_child_by_field_id_wasm = Module._ts_node_child_by_field_id_wasm = function() {
              return (_ts_node_child_by_field_id_wasm = Module._ts_node_child_by_field_id_wasm = Module.asm.ts_node_child_by_field_id_wasm).apply(null, arguments);
            }, _ts_node_next_sibling_wasm = Module._ts_node_next_sibling_wasm = function() {
              return (_ts_node_next_sibling_wasm = Module._ts_node_next_sibling_wasm = Module.asm.ts_node_next_sibling_wasm).apply(null, arguments);
            }, _ts_node_prev_sibling_wasm = Module._ts_node_prev_sibling_wasm = function() {
              return (_ts_node_prev_sibling_wasm = Module._ts_node_prev_sibling_wasm = Module.asm.ts_node_prev_sibling_wasm).apply(null, arguments);
            }, _ts_node_next_named_sibling_wasm = Module._ts_node_next_named_sibling_wasm = function() {
              return (_ts_node_next_named_sibling_wasm = Module._ts_node_next_named_sibling_wasm = Module.asm.ts_node_next_named_sibling_wasm).apply(null, arguments);
            }, _ts_node_prev_named_sibling_wasm = Module._ts_node_prev_named_sibling_wasm = function() {
              return (_ts_node_prev_named_sibling_wasm = Module._ts_node_prev_named_sibling_wasm = Module.asm.ts_node_prev_named_sibling_wasm).apply(null, arguments);
            }, _ts_node_parent_wasm = Module._ts_node_parent_wasm = function() {
              return (_ts_node_parent_wasm = Module._ts_node_parent_wasm = Module.asm.ts_node_parent_wasm).apply(null, arguments);
            }, _ts_node_descendant_for_index_wasm = Module._ts_node_descendant_for_index_wasm = function() {
              return (_ts_node_descendant_for_index_wasm = Module._ts_node_descendant_for_index_wasm = Module.asm.ts_node_descendant_for_index_wasm).apply(null, arguments);
            }, _ts_node_named_descendant_for_index_wasm = Module._ts_node_named_descendant_for_index_wasm = function() {
              return (_ts_node_named_descendant_for_index_wasm = Module._ts_node_named_descendant_for_index_wasm = Module.asm.ts_node_named_descendant_for_index_wasm).apply(null, arguments);
            }, _ts_node_descendant_for_position_wasm = Module._ts_node_descendant_for_position_wasm = function() {
              return (_ts_node_descendant_for_position_wasm = Module._ts_node_descendant_for_position_wasm = Module.asm.ts_node_descendant_for_position_wasm).apply(null, arguments);
            }, _ts_node_named_descendant_for_position_wasm = Module._ts_node_named_descendant_for_position_wasm = function() {
              return (_ts_node_named_descendant_for_position_wasm = Module._ts_node_named_descendant_for_position_wasm = Module.asm.ts_node_named_descendant_for_position_wasm).apply(null, arguments);
            }, _ts_node_start_point_wasm = Module._ts_node_start_point_wasm = function() {
              return (_ts_node_start_point_wasm = Module._ts_node_start_point_wasm = Module.asm.ts_node_start_point_wasm).apply(null, arguments);
            }, _ts_node_end_point_wasm = Module._ts_node_end_point_wasm = function() {
              return (_ts_node_end_point_wasm = Module._ts_node_end_point_wasm = Module.asm.ts_node_end_point_wasm).apply(null, arguments);
            }, _ts_node_start_index_wasm = Module._ts_node_start_index_wasm = function() {
              return (_ts_node_start_index_wasm = Module._ts_node_start_index_wasm = Module.asm.ts_node_start_index_wasm).apply(null, arguments);
            }, _ts_node_end_index_wasm = Module._ts_node_end_index_wasm = function() {
              return (_ts_node_end_index_wasm = Module._ts_node_end_index_wasm = Module.asm.ts_node_end_index_wasm).apply(null, arguments);
            }, _ts_node_to_string_wasm = Module._ts_node_to_string_wasm = function() {
              return (_ts_node_to_string_wasm = Module._ts_node_to_string_wasm = Module.asm.ts_node_to_string_wasm).apply(null, arguments);
            }, _ts_node_children_wasm = Module._ts_node_children_wasm = function() {
              return (_ts_node_children_wasm = Module._ts_node_children_wasm = Module.asm.ts_node_children_wasm).apply(null, arguments);
            }, _ts_node_named_children_wasm = Module._ts_node_named_children_wasm = function() {
              return (_ts_node_named_children_wasm = Module._ts_node_named_children_wasm = Module.asm.ts_node_named_children_wasm).apply(null, arguments);
            }, _ts_node_descendants_of_type_wasm = Module._ts_node_descendants_of_type_wasm = function() {
              return (_ts_node_descendants_of_type_wasm = Module._ts_node_descendants_of_type_wasm = Module.asm.ts_node_descendants_of_type_wasm).apply(null, arguments);
            }, _ts_node_is_named_wasm = Module._ts_node_is_named_wasm = function() {
              return (_ts_node_is_named_wasm = Module._ts_node_is_named_wasm = Module.asm.ts_node_is_named_wasm).apply(null, arguments);
            }, _ts_node_has_changes_wasm = Module._ts_node_has_changes_wasm = function() {
              return (_ts_node_has_changes_wasm = Module._ts_node_has_changes_wasm = Module.asm.ts_node_has_changes_wasm).apply(null, arguments);
            }, _ts_node_has_error_wasm = Module._ts_node_has_error_wasm = function() {
              return (_ts_node_has_error_wasm = Module._ts_node_has_error_wasm = Module.asm.ts_node_has_error_wasm).apply(null, arguments);
            }, _ts_node_is_missing_wasm = Module._ts_node_is_missing_wasm = function() {
              return (_ts_node_is_missing_wasm = Module._ts_node_is_missing_wasm = Module.asm.ts_node_is_missing_wasm).apply(null, arguments);
            }, _ts_query_matches_wasm = Module._ts_query_matches_wasm = function() {
              return (_ts_query_matches_wasm = Module._ts_query_matches_wasm = Module.asm.ts_query_matches_wasm).apply(null, arguments);
            }, _ts_query_captures_wasm = Module._ts_query_captures_wasm = function() {
              return (_ts_query_captures_wasm = Module._ts_query_captures_wasm = Module.asm.ts_query_captures_wasm).apply(null, arguments);
            }, ___cxa_atexit = Module.___cxa_atexit = function() {
              return (___cxa_atexit = Module.___cxa_atexit = Module.asm.__cxa_atexit).apply(null, arguments);
            }, _iswdigit = Module._iswdigit = function() {
              return (_iswdigit = Module._iswdigit = Module.asm.iswdigit).apply(null, arguments);
            }, _iswalpha = Module._iswalpha = function() {
              return (_iswalpha = Module._iswalpha = Module.asm.iswalpha).apply(null, arguments);
            }, _iswlower = Module._iswlower = function() {
              return (_iswlower = Module._iswlower = Module.asm.iswlower).apply(null, arguments);
            }, _memchr = Module._memchr = function() {
              return (_memchr = Module._memchr = Module.asm.memchr).apply(null, arguments);
            }, _strlen = Module._strlen = function() {
              return (_strlen = Module._strlen = Module.asm.strlen).apply(null, arguments);
            }, _towupper = Module._towupper = function() {
              return (_towupper = Module._towupper = Module.asm.towupper).apply(null, arguments);
            }, _setThrew = Module._setThrew = function() {
              return (_setThrew = Module._setThrew = Module.asm.setThrew).apply(null, arguments);
            }, stackSave = Module.stackSave = function() {
              return (stackSave = Module.stackSave = Module.asm.stackSave).apply(null, arguments);
            }, stackRestore = Module.stackRestore = function() {
              return (stackRestore = Module.stackRestore = Module.asm.stackRestore).apply(null, arguments);
            }, stackAlloc = Module.stackAlloc = function() {
              return (stackAlloc = Module.stackAlloc = Module.asm.stackAlloc).apply(null, arguments);
            }, __Znwm = Module.__Znwm = function() {
              return (__Znwm = Module.__Znwm = Module.asm._Znwm).apply(null, arguments);
            }, __ZdlPv = Module.__ZdlPv = function() {
              return (__ZdlPv = Module.__ZdlPv = Module.asm._ZdlPv).apply(null, arguments);
            }, __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = function() {
              return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module.asm._ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev).apply(null, arguments);
            }, __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = function() {
              return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module.asm._ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm).apply(null, arguments);
            }, __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = function() {
              return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module.asm._ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm).apply(null, arguments);
            }, __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = function() {
              return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module.asm._ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm).apply(null, arguments);
            }, __ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module.__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = function() {
              return (__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module.__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module.asm._ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm).apply(null, arguments);
            }, __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = function() {
              return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module.__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module.asm._ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc).apply(null, arguments);
            }, __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = function() {
              return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module.asm._ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev).apply(null, arguments);
            }, __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = function() {
              return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module.asm._ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw).apply(null, arguments);
            }, __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = function() {
              return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = Module.__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = Module.asm._ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw).apply(null, arguments);
            }, dynCall_jiji = Module.dynCall_jiji = function() {
              return (dynCall_jiji = Module.dynCall_jiji = Module.asm.dynCall_jiji).apply(null, arguments);
            }, _orig$ts_parser_timeout_micros = Module._orig$ts_parser_timeout_micros = function() {
              return (_orig$ts_parser_timeout_micros = Module._orig$ts_parser_timeout_micros = Module.asm.orig$ts_parser_timeout_micros).apply(null, arguments);
            }, _orig$ts_parser_set_timeout_micros = Module._orig$ts_parser_set_timeout_micros = function() {
              return (_orig$ts_parser_set_timeout_micros = Module._orig$ts_parser_set_timeout_micros = Module.asm.orig$ts_parser_set_timeout_micros).apply(null, arguments);
            }, calledRun;
            function callMain(e) {
              var t = Module._main;
              if (t) {
                (e = e || []).unshift(thisProgram);
                var r = e.length, _ = stackAlloc(4 * (r + 1)), n = _ >> 2;
                e.forEach(((e2) => {
                  HEAP32[n++] = allocateUTF8OnStack(e2);
                })), HEAP32[n] = 0;
                try {
                  var s = t(r, _);
                  return exitJS(s, true), s;
                } catch (e2) {
                  return handleException(e2);
                }
              }
            }
            Module.AsciiToString = AsciiToString, Module.stringToUTF16 = stringToUTF16, dependenciesFulfilled = function e() {
              calledRun || run(), calledRun || (dependenciesFulfilled = e);
            };
            var dylibsLoaded = false;
            function run(e) {
              function t() {
                calledRun || (calledRun = true, Module.calledRun = true, ABORT || (initRuntime(), preMain(), Module.onRuntimeInitialized && Module.onRuntimeInitialized(), shouldRunNow && callMain(e), postRun()));
              }
              e = e || arguments_, runDependencies > 0 || !dylibsLoaded && (preloadDylibs(), dylibsLoaded = true, runDependencies > 0) || (preRun(), runDependencies > 0 || (Module.setStatus ? (Module.setStatus("Running..."), setTimeout((function() {
                setTimeout((function() {
                  Module.setStatus("");
                }), 1), t();
              }), 1)) : t()));
            }
            if (Module.preInit) for ("function" == typeof Module.preInit && (Module.preInit = [Module.preInit]); Module.preInit.length > 0; ) Module.preInit.pop()();
            var shouldRunNow = true;
            Module.noInitialRun && (shouldRunNow = false), run();
            const C = Module, INTERNAL = {}, SIZE_OF_INT = 4, SIZE_OF_NODE = 5 * SIZE_OF_INT, SIZE_OF_POINT = 2 * SIZE_OF_INT, SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT, ZERO_POINT = { row: 0, column: 0 }, QUERY_WORD_REGEX = /[\w-.]*/g, PREDICATE_STEP_TYPE_CAPTURE = 1, PREDICATE_STEP_TYPE_STRING = 2, LANGUAGE_FUNCTION_REGEX = /^_?tree_sitter_\w+/;
            var VERSION, MIN_COMPATIBLE_VERSION, TRANSFER_BUFFER, currentParseCallback, currentLogCallback;
            class ParserImpl {
              static init() {
                TRANSFER_BUFFER = C._ts_init(), VERSION = getValue(TRANSFER_BUFFER, "i32"), MIN_COMPATIBLE_VERSION = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
              }
              initialize() {
                C._ts_parser_new_wasm(), this[0] = getValue(TRANSFER_BUFFER, "i32"), this[1] = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
              }
              delete() {
                C._ts_parser_delete(this[0]), C._free(this[1]), this[0] = 0, this[1] = 0;
              }
              setLanguage(e) {
                let t;
                if (e) {
                  if (e.constructor !== Language) throw new Error("Argument must be a Language");
                  {
                    t = e[0];
                    const r = C._ts_language_version(t);
                    if (r < MIN_COMPATIBLE_VERSION || VERSION < r) throw new Error(`Incompatible language version ${r}. Compatibility range ${MIN_COMPATIBLE_VERSION} through ${VERSION}.`);
                  }
                } else t = 0, e = null;
                return this.language = e, C._ts_parser_set_language(this[0], t), this;
              }
              getLanguage() {
                return this.language;
              }
              parse(e, t, r) {
                if ("string" == typeof e) currentParseCallback = (t2, r2, _2) => e.slice(t2, _2);
                else {
                  if ("function" != typeof e) throw new Error("Argument must be a string or a function");
                  currentParseCallback = e;
                }
                this.logCallback ? (currentLogCallback = this.logCallback, C._ts_parser_enable_logger_wasm(this[0], 1)) : (currentLogCallback = null, C._ts_parser_enable_logger_wasm(this[0], 0));
                let _ = 0, n = 0;
                if (r && r.includedRanges) {
                  _ = r.includedRanges.length, n = C._calloc(_, SIZE_OF_RANGE);
                  let e2 = n;
                  for (let t2 = 0; t2 < _; t2++) marshalRange(e2, r.includedRanges[t2]), e2 += SIZE_OF_RANGE;
                }
                const s = C._ts_parser_parse_wasm(this[0], this[1], t ? t[0] : 0, n, _);
                if (!s) throw currentParseCallback = null, currentLogCallback = null, new Error("Parsing failed");
                const a = new Tree(INTERNAL, s, this.language, currentParseCallback);
                return currentParseCallback = null, currentLogCallback = null, a;
              }
              reset() {
                C._ts_parser_reset(this[0]);
              }
              setTimeoutMicros(e) {
                C._ts_parser_set_timeout_micros(this[0], e);
              }
              getTimeoutMicros() {
                return C._ts_parser_timeout_micros(this[0]);
              }
              setLogger(e) {
                if (e) {
                  if ("function" != typeof e) throw new Error("Logger callback must be a function");
                } else e = null;
                return this.logCallback = e, this;
              }
              getLogger() {
                return this.logCallback;
              }
            }
            class Tree {
              constructor(e, t, r, _) {
                assertInternal(e), this[0] = t, this.language = r, this.textCallback = _;
              }
              copy() {
                const e = C._ts_tree_copy(this[0]);
                return new Tree(INTERNAL, e, this.language, this.textCallback);
              }
              delete() {
                C._ts_tree_delete(this[0]), this[0] = 0;
              }
              edit(e) {
                marshalEdit(e), C._ts_tree_edit_wasm(this[0]);
              }
              get rootNode() {
                return C._ts_tree_root_node_wasm(this[0]), unmarshalNode(this);
              }
              getLanguage() {
                return this.language;
              }
              walk() {
                return this.rootNode.walk();
              }
              getChangedRanges(e) {
                if (e.constructor !== Tree) throw new TypeError("Argument must be a Tree");
                C._ts_tree_get_changed_ranges_wasm(this[0], e[0]);
                const t = getValue(TRANSFER_BUFFER, "i32"), r = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32"), _ = new Array(t);
                if (t > 0) {
                  let e2 = r;
                  for (let r2 = 0; r2 < t; r2++) _[r2] = unmarshalRange(e2), e2 += SIZE_OF_RANGE;
                  C._free(r);
                }
                return _;
              }
            }
            class Node {
              constructor(e, t) {
                assertInternal(e), this.tree = t;
              }
              get typeId() {
                return marshalNode(this), C._ts_node_symbol_wasm(this.tree[0]);
              }
              get type() {
                return this.tree.language.types[this.typeId] || "ERROR";
              }
              get endPosition() {
                return marshalNode(this), C._ts_node_end_point_wasm(this.tree[0]), unmarshalPoint(TRANSFER_BUFFER);
              }
              get endIndex() {
                return marshalNode(this), C._ts_node_end_index_wasm(this.tree[0]);
              }
              get text() {
                return getText(this.tree, this.startIndex, this.endIndex);
              }
              isNamed() {
                return marshalNode(this), 1 === C._ts_node_is_named_wasm(this.tree[0]);
              }
              hasError() {
                return marshalNode(this), 1 === C._ts_node_has_error_wasm(this.tree[0]);
              }
              hasChanges() {
                return marshalNode(this), 1 === C._ts_node_has_changes_wasm(this.tree[0]);
              }
              isMissing() {
                return marshalNode(this), 1 === C._ts_node_is_missing_wasm(this.tree[0]);
              }
              equals(e) {
                return this.id === e.id;
              }
              child(e) {
                return marshalNode(this), C._ts_node_child_wasm(this.tree[0], e), unmarshalNode(this.tree);
              }
              namedChild(e) {
                return marshalNode(this), C._ts_node_named_child_wasm(this.tree[0], e), unmarshalNode(this.tree);
              }
              childForFieldId(e) {
                return marshalNode(this), C._ts_node_child_by_field_id_wasm(this.tree[0], e), unmarshalNode(this.tree);
              }
              childForFieldName(e) {
                const t = this.tree.language.fields.indexOf(e);
                if (-1 !== t) return this.childForFieldId(t);
              }
              get childCount() {
                return marshalNode(this), C._ts_node_child_count_wasm(this.tree[0]);
              }
              get namedChildCount() {
                return marshalNode(this), C._ts_node_named_child_count_wasm(this.tree[0]);
              }
              get firstChild() {
                return this.child(0);
              }
              get firstNamedChild() {
                return this.namedChild(0);
              }
              get lastChild() {
                return this.child(this.childCount - 1);
              }
              get lastNamedChild() {
                return this.namedChild(this.namedChildCount - 1);
              }
              get children() {
                if (!this._children) {
                  marshalNode(this), C._ts_node_children_wasm(this.tree[0]);
                  const e = getValue(TRANSFER_BUFFER, "i32"), t = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                  if (this._children = new Array(e), e > 0) {
                    let r = t;
                    for (let t2 = 0; t2 < e; t2++) this._children[t2] = unmarshalNode(this.tree, r), r += SIZE_OF_NODE;
                    C._free(t);
                  }
                }
                return this._children;
              }
              get namedChildren() {
                if (!this._namedChildren) {
                  marshalNode(this), C._ts_node_named_children_wasm(this.tree[0]);
                  const e = getValue(TRANSFER_BUFFER, "i32"), t = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                  if (this._namedChildren = new Array(e), e > 0) {
                    let r = t;
                    for (let t2 = 0; t2 < e; t2++) this._namedChildren[t2] = unmarshalNode(this.tree, r), r += SIZE_OF_NODE;
                    C._free(t);
                  }
                }
                return this._namedChildren;
              }
              descendantsOfType(e, t, r) {
                Array.isArray(e) || (e = [e]), t || (t = ZERO_POINT), r || (r = ZERO_POINT);
                const _ = [], n = this.tree.language.types;
                for (let t2 = 0, r2 = n.length; t2 < r2; t2++) e.includes(n[t2]) && _.push(t2);
                const s = C._malloc(SIZE_OF_INT * _.length);
                for (let e2 = 0, t2 = _.length; e2 < t2; e2++) setValue(s + e2 * SIZE_OF_INT, _[e2], "i32");
                marshalNode(this), C._ts_node_descendants_of_type_wasm(this.tree[0], s, _.length, t.row, t.column, r.row, r.column);
                const a = getValue(TRANSFER_BUFFER, "i32"), o = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32"), i = new Array(a);
                if (a > 0) {
                  let e2 = o;
                  for (let t2 = 0; t2 < a; t2++) i[t2] = unmarshalNode(this.tree, e2), e2 += SIZE_OF_NODE;
                }
                return C._free(o), C._free(s), i;
              }
              get nextSibling() {
                return marshalNode(this), C._ts_node_next_sibling_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              get previousSibling() {
                return marshalNode(this), C._ts_node_prev_sibling_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              get nextNamedSibling() {
                return marshalNode(this), C._ts_node_next_named_sibling_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              get previousNamedSibling() {
                return marshalNode(this), C._ts_node_prev_named_sibling_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              get parent() {
                return marshalNode(this), C._ts_node_parent_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              descendantForIndex(e, t = e) {
                if ("number" != typeof e || "number" != typeof t) throw new Error("Arguments must be numbers");
                marshalNode(this);
                let r = TRANSFER_BUFFER + SIZE_OF_NODE;
                return setValue(r, e, "i32"), setValue(r + SIZE_OF_INT, t, "i32"), C._ts_node_descendant_for_index_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              namedDescendantForIndex(e, t = e) {
                if ("number" != typeof e || "number" != typeof t) throw new Error("Arguments must be numbers");
                marshalNode(this);
                let r = TRANSFER_BUFFER + SIZE_OF_NODE;
                return setValue(r, e, "i32"), setValue(r + SIZE_OF_INT, t, "i32"), C._ts_node_named_descendant_for_index_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              descendantForPosition(e, t = e) {
                if (!isPoint(e) || !isPoint(t)) throw new Error("Arguments must be {row, column} objects");
                marshalNode(this);
                let r = TRANSFER_BUFFER + SIZE_OF_NODE;
                return marshalPoint(r, e), marshalPoint(r + SIZE_OF_POINT, t), C._ts_node_descendant_for_position_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              namedDescendantForPosition(e, t = e) {
                if (!isPoint(e) || !isPoint(t)) throw new Error("Arguments must be {row, column} objects");
                marshalNode(this);
                let r = TRANSFER_BUFFER + SIZE_OF_NODE;
                return marshalPoint(r, e), marshalPoint(r + SIZE_OF_POINT, t), C._ts_node_named_descendant_for_position_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              walk() {
                return marshalNode(this), C._ts_tree_cursor_new_wasm(this.tree[0]), new TreeCursor(INTERNAL, this.tree);
              }
              toString() {
                marshalNode(this);
                const e = C._ts_node_to_string_wasm(this.tree[0]), t = AsciiToString(e);
                return C._free(e), t;
              }
            }
            class TreeCursor {
              constructor(e, t) {
                assertInternal(e), this.tree = t, unmarshalTreeCursor(this);
              }
              delete() {
                marshalTreeCursor(this), C._ts_tree_cursor_delete_wasm(this.tree[0]), this[0] = this[1] = this[2] = 0;
              }
              reset(e) {
                marshalNode(e), marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE), C._ts_tree_cursor_reset_wasm(this.tree[0]), unmarshalTreeCursor(this);
              }
              get nodeType() {
                return this.tree.language.types[this.nodeTypeId] || "ERROR";
              }
              get nodeTypeId() {
                return marshalTreeCursor(this), C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0]);
              }
              get nodeId() {
                return marshalTreeCursor(this), C._ts_tree_cursor_current_node_id_wasm(this.tree[0]);
              }
              get nodeIsNamed() {
                return marshalTreeCursor(this), 1 === C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]);
              }
              get nodeIsMissing() {
                return marshalTreeCursor(this), 1 === C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]);
              }
              get nodeText() {
                marshalTreeCursor(this);
                const e = C._ts_tree_cursor_start_index_wasm(this.tree[0]), t = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
                return getText(this.tree, e, t);
              }
              get startPosition() {
                return marshalTreeCursor(this), C._ts_tree_cursor_start_position_wasm(this.tree[0]), unmarshalPoint(TRANSFER_BUFFER);
              }
              get endPosition() {
                return marshalTreeCursor(this), C._ts_tree_cursor_end_position_wasm(this.tree[0]), unmarshalPoint(TRANSFER_BUFFER);
              }
              get startIndex() {
                return marshalTreeCursor(this), C._ts_tree_cursor_start_index_wasm(this.tree[0]);
              }
              get endIndex() {
                return marshalTreeCursor(this), C._ts_tree_cursor_end_index_wasm(this.tree[0]);
              }
              currentNode() {
                return marshalTreeCursor(this), C._ts_tree_cursor_current_node_wasm(this.tree[0]), unmarshalNode(this.tree);
              }
              currentFieldId() {
                return marshalTreeCursor(this), C._ts_tree_cursor_current_field_id_wasm(this.tree[0]);
              }
              currentFieldName() {
                return this.tree.language.fields[this.currentFieldId()];
              }
              gotoFirstChild() {
                marshalTreeCursor(this);
                const e = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
                return unmarshalTreeCursor(this), 1 === e;
              }
              gotoNextSibling() {
                marshalTreeCursor(this);
                const e = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
                return unmarshalTreeCursor(this), 1 === e;
              }
              gotoParent() {
                marshalTreeCursor(this);
                const e = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
                return unmarshalTreeCursor(this), 1 === e;
              }
            }
            class Language {
              constructor(e, t) {
                assertInternal(e), this[0] = t, this.types = new Array(C._ts_language_symbol_count(this[0]));
                for (let e2 = 0, t2 = this.types.length; e2 < t2; e2++) C._ts_language_symbol_type(this[0], e2) < 2 && (this.types[e2] = UTF8ToString(C._ts_language_symbol_name(this[0], e2)));
                this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
                for (let e2 = 0, t2 = this.fields.length; e2 < t2; e2++) {
                  const t3 = C._ts_language_field_name_for_id(this[0], e2);
                  this.fields[e2] = 0 !== t3 ? UTF8ToString(t3) : null;
                }
              }
              get version() {
                return C._ts_language_version(this[0]);
              }
              get fieldCount() {
                return this.fields.length - 1;
              }
              fieldIdForName(e) {
                const t = this.fields.indexOf(e);
                return -1 !== t ? t : null;
              }
              fieldNameForId(e) {
                return this.fields[e] || null;
              }
              idForNodeType(e, t) {
                const r = lengthBytesUTF8(e), _ = C._malloc(r + 1);
                stringToUTF8(e, _, r + 1);
                const n = C._ts_language_symbol_for_name(this[0], _, r, t);
                return C._free(_), n || null;
              }
              get nodeTypeCount() {
                return C._ts_language_symbol_count(this[0]);
              }
              nodeTypeForId(e) {
                const t = C._ts_language_symbol_name(this[0], e);
                return t ? UTF8ToString(t) : null;
              }
              nodeTypeIsNamed(e) {
                return !!C._ts_language_type_is_named_wasm(this[0], e);
              }
              nodeTypeIsVisible(e) {
                return !!C._ts_language_type_is_visible_wasm(this[0], e);
              }
              query(e) {
                const t = lengthBytesUTF8(e), r = C._malloc(t + 1);
                stringToUTF8(e, r, t + 1);
                const _ = C._ts_query_new(this[0], r, t, TRANSFER_BUFFER, TRANSFER_BUFFER + SIZE_OF_INT);
                if (!_) {
                  const t2 = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32"), _2 = UTF8ToString(r, getValue(TRANSFER_BUFFER, "i32")).length, n2 = e.substr(_2, 100).split("\n")[0];
                  let s2, a2 = n2.match(QUERY_WORD_REGEX)[0];
                  switch (t2) {
                    case 2:
                      s2 = new RangeError(`Bad node name '${a2}'`);
                      break;
                    case 3:
                      s2 = new RangeError(`Bad field name '${a2}'`);
                      break;
                    case 4:
                      s2 = new RangeError(`Bad capture name @${a2}`);
                      break;
                    case 5:
                      s2 = new TypeError(`Bad pattern structure at offset ${_2}: '${n2}'...`), a2 = "";
                      break;
                    default:
                      s2 = new SyntaxError(`Bad syntax at offset ${_2}: '${n2}'...`), a2 = "";
                  }
                  throw s2.index = _2, s2.length = a2.length, C._free(r), s2;
                }
                const n = C._ts_query_string_count(_), s = C._ts_query_capture_count(_), a = C._ts_query_pattern_count(_), o = new Array(s), i = new Array(n);
                for (let e2 = 0; e2 < s; e2++) {
                  const t2 = C._ts_query_capture_name_for_id(_, e2, TRANSFER_BUFFER), r2 = getValue(TRANSFER_BUFFER, "i32");
                  o[e2] = UTF8ToString(t2, r2);
                }
                for (let e2 = 0; e2 < n; e2++) {
                  const t2 = C._ts_query_string_value_for_id(_, e2, TRANSFER_BUFFER), r2 = getValue(TRANSFER_BUFFER, "i32");
                  i[e2] = UTF8ToString(t2, r2);
                }
                const l = new Array(a), u = new Array(a), d = new Array(a), c = new Array(a), m = new Array(a);
                for (let e2 = 0; e2 < a; e2++) {
                  const t2 = C._ts_query_predicates_for_pattern(_, e2, TRANSFER_BUFFER), r2 = getValue(TRANSFER_BUFFER, "i32");
                  c[e2] = [], m[e2] = [];
                  const n2 = [];
                  let s2 = t2;
                  for (let t3 = 0; t3 < r2; t3++) {
                    const t4 = getValue(s2, "i32");
                    s2 += SIZE_OF_INT;
                    const r3 = getValue(s2, "i32");
                    if (s2 += SIZE_OF_INT, t4 === PREDICATE_STEP_TYPE_CAPTURE) n2.push({ type: "capture", name: o[r3] });
                    else if (t4 === PREDICATE_STEP_TYPE_STRING) n2.push({ type: "string", value: i[r3] });
                    else if (n2.length > 0) {
                      if ("string" !== n2[0].type) throw new Error("Predicates must begin with a literal value");
                      const t5 = n2[0].value;
                      let r4 = true;
                      switch (t5) {
                        case "not-eq?":
                          r4 = false;
                        case "eq?":
                          if (3 !== n2.length) throw new Error("Wrong number of arguments to `#eq?` predicate. Expected 2, got " + (n2.length - 1));
                          if ("capture" !== n2[1].type) throw new Error(`First argument of \`#eq?\` predicate must be a capture. Got "${n2[1].value}"`);
                          if ("capture" === n2[2].type) {
                            const t6 = n2[1].name, _3 = n2[2].name;
                            m[e2].push((function(e3) {
                              let n3, s4;
                              for (const r5 of e3) r5.name === t6 && (n3 = r5.node), r5.name === _3 && (s4 = r5.node);
                              return void 0 === n3 || void 0 === s4 || n3.text === s4.text === r4;
                            }));
                          } else {
                            const t6 = n2[1].name, _3 = n2[2].value;
                            m[e2].push((function(e3) {
                              for (const n3 of e3) if (n3.name === t6) return n3.node.text === _3 === r4;
                              return true;
                            }));
                          }
                          break;
                        case "not-match?":
                          r4 = false;
                        case "match?":
                          if (3 !== n2.length) throw new Error(`Wrong number of arguments to \`#match?\` predicate. Expected 2, got ${n2.length - 1}.`);
                          if ("capture" !== n2[1].type) throw new Error(`First argument of \`#match?\` predicate must be a capture. Got "${n2[1].value}".`);
                          if ("string" !== n2[2].type) throw new Error(`Second argument of \`#match?\` predicate must be a string. Got @${n2[2].value}.`);
                          const _2 = n2[1].name, s3 = new RegExp(n2[2].value);
                          m[e2].push((function(e3) {
                            for (const t6 of e3) if (t6.name === _2) return s3.test(t6.node.text) === r4;
                            return true;
                          }));
                          break;
                        case "set!":
                          if (n2.length < 2 || n2.length > 3) throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${n2.length - 1}.`);
                          if (n2.some(((e3) => "string" !== e3.type))) throw new Error('Arguments to `#set!` predicate must be a strings.".');
                          l[e2] || (l[e2] = {}), l[e2][n2[1].value] = n2[2] ? n2[2].value : null;
                          break;
                        case "is?":
                        case "is-not?":
                          if (n2.length < 2 || n2.length > 3) throw new Error(`Wrong number of arguments to \`#${t5}\` predicate. Expected 1 or 2. Got ${n2.length - 1}.`);
                          if (n2.some(((e3) => "string" !== e3.type))) throw new Error(`Arguments to \`#${t5}\` predicate must be a strings.".`);
                          const a2 = "is?" === t5 ? u : d;
                          a2[e2] || (a2[e2] = {}), a2[e2][n2[1].value] = n2[2] ? n2[2].value : null;
                          break;
                        default:
                          c[e2].push({ operator: t5, operands: n2.slice(1) });
                      }
                      n2.length = 0;
                    }
                  }
                  Object.freeze(l[e2]), Object.freeze(u[e2]), Object.freeze(d[e2]);
                }
                return C._free(r), new Query(INTERNAL, _, o, m, c, Object.freeze(l), Object.freeze(u), Object.freeze(d));
              }
              static load(e) {
                let t;
                if (e instanceof Uint8Array) t = Promise.resolve(e);
                else {
                  const r2 = e;
                  if ("undefined" != typeof process && process.versions && process.versions.node) {
                    const e2 = __require("fs");
                    t = Promise.resolve(e2.readFileSync(r2));
                  } else t = fetch(r2).then(((e2) => e2.arrayBuffer().then(((t2) => {
                    if (e2.ok) return new Uint8Array(t2);
                    {
                      const r3 = new TextDecoder("utf-8").decode(t2);
                      throw new Error(`Language.load failed with status ${e2.status}.

${r3}`);
                    }
                  }))));
                }
                const r = "function" == typeof loadSideModule ? loadSideModule : loadWebAssemblyModule;
                return t.then(((e2) => r(e2, { loadAsync: true }))).then(((e2) => {
                  const t2 = Object.keys(e2), r2 = t2.find(((e3) => LANGUAGE_FUNCTION_REGEX.test(e3) && !e3.includes("external_scanner_")));
                  r2 || console.log(`Couldn't find language function in WASM file. Symbols:
${JSON.stringify(t2, null, 2)}`);
                  const _ = e2[r2]();
                  return new Language(INTERNAL, _);
                }));
              }
            }
            class Query {
              constructor(e, t, r, _, n, s, a, o) {
                assertInternal(e), this[0] = t, this.captureNames = r, this.textPredicates = _, this.predicates = n, this.setProperties = s, this.assertedProperties = a, this.refutedProperties = o, this.exceededMatchLimit = false;
              }
              delete() {
                C._ts_query_delete(this[0]), this[0] = 0;
              }
              matches(e, t, r, _) {
                t || (t = ZERO_POINT), r || (r = ZERO_POINT), _ || (_ = {});
                let n = _.matchLimit;
                if (void 0 === n) n = 0;
                else if ("number" != typeof n) throw new Error("Arguments must be numbers");
                marshalNode(e), C._ts_query_matches_wasm(this[0], e.tree[0], t.row, t.column, r.row, r.column, n);
                const s = getValue(TRANSFER_BUFFER, "i32"), a = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32"), o = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32"), i = new Array(s);
                this.exceededMatchLimit = !!o;
                let l = 0, u = a;
                for (let t2 = 0; t2 < s; t2++) {
                  const r2 = getValue(u, "i32");
                  u += SIZE_OF_INT;
                  const _2 = getValue(u, "i32");
                  u += SIZE_OF_INT;
                  const n2 = new Array(_2);
                  if (u = unmarshalCaptures(this, e.tree, u, n2), this.textPredicates[r2].every(((e2) => e2(n2)))) {
                    i[l++] = { pattern: r2, captures: n2 };
                    const e2 = this.setProperties[r2];
                    e2 && (i[t2].setProperties = e2);
                    const _3 = this.assertedProperties[r2];
                    _3 && (i[t2].assertedProperties = _3);
                    const s2 = this.refutedProperties[r2];
                    s2 && (i[t2].refutedProperties = s2);
                  }
                }
                return i.length = l, C._free(a), i;
              }
              captures(e, t, r, _) {
                t || (t = ZERO_POINT), r || (r = ZERO_POINT), _ || (_ = {});
                let n = _.matchLimit;
                if (void 0 === n) n = 0;
                else if ("number" != typeof n) throw new Error("Arguments must be numbers");
                marshalNode(e), C._ts_query_captures_wasm(this[0], e.tree[0], t.row, t.column, r.row, r.column, n);
                const s = getValue(TRANSFER_BUFFER, "i32"), a = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32"), o = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32"), i = [];
                this.exceededMatchLimit = !!o;
                const l = [];
                let u = a;
                for (let t2 = 0; t2 < s; t2++) {
                  const t3 = getValue(u, "i32");
                  u += SIZE_OF_INT;
                  const r2 = getValue(u, "i32");
                  u += SIZE_OF_INT;
                  const _2 = getValue(u, "i32");
                  if (u += SIZE_OF_INT, l.length = r2, u = unmarshalCaptures(this, e.tree, u, l), this.textPredicates[t3].every(((e2) => e2(l)))) {
                    const e2 = l[_2], r3 = this.setProperties[t3];
                    r3 && (e2.setProperties = r3);
                    const n2 = this.assertedProperties[t3];
                    n2 && (e2.assertedProperties = n2);
                    const s2 = this.refutedProperties[t3];
                    s2 && (e2.refutedProperties = s2), i.push(e2);
                  }
                }
                return C._free(a), i;
              }
              predicatesForPattern(e) {
                return this.predicates[e];
              }
              didExceedMatchLimit() {
                return this.exceededMatchLimit;
              }
            }
            function getText(e, t, r) {
              const _ = r - t;
              let n = e.textCallback(t, null, r);
              for (t += n.length; t < r; ) {
                const _2 = e.textCallback(t, null, r);
                if (!(_2 && _2.length > 0)) break;
                t += _2.length, n += _2;
              }
              return t > r && (n = n.slice(0, _)), n;
            }
            function unmarshalCaptures(e, t, r, _) {
              for (let n = 0, s = _.length; n < s; n++) {
                const s2 = getValue(r, "i32"), a = unmarshalNode(t, r += SIZE_OF_INT);
                r += SIZE_OF_NODE, _[n] = { name: e.captureNames[s2], node: a };
              }
              return r;
            }
            function assertInternal(e) {
              if (e !== INTERNAL) throw new Error("Illegal constructor");
            }
            function isPoint(e) {
              return e && "number" == typeof e.row && "number" == typeof e.column;
            }
            function marshalNode(e) {
              let t = TRANSFER_BUFFER;
              setValue(t, e.id, "i32"), t += SIZE_OF_INT, setValue(t, e.startIndex, "i32"), t += SIZE_OF_INT, setValue(t, e.startPosition.row, "i32"), t += SIZE_OF_INT, setValue(t, e.startPosition.column, "i32"), t += SIZE_OF_INT, setValue(t, e[0], "i32");
            }
            function unmarshalNode(e, t = TRANSFER_BUFFER) {
              const r = getValue(t, "i32");
              if (0 === r) return null;
              const _ = getValue(t += SIZE_OF_INT, "i32"), n = getValue(t += SIZE_OF_INT, "i32"), s = getValue(t += SIZE_OF_INT, "i32"), a = getValue(t += SIZE_OF_INT, "i32"), o = new Node(INTERNAL, e);
              return o.id = r, o.startIndex = _, o.startPosition = { row: n, column: s }, o[0] = a, o;
            }
            function marshalTreeCursor(e, t = TRANSFER_BUFFER) {
              setValue(t + 0 * SIZE_OF_INT, e[0], "i32"), setValue(t + 1 * SIZE_OF_INT, e[1], "i32"), setValue(t + 2 * SIZE_OF_INT, e[2], "i32");
            }
            function unmarshalTreeCursor(e) {
              e[0] = getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32"), e[1] = getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32"), e[2] = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
            }
            function marshalPoint(e, t) {
              setValue(e, t.row, "i32"), setValue(e + SIZE_OF_INT, t.column, "i32");
            }
            function unmarshalPoint(e) {
              return { row: getValue(e, "i32"), column: getValue(e + SIZE_OF_INT, "i32") };
            }
            function marshalRange(e, t) {
              marshalPoint(e, t.startPosition), marshalPoint(e += SIZE_OF_POINT, t.endPosition), setValue(e += SIZE_OF_POINT, t.startIndex, "i32"), setValue(e += SIZE_OF_INT, t.endIndex, "i32"), e += SIZE_OF_INT;
            }
            function unmarshalRange(e) {
              const t = {};
              return t.startPosition = unmarshalPoint(e), e += SIZE_OF_POINT, t.endPosition = unmarshalPoint(e), e += SIZE_OF_POINT, t.startIndex = getValue(e, "i32"), e += SIZE_OF_INT, t.endIndex = getValue(e, "i32"), t;
            }
            function marshalEdit(e) {
              let t = TRANSFER_BUFFER;
              marshalPoint(t, e.startPosition), t += SIZE_OF_POINT, marshalPoint(t, e.oldEndPosition), t += SIZE_OF_POINT, marshalPoint(t, e.newEndPosition), t += SIZE_OF_POINT, setValue(t, e.startIndex, "i32"), t += SIZE_OF_INT, setValue(t, e.oldEndIndex, "i32"), t += SIZE_OF_INT, setValue(t, e.newEndIndex, "i32"), t += SIZE_OF_INT;
            }
            for (const e of Object.getOwnPropertyNames(ParserImpl.prototype)) Object.defineProperty(Parser.prototype, e, { value: ParserImpl.prototype[e], enumerable: false, writable: false });
            Parser.Language = Language, Module.onRuntimeInitialized = () => {
              ParserImpl.init(), resolveInitPromise();
            };
          })));
        }
      }
      return Parser;
    })();
    "object" == typeof exports && (module.exports = TreeSitter);
  }
});

// src/cli.ts
import { writeFileSync as writeFileSync4 } from "node:fs";
import { resolve } from "node:path";

// src/config.ts
var import_yaml = __toESM(require_dist(), 1);
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

// node_modules/balanced-match/dist/esm/index.js
var balanced = (a, b, str2) => {
  const ma = a instanceof RegExp ? maybeMatch(a, str2) : a;
  const mb = b instanceof RegExp ? maybeMatch(b, str2) : b;
  const r = ma !== null && mb != null && range(ma, mb, str2);
  return r && {
    start: r[0],
    end: r[1],
    pre: str2.slice(0, r[0]),
    body: str2.slice(r[0] + ma.length, r[1]),
    post: str2.slice(r[1] + mb.length)
  };
};
var maybeMatch = (reg, str2) => {
  const m = str2.match(reg);
  return m ? m[0] : null;
};
var range = (a, b, str2) => {
  let begs, beg, left, right = void 0, result;
  let ai = str2.indexOf(a);
  let bi = str2.indexOf(b, ai + 1);
  let i = ai;
  if (ai >= 0 && bi > 0) {
    if (a === b) {
      return [ai, bi];
    }
    begs = [];
    left = str2.length;
    while (i >= 0 && !result) {
      if (i === ai) {
        begs.push(i);
        ai = str2.indexOf(a, i + 1);
      } else if (begs.length === 1) {
        const r = begs.pop();
        if (r !== void 0)
          result = [r, bi];
      } else {
        beg = begs.pop();
        if (beg !== void 0 && beg < left) {
          left = beg;
          right = bi;
        }
        bi = str2.indexOf(b, i + 1);
      }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length && right !== void 0) {
      result = [left, right];
    }
  }
  return result;
};

// node_modules/brace-expansion/dist/esm/index.js
var escSlash = "\0SLASH" + Math.random() + "\0";
var escOpen = "\0OPEN" + Math.random() + "\0";
var escClose = "\0CLOSE" + Math.random() + "\0";
var escComma = "\0COMMA" + Math.random() + "\0";
var escPeriod = "\0PERIOD" + Math.random() + "\0";
var escSlashPattern = new RegExp(escSlash, "g");
var escOpenPattern = new RegExp(escOpen, "g");
var escClosePattern = new RegExp(escClose, "g");
var escCommaPattern = new RegExp(escComma, "g");
var escPeriodPattern = new RegExp(escPeriod, "g");
var slashPattern = /\\\\/g;
var openPattern = /\\{/g;
var closePattern = /\\}/g;
var commaPattern = /\\,/g;
var periodPattern = /\\\./g;
var EXPANSION_MAX = 1e5;
var EXPANSION_MAX_LENGTH = 4e6;
var EXPANSION_MAX_DEPTH = 1e3;
var EXPANSION_MAX_REWRITES = 1e3;
function numeric(str2) {
  return !isNaN(str2) ? parseInt(str2, 10) : str2.charCodeAt(0);
}
function escapeBraces(str2) {
  return str2.replace(slashPattern, escSlash).replace(openPattern, escOpen).replace(closePattern, escClose).replace(commaPattern, escComma).replace(periodPattern, escPeriod);
}
function unescapeBraces(str2) {
  return str2.replace(escSlashPattern, "\\").replace(escOpenPattern, "{").replace(escClosePattern, "}").replace(escCommaPattern, ",").replace(escPeriodPattern, ".");
}
function pushAll(target, items) {
  for (let i = 0; i < items.length; i++) {
    target.push(items[i]);
  }
}
function parseCommaParts(str2) {
  const parts = [];
  let carry = "";
  for (; ; ) {
    const m = balanced("{", "}", str2);
    if (!m) {
      const tail = str2.split(",");
      tail[0] = carry + tail[0];
      pushAll(parts, tail);
      return parts;
    }
    const { pre, body: body2, post } = m;
    const p = pre.split(",");
    p[0] = carry + p[0];
    p[p.length - 1] += "{" + body2 + "}";
    if (!post.length) {
      pushAll(parts, p);
      return parts;
    }
    carry = p.pop();
    pushAll(parts, p);
    str2 = post;
  }
}
function expand(str2, options = {}) {
  if (!str2) {
    return [];
  }
  const { max = EXPANSION_MAX, maxLength = EXPANSION_MAX_LENGTH, maxDepth = EXPANSION_MAX_DEPTH, maxRewrites = EXPANSION_MAX_REWRITES } = options;
  if (str2.slice(0, 2) === "{}") {
    str2 = "\\{\\}" + str2.slice(2);
  }
  return expand_(escapeBraces(str2), max, maxLength, maxDepth, 0, maxRewrites, true).map(unescapeBraces);
}
function embrace(str2) {
  return "{" + str2 + "}";
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}
function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}
function combine(acc, pre, values, max, maxLength, dropEmpties) {
  const out2 = [];
  let length = 0;
  for (let a = 0; a < acc.length; a++) {
    for (let v = 0; v < values.length; v++) {
      if (out2.length >= max)
        return out2;
      const expansion = acc[a] + pre + values[v];
      if (dropEmpties && !expansion)
        continue;
      if (length + expansion.length > maxLength)
        return out2;
      out2.push(expansion);
      length += expansion.length;
    }
  }
  return out2;
}
function expandSequence(body2, isAlphaSequence, max, maxLength) {
  const n = body2.split(/\.\./);
  const N = [];
  if (n[0] === void 0 || n[1] === void 0) {
    return N;
  }
  const x = numeric(n[0]);
  const y = numeric(n[1]);
  const width = Math.max(n[0].length, n[1].length);
  let incr = n.length === 3 && n[2] !== void 0 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
  let test = lte;
  const reverse = y < x;
  if (reverse) {
    incr *= -1;
    test = gte;
  }
  const pad = n.some(isPadded);
  let length = 0;
  for (let i = x; test(i, y) && N.length < max; i += incr) {
    let c;
    if (isAlphaSequence) {
      c = String.fromCharCode(i);
      if (c === "\\") {
        c = "";
      }
    } else {
      c = String(i);
      if (pad) {
        const need = width - c.length;
        if (need > 0) {
          const z = new Array(need + 1).join("0");
          if (i < 0) {
            c = "-" + z + c.slice(1);
          } else {
            c = z + c;
          }
        }
      }
    }
    if (length + c.length > maxLength)
      break;
    N.push(c);
    length += c.length;
  }
  return N;
}
function expand_(str2, max, maxLength, maxDepth, depth, maxRewrites, isTop) {
  if (depth > maxDepth) {
    return [str2];
  }
  let acc = [""];
  let rewrites = 0;
  let dropEmpties = false;
  let firstGroup = true;
  for (; ; ) {
    const m = balanced("{", "}", str2);
    if (!m) {
      return combine(acc, str2, [""], max, maxLength, dropEmpties);
    }
    const pre = m.pre;
    if (/\$$/.test(pre)) {
      acc = combine(acc, pre + "{" + m.body + "}", [""], max, maxLength, dropEmpties && !m.post.length);
      firstGroup = false;
      if (!m.post.length)
        break;
      str2 = m.post;
      continue;
    }
    const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    const isSequence = isNumericSequence || isAlphaSequence;
    const isOptions = m.body.indexOf(",") >= 0;
    if (!isSequence && !isOptions) {
      if (rewrites < maxRewrites && m.post.match(/,(?!,).*\}/)) {
        rewrites++;
        str2 = m.pre + "{" + m.body + escClose + m.post;
        isTop = true;
        continue;
      }
      return combine(acc, pre + "{" + m.body + "}" + m.post, [""], max, maxLength, dropEmpties);
    }
    if (firstGroup) {
      dropEmpties = isTop && !isSequence;
      firstGroup = false;
    }
    let values;
    if (isSequence) {
      values = expandSequence(m.body, isAlphaSequence, max, maxLength);
    } else {
      let n = parseCommaParts(m.body);
      if (n.length === 1 && n[0] !== void 0) {
        n = expand_(n[0], max, maxLength, maxDepth, depth + 1, maxRewrites, false).map(embrace);
        if (n.length === 1) {
          acc = combine(acc, pre + n[0], [""], max, maxLength, dropEmpties && !m.post.length);
          if (!m.post.length)
            break;
          str2 = m.post;
          continue;
        }
      }
      let dropsEmpties = dropEmpties && !m.post.length && !pre;
      for (let d = 0; dropsEmpties && d < acc.length; d++) {
        if (acc[d]) {
          dropsEmpties = false;
        }
      }
      values = [];
      let valuesLength = 0;
      outer: for (let j = 0; j < n.length; j++) {
        const expanded = expand_(n[j], max, maxLength, maxDepth, depth + 1, maxRewrites, false);
        for (let k = 0; k < expanded.length; k++) {
          const v = expanded[k];
          if (dropsEmpties && !v)
            continue;
          if (values.length >= max || valuesLength + v.length > maxLength) {
            break outer;
          }
          values.push(v);
          valuesLength += v.length;
        }
      }
    }
    acc = combine(acc, pre, values, max, maxLength, dropEmpties && !m.post.length);
    if (!m.post.length)
      break;
    str2 = m.post;
  }
  return acc;
}

// node_modules/minimatch/dist/esm/assert-valid-pattern.js
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = (pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
};

// node_modules/minimatch/dist/esm/brace-expressions.js
var posixClasses = {
  "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
  "[:alpha:]": ["\\p{L}\\p{Nl}", true],
  "[:ascii:]": ["\\x00-\\x7f", false],
  "[:blank:]": ["\\p{Zs}\\t", true],
  "[:cntrl:]": ["\\p{Cc}", true],
  "[:digit:]": ["\\p{Nd}", true],
  "[:graph:]": ["\\p{Z}\\p{C}", true, true],
  "[:lower:]": ["\\p{Ll}", true],
  "[:print:]": ["\\p{C}", true],
  "[:punct:]": ["\\p{P}", true],
  "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
  "[:upper:]": ["\\p{Lu}", true],
  "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
  "[:xdigit:]": ["A-Fa-f0-9", false]
};
var braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
var regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var rangesToString = (ranges) => ranges.join("");
var parseClass = (glob, position) => {
  const pos = position;
  if (glob.charAt(pos) !== "[") {
    throw new Error("not in a brace expression");
  }
  const ranges = [];
  const negs = [];
  let i = pos + 1;
  let sawStart = false;
  let uflag = false;
  let escaping = false;
  let negate = false;
  let endPos = pos;
  let rangeStart = "";
  WHILE: while (i < glob.length) {
    const c = glob.charAt(i);
    if ((c === "!" || c === "^") && i === pos + 1) {
      negate = true;
      i++;
      continue;
    }
    if (c === "]" && sawStart && !escaping) {
      endPos = i + 1;
      break;
    }
    sawStart = true;
    if (c === "\\") {
      if (!escaping) {
        escaping = true;
        i++;
        continue;
      }
    }
    if (c === "[" && !escaping) {
      for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
        if (glob.startsWith(cls, i)) {
          if (rangeStart) {
            return ["$.", false, glob.length - pos, true];
          }
          i += cls.length;
          if (neg)
            negs.push(unip);
          else
            ranges.push(unip);
          uflag = uflag || u;
          continue WHILE;
        }
      }
    }
    escaping = false;
    if (rangeStart) {
      if (c > rangeStart) {
        ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
      } else if (c === rangeStart) {
        ranges.push(braceEscape(c));
      }
      rangeStart = "";
      i++;
      continue;
    }
    if (glob.startsWith("-]", i + 1)) {
      ranges.push(braceEscape(c + "-"));
      i += 2;
      continue;
    }
    if (glob.startsWith("-", i + 1)) {
      rangeStart = c;
      i += 2;
      continue;
    }
    ranges.push(braceEscape(c));
    i++;
  }
  if (endPos < i) {
    return ["", false, 0, false];
  }
  if (!ranges.length && !negs.length) {
    return ["$.", false, glob.length - pos, true];
  }
  if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
    const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
    return [regexpEscape(r), false, endPos - pos, false];
  }
  const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
  const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
  const comb = ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs;
  return [comb, uflag, endPos - pos, true];
};

// node_modules/minimatch/dist/esm/unescape.js
var unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/\[([^/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\])\]/g, "$1$2").replace(/\\([^/])/g, "$1");
  }
  return windowsPathsNoEscape ? s.replace(/\[([^/\\{}])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\{}])\]/g, "$1$2").replace(/\\([^/{}])/g, "$1");
};

// node_modules/minimatch/dist/esm/ast.js
var _a;
var types = /* @__PURE__ */ new Set(["!", "?", "+", "*", "@"]);
var isExtglobType = (c) => types.has(c);
var isExtglobAST = (c) => isExtglobType(c.type);
var adoptionMap = /* @__PURE__ */ new Map([
  ["!", ["@"]],
  ["?", ["?", "@"]],
  ["@", ["@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@"]]
]);
var adoptionWithSpaceMap = /* @__PURE__ */ new Map([
  ["!", ["?"]],
  ["@", ["?"]],
  ["+", ["?", "*"]]
]);
var adoptionAnyMap = /* @__PURE__ */ new Map([
  ["!", ["?", "@"]],
  ["?", ["?", "@"]],
  ["@", ["?", "@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@", "?", "*"]]
]);
var usurpMap = /* @__PURE__ */ new Map([
  ["!", /* @__PURE__ */ new Map([["!", "@"]])],
  [
    "?",
    /* @__PURE__ */ new Map([
      ["*", "*"],
      ["+", "*"]
    ])
  ],
  [
    "@",
    /* @__PURE__ */ new Map([
      ["!", "!"],
      ["?", "?"],
      ["@", "@"],
      ["*", "*"],
      ["+", "+"]
    ])
  ],
  [
    "+",
    /* @__PURE__ */ new Map([
      ["?", "*"],
      ["*", "*"]
    ])
  ]
]);
var startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
var startNoDot = "(?!\\.)";
var addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
var justDots = /* @__PURE__ */ new Set(["..", "."]);
var reSpecials = new Set("().*{}+?[]^$\\!");
var regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var qmark = "[^/]";
var star = qmark + "*?";
var starNoEmpty = qmark + "+?";
var ID = 0;
var AST = class {
  type;
  #root;
  #hasMagic;
  #uflag = false;
  #parts = [];
  #parent;
  #parentIndex;
  #negs;
  #filledNegs = false;
  #options;
  #toString;
  // set to true if it's an extglob with no children
  // (which really means one child of '')
  #emptyExt = false;
  id = ++ID;
  get depth() {
    return (this.#parent?.depth ?? -1) + 1;
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return {
      "@@type": "AST",
      id: this.id,
      type: this.type,
      root: this.#root.id,
      parent: this.#parent?.id,
      depth: this.depth,
      partsLength: this.#parts.length,
      parts: this.#parts
    };
  }
  constructor(type, parent, options = {}) {
    this.type = type;
    if (type)
      this.#hasMagic = true;
    this.#parent = parent;
    this.#root = this.#parent ? this.#parent.#root : this;
    this.#options = this.#root === this ? options : this.#root.#options;
    this.#negs = this.#root === this ? [] : this.#root.#negs;
    if (type === "!" && !this.#root.#filledNegs)
      this.#negs.push(this);
    this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
  }
  get hasMagic() {
    if (this.#hasMagic !== void 0)
      return this.#hasMagic;
    for (const p of this.#parts) {
      if (typeof p === "string")
        continue;
      if (p.type || p.hasMagic)
        return this.#hasMagic = true;
    }
    return this.#hasMagic;
  }
  // reconstructs the pattern
  toString() {
    return this.#toString !== void 0 ? this.#toString : !this.type ? this.#toString = this.#parts.map((p) => String(p)).join("") : this.#toString = this.type + "(" + this.#parts.map((p) => String(p)).join("|") + ")";
  }
  #fillNegs() {
    if (this !== this.#root)
      throw new Error("should only call on root");
    if (this.#filledNegs)
      return this;
    this.toString();
    this.#filledNegs = true;
    let n;
    while (n = this.#negs.pop()) {
      if (n.type !== "!")
        continue;
      let p = n;
      let pp = p.#parent;
      while (pp) {
        for (let i = p.#parentIndex + 1; !pp.type && i < pp.#parts.length; i++) {
          for (const part of n.#parts) {
            if (typeof part === "string") {
              throw new Error("string part in extglob AST??");
            }
            part.copyIn(pp.#parts[i]);
          }
        }
        p = pp;
        pp = p.#parent;
      }
    }
    return this;
  }
  push(...parts) {
    for (const p of parts) {
      if (p === "")
        continue;
      if (typeof p !== "string" && !(p instanceof _a && p.#parent === this)) {
        throw new Error("invalid part: " + p);
      }
      this.#parts.push(p);
    }
  }
  toJSON() {
    const ret = this.type === null ? this.#parts.slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...this.#parts.map((p) => p.toJSON())];
    if (this.isStart() && !this.type)
      ret.unshift([]);
    if (this.isEnd() && (this === this.#root || this.#root.#filledNegs && this.#parent?.type === "!")) {
      ret.push({});
    }
    return ret;
  }
  isStart() {
    if (this.#root === this)
      return true;
    if (!this.#parent?.isStart())
      return false;
    if (this.#parentIndex === 0)
      return true;
    const p = this.#parent;
    for (let i = 0; i < this.#parentIndex; i++) {
      const pp = p.#parts[i];
      if (!(pp instanceof _a && pp.type === "!")) {
        return false;
      }
    }
    return true;
  }
  isEnd() {
    if (this.#root === this)
      return true;
    if (this.#parent?.type === "!")
      return true;
    if (!this.#parent?.isEnd())
      return false;
    if (!this.type)
      return this.#parent?.isEnd();
    const pl = this.#parent ? this.#parent.#parts.length : 0;
    return this.#parentIndex === pl - 1;
  }
  copyIn(part) {
    if (typeof part === "string")
      this.push(part);
    else
      this.push(part.clone(this));
  }
  clone(parent) {
    const c = new _a(this.type, parent);
    for (const p of this.#parts) {
      c.copyIn(p);
    }
    return c;
  }
  static #parseAST(str2, ast, pos, opt, extDepth) {
    const maxDepth = opt.maxExtglobRecursion ?? 2;
    let escaping = false;
    let inBrace = false;
    let braceStart = -1;
    let braceNeg = false;
    if (ast.type === null) {
      let i2 = pos;
      let acc2 = "";
      while (i2 < str2.length) {
        const c = str2.charAt(i2++);
        if (escaping || c === "\\") {
          escaping = !escaping;
          acc2 += c;
          continue;
        }
        if (inBrace) {
          if (i2 === braceStart + 1) {
            if (c === "^" || c === "!") {
              braceNeg = true;
            }
          } else if (c === "]" && !(i2 === braceStart + 2 && braceNeg)) {
            inBrace = false;
          }
          acc2 += c;
          continue;
        } else if (c === "[") {
          inBrace = true;
          braceStart = i2;
          braceNeg = false;
          acc2 += c;
          continue;
        }
        const doRecurse = !opt.noext && isExtglobType(c) && str2.charAt(i2) === "(" && extDepth <= maxDepth;
        if (doRecurse) {
          ast.push(acc2);
          acc2 = "";
          const ext2 = new _a(c, ast);
          i2 = _a.#parseAST(str2, ext2, i2, opt, extDepth + 1);
          ast.push(ext2);
          continue;
        }
        acc2 += c;
      }
      ast.push(acc2);
      return i2;
    }
    let i = pos + 1;
    let part = new _a(null, ast);
    const parts = [];
    let acc = "";
    while (i < str2.length) {
      const c = str2.charAt(i++);
      if (escaping || c === "\\") {
        escaping = !escaping;
        acc += c;
        continue;
      }
      if (inBrace) {
        if (i === braceStart + 1) {
          if (c === "^" || c === "!") {
            braceNeg = true;
          }
        } else if (c === "]" && !(i === braceStart + 2 && braceNeg)) {
          inBrace = false;
        }
        acc += c;
        continue;
      } else if (c === "[") {
        inBrace = true;
        braceStart = i;
        braceNeg = false;
        acc += c;
        continue;
      }
      const doRecurse = !opt.noext && isExtglobType(c) && str2.charAt(i) === "(" && /* c8 ignore start - the maxDepth is sufficient here */
      (extDepth <= maxDepth || ast && ast.#canAdoptType(c));
      if (doRecurse) {
        const depthAdd = ast && ast.#canAdoptType(c) ? 0 : 1;
        part.push(acc);
        acc = "";
        const ext2 = new _a(c, part);
        part.push(ext2);
        i = _a.#parseAST(str2, ext2, i, opt, extDepth + depthAdd);
        continue;
      }
      if (c === "|") {
        part.push(acc);
        acc = "";
        parts.push(part);
        part = new _a(null, ast);
        continue;
      }
      if (c === ")") {
        if (acc === "" && ast.#parts.length === 0) {
          ast.#emptyExt = true;
        }
        part.push(acc);
        acc = "";
        ast.push(...parts, part);
        return i;
      }
      acc += c;
    }
    ast.type = null;
    ast.#hasMagic = void 0;
    ast.#parts = [str2.substring(pos - 1)];
    return i;
  }
  #canAdoptWithSpace(child) {
    return this.#canAdopt(child, adoptionWithSpaceMap);
  }
  #canAdopt(child, map = adoptionMap) {
    if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null) {
      return false;
    }
    const gc = child.#parts[0];
    if (!gc || typeof gc !== "object" || gc.type === null) {
      return false;
    }
    return this.#canAdoptType(gc.type, map);
  }
  #canAdoptType(c, map = adoptionAnyMap) {
    return !!map.get(this.type)?.includes(c);
  }
  #adoptWithSpace(child, index) {
    const gc = child.#parts[0];
    const blank = new _a(null, gc, this.options);
    blank.#parts.push("");
    gc.push(blank);
    this.#adopt(child, index);
  }
  #adopt(child, index) {
    const gc = child.#parts[0];
    this.#parts.splice(index, 1, ...gc.#parts);
    for (const p of gc.#parts) {
      if (typeof p === "object")
        p.#parent = this;
    }
    this.#toString = void 0;
  }
  #canUsurpType(c) {
    const m = usurpMap.get(this.type);
    return !!m?.has(c);
  }
  #canUsurp(child) {
    if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null || this.#parts.length !== 1) {
      return false;
    }
    const gc = child.#parts[0];
    if (!gc || typeof gc !== "object" || gc.type === null) {
      return false;
    }
    return this.#canUsurpType(gc.type);
  }
  #usurp(child) {
    const m = usurpMap.get(this.type);
    const gc = child.#parts[0];
    const nt = m?.get(gc.type);
    if (!nt)
      return false;
    this.#parts = gc.#parts;
    for (const p of this.#parts) {
      if (typeof p === "object") {
        p.#parent = this;
      }
    }
    this.type = nt;
    this.#toString = void 0;
    this.#emptyExt = false;
  }
  static fromGlob(pattern, options = {}) {
    const ast = new _a(null, void 0, options);
    _a.#parseAST(pattern, ast, 0, options, 0);
    return ast;
  }
  // returns the regular expression if there's magic, or the unescaped
  // string if not.
  toMMPattern() {
    if (this !== this.#root)
      return this.#root.toMMPattern();
    const glob = this.toString();
    const [re, body2, hasMagic, uflag] = this.toRegExpSource();
    const anyMagic = hasMagic || this.#hasMagic || this.#options.nocase && !this.#options.nocaseMagicOnly && glob.toUpperCase() !== glob.toLowerCase();
    if (!anyMagic) {
      return body2;
    }
    const flags2 = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
    return Object.assign(new RegExp(`^${re}$`, flags2), {
      _src: re,
      _glob: glob
    });
  }
  get options() {
    return this.#options;
  }
  // returns the string match, the regexp source, whether there's magic
  // in the regexp (so a regular expression is required) and whether or
  // not the uflag is needed for the regular expression (for posix classes)
  // TODO: instead of injecting the start/end at this point, just return
  // the BODY of the regexp, along with the start/end portions suitable
  // for binding the start/end in either a joined full-path makeRe context
  // (where we bind to (^|/), or a standalone matchPart context (where
  // we bind to ^, and not /).  Otherwise slashes get duped!
  //
  // In part-matching mode, the start is:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: ^(?!\.\.?$)
  // - if dots allowed or not possible: ^
  // - if dots possible and not allowed: ^(?!\.)
  // end is:
  // - if not isEnd(): nothing
  // - else: $
  //
  // In full-path matching mode, we put the slash at the START of the
  // pattern, so start is:
  // - if first pattern: same as part-matching mode
  // - if not isStart(): nothing
  // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
  // - if dots allowed or not possible: /
  // - if dots possible and not allowed: /(?!\.)
  // end is:
  // - if last pattern, same as part-matching mode
  // - else nothing
  //
  // Always put the (?:$|/) on negated tails, though, because that has to be
  // there to bind the end of the negated pattern portion, and it's easier to
  // just stick it in now rather than try to inject it later in the middle of
  // the pattern.
  //
  // We can just always return the same end, and leave it up to the caller
  // to know whether it's going to be used joined or in parts.
  // And, if the start is adjusted slightly, can do the same there:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
  // - if dots allowed or not possible: (?:/|^)
  // - if dots possible and not allowed: (?:/|^)(?!\.)
  //
  // But it's better to have a simpler binding without a conditional, for
  // performance, so probably better to return both start options.
  //
  // Then the caller just ignores the end if it's not the first pattern,
  // and the start always gets applied.
  //
  // But that's always going to be $ if it's the ending pattern, or nothing,
  // so the caller can just attach $ at the end of the pattern when building.
  //
  // So the todo is:
  // - better detect what kind of start is needed
  // - return both flavors of starting pattern
  // - attach $ at the end of the pattern when creating the actual RegExp
  //
  // Ah, but wait, no, that all only applies to the root when the first pattern
  // is not an extglob. If the first pattern IS an extglob, then we need all
  // that dot prevention biz to live in the extglob portions, because eg
  // +(*|.x*) can match .xy but not .yx.
  //
  // So, return the two flavors if it's #root and the first child is not an
  // AST, otherwise leave it to the child AST to handle it, and there,
  // use the (?:^|/) style of start binding.
  //
  // Even simplified further:
  // - Since the start for a join is eg /(?!\.) and the start for a part
  // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
  // or start or whatever) and prepend ^ or / at the Regexp construction.
  toRegExpSource(allowDot) {
    const dot = allowDot ?? !!this.#options.dot;
    if (this.#root === this) {
      this.#flatten();
      this.#fillNegs();
    }
    if (!isExtglobAST(this)) {
      const noEmpty = this.isStart() && this.isEnd() && !this.#parts.some((s) => typeof s !== "string");
      const src = this.#parts.map((p) => {
        const [re, _, hasMagic, uflag] = typeof p === "string" ? _a.#parseGlob(p, this.#hasMagic, noEmpty) : p.toRegExpSource(allowDot);
        this.#hasMagic = this.#hasMagic || hasMagic;
        this.#uflag = this.#uflag || uflag;
        return re;
      }).join("");
      let start3 = "";
      if (this.isStart()) {
        if (typeof this.#parts[0] === "string") {
          const dotTravAllowed = this.#parts.length === 1 && justDots.has(this.#parts[0]);
          if (!dotTravAllowed) {
            const aps = addPatternStart;
            const needNoTrav = (
              // dots are allowed, and the pattern starts with [ or .
              dot && aps.has(src.charAt(0)) || // the pattern starts with \., and then [ or .
              src.startsWith("\\.") && aps.has(src.charAt(2)) || // the pattern starts with \.\., and then [ or .
              src.startsWith("\\.\\.") && aps.has(src.charAt(4))
            );
            const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
            start3 = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
          }
        }
      }
      let end = "";
      if (this.isEnd() && this.#root.#filledNegs && this.#parent?.type === "!") {
        end = "(?:$|\\/)";
      }
      const final2 = start3 + src + end;
      return [
        final2,
        unescape(src),
        this.#hasMagic = !!this.#hasMagic,
        this.#uflag
      ];
    }
    const repeated = this.type === "*" || this.type === "+";
    const start2 = this.type === "!" ? "(?:(?!(?:" : "(?:";
    let body2 = this.#partsToRegExp(dot);
    if (this.isStart() && this.isEnd() && !body2 && this.type !== "!") {
      const s = this.toString();
      const me = this;
      me.#parts = [s];
      me.type = null;
      me.#hasMagic = void 0;
      return [s, unescape(this.toString()), false, false];
    }
    let bodyDotAllowed = !repeated || allowDot || dot || !startNoDot ? "" : this.#partsToRegExp(true);
    if (bodyDotAllowed === body2) {
      bodyDotAllowed = "";
    }
    if (bodyDotAllowed) {
      body2 = `(?:${body2})(?:${bodyDotAllowed})*?`;
    }
    let final = "";
    if (this.type === "!" && this.#emptyExt) {
      final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
    } else {
      const close = this.type === "!" ? (
        // !() must match something,but !(x) can match ''
        "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + star + ")"
      ) : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
      final = start2 + body2 + close;
    }
    return [
      final,
      unescape(body2),
      this.#hasMagic = !!this.#hasMagic,
      this.#uflag
    ];
  }
  #flatten() {
    if (!isExtglobAST(this)) {
      for (const p of this.#parts) {
        if (typeof p === "object") {
          p.#flatten();
        }
      }
    } else {
      let iterations = 0;
      let done = false;
      do {
        done = true;
        for (let i = 0; i < this.#parts.length; i++) {
          const c = this.#parts[i];
          if (typeof c === "object") {
            c.#flatten();
            if (this.#canAdopt(c)) {
              done = false;
              this.#adopt(c, i);
            } else if (this.#canAdoptWithSpace(c)) {
              done = false;
              this.#adoptWithSpace(c, i);
            } else if (this.#canUsurp(c)) {
              done = false;
              this.#usurp(c);
            }
          }
        }
      } while (!done && ++iterations < 10);
    }
    this.#toString = void 0;
  }
  #partsToRegExp(dot) {
    return this.#parts.map((p) => {
      if (typeof p === "string") {
        throw new Error("string type in extglob ast??");
      }
      const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
      this.#uflag = this.#uflag || uflag;
      return re;
    }).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
  }
  static #parseGlob(glob, hasMagic, noEmpty = false) {
    let escaping = false;
    let re = "";
    let uflag = false;
    let inStar = false;
    for (let i = 0; i < glob.length; i++) {
      const c = glob.charAt(i);
      if (escaping) {
        escaping = false;
        re += (reSpecials.has(c) ? "\\" : "") + c;
        continue;
      }
      if (c === "*") {
        if (inStar)
          continue;
        inStar = true;
        re += noEmpty && /^[*]+$/.test(glob) ? starNoEmpty : star;
        hasMagic = true;
        continue;
      } else {
        inStar = false;
      }
      if (c === "\\") {
        if (i === glob.length - 1) {
          re += "\\\\";
        } else {
          escaping = true;
        }
        continue;
      }
      if (c === "[") {
        const [src, needUflag, consumed, magic] = parseClass(glob, i);
        if (consumed) {
          re += src;
          uflag = uflag || needUflag;
          i += consumed - 1;
          hasMagic = hasMagic || magic;
          continue;
        }
      }
      if (c === "?") {
        re += qmark;
        hasMagic = true;
        continue;
      }
      re += regExpEscape(c);
    }
    return [re, unescape(glob), !!hasMagic, uflag];
  }
};
_a = AST;

// node_modules/minimatch/dist/esm/escape.js
var escape = (s, { windowsPathsNoEscape = false, magicalBraces = false } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/[?*()[\]{}]/g, "[$&]") : s.replace(/[?*()[\]\\{}]/g, "\\$&");
  }
  return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
};

// node_modules/minimatch/dist/esm/index.js
var minimatch = (p, pattern, options = {}) => {
  assertValidPattern(pattern);
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch(pattern, options).match(p);
};
var starDotExtRE = /^\*+([^+@!?*[(]*)$/;
var starDotExtTest = (ext2) => (f) => !f.startsWith(".") && f.endsWith(ext2);
var starDotExtTestDot = (ext2) => (f) => f.endsWith(ext2);
var starDotExtTestNocase = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext2);
};
var starDotExtTestNocaseDot = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => f.toLowerCase().endsWith(ext2);
};
var starDotStarRE = /^\*+\.\*+$/;
var starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
var starDotStarTestDot = (f) => f !== "." && f !== ".." && f.includes(".");
var dotStarRE = /^\.\*+$/;
var dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
var starRE = /^\*+$/;
var starTest = (f) => f.length !== 0 && !f.startsWith(".");
var starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
var qmarksRE = /^\?+([^+@!?*[(]*)?$/;
var qmarksTestNocase = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestNocaseDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTest = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTestNoExt = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && !f.startsWith(".");
};
var qmarksTestNoExtDot = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && f !== "." && f !== "..";
};
var defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var path = {
  win32: { sep: "\\" },
  posix: { sep: "/" }
};
var sep = defaultPlatform === "win32" ? path.win32.sep : path.posix.sep;
minimatch.sep = sep;
var GLOBSTAR = /* @__PURE__ */ Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
var qmark2 = "[^/]";
var star2 = qmark2 + "*?";
var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
var filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
var ext = (a, b = {}) => Object.assign({}, a, b);
var defaults = (def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch;
  }
  const orig = minimatch;
  const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
  return Object.assign(m, {
    Minimatch: class Minimatch extends orig.Minimatch {
      constructor(pattern, options = {}) {
        super(pattern, ext(def, options));
      }
      static defaults(options) {
        return orig.defaults(ext(def, options)).Minimatch;
      }
    },
    AST: class AST extends orig.AST {
      /* c8 ignore start */
      constructor(type, parent, options = {}) {
        super(type, parent, ext(def, options));
      }
      /* c8 ignore stop */
      static fromGlob(pattern, options = {}) {
        return orig.AST.fromGlob(pattern, ext(def, options));
      }
    },
    unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
    escape: (s, options = {}) => orig.escape(s, ext(def, options)),
    filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
    defaults: (options) => orig.defaults(ext(def, options)),
    makeRe: (pattern, options = {}) => orig.makeRe(pattern, ext(def, options)),
    braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
    match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
    sep: orig.sep,
    GLOBSTAR
  });
};
minimatch.defaults = defaults;
var braceExpand = (pattern, options = {}) => {
  assertValidPattern(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return expand(pattern, { max: options.braceExpandMax });
};
minimatch.braceExpand = braceExpand;
var makeRe = (pattern, options = {}) => new Minimatch(pattern, options).makeRe();
minimatch.makeRe = makeRe;
var match = (list, pattern, options = {}) => {
  const mm = new Minimatch(pattern, options);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
minimatch.match = match;
var globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
var regExpEscape2 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var Minimatch = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  maxGlobstarRecursion;
  regexp;
  constructor(pattern, options = {}) {
    assertValidPattern(pattern);
    options = options || {};
    this.options = options;
    this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
    this.pattern = pattern;
    this.platform = options.platform || defaultPlatform;
    this.isWindows = this.platform === "win32";
    const awe = "allowWindowsEscape";
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options[awe] === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
    this.regexp = null;
    this.negate = false;
    this.nonegate = !!options.nonegate;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;
    this.nocase = !!this.options.nocase;
    this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
    this.globSet = [];
    this.globParts = [];
    this.set = [];
    this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) {
      return true;
    }
    for (const pattern of this.set) {
      for (const part of pattern) {
        if (typeof part !== "string")
          return true;
      }
    }
    return false;
  }
  debug(..._) {
  }
  make() {
    const pattern = this.pattern;
    const options = this.options;
    if (!options.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    this.globSet = [...new Set(this.braceExpand())];
    if (options.debug) {
      this.debug = (...args2) => console.error(...args2);
    }
    this.debug(this.pattern, this.globSet);
    const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
    this.globParts = this.preprocess(rawGlobParts);
    this.debug(this.pattern, this.globParts);
    let set = this.globParts.map((s, _, __) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
        const isDrive = /^[a-z]:/i.test(s[0]);
        if (isUNC) {
          return [
            ...s.slice(0, 4),
            ...s.slice(4).map((ss) => this.parse(ss))
          ];
        } else if (isDrive) {
          return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
        }
      }
      return s.map((ss) => this.parse(ss));
    });
    this.debug(this.pattern, set);
    this.set = set.filter((s) => s.indexOf(false) === -1);
    if (this.isWindows) {
      for (let i = 0; i < this.set.length; i++) {
        const p = this.set[i];
        if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) {
          p[2] = "?";
        }
      }
    }
    this.debug(this.pattern, this.set);
  }
  // various transforms to equivalent pattern sets that are
  // faster to process in a filesystem walk.  The goal is to
  // eliminate what we can, and push all ** patterns as far
  // to the right as possible, even if it increases the number
  // of patterns that we have to process.
  preprocess(globParts) {
    if (this.options.noglobstar) {
      for (const partset of globParts) {
        for (let j = 0; j < partset.length; j++) {
          if (partset[j] === "**") {
            partset[j] = "*";
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      globParts = this.firstPhasePreProcess(globParts);
      globParts = this.secondPhasePreProcess(globParts);
    } else if (optimizationLevel >= 1) {
      globParts = this.levelOneOptimize(globParts);
    } else {
      globParts = this.adjascentGlobstarOptimize(globParts);
    }
    return globParts;
  }
  // just get rid of adjascent ** portions
  adjascentGlobstarOptimize(globParts) {
    return globParts.map((parts) => {
      let gs = -1;
      while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
        let i = gs;
        while (parts[i + 1] === "**") {
          i++;
        }
        if (i !== gs) {
          parts.splice(gs, i - gs);
        }
      }
      return parts;
    });
  }
  // get rid of adjascent ** and resolve .. portions
  levelOneOptimize(globParts) {
    return globParts.map((parts) => {
      parts = parts.reduce((set, part) => {
        const prev = set[set.length - 1];
        if (part === "**" && prev === "**") {
          return set;
        }
        if (part === "..") {
          if (prev && prev !== ".." && prev !== "." && prev !== "**") {
            set.pop();
            return set;
          }
        }
        set.push(part);
        return set;
      }, []);
      return parts.length === 0 ? [""] : parts;
    });
  }
  levelTwoFileOptimize(parts) {
    if (!Array.isArray(parts)) {
      parts = this.slashSplit(parts);
    }
    let didSomething = false;
    do {
      didSomething = false;
      if (!this.preserveMultipleSlashes) {
        for (let i = 1; i < parts.length - 1; i++) {
          const p = parts[i];
          if (i === 1 && p === "" && parts[0] === "")
            continue;
          if (p === "." || p === "") {
            didSomething = true;
            parts.splice(i, 1);
            i--;
          }
        }
        if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
          didSomething = true;
          parts.pop();
        }
      }
      let dd = 0;
      while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
        const p = parts[dd - 1];
        if (p && p !== "." && p !== ".." && p !== "**" && !(this.isWindows && /^[a-z]:$/i.test(p))) {
          didSomething = true;
          parts.splice(dd - 1, 2);
          dd -= 2;
        }
      }
    } while (didSomething);
    return parts.length === 0 ? [""] : parts;
  }
  // First phase: single-pattern processing
  // <pre> is 1 or more portions
  // <rest> is 1 or more portions
  // <p> is any portion other than ., .., '', or **
  // <e> is . or ''
  //
  // **/.. is *brutal* for filesystem walking performance, because
  // it effectively resets the recursive walk each time it occurs,
  // and ** cannot be reduced out by a .. pattern part like a regexp
  // or most strings (other than .., ., and '') can be.
  //
  // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
  // <pre>/<e>/<rest> -> <pre>/<rest>
  // <pre>/<p>/../<rest> -> <pre>/<rest>
  // **/**/<rest> -> **/<rest>
  //
  // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
  // this WOULD be allowed if ** did follow symlinks, or * didn't
  firstPhasePreProcess(globParts) {
    let didSomething = false;
    do {
      didSomething = false;
      for (let parts of globParts) {
        let gs = -1;
        while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
          let gss = gs;
          while (parts[gss + 1] === "**") {
            gss++;
          }
          if (gss > gs) {
            parts.splice(gs + 1, gss - gs);
          }
          let next = parts[gs + 1];
          const p = parts[gs + 2];
          const p2 = parts[gs + 3];
          if (next !== "..")
            continue;
          if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") {
            continue;
          }
          didSomething = true;
          parts.splice(gs, 1);
          const other = parts.slice(0);
          other[gs] = "**";
          globParts.push(other);
          gs--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let i = 1; i < parts.length - 1; i++) {
            const p = parts[i];
            if (i === 1 && p === "" && parts[0] === "")
              continue;
            if (p === "." || p === "") {
              didSomething = true;
              parts.splice(i, 1);
              i--;
            }
          }
          if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
            didSomething = true;
            parts.pop();
          }
        }
        let dd = 0;
        while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
          const p = parts[dd - 1];
          if (p && p !== "." && p !== ".." && p !== "**") {
            didSomething = true;
            const needDot = dd === 1 && parts[dd + 1] === "**";
            const splin = needDot ? ["."] : [];
            parts.splice(dd - 1, 2, ...splin);
            if (parts.length === 0)
              parts.push("");
            dd -= 2;
          }
        }
      }
    } while (didSomething);
    return globParts;
  }
  // second phase: multi-pattern dedupes
  // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
  // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
  // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
  //
  // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
  // ^-- not valid because ** doens't follow symlinks
  secondPhasePreProcess(globParts) {
    for (let i = 0; i < globParts.length - 1; i++) {
      for (let j = i + 1; j < globParts.length; j++) {
        const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
        if (matched) {
          globParts[i] = [];
          globParts[j] = matched;
          break;
        }
      }
    }
    return globParts.filter((gs) => gs.length);
  }
  partsMatch(a, b, emptyGSMatch = false) {
    let ai = 0;
    let bi = 0;
    let result = [];
    let which = "";
    while (ai < a.length && bi < b.length) {
      if (a[ai] === b[bi]) {
        result.push(which === "b" ? b[bi] : a[ai]);
        ai++;
        bi++;
      } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
        result.push(a[ai]);
        ai++;
      } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
        result.push(b[bi]);
        bi++;
      } else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
        if (which === "b")
          return false;
        which = "a";
        result.push(a[ai]);
        ai++;
        bi++;
      } else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
        if (which === "a")
          return false;
        which = "b";
        result.push(b[bi]);
        ai++;
        bi++;
      } else {
        return false;
      }
    }
    return a.length === b.length && result;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset)
      this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(file, pattern, partial = false) {
    let fileStartIndex = 0;
    let patternStartIndex = 0;
    if (this.isWindows) {
      const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
      const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
      const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
      const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
      const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
      const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
      if (typeof fdi === "number" && typeof pdi === "number") {
        const [fd, pd] = [
          file[fdi],
          pattern[pdi]
        ];
        if (fd.toLowerCase() === pd.toLowerCase()) {
          pattern[pdi] = fd;
          patternStartIndex = pdi;
          fileStartIndex = fdi;
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      file = this.levelTwoFileOptimize(file);
    }
    if (pattern.includes(GLOBSTAR)) {
      return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
    }
    return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
  }
  #matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
    const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
    const lastgs = pattern.lastIndexOf(GLOBSTAR);
    const [head, body2, tail] = partial ? [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1),
      []
    ] : [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1, lastgs),
      pattern.slice(lastgs + 1)
    ];
    if (head.length) {
      const fileHead = file.slice(fileIndex, fileIndex + head.length);
      if (!this.#matchOne(fileHead, head, partial, 0, 0)) {
        return false;
      }
      fileIndex += head.length;
      patternIndex += head.length;
    }
    let fileTailMatch = 0;
    if (tail.length) {
      if (tail.length + fileIndex > file.length)
        return false;
      let tailStart = file.length - tail.length;
      if (this.#matchOne(file, tail, partial, tailStart, 0)) {
        fileTailMatch = tail.length;
      } else {
        if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) {
          return false;
        }
        tailStart--;
        if (!this.#matchOne(file, tail, partial, tailStart, 0)) {
          return false;
        }
        fileTailMatch = tail.length + 1;
      }
    }
    if (!body2.length) {
      let sawSome = !!fileTailMatch;
      for (let i2 = fileIndex; i2 < file.length - fileTailMatch; i2++) {
        const f = String(file[i2]);
        sawSome = true;
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return partial || sawSome;
    }
    const bodySegments = [[[], 0]];
    let currentBody = bodySegments[0];
    let nonGsParts = 0;
    const nonGsPartsSums = [0];
    for (const b of body2) {
      if (b === GLOBSTAR) {
        nonGsPartsSums.push(nonGsParts);
        currentBody = [[], 0];
        bodySegments.push(currentBody);
      } else {
        currentBody[0].push(b);
        nonGsParts++;
      }
    }
    let i = bodySegments.length - 1;
    const fileLength = file.length - fileTailMatch;
    for (const b of bodySegments) {
      b[1] = fileLength - (nonGsPartsSums[i--] + b[0].length);
    }
    return !!this.#matchGlobStarBodySections(file, bodySegments, fileIndex, 0, partial, 0, !!fileTailMatch);
  }
  // return false for "nope, not matching"
  // return null for "not matching, cannot keep trying"
  #matchGlobStarBodySections(file, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
    const bs = bodySegments[bodyIndex];
    if (!bs) {
      for (let i = fileIndex; i < file.length; i++) {
        sawTail = true;
        const f = file[i];
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return sawTail;
    }
    const [body2, after] = bs;
    while (fileIndex <= after) {
      const m = this.#matchOne(file.slice(0, fileIndex + body2.length), body2, partial, fileIndex, 0);
      if (m && globStarDepth < this.maxGlobstarRecursion) {
        const sub = this.#matchGlobStarBodySections(file, bodySegments, fileIndex + body2.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail);
        if (sub !== false) {
          return sub;
        }
      }
      const f = file[fileIndex];
      if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
        return false;
      }
      fileIndex++;
    }
    return partial || null;
  }
  #matchOne(file, pattern, partial, fileIndex, patternIndex) {
    let fi;
    let pi;
    let pl;
    let fl;
    for (fi = fileIndex, pi = patternIndex, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
      this.debug("matchOne loop");
      let p = pattern[pi];
      let f = file[fi];
      this.debug(pattern, p, f);
      if (p === false || p === GLOBSTAR) {
        return false;
      }
      let hit;
      if (typeof p === "string") {
        hit = f === p;
        this.debug("string match", p, f, hit);
      } else {
        hit = p.test(f);
        this.debug("pattern match", p, f, hit);
      }
      if (!hit)
        return false;
    }
    if (fi === fl && pi === pl) {
      return true;
    } else if (fi === fl) {
      return partial;
    } else if (pi === pl) {
      return fi === fl - 1 && file[fi] === "";
    } else {
      throw new Error("wtf?");
    }
  }
  braceExpand() {
    return braceExpand(this.pattern, this.options);
  }
  parse(pattern) {
    assertValidPattern(pattern);
    const options = this.options;
    if (pattern === "**")
      return GLOBSTAR;
    if (pattern === "")
      return "";
    let m;
    let fastTest = null;
    if (m = pattern.match(starRE)) {
      fastTest = options.dot ? starTestDot : starTest;
    } else if (m = pattern.match(starDotExtRE)) {
      fastTest = (options.nocase ? options.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
    } else if (m = pattern.match(qmarksRE)) {
      fastTest = (options.nocase ? options.dot ? qmarksTestNocaseDot : qmarksTestNocase : options.dot ? qmarksTestDot : qmarksTest)(m);
    } else if (m = pattern.match(starDotStarRE)) {
      fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
    } else if (m = pattern.match(dotStarRE)) {
      fastTest = dotStarTest;
    }
    const re = AST.fromGlob(pattern, this.options).toMMPattern();
    if (fastTest && typeof re === "object") {
      Reflect.defineProperty(re, "test", { value: fastTest });
    }
    return re;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    const set = this.set;
    if (!set.length) {
      this.regexp = false;
      return this.regexp;
    }
    const options = this.options;
    const twoStar = options.noglobstar ? star2 : options.dot ? twoStarDot : twoStarNoDot;
    const flags2 = new Set(options.nocase ? ["i"] : []);
    let re = set.map((pattern) => {
      const pp = pattern.map((p) => {
        if (p instanceof RegExp) {
          for (const f of p.flags.split(""))
            flags2.add(f);
        }
        return typeof p === "string" ? regExpEscape2(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
      });
      pp.forEach((p, i) => {
        const next = pp[i + 1];
        const prev = pp[i - 1];
        if (p !== GLOBSTAR || prev === GLOBSTAR) {
          return;
        }
        if (prev === void 0) {
          if (next !== void 0 && next !== GLOBSTAR) {
            pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
          } else {
            pp[i] = twoStar;
          }
        } else if (next === void 0) {
          pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + ")?";
        } else if (next !== GLOBSTAR) {
          pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
          pp[i + 1] = GLOBSTAR;
        }
      });
      const filtered = pp.filter((p) => p !== GLOBSTAR);
      if (this.partial && filtered.length >= 1) {
        const prefixes = [];
        for (let i = 1; i <= filtered.length; i++) {
          prefixes.push(filtered.slice(0, i).join("/"));
        }
        return "(?:" + prefixes.join("|") + ")";
      }
      return filtered.join("/");
    }).join("|");
    const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
    re = "^" + open + re + close + "$";
    if (this.partial) {
      re = "^(?:\\/|" + open + re.slice(1, -1) + close + ")$";
    }
    if (this.negate)
      re = "^(?!" + re + ").+$";
    try {
      this.regexp = new RegExp(re, [...flags2].join(""));
    } catch {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(p) {
    if (this.preserveMultipleSlashes) {
      return p.split("/");
    } else if (this.isWindows && /^\/\/[^/]+/.test(p)) {
      return ["", ...p.split(/\/+/)];
    } else {
      return p.split(/\/+/);
    }
  }
  match(f, partial = this.partial) {
    this.debug("match", f, this.pattern);
    if (this.comment) {
      return false;
    }
    if (this.empty) {
      return f === "";
    }
    if (f === "/" && partial) {
      return true;
    }
    const options = this.options;
    if (this.isWindows) {
      f = f.split("\\").join("/");
    }
    const ff = this.slashSplit(f);
    this.debug(this.pattern, "split", ff);
    const set = this.set;
    this.debug(this.pattern, "set", set);
    let filename = ff[ff.length - 1];
    if (!filename) {
      for (let i = ff.length - 2; !filename && i >= 0; i--) {
        filename = ff[i];
      }
    }
    for (const pattern of set) {
      let file = ff;
      if (options.matchBase && pattern.length === 1) {
        file = [filename];
      }
      const hit = this.matchOne(file, pattern, partial);
      if (hit) {
        if (options.flipNegate) {
          return true;
        }
        return !this.negate;
      }
    }
    if (options.flipNegate) {
      return false;
    }
    return this.negate;
  }
  static defaults(def) {
    return minimatch.defaults(def).Minimatch;
  }
};
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

// src/util/log.ts
var inActions = !!process.env.GITHUB_ACTIONS;
var verbose = !!process.env.AMCHI_DEBUG;
function setVerbose(v) {
  verbose = v;
}
var log = {
  info(msg) {
    process.stderr.write(`${msg}
`);
  },
  debug(msg) {
    if (verbose) process.stderr.write(inActions ? `::debug::${msg}
` : `[debug] ${msg}
`);
  },
  warn(msg) {
    process.stderr.write(inActions ? `::warning::${msg}
` : `[warn] ${msg}
`);
  },
  error(msg) {
    process.stderr.write(inActions ? `::error::${msg}
` : `[error] ${msg}
`);
  },
  group(name, fn) {
    if (inActions) process.stderr.write(`::group::${name}
`);
    else process.stderr.write(`\u25B8 ${name}
`);
    return fn().finally(() => {
      if (inActions) process.stderr.write(`::endgroup::
`);
    });
  }
};

// src/config.ts
var SEVERITY_ORDER = ["info", "low", "medium", "high", "critical"];
function severityRank(s) {
  const i = SEVERITY_ORDER.indexOf(s);
  return i < 0 ? 1 : i;
}
var DEFAULT_IGNORE = [
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/bun.lockb",
  "**/bun.lock",
  "**/Cargo.lock",
  "**/poetry.lock",
  "**/Pipfile.lock",
  "**/go.sum",
  "**/composer.lock",
  "**/Gemfile.lock",
  "**/*.min.js",
  "**/*.min.css",
  "**/*.map",
  "**/*.snap",
  "**/*.lock",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.next/**",
  "**/node_modules/**",
  "**/vendor/**",
  "**/*.pb.go",
  "**/*_pb2.py",
  "**/*.generated.*",
  "**/__generated__/**",
  "**/*.png",
  "**/*.jpg",
  "**/*.jpeg",
  "**/*.gif",
  "**/*.webp",
  "**/*.ico",
  "**/*.svg",
  "**/*.pdf",
  "**/*.woff",
  "**/*.woff2",
  "**/*.ttf",
  "**/*.otf",
  "**/*.mp4",
  "**/*.mp3",
  "**/*.zip",
  "**/*.gz",
  "**/*.wasm",
  "**/*.so",
  "**/*.dll",
  "**/*.exe",
  "**/*.bin"
];
var DEFAULT_CONFIG = {
  provider: "auto",
  embeddings: "auto",
  rules: [],
  review: {
    enabled: true,
    verify: false,
    fail_on: "none",
    skip_drafts: true,
    skip_authors: ["dependabot[bot]", "renovate[bot]", "github-actions[bot]"],
    skip_labels: ["no-ai-review", "skip-review"],
    skip_title_patterns: ["[skip review]", "[no review]", "[wip]"],
    ignore: [],
    include: [],
    max_files: 80,
    max_comments: 15,
    min_severity: "low",
    min_confidence: 0.6,
    incremental: true,
    suggestions: true,
    focus: ["bugs", "logic", "security", "performance", "error-handling", "maintainability"],
    request_changes_on: "none",
    badges: "image"
  },
  summary: {
    enabled: true,
    diagram: true,
    file_table: true,
    confidence_score: true
  },
  chat: {
    enabled: true,
    trigger: "@amchi",
    allowed_associations: ["OWNER", "MEMBER", "COLLABORATOR"]
  },
  index: {
    dir: ".amchi",
    max_file_kb: 256,
    max_files: 25e3,
    ignore: []
  },
  limits: {
    max_input_tokens_per_call: 6e4,
    max_output_tokens: 8e3,
    max_total_input_tokens: 15e5,
    concurrency: 4
  }
};
function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function deepMerge(base, over) {
  if (!isObj(over)) return base;
  const out2 = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === void 0 || v === null) continue;
    const b = out2[k];
    out2[k] = isObj(b) && isObj(v) ? deepMerge(b, v) : v;
  }
  return out2;
}
var CONFIG_FILENAMES = [".codereview.yml", ".codereview.yaml", ".amchi.yml", ".amchi.yaml"];
function loadConfig(repoRoot, explicitPath, overrides = {}, opts = {}) {
  let fileCfg = {};
  const candidates = explicitPath ? [explicitPath] : CONFIG_FILENAMES;
  const read = opts.readFile ?? ((name) => {
    const p = isAbsolute(name) ? name : join(repoRoot, name);
    return existsSync(p) ? readFileSync(p, "utf8") : null;
  });
  for (const name of candidates) {
    const text = read(name);
    if (text == null) continue;
    try {
      const parsed = (0, import_yaml.parse)(text);
      fileCfg = isObj(parsed) ? parsed : {};
      log.info(`Loaded config from ${name}`);
    } catch (e) {
      log.warn(`Could not parse ${name}: ${e.message}. Using defaults.`);
    }
    break;
  }
  if (opts.trusted === false) {
    if ("base_url" in fileCfg) log.warn("Ignoring base_url from the config file; set it as an action input instead.");
    delete fileCfg.base_url;
    if (isObj(fileCfg.index)) delete fileCfg.index.dir;
  }
  const cfg = deepMerge(deepMerge(DEFAULT_CONFIG, fileCfg), overrides);
  cfg.rules = (cfg.rules ?? []).map((r) => typeof r === "string" ? { rule: r } : r);
  if (!SEVERITY_ORDER.includes(cfg.review.min_severity)) cfg.review.min_severity = "low";
  if (cfg.review.badges !== "text") cfg.review.badges = "image";
  return cfg;
}
function matchesAny(path2, globs) {
  return globs.some((g) => minimatch(path2, g, { dot: true, matchBase: !g.includes("/") }));
}
function isReviewable(path2, cfg) {
  if (cfg.review.include.length && !matchesAny(path2, cfg.review.include)) return false;
  return !matchesAny(path2, [...DEFAULT_IGNORE, ...cfg.review.ignore]);
}
function rulesForPath(path2, cfg) {
  return cfg.rules.filter((r) => !r.paths?.length || matchesAny(path2, r.paths));
}

// src/git/diff.ts
function unquote(p) {
  if (p.startsWith('"') && p.endsWith('"')) {
    try {
      return JSON.parse(p);
    } catch {
      return p.slice(1, -1);
    }
  }
  return p;
}
function stripPrefix(p) {
  return unquote(p.trim()).replace(/^[ab]\//, "");
}
function parseUnifiedDiff(text) {
  const files = [];
  let cur = null;
  let hunk = null;
  let oldNo = 0;
  let newNo = 0;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("diff --git ")) {
      const m = line.match(/^diff --git (?:"?a\/(.+?)"?) (?:"?b\/(.+?)"?)$/);
      cur = {
        path: m ? m[2] : line.slice(11),
        oldPath: m ? m[1] : void 0,
        status: "modified",
        binary: false,
        hunks: [],
        additions: 0,
        deletions: 0
      };
      files.push(cur);
      hunk = null;
      continue;
    }
    if (!cur) continue;
    if (!hunk) {
      if (line.startsWith("new file mode")) cur.status = "added";
      else if (line.startsWith("deleted file mode")) cur.status = "deleted";
      else if (line.startsWith("rename from ")) {
        cur.oldPath = unquote(line.slice(12));
        cur.status = "renamed";
      } else if (line.startsWith("rename to ")) {
        cur.path = unquote(line.slice(10));
        cur.status = "renamed";
      } else if (line.startsWith("Binary files") || line.startsWith("GIT binary patch")) cur.binary = true;
      else if (line.startsWith("--- ")) {
        const p = line.slice(4);
        if (p.trim() === "/dev/null") cur.status = "added";
        else cur.oldPath = stripPrefix(p);
        continue;
      } else if (line.startsWith("+++ ")) {
        const p = line.slice(4);
        if (p.trim() === "/dev/null") cur.status = "deleted";
        else cur.path = stripPrefix(p);
        continue;
      }
    }
    const hm = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
    if (hm) {
      hunk = {
        oldStart: +hm[1],
        oldLines: hm[2] === void 0 ? 1 : +hm[2],
        newStart: +hm[3],
        newLines: hm[4] === void 0 ? 1 : +hm[4],
        header: hm[5].trim(),
        lines: []
      };
      oldNo = hunk.oldStart;
      newNo = hunk.newStart;
      cur.hunks.push(hunk);
      continue;
    }
    if (!hunk) continue;
    if (line.startsWith("+")) {
      hunk.lines.push({ type: "add", newNo: newNo++, text: line.slice(1) });
      cur.additions++;
    } else if (line.startsWith("-")) {
      hunk.lines.push({ type: "del", oldNo: oldNo++, text: line.slice(1) });
      cur.deletions++;
    } else if (line.startsWith(" ")) {
      hunk.lines.push({ type: "ctx", oldNo: oldNo++, newNo: newNo++, text: line.slice(1) });
    } else if (line === "" && i === lines.length - 1) {
    } else if (line.startsWith("\\")) {
    } else if (line === "") {
      hunk.lines.push({ type: "ctx", oldNo: oldNo++, newNo: newNo++, text: "" });
    }
  }
  return files;
}
function commentableLines(fd) {
  const m = /* @__PURE__ */ new Map();
  fd.hunks.forEach((h, hi) => {
    for (const l of h.lines) if (l.newNo !== void 0) m.set(l.newNo, hi);
  });
  return m;
}
function addedLines(fd) {
  return fd.hunks.flatMap((h) => h.lines.filter((l) => l.type === "add").map((l) => l.newNo));
}
function changedRanges(fd) {
  const out2 = [];
  for (const h of fd.hunks) {
    let start2 = -1;
    let end = -1;
    const lastNewLine = h.newStart + Math.max(0, h.newLines - 1);
    let pos = h.newStart;
    for (const l of h.lines) {
      if (l.type === "ctx") {
        pos = l.newNo + 1;
        continue;
      }
      const n = l.type === "add" ? l.newNo : Math.max(1, Math.min(pos, lastNewLine));
      if (l.type === "add") pos = l.newNo + 1;
      if (start2 < 0) start2 = n;
      end = Math.max(end, n);
    }
    if (start2 >= 0) out2.push([start2, end]);
  }
  return out2;
}
function renderDiffForModel(fd) {
  const out2 = [];
  for (const h of fd.hunks) {
    out2.push(`@@ ${h.header ? `${h.header} ` : ""}(new lines ${h.newStart}-${h.newStart + Math.max(0, h.newLines - 1)})`);
    for (const l of h.lines) {
      if (l.type === "add") out2.push(`L${l.newNo} + ${l.text}`);
      else if (l.type === "ctx") out2.push(`L${l.newNo}   ${l.text}`);
      else out2.push(`     - ${l.text}`);
    }
  }
  return out2.join("\n");
}

// src/review/prompts.ts
var REVIEW_SYSTEM = (cfg) => `You are a senior software engineer doing a careful code review of a pull request.
You are given the diff of one or more files plus context retrieved from a code graph of the whole repository:
enclosing functions, definitions of called code, callers of changed code, related tests and similar code.

Your job is to find real problems introduced or exposed by this change \u2014 the kind a strong reviewer who knows the
codebase would catch. Prioritise, in order:
1. Bugs and logic errors (wrong conditions, off-by-one, null/undefined access, wrong variable, broken edge cases,
   incorrect async/await, race conditions, resource leaks, unhandled errors).
2. Breaking changes visible through the context: callers that now pass wrong arguments, changed return types,
   removed functions that are still referenced, contracts the change violates.
3. Security issues (injection, authz/authn gaps, secrets, unsafe deserialization, SSRF, path traversal, XSS).
4. Performance problems with real impact (N+1 queries, quadratic loops on large inputs, blocking calls in hot paths).
5. Violations of the team rules listed below.
6. Maintainability problems only when they are significant (duplicated logic that already exists elsewhere in the
   repo, misleading names, dead code introduced by this change).
Focus areas requested by the team: ${cfg.review.focus.join(", ")}.

Rules for findings:
- Only comment on lines shown with an L<n> prefix in the diff. "line" must be one of those numbers, and should point
  at the most relevant line, preferably an added (+) line.
- Do not comment on code that was not changed unless the change makes it wrong.
- Do not report style nits, formatting, naming preferences, missing comments/docs, or "consider adding tests"
  unless a team rule asks for it.
- Do not speculate. If you are not reasonably sure, lower "confidence" or leave the finding out. It is fine and
  expected to return zero findings for a clean change.
- Use the repository context to verify claims (e.g. check the callee's real signature before saying it's misused).
  When you rely on another file, cite it as \`path:line\`.
- "suggestion" (optional) is replacement code for exactly lines line..end_line (or just "line"), with the original
  indentation, and no diff markers or line numbers. Only include it when the fix is small, local and certain.
- Keep "title" under 80 characters. Keep "body" concise: what is wrong, why it matters, how to fix.

Severity guide: critical = data loss, security hole or crash in a common path; high = definite bug or breaking
change; medium = likely bug / edge case / significant perf issue; low = minor issue with real but small impact;
info = noteworthy but not a problem.

Return JSON only, matching:
{
  "files": [ { "path": string, "summary": string /* one sentence: what changed in this file */ } ],
  "findings": [
    {
      "path": string,
      "line": number,
      "end_line": number | null,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "category": "bug" | "security" | "performance" | "logic" | "error-handling" | "concurrency" | "breaking-change" | "maintainability" | "rule" | "style",
      "title": string,
      "body": string,
      "suggestion": string | null,
      "confidence": number /* 0.0 - 1.0 */
    }
  ]
}${cfg.instructions ? `

Additional instructions from the team:
${cfg.instructions.trim()}` : ""}`;
function renderRules(rules) {
  if (!rules.length) return "";
  return "## Team rules that apply to these files\n" + rules.map((r, i) => `${i + 1}. ${r.name ? `**${r.name}**: ` : ""}${r.rule}${r.severity ? ` (severity: ${r.severity})` : ""}`).join("\n");
}
function renderPrHeader(pr) {
  const files = pr.changedFiles.slice(0, 80).map((f) => `- ${f.path} (${f.status}, +${f.additions}/-${f.deletions})`).join("\n");
  const more = pr.changedFiles.length > 80 ? `
- \u2026 and ${pr.changedFiles.length - 80} more files` : "";
  const body2 = (pr.body || "").trim().slice(0, 2e3);
  return `# Pull request: ${pr.title}
${body2 ? `
## Description
${body2}
` : ""}
## All files changed in this PR
${files}${more}`;
}
var VERIFY_SYSTEM = `You are double-checking automated code review findings to remove false positives.
For each finding, use the diff and repository context to decide whether it is a real, actionable problem.
Drop findings that are speculative, already handled elsewhere in the shown code, purely stylistic, or wrong about
how the referenced code behaves. Keep findings that are correct, even if minor.
Return JSON only: { "keep": [ { "id": number, "confidence": number } ] } listing the ids of findings to keep.`;
var SUMMARY_SYSTEM = (cfg) => `You write the summary comment for a pull request review.
Be concrete and brief. Write for an engineer who will review this PR next.

Return JSON only:
{
  "overview": string,         /* one or two plain sentences: what this PR does (no markdown headings) */
  "key_changes": string[],    /* 2-6 bullets, most important first */
  "confidence": number,       /* 1-5: how safe this PR is to merge. 5 = safe, 1 = likely to break things */
  "confidence_reason": string, /* one sentence: what must be fixed before merging, or why it is safe; name the most important issue */
  "diagram": string | null    /* ${cfg.summary.diagram ? "a small Mermaid sequenceDiagram or flowchart (no code fences) showing the main flow this PR changes, or null if the PR is trivial (config, docs, renames)" : "always null"} */
}`;
var CHAT_SYSTEM = `You are an expert engineer answering questions about a codebase inside a pull request conversation.
You are given code retrieved from a code graph of the repository (definitions, callers, related files) and, when
relevant, the PR diff. Answer accurately and concisely in GitHub-flavored markdown.
- Ground every claim in the provided code; cite locations as \`path:line\`.
- If the context is not enough to answer, say what is missing instead of guessing.
- When suggesting a code change, show a short code block.`;

// src/util/text.ts
import { createHash } from "node:crypto";
function sha1(s) {
  return createHash("sha1").update(s).digest("hex");
}
function shortHash(s, n = 12) {
  return sha1(s).slice(0, n);
}
function estimateTokens(s) {
  return Math.ceil(s.length / 4);
}
function truncateTokens(s, maxTokens) {
  const maxChars = maxTokens * 4;
  if (s.length <= maxChars) return s;
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head;
  return `${s.slice(0, head)}
\u2026 [truncated ${s.length - maxChars} chars] \u2026
${s.slice(s.length - tail)}`;
}
function tokenize(text) {
  const out2 = [];
  const words = text.match(/[A-Za-z_][A-Za-z0-9_]*|\d+/g) ?? [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (lower.length < 2 || STOP.has(lower)) continue;
    out2.push(lower);
    const parts = w.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").split(/[\s_]+/).map((p) => p.toLowerCase()).filter((p) => p.length >= 2 && !STOP.has(p));
    if (parts.length > 1) out2.push(...parts);
  }
  return out2;
}
var STOP = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "return",
  "const",
  "let",
  "var",
  "if",
  "else",
  "in",
  "of",
  "to",
  "is",
  "be",
  "it",
  "as",
  "at",
  "on",
  "or",
  "an",
  "def",
  "function",
  "import",
  "export",
  "new",
  "self",
  "true",
  "false",
  "null",
  "none",
  "nil",
  "public",
  "private",
  "static",
  "void",
  "int",
  "string",
  "async",
  "await",
  "fn",
  "func"
]);
function numberLines(content, start2 = 1) {
  return content.split("\n").map((l, i) => `${String(start2 + i).padStart(5)} | ${l}`).join("\n");
}
function lineSlice(content, startLine, endLine) {
  const lines = content.split("\n");
  return lines.slice(Math.max(0, startLine - 1), Math.min(lines.length, endLine)).join("\n");
}
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// src/chat/chat.ts
async function answerQuestion(input) {
  const { graph, searcher, question } = input;
  const budget = input.maxContextTokens ?? 4e4;
  const parts = [];
  const cited = [];
  let used = 0;
  const add = (title, body2) => {
    const text = `### ${title}
${body2}`;
    const t = estimateTokens(text);
    if (used + t > budget) return false;
    parts.push(text);
    used += t;
    return true;
  };
  const addCode = (title, path2, start2, end) => {
    const content = graph.read(path2);
    if (content == null) return;
    const e = Math.min(end, start2 + 120);
    if (add(title, `\`${path2}:${start2}-${e}\`
\`\`\`
${numberLines(lineSlice(content, start2, e), start2)}
\`\`\``)) {
      cited.push({ path: path2, start: start2, end: e });
    }
  };
  if (input.thread) {
    const { path: path2, line, diffHunk, history } = input.thread;
    if (history?.length) add("Conversation so far", history.join("\n\n"));
    if (diffHunk) add(`Diff hunk the question refers to (${path2})`, `\`\`\`diff
${diffHunk}
\`\`\``);
    if (line) {
      const syms = graph.symbolsOverlapping(path2, line, line);
      const inner = syms[syms.length - 1];
      if (inner && inner.end - inner.start < 200) addCode(`Enclosing ${inner.kind} \`${inner.name}\``, path2, inner.start, inner.end);
      else addCode(`Code around ${path2}:${line}`, path2, Math.max(1, line - 25), line + 25);
    }
  }
  const idents = /* @__PURE__ */ new Set([
    ...[...question.matchAll(/`([^`]+)`/g)].map((m) => m[1].replace(/\(.*$/, "").split(/[.:/]/).pop()),
    ...question.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:[A-Z][a-z0-9]+|_[a-z0-9]+)+\b/g) ?? []
  ]);
  for (const name of [...idents].slice(0, 6)) {
    const defs = graph.definitionsOf(name).slice(0, 2);
    for (const d of defs) addCode(`Definition of \`${name}\``, d.path, d.symbol.start, d.symbol.end);
    const callers = graph.callersOf(name).slice(0, 5);
    if (callers.length) {
      add(
        `Callers of \`${name}\``,
        callers.map((c) => `- \`${c.path}:${c.symbol.start}\` in \`${c.symbol.name}\``).join("\n")
      );
    }
  }
  const hits = await searcher.search(question, 10);
  for (const h of hits) {
    if (cited.some((c) => c.path === h.chunk.path && c.start <= h.chunk.start && c.end >= h.chunk.end)) continue;
    addCode(`Relevant code${h.chunk.name ? `: ${h.chunk.kind} \`${h.chunk.name}\`` : ""}`, h.chunk.path, h.chunk.start, h.chunk.end);
  }
  if (input.pr) {
    const diff = input.pr.files.map((f) => `--- ${f.path} (${f.status})
${renderDiffForModel(f)}`).join("\n\n");
    const remaining = Math.max(2e3, budget - used);
    parts.unshift(
      `### Pull request: ${input.pr.title}
${input.pr.body?.slice(0, 1500) ?? ""}

#### PR diff
\`\`\`diff
${truncateTokens(diff, Math.min(remaining, 2e4))}
\`\`\``
    );
  }
  const res = await input.llm.chat({
    system: CHAT_SYSTEM,
    user: `${parts.join("\n\n")}

---

## Question
${question}`,
    maxTokens: 3e3,
    label: "chat"
  });
  let answer = res.text.trim();
  if (cited.length) {
    const links = cited.slice(0, 8).map((c) => {
      const label = `${c.path}:${c.start}-${c.end}`;
      return input.blobBase ? `[\`${label}\`](${input.blobBase}/${encodePath(c.path)}#L${c.start}-L${c.end})` : `\`${label}\``;
    });
    answer += `

<details><summary>Context used</summary>

${links.map((l) => `- ${l}`).join("\n")}

</details>`;
  }
  return answer;
}
function encodePath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}

// src/git/git.ts
import { execFileSync } from "node:child_process";
var Git = class {
  constructor(cwd) {
    this.cwd = cwd;
  }
  cwd;
  run(args2, opts = {}) {
    try {
      return execFileSync("git", ["-c", "core.quotepath=off", ...args2], {
        cwd: this.cwd,
        maxBuffer: 512 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"]
      }).toString("utf8");
    } catch (e) {
      if (opts.allowFail) return "";
      const err2 = e;
      throw new Error(`git ${args2.join(" ")} failed: ${err2.stderr?.toString() || err2.message}`);
    }
  }
  revParse(ref) {
    const out2 = this.run(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { allowFail: true }).trim();
    return out2 || null;
  }
  hasCommit(sha) {
    return !!this.revParse(sha);
  }
  /** Fetch a commit if it's missing (shallow clones). */
  ensureCommit(sha, depth = 0) {
    if (this.hasCommit(sha)) return true;
    log.info(`Fetching missing commit ${sha.slice(0, 7)}\u2026`);
    const args2 = ["fetch", "--no-tags", "origin", sha];
    if (depth) args2.splice(1, 0, `--depth=${depth}`);
    this.run(args2, { allowFail: true });
    return this.hasCommit(sha);
  }
  mergeBase(a, b) {
    return this.run(["merge-base", a, b], { allowFail: true }).trim() || null;
  }
  isAncestor(ancestor, descendant) {
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: this.cwd, stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
  diff(base, head) {
    return this.run(["diff", "--no-color", "--no-ext-diff", "-M", "-U3", base, head]);
  }
  log(base, head) {
    const out2 = this.run(["log", "--format=%H%x09%s", `${base}..${head}`], { allowFail: true });
    return out2.split("\n").filter(Boolean).map((l) => {
      const [sha, ...rest] = l.split("	");
      return { sha, subject: rest.join("	") };
    });
  }
};

// src/graph/workspace.ts
import { isAbsolute as isAbsolute2, join as join5 } from "node:path";

// src/graph/indexer.ts
import { execFileSync as execFileSync2 } from "node:child_process";
import { existsSync as existsSync3, lstatSync, mkdirSync, readFileSync as readFileSync2, readdirSync, writeFileSync } from "node:fs";
import { dirname as dirname2, join as join3, posix } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

// src/graph/languages.ts
var JS_DEFS = {
  function_declaration: "function",
  generator_function_declaration: "function",
  method_definition: "method",
  class_declaration: "class",
  abstract_class_declaration: "class",
  interface_declaration: "interface",
  type_alias_declaration: "type",
  enum_declaration: "enum",
  // const foo = () => {} / function() {}
  variable_declarator: "function",
  public_field_definition: "method"
};
var JS_CALLS = ["call_expression", "new_expression"];
var JS_IMPORTS = ["import_statement", "export_statement"];
var LANGS = {
  typescript: { grammar: "typescript", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  tsx: { grammar: "tsx", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  javascript: { grammar: "javascript", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  python: {
    grammar: "python",
    defs: { function_definition: "function", class_definition: "class" },
    calls: ["call"],
    imports: ["import_statement", "import_from_statement"],
    wrappers: ["decorated_definition"]
  },
  go: {
    grammar: "go",
    defs: { function_declaration: "function", method_declaration: "method", type_spec: "type" },
    calls: ["call_expression", "composite_literal"],
    imports: ["import_spec"]
  },
  rust: {
    grammar: "rust",
    defs: {
      function_item: "function",
      struct_item: "struct",
      enum_item: "enum",
      trait_item: "trait",
      impl_item: "impl",
      mod_item: "module",
      type_item: "type",
      macro_definition: "macro"
    },
    calls: ["call_expression", "macro_invocation", "struct_expression"],
    imports: ["use_declaration"]
  },
  java: {
    grammar: "java",
    defs: {
      class_declaration: "class",
      interface_declaration: "interface",
      enum_declaration: "enum",
      record_declaration: "class",
      method_declaration: "method",
      constructor_declaration: "constructor"
    },
    calls: ["method_invocation", "object_creation_expression"],
    imports: ["import_declaration"]
  },
  kotlin: {
    grammar: "kotlin",
    defs: { class_declaration: "class", object_declaration: "object", function_declaration: "function" },
    calls: ["call_expression"],
    imports: ["import_header"]
  },
  c: {
    grammar: "c",
    defs: { function_definition: "function", struct_specifier: "struct", enum_specifier: "enum" },
    calls: ["call_expression"],
    imports: ["preproc_include"]
  },
  cpp: {
    grammar: "cpp",
    defs: {
      function_definition: "function",
      class_specifier: "class",
      struct_specifier: "struct",
      enum_specifier: "enum",
      namespace_definition: "namespace"
    },
    calls: ["call_expression", "new_expression"],
    imports: ["preproc_include"]
  },
  c_sharp: {
    grammar: "c_sharp",
    defs: {
      class_declaration: "class",
      interface_declaration: "interface",
      struct_declaration: "struct",
      enum_declaration: "enum",
      record_declaration: "class",
      method_declaration: "method",
      constructor_declaration: "constructor"
    },
    calls: ["invocation_expression", "object_creation_expression"],
    imports: ["using_directive"]
  },
  php: {
    grammar: "php",
    defs: {
      function_definition: "function",
      method_declaration: "method",
      class_declaration: "class",
      interface_declaration: "interface",
      trait_declaration: "trait"
    },
    calls: ["function_call_expression", "member_call_expression", "scoped_call_expression", "object_creation_expression"],
    imports: ["namespace_use_declaration"]
  },
  swift: {
    grammar: "swift",
    defs: {
      function_declaration: "function",
      class_declaration: "class",
      protocol_declaration: "protocol"
    },
    calls: ["call_expression"],
    imports: ["import_declaration"]
  },
  scala: {
    grammar: "scala",
    defs: {
      function_definition: "function",
      class_definition: "class",
      object_definition: "object",
      trait_definition: "trait"
    },
    calls: ["call_expression"],
    imports: ["import_declaration"]
  },
  lua: {
    grammar: "lua",
    defs: {
      function_declaration: "function",
      function_definition_statement: "function",
      local_function_definition_statement: "function"
    },
    calls: ["call", "function_call"],
    imports: []
  },
  elixir: {
    grammar: "elixir",
    defs: {},
    calls: ["call"],
    imports: []
  },
  // Dart (Flutter). The grammar splits a function into a *_signature node and a
  // sibling function_body, and has no call node: a call is a `selector` holding
  // an argument_part. parser.ts has the Dart-specific glue for both.
  dart: {
    grammar: "dart",
    defs: {
      class_definition: "class",
      mixin_declaration: "mixin",
      extension_declaration: "extension",
      enum_declaration: "enum",
      type_alias: "type",
      function_signature: "function",
      getter_signature: "method",
      setter_signature: "method",
      constructor_signature: "constructor",
      factory_constructor_signature: "constructor",
      constant_constructor_signature: "constructor"
    },
    calls: ["selector", "cascade_section", "new_expression", "const_object_expression"],
    imports: ["import_or_export", "part_directive"]
  }
};
var EXT_TO_LANG = {
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  pyi: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hh: "cpp",
  hxx: "cpp",
  cs: "c_sharp",
  php: "php",
  swift: "swift",
  scala: "scala",
  sc: "scala",
  lua: "lua",
  ex: "elixir",
  exs: "elixir",
  dart: "dart"
};
var TEXT_EXTS = /* @__PURE__ */ new Set([
  "md",
  "mdx",
  "txt",
  "rst",
  "json",
  "yml",
  "yaml",
  "toml",
  "ini",
  "cfg",
  "conf",
  "env",
  "sql",
  "graphql",
  "gql",
  "proto",
  "prisma",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "dockerfile",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "vue",
  "svelte",
  "astro",
  "tf",
  "hcl",
  "xml",
  "rb",
  "rake",
  "gradle",
  "properties",
  "r",
  "jl",
  "m",
  "mm",
  "pl",
  "clj",
  "erl",
  "hs",
  "ml",
  "zig",
  "nim"
]);
function langForPath(path2) {
  const base = path2.split("/").pop() ?? path2;
  const ext2 = base.includes(".") ? base.split(".").pop().toLowerCase() : "";
  return EXT_TO_LANG[ext2] ?? null;
}
function isIndexableText(path2) {
  const base = (path2.split("/").pop() ?? path2).toLowerCase();
  if (base === "dockerfile" || base === "makefile" || base.endsWith(".dockerfile")) return true;
  const ext2 = base.includes(".") ? base.split(".").pop() : "";
  return !!EXT_TO_LANG[ext2] || TEXT_EXTS.has(ext2);
}

// src/graph/parser.ts
import { existsSync as existsSync2 } from "node:fs";
import { dirname, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
var import_web_tree_sitter = __toESM(require_tree_sitter(), 1);
var require2 = createRequire(import.meta.url);
var IDENT_TYPES = /* @__PURE__ */ new Set([
  "identifier",
  "type_identifier",
  "property_identifier",
  "field_identifier",
  "simple_identifier",
  "constant",
  "name",
  "shorthand_property_identifier",
  "private_property_identifier",
  "namespace_identifier",
  "scoped_type_identifier",
  "qualified_identifier"
]);
var FN_VALUE_TYPES = /* @__PURE__ */ new Set([
  "arrow_function",
  "function_expression",
  "function",
  "generator_function",
  "class"
]);
var STRING_TYPES = /* @__PURE__ */ new Set([
  "string",
  "string_literal",
  "interpreted_string_literal",
  "raw_string_literal",
  "string_fragment",
  "system_lib_string",
  "string_content"
]);
var ParserCls = null;
var languages = /* @__PURE__ */ new Map();
function wasmPaths() {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundled = join2(here, "tree-sitter.wasm");
  if (existsSync2(bundled)) return { runtime: bundled, grammarDir: join2(here, "grammars") };
  const wtsDir = dirname(require2.resolve("web-tree-sitter"));
  const grammarDir = join2(dirname(require2.resolve("tree-sitter-wasms/package.json")), "out");
  return { runtime: join2(wtsDir, "tree-sitter.wasm"), grammarDir };
}
function grammarFile(grammarDir, grammar) {
  const file = join2(grammarDir, `tree-sitter-${grammar}.wasm`);
  if (existsSync2(file)) return file;
  try {
    return require2.resolve(`tree-sitter-${grammar}/tree-sitter-${grammar}.wasm`);
  } catch {
    return null;
  }
}
async function getParser(lang) {
  const spec = LANGS[lang];
  if (!spec) return null;
  const { runtime, grammarDir } = wasmPaths();
  if (!ParserCls) {
    const P = import_web_tree_sitter.default;
    await P.init({ locateFile: () => runtime });
    ParserCls = P;
  }
  if (!languages.has(spec.grammar)) {
    const file = grammarFile(grammarDir, spec.grammar);
    if (!file) {
      languages.set(spec.grammar, null);
    } else {
      try {
        languages.set(spec.grammar, await ParserCls.Language.load(file));
      } catch (e) {
        log.warn(`Could not load grammar ${spec.grammar}: ${e.message}`);
        languages.set(spec.grammar, null);
      }
    }
  }
  const language = languages.get(spec.grammar);
  if (!language) return null;
  const parser = new ParserCls();
  parser.setLanguage(language);
  return parser;
}
function rightmostIdent(node, depth = 0) {
  if (!node || depth > 6) return null;
  if (IDENT_TYPES.has(node.type)) {
    const t = node.text;
    const parts = t.split(/::|\.|->|\\/);
    return parts[parts.length - 1] || t;
  }
  for (const field of ["name", "property", "field", "attribute", "method"]) {
    const f = node.childForFieldName?.(field);
    if (f) {
      const r = rightmostIdent(f, depth + 1);
      if (r) return r;
    }
  }
  for (let i = node.namedChildCount - 1; i >= 0; i--) {
    const c = node.namedChild(i);
    if (c && (c.type === "arguments" || c.type === "argument_list" || c.type === "type_arguments")) continue;
    const r = rightmostIdent(c, depth + 1);
    if (r) return r;
  }
  return null;
}
function defName(node, lang) {
  if ((lang === "c" || lang === "cpp") && node.type === "function_definition") {
    let d = node.childForFieldName("declarator");
    for (let i = 0; d && i < 6; i++) {
      if (IDENT_TYPES.has(d.type) || d.type === "destructor_name" || d.type === "operator_name") {
        return rightmostIdent(d) ?? d.text;
      }
      d = d.childForFieldName("declarator") ?? d.namedChild(0);
    }
    return null;
  }
  if (lang === "dart" && node.type.endsWith("constructor_signature")) {
    const ids = [];
    for (let i = 0; i < node.namedChildCount; i++) {
      const c = node.namedChild(i);
      if (c.type === "identifier") ids.push(c.text);
      else if (c.type === "qualified") {
        for (let j = 0; j < c.namedChildCount; j++) if (c.namedChild(j).type === "identifier") ids.push(c.namedChild(j).text);
      }
    }
    return ids[ids.length - 1] ?? null;
  }
  if (node.type === "impl_item") {
    const t = node.childForFieldName("type");
    const tr = node.childForFieldName("trait");
    return t ? `${tr ? `${tr.text} for ` : ""}${t.text}` : null;
  }
  const nameNode = node.childForFieldName("name");
  if (nameNode) return rightmostIdent(nameNode) ?? nameNode.text;
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (IDENT_TYPES.has(c.type)) return c.text;
  }
  return null;
}
function calleeName(node) {
  for (const field of ["function", "name", "method", "constructor", "type", "macro"]) {
    const f = node.childForFieldName?.(field);
    if (f) return rightmostIdent(f);
  }
  return node.namedChildCount ? rightmostIdent(node.namedChild(0)) : null;
}
function hasArgumentPart(node) {
  for (let i = 0; i < node.namedChildCount; i++) if (node.namedChild(i).type === "argument_part") return true;
  return false;
}
function memberName(selector) {
  for (let i = 0; i < selector.namedChildCount; i++) {
    const c = selector.namedChild(i);
    if (c.type.endsWith("assignable_selector") || c.type === "cascade_selector") {
      for (let j = 0; j < c.namedChildCount; j++) if (c.namedChild(j).type === "identifier") return c.namedChild(j).text;
    }
  }
  return null;
}
function dartCallee(node) {
  switch (node.type) {
    case "new_expression":
    case "const_object_expression":
      for (let i = 0; i < node.namedChildCount; i++) {
        const c = node.namedChild(i);
        if (c.type === "type_identifier" || c.type === "identifier") return rightmostIdent(c);
      }
      return null;
    case "cascade_section":
      return hasArgumentPart(node) ? memberName(node) : null;
    case "selector": {
      if (!hasArgumentPart(node)) return null;
      const prev = node.previousNamedSibling;
      if (!prev) return null;
      if (prev.type === "identifier") return prev.text;
      if (prev.type === "selector") return hasArgumentPart(prev) ? null : memberName(prev);
      if (prev.type.endsWith("assignable_selector")) return memberName({ namedChildCount: 1, namedChild: () => prev });
      return null;
    }
    default:
      return null;
  }
}
function firstString(node, depth = 0) {
  if (!node || depth > 7) return null;
  if (STRING_TYPES.has(node.type)) return node.text.replace(/^[@rbuf]*["'`<]+|["'`>]+$/gi, "");
  for (let i = 0; i < node.namedChildCount; i++) {
    const r = firstString(node.namedChild(i), depth + 1);
    if (r) return r;
  }
  return null;
}
function importSpecs(node, lang) {
  switch (node.type) {
    case "import_statement":
      if (lang === "python") {
        const out2 = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          const c = node.namedChild(i);
          if (c.type === "dotted_name") out2.push(c.text);
          else if (c.type === "aliased_import") out2.push(c.childForFieldName("name")?.text ?? c.text);
        }
        return out2;
      }
      return [node.childForFieldName("source") ? firstString(node.childForFieldName("source")) : firstString(node)].filter(
        Boolean
      );
    case "export_statement": {
      const src = node.childForFieldName("source");
      return src ? [firstString(src)].filter(Boolean) : [];
    }
    case "import_from_statement": {
      const mod = node.childForFieldName("module_name");
      if (!mod) return [];
      const base = mod.text;
      if (/^\.+$/.test(base)) {
        const names = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          const c = node.namedChild(i);
          if (c.id !== mod.id && (c.type === "dotted_name" || c.type === "aliased_import")) {
            names.push(base + (c.childForFieldName?.("name")?.text ?? c.text));
          }
        }
        return names.length ? names : [base];
      }
      return [base];
    }
    case "import_spec":
      return [firstString(node.childForFieldName("path") ?? node)].filter(Boolean);
    case "preproc_include": {
      const p = node.childForFieldName("path");
      return p ? [p.text.replace(/^["<]|[">]$/g, "")] : [];
    }
    case "use_declaration": {
      const a = node.childForFieldName("argument");
      return a ? [a.text] : [];
    }
    case "import_or_export":
    case "part_directive":
      return [firstString(node)].filter(Boolean);
    case "import_declaration":
    case "import_header":
    case "using_directive":
    case "namespace_use_declaration":
      return [
        node.text.replace(/^\s*(import|using|use)\s+(static\s+)?/, "").replace(/[;\s]+$/, "").replace(/\s+as\s+\w+$/, "").replace(/\.\*$/, "")
      ];
    default:
      return [];
  }
}
function signatureOf(node) {
  const text = node.text;
  const first = text.split("\n")[0].trim();
  return first.length > 200 ? `${first.slice(0, 200)}\u2026` : first;
}
var CONTAINER_KINDS = /* @__PURE__ */ new Set(["class", "interface", "struct", "impl", "trait", "module", "object", "namespace", "enum", "protocol", "mixin", "extension"]);
function dartBodyOf(sig) {
  let holder = sig;
  while (holder.parent && ["method_signature", "declaration", "lambda_expression"].includes(holder.parent.type)) holder = holder.parent;
  const next = holder.nextNamedSibling;
  return next && next.type === "function_body" ? next : null;
}
async function parseSource(content, lang) {
  const spec = LANGS[lang];
  if (!spec) return null;
  const parser = await getParser(lang);
  if (!parser) return null;
  let tree;
  try {
    tree = parser.parse(content);
  } catch (e) {
    log.debug(`parse failed (${lang}): ${e.message}`);
    return null;
  }
  const defTypes = spec.defs;
  const callTypes = new Set(spec.calls);
  const importTypes = new Set(spec.imports);
  const symbols = [];
  const imports = /* @__PURE__ */ new Set();
  const topCalls = /* @__PURE__ */ new Set();
  const symbolCalls = /* @__PURE__ */ new Map();
  const bodyOwner = /* @__PURE__ */ new Map();
  const stack = [{ node: tree.rootNode, owner: null, container: void 0 }];
  let visited = 0;
  while (stack.length) {
    const frame = stack.pop();
    const { node, container } = frame;
    const owner = bodyOwner.get(node.id) ?? frame.owner;
    if (++visited > 4e5) break;
    let nextOwner = owner;
    let nextContainer = container;
    const kind = defTypes[node.type];
    if (kind) {
      let accept = true;
      if (node.type === "variable_declarator" || node.type === "public_field_definition") {
        const v = node.childForFieldName("value");
        accept = !!v && FN_VALUE_TYPES.has(v.type);
      }
      const name = accept ? defName(node, lang) : null;
      if (name) {
        let k = kind;
        if (k === "function" && container && (lang === "rust" || lang === "python" || lang === "kotlin" || lang === "scala" || lang === "swift" || lang === "php" || lang === "cpp" || lang === "dart")) {
          k = "method";
        }
        const sym = {
          name,
          kind: k,
          start: node.startPosition.row + 1,
          end: node.endPosition.row + 1,
          parent: container,
          signature: signatureOf(node),
          calls: []
        };
        if (lang === "dart" && node.type.endsWith("_signature")) {
          const init2 = node.nextNamedSibling;
          if (init2 && init2.type === "initializers") {
            sym.end = init2.endPosition.row + 1;
            bodyOwner.set(init2.id, sym);
          }
          const body2 = dartBodyOf(node);
          if (body2) {
            sym.end = body2.endPosition.row + 1;
            bodyOwner.set(body2.id, sym);
          }
        }
        symbols.push(sym);
        symbolCalls.set(sym, /* @__PURE__ */ new Set());
        nextOwner = sym;
        if (CONTAINER_KINDS.has(k)) nextContainer = name.replace(/^.* for /, "");
      }
    }
    if (callTypes.has(node.type)) {
      const callee = lang === "dart" ? dartCallee(node) : calleeName(node);
      if (callee) {
        if ((callee === "require" || callee === "require_relative" || callee === "import") && node.namedChildCount) {
          const s = firstString(node.childForFieldName("arguments") ?? node);
          if (s) imports.add(callee === "require_relative" && !s.startsWith(".") ? `./${s}` : s);
        } else if (callee.length > 1) {
          if (owner) symbolCalls.get(owner).add(callee);
          else topCalls.add(callee);
        }
      }
    }
    if (node.type === "import" && lang !== "python") {
    }
    if (importTypes.has(node.type)) {
      for (const s of importSpecs(node, lang)) if (s) imports.add(s);
    }
    for (let i = node.namedChildCount - 1; i >= 0; i--) {
      stack.push({ node: node.namedChild(i), owner: nextOwner, container: nextContainer });
    }
  }
  tree.delete?.();
  parser.delete?.();
  for (const [sym, calls] of symbolCalls) {
    calls.delete(sym.name);
    sym.calls = [...calls].slice(0, 200);
  }
  symbols.sort((a, b) => a.start - b.start || b.end - a.end);
  return { symbols, imports: [...imports].slice(0, 300), topLevelCalls: [...topCalls].slice(0, 200) };
}

// src/graph/indexer.ts
var INDEX_VERSION = 3;
function indexFile(dir) {
  return join3(dir, "index.json.gz");
}
function loadIndex(dir) {
  const f = indexFile(dir);
  if (!existsSync3(f)) return null;
  try {
    const data = JSON.parse(gunzipSync(readFileSync2(f)).toString("utf8"));
    if (data.version !== INDEX_VERSION) {
      log.info(`Index version changed (${data.version} \u2192 ${INDEX_VERSION}); rebuilding`);
      return null;
    }
    return data;
  } catch (e) {
    log.warn(`Could not read index cache: ${e.message}`);
    return null;
  }
}
function saveIndex(dir, data) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(indexFile(dir), gzipSync(JSON.stringify(data)));
  const gi = join3(dir, ".gitignore");
  if (!existsSync3(gi)) writeFileSync(gi, "*\n");
}
function listRepoFiles(root) {
  try {
    const out2 = execFileSync2("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      maxBuffer: 512 * 1024 * 1024
    });
    return [...new Set(out2.toString("utf8").split("\0").filter(Boolean))];
  } catch {
    log.warn("git ls-files failed; walking the directory instead");
    const out2 = [];
    const walk = (rel) => {
      for (const name of readdirSync(join3(root, rel))) {
        if (name === ".git" || name === "node_modules" || name === ".amchi") continue;
        const r = rel ? `${rel}/${name}` : name;
        const st = lstatSync(join3(root, r));
        if (st.isDirectory()) walk(r);
        else if (st.isFile()) out2.push(r);
      }
    };
    walk("");
    return out2;
  }
}
function shouldIndex(path2, cfg) {
  if (path2.startsWith(`${cfg.index.dir}/`) || path2 === ".git" || path2.startsWith(".git/") || path2.includes("/.git/")) return false;
  if (!isIndexableText(path2)) return false;
  return !matchesAny(path2, [...DEFAULT_IGNORE, ...cfg.index.ignore]);
}
async function buildIndex(root, cfg, prev, commit) {
  const t0 = Date.now();
  let paths = listRepoFiles(root).filter((p) => shouldIndex(p, cfg));
  if (paths.length > cfg.index.max_files) {
    log.warn(`Repo has ${paths.length} indexable files; indexing the first ${cfg.index.max_files} (index.max_files)`);
    paths = paths.slice(0, cfg.index.max_files);
  }
  const files = {};
  let parsed = 0;
  let reused = 0;
  const maxBytes = cfg.index.max_file_kb * 1024;
  for (const path2 of paths) {
    const abs = join3(root, path2);
    let buf;
    try {
      const st = lstatSync(abs);
      if (!st.isFile() || st.size > maxBytes) continue;
      buf = readFileSync2(abs);
    } catch {
      continue;
    }
    if (buf.subarray(0, 8e3).includes(0)) continue;
    const content = buf.toString("utf8");
    const hash = sha1(content);
    const old = prev?.files[path2];
    if (old && old.hash === hash) {
      files[path2] = { ...old, resolved: [] };
      reused++;
      continue;
    }
    const lang = langForPath(path2);
    const entry = {
      path: path2,
      hash,
      lang,
      lines: content.split("\n").length,
      symbols: [],
      imports: [],
      resolved: [],
      topLevelCalls: []
    };
    if (lang) {
      const p = await parseSource(content, lang);
      if (p) {
        entry.symbols = p.symbols;
        entry.imports = p.imports;
        entry.topLevelCalls = p.topLevelCalls;
      }
    }
    files[path2] = entry;
    parsed++;
  }
  let goModule;
  let dartPackage;
  if (existsSync3(join3(root, "pubspec.yaml"))) {
    dartPackage = readFileSync2(join3(root, "pubspec.yaml"), "utf8").match(/^name:\s*["']?([\w-]+)/m)?.[1];
  }
  try {
    goModule = readFileSync2(join3(root, "go.mod"), "utf8").match(/^module\s+(\S+)/m)?.[1];
  } catch {
  }
  const resolver = new ImportResolver(Object.keys(files), goModule, dartPackage);
  for (const f of Object.values(files)) {
    f.resolved = [...new Set(f.imports.map((i) => resolver.resolve(f.path, i, f.lang)).filter(Boolean))];
  }
  const removed = prev ? Object.keys(prev.files).filter((p) => !files[p]).length : 0;
  const data = { version: INDEX_VERSION, commit, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), files };
  const stats = { total: Object.keys(files).length, parsed, reused, removed, ms: Date.now() - t0 };
  log.info(
    `Indexed ${stats.total} files (${parsed} parsed, ${reused} cached, ${removed} removed) in ${(stats.ms / 1e3).toFixed(1)}s`
  );
  return { data, stats };
}
var JS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".vue", ".svelte"];
function stripExt(p) {
  return p.replace(/\.[^./]+$/, "");
}
var ImportResolver = class {
  constructor(paths, goModule, dartPackage) {
    this.goModule = goModule;
    this.dartPackage = dartPackage;
    this.set = new Set(paths);
    for (const p of paths) {
      const stem = stripExt(posix.basename(p));
      (this.byStem.get(stem) ?? this.byStem.set(stem, []).get(stem)).push(p);
      const d = posix.dirname(p);
      (this.byDir.get(d) ?? this.byDir.set(d, []).get(d)).push(p);
    }
  }
  goModule;
  dartPackage;
  set;
  /** basename without extension -> paths */
  byStem = /* @__PURE__ */ new Map();
  /** directory -> files directly in it */
  byDir = /* @__PURE__ */ new Map();
  tryFile(base, exts, indexNames) {
    const norm = posix.normalize(base).replace(/^\.\//, "");
    if (this.set.has(norm)) return norm;
    const noExt = stripExt(norm);
    for (const e of exts) {
      if (this.set.has(norm + e)) return norm + e;
      if (this.set.has(noExt + e)) return noExt + e;
    }
    for (const idx of indexNames) {
      for (const e of exts) if (this.set.has(`${norm}/${idx}${e}`)) return `${norm}/${idx}${e}`;
    }
    return null;
  }
  /** Find a file whose path (without extension) ends with `suffix`. Prefers shortest path. */
  bySuffix(suffix, exts) {
    const clean = suffix.replace(/^\/+/, "");
    const stem = stripExt(posix.basename(clean));
    const cands = (this.byStem.get(stem) ?? []).filter((p) => {
      const ext2 = p.slice(p.lastIndexOf("."));
      if (exts.length && !exts.includes(ext2)) return false;
      const np = stripExt(p);
      return np === stripExt(clean) || np.endsWith(`/${stripExt(clean)}`);
    });
    cands.sort((a, b) => a.length - b.length);
    return cands[0] ?? null;
  }
  resolve(from, spec, lang) {
    const dir = posix.dirname(from);
    switch (lang) {
      case "typescript":
      case "tsx":
      case "javascript": {
        if (spec.startsWith(".")) {
          const base = posix.join(dir, spec);
          return this.tryFile(base, JS_EXTS, ["index"]) ?? this.tryFile(base.replace(/\.(m|c)?js$/, ""), JS_EXTS, ["index"]);
        }
        const m = spec.match(/^(?:@|~|#)\/(.*)$/);
        if (m) {
          return this.tryFile(`src/${m[1]}`, JS_EXTS, ["index"]) ?? this.tryFile(m[1], JS_EXTS, ["index"]) ?? this.bySuffix(m[1], JS_EXTS);
        }
        if (spec.includes("/") && !spec.startsWith("@")) {
          return this.tryFile(spec, JS_EXTS, ["index"]) ?? this.tryFile(`src/${spec}`, JS_EXTS, ["index"]);
        }
        return null;
      }
      case "python": {
        const exts = [".py", ".pyi"];
        if (spec.startsWith(".")) {
          const dots = spec.match(/^\.+/)[0].length;
          let base = dir;
          for (let i = 1; i < dots; i++) base = posix.dirname(base);
          const rest = spec.slice(dots).replace(/\./g, "/");
          const target = rest ? posix.join(base, rest) : base;
          return this.tryFile(target, exts, ["__init__"]);
        }
        const asPath = spec.replace(/\./g, "/");
        return this.tryFile(asPath, exts, ["__init__"]) ?? this.tryFile(`src/${asPath}`, exts, ["__init__"]) ?? (asPath.includes("/") ? this.bySuffix(asPath, exts) : null);
      }
      case "go": {
        if (this.goModule && (spec === this.goModule || spec.startsWith(`${this.goModule}/`))) {
          const rel = spec.slice(this.goModule.length).replace(/^\//, "") || ".";
          const list = this.byDir.get(rel) ?? [];
          return list.find((p) => p.endsWith(".go") && !p.endsWith("_test.go")) ?? null;
        }
        const segs = spec.split("/");
        if (segs.length < 2 && !this.byDir.has(spec)) return null;
        for (let i = 0; i < segs.length; i++) {
          const suffix = segs.slice(i).join("/");
          for (const [d, list] of this.byDir) {
            if (d === suffix || d.endsWith(`/${suffix}`)) {
              const goFile = list.find((p) => p.endsWith(".go") && !p.endsWith("_test.go"));
              if (goFile) return goFile;
            }
          }
          if (segs.length - i <= 2) break;
        }
        return null;
      }
      case "java":
      case "kotlin":
      case "scala":
        return this.bySuffix(spec.replace(/\./g, "/"), [".java", ".kt", ".kts", ".scala"]);
      case "c_sharp":
        return null;
      case "rust": {
        const path2 = spec.replace(/^(crate|self|super)::/, "").replace(/::\{.*$/, "").split("::");
        while (path2.length) {
          const p = path2.join("/");
          const hit = this.bySuffix(p, [".rs"]) ?? this.tryFile(`src/${p}`, [".rs"], ["mod"]);
          if (hit) return hit;
          path2.pop();
        }
        return null;
      }
      case "c":
      case "cpp":
        return this.tryFile(posix.join(dir, spec), [], []) ?? this.bySuffix(spec, []);
      case "php":
        return this.bySuffix(spec.replace(/\\/g, "/"), [".php"]);
      case "ruby":
        return spec.startsWith(".") ? this.tryFile(posix.join(dir, spec), [".rb"], []) : this.bySuffix(spec, [".rb"]);
      case "dart": {
        if (spec.startsWith("dart:")) return null;
        const pkg = spec.match(/^package:([^/]+)\/(.+)$/);
        if (pkg) {
          const [, name, rest] = pkg;
          if (name === this.dartPackage) return this.tryFile(`lib/${rest}`, [".dart"], []);
          return this.bySuffix(`${name}/lib/${rest}`, [".dart"]);
        }
        return this.tryFile(posix.join(dir, spec), [".dart"], []);
      }
      case "swift":
      default:
        return null;
    }
  }
};
var CodeGraph = class {
  constructor(root, data) {
    this.root = root;
    this.data = data;
    for (const f of Object.values(data.files)) {
      for (const s of f.symbols) {
        push(this.defsByName, s.name, { path: f.path, symbol: s });
        for (const c of s.calls) push(this.callersByName, c, { path: f.path, symbol: s });
      }
      for (const r of f.resolved) {
        (this.importers.get(r) ?? this.importers.set(r, /* @__PURE__ */ new Set()).get(r)).add(f.path);
      }
    }
  }
  root;
  data;
  defsByName = /* @__PURE__ */ new Map();
  callersByName = /* @__PURE__ */ new Map();
  importers = /* @__PURE__ */ new Map();
  contentCache = /* @__PURE__ */ new Map();
  file(path2) {
    return this.data.files[path2];
  }
  read(path2) {
    if (this.contentCache.has(path2)) return this.contentCache.get(path2);
    let c = null;
    try {
      if (!this.data.files[path2] && lstatSync(join3(this.root, path2)).isSymbolicLink()) throw new Error("symlink");
      c = readFileSync2(join3(this.root, path2), "utf8");
    } catch {
      c = null;
    }
    if (this.contentCache.size > 2e3) this.contentCache.clear();
    this.contentCache.set(path2, c);
    return c;
  }
  /** Symbols overlapping [start, end]; innermost (smallest) last. */
  symbolsOverlapping(path2, start2, end) {
    const f = this.data.files[path2];
    if (!f) return [];
    return f.symbols.filter((s) => s.start <= end && s.end >= start2).sort((a, b) => b.end - b.start - (a.end - a.start));
  }
  /** Definitions for a name, preferring files imported by `fromPath`, then same dir. */
  definitionsOf(name, fromPath) {
    const defs = this.defsByName.get(name) ?? [];
    if (!fromPath) return defs;
    const imported = new Set(this.data.files[fromPath]?.resolved ?? []);
    const dir = dirname2(fromPath);
    const score = (r) => (r.path === fromPath ? 3 : 0) + (imported.has(r.path) ? 2 : 0) + (dirname2(r.path) === dir ? 1 : 0);
    return [...defs].sort((a, b) => score(b) - score(a));
  }
  /**
   * Does `from` import `target`, directly or through one barrel file
   * (index.ts / __init__.py / mod.rs re-exports)?
   */
  dependsOn(from, target) {
    if (from === target) return true;
    const resolved = this.data.files[from]?.resolved ?? [];
    if (resolved.includes(target)) return true;
    for (const r of resolved) {
      if (/(^|\/)(index\.[cm]?[jt]sx?|__init__\.py|mod\.rs|lib\.rs)$/.test(r) && this.data.files[r]?.resolved.includes(target)) {
        return true;
      }
    }
    return false;
  }
  callersOf(name) {
    return this.callersByName.get(name) ?? [];
  }
  importersOf(path2) {
    return [...this.importers.get(path2) ?? []];
  }
  /** Files whose imports would resolve to `path` if it existed (for deleted/moved files). */
  importersOfMissing(path2) {
    if (this.data.files[path2]) return this.importersOf(path2);
    const resolver = new ImportResolver([...Object.keys(this.data.files), path2]);
    const out2 = [];
    for (const f of Object.values(this.data.files)) {
      if (f.imports.some((i) => resolver.resolve(f.path, i, f.lang) === path2)) out2.push(f.path);
    }
    return out2;
  }
  testsFor(path2) {
    const stem = stripExt(posix.basename(path2)).replace(/(\.test|\.spec|_test|Test|Tests|_spec)$/, "");
    if (stem.length < 2) return [];
    const re = new RegExp(
      `(^|/)(test_${esc(stem)}|${esc(stem)}(\\.test|\\.spec|_test|_spec|Test|Tests))\\.[a-z]+$|(^|/)(__tests__|tests?|spec)/(.*/)?${esc(stem)}\\.[a-z]+$`,
      "i"
    );
    return Object.keys(this.data.files).filter((p) => p !== path2 && re.test(p)).slice(0, 5);
  }
};
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function push(m, k, v) {
  const arr = m.get(k);
  if (arr) {
    if (arr.length < 500) arr.push(v);
  } else m.set(k, [v]);
}

// src/graph/search.ts
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join4 } from "node:path";
var MAX_CHUNK_LINES = 120;
var WINDOW = 60;
var CONTAINERS = /* @__PURE__ */ new Set(["class", "interface", "struct", "impl", "trait", "module", "object", "namespace", "protocol"]);
function buildChunks(graph) {
  const chunks = [];
  for (const f of Object.values(graph.data.files)) {
    const content = graph.read(f.path);
    if (content == null) continue;
    const add = (start2, end, name, kind) => {
      const code = lineSlice(content, start2, end);
      if (!code.trim()) return;
      const header = `${f.path}:${start2}-${end}${name ? ` ${kind} ${name}` : ""}`;
      const text = `${header}
${code}`;
      chunks.push({ id: `${f.path}:${start2}-${end}`, path: f.path, start: start2, end, name, kind, text, hash: sha1(text) });
    };
    if (f.symbols.length) {
      for (const s of f.symbols) {
        const len = s.end - s.start + 1;
        if (CONTAINERS.has(s.kind) && len > MAX_CHUNK_LINES) {
          add(s.start, s.start + 25, s.name, s.kind);
        } else {
          add(s.start, Math.min(s.end, s.start + MAX_CHUNK_LINES - 1), s.name, s.kind);
        }
      }
      const first = Math.min(...f.symbols.map((s) => s.start));
      if (first > 3) add(1, Math.min(first - 1, WINDOW));
    } else {
      for (let start2 = 1, n = 0; start2 <= f.lines && n < 10; start2 += WINDOW, n++) {
        add(start2, Math.min(f.lines, start2 + WINDOW - 1));
      }
    }
  }
  return chunks;
}
var EmbeddingStore = class {
  constructor(dir, model) {
    this.dir = dir;
    this.model = model;
  }
  dir;
  model;
  vectors = /* @__PURE__ */ new Map();
  dims = 0;
  base() {
    return join4(this.dir, `emb-${this.model.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  }
  load() {
    const meta = `${this.base()}.json`;
    const bin = `${this.base()}.bin`;
    if (!existsSync4(meta) || !existsSync4(bin)) return;
    try {
      const { dims, hashes } = JSON.parse(readFileSync3(meta, "utf8"));
      const buf = readFileSync3(bin);
      const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
      this.dims = dims;
      hashes.forEach((h, i) => this.vectors.set(h, all.slice(i * dims, (i + 1) * dims)));
      log.info(`Loaded ${hashes.length} cached embeddings`);
    } catch (e) {
      log.warn(`Could not load embedding cache: ${e.message}`);
    }
  }
  /** Persist only vectors still referenced by current chunks (prunes stale ones). */
  save(keep) {
    if (!this.dims) return;
    mkdirSync2(this.dir, { recursive: true });
    const hashes = [...this.vectors.keys()].filter((h) => keep.has(h));
    const all = new Float32Array(hashes.length * this.dims);
    hashes.forEach((h, i) => all.set(this.vectors.get(h), i * this.dims));
    writeFileSync2(`${this.base()}.bin`, Buffer.from(all.buffer));
    writeFileSync2(`${this.base()}.json`, JSON.stringify({ model: this.model, dims: this.dims, hashes }));
  }
};
var Searcher = class {
  constructor(chunks, embedder = null, store = null) {
    this.chunks = chunks;
    this.embedder = embedder;
    this.store = store;
    chunks.forEach((c, i) => {
      const terms = tokenize(`${c.path} ${c.name ?? ""} ${c.text}`);
      this.docLen[i] = terms.length;
      const tf = /* @__PURE__ */ new Map();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const [t, n] of tf) (this.postings.get(t) ?? this.postings.set(t, []).get(t)).push({ doc: i, tf: n });
    });
    this.avgLen = this.docLen.reduce((a, b) => a + b, 0) / Math.max(1, chunks.length);
  }
  chunks;
  embedder;
  store;
  postings = /* @__PURE__ */ new Map();
  docLen = [];
  avgLen = 1;
  get hasEmbeddings() {
    return !!(this.embedder && this.store && this.store.vectors.size);
  }
  /** Embed chunks that are not cached yet. Returns number of new embeddings. */
  async ensureEmbeddings(maxChunks) {
    if (!this.embedder || !this.store) return 0;
    const missing = this.chunks.filter((c) => !this.store.vectors.has(c.hash)).slice(0, maxChunks);
    if (!missing.length) return 0;
    log.info(`Embedding ${missing.length} new code chunks with ${this.embedder.model}\u2026`);
    const bs = this.embedder.batchSize;
    const batches = [];
    for (let i = 0; i < missing.length; i += bs) batches.push(missing.slice(i, i + bs));
    let done = 0;
    try {
      await mapLimit(batches, 3, async (batch) => {
        const vecs = await this.embedder.embed(batch.map((c) => c.text));
        vecs.forEach((v, i) => {
          this.store.vectors.set(batch[i].hash, Float32Array.from(normalize(v)));
          this.store.dims = v.length;
        });
        done += batch.length;
      });
    } catch (e) {
      log.warn(`Embedding failed after ${done} chunks (${e.message}); continuing with keyword search`);
    }
    return done;
  }
  persistEmbeddings() {
    this.store?.save(new Set(this.chunks.map((c) => c.hash)));
  }
  bm25(query, k, filter2) {
    const terms = [...new Set(tokenize(query))];
    const N = this.chunks.length;
    const scores = /* @__PURE__ */ new Map();
    const k1 = 1.2;
    const b = 0.75;
    for (const t of terms) {
      const post = this.postings.get(t);
      if (!post || post.length > N * 0.5) continue;
      const idf = Math.log(1 + (N - post.length + 0.5) / (post.length + 0.5));
      for (const { doc, tf } of post) {
        const s = idf * (tf * (k1 + 1) / (tf + k1 * (1 - b + b * this.docLen[doc] / this.avgLen)));
        scores.set(doc, (scores.get(doc) ?? 0) + s);
      }
    }
    return [...scores.entries()].filter(([d]) => !filter2 || filter2(this.chunks[d])).sort((a, b2) => b2[1] - a[1]).slice(0, k).map(([d, s]) => ({ chunk: this.chunks[d], score: s }));
  }
  async vector(query, k, filter2) {
    if (!this.hasEmbeddings) return [];
    let q;
    try {
      q = normalize((await this.embedder.embed([query]))[0]);
    } catch (e) {
      log.warn(`Query embedding failed: ${e.message}`);
      return [];
    }
    const hits = [];
    for (const c of this.chunks) {
      if (filter2 && !filter2(c)) continue;
      const v = this.store.vectors.get(c.hash);
      if (!v || v.length !== q.length) continue;
      let dot = 0;
      for (let i = 0; i < q.length; i++) dot += q[i] * v[i];
      hits.push({ chunk: c, score: dot });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, k);
  }
  /** Hybrid search with reciprocal-rank fusion. */
  async search(query, k = 8, filter2) {
    const [lex, vec] = await Promise.all([
      Promise.resolve(this.bm25(query, k * 3, filter2)),
      this.vector(query, k * 3, filter2)
    ]);
    const fused = /* @__PURE__ */ new Map();
    const add = (list, weight) => list.forEach((h, rank2) => {
      const cur = fused.get(h.chunk.id) ?? { chunk: h.chunk, score: 0 };
      cur.score += weight / (60 + rank2);
      fused.set(h.chunk.id, cur);
    });
    add(lex, 1);
    add(vec, 1.2);
    return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
  }
};
function normalize(v) {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

// src/graph/workspace.ts
async function openWorkspace(root, cfg, embedder, opts = {}) {
  const dir = isAbsolute2(cfg.index.dir) ? cfg.index.dir : join5(root, cfg.index.dir);
  const prev = loadIndex(dir);
  if (prev) log.info(`Restored code graph cache (${Object.keys(prev.files).length} files, commit ${prev.commit?.slice(0, 7) ?? "?"})`);
  const { data, stats } = await buildIndex(root, cfg, prev, opts.commit);
  saveIndex(dir, data);
  const graph = new CodeGraph(root, data);
  const chunks = buildChunks(graph);
  let store = null;
  if (embedder) {
    store = new EmbeddingStore(dir, `${embedder.provider}-${embedder.model}`);
    store.load();
  }
  const searcher = new Searcher(chunks, embedder, store);
  if (embedder) {
    const added = await searcher.ensureEmbeddings(opts.maxEmbedChunks ?? 3e4);
    if (added) searcher.persistEmbeddings();
  }
  log.info(
    `Code graph: ${graph.defsByName.size.toLocaleString()} symbols, ${chunks.length.toLocaleString()} chunks` + (searcher.hasEmbeddings ? ", semantic search on" : ", keyword search")
  );
  return { graph, searcher, stats };
}

// src/llm/index.ts
import { mkdirSync as mkdirSync3, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join6 } from "node:path";

// src/llm/http.ts
var HttpError = class extends Error {
  constructor(status, body2, url) {
    super(`HTTP ${status} from ${redact(url)}: ${body2.slice(0, 500)}`);
    this.status = status;
    this.body = body2;
    this.name = "HttpError";
  }
  status;
  body;
};
function redact(url) {
  return url.replace(/([?&]key=)[^&]+/, "$1***");
}
var RETRYABLE = /* @__PURE__ */ new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);
async function postJson(url, body2, headers, opts = {}) {
  const attempts = opts.attempts ?? 6;
  const timeoutMs = opts.timeoutMs ?? 24e4;
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body2),
        signal: AbortSignal.timeout(timeoutMs)
      });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
      const err2 = new HttpError(res.status, text, url);
      if (!RETRYABLE.has(res.status) || attempt === attempts) throw err2;
      lastErr = err2;
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1e3, 6e4) : backoff(attempt);
      log.warn(`LLM request got ${res.status}; retrying in ${Math.round(wait / 1e3)}s (attempt ${attempt}/${attempts})`);
      await sleep(wait);
    } catch (e) {
      if (e instanceof HttpError && !RETRYABLE.has(e.status)) throw e;
      if (attempt === attempts) throw e;
      lastErr = e;
      const wait = backoff(attempt);
      log.warn(`LLM request failed (${e.message}); retrying in ${Math.round(wait / 1e3)}s`);
      await sleep(wait);
    }
  }
  throw lastErr;
}
function backoff(attempt) {
  return Math.min(6e4, 1e3 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
}

// src/llm/providers.ts
var OpenAIChat = class {
  constructor(apiKey, model, baseUrl = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }
  apiKey;
  model;
  baseUrl;
  provider = "openai";
  /** Learned at runtime: some compatible servers (Azure reasoning deployments) need max_completion_tokens. */
  useCompletionTokens = null;
  get isOfficial() {
    return /api\.openai\.com/.test(this.baseUrl);
  }
  async chat(req) {
    const maxTokens = req.maxTokens ?? 8e3;
    const body2 = {
      model: this.model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user }
      ]
    };
    const completionTokens = this.useCompletionTokens ?? this.isOfficial;
    if (completionTokens) body2.max_completion_tokens = maxTokens * 3;
    else body2.max_tokens = maxTokens;
    if (req.json) body2.response_format = { type: "json_object" };
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const headers = { authorization: `Bearer ${this.apiKey}` };
    if (/\.azure\.com/.test(this.baseUrl)) headers["api-key"] = this.apiKey;
    let res;
    try {
      res = await postJson(url, body2, headers);
    } catch (e) {
      if (e instanceof HttpError && e.status === 400 && /max_(completion_)?tokens/.test(e.body)) {
        this.useCompletionTokens = !completionTokens;
        delete body2.max_tokens;
        delete body2.max_completion_tokens;
        if (this.useCompletionTokens) body2.max_completion_tokens = maxTokens * 3;
        else body2.max_tokens = maxTokens;
        res = await postJson(url, body2, headers);
      } else throw e;
    }
    const text = res.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      throw new Error(`OpenAI returned an empty response (finish_reason=${res.choices?.[0]?.finish_reason})`);
    }
    return {
      text,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0
    };
  }
};
var OpenAIEmbedder = class {
  constructor(apiKey, model, baseUrl = "https://api.openai.com/v1", dimensions = 512) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.dimensions = dimensions;
  }
  apiKey;
  model;
  baseUrl;
  dimensions;
  provider = "openai";
  batchSize = 128;
  async embed(texts) {
    const body2 = {
      model: this.model,
      input: texts.map((t) => t.slice(0, 8e3))
    };
    if (/text-embedding-3/.test(this.model)) body2.dimensions = this.dimensions;
    const res = await postJson(`${this.baseUrl.replace(/\/$/, "")}/embeddings`, body2, {
      authorization: `Bearer ${this.apiKey}`
    });
    return [...res.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
};
var AnthropicChat = class {
  constructor(apiKey, model, baseUrl = "https://api.anthropic.com/v1") {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }
  apiKey;
  model;
  baseUrl;
  provider = "anthropic";
  async chat(req) {
    const system = req.json ? `${req.system}

Respond with a single valid JSON object and nothing else.` : req.system;
    const res = await postJson(
      `${this.baseUrl.replace(/\/$/, "")}/messages`,
      {
        model: this.model,
        max_tokens: req.maxTokens ?? 8e3,
        system,
        messages: [{ role: "user", content: req.user }]
      },
      { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" }
    );
    const text = res.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
    if (!text.trim()) throw new Error(`Claude returned an empty response (stop_reason=${res.stop_reason})`);
    return {
      text,
      inputTokens: res.usage?.input_tokens ?? 0,
      outputTokens: res.usage?.output_tokens ?? 0
    };
  }
};
var GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
var GeminiChat = class {
  constructor(apiKey, model) {
    this.apiKey = apiKey;
    this.model = model;
  }
  apiKey;
  model;
  provider = "gemini";
  async chat(req) {
    const generationConfig = { maxOutputTokens: (req.maxTokens ?? 8e3) * 3 };
    if (req.json) generationConfig.responseMimeType = "application/json";
    const res = await postJson(
      `${GEMINI_BASE}/models/${encodeURIComponent(this.model)}:generateContent`,
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.user }] }],
        generationConfig
      },
      { "x-goog-api-key": this.apiKey }
    );
    const cand = res.candidates?.[0];
    const text = (cand?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
    if (!text.trim()) {
      throw new Error(
        `Gemini returned an empty response (finishReason=${cand?.finishReason}, block=${res.promptFeedback?.blockReason})`
      );
    }
    return {
      text,
      inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0
    };
  }
};
var GeminiEmbedder = class {
  constructor(apiKey, model, dimensions = 768) {
    this.apiKey = apiKey;
    this.model = model;
    this.dimensions = dimensions;
  }
  apiKey;
  model;
  dimensions;
  provider = "gemini";
  batchSize = 100;
  async embed(texts) {
    const name = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    const res = await postJson(
      `${GEMINI_BASE}/${name}:batchEmbedContents`,
      {
        requests: texts.map((t) => ({
          model: name,
          content: { parts: [{ text: t.slice(0, 8e3) }] },
          outputDimensionality: this.dimensions
        }))
      },
      { "x-goog-api-key": this.apiKey }
    );
    return res.embeddings.map((e) => e.values);
  }
};

// src/llm/mock.ts
var PATTERNS = [
  {
    re: /\beval\s*\(/,
    severity: "critical",
    category: "security",
    title: "eval() on dynamic input allows code injection",
    body: "Evaluating strings at runtime lets attacker-controlled input execute arbitrary code. Parse the data instead."
  },
  {
    re: /(password|secret|api_?key)\s*[:=]\s*["'][^"']+["']/i,
    severity: "critical",
    category: "security",
    title: "Hard-coded credential",
    body: "Secrets committed to source control are exposed to anyone with repo access. Load it from the environment."
  },
  {
    re: /[^=!]==\s*null|[^=!]!=\s*null/,
    severity: "medium",
    category: "bug",
    title: "Loose null comparison",
    body: "`== null` also matches `undefined`; use a strict comparison if that is not intended.",
    fix: (s) => s.replace(/([^=!])==(\s*null)/, "$1===$2").replace(/([^=!])!=(\s*null)/, "$1!==$2")
  },
  {
    re: /console\.log\(/,
    severity: "low",
    category: "maintainability",
    title: "Debug logging left in code",
    body: "This `console.log` looks like leftover debugging output."
  }
];
var MockChat = class {
  provider = "mock";
  model = "mock";
  async chat(req) {
    const label = req.label ?? "";
    let text;
    if (label.startsWith("review:")) text = JSON.stringify(this.review(req.user));
    else if (label.startsWith("verify:")) {
      const ids = [...req.user.matchAll(/^(\d+)\. \[/gm)].map((m) => ({ id: Number(m[1]), confidence: 0.9 }));
      text = JSON.stringify({ keep: ids });
    } else if (label === "summary") {
      const files = (req.user.match(/^- .+? \(/gm) ?? []).length;
      text = JSON.stringify({
        overview: `Mock overview of a PR touching ${files} file(s).`,
        key_changes: ["Mock key change one", "Mock key change two"],
        confidence: /\[critical\]|\[high\]/.test(req.user) ? 2 : 4,
        confidence_reason: "Mock reasoning based on the issues found.",
        diagram: "sequenceDiagram\n  participant A\n  participant B\n  A->>B: call"
      });
    } else {
      const sections = (req.user.match(/^### /gm) ?? []).length;
      text = `Mock answer using ${sections} context section(s).`;
    }
    return { text, inputTokens: Math.ceil((req.system.length + req.user.length) / 4), outputTokens: Math.ceil(text.length / 4) };
  }
  review(prompt) {
    const files = [];
    const findings = [];
    const sections = prompt.split(/^=+ FILE: /m).slice(1);
    for (const sec of sections) {
      const path2 = sec.slice(0, sec.indexOf(" ("));
      files.push({ path: path2, summary: `Mock summary of changes in ${path2}.` });
      const diff = sec.split("## Repository context")[0];
      for (const m of diff.matchAll(/^L(\d+) \+ (.*)$/gm)) {
        const line = Number(m[1]);
        for (const p of PATTERNS) {
          if (p.re.test(m[2])) {
            findings.push({
              path: path2,
              line,
              end_line: null,
              severity: p.severity,
              category: p.category,
              title: p.title,
              body: p.body,
              suggestion: p.fix ? p.fix(m[2]) : null,
              confidence: 0.85
            });
            break;
          }
        }
      }
    }
    return { files, findings };
  }
};
var MockEmbedder = class {
  provider = "mock";
  model = "mock-embed";
  batchSize = 256;
  async embed(texts) {
    return texts.map((t) => {
      const v = new Array(64).fill(0);
      for (const tok of tokenize(t)) {
        let h = 2166136261;
        for (let i = 0; i < tok.length; i++) h = Math.imul(h ^ tok.charCodeAt(i), 16777619);
        v[Math.abs(h) % 64] += 1;
      }
      return v;
    });
  }
};

// src/llm/types.ts
var BudgetExceededError = class extends Error {
  constructor(msg) {
    super(msg);
    this.name = "BudgetExceededError";
  }
};

// src/llm/index.ts
var DEFAULT_MODELS = {
  openai: "gpt-5.5",
  anthropic: "claude-sonnet-5-5",
  gemini: "gemini-3.8-flash",
  mock: "mock"
};
var DEFAULT_EMBEDDING_MODELS = {
  openai: "text-embedding-3-small",
  gemini: "gemini-embedding-2"
};
function keysFromEnv(env = process.env) {
  return {
    openai: env.OPENAI_API_KEY || void 0,
    anthropic: env.ANTHROPIC_API_KEY || void 0,
    gemini: env.GEMINI_API_KEY || env.GOOGLE_API_KEY || void 0
  };
}
function resolveProvider(cfg, keys) {
  if (cfg.provider !== "auto") return cfg.provider;
  if (cfg.base_url) {
    if (keys.openai) return "openai";
    throw new Error("base_url is set but OPENAI_API_KEY (the key for that endpoint) is not");
  }
  if (keys.anthropic) return "anthropic";
  if (keys.openai) return "openai";
  if (keys.gemini) return "gemini";
  throw new Error(
    "No LLM API key found. Set one of OPENAI_API_KEY, ANTHROPIC_API_KEY or GEMINI_API_KEY (or the matching action input)."
  );
}
var TrackedLLM = class {
  constructor(inner, maxTotalInputTokens) {
    this.inner = inner;
    this.maxTotalInputTokens = maxTotalInputTokens;
  }
  inner;
  maxTotalInputTokens;
  usage = { calls: 0, inputTokens: 0, outputTokens: 0, embeddingTexts: 0 };
  get provider() {
    return this.inner.provider;
  }
  get model() {
    return this.inner.model;
  }
  async chat(req) {
    const approx = Math.ceil((req.system.length + req.user.length) / 4);
    if (this.usage.inputTokens + approx > this.maxTotalInputTokens) {
      throw new BudgetExceededError(
        `Token budget reached (${this.usage.inputTokens.toLocaleString()} / ${this.maxTotalInputTokens.toLocaleString()} input tokens). Raise limits.max_total_input_tokens to review more.`
      );
    }
    const t0 = Date.now();
    const res = await this.inner.chat(req);
    const dump = process.env.AMCHI_DUMP_PROMPTS;
    if (dump) {
      mkdirSync3(dump, { recursive: true });
      const name = `${String(this.usage.calls + 1).padStart(3, "0")}-${(req.label ?? "call").replace(/[^\w.-]+/g, "_").slice(0, 80)}.md`;
      writeFileSync3(join6(dump, name), `# SYSTEM
${req.system}

# USER
${req.user}

# RESPONSE
${res.text}
`);
    }
    this.usage.calls++;
    this.usage.inputTokens += res.inputTokens || approx;
    this.usage.outputTokens += res.outputTokens;
    log.debug(
      `[llm] ${req.label ?? "call"} in=${res.inputTokens} out=${res.outputTokens} ${Date.now() - t0}ms`
    );
    return res;
  }
};
function createLLM(cfg, keys) {
  const provider = resolveProvider(cfg, keys);
  const model = cfg.model || DEFAULT_MODELS[provider];
  let inner;
  switch (provider) {
    case "openai":
      if (!keys.openai) throw new Error("provider is openai but OPENAI_API_KEY is not set");
      inner = new OpenAIChat(keys.openai, model, cfg.base_url || void 0);
      break;
    case "anthropic":
      if (!keys.anthropic) throw new Error("provider is anthropic but ANTHROPIC_API_KEY is not set");
      if (cfg.base_url) log.warn("base_url only applies to the openai provider; ignoring it for anthropic");
      inner = new AnthropicChat(keys.anthropic, model);
      break;
    case "gemini":
      if (!keys.gemini) throw new Error("provider is gemini but GEMINI_API_KEY is not set");
      inner = new GeminiChat(keys.gemini, model);
      break;
    case "mock":
      inner = new MockChat();
      break;
  }
  log.info(`LLM: ${provider} / ${model}`);
  return new TrackedLLM(inner, cfg.limits.max_total_input_tokens);
}
function createEmbedder(cfg, keys) {
  let choice = cfg.embeddings;
  if (choice === "off") return null;
  if (cfg.provider === "mock") return new MockEmbedder();
  if (choice === "auto") {
    if (keys.openai && !(cfg.provider === "openai" && cfg.base_url)) choice = "openai";
    else if (keys.gemini) choice = "gemini";
    else {
      log.info("Embeddings: off (no OpenAI or Gemini key) \u2014 using keyword + graph retrieval");
      return null;
    }
  }
  if (choice === "openai") {
    if (!keys.openai) return null;
    const model = cfg.embedding_model || DEFAULT_EMBEDDING_MODELS.openai;
    log.info(`Embeddings: openai / ${model}`);
    return new OpenAIEmbedder(keys.openai, model);
  }
  if (choice === "gemini") {
    if (!keys.gemini) return null;
    const model = cfg.embedding_model || DEFAULT_EMBEDDING_MODELS.gemini;
    log.info(`Embeddings: gemini / ${model}`);
    return new GeminiEmbedder(keys.gemini, model);
  }
  return null;
}

// src/review/render.ts
var SUMMARY_MARKER = "<!-- amchi:summary -->";
var FP_MARKER = (fp) => `<!-- amchi:fp=${fp} -->`;
var FP_RE = /<!-- (?:amchi|takche):fp=([a-f0-9]+) -->/;
var defaultBadges = "image";
var PRIORITY = {
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  info: "P4"
};
var PRIORITY_COLOR = {
  critical: "d73a49",
  high: "e36209",
  medium: "dbab09",
  low: "0969da",
  info: "6e7781"
};
function badge(sev, style = defaultBadges) {
  const p = PRIORITY[sev];
  if (style === "text") return `**[${p}]**`;
  return `<img src="https://img.shields.io/badge/${p}-${PRIORITY_COLOR[sev]}?style=flat-square" alt="${p}" title="${p} \xB7 ${sev}" valign="middle">`;
}
var FIX_INSTRUCTION = "For each issue above, determine whether it is valid and should be fixed. If so, fix it directly.";
function location(f) {
  if (f.line <= 1 && !f.endLine) return f.path;
  return f.endLine && f.endLine > f.line ? `${f.path}:${f.line}-${f.endLine}` : `${f.path}:${f.line}`;
}
function fence(text, lang = "") {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const f = "`".repeat(longest + 1);
  return `${f}${lang}
${text}
${f}`;
}
function fixPrompt(f) {
  const lines = [
    "This is a comment left during a code review.",
    `Path: ${f.path}`,
    `Line: ${f.endLine && f.endLine > f.line ? `${f.line}-${f.endLine}` : f.line}`,
    "",
    "Comment:",
    `**${escapeInline(f.title)}**`,
    "",
    f.body.trim()
  ];
  if (f.suggestion !== void 0) lines.push("", "Suggested replacement for the lines above:", f.suggestion);
  lines.push("", "---", "", FIX_INSTRUCTION);
  return lines.join("\n");
}
function fixAllPrompt(findings) {
  const parts = [];
  findings.forEach((f, i) => {
    parts.push(`### Issue ${i + 1}`, location(f), `**${escapeInline(f.title)}**`, "", f.body.trim());
    if (f.suggestion !== void 0) parts.push("", "Suggested replacement:", f.suggestion);
    parts.push("");
  });
  parts.push("---", "", FIX_INSTRUCTION);
  return parts.join("\n");
}
function renderInlineComment(f, opts = {}) {
  const parts = [`${badge(f.severity, opts.badges)} **${escapeInline(f.title)}**`, "", f.body.trim()];
  if (f.suggestion !== void 0) {
    parts.push("", "```suggestion", f.suggestion, "```");
  }
  parts.push("", "<details>", "<summary>Prompt To Fix With AI</summary>", "", fence(fixPrompt(f)), "", "</details>");
  parts.push("", FP_MARKER(f.fingerprint));
  return parts.join("\n");
}
function encodeState(s) {
  const files = {};
  let size = 0;
  for (const [k, v] of Object.entries(s.files ?? {})) {
    const add = k.length + v.length + 8;
    if (size + add > 2e4) break;
    files[k] = v.slice(0, 300);
    size += add;
  }
  const issues = Object.fromEntries(Object.entries(s.issues ?? {}).slice(-500));
  return JSON.stringify({ ...s, files, issues }).replace(/--/g, "&#45;&#45;");
}
function escapeInline(s) {
  return s.replace(/\r?\n/g, " ");
}
function cell(s) {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
function riskLabel(confidence) {
  if (confidence >= 5) return "Low risk";
  if (confidence === 4) return "Low risk";
  if (confidence === 3) return "Medium risk";
  if (confidence === 2) return "High risk";
  return "Very high risk";
}
function renderSummary(out2, meta, state, opts = {}) {
  const L = [SUMMARY_MARKER];
  const s = out2.summary;
  if (s) {
    L.push(`## Confidence Score: ${s.confidence}/5`, "");
    const overview = s.overview.trim();
    L.push(`**[${riskLabel(s.confidence)}]** ${overview}`, "");
    if (s.confidence_reason) L.push(s.confidence_reason.trim(), "");
    if (s.key_changes.length) {
      L.push("<details>", "<summary>Key changes</summary>", "");
      for (const k of s.key_changes) L.push(`- ${k}`);
      L.push("", "</details>", "");
    }
  } else {
    L.push("## Code review", "");
  }
  const issues = { ...state.issues ?? {} };
  const current = [...out2.inline, ...out2.outside].sort((a, b) => rank(b.severity) - rank(a.severity));
  const newCount = current.filter((f) => !issues[f.fingerprint]).length;
  for (const f of current) issues[f.fingerprint] = f.severity;
  L.push("## Findings", "");
  if (current.length) {
    current.forEach((f, i) => {
      const url = meta.commentUrls?.[f.fingerprint];
      const where = url ? ` [\u25B6](${url})` : ` <sub>\`${location(f)}\`</sub>`;
      L.push(`${i + 1}. ${badge(f.severity, opts.badges)} **${escapeInline(f.title)}**${where}`);
    });
    L.push("");
    const counts = /* @__PURE__ */ new Map();
    for (const sev of Object.values(issues)) counts.set(sev, (counts.get(sev) ?? 0) + 1);
    const countText = ["critical", "high", "medium", "low", "info"].filter((k) => counts.get(k)).map((k) => `${counts.get(k)} ${PRIORITY[k]}`).join(" \xB7 ");
    const total = Object.keys(issues).length;
    if (meta.incrementalFrom && total > current.length) {
      L.push(`<sub>${newCount} new in this update \xB7 ${total} total on this PR (${countText})</sub>`, "");
    }
    L.push("<details>", "<summary>Fix with agent prompt</summary>", "", fence(fixAllPrompt(current), "markdown"), "", "</details>", "");
  } else {
    L.push("No issues found. \u{1F389}", "");
  }
  if (s?.diagram) {
    L.push("<details><summary>\u{1F4CA} Sequence diagram</summary>", "", "```mermaid", s.diagram, "```", "", "</details>", "");
  }
  const fileSummaries = { ...state.files ?? {}, ...out2.fileSummaries };
  const files = meta.allFiles;
  if (files.length) {
    L.push(`<details><summary>\u{1F4C2} Files changed (${files.length})</summary>`, "", "| File | Changes | Summary |", "| --- | --- | --- |");
    for (const f of files.slice(0, 120)) {
      const skip = out2.skipped.find((x) => x.path === f.path);
      const sum = fileSummaries[f.path] ?? (skip ? `_skipped: ${skip.reason}_` : f.status === "deleted" ? "_deleted_" : "");
      L.push(`| \`${cell(f.path)}\` | +${f.additions} / -${f.deletions} | ${cell(sum)} |`);
    }
    if (files.length > 120) L.push(`| \u2026 | | ${files.length - 120} more files |`);
    L.push("", "</details>", "");
  }
  const notes = [];
  if (out2.failed.length) notes.push(`\u26A0\uFE0F Review failed for ${out2.failed.length} file(s): ${out2.failed.map((p) => `\`${p}\``).join(", ")}`);
  if (out2.budgetHit) notes.push("\u26A0\uFE0F Token budget reached \u2014 some files were not reviewed (raise `limits.max_total_input_tokens`).");
  const limitSkipped = out2.skipped.filter((x) => x.reason === "max_files limit");
  if (limitSkipped.length) notes.push(`\u2139\uFE0F ${limitSkipped.length} file(s) skipped by \`review.max_files\`.`);
  if (out2.dropped > 0) notes.push(`\u2139\uFE0F ${out2.dropped} lower-priority finding(s) not posted (thresholds / \`max_comments\`).`);
  if (notes.length) L.push(...notes.map((n) => `${n}  `), "");
  const reviews = (state.reviews ?? 0) + 1;
  const range2 = meta.incrementalFrom ? `${meta.incrementalFrom.slice(0, 7)}\u2026${meta.headSha.slice(0, 7)} (incremental)` : `${meta.baseSha.slice(0, 7)}\u2026${meta.headSha.slice(0, 7)}`;
  const commit = meta.headSubject ? `"${truncate(escapeInline(meta.headSubject), 60)}"` : meta.headSha.slice(0, 7);
  const u = meta.usage;
  L.push(
    `<sub>Reviews (${reviews}) \xB7 Last reviewed commit: ${commit} \xB7 Reviewed by ${meta.botName ?? "Amchi"}</sub>`,
    `<sub>${range2} \xB7 ${meta.provider}/${meta.model} \xB7 ${u.calls} LLM call(s), ${fmtK(u.inputTokens)} in / ${fmtK(u.outputTokens)} out tokens \xB7 Ask a question with \`${meta.trigger} <question>\`, re-run with \`${meta.trigger} review\`.</sub>`
  );
  const complete = !out2.failed.length && !out2.budgetHit;
  const lastSha = complete ? meta.headSha : state.lastSha;
  L.push(`<!-- amchi:state ${encodeState({ lastSha, files: fileSummaries, issues, reviews })} -->`);
  return L.join("\n");
}
function rank(s) {
  return ["info", "low", "medium", "high", "critical"].indexOf(s);
}
function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}\u2026` : s;
}
function fmtK(n) {
  return n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : String(n);
}
function renderLocalReport(out2, meta) {
  const opts = { badges: "text" };
  const summary = renderSummary(out2, meta, {}, opts).split("\n").filter((l) => !l.startsWith("<!--")).join("\n");
  const L = [summary, "", "---", "", `## Inline comments (${out2.inline.length})`, ""];
  for (const f of out2.inline) {
    L.push(`### ${location(f)}`, renderInlineComment(f, opts).replace(FP_RE, "").trim(), "");
  }
  return L.join("\n");
}

// src/llm/json.ts
function parseModelJson(text) {
  const candidates = [];
  const fence2 = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence2) candidates.push(fence2[1]);
  const balanced2 = extractBalanced(text);
  if (balanced2) candidates.push(balanced2);
  candidates.push(text);
  let lastErr;
  for (const c of candidates) {
    for (const variant of [c, repair(c)]) {
      try {
        return JSON.parse(variant.trim());
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw new Error(`Model did not return valid JSON: ${lastErr?.message}. Got: ${text.slice(0, 300)}`);
}
function extractBalanced(text) {
  const start2 = text.search(/[{[]/);
  if (start2 < 0) return null;
  const open = text[start2];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc2 = false;
  for (let i = start2; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc2) esc2 = false;
      else if (ch === "\\") esc2 = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start2, i + 1);
    }
  }
  return null;
}
function repair(s) {
  return s.replace(/,\s*([}\]])/g, "$1");
}

// src/review/context.ts
var COMMON_NAMES = /* @__PURE__ */ new Set([
  "map",
  "filter",
  "reduce",
  "forEach",
  "find",
  "findIndex",
  "some",
  "every",
  "includes",
  "indexOf",
  "slice",
  "splice",
  "push",
  "pop",
  "shift",
  "unshift",
  "concat",
  "join",
  "split",
  "replace",
  "match",
  "test",
  "exec",
  "trim",
  "keys",
  "values",
  "entries",
  "get",
  "set",
  "has",
  "delete",
  "add",
  "clear",
  "then",
  "catch",
  "finally",
  "toString",
  "valueOf",
  "call",
  "apply",
  "bind",
  "log",
  "warn",
  "error",
  "info",
  "debug",
  "parse",
  "stringify",
  "from",
  "of",
  "append",
  "extend",
  "insert",
  "remove",
  "update",
  "items",
  "format",
  "len",
  "print",
  "str",
  "int",
  "list",
  "dict",
  "range",
  "open",
  "close",
  "read",
  "write",
  "send",
  "emit",
  "on",
  "off",
  "next",
  "resolve",
  "reject",
  "assert",
  "equal",
  "expect",
  "toBe",
  "toEqual",
  "it",
  "describe",
  "test",
  "new",
  "make",
  "Println",
  "Printf",
  "Errorf",
  "String",
  "Error",
  "length",
  "size",
  "sort",
  "reverse",
  "copy",
  "clone",
  "unwrap",
  "expect",
  "into",
  "iter",
  "collect",
  "to_string",
  "as_str",
  "Ok",
  "Err",
  "Some",
  "None"
]);
var DEF_RE = /\b(?:function|def|func|class|fn|interface|type|struct|enum|trait)\s+([A-Za-z_$][\w$]*)/;
function rawSnippet(graph, path2, start2, end, maxLines = 60) {
  const content = graph.read(path2);
  if (content == null) return null;
  const e = Math.min(end, start2 + maxLines - 1);
  const body2 = numberLines(lineSlice(content, start2, e), start2);
  const more = end > e ? `
      \u2026 (${end - e} more lines)` : "";
  return `\`${path2}:${start2}-${end}\`
\`\`\`
${body2}${more}
\`\`\``;
}
function callSiteLine(graph, path2, sym, name) {
  const content = graph.read(path2);
  if (!content) return null;
  const lines = content.split("\n");
  const re = new RegExp(`\\b${name.replace(/[$]/g, "\\$")}\\s*[(<{!]|\\bnew\\s+${name.replace(/[$]/g, "\\$")}\\b`);
  for (let i = sym.start; i <= Math.min(sym.end, lines.length); i++) {
    if (re.test(lines[i - 1])) return i;
  }
  return null;
}
async function buildFileContext(fd, graph, searcher, budget, prPaths) {
  const sections = [];
  const path2 = fd.path;
  const seen = [];
  const overlapsSeen = (p, s, e) => seen.some((x) => x.path === p && x.start <= e && x.end >= s);
  const snippet = (p, s, e, maxLines = 60) => {
    const sn = rawSnippet(graph, p, s, e, maxLines);
    if (sn) seen.push({ path: p, start: s, end: e });
    return sn;
  };
  const entry = graph.file(path2);
  const ranges = changedRanges(fd);
  const addedText = fd.hunks.flatMap((h) => h.lines.filter((l) => l.type === "add").map((l) => l.text)).join("\n");
  const deletedText = fd.hunks.flatMap((h) => h.lines.filter((l) => l.type === "del").map((l) => l.text)).join("\n");
  const addedTokens = new Set(tokenize(addedText).concat(addedText.match(/[A-Za-z_$][\w$]*/g) ?? []));
  const changedSyms = /* @__PURE__ */ new Map();
  if (entry && fd.status !== "deleted") {
    for (const [s, e] of ranges) {
      const syms = graph.symbolsOverlapping(path2, s, e);
      const inner = [...syms].reverse().find((x) => x.end - x.start < 250) ?? syms[syms.length - 1];
      if (inner) changedSyms.set(`${inner.name}@${inner.start}`, inner);
      for (const x of syms) if (!["class", "module", "namespace", "impl"].includes(x.kind)) changedSyms.set(`${x.name}@${x.start}`, x);
    }
    const shown = /* @__PURE__ */ new Set();
    for (const sym of changedSyms.values()) {
      if (sym.end - sym.start > 200) continue;
      const key = `${sym.start}-${sym.end}`;
      if (shown.has(key)) continue;
      shown.add(key);
      const sn = snippet(path2, sym.start, sym.end, 200);
      if (sn) sections.push({ title: `Full ${sym.kind} \`${sym.name}\` after the change`, body: sn, priority: 100 });
    }
  }
  if (entry) {
    const calls = /* @__PURE__ */ new Set();
    for (const sym of changedSyms.values()) for (const c of sym.calls) if (addedTokens.has(c)) calls.add(c);
    for (const c of entry.topLevelCalls) if (addedTokens.has(c)) calls.add(c);
    let n = 0;
    for (const name of calls) {
      if (n >= 10) break;
      const all = graph.definitionsOf(name, path2).filter(
        (d2) => !(d2.path === path2 && [...changedSyms.values()].some((s) => s.start === d2.symbol.start))
      );
      const defs = all.filter((d2) => d2.path === path2 || graph.dependsOn(path2, d2.path));
      if (!defs.length && all.length === 1 && !COMMON_NAMES.has(name)) defs.push(all[0]);
      const d = defs[0];
      if (!d) continue;
      const sn = snippet(d.path, d.symbol.start, d.symbol.end, 40);
      if (sn) {
        sections.push({
          title: `Definition of \`${name}\` (called by the changed code)${defs.length > 1 ? ` \u2014 ${defs.length} definitions found, showing best match` : ""}`,
          body: sn,
          priority: 80 - n
        });
        n++;
      }
    }
  }
  {
    let n = 0;
    for (const sym of changedSyms.values()) {
      if (["class", "module", "namespace", "impl", "interface"].includes(sym.kind)) continue;
      if (COMMON_NAMES.has(sym.name)) continue;
      const unique = (graph.defsByName.get(sym.name)?.length ?? 0) <= 1;
      const relevant = graph.callersOf(sym.name).filter((c) => !(c.path === path2 && c.symbol.start === sym.start)).filter((c) => unique || c.path === path2 || graph.dependsOn(c.path, path2));
      const callers = relevant.slice(0, 6);
      if (!callers.length) continue;
      const parts = [];
      for (const c of callers) {
        const line = callSiteLine(graph, c.path, c.symbol, sym.name);
        if (line == null) continue;
        const sn = snippet(c.path, Math.max(c.symbol.start, line - 3), Math.min(c.symbol.end, line + 3), 8);
        if (sn) parts.push(`in \`${c.symbol.name}\`${prPaths.has(c.path) ? " (also changed in this PR)" : ""}:
${sn}`);
      }
      if (parts.length) {
        const total = relevant.length;
        sections.push({
          title: `Callers of \`${sym.name}\` (${total} total${total > parts.length ? `, showing ${parts.length}` : ""})`,
          body: parts.join("\n\n"),
          priority: 70 - n
        });
        n++;
      }
      if (n >= 5) break;
    }
  }
  {
    const removed = /* @__PURE__ */ new Set();
    for (const l of deletedText.split("\n")) {
      const m = l.match(DEF_RE);
      if (m && !graph.defsByName.has(m[1])) removed.add(m[1]);
    }
    for (const name of removed) {
      const refs = graph.callersOf(name).slice(0, 5);
      if (!refs.length) continue;
      const list = refs.map((r) => {
        const line = callSiteLine(graph, r.path, r.symbol, name);
        return `- \`${r.path}:${line ?? r.symbol.start}\` in \`${r.symbol.name}\``;
      }).join("\n");
      sections.push({
        title: `\u26A0 \`${name}\` was removed/renamed in this diff but is still referenced`,
        body: list,
        priority: 95
      });
    }
  }
  {
    const importers = graph.importersOf(path2);
    const tests = graph.testsFor(path2);
    const lines = [];
    if (importers.length) {
      lines.push(
        `Imported by ${importers.length} file(s): ${importers.slice(0, 10).map((p) => `\`${p}\``).join(", ")}${importers.length > 10 ? ", \u2026" : ""}`
      );
    }
    if (entry?.resolved.length) {
      lines.push(`Imports: ${entry.resolved.slice(0, 10).map((p) => `\`${p}\``).join(", ")}`);
    }
    if (tests.length) {
      const changed = tests.filter((t) => prPaths.has(t));
      lines.push(
        `Related tests: ${tests.map((t) => `\`${t}\``).join(", ")}${changed.length ? ` (updated in this PR: ${changed.join(", ")})` : " (not updated in this PR)"}`
      );
    }
    if (lines.length) sections.push({ title: "Dependencies", body: lines.join("\n"), priority: 60 });
  }
  if (addedText.trim().length > 40) {
    const query = [...changedSyms.values()].map((s) => s.name).join(" ") + "\n" + addedText.slice(0, 2e3);
    const hits = await searcher.search(
      query,
      6,
      (c) => c.path !== path2 && !!c.name && !overlapsSeen(c.path, c.start, c.end)
    );
    const parts = [];
    for (const h of hits.slice(0, 3)) {
      const sn = snippet(h.chunk.path, h.chunk.start, h.chunk.end, 30);
      if (sn) parts.push(sn);
    }
    if (parts.length) {
      sections.push({
        title: "Similar code elsewhere in the repo (check for duplication or established conventions)",
        body: parts.join("\n\n"),
        priority: 40
      });
    }
  }
  sections.sort((a, b) => b.priority - a.priority);
  const out2 = [];
  let used = 0;
  for (const s of sections) {
    const text = `### ${s.title}
${s.body}`;
    const t = estimateTokens(text);
    if (used + t > budget) continue;
    out2.push(text);
    used += t;
  }
  return out2.join("\n\n");
}

// src/review/reviewer.ts
function fingerprint(path2, title) {
  return shortHash(`${path2}|${title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`);
}
async function reviewPullRequest(input) {
  const { cfg, graph, searcher, llm, pr } = input;
  const skipped = [];
  const failed = [];
  let budgetHit = false;
  const prPaths = new Set(input.files.map((f) => f.path));
  let candidates = [];
  for (const f of input.files) {
    if (f.binary) skipped.push({ path: f.path, reason: "binary" });
    else if (f.status === "deleted") skipped.push({ path: f.path, reason: "deleted" });
    else if (!isReviewable(f.path, cfg)) skipped.push({ path: f.path, reason: "ignored by config" });
    else if (!f.hunks.some((h) => h.lines.some((l) => l.type !== "ctx"))) skipped.push({ path: f.path, reason: "no content changes" });
    else candidates.push(f);
  }
  candidates.sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
  if (candidates.length > cfg.review.max_files) {
    for (const f of candidates.slice(cfg.review.max_files)) skipped.push({ path: f.path, reason: "max_files limit" });
    candidates = candidates.slice(0, cfg.review.max_files);
  }
  const outside = [];
  for (const f of (input.allFiles ?? input.files).filter((x) => x.status === "deleted" || x.status === "renamed" && x.oldPath)) {
    const gone = f.status === "deleted" ? f.path : f.oldPath;
    if (graph.file(gone)) continue;
    const importers = graph.importersOfMissing(gone);
    if (importers.length) {
      const title = `\`${gone}\` was ${f.status === "deleted" ? "deleted" : "moved"} but is still imported`;
      outside.push({
        path: importers[0],
        line: 1,
        severity: "high",
        category: "breaking-change",
        title,
        body: `Still imported by: ${importers.slice(0, 8).map((p) => `\`${p}\``).join(", ")}`,
        confidence: 0.9,
        fingerprint: fingerprint(gone, title)
      });
    }
  }
  const perCall = cfg.limits.max_input_tokens_per_call;
  const header = renderPrHeader(pr);
  const headerTokens = estimateTokens(header) + 2500;
  const maxDiffPerBatch = Math.floor((perCall - headerTokens) * 0.45);
  const batches = [];
  let cur = { files: [], diffs: /* @__PURE__ */ new Map(), diffTokens: 0 };
  for (const f of candidates) {
    let d = renderDiffForModel(f);
    let t = estimateTokens(d);
    if (t > maxDiffPerBatch) {
      d = truncateTokens(d, maxDiffPerBatch);
      t = maxDiffPerBatch;
      log.warn(`Diff for ${f.path} is very large; reviewing a truncated version`);
    }
    if (cur.files.length && (cur.diffTokens + t > maxDiffPerBatch || cur.files.length >= 5)) {
      batches.push(cur);
      cur = { files: [], diffs: /* @__PURE__ */ new Map(), diffTokens: 0 };
    }
    cur.files.push(f);
    cur.diffs.set(f.path, d);
    cur.diffTokens += t;
  }
  if (cur.files.length) batches.push(cur);
  log.info(`Reviewing ${candidates.length} file(s) in ${batches.length} LLM call(s)`);
  const fileSummaries = { ...input.previousFileSummaries ?? {} };
  const raw = [];
  const batchPrompts = [];
  await mapLimit(batches, cfg.limits.concurrency, async (batch, bi) => {
    const ctxBudget = Math.max(
      1500,
      Math.floor((perCall - headerTokens - batch.diffTokens) * 0.9 / batch.files.length)
    );
    const parts = [header];
    const rules = /* @__PURE__ */ new Map();
    for (const f of batch.files) for (const r of rulesForPath(f.path, cfg)) rules.set(r.rule, r);
    const rulesText = renderRules([...rules.values()]);
    if (rulesText) parts.push(rulesText);
    for (const f of batch.files) {
      let ctx = "";
      try {
        ctx = await buildFileContext(f, graph, searcher, ctxBudget, prPaths);
      } catch (e) {
        log.warn(`Context retrieval failed for ${f.path}: ${e.message}`);
      }
      parts.push(
        `
==================== FILE: ${f.path} (${f.status}${f.oldPath && f.oldPath !== f.path ? ` from ${f.oldPath}` : ""}) ====================
## Diff
\`\`\`diff
${batch.diffs.get(f.path)}
\`\`\`
` + (ctx ? `
## Repository context for ${f.path}
${ctx}
` : "")
      );
    }
    parts.push(
      `
Review the ${batch.files.length === 1 ? "file" : `${batch.files.length} files`} above. Return a "files" entry for each of: ${batch.files.map((f) => f.path).join(", ")}.`
    );
    const user = parts.join("\n");
    batchPrompts[bi] = user;
    try {
      const res = await llm.chat({
        system: REVIEW_SYSTEM(cfg),
        user,
        json: true,
        maxTokens: cfg.limits.max_output_tokens,
        label: `review:${batch.files.map((f) => f.path).join(",")}`
      });
      const parsed = parseModelJson(res.text);
      for (const s of parsed.files ?? []) if (s.path && s.summary) fileSummaries[s.path] = s.summary;
      for (const rf of parsed.findings ?? []) {
        const f = normalizeFinding(rf, batch.files);
        if (f) raw.push({ finding: f, batch: bi });
      }
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        budgetHit = true;
        for (const f of batch.files) skipped.push({ path: f.path, reason: "token budget reached" });
        log.warn(e.message);
      } else {
        failed.push(...batch.files.map((f) => f.path));
        log.warn(`Review call failed for ${batch.files.map((f) => f.path).join(", ")}: ${e.message}`);
      }
    }
  });
  let findings = raw;
  if (input.verify && raw.length) {
    findings = await verifyFindings(llm, cfg, raw, batchPrompts);
  }
  const byPath = new Map(candidates.map((f) => [f.path, f]));
  const anchorByPath = new Map((input.anchorFiles ?? []).map((f) => [f.path, f]));
  const inlineAll = [];
  for (const { finding } of findings) {
    const fd = anchorByPath.get(finding.path) ?? byPath.get(finding.path);
    if (!fd) continue;
    const anchored = anchor(finding, fd, cfg);
    if (anchored) inlineAll.push(anchored);
    else outside.push(finding);
  }
  const minSev = severityRank(cfg.review.min_severity);
  const passing = dedupe(inlineAll).filter(
    (f) => severityRank(f.severity) >= minSev && f.confidence >= cfg.review.min_confidence
  );
  passing.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.confidence - a.confidence);
  const inline = passing.slice(0, cfg.review.max_comments);
  const dropped = inlineAll.length - inline.length;
  const outsideKept = dedupe(outside).filter((f) => severityRank(f.severity) >= minSev && f.confidence >= cfg.review.min_confidence);
  let summary = null;
  if (cfg.summary.enabled) {
    try {
      summary = await summarize(llm, cfg, pr, input.allFiles ?? input.files, fileSummaries, inline.concat(outsideKept), input.commits ?? []);
    } catch (e) {
      if (e instanceof BudgetExceededError) budgetHit = true;
      log.warn(`Summary generation failed: ${e.message}`);
    }
  }
  return {
    inline,
    outside: outsideKept,
    dropped: Math.max(0, dropped),
    fileSummaries,
    summary,
    reviewed: candidates.filter((f) => !failed.includes(f.path) && !skipped.some((s) => s.path === f.path)),
    skipped,
    failed,
    budgetHit
  };
}
function normalizeFinding(rf, files) {
  if (!rf || typeof rf.line !== "number" || !rf.title) return null;
  let path2 = rf.path;
  if (!path2 || !files.some((f) => f.path === path2)) {
    if (files.length === 1) path2 = files[0].path;
    else {
      const m = files.find((f) => path2 && (f.path.endsWith(path2) || path2.endsWith(f.path)));
      if (!m) return null;
      path2 = m.path;
    }
  }
  const severity = SEVERITY_ORDER.includes(String(rf.severity)) ? rf.severity : "medium";
  const title = String(rf.title).replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    path: path2,
    line: Math.round(rf.line),
    endLine: typeof rf.end_line === "number" && rf.end_line > rf.line ? Math.round(rf.end_line) : void 0,
    severity,
    category: String(rf.category ?? "bug"),
    title,
    body: String(rf.body ?? "").trim(),
    suggestion: typeof rf.suggestion === "string" && rf.suggestion.trim() ? rf.suggestion.replace(/\n+$/, "") : void 0,
    confidence: typeof rf.confidence === "number" ? Math.max(0, Math.min(1, rf.confidence)) : 0.7,
    fingerprint: fingerprint(path2, title)
  };
}
function anchor(f, fd, cfg) {
  const lines = commentableLines(fd);
  let line = f.line;
  if (!lines.has(line)) {
    let best = null;
    for (const n of lines.keys()) {
      if (Math.abs(n - line) <= 3 && (best === null || Math.abs(n - line) < Math.abs(best - line))) best = n;
    }
    if (best === null) return null;
    line = best;
  }
  const hunk = lines.get(line);
  let endLine = f.endLine;
  let suggestion = cfg.review.suggestions ? f.suggestion : void 0;
  if (endLine !== void 0) {
    let ok = endLine > line && endLine - line <= 40;
    for (let n = line; ok && n <= endLine; n++) if (lines.get(n) !== hunk) ok = false;
    if (!ok) {
      endLine = void 0;
      suggestion = void 0;
    }
  }
  if (line !== f.line) suggestion = void 0;
  return { ...f, line, endLine, suggestion };
}
function dedupe(list) {
  const out2 = [];
  for (const f of list) {
    const dup = out2.findIndex(
      (o) => o.path === f.path && (o.fingerprint === f.fingerprint || Math.abs(o.line - f.line) <= 2 && similar(o.title, f.title))
    );
    if (dup < 0) out2.push(f);
    else if (severityRank(f.severity) > severityRank(out2[dup].severity)) out2[dup] = f;
  }
  return out2;
}
function similar(a, b) {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.min(ta.size, tb.size) >= 0.6;
}
async function verifyFindings(llm, cfg, raw, prompts) {
  const byBatch = /* @__PURE__ */ new Map();
  raw.forEach((r, id) => (byBatch.get(r.batch) ?? byBatch.set(r.batch, []).get(r.batch)).push({ ...r, id }));
  const kept = [];
  await mapLimit([...byBatch.entries()], cfg.limits.concurrency, async ([bi, items]) => {
    const list = items.map((r) => `${r.id}. [${r.finding.severity}] ${r.finding.path}:${r.finding.line} \u2014 ${r.finding.title}
   ${r.finding.body.replace(/\n/g, "\n   ")}`).join("\n");
    try {
      const res = await llm.chat({
        system: VERIFY_SYSTEM,
        user: `${prompts[bi]}

## Findings to verify
${list}`,
        json: true,
        maxTokens: 2e3,
        label: `verify:${bi}`
      });
      const parsed = parseModelJson(res.text);
      const keep = new Map((parsed.keep ?? []).map((k) => [k.id, k.confidence]));
      for (const r of items) {
        if (!keep.has(r.id)) continue;
        const c = keep.get(r.id);
        kept.push({ batch: r.batch, finding: { ...r.finding, confidence: typeof c === "number" ? c : r.finding.confidence } });
      }
    } catch (e) {
      log.warn(`Verification failed for batch ${bi}, keeping its findings: ${e.message}`);
      kept.push(...items);
    }
  });
  log.info(`Verification kept ${kept.length}/${raw.length} findings`);
  return kept;
}
async function summarize(llm, cfg, pr, files, fileSummaries, findings, commits) {
  const fileLines = files.slice(0, 150).map((f) => `- ${f.path} (${f.status}, +${f.additions}/-${f.deletions})${fileSummaries[f.path] ? `: ${fileSummaries[f.path]}` : ""}`).join("\n");
  const findingLines = findings.length ? findings.map((f) => `- [${f.severity}] ${f.path}:${f.line} ${f.title}`).join("\n") : "(no issues found)";
  const user = `# ${pr.title}
${pr.body ? `
## Description
${pr.body.slice(0, 3e3)}
` : ""}
## Commits
${commits.slice(0, 40).map((c) => `- ${c.subject}`).join("\n") || "(n/a)"}

## Files
${fileLines}

## Issues found by the review
${findingLines}`;
  const res = await llm.chat({
    system: SUMMARY_SYSTEM(cfg),
    user: truncateTokens(user, 3e4),
    json: true,
    maxTokens: 3e3,
    label: "summary"
  });
  const s = parseModelJson(res.text);
  return {
    overview: String(s.overview ?? "").trim(),
    key_changes: Array.isArray(s.key_changes) ? s.key_changes.map(String).slice(0, 8) : [],
    confidence: Math.max(1, Math.min(5, Math.round(Number(s.confidence) || 3))),
    confidence_reason: String(s.confidence_reason ?? "").trim(),
    diagram: cfg.summary.diagram && typeof s.diagram === "string" && s.diagram.trim() ? s.diagram.trim().replace(/^```(?:mermaid)?\s*|```$/g, "").trim() : null
  };
}

// src/run.ts
async function runReview(input) {
  const git = new Git(input.root);
  const { cfg } = input;
  const mergeBase = git.mergeBase(input.baseSha, input.headSha) ?? input.baseSha;
  const allFiles = parseUnifiedDiff(git.diff(mergeBase, input.headSha));
  log.info(`PR diff ${mergeBase.slice(0, 7)}..${input.headSha.slice(0, 7)}: ${allFiles.length} file(s)`);
  let reviewFiles = allFiles;
  let incrementalFrom = input.incrementalFrom;
  if (incrementalFrom) {
    const prByPath = new Map(allFiles.map((f) => [f.path, f]));
    const delta = parseUnifiedDiff(git.diff(incrementalFrom, input.headSha)).filter((f) => prByPath.has(f.path)).map((f) => {
      const prAdded = new Set(addedLines(prByPath.get(f.path)));
      const hunks = f.hunks.filter((h) => h.lines.some((l) => l.type === "add" && prAdded.has(l.newNo)));
      return {
        ...f,
        hunks,
        additions: hunks.reduce((n, h) => n + h.lines.filter((l) => l.type === "add").length, 0),
        deletions: hunks.reduce((n, h) => n + h.lines.filter((l) => l.type === "del").length, 0)
      };
    }).filter((f) => f.hunks.length);
    if (delta.length) {
      reviewFiles = delta;
      log.info(`Incremental review of ${delta.length} file(s) changed since ${incrementalFrom.slice(0, 7)}`);
    } else {
      log.info("No PR files changed since the last review");
      reviewFiles = [];
    }
  }
  const workspace = input.workspace ?? await log.group("Indexing repository", () => openWorkspace(input.root, cfg, input.embedder, { commit: input.headSha }));
  const commits = git.log(mergeBase, input.headSha);
  const out2 = await log.group(
    "Reviewing",
    () => reviewPullRequest({
      files: reviewFiles,
      allFiles,
      anchorFiles: allFiles,
      previousFileSummaries: input.previousFileSummaries,
      pr: {
        title: input.title,
        body: input.body,
        changedFiles: allFiles.map((f) => ({ path: f.path, status: f.status, additions: f.additions, deletions: f.deletions }))
      },
      graph: workspace.graph,
      searcher: workspace.searcher,
      llm: input.llm,
      cfg,
      commits,
      verify: cfg.review.verify
    })
  );
  return { out: out2, allFiles, reviewFiles, mergeBase, incrementalFrom, workspace };
}

// src/util/relaunch.ts
import { spawnSync } from "node:child_process";
var FLAG = "--liftoff-only";
var MARK = "AMCHI_BASELINE_WASM";
function relaunchWithBaselineWasm() {
  if (process.env[MARK] || process.execArgv.includes(FLAG)) return;
  const probe = spawnSync(process.execPath, [FLAG, "-e", "0"], { stdio: "ignore" });
  if (probe.status !== 0) return;
  const child = spawnSync(process.execPath, [FLAG, ...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, [MARK]: "1" }
  });
  if (child.error) return;
  process.exit(child.status ?? 1);
}

// src/cli.ts
var HELP = `amchi \u2014 AI code review with a code graph

Usage:
  amchi review [--base <ref>] [--head <ref>] [options]
      Review the changes between base and head (default: merge-base with main..HEAD)
      and print a markdown report.
  amchi ask "<question>" [options]
      Ask a question about the repository.
  amchi index [options]
      Build or update the code graph cache (.amchi/).

Options:
  --repo <dir>        Repository root (default: current directory)
  --provider <name>   openai | anthropic | gemini | mock (default: auto from API keys)
  --model <id>        Model id (default depends on provider)
  --base-url <url>    OpenAI-compatible endpoint (Ollama, OpenRouter, Azure, \u2026)
  --config <file>     Config file (default: .codereview.yml)
  --title <text>      PR title to give the reviewer (default: latest commit subject)
  --verify            Run the false-positive verification pass
  --out <file>        Write the report to a file instead of stdout
  --json              Output raw JSON findings
  --debug             Verbose logs

API keys are read from OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY.
`;
function parseArgs(argv) {
  const pos = [];
  const flags2 = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== void 0 && !next.startsWith("--") && !["verify", "json", "debug", "help"].includes(key)) {
        flags2[key] = next;
        i++;
      } else flags2[key] = true;
    } else if (a === "-h") flags2.help = true;
    else pos.push(a);
  }
  return { pos, flags: flags2 };
}
function str(v) {
  return typeof v === "string" ? v : void 0;
}
function defaultBase(git) {
  for (const ref of ["origin/main", "origin/master", "main", "master", "origin/develop", "develop"]) {
    if (git.revParse(ref)) return ref;
  }
  return "HEAD~1";
}
async function main() {
  relaunchWithBaselineWasm();
  const { pos, flags: flags2 } = parseArgs(process.argv.slice(2));
  const cmd = pos[0];
  if (!cmd || flags2.help) {
    process.stdout.write(HELP);
    return;
  }
  if (flags2.debug) setVerbose(true);
  const root = resolve(str(flags2.repo) ?? process.cwd());
  const overrides = {};
  if (str(flags2.provider)) overrides.provider = str(flags2.provider);
  if (str(flags2.model)) overrides.model = str(flags2.model);
  if (str(flags2["base-url"])) overrides.base_url = str(flags2["base-url"]);
  if (flags2.verify) overrides.review = { verify: true };
  const cfg = loadConfig(root, str(flags2.config), overrides);
  const keys = keysFromEnv();
  const git = new Git(root);
  if (cmd === "index") {
    await openWorkspace(root, cfg, createEmbedder(cfg, keys), { commit: git.revParse("HEAD") ?? void 0 });
    return;
  }
  if (cmd === "ask") {
    const question = pos.slice(1).join(" ").trim();
    if (!question) throw new Error('Usage: amchi ask "<question>"');
    const llm = createLLM(cfg, keys);
    const ws = await openWorkspace(root, cfg, createEmbedder(cfg, keys));
    const answer = await answerQuestion({ question, graph: ws.graph, searcher: ws.searcher, llm });
    output(answer, flags2);
    return;
  }
  if (cmd === "review") {
    const base = str(flags2.base) ?? defaultBase(git);
    const head = str(flags2.head) ?? "HEAD";
    const baseSha = git.revParse(base);
    const headSha = git.revParse(head);
    if (!baseSha) throw new Error(`Unknown base ref: ${base}`);
    if (!headSha) throw new Error(`Unknown head ref: ${head}`);
    if (headSha !== git.revParse("HEAD")) {
      throw new Error(`--head ${head} is not the checked-out commit. Run "git checkout ${head}" first so the code graph matches the diff.`);
    }
    if (git.run(["status", "--porcelain", "--untracked-files=no"], { allowFail: true }).trim()) {
      log.warn("You have uncommitted changes; they are indexed for context but not reviewed. Commit them to review them.");
    }
    const llm = createLLM(cfg, keys);
    const embedder = createEmbedder(cfg, keys);
    const title = str(flags2.title) ?? git.run(["log", "-1", "--format=%s", headSha]).trim();
    const body2 = git.run(["log", "-1", "--format=%b", headSha]).trim();
    const res = await runReview({ root, cfg, llm, embedder, baseSha, headSha, title, body: body2 });
    if (flags2.json) {
      output(JSON.stringify({ ...res.out, reviewed: res.out.reviewed.map((f) => f.path), usage: llm.usage }, null, 2), flags2);
    } else {
      output(
        renderLocalReport(res.out, {
          baseSha: res.mergeBase,
          headSha,
          headSubject: title,
          provider: llm.provider,
          model: llm.model,
          usage: llm.usage,
          trigger: cfg.chat.trigger,
          allFiles: res.allFiles
        }),
        flags2
      );
    }
    log.info(`LLM usage: ${llm.usage.calls} call(s), ${llm.usage.inputTokens.toLocaleString()} in / ${llm.usage.outputTokens.toLocaleString()} out tokens`);
    return;
  }
  throw new Error(`Unknown command "${cmd}". Run with --help.`);
}
function output(text, flags2) {
  const out2 = str(flags2.out);
  if (out2) {
    writeFileSync4(out2, text);
    log.info(`Wrote ${out2}`);
  } else process.stdout.write(`${text}
`);
}
main().catch((e) => {
  log.error(e.message);
  process.exit(1);
});
