(function() {
  'use strict';

  var util = {
    event: function(name, data) {
      var d = data || {};
      var event = new CustomEvent(name, {detail: d});
      window.dispatchEvent(event);
    }
  };

  var defaults = {
    JS_TOGGLED: 'js-toggled'
  };

  window.addEventListener('load', kosaya_load);
  window.addEventListener('kosaya:loaded:page', kosaya_loaded_page);
  function kosaya_load() {
    fonts();
    document.body.classList.add("fonts-loaded");
    mount('Page');
    mount('DeferredImage');
  }

  function kosaya_loaded_page() {
    mount('DeferredImage');
  }

  function fonts() {
    var scripts = document.getElementsByClassName('scripts')[0];
    var fa = document.createElement('script');
    fa.setAttribute('async', true);
    fa.setAttribute('src', '//use.fontawesome.com/145ecb787c.js');
    scripts.appendChild(fa);
  }

  /**
   * Simple "mounting" of component classes
   * @param ComponentName
   * @returns {Array}
   */
  function mount(ComponentName) {
    var ComponentClass = components[ComponentName];
    var component = ComponentName.toLowerCase();
    var cs = [].slice.call(document.getElementsByClassName('js-' + component));
    return cs.map(function(c) {
      return create(ComponentClass, c);
    });
  }

  /**
   * Factory constructor
   * @param constructor
   * @returns {*}
   */
  function create(constructor) {
    var instance = Object.create(constructor.prototype);
    var object = constructor.apply(instance, Array.prototype.slice.call(arguments, 1));
    return object;
  }

  /**
   * Components namespace object
   * @type {{}}
   */
  var components = {};

  /**
   * Page controller component
   * @param element
   * @constructor
   */
  var Page = function(element) {
    this._element = element;
    this._init();
    this._setup();
  };

  /**
   * Initialize internal variables
   * @private
   */
  Page.prototype._init = function() {
    this._home = this._element.getElementsByClassName('js-page-home')[0];
    this._navigation = this._element.getElementsByClassName('js-page-navigation')[0];
    this._nav = [].slice.call(this._element.getElementsByClassName('js-page-nav'));
    this._load = this._element.getElementsByClassName('js-load')[0];
    this._minHeight = window.innerHeight - this._navigation.offsetHeight;
  };

  /**
   * Setup event listeners
   * @private
   */
  Page.prototype._setup = function() {

    window.addEventListener('resize', function() {
      this._minHeight = window.innerHeight - this._navigation.offsetHeight;
      if (window.innerWidth < 768 && !this._element.classList.contains(defaults.JS_TOGGLED)) {
        this._go('home');
      }
    }.bind(this));

    window.addEventListener('kosaya:loading:page', function(e) {
      this._load.classList.add('js-loading');
    }.bind(this));

    window.addEventListener('kosaya:loaded:page', function() {
      this._load.classList.remove('js-loading');
    }.bind(this));

    window.addEventListener('kosaya:loaded:xhr', function(e) {
      console.log(e.detail);
      this._load.innerHTML = e.detail;
      util.event('kosaya:loaded:page');
    }.bind(this));

    this._home.addEventListener('click', function() {
      this._go('home');
    }.bind(this));

    this._nav.map(function(nav) {
      var target = nav.getAttribute('href');
      nav.addEventListener('click', function(e) {
        if (target.indexOf('/') == -1) {
          e.preventDefault();
          this._go(target);
        }
      }.bind(this));
    }.bind(this));

    if (window.location.href.indexOf("projects") == -1 && window.location.href.indexOf("resume") == -1) {
      this._go('home');
    }
  };

  /**
   * Navigate to the target
   * @param target
   * @private
   */
  Page.prototype._go = function(target) {
    this._element.classList.remove(defaults.JS_TOGGLED);
    if (target !== 'home') {
      this._home.style.minHeight = '0px';
      this._request(target);
    } else {
      this._home.style.minHeight = this._minHeight + 'px';
    }
  };

  /**
   * Request a page partial
   * @param target
   * @returns {boolean}
   * @private
   */
  Page.prototype._request = function(target) {
    this._element.classList.add(defaults.JS_TOGGLED);
    if (target == 'index.html') {
      return false;
    } else {
      util.event('kosaya:loading:page');
      var partial = 'partial-' + target;
      var xhr = new components.XHR();
      xhr.target(partial).request();
      return true;
    }
  };

  components.Page = Page;

  /**
   * XHR Component for simplified XHR GETs
   * @param element
   * @returns {XHR}
   * @constructor
   */
  var XHR = function(element) {
    this._element = element;
    return this;
  };

  /**
   * Set a target
   * @param target
   * @returns {XHR}
   */
  XHR.prototype.target = function(target) {
    function sanitize(t) {
      t.replace('/[a-z\.\-]*/g', '');
      return t;
    }
    this._target = sanitize(target);
    console.log(this._target);
    return this;
  };

  /**
   * @returns {XHR}
   */
  XHR.prototype.request = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this._target);
    xhr.send(null);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          util.event('kosaya:loaded:xhr', xhr.responseText);
        } else {
          console.error(xhr.responseText);
        }
      }
    }.bind(this);
    return this;
  };

  components.XHR = XHR;

  /**
   * Deferred "lazy" loading of background images
   * @param element
   * @constructor
   */
  var DeferredBackground = function(element) {
    this._element = element;
    this._init();
  };

  /**
   * Initialize internal variables
   * @private
   */
  DeferredBackground.prototype._init = function() {
    this._image = this._element.getAttribute('data-src');
    this._load();
  };

  /**
   * Swap the loaded image in
   * @private
   */
  DeferredBackground.prototype._display = function() {
    this._element.style.backgroundImage = 'url("'+this._image+'")';
    this._element.classList.add('js-loaded');
  };

  /**
   * Set up the image to load in the background
   * @private
   */
  DeferredBackground.prototype._load = function() {
    var image = new Image();
    image.onload = this._display();
    image.src = this._image;
  };

  components.DeferredBackground = DeferredBackground;

  /**
   * Deferred "lazy" loading of background images
   * @param element
   * @constructor
   */
  var DeferredImage = function(element) {
    this._element = element;
    this._init();
  };

  /**
   * Initialize internal variables
   * @private
   */
  DeferredImage.prototype._init = function() {
    this._image = this._element.getAttribute('data-src');
    this._load();
  };

  /**
   * Swap the loaded image in
   * @private
   */
  DeferredImage.prototype._display = function() {
    this._element.src = this._image;
    this._element.classList.add('js-loaded');
  };

  /**
   * Set up the image to load in the background
   * @private
   */
  DeferredImage.prototype._load = function() {
    var image = new Image();
    image.onload = this._display();
    image.src = this._image;
  };

  components.DeferredImage = DeferredImage;
})();