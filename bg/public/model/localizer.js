Z.localize = function( text ){
    return Z.locale[text] || 'No localization for `'+ text +'`';
};