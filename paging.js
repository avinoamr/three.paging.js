(function() {

    //
    // object: the camera or other 3D object to attach to (THREE.Object3D)
    // size: the size of each page cube (Number)
    // distance: the distance from the object to create pages (THREE.Vector3)
    // options: the `add` and `remove` callbacks to (Object)
    var Paging = function( object, size, distance, options ) {
        options || ( options = {} );

        if ( "number" == typeof size  ) {
            size = new THREE.Vector3( size, size, size );
        }

        this.object = object;
        this.distance = distance;
        this.size = size;
        this.halfsize = new THREE.Vector3().copy( size ).multiplyScalar( .5 );
        this.position = null;
        this.add = ( options.add ) || function() {};
        this.remove = ( options.remove ) || function() {};
        this.pages = []; // page boxes currently in distance from object

        //
        this._boxes = [];
        this._vs = [];
        this._pagesmap = {};
        this.look = new THREE.Vector3();
        this.look.x = Math.ceil( distance.x / size.x );
        this.look.y = Math.ceil( distance.y / size.y );
        this.look.z = Math.ceil( distance.z / size.z );
        console.log( size instanceof Number );
    };

    //
    Paging.prototype = Object.create( Object.prototype );

    //
    Paging.prototype.boxes = function() {
        // start with the current page
        var position = this.object.position,
            xpage = Math.floor( ( position.x + this.halfsize.x ) / this.size.x ),
            ypage = Math.floor( ( position.y + this.halfsize.y ) / this.size.y ),
            zpage = Math.floor( ( position.z + this.halfsize.z ) / this.size.z );

        // build the center vectors of the pages
        var boxes = [], i = 0;
        for ( var x = -this.look.x ; x <= this.look.x ; x += 1 ) {
            for ( var y = -this.look.y ; y <= this.look.y ; y += 1 ) {
                for ( var z = -this.look.z ; z <= this.look.z ; z += 1 ) {

                    var xcenter = this.size.x * ( xpage + x ),
                        ycenter = this.size.y * ( ypage + y ),
                        zcenter = this.size.z * ( zpage + z ),
                        center = new THREE.Vector3( xcenter, ycenter, zcenter ),
                        hash = [ center.x, center.y, center.z ].join( "," ),
                        box = new THREE.Box3();

                    box.setFromCenterAndSize( center, this.size );
                    box._distance = center.distanceTo( position );
                    box._center = center;
                    box._hash = hash;
                    boxes.push( box );

                    i += 1;
                }
            }
        }

        // sort the centers by distance to add the first pages first
        boxes.sort( function( a, b ) {
            if ( a._distance == b._distance ) return 0;
            else return ( a._distance < b._distance ) ? -1 : 1;
        } );

        //
        return boxes;
    };

    //
    Paging.prototype.update = function() {
        // don't update if the position wasn't changed
        var position = this.object.position;
        if ( this.position ) {
            var d = new THREE.Vector3().subVectors( position, this.position );
            if ( Math.abs( d.x ) < this.halfsize.x && 
                 Math.abs( d.y ) < this.halfsize.y &&
                 Math.abs( d.z ) < this.halfsize.z ) {
                return;
            }
        }

        // get the camera boxes
        var boxes = this.boxes();

        // boxes to add
        var _pagesmap = {};
        for ( var b = 0 ; b < boxes.length ; b += 1 ) {
            if ( !this._pagesmap[ boxes[ b ]._hash ] ) {
                this.add( boxes[ b ] );
            }

            _pagesmap[ boxes[ b ]._hash ] = boxes[ b ];
        }

        // boxes to remove
        for ( var hash in this._pagesmap ) {
            if ( !_pagesmap[ hash ] ) {
                this.remove( this._pagesmap[ hash ] );
            }
        }

        this._pagesmap = _pagesmap;
        this.pages = boxes;

        this.position || ( this.position = new THREE.Vector3() );
        this.position.copy( position );
    };

    //
    window.Paging = Paging;

}());