/**
 * Created by Ivan on 3/5/2015.
 */
window.bg = window.Z = {
    user: function (data) {
        if( data !== void 0 )
            Z.user.data = data;
        return Z.user.data || false;
    }
};