var assert  = require('assert');
var async   = require('async');
var _       = require('lodash');
var pgtypes = require('../');
var pg      = require('pg');

var CONNSTR = 'postgres://localhost:5432/pgtypes_test';

var db = pgtypes.db( CONNSTR );

// Destroy/Create DB
before( function( done ){
  var releaseClient;

  async.waterfall([
    pg.connect.bind( pg, 'postgres://localhost:5432/postgres' )

  , function( client, _releaseClient, next ){
      releaseClient = _releaseClient;
      next( null, client );
    }

  , function( client, next ){
      client.query( 'drop database if exists pgtypes_test', function( error ){
        return next( error, client );
      });
    }

  , function( client, next ){
      client.query( 'create database pgtypes_test', function( error ){
        return next( error, client );
      });
    }
  ], function( error ){
    releaseClient();

    done( error );
  });
});

describe('PgType', function(){
  it('should create new types', function( done ){
    async.series([
      // Create our initial enums
      function( next ){
        pgtypes({ connString: CONNSTR })
          .types({
            an_enum_type: ['a', 'b', 'c']
          })
          .create( function( error ){
            assert( !error );
            next();
          });
      }

      // Ensure the damn thing exists
    , function( next ){
        db.typeExists( 'an_enum_type', function( error, result ){
          assert( !error );
          assert( result );
          next();
        });
      }

      // Make sure the enum values in the DB are what we declared
    , function( next ){
        db.getExistingValues( 'an_enum_type', function( error, result ){
          assert( !error );
          assert.equal( _.difference( result, ['a', 'b', 'c'] ).length, 0 );
          next();
        });
      }
    ], done );
  });

  it('should add to existing enum_types', function( done ){
    async.series([
      // Create our initial enums
      function( next ){
        pgtypes({ connString: CONNSTR })
          .types({
            another_enum_type: ['a', 'b', 'c']
          })
          .create( function( error ){
            assert( !error );
            next();
          });
      }

      // Ensure the damn thing exists
    , function( next ){
        db.typeExists( 'another_enum_type', function( error, result ){
          assert( !error );
          assert( result );
          next();
        });
      }

      // Make sure the enum values in the DB are what we declared
    , function( next ){
        db.getExistingValues( 'another_enum_type', function( error, result ){
          assert( !error );
          assert.equal( _.difference( result, ['a', 'b', 'c'] ).length, 0 );
          next();
        });
      }

      // Create types again, this time changing the enums
    , function( next ){
        pgtypes({ connString: CONNSTR })
          .types({
            another_enum_type: ['a', 'b', 'c', 'd', 'e']
          })
          .create( function( error ){
            assert( !error );
            next();
          });
      }

      // Make sure the enum values in the DB are what we declared
    , function( next ){
        db.getExistingValues( 'another_enum_type', function( error, result ){
          assert( !error );
          assert.equal( _.difference( result, ['a', 'b', 'c', 'd', 'e'] ).length, 0 );
          next();
        });
      }
    ], done );
  });

  it('should create a new domain', function( done ){
    async.series([
      // Create our initial enums
      function( next ){
        pgtypes({ connString: CONNSTR })
          .types({
            some_domain_type: { type: 'domain', as: 'int check ( value < 100 )' }
          })
          .create( function( error ){
            assert( !error );
            next();
          });
      }

      // Ensure the damn thing exists
    , function( next ){
        db.typeExists( 'some_domain_type', function( error, result ){
          assert( !error );
          assert( result );
          next();
        });
      }
    ], done );
  });
});