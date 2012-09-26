/**
 * Stores data in Browser Indexed DB
 */
Class.create("StoreClient", Store, {

  initialize : function($super){
    $super();
    if (!localStorage.s) localStorage.s = "{}";
    this._local = JSON.parse(localStorage.s);
    this._store = window.localStorage.s;
  },

  save : function($super, onSave, type, name, diff){
    $super(onSave, type, name, diff);
    if (name == 'view.graph') return
    localStorage.s = JSON.stringify(this._local);
  }
})
