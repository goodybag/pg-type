var pg      = require('pg');
var queries = require('./queries');

module.exports = function( connString ){
  return Object.create({
    query: function( query, callback ){
      pg.connect( connString, function( error, client, done ){
        client.query( query, function( error, result ){
          done();

          if ( error ) return callback( error );

          return callback( null, result.rows );
        });
      });
    }

  , typeExists: function( typeName, callback ){
      this.query( queries.typeExists({ name: typeName }), function( error, results ){
        if ( error ) return callback( error );

        return callback( null, results[0] ? results[0].exists : false );
      });
    }

  , getExistingValues: function( typeName, callback ){
      this.query( queries.existingValues({ name: typeName }), function( error, results ){
        if ( error ) return callback( error );

        return callback( null, results.map( function( r ){
          return r.unnest;
        }));
      });
    }

  , addValueToType: function( typeName, value, callback ){
      this.query( queries.addValueToType({ name: typeName, value: value }), callback );
    }
  });
};