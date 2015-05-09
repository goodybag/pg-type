# PG Type

> Dynamically adds new types to the database and adds new values to _existing_ enums

__install__

```
npm install -S pg-type
```

__usage__

```javascript
require('pg-type')()
  .connString('postgres://localhost/mydb')
  .types({
    some_enum_type:   ['val_1', 'val_2', 'val_3']
  , some_other_type:  { type: 'domain', as: 'int check ( value < 100 )' }
  })
  .create( function( error, results ){
    /* Types added/modified! */
  })
```

Then later on you end up modifying your apps types:

```javascript
require('pg-type')()
  .connString('postgres://localhost/mydb')
  .types({
    some_enum_type:   ['val_1', 'val_2', 'val_3', 'val_4', 'val_5']
  , some_other_type:  { type: 'domain', as: 'int check ( value < 100 )' }
  , some_other_type2: { type: 'domain', as: 'int check ( value > 200 )' }
  })
  .create( function( error, results ){
    /* Types added/modified! */
  })
```

pgtype will modify your enums (never drops) and add new types.

## API

### Root Namespace

#### `require('pg-type') -> Function`

Pg Type creator factory

### TypeCreator

#### `.connString([str]) -> String|This`

Gets or sets the connection string

#### `.types([types]) -> String|This`

Gets or mixes in types

#### `.create(callback) -> This`

Creates new types/enums and checks to see if enums need to be modified.

__Will not remove enum values__ so you'll still need to use something like [pg-delta](https://github.com/goodybag/pg-delta) for that.