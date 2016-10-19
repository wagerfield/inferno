/*!
 * inferno-dom v1.0.0-beta4
 * (c) 2016 Dominic Gannaway
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('inferno')) :
    typeof define === 'function' && define.amd ? define(['inferno'], factory) :
    (global.InfernoDOM = factory(global.Inferno));
}(this, (function (inferno) { 'use strict';

var Lifecycle = function Lifecycle() {
    this._listeners = [];
};
Lifecycle.prototype.addListener = function addListener (callback) {
    this._listeners.push(callback);
};
Lifecycle.prototype.trigger = function trigger () {
        var this$1 = this;

    for (var i = 0; i < this._listeners.length; i++) {
        this$1._listeners[i]();
    }
};

var isUndefined$3 = inferno.common.isUndefined;
var isNull$6 = inferno.common.isNull;
var recyclingEnabled = true;
var vComponentPools = new Map();
function disableRecycling() {
    recyclingEnabled = false;
    vComponentPools.clear();
}
function recycleOptVElement(optVElement, lifecycle, context, isSVG, shallowUnmount) {
    var bp = optVElement.bp;
    var key = optVElement.key;
    var pool = key === null ? bp.pools.nonKeyed : bp.pools.keyed.get(key);
    if (!isUndefined$3(pool)) {
        var recycledOptVElement = pool.pop();
        if (!isUndefined$3(recycledOptVElement)) {
            patchOptVElement(recycledOptVElement, optVElement, null, lifecycle, context, isSVG, shallowUnmount);
            return optVElement.dom;
        }
    }
    return null;
}
function poolOptVElement(optVElement) {
    var bp = optVElement.bp;
    var key = optVElement.key;
    var pools = bp.pools;
    if (isNull$6(key)) {
        pools.nonKeyed.push(optVElement);
    }
    else {
        var pool = pools.keyed.get(key);
        if (isUndefined$3(pool)) {
            pool = [];
            pools.keyed.set(key, pool);
        }
        pool.push(optVElement);
    }
}
function recycleVComponent(vComponent, lifecycle, context, isSVG, shallowUnmount) {
    var component = vComponent.component;
    var key = vComponent.key;
    var pools = vComponentPools.get(component);
    if (!isUndefined$3(pools)) {
        var pool = key === null ? pools.nonKeyed : pools.keyed.get(key);
        if (!isUndefined$3(pool)) {
            var recycledVComponent = pool.pop();
            if (!isUndefined$3(recycledVComponent)) {
                var failed = patchVComponent(recycledVComponent, vComponent, null, lifecycle, context, isSVG, shallowUnmount);
                if (!failed) {
                    return vComponent.dom;
                }
            }
        }
    }
    return null;
}
function poolVComponent(vComponent) {
    var component = vComponent.component;
    var key = vComponent.key;
    var hooks = vComponent.hooks;
    var nonRecycleHooks = hooks && (hooks.onComponentWillMount ||
        hooks.onComponentWillUnmount ||
        hooks.onComponentDidMount ||
        hooks.onComponentWillUpdate ||
        hooks.onComponentDidUpdate);
    if (nonRecycleHooks) {
        return;
    }
    var pools = vComponentPools.get(component);
    if (isUndefined$3(pools)) {
        pools = {
            nonKeyed: [],
            keyed: new Map()
        };
        vComponentPools.set(component, pools);
    }
    if (isNull$6(key)) {
        pools.nonKeyed.push(vComponent);
    }
    else {
        var pool = pools.keyed.get(key);
        if (isUndefined$3(pool)) {
            pool = [];
            pools.keyed.set(key, pool);
        }
        pool.push(vComponent);
    }
}

var isNullOrUndef$5 = inferno.common.isNullOrUndef;
var isArray$4 = inferno.common.isArray;
var isNull$5 = inferno.common.isNull;
var isInvalid$5 = inferno.common.isInvalid;
var isFunction$1 = inferno.common.isFunction;
var throwError$4 = inferno.common.throwError;
var isObject$1 = inferno.common.isObject;
function unmount$1(input, parentDom, lifecycle, canRecycle, shallowUnmount) {
    if (!isInvalid$5(input)) {
        if (inferno.isOptVElement(input)) {
            unmountOptVElement(input, parentDom, lifecycle, canRecycle, shallowUnmount);
        }
        else if (inferno.isVComponent(input)) {
            unmountVComponent(input, parentDom, lifecycle, canRecycle, shallowUnmount);
        }
        else if (inferno.isVElement(input)) {
            unmountVElement(input, parentDom, lifecycle, shallowUnmount);
        }
        else if (inferno.isVFragment(input)) {
            unmountVFragment(input, parentDom, true, lifecycle, shallowUnmount);
        }
        else if (inferno.isVText(input)) {
            unmountVText(input, parentDom);
        }
        else if (inferno.isVPlaceholder(input)) {
            unmountVPlaceholder(input, parentDom);
        }
    }
}
function unmountVPlaceholder(vPlaceholder, parentDom) {
    if (parentDom) {
        removeChild(parentDom, vPlaceholder.dom);
    }
}
function unmountVText(vText, parentDom) {
    if (parentDom) {
        removeChild(parentDom, vText.dom);
    }
}
function unmountOptVElement(optVElement, parentDom, lifecycle, canRecycle, shallowUnmount) {
    var bp = optVElement.bp;
    var bp0 = bp.v0;
    if (!shallowUnmount) {
        if (!isNull$5(bp0)) {
            unmountOptVElementValue(optVElement, bp0, optVElement.v0, lifecycle, shallowUnmount);
            var bp1 = bp.v1;
            if (!isNull$5(bp1)) {
                unmountOptVElementValue(optVElement, bp1, optVElement.v1, lifecycle, shallowUnmount);
                var bp2 = bp.v2;
                if (!isNull$5(bp2)) {
                    unmountOptVElementValue(optVElement, bp2, optVElement.v2, lifecycle, shallowUnmount);
                }
            }
        }
    }
    if (!isNull$5(parentDom)) {
        parentDom.removeChild(optVElement.dom);
    }
    if (recyclingEnabled && (parentDom || canRecycle)) {
        poolOptVElement(optVElement);
    }
}
function unmountOptVElementValue(optVElement, valueType, value, lifecycle, shallowUnmount) {
    switch (valueType) {
        case inferno.ValueTypes.CHILDREN:
            unmountChildren(value, lifecycle, shallowUnmount);
            break;
        case inferno.ValueTypes.PROP_REF:
            unmountRef(value);
            break;
        case inferno.ValueTypes.PROP_SPREAD:
            unmountProps(value, lifecycle);
            break;
        default:
    }
}
function unmountVFragment(vFragment, parentDom, removePointer, lifecycle, shallowUnmount) {
    var children = vFragment.children;
    var childrenLength = children.length;
    var pointer = vFragment.pointer;
    if (!shallowUnmount && childrenLength > 0) {
        for (var i = 0; i < childrenLength; i++) {
            var child = children[i];
            if (inferno.isVFragment(child)) {
                unmountVFragment(child, parentDom, true, lifecycle, false);
            }
            else {
                unmount$1(child, parentDom, lifecycle, false, shallowUnmount);
            }
        }
    }
    if (parentDom && removePointer) {
        removeChild(parentDom, pointer);
    }
}
function unmountVComponent(vComponent, parentDom, lifecycle, canRecycle, shallowUnmount) {
    var instance = vComponent.instance;
    if (!shallowUnmount) {
        var instanceHooks = null;
        vComponent.unmounted = true;
        if (!isNullOrUndef$5(instance)) {
            var ref = vComponent.ref;
            if (ref) {
                ref(null);
            }
            instanceHooks = instance.hooks;
            if (instance.render !== undefined) {
                instance.componentWillUnmount();
                instance._unmounted = true;
                componentToDOMNodeMap.delete(instance);
                unmount$1(instance._lastInput, null, lifecycle, false, shallowUnmount);
            }
            else {
                unmount$1(instance, null, lifecycle, false, shallowUnmount);
            }
        }
        var hooks = vComponent.hooks || instanceHooks;
        if (!isNullOrUndef$5(hooks)) {
            if (!isNullOrUndef$5(hooks.onComponentWillUnmount)) {
                hooks.onComponentWillUnmount();
            }
        }
    }
    if (parentDom) {
        var lastInput = instance._lastInput;
        if (isNullOrUndef$5(lastInput)) {
            lastInput = instance;
        }
        if (inferno.isVFragment(lastInput)) {
            unmountVFragment(lastInput, parentDom, true, lifecycle, true);
        }
        else {
            removeChild(parentDom, vComponent.dom);
        }
    }
    if (recyclingEnabled && (parentDom || canRecycle)) {
        poolVComponent(vComponent);
    }
}
function unmountVElement(vElement, parentDom, lifecycle, shallowUnmount) {
    var dom = vElement.dom;
    var ref = vElement.ref;
    if (!shallowUnmount) {
        if (ref) {
            unmountRef(ref);
        }
        var children = vElement.children;
        if (!isNullOrUndef$5(children)) {
            unmountChildren(children, lifecycle, shallowUnmount);
        }
    }
    if (parentDom) {
        removeChild(parentDom, dom);
    }
}
function unmountChildren(children, lifecycle, shallowUnmount) {
    if (isArray$4(children)) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (isObject$1(child)) {
                unmount$1(child, null, lifecycle, false, shallowUnmount);
            }
        }
    }
    else if (isObject$1(children)) {
        unmount$1(children, null, lifecycle, false, shallowUnmount);
    }
}
function unmountRef(ref) {
    if (isFunction$1(ref)) {
        ref(null);
    }
    else {
        if (isInvalid$5(ref)) {
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            throwError$4('string "refs" are not supported in Inferno 0.8+. Use callback "refs" instead.');
        }
        throwError$4();
    }
}
function unmountProps(props, lifecycle) {
    for (var prop in props) {
        if (!props.hasOwnProperty(prop)) {
            continue;
        }
        var value = props[prop];
        if (prop === 'ref') {
            unmountRef(value);
        }
    }
}

function constructDefaults(string, object, value) {
    /* eslint no-return-assign: 0 */
    string.split(',').forEach(function (i) { return object[i] = value; });
}
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var svgNS = 'http://www.w3.org/2000/svg';
var strictProps = {};
var booleanProps = {};
var namespaces = {};
var isUnitlessNumber = {};
constructDefaults('xlink:href,xlink:arcrole,xlink:actuate,xlink:role,xlink:titlef,xlink:type', namespaces, xlinkNS);
constructDefaults('xml:base,xml:lang,xml:space', namespaces, xmlNS);
constructDefaults('volume,value,defaultValue,defaultChecked', strictProps, true);
constructDefaults('muted,scoped,loop,open,checked,default,capture,disabled,selected,readonly,multiple,required,autoplay,controls,seamless,reversed,allowfullscreen,novalidate', booleanProps, true);
constructDefaults('animationIterationCount,borderImageOutset,borderImageSlice,borderImageWidth,boxFlex,boxFlexGroup,boxOrdinalGroup,columnCount,flex,flexGrow,flexPositive,flexShrink,flexNegative,flexOrder,gridRow,gridColumn,fontWeight,lineClamp,lineHeight,opacity,order,orphans,tabSize,widows,zIndex,zoom,fillOpacity,floodOpacity,stopOpacity,strokeDasharray,strokeDashoffset,strokeMiterlimit,strokeOpacity,strokeWidth,', isUnitlessNumber, true);

var isFunction$2 = inferno.common.isFunction;
var isNull$7 = inferno.common.isNull;
var isUndefined$4 = inferno.common.isUndefined;
var devToolsStatus = {
    connected: false
};
var internalIncrementer = {
    id: 0
};
var componentIdMap = new Map();
function getIncrementalId() {
    return internalIncrementer.id++;
}
function sendToDevTools(global, data) {
    var event = new CustomEvent('inferno.client.message', {
        detail: JSON.stringify(data, function (key, val) {
            if (!isNull$7(val) && !isUndefined$4(val)) {
                if (key === '_vComponent' || !isUndefined$4(val.nodeType)) {
                    return;
                }
                else if (isFunction$2(val)) {
                    return ("$$f:" + (val.name));
                }
            }
            return val;
        })
    });
    global.dispatchEvent(event);
}
function rerenderRoots() {
    for (var i = 0; i < roots.length; i++) {
        var root = roots[i];
        render(root.input, root.dom);
    }
}
function initDevToolsHooks(global) {
    global.__INFERNO_DEVTOOLS_GLOBAL_HOOK__ = roots;
    global.addEventListener('inferno.devtools.message', function (message) {
        var detail = JSON.parse(message.detail);
        var type = detail.type;
        switch (type) {
            case 'get-roots':
                if (!devToolsStatus.connected) {
                    devToolsStatus.connected = true;
                    rerenderRoots();
                    sendRoots(global);
                }
                break;
            default:
                // TODO:?
                break;
        }
    });
}
function sendRoots(global) {
    sendToDevTools(global, { type: 'roots', data: roots });
}

var isNullOrUndef$4 = inferno.common.isNullOrUndef;
var isUndefined$2 = inferno.common.isUndefined;
var isNull$4 = inferno.common.isNull;
var isString$2 = inferno.common.isString;
var isStatefulComponent$2 = inferno.common.isStatefulComponent;
var isStringOrNumber$3 = inferno.common.isStringOrNumber;
var isInvalid$4 = inferno.common.isInvalid;
var NO_OP$1 = inferno.common.NO_OP;
var isNumber = inferno.common.isNumber;
var isArray$3 = inferno.common.isArray;
var isAttrAnEvent = inferno.common.isAttrAnEvent;
var throwError$3 = inferno.common.throwError;
var isKeyedListChildrenType$2 = inferno.common.isKeyedListChildrenType;
var isNonKeyedListChildrenType$2 = inferno.common.isNonKeyedListChildrenType;
var isNodeChildrenType$2 = inferno.common.isNodeChildrenType;
var isTextChildrenType$2 = inferno.common.isTextChildrenType;
var isUnknownChildrenType$2 = inferno.common.isUnknownChildrenType;
function replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    replaceChild(parentDom, mount(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput.dom);
    unmount$1(lastInput, null, lifecycle, false, shallowUnmount);
}
function patch(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    if (lastInput !== nextInput) {
        if (inferno.isOptVElement(nextInput)) {
            if (inferno.isOptVElement(lastInput)) {
                patchOptVElement(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                replaceVNode(parentDom, mountOptVElement(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isOptVElement(lastInput)) {
            replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
        }
        else if (inferno.isVComponent(nextInput)) {
            if (inferno.isVComponent(lastInput)) {
                patchVComponent(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                replaceVNode(parentDom, mountVComponent(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isVComponent(lastInput)) {
            replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
        }
        else if (inferno.isVElement(nextInput)) {
            if (inferno.isVElement(lastInput)) {
                patchVElement(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                replaceVNode(parentDom, mountVElement(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isVFragment(nextInput)) {
            if (inferno.isVFragment(lastInput)) {
                patchVFragment(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                replaceVNode(parentDom, mountVFragment(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isVFragment(lastInput)) {
            replaceVFragmentWithNode(parentDom, lastInput, mount(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lifecycle, shallowUnmount);
        }
        else if (inferno.isVElement(lastInput)) {
            replaceLastChildAndUnmount(lastInput, nextInput, parentDom, lifecycle, context, isSVG, shallowUnmount);
        }
        else if (inferno.isVText(nextInput)) {
            if (inferno.isVText(lastInput)) {
                patchVText(lastInput, nextInput);
            }
            else {
                replaceVNode(parentDom, mountVText(nextInput, null), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isVText(lastInput)) {
            replaceChild(parentDom, mount(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput.dom);
        }
        else if (inferno.isVPlaceholder(nextInput)) {
            if (inferno.isVPlaceholder(lastInput)) {
                patchVPlaceholder(lastInput, nextInput);
            }
            else {
                replaceVNode(parentDom, mountVPlaceholder(nextInput, null), lastInput, shallowUnmount, lifecycle);
            }
        }
        else if (inferno.isVPlaceholder(lastInput)) {
            replaceChild(parentDom, mount(nextInput, null, lifecycle, context, isSVG, shallowUnmount), lastInput.dom);
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                throwError$3('bad input argument called on patch(). Input argument may need normalising.');
            }
            throwError$3();
        }
    }
}
function patchVElement(lastVElement, nextVElement, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var nextTag = nextVElement.tag;
    var lastTag = lastVElement.tag;
    if (nextTag === 'svg') {
        isSVG = true;
    }
    if (lastTag !== nextTag) {
        replaceWithNewNode(lastVElement, nextVElement, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else {
        var dom = lastVElement.dom;
        var lastProps = lastVElement.props;
        var nextProps = nextVElement.props;
        var lastChildren = lastVElement.children;
        var nextChildren = nextVElement.children;
        nextVElement.dom = dom;
        if (lastChildren !== nextChildren) {
            var lastChildrenType = lastVElement.childrenType;
            var nextChildrenType = nextVElement.childrenType;
            if (lastChildrenType === nextChildrenType) {
                patchChildren(lastChildrenType, lastChildren, nextChildren, dom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                patchChildrenWithUnknownType(lastChildren, nextChildren, dom, lifecycle, context, isSVG, shallowUnmount);
            }
        }
        if (lastProps !== nextProps) {
            var formValue = patchProps(nextVElement, lastProps, nextProps, dom, shallowUnmount, false, isSVG, lifecycle, context);
            if (nextTag === 'select') {
                formSelectValue(dom, formValue);
            }
        }
    }
}
function patchOptVElement(lastOptVElement, nextOptVElement, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var dom = lastOptVElement.dom;
    var lastBp = lastOptVElement.bp;
    var nextBp = nextOptVElement.bp;
    nextOptVElement.dom = dom;
    if (lastBp !== nextBp) {
        var newDom = mountOptVElement(nextOptVElement, null, lifecycle, context, isSVG, shallowUnmount);
        replaceChild(parentDom, newDom, dom);
        unmount$1(lastOptVElement, null, lifecycle, true, shallowUnmount);
    }
    else {
        var bp0 = nextBp.v0;
        var tag = nextBp.staticVElement.tag;
        var ignoreDiff = false;
        if (tag === 'svg') {
            isSVG = true;
        }
        else if (tag === 'input') {
            // input elements are problematic due to the large amount of internal state that hold
            // so instead of making lots of assumptions, we instead reset common values and re-apply
            // the the patching each time
            resetFormInputProperties(dom);
            ignoreDiff = true;
        }
        else if (tag === 'textarea') {
            // textarea elements are like input elements, except they have sligthly less internal state to
            // worry about
            ignoreDiff = true;
        }
        if (!isNull$4(bp0)) {
            var lastV0 = lastOptVElement.v0;
            var nextV0 = nextOptVElement.v0;
            var bp1 = nextBp.v1;
            if (lastV0 !== nextV0 || ignoreDiff) {
                patchOptVElementValue(nextOptVElement, bp0, lastV0, nextV0, nextBp.d0, dom, lifecycle, context, isSVG, shallowUnmount);
            }
            if (!isNull$4(bp1)) {
                var lastV1 = lastOptVElement.v1;
                var nextV1 = nextOptVElement.v1;
                var bp2 = nextBp.v2;
                if (lastV1 !== nextV1 || ignoreDiff) {
                    patchOptVElementValue(nextOptVElement, bp1, lastV1, nextV1, nextBp.d1, dom, lifecycle, context, isSVG, shallowUnmount);
                }
                if (!isNull$4(bp2)) {
                    var lastV2 = lastOptVElement.v2;
                    var nextV2 = nextOptVElement.v2;
                    var bp3 = nextBp.v3;
                    if (lastV2 !== nextV2 || ignoreDiff) {
                        patchOptVElementValue(nextOptVElement, bp2, lastV2, nextV2, nextBp.d2, dom, lifecycle, context, isSVG, shallowUnmount);
                    }
                    if (!isNull$4(bp3)) {
                        var d3 = nextBp.d3;
                        var lastV3s = lastOptVElement.v3;
                        var nextV3s = nextOptVElement.v3;
                        for (var i = 0; i < lastV3s.length; i++) {
                            var lastV3 = lastV3s[i];
                            var nextV3 = nextV3s[i];
                            if (lastV3 !== nextV3 || ignoreDiff) {
                                patchOptVElementValue(nextOptVElement, bp3[i], lastV3, nextV3, d3[i], dom, lifecycle, context, isSVG, shallowUnmount);
                            }
                        }
                    }
                }
            }
        }
        if (tag === 'select') {
            formSelectValue(dom, getPropFromOptElement(nextOptVElement, inferno.ValueTypes.PROP_VALUE));
        }
    }
}
function patchOptVElementValue(optVElement, valueType, lastValue, nextValue, descriptor, dom, lifecycle, context, isSVG, shallowUnmount) {
    switch (valueType) {
        case inferno.ValueTypes.CHILDREN:
            patchChildren(descriptor, lastValue, nextValue, dom, lifecycle, context, isSVG, shallowUnmount);
            break;
        case inferno.ValueTypes.PROP_CLASS_NAME:
            if (isNullOrUndef$4(nextValue)) {
                dom.removeAttribute('class');
            }
            else {
                if (isSVG) {
                    dom.setAttribute('class', nextValue);
                }
                else {
                    dom.className = nextValue;
                }
            }
            break;
        case inferno.ValueTypes.PROP_DATA:
            dom.dataset[descriptor] = nextValue;
            break;
        case inferno.ValueTypes.PROP_STYLE:
            patchStyle(lastValue, nextValue, dom);
            break;
        case inferno.ValueTypes.PROP_VALUE:
            dom.value = isNullOrUndef$4(nextValue) ? '' : nextValue;
            break;
        case inferno.ValueTypes.PROP:
            patchProp(descriptor, lastValue, nextValue, dom, isSVG);
            break;
        case inferno.ValueTypes.PROP_SPREAD:
            patchProps(optVElement, lastValue, nextValue, dom, shallowUnmount, true, isSVG, lifecycle, context);
            break;
        default:
    }
}
function patchChildren(childrenType, lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    if (isTextChildrenType$2(childrenType)) {
        updateTextContent(parentDom, nextChildren);
    }
    else if (isNodeChildrenType$2(childrenType)) {
        patch(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isKeyedListChildrenType$2(childrenType)) {
        patchKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, null, shallowUnmount);
    }
    else if (isNonKeyedListChildrenType$2(childrenType)) {
        patchNonKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, null, false, shallowUnmount);
    }
    else if (isUnknownChildrenType$2(childrenType)) {
        patchChildrenWithUnknownType(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError$3('bad childrenType value specified when attempting to patchChildren.');
        }
        throwError$3();
    }
}
function patchChildrenWithUnknownType(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    if (isInvalid$4(nextChildren)) {
        if (!isInvalid$4(lastChildren)) {
            if (inferno.isVNode(lastChildren)) {
                unmount$1(lastChildren, parentDom, lifecycle, true, shallowUnmount);
            }
            else {
                removeAllChildren(parentDom, lastChildren, lifecycle, shallowUnmount);
            }
        }
    }
    else if (isInvalid$4(lastChildren)) {
        if (isStringOrNumber$3(nextChildren)) {
            setTextContent(parentDom, nextChildren);
        }
        else if (!isInvalid$4(nextChildren)) {
            if (isArray$3(nextChildren)) {
                mountArrayChildrenWithoutType(nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
            else {
                mount(nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
            }
        }
    }
    else if (inferno.isVNode(lastChildren) && inferno.isVNode(nextChildren)) {
        patch(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isStringOrNumber$3(nextChildren)) {
        if (isStringOrNumber$3(lastChildren)) {
            updateTextContent(parentDom, nextChildren);
        }
        else {
            setTextContent(parentDom, nextChildren);
        }
    }
    else if (isStringOrNumber$3(lastChildren)) {
        var child = normalise(lastChildren);
        child.dom = parentDom.firstChild;
        patchChildrenWithUnknownType(child, nextChildren, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isArray$3(nextChildren)) {
        if (isArray$3(lastChildren)) {
            nextChildren.complex = lastChildren.complex;
            if (isKeyed(lastChildren, nextChildren)) {
                patchKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, null, shallowUnmount);
            }
            else {
                patchNonKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, null, true, shallowUnmount);
            }
        }
        else {
            patchNonKeyedChildren([lastChildren], nextChildren, parentDom, lifecycle, context, isSVG, null, true, shallowUnmount);
        }
    }
    else if (isArray$3(lastChildren)) {
        patchNonKeyedChildren(lastChildren, [nextChildren], parentDom, lifecycle, context, isSVG, null, true, shallowUnmount);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError$3('bad input argument called on patchChildrenWithUnknownType(). Input argument may need normalising.');
        }
        throwError$3();
    }
}
function patchVComponent(lastVComponent, nextVComponent, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var lastComponent = lastVComponent.component;
    var nextComponent = nextVComponent.component;
    var nextProps = nextVComponent.props || {};
    if (lastComponent !== nextComponent) {
        if (isStatefulComponent$2(nextVComponent)) {
            var defaultProps = nextComponent.defaultProps;
            if (!isUndefined$2(defaultProps)) {
                nextVComponent.props = copyPropsTo(defaultProps, nextProps);
            }
            var lastInstance = lastVComponent.instance;
            var nextInstance = createStatefulComponentInstance(nextComponent, nextProps, context, isSVG, devToolsStatus);
            // we use || lastInstance because stateless components store their lastInstance
            var lastInput = lastInstance._lastInput || lastInstance;
            var nextInput = nextInstance._lastInput;
            var ref = nextVComponent.ref;
            nextInstance._vComponent = nextVComponent;
            nextVComponent.instance = nextInstance;
            patch(lastInput, nextInput, parentDom, lifecycle, nextInstance._childContext, isSVG, true);
            mountStatefulComponentCallbacks(ref, nextInstance, lifecycle);
            nextVComponent.dom = nextInput.dom;
            componentToDOMNodeMap.set(nextInstance, nextInput.dom);
        }
        else {
            var lastInput$1 = lastVComponent.instance._lastInput || lastVComponent.instance;
            var nextInput$1 = createStatelessComponentInput(nextComponent, nextProps, context);
            patch(lastInput$1, nextInput$1, parentDom, lifecycle, context, isSVG, true);
            var dom = nextVComponent.dom = nextInput$1.dom;
            nextVComponent.instance = nextInput$1;
            mountStatelessComponentCallbacks(nextVComponent.hooks, dom, lifecycle);
        }
        unmount$1(lastVComponent, null, lifecycle, false, shallowUnmount);
    }
    else {
        if (isStatefulComponent$2(nextVComponent)) {
            var instance = lastVComponent.instance;
            if (instance._unmounted) {
                if (isNull$4(parentDom)) {
                    return true;
                }
                replaceChild(parentDom, mountVComponent(nextVComponent, null, lifecycle, context, isSVG, shallowUnmount), lastVComponent.dom);
            }
            else {
                var defaultProps$1 = nextComponent.defaultProps;
                var lastProps = instance.props;
                if (instance._devToolsStatus.connected && !instance._devToolsId) {
                    componentIdMap.set(instance._devToolsId = getIncrementalId(), instance);
                }
                if (!isUndefined$2(defaultProps$1)) {
                    copyPropsTo(lastProps, nextProps);
                    nextVComponent.props = nextProps;
                }
                var lastState = instance.state;
                var nextState = instance.state;
                var childContext = instance.getChildContext();
                nextVComponent.instance = instance;
                instance._isSVG = isSVG;
                if (!isNullOrUndef$4(childContext)) {
                    childContext = Object.assign({}, context, childContext);
                }
                else {
                    childContext = context;
                }
                var lastInput$2 = instance._lastInput;
                var nextInput$2 = instance._updateComponent(lastState, nextState, lastProps, nextProps, context, false);
                var didUpdate = true;
                instance._childContext = childContext;
                if (isInvalid$4(nextInput$2)) {
                    nextInput$2 = inferno.createVPlaceholder();
                }
                else if (isArray$3(nextInput$2)) {
                    nextInput$2 = inferno.createVFragment(nextInput$2, null);
                }
                else if (nextInput$2 === NO_OP$1) {
                    nextInput$2 = lastInput$2;
                    didUpdate = false;
                }
                instance._lastInput = nextInput$2;
                instance._vComponent = nextVComponent;
                instance._lastInput = nextInput$2;
                if (didUpdate) {
                    patch(lastInput$2, nextInput$2, parentDom, lifecycle, childContext, isSVG, shallowUnmount);
                    instance.componentDidUpdate(lastProps, lastState);
                    componentToDOMNodeMap.set(instance, nextInput$2.dom);
                }
                nextVComponent.dom = nextInput$2.dom;
            }
        }
        else {
            var shouldUpdate = true;
            var lastProps$1 = lastVComponent.props;
            var nextHooks = nextVComponent.hooks;
            var nextHooksDefined = !isNullOrUndef$4(nextHooks);
            var lastInput$3 = lastVComponent.instance;
            nextVComponent.dom = lastVComponent.dom;
            nextVComponent.instance = lastInput$3;
            if (nextHooksDefined && !isNullOrUndef$4(nextHooks.onComponentShouldUpdate)) {
                shouldUpdate = nextHooks.onComponentShouldUpdate(lastProps$1, nextProps);
            }
            if (shouldUpdate !== false) {
                if (nextHooksDefined && !isNullOrUndef$4(nextHooks.onComponentWillUpdate)) {
                    nextHooks.onComponentWillUpdate(lastProps$1, nextProps);
                }
                var nextInput$3 = nextComponent(nextProps, context);
                if (isInvalid$4(nextInput$3)) {
                    nextInput$3 = inferno.createVPlaceholder();
                }
                else if (isArray$3(nextInput$3)) {
                    nextInput$3 = inferno.createVFragment(nextInput$3, null);
                }
                else if (nextInput$3 === NO_OP$1) {
                    return false;
                }
                patch(lastInput$3, nextInput$3, parentDom, lifecycle, context, isSVG, shallowUnmount);
                nextVComponent.instance = nextInput$3;
                if (nextHooksDefined && !isNullOrUndef$4(nextHooks.onComponentDidUpdate)) {
                    nextHooks.onComponentDidUpdate(lastProps$1, nextProps);
                }
            }
        }
    }
    return false;
}
function patchVText(lastVText, nextVText) {
    var nextText = nextVText.text;
    var dom = lastVText.dom;
    nextVText.dom = dom;
    if (lastVText.text !== nextText) {
        dom.nodeValue = nextText;
    }
}
function patchVPlaceholder(lastVPlacholder, nextVPlacholder) {
    nextVPlacholder.dom = lastVPlacholder.dom;
}
function patchVFragment(lastVFragment, nextVFragment, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var lastChildren = lastVFragment.children;
    var nextChildren = nextVFragment.children;
    var pointer = lastVFragment.pointer;
    nextVFragment.dom = lastVFragment.dom;
    nextVFragment.pointer = pointer;
    if (!lastChildren !== nextChildren) {
        var lastChildrenType = lastVFragment.childrenType;
        var nextChildrenType = nextVFragment.childrenType;
        if (lastChildrenType === nextChildrenType) {
            if (isKeyedListChildrenType$2(nextChildrenType)) {
                return patchKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, nextVFragment, shallowUnmount);
            }
            else if (isNonKeyedListChildrenType$2(nextChildrenType)) {
                return patchNonKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, nextVFragment, false, shallowUnmount);
            }
        }
        if (isKeyed(lastChildren, nextChildren)) {
            patchKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, nextVFragment, shallowUnmount);
        }
        else {
            patchNonKeyedChildren(lastChildren, nextChildren, parentDom, lifecycle, context, isSVG, nextVFragment, true, shallowUnmount);
        }
    }
}
function patchNonKeyedChildren(lastChildren, nextChildren, dom, lifecycle, context, isSVG, parentVList, shouldNormalise, shallowUnmount) {
    var lastChildrenLength = lastChildren.length;
    var nextChildrenLength = nextChildren.length;
    var commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
    var i = 0;
    for (; i < commonLength; i++) {
        var lastChild = lastChildren[i];
        var nextChild = shouldNormalise ? normaliseChild(nextChildren, i) : nextChildren[i];
        patch(lastChild, nextChild, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    if (lastChildrenLength < nextChildrenLength) {
        for (i = commonLength; i < nextChildrenLength; i++) {
            var child = normaliseChild(nextChildren, i);
            insertOrAppend(dom, mount(child, null, lifecycle, context, isSVG, shallowUnmount), parentVList && parentVList.pointer);
        }
    }
    else if (lastChildrenLength > nextChildrenLength) {
        for (i = commonLength; i < lastChildrenLength; i++) {
            unmount$1(lastChildren[i], dom, lifecycle, false, shallowUnmount);
        }
    }
}
function patchKeyedChildren(a, b, dom, lifecycle, context, isSVG, parentVList, shallowUnmount) {
    var aLength = a.length;
    var bLength = b.length;
    var aEnd = aLength - 1;
    var bEnd = bLength - 1;
    var aStart = 0;
    var bStart = 0;
    var i;
    var j;
    var aStartNode = a[aStart];
    var bStartNode = b[bStart];
    var aEndNode = a[aEnd];
    var bEndNode = b[bEnd];
    var aNode;
    var bNode;
    var nextNode;
    var nextPos;
    var node;
    if (aLength === 0) {
        if (bLength !== 0) {
            mountArrayChildrenWithType(b, dom, lifecycle, context, isSVG, shallowUnmount);
        }
        return;
    }
    else if (bLength === 0) {
        if (aLength !== 0) {
            removeAllChildren(dom, a, lifecycle, shallowUnmount);
        }
        return;
    }
    // Step 1
    /* eslint no-constant-condition: 0 */
    outer: while (true) {
        // Sync nodes with the same key at the beginning.
        while (aStartNode.key === bStartNode.key) {
            patch(aStartNode, bStartNode, dom, lifecycle, context, isSVG, shallowUnmount);
            aStart++;
            bStart++;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aStartNode = a[aStart];
            bStartNode = b[bStart];
        }
        // Sync nodes with the same key at the end.
        while (aEndNode.key === bEndNode.key) {
            patch(aEndNode, bEndNode, dom, lifecycle, context, isSVG, shallowUnmount);
            aEnd--;
            bEnd--;
            if (aStart > aEnd || bStart > bEnd) {
                break outer;
            }
            aEndNode = a[aEnd];
            bEndNode = b[bEnd];
        }
        // Move and sync nodes from right to left.
        if (aEndNode.key === bStartNode.key) {
            patch(aEndNode, bStartNode, dom, lifecycle, context, isSVG, shallowUnmount);
            insertOrAppend(dom, bStartNode.dom, aStartNode.dom);
            aEnd--;
            bStart++;
            if (aStart > aEnd || bStart > bEnd) {
                break;
            }
            aEndNode = a[aEnd];
            bStartNode = b[bStart];
            // In a real-world scenarios there is a higher chance that next node after the move will be the same, so we
            // immediately jump to the start of this prefix/suffix algo.
            continue;
        }
        // Move and sync nodes from left to right.
        if (aStartNode.key === bEndNode.key) {
            patch(aStartNode, bEndNode, dom, lifecycle, context, isSVG, shallowUnmount);
            nextPos = bEnd + 1;
            nextNode = nextPos < b.length ? b[nextPos].dom : parentVList && parentVList.pointer;
            insertOrAppend(dom, bEndNode.dom, nextNode);
            aStart++;
            bEnd--;
            if (aStart > aEnd || bStart > bEnd) {
                break;
            }
            aStartNode = a[aStart];
            bEndNode = b[bEnd];
            continue;
        }
        break;
    }
    if (aStart > aEnd) {
        if (bStart <= bEnd) {
            nextPos = bEnd + 1;
            nextNode = nextPos < b.length ? b[nextPos].dom : parentVList && parentVList.pointer;
            while (bStart <= bEnd) {
                insertOrAppend(dom, mount(b[bStart++], null, lifecycle, context, isSVG, shallowUnmount), nextNode);
            }
        }
    }
    else if (bStart > bEnd) {
        while (aStart <= aEnd) {
            unmount$1(a[aStart++], dom, lifecycle, false, shallowUnmount);
        }
    }
    else {
        aLength = aEnd - aStart + 1;
        bLength = bEnd - bStart + 1;
        var aNullable = a;
        var sources = new Array(bLength);
        // Mark all nodes as inserted.
        for (i = 0; i < bLength; i++) {
            sources[i] = -1;
        }
        var moved = false;
        var pos = 0;
        var patched = 0;
        if ((bLength <= 4) || (aLength * bLength <= 16)) {
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLength) {
                    for (j = bStart; j <= bEnd; j++) {
                        bNode = b[j];
                        if (aNode.key === bNode.key) {
                            sources[j - bStart] = i;
                            if (pos > j) {
                                moved = true;
                            }
                            else {
                                pos = j;
                            }
                            patch(aNode, bNode, dom, lifecycle, context, isSVG, shallowUnmount);
                            patched++;
                            aNullable[i] = null;
                            break;
                        }
                    }
                }
            }
        }
        else {
            var keyIndex = new Map();
            for (i = bStart; i <= bEnd; i++) {
                node = b[i];
                keyIndex.set(node.key, i);
            }
            for (i = aStart; i <= aEnd; i++) {
                aNode = a[i];
                if (patched < bLength) {
                    j = keyIndex.get(aNode.key);
                    if (!isUndefined$2(j)) {
                        bNode = b[j];
                        sources[j - bStart] = i;
                        if (pos > j) {
                            moved = true;
                        }
                        else {
                            pos = j;
                        }
                        patch(aNode, bNode, dom, lifecycle, context, isSVG, shallowUnmount);
                        patched++;
                        aNullable[i] = null;
                    }
                }
            }
        }
        if (aLength === a.length && patched === 0) {
            removeAllChildren(dom, a, lifecycle, shallowUnmount);
            while (bStart < bLength) {
                insertOrAppend(dom, mount(b[bStart++], null, lifecycle, context, isSVG, shallowUnmount), null);
            }
        }
        else {
            i = aLength - patched;
            while (i > 0) {
                aNode = aNullable[aStart++];
                if (!isNull$4(aNode)) {
                    unmount$1(aNode, dom, lifecycle, false, shallowUnmount);
                    i--;
                }
            }
            if (moved) {
                var seq = lis_algorithm(sources);
                j = seq.length - 1;
                for (i = bLength - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        nextPos = pos + 1;
                        nextNode = nextPos < b.length ? b[nextPos].dom : parentVList && parentVList.pointer;
                        insertOrAppend(dom, mount(node, dom, lifecycle, context, isSVG, shallowUnmount), nextNode);
                    }
                    else {
                        if (j < 0 || i !== seq[j]) {
                            pos = i + bStart;
                            node = b[pos];
                            nextPos = pos + 1;
                            nextNode = nextPos < b.length ? b[nextPos].dom : parentVList && parentVList.pointer;
                            insertOrAppend(dom, node.dom, nextNode);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
            else if (patched !== bLength) {
                for (i = bLength - 1; i >= 0; i--) {
                    if (sources[i] === -1) {
                        pos = i + bStart;
                        node = b[pos];
                        nextPos = pos + 1;
                        nextNode = nextPos < b.length ? b[nextPos].dom : parentVList && parentVList.pointer;
                        insertOrAppend(dom, mount(node, null, lifecycle, context, isSVG, shallowUnmount), nextNode);
                    }
                }
            }
        }
    }
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function lis_algorithm(a) {
    var p = a.slice(0);
    var result = [];
    result.push(0);
    var i;
    var j;
    var u;
    var v;
    var c;
    for (i = 0; i < a.length; i++) {
        if (a[i] === -1) {
            continue;
        }
        j = result[result.length - 1];
        if (a[j] < a[i]) {
            p[i] = j;
            result.push(i);
            continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
            c = ((u + v) / 2) | 0;
            if (a[result[c]] < a[i]) {
                u = c + 1;
            }
            else {
                v = c;
            }
        }
        if (a[i] < a[result[u]]) {
            if (u > 0) {
                p[i] = result[u - 1];
            }
            result[u] = i;
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
// returns true if a property has been applied that can't be cloned via elem.cloneNode()
function patchProp(prop, lastValue, nextValue, dom, isSVG) {
    if (prop === 'children') {
        return;
    }
    if (strictProps[prop]) {
        dom[prop] = isNullOrUndef$4(nextValue) ? '' : nextValue;
    }
    else if (booleanProps[prop]) {
        dom[prop] = nextValue ? true : false;
    }
    else {
        if (lastValue !== nextValue) {
            if (isNullOrUndef$4(nextValue)) {
                dom.removeAttribute(prop);
                return false;
            }
            if (prop === 'className') {
                if (isSVG) {
                    dom.setAttribute('class', nextValue);
                }
                else {
                    dom.className = nextValue;
                }
                return false;
            }
            else if (prop === 'style') {
                patchStyle(lastValue, nextValue, dom);
            }
            else if (isAttrAnEvent(prop)) {
                dom[prop.toLowerCase()] = nextValue;
            }
            else if (prop === 'dangerouslySetInnerHTML') {
                var lastHtml = lastValue && lastValue.__html;
                var nextHtml = nextValue && nextValue.__html;
                if (isNullOrUndef$4(nextHtml)) {
                    if (process.env.NODE_ENV !== 'production') {
                        throwError$3('dangerouslySetInnerHTML requires an object with a __html propety containing the innerHTML content.');
                    }
                    throwError$3();
                }
                if (lastHtml !== nextHtml) {
                    dom.innerHTML = nextHtml;
                }
            }
            else if (prop !== 'childrenType' && prop !== 'ref' && prop !== 'key') {
                var ns = namespaces[prop];
                if (ns) {
                    dom.setAttributeNS(ns, prop, nextValue);
                }
                else {
                    dom.setAttribute(prop, nextValue);
                }
                return false;
            }
        }
    }
    return true;
}
function patchProps(vNode, lastProps, nextProps, dom, shallowUnmount, isSpread, isSVG, lifecycle, context) {
    lastProps = lastProps || {};
    nextProps = nextProps || {};
    var formValue;
    for (var prop in nextProps) {
        if (!nextProps.hasOwnProperty(prop)) {
            continue;
        }
        var nextValue = nextProps[prop];
        var lastValue = lastProps[prop];
        if (prop === 'value') {
            formValue = nextValue;
        }
        if (isNullOrUndef$4(nextValue)) {
            removeProp(prop, dom);
        }
        else if (prop === 'children') {
            if (isSpread) {
                patchChildrenWithUnknownType(lastValue, nextValue, dom, lifecycle, context, isSVG, shallowUnmount);
            }
            else if (inferno.isVElement(vNode)) {
                vNode.children = nextValue;
            }
        }
        else {
            patchProp(prop, lastValue, nextValue, dom, isSVG);
        }
    }
    for (var prop$1 in lastProps) {
        if (isNullOrUndef$4(nextProps[prop$1])) {
            removeProp(prop$1, dom);
        }
    }
    return formValue;
}
function patchStyle(lastAttrValue, nextAttrValue, dom) {
    if (isString$2(nextAttrValue)) {
        dom.style.cssText = nextAttrValue;
    }
    else if (isNullOrUndef$4(lastAttrValue)) {
        if (!isNullOrUndef$4(nextAttrValue)) {
            for (var style in nextAttrValue) {
                var value = nextAttrValue[style];
                if (isNumber(value) && !isUnitlessNumber[style]) {
                    dom.style[style] = value + 'px';
                }
                else {
                    dom.style[style] = value;
                }
            }
        }
    }
    else if (isNullOrUndef$4(nextAttrValue)) {
        dom.removeAttribute('style');
    }
    else {
        for (var style$1 in nextAttrValue) {
            var value$1 = nextAttrValue[style$1];
            if (isNumber(value$1) && !isUnitlessNumber[style$1]) {
                dom.style[style$1] = value$1 + 'px';
            }
            else {
                dom.style[style$1] = value$1;
            }
        }
        for (var style$2 in lastAttrValue) {
            if (isNullOrUndef$4(nextAttrValue[style$2])) {
                dom.style[style$2] = '';
            }
        }
    }
}
function removeProp(prop, dom) {
    if (prop === 'className') {
        dom.removeAttribute('class');
    }
    else if (prop === 'value') {
        dom.value = '';
    }
    else {
        dom.removeAttribute(prop);
    }
}

var isBrowser$1 = inferno.common.isBrowser;
var isNull$8 = inferno.common.isNull;
var isArray$5 = inferno.common.isArray;
var isStringOrNumber$4 = inferno.common.isStringOrNumber;
var isInvalid$6 = inferno.common.isInvalid;
function mountStaticChildren(children, dom, isSVG) {
    if (isArray$5(children)) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            mountStaticChildren(child, dom, isSVG);
        }
    }
    else if (isStringOrNumber$4(children)) {
        dom.appendChild(document.createTextNode(children));
    }
    else if (!isInvalid$6(children)) {
        mountStaticNode(children, dom, isSVG);
    }
}
function mountStaticNode(node, parentDom, isSVG) {
    var tag = node.tag;
    if (tag === 'svg') {
        isSVG = true;
    }
    var dom = documentCreateElement(tag, isSVG);
    var children = node.children;
    if (!isNull$8(children)) {
        mountStaticChildren(children, dom, isSVG);
    }
    var props = node.props;
    if (!isNull$8(props)) {
        for (var prop in props) {
            if (!props.hasOwnProperty(prop)) {
                continue;
            }
            patchProp(prop, null, props[prop], dom, isSVG);
        }
    }
    if (parentDom) {
        parentDom.appendChild(dom);
    }
    return dom;
}
function createStaticVElementClone(bp, isSVG) {
    if (!isBrowser$1) {
        return null;
    }
    var staticNode = bp.staticVElement;
    var dom = mountStaticNode(staticNode, null, isSVG);
    if (isSVG) {
        bp.svgClone = dom;
    }
    else {
        bp.clone = dom;
    }
    return dom.cloneNode(true);
}

var isArray$2 = inferno.common.isArray;
var isStringOrNumber$2 = inferno.common.isStringOrNumber;
var isFunction = inferno.common.isFunction;
var isNullOrUndef$3 = inferno.common.isNullOrUndef;
var isStatefulComponent$1 = inferno.common.isStatefulComponent;
var isString$1 = inferno.common.isString;
var isInvalid$3 = inferno.common.isInvalid;
var isNull$3 = inferno.common.isNull;
var throwError$2 = inferno.common.throwError;
var isUndefined$1 = inferno.common.isUndefined;
var EMPTY_OBJ = inferno.common.EMPTY_OBJ;
var isTextChildrenType$1 = inferno.common.isTextChildrenType;
var isNodeChildrenType$1 = inferno.common.isNodeChildrenType;
var isKeyedListChildrenType$1 = inferno.common.isKeyedListChildrenType;
var isNonKeyedListChildrenType$1 = inferno.common.isNonKeyedListChildrenType;
var isUnknownChildrenType$1 = inferno.common.isUnknownChildrenType;
function mount(input, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    if (inferno.isOptVElement(input)) {
        return mountOptVElement(input, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (inferno.isVComponent(input)) {
        return mountVComponent(input, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (inferno.isVElement(input)) {
        return mountVElement(input, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (inferno.isVText(input)) {
        return mountVText(input, parentDom);
    }
    else if (inferno.isVFragment(input)) {
        return mountVFragment(input, parentDom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (inferno.isVPlaceholder(input)) {
        return mountVPlaceholder(input, parentDom);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError$2('bad input argument called on mount(). Input argument may need normalising.');
        }
        throwError$2();
    }
}
function mountVPlaceholder(vPlaceholder, parentDom) {
    var dom = document.createTextNode('');
    vPlaceholder.dom = dom;
    if (parentDom) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountVElement(vElement, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var tag = vElement.tag;
    if (!isString$1(tag)) {
        if (process.env.NODE_ENV !== 'production') {
            throwError$2('expects VElement to have a string as the tag name');
        }
        throwError$2();
    }
    if (tag === 'svg') {
        isSVG = true;
    }
    var dom = documentCreateElement(tag, isSVG);
    var children = vElement.children;
    var props = vElement.props;
    var ref = vElement.ref;
    var hasProps = !isNullOrUndef$3(props);
    var formValue;
    vElement.dom = dom;
    if (!isNullOrUndef$3(ref)) {
        mountRef(dom, ref, lifecycle);
    }
    if (hasProps) {
        formValue = mountProps(vElement, props, dom, lifecycle, context, isSVG, false, shallowUnmount);
    }
    if (!isNullOrUndef$3(children)) {
        mountChildren(vElement.childrenType, children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    if (tag === 'select' && formValue) {
        formSelectValue(dom, formValue);
    }
    if (!isNull$3(parentDom)) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountVFragment(vFragment, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var children = vFragment.children;
    var pointer = document.createTextNode('');
    var dom = document.createDocumentFragment();
    var childrenType = vFragment.childrenType;
    if (isKeyedListChildrenType$1(childrenType) || isNonKeyedListChildrenType$1(childrenType)) {
        mountArrayChildrenWithType(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isUnknownChildrenType$1(childrenType)) {
        mountArrayChildrenWithoutType(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    vFragment.pointer = pointer;
    vFragment.dom = dom;
    appendChild(dom, pointer);
    if (parentDom) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountVText(vText, parentDom) {
    var dom = document.createTextNode(vText.text);
    vText.dom = dom;
    if (!isNull$3(parentDom)) {
        appendChild(parentDom, dom);
    }
    return dom;
}
function mountOptVElement(optVElement, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var bp = optVElement.bp;
    var dom = null;
    if (recyclingEnabled) {
        dom = recycleOptVElement(optVElement, lifecycle, context, isSVG, shallowUnmount);
    }
    var tag = bp.staticVElement.tag;
    if (isNull$3(dom)) {
        if (isSVG || tag === 'svg') {
            isSVG = true;
            dom = (bp.svgClone && bp.svgClone.cloneNode(true)) || createStaticVElementClone(bp, isSVG);
        }
        else {
            dom = (bp.clone && bp.clone.cloneNode(true)) || createStaticVElementClone(bp, isSVG);
        }
        optVElement.dom = dom;
        var bp0 = bp.v0;
        if (!isNull$3(bp0)) {
            mountOptVElementValue(optVElement, bp0, optVElement.v0, bp.d0, dom, lifecycle, context, isSVG, shallowUnmount);
            var bp1 = bp.v1;
            if (!isNull$3(bp1)) {
                mountOptVElementValue(optVElement, bp1, optVElement.v1, bp.d1, dom, lifecycle, context, isSVG, shallowUnmount);
                var bp2 = bp.v2;
                if (!isNull$3(bp2)) {
                    mountOptVElementValue(optVElement, bp2, optVElement.v2, bp.d2, dom, lifecycle, context, isSVG, shallowUnmount);
                    var bp3 = bp.v3;
                    if (!isNull$3(bp3)) {
                        var v3 = optVElement.v3;
                        var d3 = bp.d3;
                        var bp3$1 = bp.v3;
                        for (var i = 0; i < bp3$1.length; i++) {
                            mountOptVElementValue(optVElement, bp3$1[i], v3[i], d3[i], dom, lifecycle, context, isSVG, shallowUnmount);
                        }
                    }
                }
            }
        }
        if (tag === 'select') {
            formSelectValue(dom, getPropFromOptElement(optVElement, inferno.ValueTypes.PROP_VALUE));
        }
    }
    if (!isNull$3(parentDom)) {
        parentDom.appendChild(dom);
    }
    return dom;
}
function mountOptVElementValue(optVElement, valueType, value, descriptor, dom, lifecycle, context, isSVG, shallowUnmount) {
    switch (valueType) {
        case inferno.ValueTypes.CHILDREN:
            mountChildren(descriptor, value, dom, lifecycle, context, isSVG, shallowUnmount);
            break;
        case inferno.ValueTypes.PROP_CLASS_NAME:
            if (!isNullOrUndef$3(value)) {
                if (isSVG) {
                    dom.setAttribute('class', value);
                }
                else {
                    dom.className = value;
                }
            }
            break;
        case inferno.ValueTypes.PROP_DATA:
            dom.dataset[descriptor] = value;
            break;
        case inferno.ValueTypes.PROP_STYLE:
            patchStyle(null, value, dom);
            break;
        case inferno.ValueTypes.PROP_VALUE:
            dom.value = isNullOrUndef$3(value) ? '' : value;
            break;
        case inferno.ValueTypes.PROP:
            patchProp(descriptor, null, value, dom, isSVG);
            break;
        case inferno.ValueTypes.PROP_REF:
            mountRef(dom, value, lifecycle);
            break;
        case inferno.ValueTypes.PROP_SPREAD:
            mountProps(optVElement, value, dom, lifecycle, context, isSVG, true, shallowUnmount);
            break;
        default:
    }
}
function mountChildren(childrenType, children, dom, lifecycle, context, isSVG, shallowUnmount) {
    if (isTextChildrenType$1(childrenType)) {
        setTextContent(dom, children);
    }
    else if (isNodeChildrenType$1(childrenType)) {
        mount(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isKeyedListChildrenType$1(childrenType) || isNonKeyedListChildrenType$1(childrenType)) {
        mountArrayChildrenWithType(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isUnknownChildrenType$1(childrenType)) {
        mountChildrenWithUnknownType(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError$2('bad childrenType value specified when attempting to mountChildren.');
        }
        throwError$2();
    }
}
function mountArrayChildrenWithType(children, dom, lifecycle, context, isSVG, shallowUnmount) {
    for (var i = 0; i < children.length; i++) {
        mount(children[i], dom, lifecycle, context, isSVG, shallowUnmount);
    }
}
function mountChildrenWithUnknownType(children, dom, lifecycle, context, isSVG, shallowUnmount) {
    if (isArray$2(children)) {
        mountArrayChildrenWithoutType(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
    else if (isStringOrNumber$2(children)) {
        setTextContent(dom, children);
    }
    else if (!isInvalid$3(children)) {
        mount(children, dom, lifecycle, context, isSVG, shallowUnmount);
    }
}
function mountArrayChildrenWithoutType(children, dom, lifecycle, context, isSVG, shallowUnmount) {
    children.complex = false;
    for (var i = 0; i < children.length; i++) {
        var child = normaliseChild(children, i);
        if (inferno.isVText(child)) {
            mountVText(child, dom);
            children.complex = true;
        }
        else if (inferno.isVPlaceholder(child)) {
            mountVPlaceholder(child, dom);
            children.complex = true;
        }
        else if (inferno.isVFragment(child)) {
            mountVFragment(child, dom, lifecycle, context, isSVG, shallowUnmount);
            children.complex = true;
        }
        else {
            mount(child, dom, lifecycle, context, isSVG, shallowUnmount);
        }
    }
}
function mountVComponent(vComponent, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    if (recyclingEnabled) {
        var dom$1 = recycleVComponent(vComponent, lifecycle, context, isSVG, shallowUnmount);
        if (!isNull$3(dom$1)) {
            if (!isNull$3(parentDom)) {
                appendChild(parentDom, dom$1);
            }
            return dom$1;
        }
    }
    var component = vComponent.component;
    var props = vComponent.props || EMPTY_OBJ;
    var hooks = vComponent.hooks;
    var ref = vComponent.ref;
    var dom;
    if (isStatefulComponent$1(vComponent)) {
        var defaultProps = component.defaultProps;
        if (!isUndefined$1(defaultProps)) {
            copyPropsTo(defaultProps, props);
            vComponent.props = props;
        }
        if (hooks) {
            if (process.env.NODE_ENV !== 'production') {
                throwError$2('"hooks" are not supported on stateful components.');
            }
            throwError$2();
        }
        var instance = createStatefulComponentInstance(component, props, context, isSVG, devToolsStatus);
        var input = instance._lastInput;
        instance._vComponent = vComponent;
        vComponent.dom = dom = mount(input, null, lifecycle, instance._childContext, false, shallowUnmount);
        if (!isNull$3(parentDom)) {
            appendChild(parentDom, dom);
        }
        mountStatefulComponentCallbacks(ref, instance, lifecycle);
        componentToDOMNodeMap.set(instance, dom);
        vComponent.instance = instance;
    }
    else {
        if (ref) {
            if (process.env.NODE_ENV !== 'production') {
                throwError$2('"refs" are not supported on stateless components.');
            }
            throwError$2();
        }
        var input$1 = createStatelessComponentInput(component, props, context);
        vComponent.dom = dom = mount(input$1, null, lifecycle, context, isSVG, shallowUnmount);
        vComponent.instance = input$1;
        mountStatelessComponentCallbacks(hooks, dom, lifecycle);
        if (!isNull$3(parentDom)) {
            appendChild(parentDom, dom);
        }
    }
    return dom;
}
function mountStatefulComponentCallbacks(ref, instance, lifecycle) {
    if (ref) {
        if (isFunction(ref)) {
            lifecycle.addListener(function () { return ref(instance); });
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                throwError$2('string "refs" are not supported in Inferno 0.8+. Use callback "refs" instead.');
            }
            throwError$2();
        }
    }
    if (!isNull$3(instance.componentDidMount)) {
        lifecycle.addListener(function () {
            instance.componentDidMount();
        });
    }
}
function mountStatelessComponentCallbacks(hooks, dom, lifecycle) {
    if (!isNullOrUndef$3(hooks)) {
        if (!isNullOrUndef$3(hooks.onComponentWillMount)) {
            hooks.onComponentWillMount();
        }
        if (!isNullOrUndef$3(hooks.onComponentDidMount)) {
            lifecycle.addListener(function () { return hooks.onComponentDidMount(dom); });
        }
    }
}
function mountProps(vNode, props, dom, lifecycle, context, isSVG, isSpread, shallowUnmount) {
    var formValue;
    for (var prop in props) {
        if (!props.hasOwnProperty(prop)) {
            continue;
        }
        var value = props[prop];
        if (prop === 'value') {
            formValue = value;
        }
        if (prop === 'key') {
            vNode.key = value;
        }
        else if (prop === 'ref') {
            mountRef(dom, value, lifecycle);
        }
        else if (prop === 'children') {
            if (isSpread) {
                mountChildrenWithUnknownType(value, dom, lifecycle, context, isSVG, shallowUnmount);
            }
            else if (inferno.isVElement(vNode)) {
                vNode.children = value;
            }
        }
        else {
            patchProp(prop, null, value, dom, isSVG);
        }
    }
    return formValue;
}
function mountRef(dom, value, lifecycle) {
    if (isFunction(value)) {
        lifecycle.addListener(function () { return value(dom); });
    }
    else {
        if (isInvalid$3(value)) {
            return;
        }
        if (process.env.NODE_ENV !== 'production') {
            throwError$2('string "refs" are not supported in Inferno 0.8+. Use callback "refs" instead.');
        }
        throwError$2();
    }
}

var isArray$1 = inferno.common.isArray;
var isNullOrUndef$2 = inferno.common.isNullOrUndef;
var isInvalid$2 = inferno.common.isInvalid;
var isStringOrNumber$1 = inferno.common.isStringOrNumber;
var isNull$2 = inferno.common.isNull;
var isUndefined = inferno.common.isUndefined;
function copyPropsTo(copyFrom, copyTo) {
    for (var prop in copyFrom) {
        if (isUndefined(copyTo[prop])) {
            copyTo[prop] = copyFrom[prop];
        }
    }
}
function createStatefulComponentInstance(Component, props, context, isSVG, devToolsStatus) {
    var instance = new Component(props, context);
    instance.context = context;
    instance._patch = patch;
    instance._devToolsStatus = devToolsStatus;
    instance._componentToDOMNodeMap = componentToDOMNodeMap;
    var childContext = instance.getChildContext();
    if (!isNullOrUndef$2(childContext)) {
        instance._childContext = Object.assign({}, context, childContext);
    }
    else {
        instance._childContext = context;
    }
    instance._unmounted = false;
    instance._pendingSetState = true;
    instance._isSVG = isSVG;
    instance.componentWillMount();
    var input = instance.render(props, context);
    if (isArray$1(input)) {
        input = inferno.createVFragment(input, null);
    }
    else if (isInvalid$2(input)) {
        input = inferno.createVPlaceholder();
    }
    instance._pendingSetState = false;
    instance._lastInput = input;
    return instance;
}
function replaceVNode(parentDom, dom, vNode, shallowUnmount, lifecycle) {
    if (inferno.isVComponent(vNode)) {
        // if we are accessing a stateful or stateless component, we want to access their last rendered input
        // accessing their DOM node is not useful to us here
        vNode = vNode.instance._lastInput || vNode.instance;
    }
    if (inferno.isVFragment(vNode)) {
        replaceVFragmentWithNode(parentDom, vNode, dom, lifecycle, shallowUnmount);
    }
    else {
        replaceChild(parentDom, dom, vNode.dom);
        unmount$1(vNode, null, lifecycle, false, shallowUnmount);
    }
}
function createStatelessComponentInput(component, props, context) {
    var input = component(props, context);
    if (isArray$1(input)) {
        input = inferno.createVFragment(input, null);
    }
    else if (isInvalid$2(input)) {
        input = inferno.createVPlaceholder();
    }
    return input;
}
function setTextContent(dom, text) {
    if (text !== '') {
        dom.textContent = text;
    }
    else {
        dom.appendChild(document.createTextNode(''));
    }
}
function updateTextContent(dom, text) {
    dom.firstChild.nodeValue = text;
}
function appendChild(parentDom, dom) {
    parentDom.appendChild(dom);
}
function insertOrAppend(parentDom, newNode, nextNode) {
    if (isNullOrUndef$2(nextNode)) {
        appendChild(parentDom, newNode);
    }
    else {
        parentDom.insertBefore(newNode, nextNode);
    }
}
function replaceVFragmentWithNode(parentDom, vFragment, dom, lifecycle, shallowUnmount) {
    var pointer = vFragment.pointer;
    unmountVFragment(vFragment, parentDom, false, lifecycle, shallowUnmount);
    replaceChild(parentDom, dom, pointer);
}
function getPropFromOptElement(optVElement, valueType) {
    var bp = optVElement.bp;
    // TODO check "prop" and "spread"
    if (!isNull$2(bp.v0)) {
        if (bp.v0 === valueType) {
            return optVElement.v0;
        }
        if (!isNull$2(bp.v1)) {
            if (bp.v1 === valueType) {
                return optVElement.v1;
            }
            if (!isNull$2(bp.v2)) {
                if (bp.v2 === valueType) {
                    return optVElement.v2;
                }
            }
        }
    }
}
function documentCreateElement(tag, isSVG) {
    var dom;
    if (isSVG === true) {
        dom = document.createElementNS(svgNS, tag);
    }
    else {
        dom = document.createElement(tag);
    }
    return dom;
}
function replaceWithNewNode(lastNode, nextNode, parentDom, lifecycle, context, isSVG, shallowUnmount) {
    var lastInstance = null;
    var instanceLastNode = lastNode._lastInput;
    if (!isNullOrUndef$2(instanceLastNode)) {
        lastInstance = lastNode;
        lastNode = instanceLastNode;
    }
    unmount$1(lastNode, null, lifecycle, true, shallowUnmount);
    var dom = mount(nextNode, null, lifecycle, context, isSVG, shallowUnmount);
    nextNode.dom = dom;
    replaceChild(parentDom, dom, lastNode.dom);
    if (lastInstance !== null) {
        lastInstance._lasInput = nextNode;
    }
}
function replaceChild(parentDom, nextDom, lastDom) {
    parentDom.replaceChild(nextDom, lastDom);
}
function normalise(object) {
    if (isStringOrNumber$1(object)) {
        return inferno.createVText(object);
    }
    else if (isInvalid$2(object)) {
        return inferno.createVPlaceholder();
    }
    else if (isArray$1(object)) {
        return inferno.createVFragment(object, null);
    }
    else if (inferno.isVNode(object) && object.dom) {
        return inferno.cloneVNode(object);
    }
    return object;
}
function normaliseChild(children, i) {
    var child = children[i];
    children[i] = normalise(child);
    return children[i];
}
function removeChild(parentDom, dom) {
    parentDom.removeChild(dom);
}
function removeAllChildren(dom, children, lifecycle, shallowUnmount) {
    dom.textContent = '';
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (!isInvalid$2(child)) {
            unmount$1(child, null, lifecycle, true, shallowUnmount);
        }
    }
}
function isKeyed(lastChildren, nextChildren) {
    if (lastChildren.complex) {
        return false;
    }
    return nextChildren.length && !isNullOrUndef$2(nextChildren[0]) && !isNullOrUndef$2(nextChildren[0].key)
        && lastChildren.length && !isNullOrUndef$2(lastChildren[0]) && !isNullOrUndef$2(lastChildren[0].key);
}
function formSelectValueFindOptions(dom, value, isMap) {
    var child = dom.firstChild;
    while (child) {
        var tagName = child.tagName;
        if (tagName === 'OPTION') {
            child.selected = !!((!isMap && child.value === value) || (isMap && value.get(child.value)));
        }
        else if (tagName === 'OPTGROUP') {
            formSelectValueFindOptions(child, value, isMap);
        }
        child = child.nextSibling;
    }
}
function formSelectValue(dom, value) {
    var isMap = false;
    if (!isNullOrUndef$2(value)) {
        if (isArray$1(value)) {
            // Map vs Object v using reduce here for perf?
            value = value.reduce(function (o, v) { return o.set(v, true); }, new Map());
            isMap = true;
        }
        else {
            // convert to string
            value = value + '';
        }
        formSelectValueFindOptions(dom, value, isMap);
    }
}
function resetFormInputProperties(dom) {
    if (dom.checked) {
        dom.checked = false;
    }
    if (dom.disabled) {
        dom.disabled = false;
    }
}

var isArray = inferno.common.isArray;
var isNull$1 = inferno.common.isNull;
var isStringOrNumber = inferno.common.isStringOrNumber;
var isString = inferno.common.isString;
var isInvalid$1 = inferno.common.isInvalid;
var isStatefulComponent = inferno.common.isStatefulComponent;
var throwError$1 = inferno.common.throwError;
var isObject = inferno.common.isObject;
var isNullOrUndef$1 = inferno.common.isNullOrUndef;
var isUnknownChildrenType = inferno.common.isUnknownChildrenType;
var isKeyedListChildrenType = inferno.common.isKeyedListChildrenType;
var isNonKeyedListChildrenType = inferno.common.isNonKeyedListChildrenType;
var isTextChildrenType = inferno.common.isTextChildrenType;
var isNodeChildrenType = inferno.common.isNodeChildrenType;
function hydrateChild(child, childNodes, counter, parentDom, lifecycle, context) {
    var domNode = childNodes[counter.i];
    if (inferno.isVText(child)) {
        var text = child.text;
        child.dom = domNode;
        if (domNode.nodeType === 3 && text !== '') {
            domNode.nodeValue = text;
        }
        else {
            var newDomNode = mountVText(text, null);
            replaceChild(parentDom, newDomNode, domNode);
            childNodes.splice(childNodes.indexOf(domNode), 1, newDomNode);
            child.dom = newDomNode;
        }
    }
    else if (inferno.isVPlaceholder(child)) {
        child.dom = domNode;
    }
    else if (inferno.isVFragment(child)) {
        var items = child.items;
        // this doesn't really matter, as it won't be used again, but it's what it should be given the purpose of VList
        child.dom = document.createDocumentFragment();
        for (var i = 0; i < items.length; i++) {
            var rebuild = hydrateChild(normaliseChild(items, i), childNodes, counter, parentDom, lifecycle, context);
            if (rebuild) {
                return true;
            }
        }
        // at the end of every VList, there should be a "pointer". It's an empty TextNode used for tracking the VList
        var pointer = childNodes[counter.i++];
        if (pointer && pointer.nodeType === 3) {
            child.pointer = pointer;
        }
        else {
            // there is a problem, we need to rebuild this tree
            return true;
        }
    }
    else {
        var rebuild$1 = hydrate(child, domNode, lifecycle, context);
        if (rebuild$1) {
            return true;
        }
    }
    counter.i++;
}
function normaliseChildNodes(dom) {
    var rawChildNodes = dom.childNodes;
    var length = rawChildNodes.length;
    var i = 0;
    while (i < length) {
        var rawChild = rawChildNodes[i];
        if (rawChild.nodeType === 8) {
            if (rawChild.data === '!') {
                var placeholder = document.createTextNode('');
                dom.replaceChild(placeholder, rawChild);
                i++;
            }
            else {
                dom.removeChild(rawChild);
                length--;
            }
        }
        else {
            i++;
        }
    }
}
function hydrateVComponent(vComponent, dom, lifecycle, context) {
    var component = vComponent.component;
    var props = vComponent.props;
    var hooks = vComponent.hooks;
    var ref = vComponent.ref;
    vComponent.dom = dom;
    if (isStatefulComponent(vComponent)) {
        var isSVG = dom.namespaceURI === svgNS;
        var instance = createStatefulComponentInstance(component, props, context, isSVG, createStaticVElementClone);
        var input = instance._lastInput;
        instance._vComponent = vComponent;
        hydrate(input, dom, lifecycle, instance._childContext);
        mountStatefulComponentCallbacks(ref, instance, lifecycle);
        componentToDOMNodeMap.set(instance, dom);
        vComponent.instance = instance;
    }
    else {
        var input$1 = createStatelessComponentInput(component, props, context);
        hydrate(input$1, dom, lifecycle, context);
        vComponent.instance = input$1;
        vComponent.dom = input$1.dom;
        mountStatelessComponentCallbacks(hooks, dom, lifecycle);
    }
}
function hydrateVElement(vElement, dom, lifecycle, context) {
    var tag = vElement.tag;
    if (!isString(tag)) {
        if (process.env.NODE_ENV !== 'production') {
            throwError$1('expects VElement to have a string as the tag name');
        }
        throwError$1();
    }
    var children = vElement.children;
    vElement.dom = dom;
    if (children) {
        hydrateChildren(vElement.childrenType, children, dom, lifecycle, context);
    }
}
function hydrateArrayChildrenWithType(children, dom, lifecycle, context) {
    var domNodes = Array.prototype.slice.call(dom.childNodes);
    for (var i = 0; i < children.length; i++) {
        hydrate(children[i], domNodes[i], lifecycle, context);
    }
}
function hydrateChildrenWithUnknownType(children, dom, lifecycle, context) {
    var domNodes = Array.prototype.slice.call(dom.childNodes);
    if (isArray(children)) {
        for (var i = 0; i < children.length; i++) {
            var child = normaliseChild(children, i);
            if (isObject(child)) {
                hydrate(child, domNodes[i], lifecycle, context);
            }
        }
    }
    else if (isObject(children)) {
        hydrate(children, dom.firstChild, lifecycle, context);
    }
}
function hydrateChildren(childrenType, children, dom, lifecycle, context, isSVG) {
    if ( isSVG === void 0 ) isSVG = false;

    if (isNodeChildrenType(childrenType)) {
        hydrate(children, dom.firstChild, lifecycle, context);
    }
    else if (isKeyedListChildrenType(childrenType) || isNonKeyedListChildrenType(childrenType)) {
        hydrateArrayChildrenWithType(children, dom, lifecycle, context);
    }
    else if (isUnknownChildrenType(childrenType)) {
        hydrateChildrenWithUnknownType(children, dom, lifecycle, context);
    }
    else if (!isTextChildrenType(childrenType)) {
        if (process.env.NODE_ENV !== 'production') {
            throwError$1('Bad childrenType value specified when attempting to hydrateChildren.');
        }
        throwError$1();
    }
}
function hydrateStaticVElement(node, dom) {
    var children = node.children;
    if (!isNull$1(children) && !isNullOrUndef$1(dom)) {
        if (!isStringOrNumber(children) && !isInvalid$1(children)) {
            var childNode = dom.firstChild;
            if (isArray(children)) {
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (!isStringOrNumber(child) && !isInvalid$1(child)) {
                        normaliseChildNodes(childNode);
                        hydrateStaticVElement(child, normaliseChildNodes(childNode));
                    }
                    childNode = childNode.nextSibling;
                }
            }
            else {
                normaliseChildNodes(childNode);
                hydrateStaticVElement(children, childNode);
            }
        }
    }
}
function hydrateOptVElement(optVElement, dom, lifecycle, context) {
    var bp = optVElement.bp;
    var bp0 = bp.v0;
    var staticVElement = bp.staticVElement;
    hydrateStaticVElement(staticVElement, dom);
    optVElement.dom = dom;
    if (!isNull$1(bp0)) {
        hydrateOptVElementValue(optVElement, bp0, optVElement.v0, bp.d0, dom, lifecycle, context);
        var bp1 = bp.v1;
        if (!isNull$1(bp1)) {
            hydrateOptVElementValue(optVElement, bp1, optVElement.v1, bp.d1, dom, lifecycle, context);
            var bp2 = bp.v2;
            if (!isNull$1(bp2)) {
                hydrateOptVElementValue(optVElement, bp2, optVElement.v2, bp.d2, dom, lifecycle, context);
                var bp3 = bp.v3;
                if (!isNull$1(bp3)) {
                    var v3 = optVElement.v3;
                    var d3 = bp.d3;
                    var bp3$1 = bp.v3;
                    for (var i = 0; i < bp3$1.length; i++) {
                        hydrateOptVElementValue(optVElement, bp3$1[i], v3[i], d3[i], dom, lifecycle, context);
                    }
                }
            }
        }
    }
}
function hydrateVText(vText, dom) {
    vText.dom = dom;
}
function hydrateVPlaceholder(vPlaceholder, dom) {
    vPlaceholder.dom = dom;
}
function hydrateVFragment(vFragment, currentDom, lifecycle, context) {
    var children = vFragment.children;
    var parentDom = currentDom.parentNode;
    var pointer = vFragment.pointer = document.createTextNode('');
    for (var i = 0; i < children.length; i++) {
        var child = normaliseChild(children, i);
        var childDom = currentDom;
        if (isObject(child)) {
            hydrate(child, childDom, lifecycle, context);
        }
        currentDom = currentDom.nextSibling;
    }
    parentDom.insertBefore(pointer, currentDom);
}
function hydrateOptVElementValue(optVElement, valueType, value, descriptor, dom, lifecycle, context, isSVG) {
    if ( isSVG === void 0 ) isSVG = false;

    switch (valueType) {
        case inferno.ValueTypes.CHILDREN:
            if (value === null) {
                mountChildren(descriptor, value, dom, lifecycle, context, isSVG, false);
            }
            else {
                hydrateChildren(descriptor, value, dom, lifecycle, context, isSVG);
            }
            break;
        case inferno.ValueTypes.PROP_SPREAD:
            debugger;
            break;
        case inferno.ValueTypes.PROP_DATA:
            dom.dataset[descriptor] = value;
            break;
        case inferno.ValueTypes.PROP_STYLE:
            patchStyle(null, value, dom);
            break;
        case inferno.ValueTypes.PROP_VALUE:
            dom.value = isNullOrUndef$1(value) ? '' : value;
            break;
        case inferno.ValueTypes.PROP:
            patchProp(descriptor, null, value, dom, false);
            break;
        default:
    }
}
function hydrate(input, dom, lifecycle, context) {
    normaliseChildNodes(dom);
    if (inferno.isOptVElement(input)) {
        hydrateOptVElement(input, dom, lifecycle, context);
    }
    else if (inferno.isVComponent(input)) {
        hydrateVComponent(input, dom, lifecycle, context);
    }
    else if (inferno.isVElement(input)) {
        hydrateVElement(input, dom, lifecycle, context);
    }
    else if (inferno.isVText(input)) {
        hydrateVText(input, dom);
    }
    else if (inferno.isVFragment(input)) {
        hydrateVFragment(input, dom, lifecycle, context);
    }
    else if (inferno.isVPlaceholder(input)) {
        hydrateVPlaceholder(input, dom);
    }
    else {
        if (process.env.NODE_ENV !== 'production') {
            throwError$1('bad input argument called on hydrate(). Input argument may need normalising.');
        }
        throwError$1();
    }
}
function hydrateRoot(input, parentDom, lifecycle) {
    if (parentDom && parentDom.nodeType === 1) {
        var rootNode = parentDom.querySelector('[data-infernoroot]');
        if (rootNode && rootNode.parentNode === parentDom) {
            rootNode.removeAttribute('data-infernoroot');
            hydrate(input, rootNode, lifecycle, {});
            return true;
        }
    }
    return false;
}

var isNull = inferno.common.isNull;
var isInvalid = inferno.common.isInvalid;
var isNullOrUndef = inferno.common.isNullOrUndef;
var isBrowser = inferno.common.isBrowser;
var throwError = inferno.common.throwError;
var NO_OP = inferno.common.NO_OP;
// rather than use a Map, like we did before, we can use an array here
// given there shouldn't be THAT many roots on the page, the difference
// in performance is huge: https://esbench.com/bench/5802a691330ab09900a1a2da
var roots = [];
var componentToDOMNodeMap = new Map();
function findDOMNode(domNode) {
    return componentToDOMNodeMap.get(domNode) || null;
}
var documentBody = isBrowser ? document.body : null;
function getRoot(dom) {
    for (var i = 0; i < roots.length; i++) {
        var root = roots[i];
        if (root.dom === dom) {
            return root;
        }
    }
    return null;
}
function setRoot(dom, input) {
    roots.push({
        dom: dom,
        input: input
    });
}
function removeRoot(root) {
    for (var i = 0; i < roots.length; i++) {
        if (roots[i] === root) {
            roots.splice(i, 1);
            return;
        }
    }
}
function render(input, parentDom) {
    if (documentBody === parentDom) {
        if (process.env.NODE_ENV !== 'production') {
            throwError('you cannot render() to the "document.body". Use an empty element as a container instead.');
        }
        throwError();
    }
    if (input === NO_OP) {
        return;
    }
    var root = getRoot(parentDom);
    var lifecycle = new Lifecycle();
    if (isNull(root)) {
        if (!isInvalid(input)) {
            if (input.dom) {
                input = inferno.cloneVNode(input);
            }
            if (!hydrateRoot(input, parentDom, lifecycle)) {
                mountChildrenWithUnknownType(input, parentDom, lifecycle, {}, false, false);
            }
            lifecycle.trigger();
            setRoot(parentDom, input);
        }
    }
    else {
        if (isNullOrUndef(input)) {
            unmount(root.input, parentDom, lifecycle, false, false);
            removeRoot(root);
        }
        else {
            if (input.dom) {
                input = inferno.cloneVNode(input);
            }
            patchChildrenWithUnknownType(root.input, input, parentDom, lifecycle, {}, false, false);
        }
        lifecycle.trigger();
        root.input = input;
    }
    if (devToolsStatus.connected) {
        sendRoots(window);
    }
}
function createRenderer() {
    var parentDom;
    return function renderer(lastInput, nextInput) {
        if (!parentDom) {
            parentDom = lastInput;
        }
        render(nextInput, parentDom);
    };
}

if (inferno.common.isBrowser) {
    initDevToolsHooks(window);
}
var index = {
    render: render,
    findDOMNode: findDOMNode,
    createRenderer: createRenderer,
    createStaticVElementClone: createStaticVElementClone,
    disableRecycling: disableRecycling
};

return index;

})));
