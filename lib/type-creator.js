var _       = require('lodash');
var async   = require('async');
var DB      = require('./db');
var queries = require('./queries');

module.exports = function( options ){
  options = _.defaults( options || {}, {
    types: {}
  });

  return Object.create({
    options: options

    /**
     * Gets or sets the connString
     * @param  {String} connString PG connection string
     * @return {Mixed}             ConnString or `this`
     */
  , connString: function( connString ){
      if ( !connString ) return this.options.connString;

      this.options.connString = connString;
      return this;
    }

    /**
     * Gets or adds new types to be created
     * @param  {Object} types The types to be added
     * @return {Mixed}        The types or `this`
     */
  , types: function( types ){
      if ( !types ) return this.options.types;

      _.extend( this.options.types, types );

      return this;
    }

    /**
     * Creates the types on the instance only if they need to be created.
     * If an enum type has changed since the last time `create` was called,
     * then update the existing enum types with the new values
     * @param  {Function} callback When type creation has completed
     * @return {Object}            `this` instance
     */
  , create: function( callback ){
      if ( !this.options.connString ){
        throw new Error('Must provide postgres `connString`');
      }

      var results = {};
      var cTypes  = this.options.types;
      var db      = DB( this.options.connString );

      Object.keys( cTypes )
        .filter( function( k ){
          return typeof cTypes[ k ] === 'object' && !Array.isArray( cTypes[ k ] );
        })
        .forEach( function( k ){
          if ( !( cTypes[ k ].type in queries.types ) ){
            throw new Error('Create Types does not support type: `' + cTypes[ k ].type + '`');
          }
        });

      async.auto({
        'existing_enums': [ function( done ){
          var onFilter = function( t, done ){
            // Only enums are arrays
            if ( !Array.isArray( cTypes[ t ] ) ) return done( false );

            db.typeExists( t, function( error, result ){
              if ( error ) done( false );
              else done( result );
            });
          };

          async.filter( Object.keys( cTypes ), onFilter, done.bind( null, null ) );
        }]

        // Get the exiting values for the types
      , 'existing_values': [ 'existing_enums', function( done, results ){
          var values = {};

          results.existing_enums.forEach( function( t ){
            values[ t ] = db.getExistingValues.bind( db, t );
          });

          async.parallel( values, done );
        }]

        // Add the values that don't exist in the DB
      , 'add_values': [ 'existing_values', function( done, results ){
          var typesWithChanges = Object.keys( results.existing_values ).filter( function( k ){
            return _.difference( cTypes[ k ], results.existing_values[ k ] ).length > 0;
          });

          // Only add the new values in cTypes
          var fns = {};

          typesWithChanges.forEach( function( k ){
            var types = _.difference(
              cTypes[ k ], results.existing_values[ k ]
            ).filter( function( v ){
              return cTypes[ k ].indexOf( v ) > -1;
            });

            fns[ k ] = async.each.bind( async, types, db.addValueToType.bind( db, k ) );
            return ;
          });

          async.parallel( fns, done );
        }]

        // Get the types that have not been added to the DB
      , 'new_types': [ function( done ){
          var onFilter = function( t, cb ){
            db.typeExists( t, function( error, result ){
              if ( error ) cb( false );
              else cb( result );
            });
          };

          async.filter( Object.keys( cTypes ), onFilter, function( types ){
            return done( null, _.omit( cTypes, types ) );
          });
        }]

        // Create new types
      , 'create_new_types': [ 'new_types', function( done, results ){
          var typeQueries = Object.keys( results.new_types ).map( function( k ){
            var def = {
              type: Array.isArray( results.new_types[ k ] ) ? 'enum' : results.new_types[ k ].type
            , name: k
            };

            if ( def.type === 'enum' ) def.enum = results.new_types[ k ];
            else def.as = results.new_types[ k ].as;

            return def;
          }).map( function( type ){
            return queries.types[ type.type ]( type );
          });

          async.each( typeQueries, db.query.bind( db ), done );
        }]
      }, function( error ){
        callback( error, results );
      });

      return this;
    }
  });
};