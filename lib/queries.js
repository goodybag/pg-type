module.exports = {
  types: {
    enum: function( data ){
      return [
        'create type "' + data.name + '" as enum('
      , '  \'' + data.enum.join("', '") + '\''
      , ');'
      ].join('\n');
    }

  , domain: function( data ){
      return 'create domain "' + data.name + '" as ' + data.as;
    }
  }

, typeExists: function( data ){
    return 'select exists ( select 1 from pg_type where typname = \'' + data.name + '\' );';
  }

, existingValues: function( data ){
    return 'select unnest( enum_range( NULL::"' + data.name + '" ) );';
  }

, addValueToType: function( data ){
    return 'alter type "' + data.name + '" add value \'' + data.value + '\'';
  }
};