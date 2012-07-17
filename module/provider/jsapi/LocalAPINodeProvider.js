/**
 * A local implementation that explore currently defined
 * classes
 */
Class.create("LocalAPProvider", {
	__implements : "Provider",
	knownMixinMethods : {observe:'livepipe', stopObserving:'livepipe', observeOnce:'livepipe', notify:'livepipe'},
	initialize : function(){
		
	},
	
	init : function(properties){
		this.properties = properties;
	},
	
	/**
	 * 
	 * @param item Item
	 * @param itemCallback Function
	 * @param childCallback Function
	 */
	load : function(item, itemCallback, childCallback){
		var path = item.getPath();
		var children = [];
		var levelIcon = "folder.png";
		if(path == "/"){
			var levelIcon = "jsapi_image/package.png";
			children = ["Classes", "Interfaces"];			
		}else if(path == "/Classes" || path == "/Interfaces"){
			var levelIcon = (path=="/Classes" ? "jsapi_image/class.png" : "jsapi_image/interface.png");
			$$OO_ObjectsRegistry[(path=="/Classes" ? 'classes' : 'interfaces')].each(function(pair){
				children.push(pair.key);
			});
			children.sort();
		}else if(item.getMetadata().get("API_CLASS") || item.getMetadata().get("API_INTERFACE")){
			var api_class = item.getMetadata().get("API_CLASS");
			var api_interface = item.getMetadata().get("API_INTERFACE");
			var levelIcon = "jsapi_image/method.png";
			var ooObject = $$OO_ObjectsRegistry[(api_class ? 'classes' : 'interfaces')].get((api_class ? api_class : api_interface));
			var proto = ooObject.prototype;
			var properties = $A();
			var methods = $A();
			var mixedMethods = $A();
			var inheritedMethods = {};
			var interfacesMethods = {};
			var interfacesChildren = {};
			var parentClasses = {};
			var parentMethods = {};
			var parentChildren = $A();
			var superclass = ooObject.superclass;
			if(superclass){
				$$OO_ObjectsRegistry.classes.each(function(pair){				
					if(pair.value.subclasses.length && pair.value == superclass){
						superclass = pair.key;
						for(var key in pair.value.prototype){
							if(this.knownMixinMethods[key]) continue;
							if(key.indexOf("_") == 0) continue;
							parentMethods[key] = superclass;
						} 
					}
				}.bind(this));
				if(typeof(superclass) == "string"){
					parentChildren.push({
						PATH : superclass,
						LABEL : '<i>Extends <span class="jsapi_member">' + superclass + '</span></i>',
						ICON : 'jsapi_image/class.png',
						LEAF : true,
						METADATA : {memberType:'parent'}					
					});
				}else{
					superclass = null;
					parentMethods = {};
				}
			}
			if(ooObject.__implements){
				$A(ooObject.__implements).each(function(el){
					var child = {
						PATH : el,
						LABEL : '<i>Implements <span class="jsapi_member">' + el + '</span></i>',
						ICON : 'jsapi_image/interface.png',
						LEAF : true,
						METADATA : {memberType:'interface'}
					};
					var iProto = $$OO_ObjectsRegistry.interfaces.get(el).prototype;
					for(var key in iProto){
						interfacesMethods[key] = el;
					}
					interfacesChildren[el] = $A([child]);
					//children.push(child);
				});
			}
			
			for(var key in proto){
				if(key.indexOf("_") === 0) continue;
				if(key == "constructor") continue;
				if(typeof proto[key] == 'function'){
					var args = proto[key].argumentNames();					
					var label = '<span class="jsapi_member">'+key+'</span>' + "(" + args.join(", ") + ")";
					var child = {
							PATH : key,
							LABEL:label, 
							ICON:'jsapi_image/method.png', 
							LEAF:true, 
							METADATA : {memberType:'method', argumentNames: args}							
					};
					if(this.knownMixinMethods[key]){
						child.LABEL = "<span class='jsapi_jdoc_param'>["+this.knownMixinMethods[key]+"]</span> "+child.LABEL;
						child.ICON = 'jsapi_image/mixedin_method.png';
						child.METADATA.memberType = 'mixedin_method';
						mixedMethods.push(child);
					}else if(interfacesMethods[key]){
						var ifName = interfacesMethods[key];
						child.ICON = 'jsapi_image/inherited_method.png';
						interfacesChildren[ifName].push(child);
					}else if(parentMethods[key] && (!args.length || args[0] != '$super')){
						child.ICON = 'jsapi_image/inherited_method.png';
						parentChildren.push(child);
						child.METADATA.memberType = 'parent_method';
						child.METADATA.parentClass = parentMethods[key];
					}else{
						methods.push(child);
					}
				}else{
					var child = {
							PATH : key,
							LABEL:'<span class="jsapi_member">'+key+'</span>', 
							ICON:'jsapi_image/property.png', 
							LEAF:true, 
							METADATA:{memberType:'property'}
					};
					properties.push(child);
				}
				
			}
			if(parentChildren.length){				
				parentChildren.each(function(el){children.push(el);});
			}
			for(key in interfacesChildren){
				interfacesChildren[key].each(function(el){children.push(el);});
			}				
			if(properties.length){
				properties.sortBy(function(el){return el.LABEL;});
				properties.each(function(el){children.push(el);});
			}
			if(methods.length){
				methods.sort();
				methods.each(function(el){children.push(el);});
			}
			if(mixedMethods.length){
				mixedMethods.sort();
				mixedMethods.each(function(el){children.push(el);});
			}
		}
		this.createItems(item, $A(children), itemCallback, childCallback, levelIcon);
		if( item.getMetadata().get("API_CLASS") || item.getMetadata().get("API_INTERFACE") ){ 
			if(!item.getMetadata().get("API_SOURCE")){
				if(item.getMetadata().get("api_source_loading")) return;
				item.getMetadata().set("api_source_loading", true);
				var conn = new Connection();
				conn.setParameters({
					get_action : 'get_js_source',
					object_type : (item.getMetadata().get("API_CLASS") ? 'class' : 'interface'),
					object_name : getBaseName(item.getPath())
				});
				conn.onComplete = function(transport){
					item.getMetadata().set("API_SOURCE", transport.responseText);
					item.getMetadata().set("API_JAVADOCS", this.parseJavadocs(transport.responseText));
					item.notify("api_source_loaded");
					this.enrichChildrenWithJavadocs(item);
					item.getMetadata().set("api_source_loading", false);
					item.setLoaded(true);
				}.bind(this);
				conn.onError = function(){
					item.getMetadata().set("api_source_loading", false);
					item.setLoaded(true);
				};
				conn.sendAsync();
			}else{
				this.enrichChildrenWithJavadocs(item);
				item.setLoaded(true);
			}
		}else{
			item.setLoaded(true);
		}
	},
	
	createItems : function(item, children, itemCallback, childCallback, levelIcon){
		var path = item.getPath();
		if(path == "/") path = "";
		children.each(function(childItem){
			var label, icon, isFile, childPath;
			if(typeof(childItem) == "string"){
				label = childItem;
				icon = levelIcon;
				isFile = false;
				childPath = label;
			}else if(typeof(childItem) == "object"){
				label = childItem.LABEL;
				icon = (childItem.ICON ? childItem.ICON : levelIcon);
				childPath = (childItem.PATH ? childItem.PATH : label);
				isFile = childItem.LEAF;
				if(childItem.METADATA){
					var addMeta = childItem.METADATA; 
				}
			}
			var child = new Item(
					path+"/"+childPath, // PATH 
					isFile, 		// IS LEAF OR NOT
					label,		// LABEL			
					icon, 		// ICON
					this			// Keep the same provider!		
					);		
			item.addChild(child);
			var metadata = $H();
			metadata.set("text", label);
			metadata.set("icon", icon);
			if(path == "/Classes"){
				metadata.set("API_CLASS", label);
			}else if(path == "/Interfaces"){
				metadata.set("API_INTERFACE", label);
			}
			if(addMeta){
				metadata = metadata.merge(addMeta);
			}
			child.setMetadata(metadata);
			if(childCallback){
				childCallback(child);
			}
		}.bind(this) );

		if(itemCallback){
			itemCallback(item);
		}
	} ,
	
	/**
	 * Find javadocs associated with the various members
	 * @param item Item
	 */
	enrichChildrenWithJavadocs: function(item){
		var docs = item.getMetadata().get("API_JAVADOCS");
		var children = item.getChildren();
		//console.log(docs);
		var changes = false;
		children.each(function(childItem){
			var memberKey = getBaseName(childItem.getPath());
			var vDesc = null;
			if(docs[memberKey]){
				changes = true;
				var meta = childItem.getMetadata();
				var crtLabel = childItem._label;
				if(docs[memberKey].main){
					crtLabel = crtLabel.replace("<span", '<span title="'+docs[memberKey].main.replace(/"/g, '\'')+'"');
				}
				if(docs[memberKey].keywords){
					if(docs[memberKey].keywords["returns"]){
						crtLabel = '<span class="jsapi_jdoc_return">'+docs[memberKey].keywords["returns"]+'</span> ' + crtLabel; 
					}else if(crtLabel.indexOf("(")>0){
						// Its a function, no return : add void
						crtLabel = '<span class="jsapi_jdoc_return">void</span> ' + crtLabel;
					}
					if(docs[memberKey].keywords["var"]){
						var vDoc = docs[memberKey].keywords["var"];
						vType = vDoc.split(" ")[0];
						vDesc = vDoc.substring(vType.length + 1);
						crtLabel = '<span class="jsapi_jdoc_var">'+vType+'</span> ' + crtLabel.replace("<span", '<span title="'+vDesc.replace(/"/g, '\'')+'"'); 
					}
					if(docs[memberKey].keywords["param"]){
						//console.log(docs[memberKey].keywords["param"]);
						var newArgs = $A();
						$A(meta.get("argumentNames")).each(function(arg){							
							if(docs[memberKey].keywords["param"][arg]){
								pValue = docs[memberKey].keywords["param"][arg];
								pType = (pValue.split(" ").length ? pValue.split(" ")[0].strip() : '');
								pDesc = pValue.substring(pType.length+1).replace(/"/g, '\'');
								arg = '<span class="jsapi_jdoc_param">'+pType+'</span> <span title="'+pDesc+'">'+arg+'</span>';
							}
							newArgs.push(arg);
						});
						crtLabel = crtLabel.replace('('+meta.get("argumentNames").join(', ')+')', '('+newArgs.join(', ')+')');
					}
				}
				if(docs[memberKey].main || vDesc){
					vDesc = vDesc ? vDesc : docs[memberKey].main; 
					crtLabel = crtLabel + '<span class="jsapi_commentfull">'+vDesc+'</span>';
				}
				
				childItem._label = crtLabel;
				meta.set("text", crtLabel);
			}
		});
		if(docs["Class"] || docs["Interface"]){
			var type = (docs["Class"] ? 'Class' : 'Interface');
			var comm = docs[type].main;
			if(comm.length > 200){
				comm = comm.substring(0, 200)+'...';
			}
			var label = "<span class='jsapi_member'>"+type+" "+getBaseName(item.getPath())+"</span> - <span class='jsapi_maindoc'>"+comm+"</span>";
			var icon = "jsapi_image/"+type.toLowerCase()+".png";
			var metadata = {
				"text": label;
				"icon": icon;
				"API_OBJECT_NODE": true
			}
			var child = new Item(item.getPath(), {
					"isLeaf": true,
					"label": label,
					"icon": icon,
					"metadata": metadata
			}, this); // Keep the same provider!

			// ADD MANUALLY AT THE TOP
			child.setParent(item);
			item._children.unshift(child);
			item.notify("child_added", child.getPath());

			changes = true;
		}
		if(changes){
			var fList = $A(app.guiCompRegistry).detect(function(object){
				return (object.__className == "FilesList");
			});
			if(fList) fList.reload();			
		}
	},
	
	parseJavadocs : function(content){
		var reg = new RegExp(/\/\*\*(([^�*]|\*(?!\/))*)\*\/([\n\r\s\w]*|[\n\r\s]Class|[\n\r\s]Interface)/gi);
		var keywords = $A(["param", "returns", "var"]);
		var res = reg.exec(content);
		var docs = {};
		while(res != null){
			var comment = res[1];
			var key = res[3].strip();
			var parsedDoc = {main : '', keywords:{}};
			$A(comment.split("@")).each(function(el){
				el = el.replace(/\*/g, "");
				el = el.strip(el);
				var isKW = false;
				keywords.each(function(kw){
					if(el.indexOf(kw+" ") === 0){
						if(kw == "param"){
							if(!parsedDoc.keywords[kw]) parsedDoc.keywords[kw] = {};
							var kwCont = el.substring(kw.length+1);
							var paramName = kwCont.split(" ")[0];
							parsedDoc.keywords[kw][paramName] = kwCont.substring(paramName.length+1);
						}else if(kw == "returns"){
							parsedDoc.keywords[kw] = el.substring(kw.length+1);
						}else if(kw == "var"){
							parsedDoc.keywords[kw] = el.substring(kw.length+1);
						}
						isKW = true;
					}
				});
				if(!isKW){
					parsedDoc.main += el;
				}
			});
			docs[key] = parsedDoc;
			res = reg.exec(content);
		}
		return docs;
	}	
	
});