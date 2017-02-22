const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Cinnamon = imports.gi.Cinnamon;
const Lang = imports.lang;
const Signals = imports.signals;
const Params = imports.misc.params;
const PopupMenu = imports.ui.popupMenu;
//const DND = imports.ui.dnd;
const AppletDir = imports.ui.appletManager.applets['Cinnamenu@json'];

const Chromium = AppletDir.webChromium;
const Firefox = AppletDir.webFirefox;
const GoogleChrome = AppletDir.webGoogleChrome;
const Midori = AppletDir.webMidori;
const Opera = AppletDir.webOpera;

const ApplicationType = {
  _applications: 0,
  _places: 1,
  _recent: 2
};

/* =========================================================================
/* name:    SearchWebBookmarks
 * @desc    Class to consolodate search of web browser(s) bookmarks
 * @desc    Code borrowed from SearchBookmarks extension by bmh1980
 * @desc    at https://extensions.gnome.org/extension/557/search-bookmarks/
 * ========================================================================= */

function SearchWebBookmarks() {
  this._init.apply(this, arguments);
}

SearchWebBookmarks.prototype = {

  _init: function() {
    Chromium.init();
    Firefox.init();
    GoogleChrome.init();
    Midori.init();
    Opera.init();
  },

  bookmarksSort: function(a, b) {
    if (a.score < b.score) {
      return 1;
    }
    if (a.score > b.score) {
      return -1;
    }
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  },

  destroy: function() {
    Chromium.deinit();
    Firefox.deinit();
    GoogleChrome.deinit();
    Midori.deinit();
    Opera.deinit();
  }
};

/* =========================================================================
/* name:    CategoryListButton
 * @desc    A button with an icon that holds category info
 * ========================================================================= */

function CategoryListButton() {
  this._init.apply(this, arguments);
}

CategoryListButton.prototype = {
  __proto__: PopupMenu.PopupBaseMenuItem.prototype,

  _init: function(dir, altNameText, altIconName) {
    PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
      hover: false
    });
    this.buttonEnterCallback = null;
    this.buttonLeaveCallback = null;
    this.buttonPressCallback = null;
    this.buttonReleaseCallback = null;
    this._ignoreHoverSelect = null;

    this.actor.set_style_class_name('menu-category-button');
    if (dir === 'recent' || dir === 'bookmarks' || dir === 'places') { // TBD
      //this.actor.set_style('padding-bottom: -5px');
    }
    this.actor._delegate = this;
    let iconSize = 16;

    this._dir = dir;
    let categoryNameText = '';
    //let categoryIconName = null;

    let icon;

    if (typeof dir !== 'string') {
      icon = dir.get_icon();
      if (icon && icon.get_names) {
        this.icon_name = icon.get_names().toString();
      } else {
        this.icon_name = '';
      }
      let dirName = dir.get_name();
      categoryNameText = dirName ? dirName : '';
      if (this.icon_name) {
        this.icon = St.TextureCache.get_default().load_gicon(null, icon, iconSize);
      } else {
        icon = dir.get_icon() ? dir.get_icon().get_names().toString() : 'error';
        this.icon = new St.Icon({
          icon_name: icon,
          icon_size: iconSize
        });
      }
    } else {
      categoryNameText = altNameText;
      this.icon_name = altIconName;
      icon = altIconName;
      this.icon = new St.Icon({
        icon_name: icon,
        icon_size: iconSize,
        icon_type: St.IconType.FULLCOLOR
      });
    }
    this.addActor(this.icon);
    this.icon.realize();
    this.label = new St.Label({
      text: categoryNameText,
      style_class: 'menu-category-button-label'
    });
    this.addActor(this.label);
    this.label.realize();

    // Connect signals
    this.actor.connect('touch-event', Lang.bind(this, this._onTouchEvent));
  },

  setButtonEnterCallback: function(cb) {
    this.buttonEnterCallback = cb;
    this.actor.connect('enter-event', Lang.bind(this, this.buttonEnterCallback));
  },

  setButtonLeaveCallback: function(cb) {
    this.buttonLeaveCallback = cb;
    this.actor.connect('leave-event', Lang.bind(this, this.buttonLeaveCallback));
  },

  setButtonPressCallback: function(cb) {
    this.buttonPressCallback = cb;
    this.actor.connect('button-press-event', Lang.bind(this, this.buttonPressCallback));
  },

  setButtonReleaseCallback: function(cb) {
    this.buttonReleaseCallback = cb;
    this.actor.connect('button-release-event', Lang.bind(this, this.buttonReleaseCallback));
  },

  select: function() {
    this._ignoreHoverSelect = true;
    this.buttonEnterCallback.call();
  },

  unSelect: function() {
    this._ignoreHoverSelect = false;
    this.buttonLeaveCallback.call();
  },

  click: function() {
    this.buttonPressCallback.call();
    this.buttonReleaseCallback.call();
  },

  _onTouchEvent: function(actor, event) {
    return Clutter.EVENT_PROPAGATE;
  }
};

/*function ApplicationContextMenuItem(appButton, label, action, iconName) {
  this._init(appButton, label, action, iconName);
}

ApplicationContextMenuItem.prototype = {
  __proto__: PopupMenu.PopupBaseMenuItem.prototype,

  _init: function (appButton, label, action, iconName) {
    PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
      focusOnHover: false
    });

    this._appButton = appButton;
    this._action = action;
    this.label = new St.Label({
      text: label
    });
    if (iconName !== null) {
      this.icon = new St.Icon({
        icon_name: iconName,
        icon_size: 12,
        icon_type: St.IconType.SYMBOLIC
      });
      if (this.icon) {
        this.addActor(this.icon);
        this.icon.realize();
      }
    }

    this.addActor(this.label);
  },

  activate: function (event) {
    switch (this._action) {
    case 'add_to_panel':
      if (!Main.AppletManager.get_role_provider_exists(Main.AppletManager.Roles.PANEL_LAUNCHER)) {
        let new_applet_id = global.settings.get_int('next-applet-id');
        global.settings.set_int('next-applet-id', (new_applet_id + 1));
        let enabled_applets = global.settings.get_strv('enabled-applets');
        enabled_applets.push('panel1:right:0:panel-launchers@cinnamon.org:' + new_applet_id);
        global.settings.set_strv('enabled-applets', enabled_applets);
      }

      let launcherApplet = Main.AppletManager.get_role_provider(Main.AppletManager.Roles.PANEL_LAUNCHER);
      launcherApplet.acceptNewLauncher(this._appButton.app.get_id());

      this._appButton.toggleMenu();
      break;
    case 'add_to_desktop':
      let file = Gio.file_new_for_path(this._appButton.app.get_app_info().get_filename());
      let destFile = Gio.file_new_for_path(`${USER_DESKTOP_PATH}/${this._appButton.app.get_id()}`);
      try {
        file.copy(destFile, 0, null, function () {});
        try {
          FileUtils.changeModeGFile(destFile, 755);
        } catch (e) {
          Util.spawnCommandLine(`chmod +x '${USER_DESKTOP_PATH}/${this._appButton.app.get_id()}'`);
        }
      } catch (e) {
        global.log(e);
      }
      this._appButton.toggleMenu();
      break;
    case 'add_to_favorites':
      AppFavorites.getAppFavorites().addFavorite(this._appButton.app.get_id());
      this._appButton.toggleMenu();
      break;
    case 'remove_from_favorites':
      AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());
      this._appButton.toggleMenu();
      break;
    case 'uninstall':
      Util.spawnCommandLine(`gksu -m '${_('Please provide your password to uninstall this application')}' /usr/bin/cinnamon-remove-application '${this._appButton.app.get_app_info().get_filename()}'`);
      this._appButton.appsMenuButton.menu.close();
      break;
    case 'run_with_nvidia_gpu':
      Util.spawnCommandLine(`optirun gtk-launch ${this._appButton.app.get_id()}`);
      this._appButton.appsMenuButton.menu.close();
      break;
    }
    return false;
  }
};*/

/* =========================================================================
/* name:    AppListGridButton
 * @desc    A button with an icon and label that holds app info for various
 * @desc    types of sources (application, places, recent)
 * ========================================================================= */

function AppListGridButton() {
  this._init.apply(this, arguments);
}

AppListGridButton.prototype = {
  _init: function(_parent, app, appType, isGridType) {

    this._parent = _parent;
    this._applet = _parent._applet;
    this._app = app;
    this._type = appType;
    this._stateChangedId = 0;
    let style;
    if (isGridType) {
      style = 'popup-menu-item cinnamenu-application-grid-button col'+this._applet.appsGridColumnCount.toString();

      this._iconSize = (this._applet.appsGridIconSize > 0) ? this._applet.appsGridIconSize : 64;
    } else {
      style = 'menu-application-button';
      this._iconSize = (this._applet.appsListIconSize > 0) ? this._applet.appsListIconSize : 28;
      this._iconContainer = new St.BoxLayout({
        vertical: true
      });
    }
    this.actor = new St.Button({
      reactive: true,
      style_class: style,
      x_align: isGridType ? St.Align.MIDDLE : St.Align.START,
      y_align: St.Align.MIDDLE
    });
    this.actor._delegate = this;

    // appType 0 = application, appType 1 = place, appType 2 = recent
    if (appType == ApplicationType._applications) {
      this.icon = app.create_icon_texture(this._iconSize);
      this.label = new St.Label({
        text: app.get_name(),
        style_class: 'menu-application-button-label'
      });
    } else if (appType == ApplicationType._places) {
      this.icon = new St.Icon({
        gicon: app.icon,
        icon_size: this._iconSize
      });
      if (!this.icon) {
        this.icon = new St.Icon({
          icon_name: 'error',
          icon_size: this._iconSize,
          icon_type: St.IconType.FULLCOLOR
        });
      }
      this.label = new St.Label({
        text: app.name,
        style_class: 'menu-application-button-label'
      });
    } else if (appType == ApplicationType._recent) {
      let gicon = Gio.content_type_get_icon(app.mime);
      this.icon = new St.Icon({
        gicon: gicon,
        icon_size: this._iconSize
      });
      if (!this.icon) {
        this.icon = new St.Icon({
          icon_name: 'error',
          icon_size: this._iconSize,
          icon_type: St.IconType.FULLCOLOR
        });
      }
      this.label = new St.Label({
        text: app.name,
        style_class: 'menu-application-button-label'
      });
    }

    this._dot = new St.Widget({
      style: 'width: 10px; height: 3px; background-color: #FFFFFF; margin-bottom: 2px;',
      layout_manager: new Clutter.BinLayout(),
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.END
    });

    this.buttonbox = new St.BoxLayout({
      vertical: isGridType,
      width: 250
    });
    let iconDotContainer = isGridType ? 'buttonbox' : '_iconContainer';
    this[iconDotContainer].add(this.icon, {
      x_fill: false,
      y_fill: false,
      x_align: isGridType ? St.Align.MIDDLE : St.Align.END,
      y_align: isGridType ? St.Align.START : St.Align.END
    });
    if (!isGridType) {
      this.buttonbox.add(this._iconContainer, {
        x_fill: false,
        y_fill: false,
        x_align: St.Align.START,
        y_align: St.Align.MIDDLE
      });
    }
    this.buttonbox.add(this.label, {
      x_fill: false,
      y_fill: false,
      x_align: isGridType ? St.Align.MIDDLE : St.Align.START,
      y_align: isGridType ? St.Align.MIDDLE : St.Align.MIDDLE
    });
    this[iconDotContainer].add(this._dot, {
      x_fill: false,
      y_fill: false,
      x_align: isGridType ? St.Align.MIDDLE : St.Align.END,
      y_align: isGridType ? St.Align.START : St.Align.END
    });
    this.actor.set_child(this.buttonbox);

    // Connect signals
    this.actor.connect('touch-event', Lang.bind(this, this._onTouchEvent));
    if (appType == ApplicationType._applications) {
      this._stateChangedId = this._app.connect('notify::state', Lang.bind(this, this._onStateChanged));
    }

    // Check if running state
    this._dot.opacity = 0;
    this._onStateChanged();
  },

  _onTouchEvent: function(actor, event) {
    return Clutter.EVENT_PROPAGATE;
  },

  _onStateChanged: function() {
    if (this._type == ApplicationType._applications) {
      if (this._app.state != Cinnamon.AppState.STOPPED) {
        this._dot.opacity = 255;
      } else {
        this._dot.opacity = 0;
      }
    }
  },

  getDragActor: function() {
    let appIcon;
    if (this._type == ApplicationType._applications) {
      appIcon = this._app.create_icon_texture(this._iconSize);
    } else if (this._type == ApplicationType._places) {
      appIcon = new St.Icon({
        gicon: this._app.icon,
        icon_size: this._iconSize
      });
    } else if (this._type == ApplicationType._recent) {
      let gicon = Gio.content_type_get_icon(this._app.mime);
      appIcon = new St.Icon({
        gicon: gicon,
        icon_size: this._iconSize
      });
    }
    return appIcon;
  },

  // Returns the original actor that should align with the actor
  // we show as the item is being dragged.
  getDragActorSource: function() {
    return this.icon;
  },

  shellWorkspaceLaunch: function(params) {
    params = Params.parse(params, {
      workspace: -1,
      timestamp: 0
    });

    if (this._type == ApplicationType._applications) {
      this._app.open_new_window(params.workspace);
    } else if (this._type == ApplicationType._places) {
      if (this._app.uri) {
        this._app.app.launch_uris([this._app.uri], null);
      } else {
        this._app.launch();
      }
    } else if (this._type == ApplicationType._recent) {
      Gio.app_info_launch_default_for_uri(this._app.uri, global.create_app_launch_context(0, -1));
    }

    this.actor.remove_style_pseudo_class('pressed');
    this.actor.remove_style_class_name('selected');

    if (this._parent) {
      if (this._parent.menu.isOpen) {
        this._parent.menu.toggle();
      }
    }
  }
};
Signals.addSignalMethods(AppListGridButton.prototype);

/* =========================================================================
/* name:    GroupButton
 * @desc    A generic icon button
 * @impl    Used for user/power group buttons
 * ========================================================================= */

function GroupButton() {
  this._init.apply(this, arguments);
}

GroupButton.prototype = {
  __proto__: PopupMenu.PopupBaseMenuItem.prototype,

  _init: function (_parent, iconName, iconSize, labelText, params) {
    PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
      hover: false
    });
    this._applet = _parent._applet;
    this._opened = false;
    this.buttonEnterCallback = null;
    this.buttonLeaveCallback = null;
    this.buttonPressCallback = null;
    this.buttonReleaseCallback = null;
    /*let style = 'popup-menu-item popup-submenu-menu-item' + params.style_class;
    let paddingTop = labelText ? 2 : iconSize >= 18 ? 5 : 2;*/
    //this.actor.add_style_class_name('menu-favorites-button');
    //this.actor.add_style_class_name(params.style_class);
    let monitorHeight = Main.layoutManager.primaryMonitor.height;
    let realSize = (0.7 * monitorHeight) / 4;
    let adjustedIconSize = 0.6 * realSize / global.ui_scale;
    if (adjustedIconSize > iconSize) {
      adjustedIconSize = iconSize;
    }
    this.actor.style = 'padding-top: ' + (adjustedIconSize / 3) + 'px;padding-bottom: ' + (adjustedIconSize / 3) + 'px; margin:auto;'
    this.actor.add_style_class_name('menu-favorites-button');
    this.actor._delegate = this;
    this.buttonbox = new St.BoxLayout({
      vertical: true
    });

    if (iconName && iconSize) {
      this._iconSize = adjustedIconSize;
      this.icon = new St.Icon({
        icon_name: iconName,
        icon_size: adjustedIconSize,
        icon_type: adjustedIconSize <= 25 ? St.IconType.SYMBOLIC : St.IconType.FULLCOLOR
      });
      this.addActor(this.icon);
      this.icon.realize();
      /*this.buttonbox.add(this.icon, {
        x_fill: false,
        y_fill: false,
        x_align: St.Align.MIDDLE,
        y_align: St.Align.MIDDLE
      });*/
    }
    if (labelText) {
      this.label = new St.Label({
        text: labelText,
        style_class: params.style_class + '-label'
      });
      this.addActor(this.label);
      /*this.buttonbox.add(this.label, {
        x_fill: false,
        y_fill: false,
        x_align: St.Align.MIDDLE,
        y_align: St.Align.MIDDLE
      });*/
    }
    //this.actor.set_child(this.buttonbox);

    // Connect signals
    this.actor.connect('touch-event', Lang.bind(this, this._onTouchEvent));
  },

  setIcon: function(iconName) {
    this.removeActor(this.icon);
    this.icon.destroy();
    this.icon = this.icon = new St.Icon({
      icon_name: iconName,
      icon_size: this._iconSize,
      icon_type: St.IconType.FULLCOLOR
    });
    this.addActor(this.icon);
    this.icon.realize();
  },

  setButtonEnterCallback: function(cb) {
    this.buttonEnterCallback = cb;
    this.actor.connect('enter-event', Lang.bind(this, this.buttonEnterCallback));
  },

  setButtonLeaveCallback: function(cb) {
    this.buttonLeaveCallback = cb;
    this.actor.connect('leave-event', Lang.bind(this, this.buttonLeaveCallback));
  },

  setButtonPressCallback: function(cb) {
    this.buttonPressCallback = cb;
    this.actor.connect('button-press-event', Lang.bind(this, this.buttonPressCallback));
  },

  setButtonReleaseCallback: function(cb) {
    this.buttonReleaseCallback = cb;
    this.actor.connect('button-release-event', Lang.bind(this, this.buttonReleaseCallback));
  },

  select: function() {
    this.buttonEnterCallback.call();
  },

  unSelect: function() {
    this.buttonLeaveCallback.call();
  },

  click: function() {
    this.buttonPressCallback.call();
    this.buttonReleaseCallback.call();
  },

  _onTouchEvent: function(actor, event) {
    return Clutter.EVENT_PROPAGATE;
  },

  _onButtonReleaseEvent: function(actor) {
    return false;
  }
};
