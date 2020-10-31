
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var _snippets = [{extension:"html",author:"@khangnd",content:"<h1>About Me</h1>\r\n<h2 class=\"description\">Software Developer, Front-end Enthusiast</h2>\r\n<div class=\"slogan\">With ❤ crafting - For 💯 striving</div>\r\n<section>\r\n    <h3>Hobby</h3>\r\n    <div>\r\n        <i class=\"fas fa-laptop-code\"></i> Coding\r\n    </div>\r\n    <div>\r\n        <i class=\"fas fa-palette\"></i> Front-end design\r\n    </div>\r\n    <div>\r\n        <i class=\"fas fa-newspaper\"></i> Reading tech blogs\r\n    </div>\r\n    <div>\r\n        <i class=\"fas fa-basketball-ball\"></i> Basketball\r\n    </div>\r\n    <div>\r\n        <i class=\"fas fa-music\"></i> Music\r\n    </div>\r\n</section>"},{extension:"js",author:"JohnDoe",content:"let person = new Person(\"John Doe\");\r\nif (person.isDeveloper === true)\r\n{\r\n    person.eat();\r\n    person.sleep();\r\n    person.learn(code);\r\n    person.work(code);\r\n    person.express(code);\r\n}"}];

    /* src\components\Hero.svelte generated by Svelte v3.29.4 */
    const file = "src\\components\\Hero.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div2;
    	let div1;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h1;
    	let t2;
    	let p;
    	let t3;
    	let u0;
    	let t5;
    	let u1;
    	let t7;
    	let t8;
    	let div6;
    	let div3;
    	let t9;
    	let div5;
    	let div4;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			div1 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Express Code";
    			t2 = space();
    			p = element("p");
    			t3 = text("As developers, what cooler way to\r\n          ");
    			u0 = element("u");
    			u0.textContent = "express";
    			t5 = text("\r\n          ourselves other than with\r\n          ");
    			u1 = element("u");
    			u1.textContent = "code";
    			t7 = text("?");
    			t8 = space();
    			div6 = element("div");
    			div3 = element("div");
    			t9 = space();
    			div5 = element("div");
    			div4 = element("div");
    			if (img.src !== (img_src_value = "/favicon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo");
    			add_location(img, file, 35, 8, 851);
    			attr_dev(figure, "class", "image p-2 is-128x128 is-hidden-touch");
    			add_location(figure, file, 34, 6, 788);
    			attr_dev(h1, "class", "title is-1");
    			add_location(h1, file, 38, 8, 953);
    			add_location(u0, file, 41, 10, 1080);
    			add_location(u1, file, 43, 10, 1143);
    			attr_dev(p, "class", "subtitle");
    			add_location(p, file, 39, 8, 1003);
    			attr_dev(div0, "class", "column is-5 pt-0");
    			add_location(div0, file, 37, 6, 913);
    			attr_dev(div1, "class", "container columns svelte-zphw2a");
    			add_location(div1, file, 33, 4, 749);
    			attr_dev(div2, "class", "hero-body svelte-zphw2a");
    			add_location(div2, file, 32, 2, 720);
    			attr_dev(section, "class", "hero is-primary");
    			add_location(section, file, 31, 0, 683);
    			attr_dev(div3, "class", "column is-6");
    			add_location(div3, file, 50, 2, 1268);
    			attr_dev(div4, "class", "sample");
    			add_location(div4, file, 52, 4, 1330);
    			attr_dev(div5, "class", "column is-5");
    			add_location(div5, file, 51, 2, 1299);
    			attr_dev(div6, "class", "columns is-gapless hero-snippet svelte-zphw2a");
    			add_location(div6, file, 49, 0, 1219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			append_dev(div2, div1);
    			append_dev(div1, figure);
    			append_dev(figure, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(p, u0);
    			append_dev(p, t5);
    			append_dev(p, u1);
    			append_dev(p, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div3);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			/*div4_binding*/ ctx[1](div4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div6);
    			/*div4_binding*/ ctx[1](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Hero", slots, []);
    	const _ = _snippets.find(snippet => (/JohnDoe/).test(snippet.author));
    	let sample;

    	onMount(() => {
    		const { mode } = CodeMirror.findModeByExtension(_.extension);

    		const cm = new CodeMirror(sample,
    		{
    				lineNumbers: true,
    				theme: "base16-dark",
    				readOnly: true,
    				value: _.content,
    				mode
    			});

    		CodeMirror.autoLoadMode(cm, mode);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			sample = $$value;
    			$$invalidate(0, sample);
    		});
    	}

    	$$self.$capture_state = () => ({ snippets: _snippets, onMount, _, sample });

    	$$self.$inject_state = $$props => {
    		if ("sample" in $$props) $$invalidate(0, sample = $$props.sample);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sample, div4_binding];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var domToImage = createCommonjsModule(function (module) {
    (function (global) {

        var util = newUtil();
        var inliner = newInliner();
        var fontFaces = newFontFaces();
        var images = newImages();

        // Default impl options
        var defaultOptions = {
            // Default is to fail on error, no placeholder
            imagePlaceholder: undefined,
            // Default cache bust is false, it will use the cache
            cacheBust: false
        };

        var domtoimage = {
            toSvg: toSvg,
            toPng: toPng,
            toJpeg: toJpeg,
            toBlob: toBlob,
            toPixelData: toPixelData,
            impl: {
                fontFaces: fontFaces,
                images: images,
                util: util,
                inliner: inliner,
                options: {}
            }
        };

        module.exports = domtoimage;


        /**
         * @param {Node} node - The DOM Node object to render
         * @param {Object} options - Rendering options
         * @param {Function} options.filter - Should return true if passed node should be included in the output
         *          (excluding node means excluding it's children as well). Not called on the root node.
         * @param {String} options.bgcolor - color for the background, any valid CSS color value.
         * @param {Number} options.width - width to be applied to node before rendering.
         * @param {Number} options.height - height to be applied to node before rendering.
         * @param {Object} options.style - an object whose properties to be copied to node's style before rendering.
         * @param {Number} options.quality - a Number between 0 and 1 indicating image quality (applicable to JPEG only),
                    defaults to 1.0.
         * @param {String} options.imagePlaceholder - dataURL to use as a placeholder for failed images, default behaviour is to fail fast on images we can't fetch
         * @param {Boolean} options.cacheBust - set to true to cache bust by appending the time to the request url
         * @return {Promise} - A promise that is fulfilled with a SVG image data URL
         * */
        function toSvg(node, options) {
            options = options || {};
            copyOptions(options);
            return Promise.resolve(node)
                .then(function (node) {
                    return cloneNode(node, options.filter, true);
                })
                .then(embedFonts)
                .then(inlineImages)
                .then(applyOptions)
                .then(function (clone) {
                    return makeSvgDataUri(clone,
                        options.width || util.width(node),
                        options.height || util.height(node)
                    );
                });

            function applyOptions(clone) {
                if (options.bgcolor) clone.style.backgroundColor = options.bgcolor;

                if (options.width) clone.style.width = options.width + 'px';
                if (options.height) clone.style.height = options.height + 'px';

                if (options.style)
                    Object.keys(options.style).forEach(function (property) {
                        clone.style[property] = options.style[property];
                    });

                return clone;
            }
        }

        /**
         * @param {Node} node - The DOM Node object to render
         * @param {Object} options - Rendering options, @see {@link toSvg}
         * @return {Promise} - A promise that is fulfilled with a Uint8Array containing RGBA pixel data.
         * */
        function toPixelData(node, options) {
            return draw(node, options || {})
                .then(function (canvas) {
                    return canvas.getContext('2d').getImageData(
                        0,
                        0,
                        util.width(node),
                        util.height(node)
                    ).data;
                });
        }

        /**
         * @param {Node} node - The DOM Node object to render
         * @param {Object} options - Rendering options, @see {@link toSvg}
         * @return {Promise} - A promise that is fulfilled with a PNG image data URL
         * */
        function toPng(node, options) {
            return draw(node, options || {})
                .then(function (canvas) {
                    return canvas.toDataURL();
                });
        }

        /**
         * @param {Node} node - The DOM Node object to render
         * @param {Object} options - Rendering options, @see {@link toSvg}
         * @return {Promise} - A promise that is fulfilled with a JPEG image data URL
         * */
        function toJpeg(node, options) {
            options = options || {};
            return draw(node, options)
                .then(function (canvas) {
                    return canvas.toDataURL('image/jpeg', options.quality || 1.0);
                });
        }

        /**
         * @param {Node} node - The DOM Node object to render
         * @param {Object} options - Rendering options, @see {@link toSvg}
         * @return {Promise} - A promise that is fulfilled with a PNG image blob
         * */
        function toBlob(node, options) {
            return draw(node, options || {})
                .then(util.canvasToBlob);
        }

        function copyOptions(options) {
            // Copy options to impl options for use in impl
            if(typeof(options.imagePlaceholder) === 'undefined') {
                domtoimage.impl.options.imagePlaceholder = defaultOptions.imagePlaceholder;
            } else {
                domtoimage.impl.options.imagePlaceholder = options.imagePlaceholder;
            }

            if(typeof(options.cacheBust) === 'undefined') {
                domtoimage.impl.options.cacheBust = defaultOptions.cacheBust;
            } else {
                domtoimage.impl.options.cacheBust = options.cacheBust;
            }
        }

        function draw(domNode, options) {
            return toSvg(domNode, options)
                .then(util.makeImage)
                .then(util.delay(100))
                .then(function (image) {
                    var canvas = newCanvas(domNode);
                    canvas.getContext('2d').drawImage(image, 0, 0);
                    return canvas;
                });

            function newCanvas(domNode) {
                var canvas = document.createElement('canvas');
                canvas.width = options.width || util.width(domNode);
                canvas.height = options.height || util.height(domNode);

                if (options.bgcolor) {
                    var ctx = canvas.getContext('2d');
                    ctx.fillStyle = options.bgcolor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                return canvas;
            }
        }

        function cloneNode(node, filter, root) {
            if (!root && filter && !filter(node)) return Promise.resolve();

            return Promise.resolve(node)
                .then(makeNodeCopy)
                .then(function (clone) {
                    return cloneChildren(node, clone, filter);
                })
                .then(function (clone) {
                    return processClone(node, clone);
                });

            function makeNodeCopy(node) {
                if (node instanceof HTMLCanvasElement) return util.makeImage(node.toDataURL());
                return node.cloneNode(false);
            }

            function cloneChildren(original, clone, filter) {
                var children = original.childNodes;
                if (children.length === 0) return Promise.resolve(clone);

                return cloneChildrenInOrder(clone, util.asArray(children), filter)
                    .then(function () {
                        return clone;
                    });

                function cloneChildrenInOrder(parent, children, filter) {
                    var done = Promise.resolve();
                    children.forEach(function (child) {
                        done = done
                            .then(function () {
                                return cloneNode(child, filter);
                            })
                            .then(function (childClone) {
                                if (childClone) parent.appendChild(childClone);
                            });
                    });
                    return done;
                }
            }

            function processClone(original, clone) {
                if (!(clone instanceof Element)) return clone;

                return Promise.resolve()
                    .then(cloneStyle)
                    .then(clonePseudoElements)
                    .then(copyUserInput)
                    .then(fixSvg)
                    .then(function () {
                        return clone;
                    });

                function cloneStyle() {
                    copyStyle(window.getComputedStyle(original), clone.style);

                    function copyStyle(source, target) {
                        if (source.cssText) target.cssText = source.cssText;
                        else copyProperties(source, target);

                        function copyProperties(source, target) {
                            util.asArray(source).forEach(function (name) {
                                target.setProperty(
                                    name,
                                    source.getPropertyValue(name),
                                    source.getPropertyPriority(name)
                                );
                            });
                        }
                    }
                }

                function clonePseudoElements() {
                    [':before', ':after'].forEach(function (element) {
                        clonePseudoElement(element);
                    });

                    function clonePseudoElement(element) {
                        var style = window.getComputedStyle(original, element);
                        var content = style.getPropertyValue('content');

                        if (content === '' || content === 'none') return;

                        var className = util.uid();
                        clone.className = clone.className + ' ' + className;
                        var styleElement = document.createElement('style');
                        styleElement.appendChild(formatPseudoElementStyle(className, element, style));
                        clone.appendChild(styleElement);

                        function formatPseudoElementStyle(className, element, style) {
                            var selector = '.' + className + ':' + element;
                            var cssText = style.cssText ? formatCssText(style) : formatCssProperties(style);
                            return document.createTextNode(selector + '{' + cssText + '}');

                            function formatCssText(style) {
                                var content = style.getPropertyValue('content');
                                return style.cssText + ' content: ' + content + ';';
                            }

                            function formatCssProperties(style) {

                                return util.asArray(style)
                                    .map(formatProperty)
                                    .join('; ') + ';';

                                function formatProperty(name) {
                                    return name + ': ' +
                                        style.getPropertyValue(name) +
                                        (style.getPropertyPriority(name) ? ' !important' : '');
                                }
                            }
                        }
                    }
                }

                function copyUserInput() {
                    if (original instanceof HTMLTextAreaElement) clone.innerHTML = original.value;
                    if (original instanceof HTMLInputElement) clone.setAttribute("value", original.value);
                }

                function fixSvg() {
                    if (!(clone instanceof SVGElement)) return;
                    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

                    if (!(clone instanceof SVGRectElement)) return;
                    ['width', 'height'].forEach(function (attribute) {
                        var value = clone.getAttribute(attribute);
                        if (!value) return;

                        clone.style.setProperty(attribute, value);
                    });
                }
            }
        }

        function embedFonts(node) {
            return fontFaces.resolveAll()
                .then(function (cssText) {
                    var styleNode = document.createElement('style');
                    node.appendChild(styleNode);
                    styleNode.appendChild(document.createTextNode(cssText));
                    return node;
                });
        }

        function inlineImages(node) {
            return images.inlineAll(node)
                .then(function () {
                    return node;
                });
        }

        function makeSvgDataUri(node, width, height) {
            return Promise.resolve(node)
                .then(function (node) {
                    node.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
                    return new XMLSerializer().serializeToString(node);
                })
                .then(util.escapeXhtml)
                .then(function (xhtml) {
                    return '<foreignObject x="0" y="0" width="100%" height="100%">' + xhtml + '</foreignObject>';
                })
                .then(function (foreignObject) {
                    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
                        foreignObject + '</svg>';
                })
                .then(function (svg) {
                    return 'data:image/svg+xml;charset=utf-8,' + svg;
                });
        }

        function newUtil() {
            return {
                escape: escape,
                parseExtension: parseExtension,
                mimeType: mimeType,
                dataAsUrl: dataAsUrl,
                isDataUrl: isDataUrl,
                canvasToBlob: canvasToBlob,
                resolveUrl: resolveUrl,
                getAndEncode: getAndEncode,
                uid: uid(),
                delay: delay,
                asArray: asArray,
                escapeXhtml: escapeXhtml,
                makeImage: makeImage,
                width: width,
                height: height
            };

            function mimes() {
                /*
                 * Only WOFF and EOT mime types for fonts are 'real'
                 * see http://www.iana.org/assignments/media-types/media-types.xhtml
                 */
                var WOFF = 'application/font-woff';
                var JPEG = 'image/jpeg';

                return {
                    'woff': WOFF,
                    'woff2': WOFF,
                    'ttf': 'application/font-truetype',
                    'eot': 'application/vnd.ms-fontobject',
                    'png': 'image/png',
                    'jpg': JPEG,
                    'jpeg': JPEG,
                    'gif': 'image/gif',
                    'tiff': 'image/tiff',
                    'svg': 'image/svg+xml'
                };
            }

            function parseExtension(url) {
                var match = /\.([^\.\/]*?)$/g.exec(url);
                if (match) return match[1];
                else return '';
            }

            function mimeType(url) {
                var extension = parseExtension(url).toLowerCase();
                return mimes()[extension] || '';
            }

            function isDataUrl(url) {
                return url.search(/^(data:)/) !== -1;
            }

            function toBlob(canvas) {
                return new Promise(function (resolve) {
                    var binaryString = window.atob(canvas.toDataURL().split(',')[1]);
                    var length = binaryString.length;
                    var binaryArray = new Uint8Array(length);

                    for (var i = 0; i < length; i++)
                        binaryArray[i] = binaryString.charCodeAt(i);

                    resolve(new Blob([binaryArray], {
                        type: 'image/png'
                    }));
                });
            }

            function canvasToBlob(canvas) {
                if (canvas.toBlob)
                    return new Promise(function (resolve) {
                        canvas.toBlob(resolve);
                    });

                return toBlob(canvas);
            }

            function resolveUrl(url, baseUrl) {
                var doc = document.implementation.createHTMLDocument();
                var base = doc.createElement('base');
                doc.head.appendChild(base);
                var a = doc.createElement('a');
                doc.body.appendChild(a);
                base.href = baseUrl;
                a.href = url;
                return a.href;
            }

            function uid() {
                var index = 0;

                return function () {
                    return 'u' + fourRandomChars() + index++;

                    function fourRandomChars() {
                        /* see http://stackoverflow.com/a/6248722/2519373 */
                        return ('0000' + (Math.random() * Math.pow(36, 4) << 0).toString(36)).slice(-4);
                    }
                };
            }

            function makeImage(uri) {
                return new Promise(function (resolve, reject) {
                    var image = new Image();
                    image.onload = function () {
                        resolve(image);
                    };
                    image.onerror = reject;
                    image.src = uri;
                });
            }

            function getAndEncode(url) {
                var TIMEOUT = 30000;
                if(domtoimage.impl.options.cacheBust) {
                    // Cache bypass so we dont have CORS issues with cached images
                    // Source: https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
                    url += ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
                }

                return new Promise(function (resolve) {
                    var request = new XMLHttpRequest();

                    request.onreadystatechange = done;
                    request.ontimeout = timeout;
                    request.responseType = 'blob';
                    request.timeout = TIMEOUT;
                    request.open('GET', url, true);
                    request.send();

                    var placeholder;
                    if(domtoimage.impl.options.imagePlaceholder) {
                        var split = domtoimage.impl.options.imagePlaceholder.split(/,/);
                        if(split && split[1]) {
                            placeholder = split[1];
                        }
                    }

                    function done() {
                        if (request.readyState !== 4) return;

                        if (request.status !== 200) {
                            if(placeholder) {
                                resolve(placeholder);
                            } else {
                                fail('cannot fetch resource: ' + url + ', status: ' + request.status);
                            }

                            return;
                        }

                        var encoder = new FileReader();
                        encoder.onloadend = function () {
                            var content = encoder.result.split(/,/)[1];
                            resolve(content);
                        };
                        encoder.readAsDataURL(request.response);
                    }

                    function timeout() {
                        if(placeholder) {
                            resolve(placeholder);
                        } else {
                            fail('timeout of ' + TIMEOUT + 'ms occured while fetching resource: ' + url);
                        }
                    }

                    function fail(message) {
                        console.error(message);
                        resolve('');
                    }
                });
            }

            function dataAsUrl(content, type) {
                return 'data:' + type + ';base64,' + content;
            }

            function escape(string) {
                return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
            }

            function delay(ms) {
                return function (arg) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(arg);
                        }, ms);
                    });
                };
            }

            function asArray(arrayLike) {
                var array = [];
                var length = arrayLike.length;
                for (var i = 0; i < length; i++) array.push(arrayLike[i]);
                return array;
            }

            function escapeXhtml(string) {
                return string.replace(/#/g, '%23').replace(/\n/g, '%0A');
            }

            function width(node) {
                var leftBorder = px(node, 'border-left-width');
                var rightBorder = px(node, 'border-right-width');
                return node.scrollWidth + leftBorder + rightBorder;
            }

            function height(node) {
                var topBorder = px(node, 'border-top-width');
                var bottomBorder = px(node, 'border-bottom-width');
                return node.scrollHeight + topBorder + bottomBorder;
            }

            function px(node, styleProperty) {
                var value = window.getComputedStyle(node).getPropertyValue(styleProperty);
                return parseFloat(value.replace('px', ''));
            }
        }

        function newInliner() {
            var URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

            return {
                inlineAll: inlineAll,
                shouldProcess: shouldProcess,
                impl: {
                    readUrls: readUrls,
                    inline: inline
                }
            };

            function shouldProcess(string) {
                return string.search(URL_REGEX) !== -1;
            }

            function readUrls(string) {
                var result = [];
                var match;
                while ((match = URL_REGEX.exec(string)) !== null) {
                    result.push(match[1]);
                }
                return result.filter(function (url) {
                    return !util.isDataUrl(url);
                });
            }

            function inline(string, url, baseUrl, get) {
                return Promise.resolve(url)
                    .then(function (url) {
                        return baseUrl ? util.resolveUrl(url, baseUrl) : url;
                    })
                    .then(get || util.getAndEncode)
                    .then(function (data) {
                        return util.dataAsUrl(data, util.mimeType(url));
                    })
                    .then(function (dataUrl) {
                        return string.replace(urlAsRegex(url), '$1' + dataUrl + '$3');
                    });

                function urlAsRegex(url) {
                    return new RegExp('(url\\([\'"]?)(' + util.escape(url) + ')([\'"]?\\))', 'g');
                }
            }

            function inlineAll(string, baseUrl, get) {
                if (nothingToInline()) return Promise.resolve(string);

                return Promise.resolve(string)
                    .then(readUrls)
                    .then(function (urls) {
                        var done = Promise.resolve(string);
                        urls.forEach(function (url) {
                            done = done.then(function (string) {
                                return inline(string, url, baseUrl, get);
                            });
                        });
                        return done;
                    });

                function nothingToInline() {
                    return !shouldProcess(string);
                }
            }
        }

        function newFontFaces() {
            return {
                resolveAll: resolveAll,
                impl: {
                    readAll: readAll
                }
            };

            function resolveAll() {
                return readAll()
                    .then(function (webFonts) {
                        return Promise.all(
                            webFonts.map(function (webFont) {
                                return webFont.resolve();
                            })
                        );
                    })
                    .then(function (cssStrings) {
                        return cssStrings.join('\n');
                    });
            }

            function readAll() {
                return Promise.resolve(util.asArray(document.styleSheets))
                    .then(getCssRules)
                    .then(selectWebFontRules)
                    .then(function (rules) {
                        return rules.map(newWebFont);
                    });

                function selectWebFontRules(cssRules) {
                    return cssRules
                        .filter(function (rule) {
                            return rule.type === CSSRule.FONT_FACE_RULE;
                        })
                        .filter(function (rule) {
                            return inliner.shouldProcess(rule.style.getPropertyValue('src'));
                        });
                }

                function getCssRules(styleSheets) {
                    var cssRules = [];
                    styleSheets.forEach(function (sheet) {
                        try {
                            util.asArray(sheet.cssRules || []).forEach(cssRules.push.bind(cssRules));
                        } catch (e) {
                            console.log('Error while reading CSS rules from ' + sheet.href, e.toString());
                        }
                    });
                    return cssRules;
                }

                function newWebFont(webFontRule) {
                    return {
                        resolve: function resolve() {
                            var baseUrl = (webFontRule.parentStyleSheet || {}).href;
                            return inliner.inlineAll(webFontRule.cssText, baseUrl);
                        },
                        src: function () {
                            return webFontRule.style.getPropertyValue('src');
                        }
                    };
                }
            }
        }

        function newImages() {
            return {
                inlineAll: inlineAll,
                impl: {
                    newImage: newImage
                }
            };

            function newImage(element) {
                return {
                    inline: inline
                };

                function inline(get) {
                    if (util.isDataUrl(element.src)) return Promise.resolve();

                    return Promise.resolve(element.src)
                        .then(get || util.getAndEncode)
                        .then(function (data) {
                            return util.dataAsUrl(data, util.mimeType(element.src));
                        })
                        .then(function (dataUrl) {
                            return new Promise(function (resolve, reject) {
                                element.onload = resolve;
                                element.onerror = reject;
                                element.src = dataUrl;
                            });
                        });
                }
            }

            function inlineAll(node) {
                if (!(node instanceof Element)) return Promise.resolve(node);

                return inlineBackground(node)
                    .then(function () {
                        if (node instanceof HTMLImageElement)
                            return newImage(node).inline();
                        else
                            return Promise.all(
                                util.asArray(node.childNodes).map(function (child) {
                                    return inlineAll(child);
                                })
                            );
                    });

                function inlineBackground(node) {
                    var background = node.style.getPropertyValue('background');

                    if (!background) return Promise.resolve(node);

                    return inliner.inlineAll(background)
                        .then(function (inlined) {
                            node.style.setProperty(
                                'background',
                                inlined,
                                node.style.getPropertyPriority('background')
                            );
                        })
                        .then(function () {
                            return node;
                        });
                }
            }
        }
    })();
    });

    var themes = ["3024-day.css","3024-night.css","abcdef.css","ambiance-mobile.css","ambiance.css","ayu-dark.css","ayu-mirage.css","base16-dark.css","base16-light.css","bespin.css","blackboard.css","cobalt.css","colorforth.css","darcula.css","dracula.css","duotone-dark.css","duotone-light.css","eclipse.css","elegant.css","erlang-dark.css","gruvbox-dark.css","hopscotch.css","icecoder.css","idea.css","isotope.css","lesser-dark.css","liquibyte.css","lucario.css","material-darker.css","material-ocean.css","material-palenight.css","material.css","mbo.css","mdn-like.css","midnight.css","monokai.css","moxer.css","neat.css","neo.css","night.css","nord.css","oceanic-next.css","panda-syntax.css","paraiso-dark.css","paraiso-light.css","pastel-on-dark.css","railscasts.css","rubyblue.css","seti.css","shadowfox.css","solarized.css","ssms.css","the-matrix.css","tomorrow-night-bright.css","tomorrow-night-eighties.css","ttcn.css","twilight.css","vibrant-ink.css","xq-dark.css","xq-light.css","yeti.css","yonce.css","zenburn.css"];

    /**
     * @param {string} input
     * @return {string}
     */
    function toCamelCase(input) {
      const w = " ";
      const c = "";
      return input
        .split(w)
        .map((word) =>
          word
            .split(c)
            .map((char, i) => (i === 0 ? char.toUpperCase() : char))
            .join(c)
        )
        .join(w);
    }

    var ms = {};

    function getItem (key) {
      return key in ms ? ms[key] : null;
    }

    function setItem (key, value) {
      ms[key] = value;
      return true;
    }

    function removeItem (key) {
      var found = key in ms;
      if (found) {
        return delete ms[key];
      }
      return false;
    }

    function clear () {
      ms = {};
      return true;
    }

    var stub = {
      getItem: getItem,
      setItem: setItem,
      removeItem: removeItem,
      clear: clear
    };

    function parse (rawValue) {
      const parsed = parseValue(rawValue);

      if (parsed === undefined) {
        return null;
      }

      return parsed;
    }

    function parseValue (rawValue) {
      try {
        return JSON.parse(rawValue);
      } catch (err) {
        return rawValue;
      }
    }

    var parse_1 = parse;

    var listeners = {};

    function listen$1 () {
      if (commonjsGlobal.addEventListener) {
        commonjsGlobal.addEventListener('storage', change, false);
      } else if (commonjsGlobal.attachEvent) {
        commonjsGlobal.attachEvent('onstorage', change);
      } else {
        commonjsGlobal.onstorage = change;
      }
    }

    function change (e) {
      if (!e) {
        e = commonjsGlobal.event;
      }
      var all = listeners[e.key];
      if (all) {
        all.forEach(fire);
      }

      function fire (listener) {
        listener(parse_1(e.newValue), parse_1(e.oldValue), e.url || e.uri);
      }
    }

    function on (key, fn) {
      if (listeners[key]) {
        listeners[key].push(fn);
      } else {
        listeners[key] = [fn];
      }
      {
        listen$1();
      }
    }

    function off (key, fn) {
      var ns = listeners[key];
      if (ns.length > 1) {
        ns.splice(ns.indexOf(fn), 1);
      } else {
        listeners[key] = [];
      }
    }

    var tracking = {
      on: on,
      off: off
    };

    var ls = 'localStorage' in commonjsGlobal && commonjsGlobal.localStorage ? commonjsGlobal.localStorage : stub;

    function accessor (key, value) {
      if (arguments.length === 1) {
        return get(key);
      }
      return set(key, value);
    }

    function get (key) {
      const raw = ls.getItem(key);
      const parsed = parse_1(raw);
      return parsed;
    }

    function set (key, value) {
      try {
        ls.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    }

    function remove (key) {
      return ls.removeItem(key);
    }

    function clear$1 () {
      return ls.clear();
    }

    function backend (store) {
      store && (ls = store);

      return ls;
    }

    accessor.set = set;
    accessor.get = get;
    accessor.remove = remove;
    accessor.clear = clear$1;
    accessor.backend = backend;
    accessor.on = tracking.on;
    accessor.off = tracking.off;

    var localStorage = accessor;

    /* src\components\editor\SelectTheme.svelte generated by Svelte v3.29.4 */
    const file$1 = "src\\components\\editor\\SelectTheme.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (27:8) {#each themes as theme}
    function create_each_block(ctx) {
    	let option;
    	let t_value = toCamelCase(/*theme*/ ctx[0]) + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*theme*/ ctx[0];
    			option.value = option.__value;
    			add_location(option, file$1, 27, 10, 829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:8) {#each themes as theme}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let p;
    	let span0;
    	let select;
    	let option;
    	let t1;
    	let span1;
    	let i;
    	let mounted;
    	let dispose;
    	let each_value = /*themes*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			span0 = element("span");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select Theme";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			span1 = element("span");
    			i = element("i");
    			option.disabled = true;
    			option.selected = true;
    			option.__value = "Select Theme";
    			option.value = option.__value;
    			add_location(option, file$1, 25, 8, 737);
    			if (/*theme*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$1, 24, 6, 700);
    			attr_dev(span0, "class", "select is-fullwidth");
    			add_location(span0, file$1, 23, 4, 658);
    			attr_dev(i, "class", "mdi mdi-format-paint mdi-24px");
    			add_location(i, file$1, 32, 6, 968);
    			attr_dev(span1, "class", "icon is-left");
    			add_location(span1, file$1, 31, 4, 933);
    			attr_dev(p, "class", "control has-icons-left");
    			add_location(p, file$1, 22, 2, 618);
    			attr_dev(div, "class", "field");
    			add_location(div, file$1, 21, 0, 595);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, span0);
    			append_dev(span0, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*theme*/ ctx[0]);
    			append_dev(p, t1);
    			append_dev(p, span1);
    			append_dev(span1, i);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*themes, toCamelCase*/ 2) {
    				each_value = /*themes*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*theme, themes*/ 3) {
    				select_option(select, /*theme*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectTheme", slots, []);
    	let { theme = localStorage.get("theme") || "" } = $$props;
    	afterUpdate(() => localStorage.set("theme", theme));

    	const themes$1 = themes.map(theme => {
    		const elem = document.createElement("link");
    		elem.rel = "stylesheet";
    		elem.href = "/vendors/codemirror/theme/" + theme;
    		document.head.append(elem);
    		theme = theme.split(".");
    		theme.pop();
    		return theme.join();
    	});

    	const writable_props = ["theme"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectTheme> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		theme = select_value(this);
    		$$invalidate(0, theme);
    		$$invalidate(1, themes$1);
    	}

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    	};

    	$$self.$capture_state = () => ({
    		_themes: themes,
    		toCamelCase,
    		afterUpdate,
    		get: localStorage.get,
    		set: localStorage.set,
    		theme,
    		themes: themes$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [theme, themes$1, select_change_handler];
    }

    class SelectTheme extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { theme: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectTheme",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get theme() {
    		throw new Error("<SelectTheme>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<SelectTheme>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var modes = ["apl","asciiarmor","asn.1","asterisk","brainfuck","clike","clojure","cmake","cobol","coffeescript","commonlisp","crystal","css","cypher","d","dart","diff","django","dockerfile","dtd","dylan","ebnf","ecl","eiffel","elm","erlang","factor","fcl","forth","fortran","gas","gfm","gherkin","go","groovy","haml","handlebars","haskell","haskell-literate","haxe","htmlembedded","htmlmixed","http","idl","javascript","jinja2","jsx","julia","livescript","lua","markdown","mathematica","mbox","mirc","mllike","modelica","mscgen","mumps","nginx","nsis","ntriples","octave","oz","pascal","pegjs","perl","php","pig","powershell","properties","protobuf","pug","puppet","python","q","r","rpm","rst","ruby","rust","sas","sass","scheme","shell","sieve","slim","smalltalk","smarty","solr","soy","sparql","spreadsheet","sql","stex","stylus","swift","tcl","textile","tiddlywiki","tiki","toml","tornado","troff","ttcn","ttcn-cfg","turtle","twig","vb","vbscript","velocity","verilog","vhdl","vue","wast","webidl","xml","xquery","yacas","yaml","yaml-frontmatter","z80"];

    /* src\components\editor\SelectMode.svelte generated by Svelte v3.29.4 */
    const file$2 = "src\\components\\editor\\SelectMode.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (16:8) {#each modes as mode}
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = toCamelCase(/*mode*/ ctx[0]) + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*mode*/ ctx[0];
    			option.value = option.__value;
    			add_location(option, file$2, 16, 10, 525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(16:8) {#each modes as mode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let p;
    	let span0;
    	let select;
    	let option;
    	let t1;
    	let span1;
    	let i;
    	let mounted;
    	let dispose;
    	let each_value = modes;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			span0 = element("span");
    			select = element("select");
    			option = element("option");
    			option.textContent = "Select Language";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			span1 = element("span");
    			i = element("i");
    			option.disabled = true;
    			option.selected = true;
    			option.__value = "Select Language";
    			option.value = option.__value;
    			add_location(option, file$2, 14, 8, 432);
    			if (/*mode*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[1].call(select));
    			add_location(select, file$2, 13, 6, 396);
    			attr_dev(span0, "class", "select is-fullwidth");
    			add_location(span0, file$2, 12, 4, 354);
    			attr_dev(i, "class", "mdi mdi-code-braces mdi-24px");
    			add_location(i, file$2, 21, 6, 662);
    			attr_dev(span1, "class", "icon is-left");
    			add_location(span1, file$2, 20, 4, 627);
    			attr_dev(p, "class", "control has-icons-left");
    			add_location(p, file$2, 11, 2, 314);
    			attr_dev(div, "class", "field");
    			add_location(div, file$2, 10, 0, 291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, span0);
    			append_dev(span0, select);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*mode*/ ctx[0]);
    			append_dev(p, t1);
    			append_dev(p, span1);
    			append_dev(span1, i);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*modes, toCamelCase*/ 0) {
    				each_value = modes;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*mode, modes*/ 1) {
    				select_option(select, /*mode*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectMode", slots, []);
    	let { mode = localStorage.get("mode") || "" } = $$props;
    	afterUpdate(() => localStorage.set("mode", mode));
    	const writable_props = ["mode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectMode> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		mode = select_value(this);
    		$$invalidate(0, mode);
    	}

    	$$self.$$set = $$props => {
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    	};

    	$$self.$capture_state = () => ({
    		modes,
    		toCamelCase,
    		afterUpdate,
    		get: localStorage.get,
    		set: localStorage.set,
    		mode
    	});

    	$$self.$inject_state = $$props => {
    		if ("mode" in $$props) $$invalidate(0, mode = $$props.mode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mode, select_change_handler];
    }

    class SelectMode extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { mode: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectMode",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get mode() {
    		throw new Error("<SelectMode>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<SelectMode>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\editor\Editor.svelte generated by Svelte v3.29.4 */
    const file$3 = "src\\components\\editor\\Editor.svelte";

    // (82:30) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Copy");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(82:30) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:10) {#if isCopied}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Copied");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(82:10) {#if isCopied}",
    		ctx
    	});

    	return block;
    }

    // (92:10) {#if !isLoading}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "SVG";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "PNG";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "JPG";
    			attr_dev(a0, "href", "");
    			attr_dev(a0, "class", "dropdown-item");
    			add_location(a0, file$3, 94, 16, 2824);
    			attr_dev(a1, "href", "");
    			attr_dev(a1, "class", "dropdown-item");
    			add_location(a1, file$3, 95, 16, 2898);
    			attr_dev(a2, "href", "");
    			attr_dev(a2, "class", "dropdown-item");
    			add_location(a2, file$3, 96, 16, 2972);
    			attr_dev(div0, "class", "dropdown-content");
    			add_location(div0, file$3, 93, 14, 2776);
    			attr_dev(div1, "class", "dropdown-menu");
    			add_location(div1, file$3, 92, 12, 2733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(div0, t3);
    			append_dev(div0, a2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*capture*/ ctx[6], false, false, false),
    					listen_dev(a1, "click", /*capture*/ ctx[6], false, false, false),
    					listen_dev(a2, "click", /*capture*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(92:10) {#if !isLoading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let div10;
    	let h1;
    	let t1;
    	let div5;
    	let div0;
    	let selecttheme;
    	let updating_theme;
    	let t2;
    	let div1;
    	let selectmode;
    	let updating_mode;
    	let t3;
    	let div4;
    	let button0;
    	let i0;
    	let t4;
    	let t5;
    	let div3;
    	let div2;
    	let button1;
    	let i1;
    	let t6;
    	let button1_class_value;
    	let t7;
    	let t8;
    	let div7;
    	let div6;
    	let textarea_1;
    	let t9;
    	let div9;
    	let div8;
    	let button2;
    	let i2;
    	let t10;
    	let i3;
    	let current;
    	let mounted;
    	let dispose;

    	function selecttheme_theme_binding(value) {
    		/*selecttheme_theme_binding*/ ctx[8].call(null, value);
    	}

    	let selecttheme_props = {};

    	if (/*theme*/ ctx[0] !== void 0) {
    		selecttheme_props.theme = /*theme*/ ctx[0];
    	}

    	selecttheme = new SelectTheme({ props: selecttheme_props, $$inline: true });
    	binding_callbacks.push(() => bind(selecttheme, "theme", selecttheme_theme_binding));

    	function selectmode_mode_binding(value) {
    		/*selectmode_mode_binding*/ ctx[9].call(null, value);
    	}

    	let selectmode_props = {};

    	if (/*mode*/ ctx[1] !== void 0) {
    		selectmode_props.mode = /*mode*/ ctx[1];
    	}

    	selectmode = new SelectMode({ props: selectmode_props, $$inline: true });
    	binding_callbacks.push(() => bind(selectmode, "mode", selectmode_mode_binding));

    	function select_block_type(ctx, dirty) {
    		if (/*isCopied*/ ctx[4]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = !/*isLoading*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div10 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Express & Share";
    			t1 = space();
    			div5 = element("div");
    			div0 = element("div");
    			create_component(selecttheme.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(selectmode.$$.fragment);
    			t3 = space();
    			div4 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t4 = space();
    			if_block0.c();
    			t5 = space();
    			div3 = element("div");
    			div2 = element("div");
    			button1 = element("button");
    			i1 = element("i");
    			t6 = text("\r\n              Capture");
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			div7 = element("div");
    			div6 = element("div");
    			textarea_1 = element("textarea");
    			t9 = space();
    			div9 = element("div");
    			div8 = element("div");
    			button2 = element("button");
    			i2 = element("i");
    			t10 = text("\r\n          Add Below\r\n          ");
    			i3 = element("i");
    			attr_dev(h1, "class", "title is-2 has-text-centered");
    			add_location(h1, file$3, 70, 4, 1816);
    			attr_dev(div0, "class", "column is-3 is-offset-1");
    			add_location(div0, file$3, 72, 6, 1929);
    			attr_dev(div1, "class", "column is-3");
    			add_location(div1, file$3, 75, 6, 2024);
    			attr_dev(i0, "class", "mdi mdi-content-copy mdi-24px");
    			add_location(i0, file$3, 80, 10, 2254);
    			attr_dev(button0, "class", "button is-primary is-outlined");
    			add_location(button0, file$3, 79, 8, 2180);
    			attr_dev(i1, "class", "mdi mdi-camera mdi-24px");
    			add_location(i1, file$3, 87, 14, 2590);
    			attr_dev(button1, "class", button1_class_value = "button is-primary" + (/*isLoading*/ ctx[3] ? " is-loading" : ""));
    			add_location(button1, file$3, 85, 12, 2488);
    			attr_dev(div2, "class", "dropdown-trigger");
    			add_location(div2, file$3, 84, 10, 2444);
    			attr_dev(div3, "class", "dropdown is-right is-hoverable has-text-left");
    			add_location(div3, file$3, 83, 8, 2374);
    			attr_dev(div4, "class", "column is-4 has-text-centered-mobile has-text-right");
    			add_location(div4, file$3, 78, 6, 2105);
    			attr_dev(div5, "class", "columns is-variable is-1");
    			add_location(div5, file$3, 71, 4, 1883);
    			textarea_1.value = content;
    			add_location(textarea_1, file$3, 105, 8, 3212);
    			attr_dev(div6, "class", "column is-10");
    			add_location(div6, file$3, 104, 6, 3176);
    			attr_dev(div7, "class", "columns is-centered");
    			add_location(div7, file$3, 103, 4, 3135);
    			attr_dev(i2, "class", "mdi mdi-chevron-double-down mdi-36px");
    			add_location(i2, file$3, 111, 10, 3454);
    			attr_dev(i3, "class", "mdi mdi-chevron-double-down mdi-36px");
    			add_location(i3, file$3, 113, 10, 3537);
    			attr_dev(button2, "class", "button is-large is-fullwidth is-primary");
    			add_location(button2, file$3, 110, 8, 3371);
    			attr_dev(div8, "class", "column is-5");
    			add_location(div8, file$3, 109, 6, 3336);
    			attr_dev(div9, "class", "columns is-centered");
    			add_location(div9, file$3, 108, 4, 3295);
    			attr_dev(div10, "class", "container");
    			add_location(div10, file$3, 69, 2, 1787);
    			attr_dev(section, "class", "section");
    			add_location(section, file$3, 68, 0, 1758);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div10);
    			append_dev(div10, h1);
    			append_dev(div10, t1);
    			append_dev(div10, div5);
    			append_dev(div5, div0);
    			mount_component(selecttheme, div0, null);
    			append_dev(div5, t2);
    			append_dev(div5, div1);
    			mount_component(selectmode, div1, null);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, button0);
    			append_dev(button0, i0);
    			append_dev(button0, t4);
    			if_block0.m(button0, null);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t6);
    			append_dev(div3, t7);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div10, t8);
    			append_dev(div10, div7);
    			append_dev(div7, div6);
    			append_dev(div6, textarea_1);
    			/*textarea_1_binding*/ ctx[10](textarea_1);
    			append_dev(div10, t9);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, button2);
    			append_dev(button2, i2);
    			append_dev(button2, t10);
    			append_dev(button2, i3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*copy*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*add*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const selecttheme_changes = {};

    			if (!updating_theme && dirty & /*theme*/ 1) {
    				updating_theme = true;
    				selecttheme_changes.theme = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_theme = false);
    			}

    			selecttheme.$set(selecttheme_changes);
    			const selectmode_changes = {};

    			if (!updating_mode && dirty & /*mode*/ 2) {
    				updating_mode = true;
    				selectmode_changes.mode = /*mode*/ ctx[1];
    				add_flush_callback(() => updating_mode = false);
    			}

    			selectmode.$set(selectmode_changes);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (!current || dirty & /*isLoading*/ 8 && button1_class_value !== (button1_class_value = "button is-primary" + (/*isLoading*/ ctx[3] ? " is-loading" : ""))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (!/*isLoading*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selecttheme.$$.fragment, local);
    			transition_in(selectmode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selecttheme.$$.fragment, local);
    			transition_out(selectmode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(selecttheme);
    			destroy_component(selectmode);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			/*textarea_1_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const content = "// edit me\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
    const commitUrl = "https://github.com/khang-nd/express-code/new/master/src/snippets/new";

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Editor", slots, []);
    	let theme;
    	let mode;
    	let textarea;
    	let codeMirror;
    	let isLoading;
    	let isCopied;

    	function copy() {
    		navigator.clipboard.writeText(codeMirror.getValue()).then(() => {
    			$$invalidate(4, isCopied = true);
    			setTimeout(() => $$invalidate(4, isCopied = false), 500);
    		});
    	}

    	function capture(e) {
    		e.preventDefault();
    		const type = e.target.textContent.toLowerCase();
    		let method;

    		switch (type) {
    			case "svg":
    				method = domToImage.toSvg;
    				break;
    			case "jpg":
    				method = domToImage.toJpeg;
    				break;
    			default:
    				method = domToImage.toPng;
    		}

    		$$invalidate(3, isLoading = true);

    		method(textarea.parentElement).then(data => {
    			const a = document.createElement("a");
    			a.href = data;
    			a.download = "My snippet." + type;
    			a.click();
    			$$invalidate(3, isLoading = false);
    		});
    	}

    	function add() {
    		const snippet = encodeURIComponent(codeMirror.getValue());
    		const a = document.createElement("a");
    		a.href = `${commitUrl}?filename=JohnDoe.js&value=${snippet}`;
    		a.target = "_blank";
    		a.click();
    	}

    	onMount(() => {
    		codeMirror = CodeMirror.fromTextArea(textarea, { lineNumbers: true });
    	});

    	afterUpdate(() => {
    		codeMirror.setOption("mode", mode);
    		codeMirror.setOption("theme", theme);
    		CodeMirror.autoLoadMode(codeMirror, mode);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	function selecttheme_theme_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function selectmode_mode_binding(value) {
    		mode = value;
    		$$invalidate(1, mode);
    	}

    	function textarea_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			textarea = $$value;
    			$$invalidate(2, textarea);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		dom2image: domToImage,
    		SelectTheme,
    		SelectMode,
    		content,
    		commitUrl,
    		theme,
    		mode,
    		textarea,
    		codeMirror,
    		isLoading,
    		isCopied,
    		copy,
    		capture,
    		add
    	});

    	$$self.$inject_state = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("mode" in $$props) $$invalidate(1, mode = $$props.mode);
    		if ("textarea" in $$props) $$invalidate(2, textarea = $$props.textarea);
    		if ("codeMirror" in $$props) codeMirror = $$props.codeMirror;
    		if ("isLoading" in $$props) $$invalidate(3, isLoading = $$props.isLoading);
    		if ("isCopied" in $$props) $$invalidate(4, isCopied = $$props.isCopied);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		theme,
    		mode,
    		textarea,
    		isLoading,
    		isCopied,
    		copy,
    		capture,
    		add,
    		selecttheme_theme_binding,
    		selectmode_mode_binding,
    		textarea_1_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Exhibition.svelte generated by Svelte v3.29.4 */
    const file$4 = "src\\components\\Exhibition.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[5] = list;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (66:6) {#each snippets as snippet, index}
    function create_each_block$2(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*snippet*/ ctx[4].author + "";
    	let t0;
    	let div0_class_value;
    	let t1;
    	let div1;
    	let index = /*index*/ ctx[6];
    	let t2;
    	const assign_div1 = () => /*div1_binding*/ ctx[3](div1, index);
    	const unassign_div1 = () => /*div1_binding*/ ctx[3](null, index);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty("author py-2 px-4 has-text-white has-background-" + /*colors*/ ctx[2][r(/*colors*/ ctx[2].length)]) + " svelte-15p8l12"));
    			add_location(div0, file$4, 67, 10, 1543);
    			add_location(div1, file$4, 71, 10, 1706);
    			attr_dev(div2, "class", "column is-one-third-widescreen is-half-tablet svelte-15p8l12");
    			add_location(div2, file$4, 66, 8, 1472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			assign_div1();
    			append_dev(div2, t2);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (index !== /*index*/ ctx[6]) {
    				unassign_div1();
    				index = /*index*/ ctx[6];
    				assign_div1();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			unassign_div1();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(66:6) {#each snippets as snippet, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let each_value = /*snippets*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Join the Fun";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "title is-2 has-text-centered");
    			add_location(h1, file$4, 63, 4, 1310);
    			attr_dev(div0, "class", "is-flex-tablet is-flex-wrap-wrap");
    			add_location(div0, file$4, 64, 4, 1374);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$4, 62, 2, 1281);
    			attr_dev(section, "class", "section");
    			add_location(section, file$4, 61, 0, 1252);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*textareas, colors, r, snippets*/ 7) {
    				each_value = /*snippets*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function r(max) {
    	const { round, random } = Math;
    	return round(random() * (max - 1));
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Exhibition", slots, []);
    	const snippets = _snippets.filter(snippet => !(/JohnDoe/).test(snippet.author));

    	const colors = [
    		"black",
    		"dark",
    		"primary",
    		"link",
    		"link-dark",
    		"info",
    		"info-dark",
    		"success",
    		"success-dark",
    		"warning-dark",
    		"danger",
    		"danger-dark"
    	];

    	let textareas = [];

    	onMount(() => {
    		textareas.forEach((textarea, i) => {
    			let theme = themes[r(themes.length)];
    			theme = theme.split(".");
    			theme.pop();
    			const { mode } = CodeMirror.findModeByExtension(snippets[i].extension);

    			const cm = new CodeMirror(textarea,
    			{
    					lineNumbers: true,
    					theme: theme.join(),
    					readOnly: true,
    					value: snippets[i].content,
    					mode
    				});

    			CodeMirror.autoLoadMode(cm, mode);
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Exhibition> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value, index) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			textareas[index] = $$value;
    			$$invalidate(0, textareas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		_snippets,
    		themes,
    		onMount,
    		snippets,
    		colors,
    		textareas,
    		r
    	});

    	$$self.$inject_state = $$props => {
    		if ("textareas" in $$props) $$invalidate(0, textareas = $$props.textareas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [textareas, snippets, colors, div1_binding];
    }

    class Exhibition extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Exhibition",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.29.4 */

    const file$5 = "src\\components\\Footer.svelte";

    function create_fragment$5(ctx) {
    	let footer;
    	let div;
    	let t0;
    	let i;
    	let t1;
    	let a0;
    	let t3;
    	let small;
    	let a1;
    	let t5;
    	let a2;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			t0 = text("Crafted with\r\n    ");
    			i = element("i");
    			t1 = text("\r\n    by\r\n    ");
    			a0 = element("a");
    			a0.textContent = "khangnd";
    			t3 = space();
    			small = element("small");
    			a1 = element("a");
    			a1.textContent = "Source\r\n      Code";
    			t5 = text("\r\n    -\r\n    ");
    			a2 = element("a");
    			a2.textContent = "Other Repos";
    			attr_dev(i, "class", "mdi mdi-heart");
    			add_location(i, file$5, 3, 4, 97);
    			attr_dev(a0, "href", "http://khang-nd.github.io");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$5, 5, 4, 138);
    			add_location(div, file$5, 1, 2, 68);
    			attr_dev(a1, "href", "https://github.com/khang-nd/express-code");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$5, 8, 4, 228);
    			attr_dev(a2, "href", "https://github.com/khang-nd");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$5, 11, 4, 330);
    			add_location(small, file$5, 7, 2, 215);
    			attr_dev(footer, "class", "has-background-link-light p-6 has-text-centered");
    			add_location(footer, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, t0);
    			append_dev(div, i);
    			append_dev(div, t1);
    			append_dev(div, a0);
    			append_dev(footer, t3);
    			append_dev(footer, small);
    			append_dev(small, a1);
    			append_dev(small, t5);
    			append_dev(small, a2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.4 */

    function create_fragment$6(ctx) {
    	let hero;
    	let t0;
    	let editor;
    	let t1;
    	let exhibition;
    	let t2;
    	let footer;
    	let current;
    	hero = new Hero({ $$inline: true });
    	editor = new Editor({ $$inline: true });
    	exhibition = new Exhibition({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(hero.$$.fragment);
    			t0 = space();
    			create_component(editor.$$.fragment);
    			t1 = space();
    			create_component(exhibition.$$.fragment);
    			t2 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(hero, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(editor, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(exhibition, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hero.$$.fragment, local);
    			transition_in(editor.$$.fragment, local);
    			transition_in(exhibition.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hero.$$.fragment, local);
    			transition_out(editor.$$.fragment, local);
    			transition_out(exhibition.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hero, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(editor, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(exhibition, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Hero, Editor, Exhibition, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
