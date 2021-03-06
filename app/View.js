/**
 * Show/Edit Item/Collection
 */
Class.create("View", {
  //__implements : ["Focusable"],
  selection: [],// currently selecteded items

  initialize : function(options){
    var p = this.p = {};
    this.provider = $app.item;
    this.fullscreen = false;
    var viewOptions = {
      maximizable: true,
      closable: true,
      title: 'View'
    };   
    Object.extend(p, viewOptions, options);
    this.title = p.title = t(p.title);

    // changing context in other view triggers this event
    document.observe("app:context_changed", this._onContextChanged.bind(this));
    //this._registerObserver(document, "app:selection_changed", _onSelectionChanged);
    this.extControls = [];
  },

  _onContextChanged : function(e){
  },
  /**
   * Initialize standards view actions
   */
  initActions : function(){
  },
  /**
   * Creates base GUI
   */
  render : function(options){
  },
  /**
   * Focus on this widget (focus input)
   */
  focus : function(){
    if(this.element && this.element.visible()){
      //this._inputBox.activate();
      this.hasFocus = true;
    }
  },
  /**
   * Blur this widget
   */
  blur : function(){
    //this._inputBox.blur();
    this.hasFocus = false;
  },
  /**
   * Updates the view title
   * @param title String
   */
  updateTitle : function(title){
  },
  /**
   * Open note in new context
   * @param userSelection Collection the data model
   */
  open : function(userSelection){
    this.userSelection = userSelection;
    this.clearContent();
  },
  /**
   * Change editor status
   * @param isModified Boolean
   */
  setModified : function(isModified){
    //TODO update title in header
    //TODO update actions state
  },
  /**
   * Go to fullscreen mode
   */
  setFullScreen : function(){
    this.fullScreen = true;
    //TODO notify other views & controls
    //TODO update actions
    //TODO change content style (layout, bounding) on resize
  },
  /**
   * Exit fullscreen mode
   */
  exitFullScreen : function(){
    this.fullScreen = false;
    //TODO opposite to fullScreen
  }
});
