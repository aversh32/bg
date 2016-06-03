module.exports = {
    //recreate: true,
    table: {
        curllog: {
            name: 'curllog',
            fields: {
                lid: {type: 'bigserial', primary: true},
                url: {type: 'text'},
                data: {type: 'text'},
                result: {type: 'text'},
                code: {type: 'varchar(36)'},
                createDate: { type: 'timestamp', index: true}
            }
        }
    }
};