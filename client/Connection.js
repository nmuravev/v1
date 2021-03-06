/**
 * TODO Use app/API?
 */
Class.create("Connection", {

  /**
   * Constructor
   * @param baseUrl String The base url for services
   */
  initialize: function(baseUrl)
  {
    this._baseUrl = window.serverAccessPath;
    if(baseUrl) this._baseUrl = baseUrl;
    this._libUrl = '/client';
    this._parameters = new Hash();
    this._method = 'get';
  },
  
  /**
   * Add a parameter to the query
   * @param paramName String
   * @param paramValue String
   */
  addParameter : function (paramName, paramValue){
    this._parameters.set(paramName, paramValue);  
  },
  
  /**
   * Sets the whole parameter as a bunch
   * @param hParameters $H()
   */
  setParameters : function(hParameters){
    this._parameters = $H(hParameters);
  },
  
  /**
   * Set the query method (get post)
   * @param method String
   */
  setMethod : function(method){
    this._method = 'put';
  },
  
  /**
   * Add the secure token parameter
   */
  addSecureToken : function(){
    if(Connection.SECURE_TOKEN && this._baseUrl.indexOf('secure_token') == -1 && !this._parameters.get('secure_token')){
      this.addParameter('secure_token', Connection.SECURE_TOKEN);
    }
  },

  /**
   * Show a small loader
   */
  showLoader : function(){
    if(!$('Connection-loader') && window.THEME){
      var img = new Element("img", {
      src: THEME.path +"/image/connexion-loader.gif",
      id: 'Connection-loader',
      style: 'position:absolute; top:2px; right:2px; z-index:40000; display:none;'});
      $$('body')[0].insert(img);
    }
    if($('Connection-loader')) $('Connection-loader').show();
  },

  /**
   * Hide a small loader
   */
  hideLoader : function(){
    if($('Connection-loader'))$('Connection-loader').hide();
  },

  /**
   * Send Asynchronously
   */
  sendAsync : function(){ 
    this.addSecureToken();
      this.showLoader();
    new Ajax.Request(this._baseUrl, 
    {
      method: this._method,
      onComplete: this.applyComplete.bind(this),
      parameters: this._parameters.toObject()
    });
  },
  
  /**
   * Send synchronously
   */
  sendSync : function(){  
    this.addSecureToken();
      this.showLoader();
    new Ajax.Request(this._baseUrl, 
    {
      method: this._method,
      asynchronous: false,
      onComplete: this.applyComplete.bind(this),
      parameters: this._parameters.toObject()
    });
  },
  
  /**
   * Apply the complete callback, try to grab maximum of errors
   * @param transport Transpot
   */
  applyComplete : function(transport){
        this.hideLoader();
    var message;
        var tokenMessage;
        var tok1 = "Ooops, it seems that your security token has expired! Please %s by hitting refresh or F5 in your browser!";
        var tok2 =  "reload the page";
        if(window.I18N && window.I18N[437]){
            var tok1 = window.I18N[437];
            var tok2 = window.I18N[438];
        }
        tokenMessage = tok1.replace("%s", "<a href='javascript:document.location.reload()' style='text-decoration: underline;'>"+tok2+"</a>");

    var headers = transport.getAllResponseHeaders();
    if(Prototype.Browser.Gecko && transport.responseXML && transport.responseXML.documentElement && transport.responseXML.documentElement.nodeName=="parsererror"){
      message = "Parsing error : \n" + transport.responseXML.documentElement.firstChild.textContent;          
    }else if(Prototype.Browser.IE && transport.responseXML.parseError && transport.responseXML.parseError.errorCode != 0){
      message = "Parsing Error : \n" + transport.responseXML.parseError.reason;
    }else if(headers.indexOf("text/xml")>-1 && transport.responseXML == null){
      message = "Unknown Parsing Error!";
    }else if(headers.indexOf("text/xml") == -1 && headers.indexOf("application/json") == -1 && transport.responseText.indexOf("<b>Fatal error</b>") > -1){
      message = transport.responseText.replace("<br />", "");
    }
    if(message){
            if(message == "You are not allowed to access this resource.") message = tokenMessage;
      if(app) app.displayMessage("ERROR", message);
      else alert(message);
    }
    if(transport.responseXML && transport.responseXML.documentElement){
      var authNode = XPathSelectSingleNode(transport.responseXML.documentElement, "require_auth");
      if(authNode && app){
        var root = app._contextHolder.getRootNode();
        if(root){
          app._contextHolder.setContextNode(root);
          root.clear();
        }
        app.actionBar.fireAction('logout');
        app.actionBar.fireAction('login');
      }
      var messageNode = XPathSelectSingleNode(transport.responseXML.documentElement, "message");
      if(messageNode){
        var messageType = messageNode.getAttribute("type").toUpperCase();
        var messageContent = getDomNodeText(messageNode);
                if(messageContent == "You are not allowed to access this resource.") messageContent = tokenMessage;
        if(app){
          app.displayMessage(messageType, messageContent);
        }else{
          if(messageType == "ERROR"){
            alert(messageType+":"+messageContent);
          }
        }
      }
    }
    if(this.onComplete){
      this.onComplete(transport);
    }
    document.fire("app:server_answer");
  },
  
  /**
   * Load a javascript library
   * @param fileName String
   * @param onLoadedCode Function Callback
   */
  loadLibrary : function(fileName, onLoadedCode){
    if(window.bootstrap && window.bootstrap.p.get("version") && fileName.indexOf("?")==-1){
        fileName += "?v="+window.bootstrap.p.get("version");
    }
    var path = (this._libUrl ? this._libUrl +'/'+ fileName : fileName);
    new Ajax.Request(path,
    {
      method: 'get',
      asynchronous: false,
      onComplete: function(transport){
        if(transport.responseText) 
        {
          try
          {
            var script = transport.responseText;        
              if (window.execScript){ 
                  window.execScript( script );
              }
              else{
              // TO TEST, THIS SEEM TO WORK ON SAFARI
              window.my_code = script;
              var script_tag = document.createElement('script');
              script_tag.type = 'text/javascript';
              script_tag.innerHTML = 'eval(window.my_code)';
              document.getElementsByTagName('head')[0].appendChild(script_tag);
              }
            if(onLoadedCode != null) onLoadedCode();
          }
          catch(e)
          {
            alert('error loading '+fileName+':'+e);
          }
        }
        document.fire("app:server_answer");       
      }
    }); 
  }
});
