/**
 * Toolbar to display actions buttons
 */
Class.create("Toolbar", {
	/**
	 * Constructor
   * @param p Object The toolbar p. Contains a buttonRenderer and a toolbarsList array.
   */
  initialize : function(p){
    this.bar = Ext.create('Ext.Toolbar', {
      region: p.region,
      xtype: 'toolbar',
      title: 'Toolbar',
      items: p.innerControls
    });

    this.extControls = [this.bar]

    //this.element = oElement;    
    //this.element.paneObject = this;
    //this.p = Object.extend({
      //buttonRenderer : 'this',
            //skipBubbling: false,
      //toolbarsList : $A(['default', 'put', 'get', 'change', 'user', 'remote'])
    //}, p || {});
    //var renderer = this.p.buttonRenderer;
    //if(renderer == 'this'){
      //this.p.buttonRenderer = this;
    //}else{
      //this.p.buttonRenderer = new renderer();
    //}
    //this.toolbars = $H();
    //this.initCarousel();
      //if(this.p.styles){
        //this.buildActionBarStylingMenu();
        //this.style = this.p.defaultStyle;
        //document.observe("app:user_logged", function(){
          //if(app.user && app.user.getPreference("action_bar_style")){
              //this.style = app.user.getPreference("action_bar_style");
          //}else{
              //this.style = this.p.defaultStyle;
          //}
          //this.switchStyle(false, true);
        //}.bind(this));
      //}
    //attachMobileScroll(oElement.id, "horizontal");
    //document.observe("app:actions_loaded", this.actionsLoaded.bind(this));
    //document.observe("app:actions_refreshed", this.refreshToolbarsSeparator.bind(this));
    //debugger
    //this.componentConfigHandler = function(event){
        //if(event.memo.className == "Toolbar"){
            //this.parseComponentConfig(event.memo.classConfig.get('all'));
        //}
    //}.bind(this);
    //document.observe("app:component_config_changed", this.componentConfigHandler );
  },
  
  getDomNode : function(){
    return this.element;
  },
  destroy : function(){
    
  },

    /**
     * Apply the config of a component_config node
     * Returns true if the GUI needs refreshing
     * @param domNode XMLNode
     * @returns Boolean
     */
    parseComponentConfig : function(domNode){
        var config = XPathSelectSingleNode(domNode, 'property[@name="style"]');
        if(config){
            var value = config.getAttribute("value");
            if(this.p.styles && this.p.styles[value]){
                this.style = value;
                this.switchStyle();
            }
        }
    },
  /**
   * Handler for actions_loaded event.
   * @param event Event app:actions_loaded
   */
  actionsLoaded : function(event) {
                    debugger
    this.actions = event.memo;
    this.emptyToolbars();
    this.initToolbars();
  },
  
  /**
   * Initialize all toolbars
   */
  initToolbars : function () {
    this.actions.each(function(pair){
      var action = pair.value;
      var actionName = pair.key;
      if(action.context.actionBar){
        if(this.toolbars.get(action.context.actionBarGroup) == null){
          this.toolbars.set(action.context.actionBarGroup, new Array());
        }
        this.toolbars.get(action.context.actionBarGroup).push(actionName);
      }     
    }.bind(this));
    var crtCount = 0;
    var toolbarsList = this.p.toolbarsList;
    toolbarsList.each(function(toolbar){      
      var tBar = this.initToolbar(toolbar);     
      if(tBar && tBar.actionsCount){        
        if(crtCount < toolbarsList.size()-1) {
          var separator = new Element('div');
          separator.addClassName('separator');
          tBar.insert({top: separator});
        }
        this.element.insert(tBar);
        crtCount ++;
      }
    }.bind(this));
    this.element.select('a').each(disableTextSelection);    
  },
  /**
   * Recompute separators if some toolbars are empty due to actions show/hide status.
   */
  refreshToolbarsSeparator : function(){
    this.toolbars.each(function(pair){
      var toolbar = this.element.select('[id="'+pair.key+'_toolbar"]')[0];
      if(!toolbar) return;
      var sep = toolbar.select('div.separator')[0];
      if(!sep) return;
      var hasVisibleActions = false;
      toolbar.select('a').each(function(action){
        if(action.visible()) hasVisibleActions = true;
      });
      if(hasVisibleActions) sep.show();
      else sep.hide();
    }.bind(this) );
    this.refreshSlides();
  },
  
  /**
   * Initialize a given toolbar
   * @param toolbar String The name of the toolbar
   * @returns HTMLElement
   */
  initToolbar : function(toolbar){
    if(!this.toolbars.get(toolbar)) {
      return '';
    }
    var toolEl = $(toolbar+'_toolbar');   
    if(!toolEl){ 
      var toolEl = new Element('div', {
        id: toolbar+'_toolbar',
        style: 'display:inline;'
      });
    }
    toolEl.actionsCount = 0;
    this.toolbars.get(toolbar).each(function(actionName){
      var action = this.actions.get(actionName);    
      if(!action) return;
      var button = this.renderToolbarAction(action);  
      toolEl.insert(button);
      toolEl.actionsCount ++;     
    }.bind(this));
    return toolEl;
  },
  
  /**
   * Remove all toolbars
   */
  emptyToolbars : function(){
    if(this.element.subMenus){
      this.element.subMenus.invoke("destroy");
    }
    this.element.select('div').each(function(divElement){     
      divElement.remove();
    }.bind(this));
    this.toolbars = new Hash();
  },
  
  /**
   * Initialize a caroussel to scroll the buttons on small screens
   */
  initCarousel : function(){
    this.outer = this.element;
    var origHeight = this.outer.getHeight()-1;
    this.prev = new Element("a", {className: 'carousel-control', rel: 'prev', style: 'height:'+origHeight+'px;'}).update(new Element('img', {src: THEME.path+'/images/arrow_left.png'}));
    this.next = new Element("a", {className: 'carousel-control', rel: 'next', style: 'float:right; height:'+origHeight+'px;'}).update(new Element('img', {src: THEME.path+'/images/arrow_right.png'}));
    this.inner = new Element("div", {id: 'buttons_inner', style: 'width:1000px;'});
    this.outer.insert({before: this.prev});
    this.outer.insert({before: this.next});
    this.outer.insert(this.inner);    
    if(Prototype.Browser.IE) this.outer.setStyle({cssFloat: 'left'});
    this.element = this.inner;
    
    this.carousel = new Carousel(this.outer, [], $A([this.prev,this.next]), {
      duration: 0.1
    });
  },
  
  /**
   * Refreshes the caroussel slides 
   */
  refreshSlides : function(){
    var allSlides = $A();
    this.inner.select('a').each(function(a){
      if(a.visible()) allSlides.push(a);
    });
    this.carousel.refreshSlides(allSlides);
    this.resize();    
  },
  
  /**
   * Render an Action for the toolbar
   * @param action Action The action
   * @returns HTMLElement
   */
  renderToolbarAction : function(action){
    var button = new Element('a', {
      href: action.p.name,
      id: action.p.name +'_button'
    }).observe('click', function(e){
      Event.stop(e);
      if(this.p.subMenu){
        //this.subMenu.show(e);
      }else{
        this.apply();
      }
    }.bind(action));
        var icSize = (this.p.defaultIconSize?this.p.defaultIconSize: 22);
        if(this.p.stylesImgSizes && this.style && this.p.stylesImgSizes[this.style]){
            icSize = this.p.stylesImgSizes[this.style];
        }
    var imgPath = resolveImageSource(action.p.src,action.__DEFAULT_ICON_PATH, icSize);
    var img = new Element('img', {
      id: action.p.name +'_button_icon',
            className: 'actionbar_button_icon',
      src: imgPath,
      width: icSize,
      height: icSize,
      border: 0,
      alt: action.p.title,
      title: action.p.title,
            'data-action-src': action.p.src
    });
    var titleSpan = new Element('span', {id: action.p.name+'_button_label',className: 'actionbar_button_label'});
    button.insert(img).insert(titleSpan.update(action.getKeyedText()));
    //this.elements.push(this.button);
    if(action.p.subMenu){
      this.buildActionBarSubMenu(button, action);// TODO
            button.setStyle({position: 'relative'});
      var arrowDiv = new Element('div', {className: 'actionbar_arrow_div'});
      arrowDiv.insert(new Element('img',{src: THEME.path+'/images/arrow_down.png',height: 6,width: 10,border: 0}));
      arrowDiv.imgRef = img;
            button.insert(arrowDiv);
    }else if(!this.p.skipBubbling) {
      button.observe("mouseover", function(){
        this.buttonStateHover(button, action);
      }.bind(this) );
      button.observe("mouseout", function(){
        this.buttonStateOut(button, action);
      }.bind(this) );
    }
        if(!this.p.skipBubbling){
            img.setStyle("width:18px; height:18px; margin-top:8px;");
        }
    button.hide();
    this.attachListeners(button, action);
    return button;
    
  },
  
  /**
   * Attach various listeners to an action to reflect its state on the button
   * @param button HTMLElement The button
   * @param action Action The action to observe.
   */
  attachListeners : function(button, action){
    action.observe("hide", function(){
      button.hide();
    }.bind(this));
    action.observe("show", function(){
      button.show();
    }.bind(this));
    action.observe("disable", function(){
      button.addClassName("disabled");
    }.bind(this));
    action.observe("enable", function(){
      button.removeClassName("disabled");
    }.bind(this));
    action.observe("submenu_active", function(submenuItem){
      if(!submenuItem.src || !action.p.subMenuUpdateImage) return;
      var images = button.select('img[id="'+action.p.name +'_button_icon"]');
      if(!images.length) return;
            icSize = 22;
            if(this.p.stylesImgSizes && this.style && this.p.stylesImgSizes[this.style]){
                icSize = this.p.stylesImgSizes[this.style];
            }
      images[0].src = resolveImageSource(submenuItem.src, action.__DEFAULT_ICON_PATH,icSize);
      action.p.src = submenuItem.src;
    }.bind(this));
  },
  
  /**
   * Creates a submenu
   * @param button HTMLElement The anchor of the submenu
   * @param action Action The action
   */
  buildActionBarSubMenu : function(button, action){
    var subMenu = new Proto.Menu({
      mouseClick: "over",
      anchor: button, // context menu will be shown when element with class name of "contextmenu" is clicked
      className: 'menu desktop toolbarmenu', // this is a class which will be attached to menu container (used for css styling)
      topOffset: 0,
      leftOffset: 0,  
      parent: this.element,  
      menuItems: action.subMenuItems.staticOptions || [],
      fade: true,
      zIndex: 2000      
    }); 
    var titleSpan = button.select('span')[0]; 
    subMenu.p.beforeShow = function(e){
      button.addClassName("menuAnchorSelected");
      if(!this.p.skipBubbling) this.buttonStateHover(button, action);
        if(action.subMenuItems.dynamicBuilder){
          action.subMenuItems.dynamicBuilder(subMenu);
        }
    }.bind(this);   
    subMenu.p.beforeHide = function(e){
      button.removeClassName("menuAnchorSelected");
      if(!this.p.skipBubbling) this.buttonStateOut(button, action);
    }.bind(this);
    if(!this.element.subMenus) this.element.subMenus = $A([]);
    this.element.subMenus.push(subMenu);
  },

    /**
     * Creates a submenu
     * @param button HTMLElement The anchor of the submenu
     * @param action Action The action
     */
    buildActionBarStylingMenu : function(){
        this.stylingMenu = new Proto.Menu({
          mouseClick: "right",
          selector: $(this.element.parentNode),
          anchor: 'mouse',
          className: 'menu desktop textual', // this is a class which will be attached to menu container (used for css styling)
          topOffset : 0,
          leftOffset : 0,
          parent: this.element,
          menuItems: [],
          beforeShow: function(){
              this.stylingMenu.p.menuItems = this.listStyleMenuItems();
          }.bind(this),
          fade: true,
          zIndex: 2000
        });
    },

    listStyleMenuItems : function(){
        var items = [];
        var oThis = this;
        for(var k in this.p.styles){
            items.push({
                name: this.p.styles[k],
                alt: k,
                image: resolveImageSource((k == this.style ? 'button_ok.png' : 'transp.png'),Action.prototype.__DEFAULT_ICON_PATH, 16),
                isDefault: (k == this.style),
                callback: function(){ oThis.switchStyle(this); }
            });
        }
        return items;
    },

    switchStyle : function(command, start){
        var style = this.style;
        if(command){
            if(command.nodeName.toLowerCase() == 'img'){
                command = command.up('a');
            }
            style = command.getAttribute("title");
            this.style = style;
        }
        var parent = this.element.up("div[@ajxpClass]");
        while(parent.up("div[@ajxpClass]") != undefined){
            parent = parent.up("div[@ajxpClass]");
        }
        var actBar = this.element.up("div.action_bar");

        var applyResize = function(){
            for(var k in this.p.styles){
                if(k!=style) this.element.parentNode.removeClassName(k);
            }
            this.element.parentNode.addClassName(style);
            if(this.p.stylesImgSizes && this.p.stylesImgSizes[style]){
                this.element.select("img.actionbar_button_icon").each(function(img){
                    img.src = resolveImageSource(img.getAttribute("data-action-src"),Action.prototype.__DEFAULT_ICON_PATH, this.p.stylesImgSizes[style]);
                }.bind(this));
            }
            if(parent.paneObject) parent.paneObject.resize();
            if(app.user && !start){
                app.user.setPreference("action_bar_style", style);
                app.user.savePreference("action_bar_style");
            }
        }.bind(this);

        if(this.p.stylesBarSizes && this.p.stylesBarSizes[style]){
            new Effect.Morph(actBar, {
                style: 'height:'+this.p.stylesBarSizes[style]+'px',
                duration: 0.5,
                afterFinish: applyResize,
                afterUpdate: function(){
                    actBar.select("div.separator").invoke("setStyle", {height: (actBar.getHeight()-1)+"px"});
                    if(parent.paneObject) parent.paneObject.resize();
                }
            });
        }else{
            applyResize();
        }


    },

  /**
   * Listener for mouseover on the button
   * @param button HTMLElement The button
   * @param action Action its associated action
   */
  buttonStateHover : function(button, action){    
    if(button.hasClassName('disabled')) return;
    if(button.hideTimeout) clearTimeout(button.hideTimeout);
    new Effect.Morph(button.select('img[id="'+action.p.name +'_button_icon"]')[0], {
      style: 'width:22px; height:22px; margin-top: 3px;',
      duration: 0.08,
      transition: Effect.Transitions.sinoidal,
      afterFinish: function(){this.updateTitleSpan(button.select('span')[0], 'big');}.bind(this)
    });
  },
  
  /**
   * Listener for mouseout on the button
   * @param button HTMLElement The button
   * @param action Action its associated action
   */
  buttonStateOut : function(button, action){
    if(button.hasClassName('disabled')) return;
    button.hideTimeout = setTimeout(function(){       
      new Effect.Morph(button.select('img[id="'+action.p.name +'_button_icon"]')[0], {
        style: 'width:18px; height:18px; margin-top:8px;',
        duration: 0.2,
        transition: Effect.Transitions.sinoidal,
        afterFinish: function(){this.updateTitleSpan(button.select('span')[0], 'small');}.bind(this)
      }); 
    }.bind(this), 10);
  },
  
  /**
   * Updates the button label
   * @param span HTMLElement <span>
   * @param state String "big", "small"
   */
  updateTitleSpan : function(span, state){    
    if(!span.orig_width && state == 'big'){
      var origWidth = span.getWidth();
      span.setStyle({display: 'block',width: origWidth, overflow: 'visible', padding: 0});
      span.orig_width = origWidth;
    }
    span.setStyle({fontSize: (state=='big' ? '11px' : '9px')});
  },  
  
  /**
   * Resize the widget. May trigger the apparition/disparition of the Carousel buttons.
   */
  resize : function(){
    var innerSize = 0;
    var parentWidth = $(this.outer).parentNode.getWidth();
    if(Prototype.Browser.IE){
      parentWidth = $(this.outer).getOffsetParent().getWidth()-4;//document.viewport.getWidth();
    }
    var visibles = [];
    var buttons = this.inner.select('a');
    buttons.each(function(a){
      if(a.visible()) visibles.push(a);
    });
    if(visibles.length){
      var last = visibles[visibles.length-1];
      var innerSize = last.cumulativeOffset()[0] + last.getWidth();
    }
    if(innerSize > parentWidth){
            var h = parseInt(this.element.up("div.action_bar").getHeight()) - 1;
            var m = parseInt( (h - 10) / 2);
            h = h - m;
            this.prev.setStyle({height: h+'px',paddingTop: m+'px'});
            this.next.setStyle({height: h+'px',paddingTop: m+'px'});
      this.prev.show();
      this.next.show();
      this.outer.setStyle({width: (parentWidth-this.prev.getWidth()-this.next.getWidth()) + 'px'});
    }else{
      this.prev.hide();
      this.next.hide();
      this.carousel.first();
      this.outer.setStyle({width: parentWidth + 'px'});
    }
  },
  /**
   * Control Implementation. Empty.
   * @param show Boolean
   */
  showElement : function(show){}  
});