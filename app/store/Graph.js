var neo4j = require('neo4j');

Class.create("StoreGraph", {
  /**
   * @param uniq Array column names to be uniq
   */
  initialize : function(p){
    var url = p.url || 'http://localhost:7474';
    this._uniqColumns = [];
    this._db = new neo4j.GraphDatabase(url);
  },

  //TODO create index by type 
  setUniq : function(uniq){
    var names = this._uniqColumns;
    if (Object.isArray(uniq)){
      this._uniqColumns = $A(names.concat(uniq)).compact();
    } else{
      this._uniqColumns.push(uniq);
    }
  },

  /**
   * @param type String model name
   * @param id Number
   */
  findById : function(onFind, id){
    this._db.getNodeById(id, function (err, record){
      if (!err && !record) err = "Not Found";
      if (record) record = record.data;
      onFind(record, err);
    });
  },

  /**
   * TODO retrieves Item with all its relationships
   * @param type String Item type (model name)
   * @param key String property name
   * @param value String value to search records by
   * @returns Json record
   */
  find : function(onFind, type, key, value){
    if (!key || key == "id") return this.findById(onFind, value);

    //TODO indexing
    if (false){//this._uniqColumns.include(key)){
      this._db.getIndexedNode(type, key, value, function (err, record){
        if (!err && !record) err = "Not Found";
        var data;
        if (record){
          data = record.data;
          data.id = record.id;
        }
        onFind(data, err);
      })
    } else {
      var query = [
        "START x=node(*)",
        "WHERE x.type! = 'TYPE'",
        "AND x.KEY! = 'VALUE'",
        "RETURN x"
      ]
      // Default type is not stored
      if (!type) query = query.without(query[1]);
      query = query.join('\n')
        .replace('TYPE', type)
        .replace('KEY', key)
        .replace('VALUE', value)
      logger.debug(query);
      this._db.query(query, function(err, array){
        if (err) return onFind(null, err)
        //TODO return array of results
        var record = array[0];
        if (!err && !record) err = "Not Found";
        var data;
        if (record){
          data = record.x.data;
          data.id = record.x.id;
        }
        onFind(data, err);
      })
    }
  },

  /**
   * Create, Update & Delete
   * @param diff Object with data to save into the record
   * @param name String record name to be updated
   * @returns Json difference in record between previous and current
   */
  save : function(onSave, type, name, diff){
    var db = this._db;
    if (diff){
      var onFind = function(err, node){
        if (err) return onSave(null, err);
        // Update
        if (node){
          var data = {};
          $H(diff).keys().each(function(key){
            if (Object.isString(diff[key])) data[key] = diff[key];
          })
          Object.extend(node.data, data)
          var cb = function(err){
            onSave(diff, err)
          }
          node.save(cb);
        }
        // Create
        else {
          console.log('CREATE');
          //diff.name = name;
          //var node = db.createNode(data);
          //node.save(function (err) {
            //if (err) return onSave(null, err);
            //node.index(type, 'name', name, function (err) {
              //if (err) return onSave(null, err);
              //onSave(diff);
            //});
          //});
        }
      }
      this._db.getIndexedNode(type, 'name', name, onFind);
    }
    // Remove
    else{
      //TODO
    }
    return diff;
  },

  //TODO consider depth param
  /**
   * @returns Array of Nodes
   */
  getLinked : function(onFind, id, depth){
    var query = [
      "START n=node(ID)",
      "MATCH n-->(end)",
      "RETURN end"
    ].join('\n').replace('ID', id)

    this._db.query(query, function(err, array){
      if (err || !array[0]){
        return onFind(null);
      }
      var children = array.map(function(row){
        return row.end.data;
      })
      onFind(children);
    })
  }
})
